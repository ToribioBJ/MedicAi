import os
import json
import logging
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
from groq import Groq
from sqlalchemy.orm import Session
from app.models.models import Cita

load_dotenv()
logger = logging.getLogger("medicai.ai")

API_KEY = os.getenv("CHATBOT_API_KEY")
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

if not API_KEY:
    logger.error("CHATBOT_API_KEY no encontrada en .env")

client = Groq(api_key=API_KEY) if API_KEY else None

class ChatService:
    def __init__(self):
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "agendar_cita",
                    "description": "Agenda una nueva cita médica o recordatorio en el calendario del usuario.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "fecha_hora": {
                                "type": "string",
                                "description": "Fecha y hora en formato ISO 8601, ej. '2026-04-28T09:00:00'. Asume la hora '09:00:00' si no se especifica."
                            },
                            "motivo": {
                                "type": "string",
                                "description": "Motivo resumido de la visita, ej. 'Análisis de sangre'."
                            }
                        },
                        "required": ["fecha_hora", "motivo"]
                    }
                }
            }
        ]

    def _get_system_prompt(self):
        hoy = datetime.now()
        return (
            "Eres MedicAI, un asistente de salud informativo e inteligente.\n"
            f"El DÍA y HORA EXACTA actual es: {hoy.strftime('%Y-%m-%d %H:%M:%S')}.\n\n"
            "Tienes la capacidad de acceder al calendario del usuario. Si un usuario te pide explícitamente AGENDAR, REGISTRAR o RECORDAR algo en su calendario, "
            "usa obligatoriamente y exclusivamente tu herramienta 'agendar_cita' para guardarlo internamente usando su fecha correcta.\n\n"
            "Responde de forma clara y amable tras haber agendado la cita, confirmando que ya se registró en el calendario exitosamente."
        )

    def responder(self, mensaje_actual: str, historial: list, db: Session = None, usuario_id: Optional[int] = None) -> str:
        if not client:
            return "Lo siento, el servicio de IA no está configurado correctamente en este momento."

        try:
            # Preparamos los mensajes para el LLM
            messages = [{"role": "system", "content": self._get_system_prompt()}]
            
            # Limpiamos los mensajes del historial incompatibles con Groq (borramos los "tool" calls en crudo por si llegan)
            for m in historial:
                messages.append({"role": m["role"], "content": m["content"]})

            messages.append({"role": "user", "content": mensaje_actual})

            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=self.tools,
                tool_choice="auto",
                temperature=0.3,
                max_tokens=800,
            )

            asst_message = response.choices[0].message

            # Verificar si Groq decidió usar Function Calling
            if asst_message.tool_calls:
                for tool_call in asst_message.tool_calls:
                    if tool_call.function.name == "agendar_cita":
                        args = json.loads(tool_call.function.arguments)
                        if db and usuario_id:
                            fecha_str = args.get("fecha_hora")
                            motivo = args.get("motivo")
                            
                            # Insertar en BD
                            try:
                                dt = datetime.fromisoformat(fecha_str)
                                c = Cita(usuario_id=usuario_id, fecha_hora=dt, motivo=motivo, estado="confirmada")
                                db.add(c)
                                db.commit()
                                tool_result = f"Cita guardada correctamente para {fecha_str}."
                            except Exception as ex:
                                logger.error(f"Error BD Agendar Cita: {ex}")
                                tool_result = "Error al intentar guardar en base de datos. Pide perdón."
                        else:
                            tool_result = "Error interno: Faltan credenciales de BD."

                        # Añadir la respuesta al flujo conversacional para el segundo loop
                        message_dump = asst_message.model_dump()
                        # Clean groq unsupported attributes for history
                        messages.append({
                            "role": "assistant",
                            "tool_calls": message_dump["tool_calls"]
                        })
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": "agendar_cita",
                            "content": tool_result
                        })

                # Segunda llamada para generar la confirmación de texto final
                second_response = client.chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    temperature=0.7,
                )
                return second_response.choices[0].message.content
            
            else:
                return asst_message.content

        except Exception as e:
            logger.exception(f"Error en ChatService: {e}")
            return "Lo siento, tuve un problema al comunicarme con tus registros. Intenta más tarde."
