import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.models import (
    Usuario, Cita, Conversacion, MensajeChat, TelegramUser
)
from app.routers import usuarios, citas, chatbot, auth


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("medicai")

# Crea tablas en MySQL si no existen (el schema.sql es la versión canónica).
try:
    Base.metadata.create_all(bind=engine)
    logger.info(">>> Tablas verificadas/creadas en MySQL.")
    
    # Crear usuario semilla si la base de datos está vacía
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(Usuario).count() == 0:
            logger.info(">>> Base de datos vacía. Creando usuario administrador semilla...")
            admin = Usuario(
                email="admin@medicai.com",
                password_hash="$2b$12$KIXoL6Jg3fEYI3p9wqZfUuqQ3vH0Jt5L8bN0aXqZzQYjR4q5a0p6S", # password: admin (o similar)
                nombre="Administrador MedicAI"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            
            # Citas semilla
            from datetime import datetime, timedelta
            cita1 = Cita(
                usuario_id=admin.id,
                fecha_hora=datetime.utcnow() + timedelta(days=1, hours=2),
                motivo="Chequeo General Mensual",
                estado="confirmada"
            )
            cita2 = Cita(
                usuario_id=admin.id,
                fecha_hora=datetime.utcnow() + timedelta(days=4, hours=3),
                motivo="Seguimiento de consulta",
                estado="pendiente"
            )
            db.add(cita1)
            db.add(cita2)
            db.commit()
            logger.info(">>> Datos semilla inicializados con éxito.")
            
        # Asegurar que el usuario administrador semilla esté siempre verificado y con rol administrador
        admin_existente = db.query(Usuario).filter(Usuario.email == "admin@medicai.com").first()
        if admin_existente:
            if admin_existente.role != "administrador" or not admin_existente.email_verified:
                admin_existente.role = "administrador"
                admin_existente.email_verified = True
                db.commit()
                logger.info(">>> Rol y estado de verificación del administrador semilla actualizados en base de datos.")
    except Exception as seed_err:
        logger.error(f">>> Error al inicializar/verificar datos semilla: {seed_err}")
        db.rollback()
    finally:
        db.close()
except Exception as e:
    logger.error(f">>> Error inicializando DB: {e}")

app = FastAPI(
    title="MedicAI API",
    description="Sistema de triaje, pacientes, citas e historial clínico con IA",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios.router)
app.include_router(citas.router)
app.include_router(chatbot.router)
app.include_router(auth.router)


from app.services.telegram_bot import start_telegram_bot, stop_telegram_bot

@app.on_event("startup")
async def startup_event():
    await start_telegram_bot()

@app.on_event("shutdown")
async def shutdown_event():
    await stop_telegram_bot()



@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "MedicAI",
        "db": "MySQL",
        "docs": "/docs",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
