from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict

class MensajeBase(BaseModel):
    role: Literal["user", "assistant"]
    contenido: str
    imagen: Optional[str] = None

class MensajeCreate(MensajeBase):
    pass

class MensajeOut(MensajeBase):
    id: int
    fecha_envio: datetime
    model_config = ConfigDict(from_attributes=True)

class ConversacionBase(BaseModel):
    titulo: Optional[str] = "Nueva Consulta"
    usuario_id: Optional[int] = None

class ConversacionCreate(ConversacionBase):
    pass

class ConversacionOut(ConversacionBase):
    id: int
    fecha_creacion: datetime
    model_config = ConfigDict(from_attributes=True)

class ConversacionDetalleOut(ConversacionOut):
    mensajes: List[MensajeOut]

class ChatRequest(BaseModel):
    mensaje: str
    usuario_id: Optional[int] = None
    conversacion_id: Optional[int] = None
    imagen: Optional[str] = None

class ChatResponse(BaseModel):
    respuesta: str
    conversacion_id: int
    usuario_id: Optional[int] = None
