import os
import asyncio
import logging
import base64
import secrets
from datetime import datetime, timedelta
from typing import Optional

import httpx
from telegram import Update, BotCommand
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes
)

from app.core.database import SessionLocal
from app.models.models import Usuario, Conversacion, MensajeChat, TelegramUser
from app.services.ai_service import ChatService
from app.services.email_service import enviar_correo_vinculacion_telegram

# Configuración de Logging
logger = logging.getLogger("medicai.telegram")

# Inicialización de servicios
chat_service = ChatService()
telegram_app: Optional[Application] = None
bot_task: Optional[asyncio.Task] = None


def get_or_create_telegram_user(db, chat_id: str, username: Optional[str], full_name: Optional[str]) -> TelegramUser:
    """
    Busca o crea un registro de TelegramUser en la base de datos.
    Si no existe, también crea un Usuario temporal (Invitado) en la tabla 'usuarios' 
    y lo asocia al nuevo TelegramUser.
    """
    tg_user = db.query(TelegramUser).filter(TelegramUser.telegram_chat_id == chat_id).first()
    if not tg_user:
        logger.info(f"Creando TelegramUser e Invitado asociado para chat_id: {chat_id}")
        guest_email = f"telegram_{chat_id}@telegram.medicai"
        
        # Intentar buscar un usuario de tipo Invitado existente
        guest_user = db.query(Usuario).filter(Usuario.email == guest_email).first()
        if not guest_user:
            nombre_usuario = full_name or (f"@{username}" if username else f"Usuario Telegram ({chat_id})")
            guest_user = Usuario(
                email=guest_email,
                nombre=nombre_usuario,
                password_hash=secrets.token_hex(16),  # Contraseña aleatoria ficticia
                activo=True,
                role="usuario",
                email_verified=True
            )
            db.add(guest_user)
            db.commit()
            db.refresh(guest_user)
        
        # Crear TelegramUser apuntando a este guest_user
        f_name = full_name.split()[0] if (full_name and len(full_name.split()) > 0) else None
        l_name = " ".join(full_name.split()[1:]) if (full_name and len(full_name.split()) > 1) else None
        
        tg_user = TelegramUser(
            telegram_chat_id=chat_id,
            username=username,
            first_name=f_name,
            last_name=l_name,
            usuario_id=guest_user.id
        )
        db.add(tg_user)
        db.commit()
        db.refresh(tg_user)
    else:
        # Actualizar metadatos de Telegram en la BD si cambiaron
        updated = False
        if tg_user.username != username:
            tg_user.username = username
            updated = True
        if full_name:
            f_name = full_name.split()[0]
            l_name = " ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else None
            if tg_user.first_name != f_name:
                tg_user.first_name = f_name
                updated = True
            if tg_user.last_name != l_name:
                tg_user.last_name = l_name
                updated = True
        if updated:
            db.commit()
            db.refresh(tg_user)
            
    return tg_user


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manejador del comando /start"""
    chat_id = str(update.effective_chat.id)
    user_tg = update.effective_user
    username = user_tg.username if user_tg else None
    first_name = user_tg.first_name if user_tg else None
    last_name = user_tg.last_name if user_tg else None
    full_name = f"{first_name or ''} {last_name or ''}".strip() or None

    db = SessionLocal()
    try:
        tg_user = get_or_create_telegram_user(db, chat_id, username, full_name)
        user = tg_user.usuario
        
        if user and not user.email.endswith("@telegram.medicai"):
            # Usuario ya vinculado a cuenta web oficial
            saludo = (
                f"¡Hola de nuevo, *{user.nombre}*! 🩺🤖\n\n"
                f"Tu cuenta de Telegram está vinculada a tu perfil de MedicAI (`{user.email}`).\n\n"
                f"¿En qué te puedo asistir hoy? Puedes hacerme consultas médicas."
            )
        else:
            # Modo Invitado
            saludo = (
                f"¡Hola! Bienvenido a *MedicAI* 🩺🤖\n\n"
                f"Soy tu asistente virtual de salud. Actualmente estás chateando en *Modo Invitado*.\n\n"
                f"Puedes hacerme consultas médicas generales y analizar fotos de tus síntomas visibles.\n\n"
                f"🔑 *¿Quieres vincular tu cuenta web?*\n"
                f"Vincula tu cuenta usando el comando:\n"
                f"`/vincular tu_correo@ejemplo.com`"
            )
        await update.message.reply_text(saludo, parse_mode="Markdown")
    except Exception as e:
        logger.error(f"Error en comando /start: {e}")
        await update.message.reply_text("¡Hola! Bienvenido a MedicAI. Hubo un inconveniente al cargar tu perfil, pero puedes hacerme tus consultas de salud directamente.")
    finally:
        db.close()


async def vincular_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manejador del comando /vincular <email>"""
    chat_id = str(update.effective_chat.id)
    user_tg = update.effective_user
    username = user_tg.username if user_tg else None
    first_name = user_tg.first_name if user_tg else None
    last_name = user_tg.last_name if user_tg else None
    full_name = f"{first_name or ''} {last_name or ''}".strip() or None

    if not context.args:
        await update.message.reply_text(
            "⚠️ Por favor, introduce tu correo electrónico.\n"
            "Ejemplo: `/vincular tu_correo@ejemplo.com`",
            parse_mode="Markdown"
        )
        return

    email = context.args[0].strip().lower()
    db = SessionLocal()
    try:
        # Asegurar que el TelegramUser exista en base de datos
        tg_user = get_or_create_telegram_user(db, chat_id, username, full_name)
        
        web_user = db.query(Usuario).filter(Usuario.email == email).first()
        if not web_user:
            await update.message.reply_text(
                "❌ No encontramos ninguna cuenta registrada en MedicAI con ese correo electrónico. "
                "Regístrate primero en la aplicación web."
            )
            return
        
        if not web_user.activo:
            await update.message.reply_text("❌ Esta cuenta de usuario se encuentra desactivada.")
            return

        # Generar código OTP de 6 dígitos
        otp_code = f"{secrets.randbelow(1000000):06d}"
        tg_user.telegram_linking_code = otp_code
        tg_user.telegram_linking_code_expiration = datetime.utcnow() + timedelta(minutes=15)
        tg_user.telegram_linking_email = email
        db.commit()

        # Enviar correo de vinculación
        enviado = enviar_correo_vinculacion_telegram(web_user.email, web_user.nombre, otp_code)
        
        if enviado:
            await update.message.reply_text(
                f"📧 ¡Usuario encontrado!\n\n"
                f"Hemos enviado un código OTP de 6 dígitos a tu correo: *{email}*.\n\n"
                f"Para completar la vinculación, escribe:\n"
                f"`/confirmar CÓDIGO`",
                parse_mode="Markdown"
            )
        else:
            await update.message.reply_text(
                f"⚠️ El código de verificación es *{otp_code}* (Logs: SMTP no configurado localmente).\n\n"
                f"Por favor confírmalo con:\n"
                f"`/confirmar {otp_code}`",
                parse_mode="Markdown"
            )
    except Exception as e:
        logger.error(f"Error en comando /vincular: {e}")
        await update.message.reply_text("❌ Ocurrió un error al procesar tu vinculación. Inténtalo de nuevo.")
    finally:
        db.close()


async def confirmar_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manejador del comando /confirmar <code>"""
    chat_id = str(update.effective_chat.id)

    if not context.args:
        await update.message.reply_text(
            "⚠️ Por favor, proporciona el código de 6 dígitos.\n"
            "Ejemplo: `/confirmar 123456`",
            parse_mode="Markdown"
        )
        return

    code = context.args[0].strip()
    db = SessionLocal()
    try:
        # Buscar el TelegramUser con ese código de verificación
        tg_user = db.query(TelegramUser).filter(
            TelegramUser.telegram_chat_id == chat_id,
            TelegramUser.telegram_linking_code == code,
            TelegramUser.telegram_linking_code_expiration > datetime.utcnow()
        ).first()

        if not tg_user:
            await update.message.reply_text("❌ Código de vinculación inválido o expirado. Vuelve a solicitarlo con `/vincular`.")
            return

        # Buscar el usuario web de destino
        web_user = db.query(Usuario).filter(Usuario.email == tg_user.telegram_linking_email).first()
        if not web_user:
            await update.message.reply_text("❌ La cuenta que solicitaste vincular ya no se encuentra en el sistema.")
            return

        # Guardar el ID de la cuenta invitado temporal anterior para limpiarla
        old_guest_id = tg_user.usuario_id

        # Vincular
        tg_user.usuario_id = web_user.id
        tg_user.telegram_linking_code = None
        tg_user.telegram_linking_code_expiration = None
        tg_user.telegram_linking_email = None
        db.commit()

        # Limpiar el usuario invitado temporal anterior de la base de datos si es que correspondía
        try:
            old_guest = db.query(Usuario).filter(Usuario.id == old_guest_id).first()
            if old_guest and old_guest.email.endswith("@telegram.medicai") and old_guest.id != web_user.id:
                # Comprobar si tiene algún otro chat asociado antes de eliminar
                other_chat = db.query(TelegramUser).filter(TelegramUser.usuario_id == old_guest_id).first()
                if not other_chat:
                    db.delete(old_guest)
                    db.commit()
                    logger.info(f"Usuario invitado temporal {old_guest_id} eliminado de la base de datos.")
        except Exception as clean_err:
            logger.warning(f"No se pudo eliminar el usuario invitado temporal huérfano: {clean_err}")

        await update.message.reply_text(
            f"🎉 ¡Vinculación Exitosa!\n\n"
            f"Tu cuenta de Telegram ahora está vinculada a *{web_user.nombre}* (`{web_user.email}`).\n\n"
            f"Ya puedes realizar consultas médicas de MedicAI directamente desde aquí.",
            parse_mode="Markdown"
        )
    except Exception as e:
        logger.error(f"Error en comando /confirmar: {e}")
        db.rollback()
        await update.message.reply_text("❌ Ocurrió un error al confirmar el código. Inténtalo más tarde.")
    finally:
        db.close()


async def desvincular_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manejador del comando /desvincular"""
    chat_id = str(update.effective_chat.id)
    db = SessionLocal()
    try:
        tg_user = db.query(TelegramUser).filter(TelegramUser.telegram_chat_id == chat_id).first()
        if not tg_user:
            await update.message.reply_text("⚠️ No tienes ningún chat registrado.")
            return
            
        user = tg_user.usuario
        if not user or user.email.endswith("@telegram.medicai"):
            await update.message.reply_text("⚠️ No tienes ninguna cuenta vinculada actualmente.")
            return

        # Para volver al Modo Invitado, creamos un nuevo usuario Invitado temporal
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

        # Apuntar el bot al nuevo usuario invitado
        tg_user.usuario_id = guest_user.id
        db.commit()
        
        await update.message.reply_text(
            "🔓 Has desvinculado tu cuenta con éxito. Has vuelto al *Modo Invitado*."
        )
    except Exception as e:
        logger.error(f"Error en comando /desvincular: {e}")
        await update.message.reply_text("❌ Ocurrió un error al desvincular tu cuenta.")
    finally:
        db.close()


async def info_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manejador del comando /info"""
    chat_id = str(update.effective_chat.id)
    db = SessionLocal()
    try:
        tg_user = db.query(TelegramUser).filter(TelegramUser.telegram_chat_id == chat_id).first()
        if not tg_user:
            await update.message.reply_text("⚠️ No tienes ningún perfil registrado. Inicia el bot con /start.")
            return

        user = tg_user.usuario
        is_guest = user.email.endswith("@telegram.medicai") if user else True

        if is_guest:
            info_texto = (
                "ℹ️ *Información del Perfil - MedicAI:*\n\n"
                f"• *ID Chat:* `{chat_id}`\n"
                "• *Modo:* `Invitado (Sin cuenta web)`\n"
                f"• *Primer contacto:* {tg_user.fecha_registro.strftime('%d/%m/%Y')}\n\n"
                "💡 Vincula tu cuenta web usando `/vincular tu_correo@ejemplo.com` para sincronizar con tu historial clínico principal."
            )
        else:
            conversaciones_count = len(user.conversaciones)
            tokens_total = user.tokens_utilizados

            info_texto = (
                "ℹ️ *Información del Perfil - MedicAI:*\n\n"
                f"• *ID Chat:* `{chat_id}`\n"
                "• *Modo:* `Vinculado (Cuenta Oficial)`\n"
                f"• *Usuario:* {user.nombre}\n"
                f"• *Correo:* `{user.email}`\n"
                f"• *Conversaciones:* {conversaciones_count}\n"
                f"• *Tokens Utilizados:* {tokens_total} tokens\n"
                f"• *Vinculado el:* {tg_user.fecha_registro.strftime('%d/%m/%Y')}"
            )
        await update.message.reply_text(info_texto, parse_mode="Markdown")
    except Exception as e:
        logger.error(f"Error en comando /info: {e}")
        await update.message.reply_text("❌ Hubo un error al recuperar la información del perfil.")
    finally:
        db.close()


async def ayuda_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manejador del comando /ayuda"""
    ayuda_texto = (
        "🩺 *Comandos Disponibles en MedicAI:*\n\n"
        "• `/start` - Iniciar conversación y ver estado actual.\n"
        "• `/vincular correo@ejemplo.com` - Vincular tu cuenta de MedicAI.\n"
        "• `/confirmar CÓDIGO` - Confirmar el código OTP de verificación.\n"
        "• `/desvincular` - Desvincular tu cuenta y volver a Modo Invitado.\n"
        "• `/info` - Ver detalles de tu perfil y tokens consumidos.\n"
        "• `/ayuda` - Mostrar esta guía de ayuda.\n\n"
        "💬 *¿Cómo hablar conmigo?*\n"
        "Envía cualquier pregunta sobre salud, síntomas o información médica, o adjunta una foto nítida de un síntoma visible para una evaluación preliminar informativa."
    )
    await update.message.reply_text(ayuda_texto, parse_mode="Markdown")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manejador de mensajes de texto y fotos del chat"""
    chat_id = str(update.effective_chat.id)
    user_tg = update.effective_user
    username = user_tg.username if user_tg else None
    first_name = user_tg.first_name if user_tg else None
    last_name = user_tg.last_name if user_tg else None
    full_name = f"{first_name or ''} {last_name or ''}".strip() or None

    text_msg = update.message.text or update.message.caption or ""
    photo = update.message.photo

    # Si no hay texto ni foto, ignoramos
    if not text_msg and not photo:
        return

    # Enviar acción de "escribiendo" o "subiendo foto"
    await context.bot.send_chat_action(chat_id=chat_id, action="typing")

    db = SessionLocal()
    try:
        # Obtener o crear el usuario de Telegram
        tg_user = get_or_create_telegram_user(db, chat_id, username, full_name)
        user = tg_user.usuario

        # Buscar o crear la conversación dedicada del bot de Telegram
        conv = db.query(Conversacion).filter(
            Conversacion.usuario_id == user.id,
            Conversacion.titulo == "Chat de Telegram"
        ).order_by(Conversacion.fecha_creacion.desc()).first()

        if not conv:
            conv = Conversacion(usuario_id=user.id, titulo="Chat de Telegram")
            db.add(conv)
            db.commit()
            db.refresh(conv)

        # Historial de mensajes previos (últimos 15)
        mensajes_previos = (
            db.query(MensajeChat)
            .filter(MensajeChat.conversacion_id == conv.id)
            .order_by(MensajeChat.fecha_envio.asc())
            .all()
        )
        historial_ia = [{"role": m.role, "content": m.contenido} for m in mensajes_previos[-15:]]

        # Procesar foto si la hay
        base64_image = None
        if photo:
            largest_photo = photo[-1]
            file = await context.bot.get_file(largest_photo.file_id)
            file_url = file.file_path
            
            # Descargar archivo
            async with httpx.AsyncClient() as client:
                resp = await client.get(file_url)
                if resp.status_code == 200:
                    base64_image = base64.b64encode(resp.content).decode("utf-8")
                else:
                    await update.message.reply_text("⚠️ No pude descargar la imagen que enviaste. Por favor, intenta de nuevo.")
                    return

        # Generar respuesta de la IA
        respuesta_ia, tokens_usados = chat_service.responder(
            mensaje_actual=text_msg,
            historial=historial_ia,
            db=db,
            usuario_id=user.id,
            imagen=base64_image
        )

        # Registrar mensajes en la base de datos
        msg_user = MensajeChat(
            conversacion_id=conv.id,
            role="user",
            contenido=text_msg if text_msg else "Analiza esta imagen médica por favor.",
            imagen=base64_image,
            tokens=0
        )
        msg_bot = MensajeChat(
            conversacion_id=conv.id,
            role="assistant",
            contenido=respuesta_ia,
            tokens=tokens_usados
        )
        db.add(msg_user)
        db.add(msg_bot)
        db.commit()

        # Enviar respuesta al chat
        try:
            await update.message.reply_text(respuesta_ia, parse_mode="Markdown")
        except Exception:
            await update.message.reply_text(respuesta_ia)

    except Exception as e:
        logger.exception(f"Error procesando mensaje en bot de Telegram: {e}")
        await update.message.reply_text("🩺 Lo siento, experimenté una dificultad técnica temporal. Por favor, realiza tu pregunta de nuevo.")
    finally:
        db.close()


async def run_polling():
    """Bucle principal de ejecución del bot de Telegram en modo Polling"""
    global telegram_app
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN no configurado en el archivo .env")
        return

    logger.info("Iniciando bot de Telegram en segundo plano...")
    try:
        # Construir aplicación
        telegram_app = Application.builder().token(token).build()

        # Añadir manejadores
        telegram_app.add_handler(CommandHandler("start", start_command))
        telegram_app.add_handler(CommandHandler("vincular", vincular_command))
        telegram_app.add_handler(CommandHandler("confirmar", confirmar_command))
        telegram_app.add_handler(CommandHandler("desvincular", desvincular_command))
        telegram_app.add_handler(CommandHandler("info", info_command))
        telegram_app.add_handler(CommandHandler("ayuda", ayuda_command))
        
        # Manejador general de mensajes (texto y fotos)
        telegram_app.add_handler(
            MessageHandler(filters.TEXT | filters.PHOTO, handle_message)
        )

        # Inicializar y arrancar
        await telegram_app.initialize()

        # Configurar menú de comandos del Bot en Telegram
        try:
            menu_commands = [
                BotCommand("start", "Iniciar bot y ver estado"),
                BotCommand("vincular", "Vincular cuenta de MedicAI"),
                BotCommand("confirmar", "Confirmar el código OTP"),
                BotCommand("desvincular", "Desvincular cuenta web"),
                BotCommand("info", "Ver detalles del perfil y consumo de tokens"),
                BotCommand("ayuda", "Mostrar comandos y guía de uso")
            ]
            await telegram_app.bot.set_my_commands(menu_commands)
            logger.info("Menú de comandos configurado exitosamente en Telegram.")
        except Exception as cmd_err:
            logger.warning(f"No se pudo configurar el menú de comandos en Telegram: {cmd_err}")

        await telegram_app.start()
        await telegram_app.updater.start_polling(drop_pending_updates=True)
        
        logger.info("Bot de Telegram iniciado con éxito.")
        
        # Mantener vivo el bucle asíncrono
        while True:
            await asyncio.sleep(3600)
            
    except asyncio.CancelledError:
        logger.info("Deteniendo bot de Telegram...")
    except Exception as e:
        logger.exception(f"Falla crítica en el bot de Telegram: {e}")
    finally:
        if telegram_app:
            if telegram_app.updater and telegram_app.updater.running:
                await telegram_app.updater.stop()
            await telegram_app.stop()
            await telegram_app.shutdown()
            logger.info("Bot de Telegram apagado de forma segura.")


async def start_telegram_bot():
    """Función de arranque expuesta para ser llamada desde main.py"""
    global bot_task
    bot_task = asyncio.create_task(run_polling())


async def stop_telegram_bot():
    """Función de apagado expuesta para ser llamada desde main.py"""
    global bot_task
    if bot_task:
        bot_task.cancel()
        try:
            await bot_task
        except asyncio.CancelledError:
            pass
        bot_task = None
