from typing import Optional
from pydantic import BaseModel, ConfigDict


class MedicoBase(BaseModel):
    cmp: str
    especialidad: str
    telefono: Optional[str] = None
    horario: Optional[str] = None


class MedicoCreate(MedicoBase):
    usuario_id: int


class MedicoUpdate(BaseModel):
    especialidad: Optional[str] = None
    telefono: Optional[str] = None
    horario: Optional[str] = None


class MedicoOut(MedicoBase):
    id: int
    usuario_id: int

    model_config = ConfigDict(from_attributes=True)
