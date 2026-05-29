import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("medicai.email")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

# URL del Frontend para enlaces (por defecto local)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _enviar_smtp(destinatario: str, asunto: str, html_content: str):
    """
    Envía un correo electrónico de forma síncrona conectándose por SMTP.
    Si no hay credenciales configuradas, imprime el correo en los logs para testing local.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning(
            f"\n=== [TESTING LOCAL - CORREO NO ENVIADO (Faltan variables SMTP en .env)] ===\n"
            f"Para: {destinatario}\n"
            f"Asunto: {asunto}\n"
            f"Contenido (HTML preliminar):\n"
            f"----------------------------------------\n"
            f"{html_content}\n"
            f"=========================================================================\n"
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = asunto
        msg["From"] = SMTP_FROM
        msg["To"] = destinatario

        part_html = MIMEText(html_content, "html", "utf-8")
        msg.attach(part_html)

        # Conectar al servidor
        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            server.starttls()

        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, destinatario, msg.as_string())
        server.quit()
        logger.info(f"Correo electrónico enviado con éxito a {destinatario}")
        return True
    except Exception as e:
        logger.error(f"Error al enviar correo SMTP a {destinatario}: {e}")
        return False


def enviar_correo_verificacion(destinatario: str, nombre: str, codigo: str):
    """
    Envía el correo de verificación con un código OTP de 6 dígitos.
    """
    asunto = "🩺 Código de Verificación de tu Cuenta - MedicAI"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifica tu Cuenta</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f7fb;
                margin: 0;
                padding: 0;
                color: #334155;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
            }}
            .header {{
                background: linear-gradient(135deg, #2563eb, #06b6d4);
                padding: 40px 20px;
                text-align: center;
                color: #ffffff;
            }}
            .header h1 {{
                margin: 10px 0 0 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }}
            .content {{
                padding: 40px 30px;
                line-height: 1.6;
                text-align: center;
            }}
            .content p {{
                margin: 0 0 20px 0;
                font-size: 16px;
                text-align: left;
            }}
            .code-container {{
                background-color: #f1f5f9;
                border-radius: 16px;
                padding: 20px;
                margin: 30px auto;
                max-width: 240px;
                border: 2px dashed #cbd5e1;
                text-align: center;
            }}
            .code {{
                font-family: 'Courier New', Courier, monospace;
                font-size: 38px;
                font-weight: 900;
                letter-spacing: 6px;
                color: #1e3a8a;
                margin: 0;
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 24px;
                text-align: center;
                font-size: 13px;
                color: #64748b;
                border-top: 1px solid #f1f5f9;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MedicAI</h1>
            </div>
            <div class="content">
                <p>Hola, <strong>{nombre}</strong>,</p>
                <p>¡Gracias por registrarte en MedicAI! Para completar la creación de tu cuenta y poder ingresar al sistema, por favor introduce el siguiente código de verificación de 6 dígitos en la aplicación:</p>
                <div class="code-container">
                    <h2 class="code">{codigo}</h2>
                </div>
                <p style="text-align: center; font-size: 14px; color: #64748b;">Este código de confirmación expirará en 24 horas.</p>
                <p>Si no solicitaste el registro de esta cuenta, puedes ignorar este mensaje con total tranquilidad.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MedicAI. Todos los derechos reservados.</p>
                <p>Asistente de salud inteligente y triaje asistido por IA.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return _enviar_smtp(destinatario, asunto, html)


def enviar_correo_recuperacion(destinatario: str, nombre: str, token: str):
    """
    Envía el correo de recuperación con una plantilla premium y responsive.
    """
    enlace_recuperacion = f"{FRONTEND_URL}/reset-password?token={token}"
    
    asunto = "🔑 Restablece tu contraseña - MedicAI"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f7fb;
                margin: 0;
                padding: 0;
                color: #334155;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
            }}
            .header {{
                background: linear-gradient(135deg, #0f172a, #334155);
                padding: 40px 20px;
                text-align: center;
                color: #ffffff;
            }}
            .header h1 {{
                margin: 10px 0 0 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }}
            .content {{
                padding: 40px 30px;
                line-height: 1.6;
            }}
            .content p {{
                margin: 0 0 20px 0;
                font-size: 16px;
            }}
            .btn-container {{
                text-align: center;
                margin: 35px 0;
            }}
            .btn {{
                background: linear-gradient(135deg, #0f172a, #1e293b);
                color: #ffffff !important;
                text-decoration: none;
                padding: 16px 36px;
                border-radius: 14px;
                font-weight: bold;
                font-size: 16px;
                display: inline-block;
                box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
                transition: all 0.3s ease;
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 24px;
                text-align: center;
                font-size: 13px;
                color: #64748b;
                border-top: 1px solid #f1f5f9;
            }}
            .link-alt {{
                word-break: break-all;
                color: #2563eb;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MedicAI</h1>
            </div>
            <div class="content">
                <p>Hola, <strong>{nombre}</strong>,</p>
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en MedicAI. Para proceder, haz clic en el botón que verás a continuación:</p>
                <div class="btn-container">
                    <a href="{enlace_recuperacion}" class="btn">Restablecer mi Contraseña</a>
                </div>
                <p>Este enlace expirará en 1 hora por razones de seguridad.</p>
                <p>Si el botón no funciona, también puedes copiar y pegar el siguiente enlace en tu navegador:</p>
                <p class="link-alt">{enlace_recuperacion}</p>
                <p>Si no solicitaste este cambio, puedes ignorar este correo con total tranquilidad; tu contraseña actual seguirá funcionando de forma segura.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MedicAI. Todos los derechos reservados.</p>
                <p>Asistente de salud inteligente y triaje asistido por IA.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return _enviar_smtp(destinatario, asunto, html)


def enviar_correo_vinculacion_telegram(destinatario: str, nombre: str, codigo: str):
    """
    Envía el correo de verificación OTP para vincular la cuenta a Telegram.
    """
    asunto = "🤖 Vincula tu cuenta de MedicAI con Telegram"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vinculación de Telegram</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f7fb;
                margin: 0;
                padding: 0;
                color: #334155;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
            }}
            .header {{
                background: linear-gradient(135deg, #7c3aed, #4f46e5);
                padding: 40px 20px;
                text-align: center;
                color: #ffffff;
            }}
            .header h1 {{
                margin: 10px 0 0 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }}
            .content {{
                padding: 40px 30px;
                line-height: 1.6;
                text-align: center;
            }}
            .content p {{
                margin: 0 0 20px 0;
                font-size: 16px;
                text-align: left;
            }}
            .code-container {{
                background-color: #f5f3ff;
                border-radius: 16px;
                padding: 20px;
                margin: 30px auto;
                max-width: 240px;
                border: 2px dashed #c084fc;
                text-align: center;
            }}
            .code {{
                font-family: 'Courier New', Courier, monospace;
                font-size: 38px;
                font-weight: 900;
                letter-spacing: 6px;
                color: #6b21a8;
                margin: 0;
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 24px;
                text-align: center;
                font-size: 13px;
                color: #64748b;
                border-top: 1px solid #f1f5f9;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MedicAI - Telegram Bot</h1>
            </div>
            <div class="content">
                <p>Hola, <strong>{nombre}</strong>,</p>
                <p>Hemos recibido una solicitud para vincular tu cuenta de MedicAI con tu cuenta de Telegram.</p>
                <p>Por favor, ingresa el siguiente código de verificación de 6 dígitos en tu chat con el bot de Telegram:</p>
                <div class="code-container">
                    <h2 class="code">{codigo}</h2>
                </div>
                <p style="text-align: center; font-size: 14px; color: #64748b;">Este código de confirmación expirará en 15 minutos.</p>
                <p>Si no fuiste tú quien solicitó vincular la cuenta, puedes ignorar este correo sin ningún problema.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MedicAI. Todos los derechos reservados.</p>
                <p>Asistente de salud inteligente y triaje asistido por IA.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return _enviar_smtp(destinatario, asunto, html)

