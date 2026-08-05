import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_b2b_email(sender_email, sender_password, recipient_email, chamber_name):
    """
    Envía un correo de acercamiento B2B utilizando SMTP (Gmail, SendGrid, etc.)
    """
    subject = f"Digitalización sin suscripciones para los agremiados de {chamber_name} / amigable-123"
    
    body = f"""Estimado/a Director/a de {chamber_name},

Le escribo desde el equipo de amigable-123, un sistema visual de control de inventario y perchas para pequeños comerciantes y artesanos.

Nuestra app reemplaza el cuaderno y el Excel con el Sistema Simon (a color, sin contadores ni curvas de aprendizaje), mediante un modelo de pago único sin suscripciones mensuales.

Puede revisar el demo interactivo aquí: https://jfcarpiopuntocom.github.io/AMIGABLE/

¿Tendría 10 minutos la próxima semana para conversar sobre una alianza por lotes para sus agremiados?

Un saludo cordial,
Equipo amigable-123
"""

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = recipient_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Configuración por defecto para servidor SMTP (ej. Gmail port 587 o SendGrid)
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, recipient_email, text)
        server.quit()
        print(f"[EXITO] Correo B2B enviado correctamente a {recipient_email}")
        return True
    except Exception as e:
        print(f"[ERROR] No se pudo enviar el correo: {e}")
        return False

if __name__ == "__main__":
    print("Módulo de integración SMTP para amigable-123 cargado.")
    print("Uso: import send_b2b_email y pasar credenciales SMTP.")
