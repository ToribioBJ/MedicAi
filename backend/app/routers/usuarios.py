import re
import secrets
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
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


@router.get("/admin-insights")
def obtener_insights_admin(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user)
):
    """
    Genera un reporte analítico de la base de datos de usuarios utilizando IA (Groq).
    """
    total_users = db.query(Usuario).count()
    active_users = db.query(Usuario).filter(Usuario.activo == True).count()
    verified_users = db.query(Usuario).filter(Usuario.email_verified == True).count()
    admins = db.query(Usuario).filter(Usuario.role == "administrador").count()
    
    stats_summary = (
        f"Resumen de Usuarios en MedicAI:\n"
        f"- Total registrados: {total_users}\n"
        f"- Cuentas activas: {active_users}\n"
        f"- Cuentas inactivas o bloqueadas: {total_users - active_users}\n"
        f"- Correo verificado: {verified_users}\n"
        f"- Correo pendiente: {total_users - verified_users}\n"
        f"- Administradores: {admins}\n"
        f"- Pacientes/Usuarios normales: {total_users - admins}\n"
    )
    
    sys_prompt = (
        "Eres un analista de sistemas e inteligencia de seguridad de MedicAI.\n"
        "Debes analizar las estadísticas proporcionadas de la base de datos de usuarios y generar un reporte ejecutivo en español "
        "en formato Markdown limpio y sumamente profesional.\n\n"
        "El reporte debe estructurarse obligatoriamente con las siguientes secciones:\n"
        "1. ## Análisis de Salud del Sistema: Evaluación sobre la relación entre usuarios activos e inactivos.\n"
        "2. ## Estado de Verificación de Cuentas: Comentario analítico sobre la verificación por correo y posibles riesgos de spam.\n"
        "3. ## Distribución de Roles e Impacto en Seguridad: Comentar si la cantidad de administradores es segura y adecuada.\n"
        "4. ## Recomendaciones Clave: Lista de acciones preventivas o correctivas recomendadas.\n\n"
        "Mantén un tono profesional, claro y de alto nivel técnico."
    )
    
    try:
        from app.services.ai_service import client, MODEL
        if not client:
            return {"insights": "El servicio de IA de Groq no se encuentra configurado en este momento."}
            
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": f"Por favor genera el reporte basándote en las siguientes métricas del sistema:\n{stats_summary}"}
        ]
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=1000
        )
        report = response.choices[0].message.content
        return {
            "insights": report,
            "metrics": {
                "total": total_users,
                "activo": active_users,
                "verificado": verified_users,
                "administrador": admins
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar insights con IA: {str(e)}"
        )


@router.get("/health-status")
def obtener_estado_salud(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user)
):
    """
    Verifica la conectividad en tiempo real con la base de datos (MySQL), el servicio de IA (Groq) y el bot de Telegram.
    """
    import time
    import httpx
    
    health = {
        "database": {
            "status": "disconnected",
            "details": "",
            "latency_ms": 0
        },
        "groq": {
            "status": "disconnected",
            "details": "",
            "latency_ms": 0
        },
        "telegram": {
            "status": "disconnected",
            "details": "",
            "latency_ms": 0
        }
    }
    
    # 1. Probar base de datos MySQL
    try:
        from sqlalchemy import text
        start_time = time.time()
        db.execute(text("SELECT 1"))
        latency = int((time.time() - start_time) * 1000)
        health["database"]["status"] = "connected"
        health["database"]["details"] = "Conexión a base de datos MySQL activa."
        health["database"]["latency_ms"] = latency
    except Exception as e:
        health["database"]["status"] = "error"
        health["database"]["details"] = f"Falla al conectar con MySQL: {str(e)}"

    # 2. Probar API de Groq
    try:
        from app.services.ai_service import client, MODEL, VISION_MODEL
        if not client:
            health["groq"]["status"] = "disconnected"
            health["groq"]["details"] = "Clave CHATBOT_API_KEY no encontrada en variables de entorno."
        else:
            start_time = time.time()
            client.models.list()
            latency = int((time.time() - start_time) * 1000)
            health["groq"]["status"] = "connected"
            health["groq"]["details"] = f"API de Groq activa. Modelos: Text={MODEL} | Vision={VISION_MODEL}."
            health["groq"]["latency_ms"] = latency
    except Exception as e:
        health["groq"]["status"] = "error"
        health["groq"]["details"] = f"Error en la API de Groq: {str(e)}"

    # 3. Probar API de Telegram y estado local del bot
    try:
        import os
        token = os.getenv("TELEGRAM_BOT_TOKEN")
        if not token:
            health["telegram"]["status"] = "disconnected"
            health["telegram"]["details"] = "Clave TELEGRAM_BOT_TOKEN no encontrada en variables de entorno."
        else:
            start_time = time.time()
            url = f"https://api.telegram.org/bot{token}/getMe"
            with httpx.Client(timeout=3.0) as client_http:
                resp = client_http.get(url)
                latency = int((time.time() - start_time) * 1000)
                if resp.status_code == 200:
                    bot_data = resp.json().get("result", {})
                    username = bot_data.get("username", "MedicAI_Bot")
                    
                    # Verificar si el bot está corriendo localmente
                    import app.services.telegram_bot as tg_service
                    is_running = (
                        tg_service.telegram_app is not None 
                        and tg_service.telegram_app.updater is not None 
                        and tg_service.telegram_app.updater.running
                    )
                    status_local = "Activo" if is_running else "Inactivo (Proceso local detenido)"
                    
                    health["telegram"]["status"] = "connected" if is_running else "error"
                    health["telegram"]["details"] = f"Bot @{username} listo en servidores de Telegram. Estado local: {status_local}."
                    health["telegram"]["latency_ms"] = latency
                else:
                    health["telegram"]["status"] = "error"
                    health["telegram"]["details"] = f"Error de autenticación con Telegram (HTTP {resp.status_code})."
                    health["telegram"]["latency_ms"] = latency
    except Exception as e:
        health["telegram"]["status"] = "error"
        health["telegram"]["details"] = f"Error al verificar API de Telegram: {str(e)}"
        
    return health


@router.get("/telegram")
def listar_usuarios_telegram(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin_user)
):
    """
    Lista todos los chats de Telegram registrados. Solo para administradores.
    """
    from app.models.models import TelegramUser
    tgs = db.query(TelegramUser).all()
    res = []
    for tg in tgs:
        web_user = tg.usuario
        is_guest = web_user.email.endswith("@telegram.medicai") if web_user else True
        res.append({
            "id": tg.id,
            "telegram_chat_id": tg.telegram_chat_id,
            "username": tg.username,
            "first_name": tg.first_name,
            "last_name": tg.last_name,
            "fecha_registro": tg.fecha_registro,
            "linked": not is_guest,
            "web_user": {
                "id": web_user.id,
                "nombre": web_user.nombre,
                "email": web_user.email
            } if (web_user and not is_guest) else None
        })
    return res


@router.get("/{usuario_id}/telegram-status")
def obtener_estado_telegram(usuario_id: int, db: Session = Depends(get_db)):
    """
    Obtiene el estado de vinculación a Telegram del usuario.
    """
    from app.models.models import TelegramUser
    tg = db.query(TelegramUser).filter(TelegramUser.usuario_id == usuario_id).first()
    if tg:
        web_user = tg.usuario
        is_guest = web_user.email.endswith("@telegram.medicai") if web_user else True
        if not is_guest:
            return {
                "linked": True,
                "telegram_chat_id": tg.telegram_chat_id,
                "username": tg.username,
                "first_name": tg.first_name,
                "last_name": tg.last_name,
                "fecha_registro": tg.fecha_registro
            }
    return {"linked": False}


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


@router.put("/{usuario_id}/unlink-telegram")
def desvincular_telegram(usuario_id: int, db: Session = Depends(get_db)):
    """
    Desvincula la cuenta de Telegram de un usuario.
    """
    from app.models.models import TelegramUser, Usuario
    import secrets

    tg = db.query(TelegramUser).filter(TelegramUser.usuario_id == usuario_id).first()
    if not tg:
        raise HTTPException(404, "No hay cuenta de Telegram vinculada a este usuario.")

    chat_id = tg.telegram_chat_id
    guest_email = f"telegram_{chat_id}@telegram.medicai"
    guest_user = db.query(Usuario).filter(Usuario.email == guest_email).first()
    if not guest_user:
        guest_user = Usuario(
            email=guest_email,
            nombre=f"Usuario Telegram ({chat_id})",
            password_hash=secrets.token_hex(16),
            activo=True,
            role="usuario",
            email_verified=True
        )
        db.add(guest_user)
        db.commit()
        db.refresh(guest_user)

    tg.usuario_id = guest_user.id
    tg.telegram_linking_code = None
    tg.telegram_linking_code_expiration = None
    tg.telegram_linking_email = None
    db.commit()

    return {"status": "unlinked"}


@router.delete("/{usuario_id}", status_code=204)
def eliminar(usuario_id: int, db: Session = Depends(get_db)):
    u = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    u.activo = False
    db.commit()

