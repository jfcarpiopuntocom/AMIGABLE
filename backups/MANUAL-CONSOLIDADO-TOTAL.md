# MANUAL CONSOLIDADO Y RESUMEN TOTAL — AMIGABLE-123
*Fecha de generación: 2026-07-24*
*Proyecto:* `amigable-123` (PWA de gestión visual, inventario y perchas - Sistema Simon)

---

## 1. Visión General del Proyecto & Identidad
* **Nombre:** `amigable-123`
* **Eslogan:** *"Deja de adivinar. Empieza a ver."*
* **Filosofía:** Reemplaza el cuaderno y las planillas de Excel con el **Sistema Simon** (gestión a color: Verde, Dorado, Naranja, Rojo, Negro). No es un POS tradicional, es una herramienta anti-contador para pequeños comercios, boutiques, librerías, ferias y fábricas artesanales.
* **Arquitectura:** 100% Local-First. Un solo archivo HTML y JS vanilla en `docs/`. Sin servidores que pagar, sin dependencias pesadas, sin suscripciones mensuales. Service Worker + LocalStorage para funcionamiento offline.
* **Modelo de Precios Validados:**
  - **Versión Gratuita (Micro-negocios):** Hasta 25 ítems, 100 ventas al mes y 1 empleado (ideal para negocios de régimen popular).
  - **Licencia Estándar Global:** $399 USD pago único de por vida.
  - **Licencia Regional LatAm:** $199 USD (verificado por cédula/documento local).
  - **Estrategia B2B de Volumen:** Ventas por lotes (packs de 100 a 1,000+ licencias) a cámaras de comercio, asociaciones de artesanos y gremios.

---

## 2. Inventario Completo de Archivos Creados en esta Sesión

Todos los archivos han sido generados y respaldados en tu espacio de trabajo de `C:\00 Projects\AMIGABLE`:

### A. Memoria y Contexto
1. **`memory/amigable-project.md`** — Contexto persistente de la PWA, precios y audiencia.
2. **`memory/MEMORY.md`** — Índice de memorias del proyecto.

### B. Marketing y Estrategia Comercial (`marketing/`)
3. **`marketing/estrategia-ventas.md`** — Posicionamiento, USP y funnel de conversión.
4. **`marketing/copys-email-frio.md`** — Plantillas de correo para dueños de tiendas (enfoque anti-cuaderno / anti-Excel).
5. **`marketing/posts-linkedin-twitter.md`** — Hilos y publicaciones para LinkedIn / X (Build in Public y arquitectura).
6. **`marketing/roadmap-operativo-diario.md`** — Rutina cron para prospección y outreach diario.
7. **`marketing/guia-maestra-despliegue.md`** — Manual paso a paso para subir a GitHub y correr el servidor local (`python -m http.server 8736 --directory docs`).
8. **`marketing/contexto-y-feedback-real.md`** — Integración del feedback de pruebas reales (caso Cris Lituma: "locales = perchas") y eslogan oficial.
9. **`marketing/propuesta-b2b-camaras.md`** — Propuesta de valor corporativa para cámaras de comercio y gremios artesanales.
10. **`marketing/correo-b2b-camaras.md`** — Correo formal de acercamiento a directores de cámaras.

### C. Código e Integraciones Técnicas (`integrations/` y `skills/`)
11. **`integrations/smtp_mailer.py`** — Script en Python listo para conectar SMTP (Gmail/SendGrid) y disparar correos fríos y propuestas B2B de forma automatizada.
12. **`integrations/lead_scraper_integration.py`** — Estructura base para conectar fuentes y APIs de directorios comerciales.
13. **`.aionrs/skills/amigable-sales-ops/SKILL.md`** — Skill empaquetado para AionUi con flujos de venta y outreach.
14. **`.aionrs/skills/amigable-sales-ops/references/objeciones.md`** — Manejo de objeciones comunes de clientes ("Ya uso Excel", "¿Por qué pago único?").
15. **`.aionrs/skills/amigable-sales-ops/scripts/lead_manager.py`** — CLI local en Python para registrar y gestionar el pipeline de leads en JSON.

### D. Historial de Backups y Snapshots por Hora (`backups/`)
16. **`backups/backup-2026-07-24.md`** — Snapshot 1 (Fundamentos y Playbooks).
17. **`backups/backup-2026-07-24-snapshot-2.md`** — Snapshot 2 (Guía Maestra de Despliegue).
18. **`backups/backup-2026-07-24-snapshot-3.md`** — Snapshot 3 (Feedback Real y Contexto).
19. **`backups/backup-2026-07-24-snapshot-4.md`** — Snapshot 4 (Propuesta B2B Cámaras).
20. **`backups/backup-2026-07-24-snapshot-5.md`** — Snapshot 5 (Scripts SMTP y Scraper).
21. **`backups/MANUAL-CONSOLIDADO-TOTAL.md`** — Este archivo maestro definitivo.

---

## 3. Instrucciones Rápidas para Retomar en Otra Sesión
Si necesitas abrir una nueva sesión o transferir este proyecto a otro entorno:
1. Sube toda la carpeta `C:\00 Projects\AMIGABLE` a tu repositorio de GitHub mediante los comandos indicados en `marketing/guia-maestra-despliegue.md`.
2. Lee `memory/amigable-project.md` para recuperar el contexto exacto del producto.
3. Ejecuta tus scripts de integración en `integrations/` para continuar con la automatización de ventas y envíos SMTP.
