from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Enum, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre = Column(String(150), nullable=False)

    activo = Column(Boolean, default=True, nullable=False)
    role = Column(String(50), default="usuario", nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(255), nullable=True)
    verification_token_expiration = Column(DateTime, nullable=True)
    reset_password_token = Column(String(255), nullable=True)
    reset_password_token_expiration = Column(DateTime, nullable=True)

    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    conversaciones = relationship("Conversacion", back_populates="usuario", cascade="all, delete-orphan")
    telegram_user = relationship("TelegramUser", back_populates="usuario", uselist=False, cascade="all, delete-orphan")

    @property
    def cant_conversaciones(self) -> int:
        return len(self.conversaciones)

    @property
    def cant_mensajes(self) -> int:
        total = 0
        for conv in self.conversaciones:
            total += len(conv.mensajes)
        return total

    @property
    def telegram_chat_id(self) -> Optional[str]:
        if self.telegram_user and not self.email.endswith("@telegram.medicai"):
            return self.telegram_user.telegram_chat_id
        return None

    @property
    def tokens_utilizados(self) -> int:
        total = 0
        for conv in self.conversaciones:
            for msg in conv.mensajes:
                if msg.tokens:
                    total += msg.tokens
        return total

    @property
    def actividad_diaria(self) -> dict:
        activity = {}
        for conv in self.conversaciones:
            for msg in conv.mensajes:
                day_str = msg.fecha_envio.strftime("%Y-%m-%d")
                activity[day_str] = activity.get(day_str, 0) + 1
        return activity

    @property
    def tokens_por_dia(self) -> dict:
        tokens_day = {}
        for conv in self.conversaciones:
            for msg in conv.mensajes:
                if msg.tokens:
                    day_str = msg.fecha_envio.strftime("%Y-%m-%d")
                    tokens_day[day_str] = tokens_day.get(day_str, 0) + msg.tokens
        return tokens_day



class Conversacion(Base):
    __tablename__ = "conversaciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    titulo = Column(String(255))
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("Usuario", back_populates="conversaciones")
    mensajes = relationship("MensajeChat", back_populates="conversacion", cascade="all, delete-orphan")


class MensajeChat(Base):
    __tablename__ = "mensajes_chat"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversacion_id = Column(Integer, ForeignKey("conversaciones.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(Enum("user", "assistant"), nullable=False)
    contenido = Column(Text, nullable=False)
    imagen = Column(Text, nullable=True)
    fecha_envio = Column(DateTime, default=datetime.utcnow, nullable=False)
    tokens = Column(Integer, default=0, nullable=False)

    conversacion = relationship("Conversacion", back_populates="mensajes")


class TelegramUser(Base):
    __tablename__ = "telegram_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_chat_id = Column(String(100), unique=True, nullable=False, index=True)
    username = Column(String(150), nullable=True)
    first_name = Column(String(150), nullable=True)
    last_name = Column(String(150), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    telegram_linking_code = Column(String(10), nullable=True)
    telegram_linking_code_expiration = Column(DateTime, nullable=True)
    telegram_linking_email = Column(String(150), nullable=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("Usuario", back_populates="telegram_user")
