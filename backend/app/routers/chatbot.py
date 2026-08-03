from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Conversacion, MensajeChat
from app.schemas.chatbot import (
    ChatRequest, ChatResponse, ConversacionOut, 
    ConversacionDetalleOut
)
from app.services.ai_service import ChatService

router = APIRouter(prefix="/api/chatbot", tags=["Chat Médico IA"])
chat_service = ChatService()

@router.post("/mensaje", response_model=ChatResponse)
def enviar_mensaje(req: ChatRequest, db: Session = Depends(get_db)):

    if req.conversacion_id:
        conv = db.query(Conversacion).filter(Conversacion.id == req.conversacion_id).first()
        if not conv:
            raise HTTPException(404, "Conversación no encontrada")
    else:
        # Título preliminar basado en el primer mensaje
        titulo = req.mensaje[:30] + "..." if len(req.mensaje) > 30 else req.mensaje
        conv = Conversacion(usuario_id=req.usuario_id, titulo=titulo)
        db.add(conv)
        db.commit()
        db.refresh(conv)


    if req.usuario_id and not conv.usuario_id:
        conv.usuario_id = req.usuario_id
        db.commit()


    mensajes_previos = (
        db.query(MensajeChat)
        .filter(MensajeChat.conversacion_id == conv.id)
        .order_by(MensajeChat.fecha_envio.asc())
        .all()
    )
    historial_ia = [{"role": m.role, "content": m.contenido} for m in mensajes_previos]


    respuesta_ia, tokens_usados = chat_service.responder(req.mensaje, historial_ia, db=db, usuario_id=conv.usuario_id, imagen=req.imagen)


    msg_user = MensajeChat(conversacion_id=conv.id, role="user", contenido=req.mensaje, imagen=req.imagen, tokens=0)
    msg_bot = MensajeChat(conversacion_id=conv.id, role="assistant", contenido=respuesta_ia, tokens=tokens_usados)
    
    db.add(msg_user)
    db.add(msg_bot)
    db.commit()

    return {
        "respuesta": respuesta_ia,
        "conversacion_id": conv.id,
        "usuario_id": conv.usuario_id
    }

@router.get("/conversaciones", response_model=List[ConversacionOut])
def listar_conversaciones(usuario_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Conversacion)
    if usuario_id:
        q = q.filter(Conversacion.usuario_id == usuario_id)
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
