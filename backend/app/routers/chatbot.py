from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Conversacion, MensajeChat
from app.schemas.chatbot import (
    ChatRequest, ChatResponse, ConversacionOut, 
    ConversacionDetalleOut, MensajeOut
)
from app.services.ai_service import ChatService, construir_contexto_paciente

router = APIRouter(prefix="/api/chatbot", tags=["Chat Médico IA"])
chat_service = ChatService()

@router.post("/mensaje", response_model=ChatResponse)
def enviar_mensaje(req: ChatRequest, db: Session = Depends(get_db)):
    # 1. Asegurar o crear conversación
    if req.conversacion_id:
        conv = db.query(Conversacion).filter(Conversacion.id == req.conversacion_id).first()
        if not conv:
            raise HTTPException(404, "Conversación no encontrada")
    else:
        # Título preliminar basado en el primer mensaje
        titulo = req.mensaje[:30] + "..." if len(req.mensaje) > 30 else req.mensaje
        conv = Conversacion(paciente_id=req.paciente_id, titulo=titulo)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 2. Si hay paciente_id en la conversación o en el request, actualizarlo
    if req.paciente_id and not conv.paciente_id:
        conv.paciente_id = req.paciente_id
        db.commit()

    # 3. Obtener historial previo para la IA
    mensajes_previos = (
        db.query(MensajeChat)
        .filter(MensajeChat.conversacion_id == conv.id)
        .order_by(MensajeChat.fecha_envio.asc())
        .all()
    )
    historial_ia = [{"role": m.role, "content": m.contenido} for m in mensajes_previos]

    # 4. Obtener contexto clínico del paciente
    contexto = ""
    if conv.paciente_id:
        contexto = construir_contexto_paciente(db, conv.paciente_id)

    # 5. Generar respuesta con IA
    respuesta_ia = chat_service.responder(req.mensaje, historial_ia, contexto)

    # 6. Guardar mensaje del usuario y del asistente
    msg_user = MensajeChat(conversacion_id=conv.id, role="user", contenido=req.mensaje)
    msg_bot = MensajeChat(conversacion_id=conv.id, role="assistant", contenido=respuesta_ia)
    
    db.add(msg_user)
    db.add(msg_bot)
    db.commit()

    return {
        "respuesta": respuesta_ia,
        "conversacion_id": conv.id,
        "paciente_id": conv.paciente_id
    }

@router.get("/conversaciones", response_model=List[ConversacionOut])
def listar_conversaciones(paciente_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Conversacion)
    if paciente_id:
        q = q.filter(Conversacion.paciente_id == paciente_id)
    return q.order_by(Conversacion.fecha_creacion.desc()).all()

@router.get("/conversaciones/{conv_id}", response_model=ConversacionDetalleOut)
def obtener_detalle(conv_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversacion).filter(Conversacion.id == conv_id).first()
    if not conv:
        raise HTTPException(404, "Conversación no encontrada")
    return conv

@router.delete("/conversaciones/{conv_id}", status_code=204)
def eliminar_conversacion(conv_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversacion).filter(Conversacion.id == conv_id).first()
    if not conv:
        raise HTTPException(404, "Conversación no encontrada")
    db.delete(conv)
    db.commit()
