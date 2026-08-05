# AMIGABLE-123: ARCHIVO MAESTRO COMPLETO Y FORTIFICADO (TODO EN UNO)
*Proyecto:* `amigable-123` (PWA de gestión visual, inventario y perchas - Sistema Simon)
*Eslogan Oficial:* "Deja de adivinar. Empieza a ver."
*Demo público:* https://jfcarpiopuntocom.github.io/AMIGABLE/
*Manual de usuario oficial (Web):* `docs/manual-maestro.html` (Verificado de app en vivo)

---

## TABLA DE CONTENIDOS
1. [Manifiesto y Propuesta de Valor (Core)](#1-manifiesto-y-propuesta-de-valor-core)
2. [Arquitectura Técnica y Estructura de Archivos (En Vivo)](#2-arquitectura-técnica-y-estructura-de-archivos-en-vivo)
3. [El Sistema Simon y Colores Oficiales](#3-el-sistema-simon-y-colores-oficiales)
4. [Estrategia de Precios y Licenciamiento](#4-estrategia-de-precios-y-licenciamiento)
5. [Feedback del Terreno y Aprendizajes (Caso Cris Lituma)](#5-feedback-del-terreno-y-aprendizajes-caso-cris-lituma)
6. [Playbook de Ventas y Correos Fríos (Copys)](#6-playbook-de-ventas-y-correos-fríos-copys)
7. [Estrategia y Copys para Redes Sociales (LinkedIn / X)](#7-estrategia-y-copys-para-redes-sociales-linkedin--x)
8. [Estrategia y Propuesta B2B para Cámaras de Comercio y Gremios](#8-estrategia-y-propuesta-b2b-para-cámaras-de-comercio-y-gremios)
9. [Scripts Técnicos de Integración (Python SMTP & Leads)](#9-scripts-técnicos-de-integración-python-smtp--leads)
10. [CLI de Gestión de Leads (Python)](#10-cli-de-gestión-de-leads-python)
11. [Skill de AionUi (`amigable-sales-ops`)](#11-skill-de-aionui-amigable-sales-ops)

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
* **Perchas y comisiones:** Múltiples ubicaciones con socios, sus metas y escalas de comisión. Liquida con recibo detallado por WhatsApp. (Nota clave del terreno: **Locales = Perchas**).
* **P&L del dueño:** Margen bruto, costos operativos prorrateados, valuación de inventario. Matemática honesta.
* **Códigos QR y de barras:** Impresión de etiquetas y escaneo directo en el mostrador que lleva a la ficha del producto.
* **Historial con hash:** Movimientos de stock encadenados. Si alguien manipula el log, se nota.
* **Offline-first:** Service worker (`sw.js`) + localStorage. Funciona sin internet y sincroniza al reconectarse.
* **Bilingüe (ES/EN):** Todo traducido.

---

## 2. Arquitectura Técnica y Estructura de Archivos (En Vivo)

Basado en la inspección de los archivos reales en `docs/`:
* **`docs/index.html`**: La aplicación completa, monolítica en HTML y JS vanilla. Cero frameworks pesados ni bundlers necesarios.
* **`docs/manual-maestro.html`**: El manual de usuario definitivo en la web (estilo Sinclair Bloom x Kyoto Muted, barra de progreso, diseño Sinclair/Simon impecable).
* **`docs/simon-config.js`**: Configuración central del motor de colores Simon y umbrales de stock.
* **`docs/avanzado-extra.js`**: Funciones avanzadas de exportación, reportes y herramientas extra para el usuario avanzado.
* **`docs/mock-backend.js`**: API emulada en el navegador para correr 100% offline sin necesidad de Node/PocketBase en pruebas.
* **`docs/sw.js`**: Service worker para soporte offline total y caché de recursos.
* **`docs/email-recovery.js`**: Sistema de respaldo y recuperación por correo.
* **`docs/barcode128.js`**: Librería de generación y lectura de códigos de barras / QR.

---

## 3. El Sistema Simon y Colores Oficiales

Extraídos directamente de las variables CSS de la aplicación operativa (`manual-maestro.html` / `index.html`):
* **Fondo / Papel:** `#FFFFFF` (Blanco puro), `--crema: #F8F9FB`
* **Tinta / Texto:** `--ink: #0F1923`, `--ink-soft: #2C3E50`
* **Colores Simon:**
  * **Verde:** `--sim-verde: #00C87A`, `--sim-verde-bg: #C0F5E0`
  * **Amarillo:** `--sim-amarillo: #FFC700`, `--sim-amarillo-bg: #FFF3C2`
  * **Plata:** `--sim-plata: #C4CDD8`, `--sim-plata-bg: #E8ECF2`
  * **Naranja:** `--sim-naranja: #F97316`, `--sim-naranja-bg: #FDD9BE`
  * **Rojo:** `--sim-rojo: #E8365D`, `--sim-rojo-bg: #FAD5DE`
  * **Azul:** `--sim-azul: #5294AC`, `--sim-azul-bg: #D4ECF5`
  * **Negro:** `--sim-negro: #0A0A0F`, `--sim-negro-bg: #17171D`

---

## 4. Estrategia de Precios y Licenciamiento

* **Versión Gratuita (Micro-negocios):** Gratis para negocios de régimen popular (hasta 25 ítems, hasta 100 ventas al mes y hasta 1 empleado). Remueve la fricción inicial y engancha a los pequeños negocios del cuaderno.
* **Licencia Estándar Global:** **$399 USD** pago único de por vida (actualizaciones y soporte incluido).
* **Licencia Regional LatAm:** **$199 USD** (verificado por cédula o documento nacional equivalente de un país latinoamericano). Mismo producto, ajuste por poder adquisitivo.
* **Estrategia B2B / Gremios:** Deals por volumen (packs de 100, 500 o 1,000 licencias) para cámaras de comercio y asociaciones artesanales.

---

## 5. Feedback del Terreno y Aprendizajes (Caso Cris Lituma)

* **Interacción real:** Cris Lituma (fábrica / negocio estable) exploró el app en la opción de dueño.
* **Fricción detectada y resuelta:** No era obvio cómo cambiar el nombre de los locales. *Regla de oro descubierta en vivo:* En amigable-123, **Locales = Perchas**, y todo gira alrededor de la percha. Esto se integra directamente en los tutoriales y explicaciones.
* **Trato de "Bestie Histórica":** Licencia activada a cambio de feedback y futuros testimoniales/reviews valiosos.

---

## 6. Playbook de Ventas y Correos Fríos (Copys)

### Opción 1: Enfoque "Adiós al Cuaderno y Excel" (Para Tiendas y Boutiques)
**Asunto:** ¿Sigues anotando el inventario de [Nombre de la Tienda] en un cuaderno o Excel?

Hola [Nombre del Dueño],
Estuve viendo [Nombre de la Tienda] y me pareció increíble. Una pregunta rápida: cuando necesitas saber qué producto se está acabando, ¿tienes que revisar un cuaderno, mandar un WhatsApp a la bodega o pelearte con una planilla de Excel llena de números grises?

La mayoría del software trata al dueño como contador. **amigable-123** es lo contrario. Un panel ultra rápido basado en el **Sistema Simon** (a puro color: verde, dorado, naranja, rojo, negro). Sin suscripciones mensuales ($399 global / $199 LatAm, pago único de por vida).

Pruébalo sin registro aquí: https://jfcarpiopuntocom.github.io/AMIGABLE/
¿Te interesaría ver cómo funciona en 5 minutos?

### Manejo de Objeciones
1. **"Ya uso Excel y es gratis"** -> Excel no te avisa con colores en el mostrador, no encadena los movimientos de inventario con hash a prueba de manipulación, y no genera el recibo de WhatsApp para tus socios de percha en un toque.
2. **"¿Por qué pago único y no suscripción?"** -> Porque odiamos las rentas mensuales por software básico. Pagas una vez, descargas tu PWA y es tuya para siempre.

---

## 7. Estrategia y Copys para Redes Sociales (LinkedIn / X)

**Post (Build in Public & Arquitectura):**
La mayoría del software para pequeños negocios trata al dueño como si fuera contador. Planillas con 50 columnas y dashboards grises. Por eso creamos **amigable-123**.
Sin servidores. Sin suscripciones mensuales de $49/mes. 
¿Cómo funciona? A color (Sistema Simon). Cero manual.
¿Cómo está hecho? Un solo archivo HTML con JS vanilla en `docs/`, cero bundlers, service worker (`sw.js`) + localStorage para modo offline.
Precio único: $399 USD ($199 en LatAm). Pagas una vez, es tuyo para siempre.
Demo: https://jfcarpiopuntocom.github.io/AMIGABLE/

---

## 8. Estrategia y Propuesta B2B para Cámaras de Comercio y Gremios

* **Propuesta:** Proveer a los agremiados (artesanos, pequeños comerciantes y fábricas) de una herramienta 100% propia sin suscripciones.
* **Correo de Acercamiento B2B:**
  * **Asunto:** Digitalización sin suscripciones para los agremiados de [Nombre de la Cámara] / amigable-123
  * *Texto:* Enfoque en eliminar el dolor de cabeza de las suscripciones mensuales abusivas ($30-$100/mes) ofreciendo packs por volumen (100 a 1,000 licencias) con pago único de por vida.

---

## 9. Scripts Técnicos de Integración (Python SMTP & Leads)

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

---

## 10. CLI de Gestión de Leads (Python)

```python
import os
import json
from datetime import datetime

LEADS_FILE = "leads_pipeline.json"

def init_pipeline():
    if not os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)

def add_lead(store_name, contact_email, country, status="Nuevo"):
    init_pipeline()
    with open(LEADS_FILE, "r", encoding="utf-8") as f:
        leads = json.load(f)
    
    lead = {
        "store_name": store_name,
        "email": contact_email,
        "country": country,
        "status": status,
        "created_at": datetime.now().isoformat()
    }
    leads.append(lead)
    
    with open(LEADS_FILE, "w", encoding="utf-8") as f:
        json.dump(leads, f, indent=2)
    print(f"Lead añadido: {store_name} ({country})")

if __name__ == "__main__":
    print("AMIGABLE CLI Sales Tracker listo.")
```

---

## 11. Skill de AionUi (`amigable-sales-ops`)

* **Frontmatter:**
```yaml
name: amigable-sales-ops
description: Operaciones de venta, outreach, prospección y soporte para la PWA AMIGABLE de pago único ($399 USD global / $199 USD LatAm).
```
* **Ubicación:** `C:\00 Projects\AMIGABLE\.aionrs\skills\amigable-sales-ops\SKILL.md`
