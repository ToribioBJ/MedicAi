from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str
    rol: str  # admin | medico | recepcion


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = None


class UsuarioOut(UsuarioBase):
    id: int
    activo: bool
    fecha_registro: datetime

    model_config = ConfigDict(from_attributes=True)
