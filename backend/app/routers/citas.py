from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Cita, Paciente, Medico
from app.schemas.cita import CitaCreate, CitaUpdate, CitaOut

router = APIRouter(prefix="/api/citas", tags=["Citas"])


@router.get("/", response_model=List[CitaOut])
def listar(
    db: Session = Depends(get_db),
    paciente_id: Optional[int] = None,
    medico_id: Optional[int] = None,
    estado: Optional[str] = None,
    desde: Optional[datetime] = Query(None),
    hasta: Optional[datetime] = Query(None),
):
    q = db.query(Cita)
    if paciente_id: q = q.filter(Cita.paciente_id == paciente_id)
    if medico_id:   q = q.filter(Cita.medico_id == medico_id)
    if estado:      q = q.filter(Cita.estado == estado)
    if desde:       q = q.filter(Cita.fecha_hora >= desde)
    if hasta:       q = q.filter(Cita.fecha_hora <= hasta)
    return q.order_by(Cita.fecha_hora).all()


@router.get("/{cita_id}", response_model=CitaOut)
def obtener(cita_id: int, db: Session = Depends(get_db)):
    c = db.query(Cita).filter(Cita.id == cita_id).first()
    if not c:
        raise HTTPException(404, "Cita no encontrada")
    return c


@router.post("/", response_model=CitaOut, status_code=201)
def crear(data: CitaCreate, db: Session = Depends(get_db)):
    if not db.query(Paciente).filter(Paciente.id == data.paciente_id).first():
        raise HTTPException(400, "Paciente no existe")
    if not db.query(Medico).filter(Medico.id == data.medico_id).first():
        raise HTTPException(400, "Médico no existe")
    c = Cita(**data.model_dump())
    db.add(c); db.commit(); db.refresh(c)
    return c


@router.put("/{cita_id}", response_model=CitaOut)
def actualizar(cita_id: int, data: CitaUpdate, db: Session = Depends(get_db)):
    c = db.query(Cita).filter(Cita.id == cita_id).first()
    if not c:
        raise HTTPException(404, "Cita no encontrada")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit(); db.refresh(c)
    return c


@router.delete("/{cita_id}", status_code=204)
def eliminar(cita_id: int, db: Session = Depends(get_db)):
    c = db.query(Cita).filter(Cita.id == cita_id).first()
    if not c:
        raise HTTPException(404, "Cita no encontrada")
    db.delete(c); db.commit()
