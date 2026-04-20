from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CitaBase(BaseModel):
    paciente_id: int
    medico_id: int
    fecha_hora: datetime
    duracion_min: int = 30
    motivo: Optional[str] = None
    notas: Optional[str] = None


class CitaCreate(CitaBase):
    pass


class CitaUpdate(BaseModel):
    fecha_hora: Optional[datetime] = None
    duracion_min: Optional[int] = None
    motivo: Optional[str] = None
    estado: Optional[str] = None
    notas: Optional[str] = None


class CitaOut(CitaBase):
    id: int
    estado: str
    creada_en: datetime

    model_config = ConfigDict(from_attributes=True)
