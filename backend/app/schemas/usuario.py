from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = None


class UsuarioOut(UsuarioBase):
    id: int
    activo: bool
    role: str
    email_verified: bool
    fecha_registro: datetime
    telegram_chat_id: Optional[str] = None
    cant_conversaciones: int = 0

    model_config = ConfigDict(from_attributes=True)
