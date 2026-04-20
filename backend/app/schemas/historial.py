from datetime import datetime
from typing import Optional, Any, List
from pydantic import BaseModel, ConfigDict


class MedicamentoBase(BaseModel):
    nombre: str
    dosis: Optional[str] = None
    frecuencia: Optional[str] = None
    duracion_dias: Optional[int] = None
    indicaciones: Optional[str] = None


class MedicamentoCreate(MedicamentoBase):
    pass


class MedicamentoOut(MedicamentoBase):
    id: int
    historial_id: int
    model_config = ConfigDict(from_attributes=True)


class HistorialBase(BaseModel):
    paciente_id: int
    medico_id: int
    cita_id: Optional[int] = None
    sintomas: str
    diagnostico: str
    tratamiento: Optional[str] = None
    observaciones: Optional[str] = None
    signos_vitales: Optional[Any] = None


class HistorialCreate(HistorialBase):
    medicamentos: Optional[List[MedicamentoCreate]] = None


class HistorialUpdate(BaseModel):
    sintomas: Optional[str] = None
    diagnostico: Optional[str] = None
    tratamiento: Optional[str] = None
    observaciones: Optional[str] = None
    signos_vitales: Optional[Any] = None


class HistorialOut(HistorialBase):
    id: int
    fecha: datetime
    medicamentos: List[MedicamentoOut] = []

    model_config = ConfigDict(from_attributes=True)
