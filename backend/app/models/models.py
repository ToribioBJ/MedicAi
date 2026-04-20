from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, Enum, ForeignKey, JSON, Boolean
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre = Column(String(150), nullable=False)
    rol = Column(Enum("admin", "medico", "recepcion"), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    medico = relationship("Medico", back_populates="usuario", uselist=False, cascade="all, delete-orphan")


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dni = Column(String(20), unique=True, nullable=False, index=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False, index=True)
    fecha_nacimiento = Column(Date)
    sexo = Column(Enum("M", "F", "O"))
    telefono = Column(String(20))
    email = Column(String(150))
    direccion = Column(Text)
    tipo_sangre = Column(String(5))
    alergias = Column(Text)
    antecedentes = Column(Text)
    medicamentos_actuales = Column(Text)
    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)

    citas = relationship("Cita", back_populates="paciente", cascade="all, delete-orphan")
    triajes = relationship("ConsultaTriaje", back_populates="paciente")
    historial = relationship("HistorialClinico", back_populates="paciente", cascade="all, delete-orphan")
    conversaciones = relationship("Conversacion", back_populates="paciente")


class Medico(Base):
    __tablename__ = "medicos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True, nullable=False)
    cmp = Column(String(20), unique=True, nullable=False)
    especialidad = Column(String(100), nullable=False, index=True)
    telefono = Column(String(20))
    horario = Column(String(200))

    usuario = relationship("Usuario", back_populates="medico")
    citas = relationship("Cita", back_populates="medico")
    historial = relationship("HistorialClinico", back_populates="medico")


class Cita(Base):
    __tablename__ = "citas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True)
    medico_id = Column(Integer, ForeignKey("medicos.id", ondelete="RESTRICT"), nullable=False, index=True)
    fecha_hora = Column(DateTime, nullable=False, index=True)
    duracion_min = Column(Integer, default=30, nullable=False)
    motivo = Column(Text)
    estado = Column(
        Enum("pendiente", "confirmada", "atendida", "cancelada", "no_asistio"),
        default="pendiente", nullable=False, index=True
    )
    notas = Column(Text)
    creada_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    paciente = relationship("Paciente", back_populates="citas")
    medico = relationship("Medico", back_populates="citas")


class ConsultaTriaje(Base):
    __tablename__ = "consultas_triaje"

    id = Column(Integer, primary_key=True, autoincrement=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="SET NULL"), nullable=True, index=True)
    mensaje_usuario = Column(Text, nullable=False)
    sintomas_detectados = Column(JSON)
    nivel = Column(Enum("EMERGENCIA", "URGENCIA", "ESTABLE"), nullable=False, index=True)
    resumen = Column(Text)
    accion_sugerida = Column(Text)
    especialidad_sugerida = Column(String(100))
    contexto_ia = Column(Text)
    derivada_a_cita_id = Column(Integer, ForeignKey("citas.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    paciente = relationship("Paciente", back_populates="triajes")


class HistorialClinico(Base):
    __tablename__ = "historial_clinico"

    id = Column(Integer, primary_key=True, autoincrement=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="CASCADE"), nullable=False, index=True)
    medico_id = Column(Integer, ForeignKey("medicos.id", ondelete="RESTRICT"), nullable=False)
    cita_id = Column(Integer, ForeignKey("citas.id", ondelete="SET NULL"), nullable=True)
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    sintomas = Column(Text, nullable=False)
    diagnostico = Column(Text, nullable=False)
    tratamiento = Column(Text)
    observaciones = Column(Text)
    signos_vitales = Column(JSON)

    paciente = relationship("Paciente", back_populates="historial")
    medico = relationship("Medico", back_populates="historial")
    medicamentos = relationship("MedicamentoRecetado", back_populates="historial", cascade="all, delete-orphan")


class MedicamentoRecetado(Base):
    __tablename__ = "medicamentos_recetados"

    id = Column(Integer, primary_key=True, autoincrement=True)
    historial_id = Column(Integer, ForeignKey("historial_clinico.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(150), nullable=False)
    dosis = Column(String(50))
    frecuencia = Column(String(100))
    duracion_dias = Column(Integer)
    indicaciones = Column(Text)

    historial = relationship("HistorialClinico", back_populates="medicamentos")


class Conversacion(Base):
    __tablename__ = "conversaciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="SET NULL"), nullable=True, index=True)
    titulo = Column(String(255))
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    paciente = relationship("Paciente", back_populates="conversaciones")
    mensajes = relationship("MensajeChat", back_populates="conversacion", cascade="all, delete-orphan")


class MensajeChat(Base):
    __tablename__ = "mensajes_chat"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversacion_id = Column(Integer, ForeignKey("conversaciones.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(Enum("user", "assistant"), nullable=False)
    contenido = Column(Text, nullable=False)
    fecha_envio = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversacion = relationship("Conversacion", back_populates="mensajes")
