import re
import secrets
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, get_current_admin_user
from app.models import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioOut
from app.services.email_service import enviar_correo_verificacion

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


def validar_contrasena_segura(password: str) -> str:
    """
    Valida que la contraseña sea fuerte y segura.
    Retorna el mensaje de error correspondiente, o None si es correcta.
    """
    if len(password) < 8:
        return "La contraseña debe tener al menos 8 caracteres."
    if not re.search(r"[A-Z]", password):
        return "La contraseña debe contener al menos una letra mayúscula."
    if not re.search(r"[a-z]", password):
        return "La contraseña debe contener al menos una letra minúscula."
    if not re.search(r"\d", password):
        return "La contraseña debe contener al menos un número."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return "La contraseña debe contener al menos un carácter especial (ej. !@#$%)."
    return None


@router.get("/", response_model=List[UsuarioOut])
def listar(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user)
):
    """
    Lista todos los usuarios en el sistema. Protegido solo para administradores.
    """
    return db.query(Usuario).all()


@router.get("/{usuario_id}", response_model=UsuarioOut)
def obtener(usuario_id: int, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    return u


@router.post("/", response_model=UsuarioOut, status_code=201)
def crear(
    data: UsuarioCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Crea una cuenta de usuario inactiva y envía el código de verificación OTP de 6 dígitos.
    """
    # 1. Validación de correo duplicado
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(
            status_code=400,
            detail="Este correo electrónico ya se encuentra registrado."
        )

    # 2. Validación de contraseña segura
    error_pass = validar_contrasena_segura(data.password)
    if error_pass:
        raise HTTPException(status_code=400, detail=error_pass)

    # 3. Crear el código de verificación OTP de 6 dígitos (numérico)
    verification_code = f"{secrets.randbelow(1000000):06d}"
    expiration = datetime.utcnow() + timedelta(hours=24)

    # 4. Crear el registro en base de datos
    u = Usuario(
        email=data.email,
        nombre=data.nombre,
        password_hash=hash_password(data.password),
        role="usuario",  # rol por defecto
        email_verified=False,
        verification_token=verification_code,
        verification_token_expiration=expiration
    )
    
    db.add(u)
    db.commit()
    db.refresh(u)

    # 5. Desencadenar el envío del correo de verificación en segundo plano
    background_tasks.add_task(
        enviar_correo_verificacion,
        destinatario=u.email,
        nombre=u.nombre,
        codigo=verification_code
    )

    return u


@router.put("/{usuario_id}", response_model=UsuarioOut)
def actualizar(usuario_id: int, data: UsuarioUpdate, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    payload = data.model_dump(exclude_unset=True)
    if "password" in payload:
        error_pass = validar_contrasena_segura(payload["password"])
        if error_pass:
            raise HTTPException(status_code=400, detail=error_pass)
        u.password_hash = hash_password(payload.pop("password"))
    for k, v in payload.items():
        setattr(u, k, v)
    db.commit(); db.refresh(u)
    return u


@router.put("/{usuario_id}/role", response_model=UsuarioOut)
def cambiar_rol(
    usuario_id: int,
    nuevo_rol: str,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user)
):
    """
    Modifica el rol de un usuario en el sistema. Protegido solo para administradores.
    """
    if nuevo_rol not in ["usuario", "administrador"]:
        raise HTTPException(
            status_code=400,
            detail="Rol inválido. Debe ser 'usuario' o 'administrador'."
        )
        
    u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
        
    u.role = nuevo_rol
    db.commit()
    db.refresh(u)
    return u


@router.put("/{usuario_id}/status", response_model=UsuarioOut)
def cambiar_estado(
    usuario_id: int,
    activo: bool,
    db: Session = Depends(get_db),
    current_admin: Usuario = Depends(get_current_admin_user)
):
    """
    Activa o desactiva (bloquea) la cuenta de un usuario. Protegido solo para administradores.
    """
    u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
        
    if u.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="No puedes desactivar tu propia cuenta de administrador."
        )
        
    u.activo = activo
    db.commit()
    db.refresh(u)
    return u


@router.delete("/{usuario_id}", status_code=204)
def eliminar(usuario_id: int, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    u.activo = False
    db.commit()
