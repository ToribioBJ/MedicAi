from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import HistorialClinico, MedicamentoRecetado, Paciente, Medico
from app.schemas.historial import HistorialCreate, HistorialUpdate, HistorialOut

router = APIRouter(prefix="/api/historial", tags=["Historial Clínico"])


@router.get("/", response_model=List[HistorialOut])
def listar(
    db: Session = Depends(get_db),
    paciente_id: Optional[int] = None,
    limit: int = 50,
):
    q = db.query(HistorialClinico)
    if paciente_id:
        q = q.filter(HistorialClinico.paciente_id == paciente_id)
    return q.order_by(HistorialClinico.fecha.desc()).limit(limit).all()


@router.get("/{historial_id}", response_model=HistorialOut)
def obtener(historial_id: int, db: Session = Depends(get_db)):
    h = db.query(HistorialClinico).filter(HistorialClinico.id == historial_id).first()
    if not h:
        raise HTTPException(404, "Registro no encontrado")
    return h


@router.post("/", response_model=HistorialOut, status_code=201)
def crear(data: HistorialCreate, db: Session = Depends(get_db)):
    if not db.query(Paciente).filter(Paciente.id == data.paciente_id).first():
        raise HTTPException(400, "Paciente no existe")
    if not db.query(Medico).filter(Medico.id == data.medico_id).first():
        raise HTTPException(400, "Médico no existe")

    payload = data.model_dump(exclude={"medicamentos"})
    h = HistorialClinico(**payload)
    db.add(h); db.flush()

    for med in (data.medicamentos or []):
        db.add(MedicamentoRecetado(historial_id=h.id, **med.model_dump()))

    db.commit(); db.refresh(h)
    return h


@router.put("/{historial_id}", response_model=HistorialOut)
def actualizar(historial_id: int, data: HistorialUpdate, db: Session = Depends(get_db)):
    h = db.query(HistorialClinico).filter(HistorialClinico.id == historial_id).first()
    if not h:
        raise HTTPException(404, "Registro no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(h, k, v)
    db.commit(); db.refresh(h)
    return h


@router.delete("/{historial_id}", status_code=204)
def eliminar(historial_id: int, db: Session = Depends(get_db)):
    h = db.query(HistorialClinico).filter(HistorialClinico.id == historial_id).first()
    if not h:
        raise HTTPException(404, "Registro no encontrado")
    db.delete(h); db.commit()
