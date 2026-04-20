from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict


class TriajeRequest(BaseModel):
    mensaje: str
    paciente_id: Optional[int] = None


class TriajeResponse(BaseModel):
    nivel: str
    resumen: str
    accion_sugerida: str
    especialidad_sugerida: Optional[str] = None
    sintomas_detectados: Optional[List[str]] = None
    id: Optional[int] = None


class TriajeOut(BaseModel):
    id: int
    paciente_id: Optional[int]
    mensaje_usuario: str
    nivel: str
    resumen: Optional[str]
    accion_sugerida: Optional[str]
    especialidad_sugerida: Optional[str]
    sintomas_detectados: Optional[Any]
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)
