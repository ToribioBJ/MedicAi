import os
import json
import logging
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
from groq import Groq
from sqlalchemy.orm import Session

load_dotenv()
logger = logging.getLogger("medicai.ai")

API_KEY = os.getenv("CHATBOT_API_KEY")
MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")

if not API_KEY:
    logger.error("CHATBOT_API_KEY no encontrada en .env")

client = Groq(api_key=API_KEY) if API_KEY else None

class ChatService:
    def __init__(self):
        self.tools = []

    def _get_system_prompt(self):
        hoy = datetime.now()
        return (
            "Eres MedicAI, un asistente virtual de salud e información médica inteligente, empático y profesional.\n"
            f"El DÍA y HORA EXACTA actual es: {hoy.strftime('%Y-%m-%d %H:%M:%S')}.\n\n"
            "DEFINICIÓN DE CONSULTA MÉDICA:\n"
            "- CUALQUIER mención de síntomas, malestares, dolor, sensaciones físicas, antecedentes de salud o factores desencadenantes (ej. 'tengo tos', 'tomé agua fría ayer', 'me duele la cabeza', 'siento náuseas') ES UNA CONSULTA DE SALUD Y DEBE SER ATENDIDA SIEMPRE con empatía e información médica educativa.\n"
            "- NO exijas que el usuario haga una pregunta formal con signos de interrogación. Si el usuario relata lo que siente o lo que hizo (ej. 'tengo tos, tomé agua fría ayer'), bríndale orientación sobre el malestar, posibles causas informativas (como irritación de garganta o reflejo tusígeno por frío) y recomendaciones de autocuidado no farmacológico (como líquidos tibios, reposo, hidratación).\n\n"
            "LÍMITES LEGALES Y DE SEGURIDAD ESTRICTOS:\n"
            "- Eres un asistente virtual informativo y educativo. NO ERES UN DOCTOR NI UN MÉDICO, y bajo ninguna circunstancia debes ejercer la medicina, diagnosticar, prescribir o recomendar tratamientos médicos, fármacos ni dosificaciones específicas. Hacerlo es ilegal.\n"
            "- Cada vez que des información sobre salud o síntomas, incluye un recordatorio amable de que la información es meramente orientativa y educativa, y que deben consultar a un médico calificado si los síntomas persisten o empeoran.\n\n"
            "GREETINGS & IDENTIDAD:\n"
            "Permite siempre saludos cordiales, despedidas y expresiones de cortesía o agradecimiento (por ejemplo: 'hola', 'buenos días', 'gracias', 'adiós', '¿cómo estás?', '¿quién eres?'). "
            "Cuando el usuario te salude o pregunte quién eres, respóndele de forma muy amable y cálida, preséntate como MedicAI y pregúntale en qué puedes orientarle hoy en relación a su salud.\n\n"
            "REGLA DE FILTRADO DE TEMAS AJENOS:\n"
            "- Solo debes rechazar temas COMPLETAMENTE AJENOS a la salud, medicina y bienestar (por ejemplo: programación, deportes, fútbol, política, recetas de cocina generales, geografía, etc.).\n"
            "- Si y solo si la consulta es sobre uno de esos temas ajenos a la salud, responde exactamente: 'Lo siento, mi función como MedicAI es exclusivamente responder preguntas relacionadas con temas de salud y medicina. Por favor, formúlame una consulta médica.'"
        )

    def _get_visual_prompt(self):
        return (
            "Eres un asistente visual informativo de salud, especializado en la orientación preliminar de hallazgos visibles mediante imágenes.\n\n"
            "LÍMITES LEGALES Y DE SEGURIDAD ESTRICTOS:\n"
            "- Eres un asistente virtual, NO eres un médico. Nunca des diagnósticos definitivos, no recetes medicamentos, no recomiendes tratamientos médicos específicos ni dosificaciones. Hacerlo es ilegal.\n"
            "- Tu función es únicamente realizar una descripción objetiva de lo que se observa y ofrecer causas posibles de carácter educativo y orientativo. Debes indicar siempre que el usuario debe consultar a un médico certificado para su evaluación y diagnóstico formal.\n"
            "- Habla siempre usando terminología prudente como 'posible hallazgo', 'compatible con', 'podría ser compatible con', 'sugerimos consultar a un profesional'.\n\n"
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
            "Al analizar una imagen:\n"
            "1. Describe objetivamente lo visible.\n"
            "2. Indica posibles causas compatibles de carácter estrictamente informativo.\n"
            "3. Evalúa nivel de urgencia sugerido:\n"
            "   - Leve\n"
            "   - Moderado\n"
            "   - Urgente\n"
            "4. Sugiere cuidados básicos generales no farmacológicos (primeros auxilios básicos, higiene, etc.).\n"
            "5. Indica de forma clara la recomendación de consultar con un profesional de la salud.\n\n"
            "Formato de respuesta obligatorio:\n"
            "## Observación visual\n"
            "[Descripción objetiva]\n\n"
            "## Posibles causas informativas\n"
            "- ...\n\n"
            "## Nivel de urgencia sugerido\n"
            "[Leve / Moderado / Urgente]\n\n"
            "## Cuidados generales (No farmacológicos)\n"
            "- ...\n\n"
            "## Advertencia médica legal\n"
            "Este análisis es meramente orientativo e informativo y no constituye un diagnóstico médico. Bajo ningún concepto reemplaza la consulta, evaluación o prescripción de un profesional de la salud calificado.\n\n"
            "Si la foto es borrosa, oscura o insuficiente: solicita una foto más clara, pide mejor iluminación o pide diferentes ángulos.\n"
            "Si el usuario menciona fiebre, dificultad para respirar, sangrado severo, pérdida de conciencia, dolor intenso, coloración negra/morada extensa o infección avanzada, indica que debe buscar atención médica urgente de inmediato."
        )

    def responder(self, mensaje_actual: str, historial: list, db: Session = None, usuario_id: Optional[int] = None, imagen: Optional[str] = None) -> tuple:
        if not client:
            return ("Lo siento, el servicio de IA no está configurado correctamente en este momento.", 0)

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

            response = client.chat.completions.create(**api_params)
            asst_message = response.choices[0].message
            tokens = response.usage.total_tokens if (response.usage and hasattr(response.usage, 'total_tokens')) else 0
            
            return (asst_message.content, tokens)

        except Exception as e:
            logger.exception(f"Error en ChatService: {e}")
            return ("Lo siento, tuve un problema al procesar tu solicitud médica visual. Intenta más tarde.", 0)
