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
VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

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
            "REGLA ESTRICTA: Solo debes responder preguntas relacionadas con la salud, la medicina, síntomas y bienestar. "
            "Si el usuario te hace una pregunta o comentario sobre cualquier otro tema que NO sea de salud (por ejemplo, programación, deportes, política, recetas de cocina, etc.), "
            "debes negarte amablemente diciendo: 'Lo siento, mi función como MedicAI es exclusivamente responder preguntas relacionadas con temas de salud y medicina. Por favor, formúlame una consulta médica.'\n\n"
            "Tienes la capacidad de acceder al calendario del usuario. Si un usuario te pide explícitamente AGENDAR, REGISTRAR o RECORDAR algo en su calendario, "
            "usa obligatoriamente y exclusivamente tu herramienta 'agendar_cita' para guardarlo internamente usando su fecha correcta.\n\n"
            "Responde de forma clara y amable tras haber agendado la cita, confirmando que ya se registró en el calendario exitosamente."
        )

    def _get_visual_prompt(self):
        return (
            "Eres un asistente médico visual especializado en análisis preliminar de síntomas visibles mediante imágenes.\n\n"
            "Tu función es analizar fotografías enviadas por el usuario e identificar posibles hallazgos visibles como:\n"
            "- Moretones (hematomas)\n"
            "- Inflamación\n"
            "- Erupciones cutáneas\n"
            "- Enrojecimiento\n"
            "- Cortes o heridas\n"
            "- Quemaduras\n"
            "- Hinchazón\n"
            "- Cambios de color en la piel\n"
            "- Infecciones visibles\n"
            "- Reacciones alérgicas\n"
            "- Lesiones deportivas\n"
            "- Picaduras\n"
            "- Signos dermatológicos visibles\n\n"
            "IMPORTANTE:\n"
            "- Nunca afirmes diagnósticos definitivos.\n"
            "- No reemplazas a un médico.\n"
            "- Debes hablar en términos de 'posible', 'compatible con', 'podría indicar'.\n"
            "- Si detectas signos potencialmente graves, recomienda atención médica inmediata.\n\n"
            "Al analizar una imagen:\n"
            "1. Describe objetivamente lo visible.\n"
            "2. Indica posibles causas compatibles.\n"
            "3. Evalúa nivel de urgencia:\n"
            "   - Leve\n"
            "   - Moderado\n"
            "   - Urgente\n"
            "4. Sugiere cuidados básicos seguros.\n"
            "5. Indica cuándo consultar a un profesional.\n\n"
            "Formato de respuesta obligatorio:\n"
            "## Observación visual\n"
            "[Descripción objetiva]\n\n"
            "## Posibles causas\n"
            "- ...\n\n"
            "## Nivel de urgencia\n"
            "[Leve / Moderado / Urgente]\n\n"
            "## Recomendaciones\n"
            "- ...\n\n"
            "## Advertencia médica\n"
            "Este análisis es solo orientativo y no sustituye una evaluación médica profesional.\n\n"
            "Si la foto es borrosa, oscura o insuficiente: solicita una foto más clara, pide mejor iluminación o pide diferentes ángulos.\n"
            "Si el usuario menciona fiebre, dificultad para respirar, sangrado severo, pérdida de conciencia, dolor intenso, coloración negra/morada extensa o infección avanzada, indica que debe buscar atención médica urgente de inmediato."
        )

    def responder(self, mensaje_actual: str, historial: list, db: Session = None, usuario_id: Optional[int] = None, imagen: Optional[str] = None) -> str:
        if not client:
            return "Lo siento, el servicio de IA no está configurado correctamente en este momento."

        try:
            sys_prompt = self._get_visual_prompt() if imagen else self._get_system_prompt()
            messages = [{"role": "system", "content": sys_prompt}]
            
            for m in historial:
                messages.append({"role": m["role"], "content": m["content"]})

            if imagen:
                base64_image = imagen if imagen.startswith("data:") else f"data:image/jpeg;base64,{imagen}"
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": mensaje_actual if (mensaje_actual and mensaje_actual.strip()) else "Analiza esta imagen médica por favor."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": base64_image
                            }
                        }
                    ]
                })
            else:
                messages.append({"role": "user", "content": mensaje_actual})

            model_to_use = VISION_MODEL if imagen else MODEL

            api_params = {
                "model": model_to_use,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 1000 if imagen else 800,
            }
            if not imagen:
                api_params["tools"] = self.tools
                api_params["tool_choice"] = "auto"

            response = client.chat.completions.create(**api_params)

            asst_message = response.choices[0].message

            if not imagen and asst_message.tool_calls:
                for tool_call in asst_message.tool_calls:
                    if tool_call.function.name == "agendar_cita":
                        args = json.loads(tool_call.function.arguments)
                        if db and usuario_id:
                            fecha_str = args.get("fecha_hora")
                            motivo = args.get("motivo")
                            
                            try:
                                clean_fecha = fecha_str.replace("Z", "+00:00") if isinstance(fecha_str, str) else fecha_str
                                dt = datetime.fromisoformat(clean_fecha)
                                c = Cita(usuario_id=usuario_id, fecha_hora=dt, motivo=motivo, estado="confirmada")
                                db.add(c)
                                db.commit()
                                tool_result = f"Cita guardada correctamente para {fecha_str}."
                            except Exception as ex:
                                logger.error(f"Error BD Agendar Cita: {ex}")
                                tool_result = "Error al intentar guardar en base de datos. Pide perdón."
                        else:
                            tool_result = "Error interno: Faltan credenciales de BD."

                        messages.append(asst_message)
                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": "agendar_cita",
                            "content": tool_result
                        })

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
            return "Lo siento, tuve un problema al procesar tu solicitud médica visual. Intenta más tarde."
