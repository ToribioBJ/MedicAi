import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.models.models import Usuario
from app.core.security import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, hash_password
from app.services.email_service import enviar_correo_recuperacion
from app.routers.usuarios import validar_contrasena_segura


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    nombre: str
    role: str
    email: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.activo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tu cuenta está desactivada")

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Por favor, verifica tu dirección de correo electrónico antes de iniciar sesión."
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user.id,
        "nombre": user.nombre,
        "role": user.role,
        "email": user.email
    }


@router.get("/verify-email", status_code=200)
def verificar_correo(token: str, db: Session = Depends(get_db)):
    """
    Endpoint GET para confirmar la cuenta mediante el token recibido en el correo.
    """
    user = db.query(Usuario).filter(Usuario.verification_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de verificación no es válido o ya fue utilizado."
        )
        
    if user.verification_token_expiration < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de verificación ha expirado. Por favor, crea una nueva cuenta."
        )
        
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expiration = None
    db.commit()
    
    return {"message": "Cuenta verificada con éxito. Ya puedes iniciar sesión."}


@router.post("/forgot-password", status_code=200)
def solicitar_recuperacion(
    req: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Solicita un correo electrónico para restablecer la contraseña.
    """
    user = db.query(Usuario).filter(Usuario.email == req.email).first()
    if not user:
        # Por seguridad y UX, devolvemos éxito incluso si el email no existe,
        # pero en este caso es más claro informar al usuario.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró ninguna cuenta registrada con este correo electrónico."
        )
        
    # Generar token de recuperación
    reset_token = secrets.token_urlsafe(32)
    expiration = datetime.utcnow() + timedelta(hours=1)
    
    user.reset_password_token = reset_token
    user.reset_password_token_expiration = expiration
    db.commit()
    
    # Enviar correo en segundo plano
    background_tasks.add_task(
        enviar_correo_recuperacion,
        destinatario=user.email,
        nombre=user.nombre,
        token=reset_token
    )
    
    return {"message": "Se ha enviado un enlace de recuperación a tu correo electrónico."}


@router.post("/reset-password", status_code=200)
def restablecer_contrasena(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Actualiza la contraseña utilizando el token de recuperación.
    """
    user = db.query(Usuario).filter(Usuario.reset_password_token == req.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token de recuperación no es válido o ya fue utilizado."
        )
        
    if user.reset_password_token_expiration < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de recuperación ha expirado. Por favor, solicita uno nuevo."
        )
        
    # Validar que la contraseña cumpla los requisitos de seguridad
    error_pass = validar_contrasena_segura(req.new_password)
    if error_pass:
        raise HTTPException(status_code=400, detail=error_pass)
        
    # Hashear y actualizar contraseña
    user.password_hash = hash_password(req.new_password)
    user.reset_password_token = None
    user.reset_password_token_expiration = None
    db.commit()
    
    return {"message": "Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión."}


@router.post("/verify-code", response_model=Token)
def verificar_codigo(req: VerifyCodeRequest, db: Session = Depends(get_db)):
    """
    Endpoint POST para confirmar la cuenta mediante el código OTP de 6 dígitos
    e iniciar sesión de inmediato devolviendo el token de acceso.
    """
    user = db.query(Usuario).filter(Usuario.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró ninguna cuenta registrada con este correo electrónico."
        )

    if not user.email_verified:
        if not user.verification_token or user.verification_token != req.code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de verificación ingresado es incorrecto."
            )
            
        if user.verification_token_expiration < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El código de verificación ha expirado. Por favor, regístrate de nuevo."
            )
            
        # Confirmar cuenta
        user.email_verified = True
        user.verification_token = None
        user.verification_token_expiration = None
        db.commit()

    if not user.activo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tu cuenta está desactivada")

    # Iniciar sesión de inmediato devolviendo las credenciales
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user.id,
        "nombre": user.nombre,
        "role": user.role,
        "email": user.email
    }
