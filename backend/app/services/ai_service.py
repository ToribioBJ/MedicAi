import os
import json
import logging
from datetime import date
from typing import Optional
from dotenv import load_dotenv
from groq import Groq
from sqlalchemy.orm import Session

from app.models import Paciente, ConsultaTriaje, HistorialClinico, MedicamentoRecetado, Cita

load_dotenv()
logger = logging.getLogger("medicai.ai")

API_KEY = os.getenv("CHATBOT_API_KEY")
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

if not API_KEY:
    logger.error("CHATBOT_API_KEY no encontrada en .env")

client = Groq(api_key=API_KEY) if API_KEY else None


def _calcular_edad(fn: Optional[date]) -> Optional[int]:
    if not fn:
        return None
    hoy = date.today()
    return hoy.year - fn.year - ((hoy.month, hoy.day) < (fn.month, fn.day))


def construir_contexto_paciente(db: Session, paciente_id: int) -> str:
    """Arma una ficha clínica completa del paciente (datos personales +
    historial + medicamentos + triajes + citas) para que la IA tome
    decisiones informadas."""
    p = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not p:
        return ""

    edad = _calcular_edad(p.fecha_nacimiento)
    lineas = [
        "╔══════════════════════════════════════════════════════╗",
        "║           FICHA CLÍNICA DEL PACIENTE                 ║",
        "╚══════════════════════════════════════════════════════╝",
        "",
        "▶ DATOS PERSONALES",
        f"  • Nombre completo: {p.nombres} {p.apellidos}",
        f"  • DNI: {p.dni}",
        f"  • Edad: {edad if edad is not None else 'N/D'} años"
        + (f" (nacido {p.fecha_nacimiento.strftime('%d/%m/%Y')})" if p.fecha_nacimiento else ""),
        f"  • Sexo: {'Masculino' if p.sexo=='M' else 'Femenino' if p.sexo=='F' else (p.sexo or 'N/D')}",
        f"  • Tipo de sangre: {p.tipo_sangre or 'N/D'}",
        "",
        "▶ INFORMACIÓN CLÍNICA RELEVANTE",
        f"  • Alergias conocidas: {p.alergias or 'Ninguna registrada'}",
        f"  • Antecedentes médicos: {p.antecedentes or 'Sin antecedentes relevantes'}",
        f"  • Medicamentos actuales (auto-reportados): {p.medicamentos_actuales or 'Ninguno'}",
    ]

    # ===== Historial clínico con diagnósticos + signos vitales =====
    historial = (
        db.query(HistorialClinico)
        .filter(HistorialClinico.paciente_id == paciente_id)
        .order_by(HistorialClinico.fecha.desc())
        .limit(5).all()
    )
    if historial:
        lineas += ["", "▶ HISTORIAL CLÍNICO (últimas 5 consultas)"]
        for h in historial:
            lineas.append(f"  ─ {h.fecha.strftime('%d/%m/%Y')}")
            lineas.append(f"    · Síntomas: {h.sintomas}")
            lineas.append(f"    · Diagnóstico: {h.diagnostico}")
            if h.tratamiento:
                lineas.append(f"    · Tratamiento: {h.tratamiento}")
            if h.signos_vitales:
                sv = h.signos_vitales if isinstance(h.signos_vitales, dict) else {}
                if sv:
                    sv_str = ", ".join(f"{k}: {v}" for k, v in sv.items())
                    lineas.append(f"    · Signos vitales: {sv_str}")
            if h.observaciones:
                lineas.append(f"    · Observaciones: {h.observaciones}")

    # ===== Medicamentos recetados (agregados de historiales) =====
    ids_hist = [h.id for h in historial] if historial else []
    if ids_hist:
        meds = (
            db.query(MedicamentoRecetado)
            .filter(MedicamentoRecetado.historial_id.in_(ids_hist))
            .all()
        )
        if meds:
            lineas += ["", "▶ MEDICAMENTOS RECETADOS (histórico)"]
            for m in meds:
                detalle = [m.nombre]
                if m.dosis: detalle.append(m.dosis)
                if m.frecuencia: detalle.append(m.frecuencia)
                if m.duracion_dias: detalle.append(f"por {m.duracion_dias} días")
                lineas.append(f"  • {' — '.join(detalle)}"
                              + (f"  ({m.indicaciones})" if m.indicaciones else ""))

    # ===== Triajes previos =====
    triajes = (
        db.query(ConsultaTriaje)
        .filter(ConsultaTriaje.paciente_id == paciente_id)
        .order_by(ConsultaTriaje.fecha_creacion.desc())
        .limit(5).all()
    )
    if triajes:
        lineas += ["", "▶ CONSULTAS DE TRIAJE PREVIAS"]
        for t in triajes:
            lineas.append(
                f"  • {t.fecha_creacion.strftime('%d/%m/%Y %H:%M')} "
                f"[{t.nivel}] — {t.resumen or t.mensaje_usuario[:100]}"
            )
            if t.accion_sugerida:
                lineas.append(f"      → Acción indicada: {t.accion_sugerida}")

    # ===== Citas próximas o recientes =====
    citas = (
        db.query(Cita)
        .filter(Cita.paciente_id == paciente_id)
        .order_by(Cita.fecha_hora.desc())
        .limit(3).all()
    )
    if citas:
        lineas += ["", "▶ CITAS RECIENTES/PROGRAMADAS"]
        for c in citas:
            lineas.append(
                f"  • {c.fecha_hora.strftime('%d/%m/%Y %H:%M')} "
                f"[{c.estado}] — {c.motivo or 'Sin motivo registrado'}"
            )

    lineas += [
        "",
        "═══════════════════════════════════════════════════════",
        "FIN DE LA FICHA. Usa estos datos para tu evaluación.",
        "═══════════════════════════════════════════════════════",
    ]
    return "\n".join(lineas)


class TriajeService:
    SYSTEM_PROMPT = (
        "Eres MedicAI, un asistente médico virtual experto en TRIAJE clínico "
        "siguiendo el estándar Manchester (5 niveles, simplificado aquí a 3). "
        "Tu tarea: clasificar la urgencia de los síntomas reportados y dar una "
        "recomendación clara y segura.\n\n"

        "════════ REGLAS DE USO DE LA FICHA DEL PACIENTE ════════\n"
        "Si el usuario adjunta una 'FICHA CLÍNICA DEL PACIENTE', DEBES:\n"
        "1) LEERLA COMPLETA antes de evaluar los síntomas actuales.\n"
        "2) CONTRASTAR los síntomas actuales con:\n"
        "   • Antecedentes (ej.: hipertenso con dolor torácico = mayor sospecha cardiovascular).\n"
        "   • Alergias (NUNCA sugerir un fármaco al que el paciente es alérgico).\n"
        "   • Medicamentos actuales (evaluar interacciones o efectos adversos).\n"
        "   • Historial clínico reciente (diagnósticos y tratamientos previos).\n"
        "   • Signos vitales previos (si son anormales, tenerlo en cuenta).\n"
        "   • Triajes previos (detectar síntomas recurrentes o empeoramiento).\n"
        "3) PERSONALIZAR la 'accion_sugerida' citando datos de la ficha cuando sea "
        "relevante (ej.: 'Dado su antecedente de asma, use su inhalador y...').\n"
        "4) Si hay RED FLAGS combinadas con antecedentes (ej. diabético + poliuria + "
        "confusión), elevar el nivel a EMERGENCIA aunque el síntoma aislado parezca menor.\n"
        "5) Si la ficha no se proporciona, evalúa solo con los síntomas descritos.\n\n"

        "════════ CRITERIOS DE CLASIFICACIÓN ════════\n"
        "• EMERGENCIA → riesgo vital inmediato o de daño orgánico irreversible. "
        "Ejemplos: dolor torácico con disnea, pérdida de conciencia, hemorragia activa, "
        "signos de ACV, dificultad respiratoria severa, anafilaxia, trauma grave.\n"
        "• URGENCIA → requiere atención médica en horas (no puede esperar al día siguiente). "
        "Ejemplos: fiebre alta persistente, dolor abdominal moderado-severo, crisis asmática "
        "controlable, infecciones sospechosas, heridas que requieren sutura.\n"
        "• ESTABLE → manejo ambulatorio o autocuidado, consulta programada si persiste. "
        "Ejemplos: resfriado leve, dolor muscular localizado, cefalea ocasional sin "
        "banderas rojas, síntomas virales leves.\n\n"

        "════════ FORMATO DE RESPUESTA (OBLIGATORIO) ════════\n"
        "Responde EXCLUSIVAMENTE con JSON válido (sin markdown, sin ``` ni comentarios), "
        "con estas llaves EXACTAS:\n"
        "{\n"
        '  "nivel": "EMERGENCIA" | "URGENCIA" | "ESTABLE",\n'
        '  "resumen": "hallazgo clínico principal + contexto del paciente si aplica (máx 25 palabras)",\n'
        '  "accion_sugerida": "qué hacer, específico y personalizado (menciona ficha cuando relevante)",\n'
        '  "especialidad_sugerida": "especialidad médica a derivar (Cardiología, Neumología, etc.)",\n'
        '  "sintomas_detectados": ["síntoma1", "síntoma2", ...]\n'
        "}\n\n"

        "════════ RESTRICCIONES ÉTICAS ════════\n"
        "• NO diagnostiques definitivamente — sugiere posibilidades.\n"
        "• NO prescribas medicamentos con dosis específicas (usa términos como "
        "'considerar analgésico común' en vez de dosis exactas).\n"
        "• Ante duda, prioriza la seguridad del paciente y eleva el nivel.\n"
        "• Si el paciente es menor de edad, adulto mayor o embarazada (según ficha), "
        "extrema la precaución."
    )

    def analizar(self, mensaje: str, contexto_paciente: str = "") -> dict:
        if not client:
            return self._fallback("Servicio de IA no configurado (falta CHATBOT_API_KEY)")

        try:
            user_content = (
                f"{contexto_paciente}\n\n=== SÍNTOMAS ACTUALES ===\n{mensaje}"
                if contexto_paciente
                else f"Síntomas: {mensaje}"
            )

            completion = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=500,
            )
            raw = completion.choices[0].message.content
            logger.info(f"Groq respondió: {raw}")
            data = json.loads(raw)

            if data.get("nivel") not in ("EMERGENCIA", "URGENCIA", "ESTABLE"):
                data["nivel"] = "URGENCIA"
            data.setdefault("resumen", "")
            data.setdefault("accion_sugerida", "")
            data.setdefault("especialidad_sugerida", None)
            data.setdefault("sintomas_detectados", [])
            return data

        except json.JSONDecodeError as e:
            logger.error(f"IA no devolvió JSON válido: {e}")
            return self._fallback("La IA no devolvió un formato válido.")
        except Exception as e:
            logger.exception(f"Error en servicio Groq: {e}")
            return self._fallback(f"Error de comunicación con la IA: {e}")

    @staticmethod
    def _fallback(motivo: str) -> dict:
        return {
            "nivel": "URGENCIA",
            "resumen": motivo,
            "accion_sugerida": "Ante la duda, acuda al centro de salud más cercano.",
            "especialidad_sugerida": "Medicina General",
            "sintomas_detectados": [],
        }


class ChatService:
    SYSTEM_PROMPT = (
        "Eres un asistente de salud informativo. Responde de forma clara, breve y fácil de entender.\n\n"
        "Si el usuario solo saluda (por ejemplo: 'hola', 'buenas'), responde en una sola oración corta y haz como "
        "máximo una pregunta simple. No des explicaciones largas ni advertencias en ese caso.\n\n"
        "Si el usuario menciona síntomas, da una explicación un poco más detallada: incluye causas comunes, "
        "recomendaciones generales en casa y señales de alerta, pero sin dar diagnósticos ni usar lenguaje demasiado técnico.\n\n"
        "Mantén un tono natural y conversacional. Prioriza respuestas cortas por defecto y solo extiéndete si el usuario lo requiere."
    )

    def responder(self, mensaje_actual: str, historial: list, contexto_paciente: str = "") -> str:
        """
        Genera una respuesta fluida basada en el historial y el contexto.
        `historial` es una lista de diccionarios: [{"role": "user", "content": "..."}, ...]
        """
        if not client:
            return "Lo siento, el servicio de IA no está configurado correctamente en este momento."

        try:
            # Preparamos los mensajes para el LLM
            messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]

            # Si hay contexto del paciente (historia clínica), lo inyectamos al principio
            if contexto_paciente:
                messages.append({
                    "role": "system",
                    "content": f"FICHA CLÍNICA DEL PACIENTE PARA ESTA SESIÓN:\n\n{contexto_paciente}"
                })

            # Añadimos el historial previo
            messages.extend(historial)

            # Añadimos el mensaje actual
            messages.append({"role": "user", "content": mensaje_actual})

            completion = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                temperature=0.7,  # Un poco más creativo/fluido para chat
                max_tokens=800,
            )

            respuesta = completion.choices[0].message.content
            logger.info(f"ChatBot respondió: {respuesta[:100]}...")
            return respuesta

        except Exception as e:
            logger.exception(f"Error en ChatService: {e}")
            return "Lo siento, tuve un problema al procesar tu consulta. Por favor, inténtalo de nuevo."
