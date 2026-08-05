# SESION-WORK-LOG-2026-07-24.md
*Proyecto:* `amigable-123` (PWA de gestión visual, inventario y perchas - Sistema Simon)
*Eslogan:* "Deja de adivinar. Empieza a ver."
*Demo público:* https://jfcarpiopuntocom.github.io/AMIGABLE/
*Nota importante:* El manual oficial de usuario de la app se encuentra en `docs/manual-maestro.html` (o `manual-maestro.html`). Este archivo es el **registro de trabajo interno y estrategia comercial** de nuestra sesión.

---

## ÍNDICE DE CONTENIDOS
1. [Manifiesto y Propuesta de Valor (Core)](#1-manifiesto-y-propuesta-de-valor-core)
2. [Estrategia de Precios y Licenciamiento](#2-estrategia-de-precios-y-licenciamiento)
3. [Feedback del Terreno y Aprendizajes (Caso Cris Lituma)](#3-feedback-del-terreno-y-aprendizajes-caso-cris-lituma)
4. [Playbook de Ventas y Correo Frío](#4-playbook-de-ventas-y-correo-frío)
5. [Estrategia y Copys para Redes Sociales (LinkedIn / X)](#5-estrategia-y-copys-para-redes-sociales-linkedin--x)
6. [Estrategia B2B para Cámaras de Comercio y Gremios](#6-estrategia-b2b-para-cámaras-de-comercio-y-gremios)
7. [Scripts Técnicos e Integraciones (Python SMTP & Scraper)](#7-scripts-técnicos-e-integraciones-python-smtp--scraper)

---

## 1. Manifiesto y Propuesta de Valor (Core)

La mayoría del software para pequeños negocios trata al dueño como si fuera contador. Planillas, dashboards grises, tablas con decenas de columnas — el tipo de herramienta que te hace sentir que estás haciendo tarea en lugar de administrando tu tienda.

**amigable-123** es lo contrario. Cada producto en tu estante tiene un color. 
* 🟢 **Verde:** todo bien.
* 🟡 **Dorado:** oportunidad.
* 🟠 **Naranja:** actúa pronto.
* 🔴 **Rojo:** actúa ya.
* ⚫ **Negro:** stock muerto — hora de moverlo.

Sin manual. Sin capacitación. Ves los colores y sabes qué hacer. Eso es el **Sistema Simon**.

### Qué es y Qué hace
* **PWA sin servidor:** Corre completamente en el navegador. Sin servidor que pagar, sin suscripción mensual, sin cuenta que crear. Comparte un enlace, ábrelo en cualquier teléfono, y tienes un panel funcionando.
* **Inventario con pulso:** Cada producto lleva un estado en vivo calculado desde umbrales configurados una sola vez.
* **Vender con un toque:** Grilla de productos hecha para el mostrador, no para un flujo de pago pesado.
* **Perchas y comisiones:** Múltiples ubicaciones con socios, sus metas y escalas de comisión. Liquida con recibo detallado por WhatsApp. (Nota clave: *Locales = Perchas*).
* **P&L del dueño:** Margen bruto, costos operativos prorrateados, valuación de inventario. Matemática honesta.
* **Códigos QR y de barras:** Impresión de etiquetas y escaneo directo en el mostrador que lleva a la ficha del producto.
* **Historial con hash:** Movimientos de stock encadenados. Si alguien manipula el log, se nota.
* **Offline-first:** Service worker + localStorage. Funciona sin internet y sincroniza al reconectarse.
* **Bilingüe (ES/EN):** Todo traducido.

---

## 2. Estrategia de Precios y Licenciamiento

* **Versión Gratuita (Micro-negocios):** Gratis para negocios de régimen popular (hasta 25 ítems, hasta 100 ventas al mes y hasta 1 empleado). Remueve la fricción inicial y engancha a los pequeños negocios del cuaderno.
* **Licencia Estándar Global:** **$399 USD** pago único de por vida (actualizaciones y soporte incluido).
* **Licencia Regional LatAm:** **$199 USD** (verificado por cédula o documento nacional equivalente de un país latinoamericano). Mismo producto, ajuste por poder adquisitivo.
* **Estrategia B2B / Gremios:** Deals por volumen (packs de 100, 500 o 1,000 licencias) para cámaras de comercio y asociaciones artesanales.

---

## 3. Feedback del Terreno y Aprendizajes (Caso Cris Lituma)

* **Interacción real:** Cris Lituma (fábrica / negocio estable) exploró el app en la opción de dueño.
* **Fricción detectada y resuelta:** No era obvio cómo cambiar el nombre de los locales. *Regla de oro:* En amigable-123, **Locales = Perchas**, y todo gira alrededor de la percha. Esto se integra directamente en los tutoriales y en el manual maestro (`manual-maestro.html`).
* **Trato de "Bestie Histórica":** Licencia activada a cambio de feedback y futuros testimoniales/reviews valiosos.

---

## 4. Playbook de Ventas y Correo Frío

### Opción 1: Enfoque "Adiós al Cuaderno y Excel" (Para Tiendas y Boutiques)
**Asunto:** ¿Sigues anotando el inventario de [Nombre de la Tienda] en un cuaderno o Excel?

Hola [Nombre del Dueño],
Estuve viendo [Nombre de la Tienda] y me pareció increíble. Una pregunta rápida: cuando necesitas saber qué producto se está acabando, ¿tienes que revisar un cuaderno, mandar un WhatsApp a la bodega o pelearte con una planilla de Excel llena de números grises?

La mayoría del software trata al dueño como contador. **amigable-123** es lo contrario. Un panel ultra rápido basado en el **Sistema Simon** (a puro color: verde, dorado, naranja, rojo, negro). Sin suscripciones mensuales ($399 global / $199 LatAm, pago único de por vida).

Pruébalo sin registro aquí: https://jfcarpiopuntocom.github.io/AMIGABLE/
¿Te interesaría ver cómo funciona en 5 minutos?

---

## 5. Estrategia y Copys para Redes Sociales (LinkedIn / X)

**Post (Build in Public & Arquitectura):**
La mayoría del software para pequeños negocios trata al dueño como si fuera contador. Planillas con 50 columnas y dashboards grises. Por eso creamos **amigable-123**.
Sin servidores. Sin suscripciones mensuales de $49/mes. 
¿Cómo funciona? A color (Sistema Simon). Cero manual.
¿Cómo está hecho? Un solo archivo HTML con JS vanilla en `docs/`, cero bundlers, service worker + localStorage para modo offline.
Precio único: $399 USD ($199 en LatAm). Pagas una vez, es tuyo para siempre.
Demo: https://jfcarpiopuntocom.github.io/AMIGABLE/

---

## 6. Estrategia B2B para Cámaras de Comercio y Gremios

* **Propuesta:** Proveer a los agremiados (artesanos, pequeños comerciantes y fábricas) de una herramienta 100% propia sin suscripciones.
* **Correo de Acercamiento B2B:**
  * **Asunto:** Digitalización sin suscripciones para los agremiados de [Nombre de la Cámara] / amigable-123
  * *Texto:* Enfoque en eliminar el dolor de cabeza de las suscripciones mensuales abusivas ($30-$100/mes) ofreciendo packs por volumen (100 a 1,000 licencias) con pago único de por vida.

---

## 7. Scripts Técnicos e Integraciones (Python SMTP & Scraper)

### A. Módulo de Envío SMTP (`integrations/smtp_mailer.py`)
```python
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_b2b_email(sender_email, sender_password, recipient_email, chamber_name):
    subject = f"Digitalización sin suscripciones para los agremiados de {chamber_name} / amigable-123"
    body = f"""Estimado/a Director/a de {chamber_name},
Le escribo desde el equipo de amigable-123, un sistema visual de control de inventario y perchas para pequeños comerciantes y artesanos.
Nuestra app reemplaza el cuaderno y el Excel con el Sistema Simon (a color, sin contadores), mediante un modelo de pago único sin suscripciones.
Demo interactivo: https://jfcarpiopuntocom.github.io/AMIGABLE/
¿Tendría 10 minutos la próxima semana para conversar sobre una alianza por lotes?
Un saludo cordial,
Equipo amigable-123
"""
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = recipient_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()
        print(f"[EXITO] Correo enviado a {recipient_email}")
        return True
    except Exception as e:
        print(f"[ERROR] {e}")
        return False
```

### B. Módulo de Scraping y Leads de Cámaras (`integrations/lead_scraper_integration.py`)
```python
import urllib.request
import json

def fetch_external_leads_demo():
    print("[INFO] Conectando con fuentes de directorios comerciales...")
    sample_leads = [
        {"store": "Artesanías Andinas", "contact": "info@artesaniasandinas.example", "country": "Ecuador"},
        {"store": "Librería El Ateneo Local", "contact": "ventas@ateneolocal.example", "country": "Argentina"}
    ]
    return sample_leads

if __name__ == "__main__":
    leads = fetch_external_leads_demo()
    print(json.dumps(leads, indent=2))
```
