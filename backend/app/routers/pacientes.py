from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models import Paciente
from app.schemas.paciente import PacienteCreate, PacienteUpdate, PacienteOut

router = APIRouter(prefix="/api/pacientes", tags=["Pacientes"])


@router.get("/", response_model=List[PacienteOut])
def listar(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None, description="Buscar por DNI, nombre o apellido"),
    skip: int = 0,
    limit: int = 100,
):
    query = db.query(Paciente).filter(Paciente.activo == True)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            Paciente.dni.like(like),
            Paciente.nombres.like(like),
            Paciente.apellidos.like(like),
        ))
    return query.offset(skip).limit(limit).all()


@router.get("/{paciente_id}", response_model=PacienteOut)
def obtener(paciente_id: int, db: Session = Depends(get_db)):
    p = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    return p


@router.post("/", response_model=PacienteOut, status_code=201)
def crear(data: PacienteCreate, db: Session = Depends(get_db)):
    if db.query(Paciente).filter(Paciente.dni == data.dni).first():
        raise HTTPException(400, "Ya existe un paciente con ese DNI")
    p = Paciente(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.put("/{paciente_id}", response_model=PacienteOut)
def actualizar(paciente_id: int, data: PacienteUpdate, db: Session = Depends(get_db)):
    p = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{paciente_id}", status_code=204)
def eliminar(paciente_id: int, db: Session = Depends(get_db)):
    p = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    p.activo = False  # soft delete
    db.commit()
