import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.models import (
    Usuario, Cita, Conversacion, MensajeChat
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
