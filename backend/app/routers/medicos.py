from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Medico, Usuario
from app.schemas.medico import MedicoCreate, MedicoUpdate, MedicoOut

router = APIRouter(prefix="/api/medicos", tags=["Médicos"])


@router.get("/", response_model=List[MedicoOut])
def listar(db: Session = Depends(get_db)):
    return db.query(Medico).all()


@router.get("/{medico_id}", response_model=MedicoOut)
def obtener(medico_id: int, db: Session = Depends(get_db)):
    m = db.query(Medico).filter(Medico.id == medico_id).first()
    if not m:
        raise HTTPException(404, "Médico no encontrado")
    return m


@router.post("/", response_model=MedicoOut, status_code=201)
def crear(data: MedicoCreate, db: Session = Depends(get_db)):
    if not db.query(Usuario).filter(Usuario.id == data.usuario_id).first():
        raise HTTPException(400, "Usuario no existe")
    if db.query(Medico).filter(Medico.usuario_id == data.usuario_id).first():
        raise HTTPException(400, "El usuario ya tiene un perfil médico")
    if db.query(Medico).filter(Medico.cmp == data.cmp).first():
        raise HTTPException(400, "CMP ya registrado")
    m = Medico(**data.model_dump())
    db.add(m); db.commit(); db.refresh(m)
    return m


@router.put("/{medico_id}", response_model=MedicoOut)
def actualizar(medico_id: int, data: MedicoUpdate, db: Session = Depends(get_db)):
    m = db.query(Medico).filter(Medico.id == medico_id).first()
    if not m:
        raise HTTPException(404, "Médico no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    db.commit(); db.refresh(m)
    return m


@router.delete("/{medico_id}", status_code=204)
def eliminar(medico_id: int, db: Session = Depends(get_db)):
    m = db.query(Medico).filter(Medico.id == medico_id).first()
    if not m:
        raise HTTPException(404, "Médico no encontrado")
    db.delete(m); db.commit()
