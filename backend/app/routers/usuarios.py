from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.models import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioOut

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


@router.get("/", response_model=List[UsuarioOut])
def listar(db: Session = Depends(get_db)):
    return db.query(Usuario).all()


@router.get("/{usuario_id}", response_model=UsuarioOut)
def obtener(usuario_id: int, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    return u


@router.post("/", response_model=UsuarioOut, status_code=201)
def crear(data: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(400, "Email ya registrado")
    u = Usuario(
        email=data.email,
        nombre=data.nombre,
        rol=data.rol,
        password_hash=hash_password(data.password),
    )
    db.add(u); db.commit(); db.refresh(u)
    return u


@router.put("/{usuario_id}", response_model=UsuarioOut)
def actualizar(usuario_id: int, data: UsuarioUpdate, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    payload = data.model_dump(exclude_unset=True)
    if "password" in payload:
        u.password_hash = hash_password(payload.pop("password"))
    for k, v in payload.items():
        setattr(u, k, v)
    db.commit(); db.refresh(u)
    return u


@router.delete("/{usuario_id}", status_code=204)
def eliminar(usuario_id: int, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    u.activo = False
    db.commit()
