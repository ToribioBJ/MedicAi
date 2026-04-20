from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class PacienteBase(BaseModel):
    dni: str
    nombres: str
    apellidos: str
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    tipo_sangre: Optional[str] = None
    alergias: Optional[str] = None
    antecedentes: Optional[str] = None
    medicamentos_actuales: Optional[str] = None


class PacienteCreate(PacienteBase):
    pass


class PacienteUpdate(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    tipo_sangre: Optional[str] = None
    alergias: Optional[str] = None
    antecedentes: Optional[str] = None
    medicamentos_actuales: Optional[str] = None
    activo: Optional[bool] = None


class PacienteOut(PacienteBase):
    id: int
    activo: bool
    fecha_registro: datetime

    model_config = ConfigDict(from_attributes=True)
