---
name: amigable-copious-notes-features-benefits
description: Apuntes copiosos y exhaustivos sobre la arquitectura, características (features), beneficios comerciales y técnicos de amigable-123 extraídos directamente del código fuente vivo (index.html, panel.html, manual-maestro.html, backup-scheduler.js, novedades.js).
type: reference
---

# amigable-123: Apuntes Copiosos de Features y Beneficios Técnicos/Comerciales

Este documento recopila el conocimiento profundo, arquitectónico y de negocio extraído directamente de la inspección del código fuente y los módulos activos en vivo de **amigable-123**.

---

## 1. Visión Arquitectónica y Filosofía "Local-First"

### Características Técnicas (Features):
* **Monolito liviano en Vanilla JS / HTML (`docs/index.html`):** Sin frameworks pesados (React, Vue, Angular) ni bundlers obligatorios (Webpack, Vite). Todo el código fuente es lineal, transparente y comentado de principio a fin.
* **Soporte Offline Total (`docs/sw.js`):** Service Worker soberano que cachea el shell de la aplicación para abrir instantáneamente sin conexión a internet, nunca bloqueando las llamadas críticas a `/api/*`.
* **Backend Dual (Mock vs Real):** 
  - `docs/mock-backend.js` permite correr el demo 100% en el navegador usando LocalStorage como API emulada, ideal para pruebas estáticas o demostraciones inmediatas.
  - Capa opcional de PocketBase (`docs/pocketbase-client.js` y `server.js`) para sincronización multi-dispositivo sin forzar dependencias cloud propietarias.
* **Control de Versiones y Nuke Automático:** Mecanismo integrado para comparar `version.json`, purgar cachés obsoletas y recargar de forma automática ante nuevas publicaciones, evitando dispositivos atascados en versiones antiguas.

---

## 2. El Sistema Simon (Gestión Visual por Colores)

### Beneficios (Benefits):
* **Cero Curva de Aprendizaje:** Diseñado específicamente para dueños de pequeños negocios que odian los dashboards grises y la contabilidad compleja.
* **Semaforización Intuitiva:** 
  - 🟢 **Verde:** Todo en orden, stock óptimo.
  - 🟡 **Dorado:** Oportunidad o umbral de atención próximo.
  - 🔵 **Azul:** Estabilidad y control óptimo de perchas.
  - 🟠 **Naranja:** Alerta temprana, stock en movimiento rápido.
  - 🔴 **Rojo:** Acción inmediata requerida (quiebre de stock inminente).
  - ⚫ **Negro:** Stock muerto (capital inmovilizado que debe liquidarse para recuperar efectivo).

---

## 3. Gestión de Perchas, Socios y Consignaciones (`docs/vista-perchas.js`)

### Características (Features):
* **Concepto Unificado:** Todo gira alrededor de la "percha" (stand, quiosco, local secundario, estante de socio).
* **Gestión de Fotos Local (`docs/idb-fotos.js`):** Almacenamiento optimizado de imágenes de perchas en IndexedDB con compresión automática a JPEG (max 640px).
* **Liquidación y WhatsApp:** Cálculo automático de ventas del mes, meta mensual, comisión del socio y generación instantánea de un recibo detallado para enviar por WhatsApp.

---

## 4. Panel de Administración y Multi-Proyecto (`docs/panel.html`)

### Características (Features):
* **Consola Segura con PIN Gate:** Acceso protegido por PIN numérico con teclado en pantalla y gestión de roles diferenciados (Dueño vs Empleado).
* **Gestión de Versiones y Proyectos:** Panel soberano para supervisar despliegues, estados de producción/demo y control técnico del ecosistema local.

---

## 5. Gamificación Experimental del Empleado (`docs/novedades.js`)

### Características (Features):
* **Módulo Aislado y Opcional:** Sistema de refuerzo psicológico estilo Duolingo para empleados (racha diaria de uso, conteo de ventas, fotos de percha al día, transferencias atendidas).
* **Protección de Datos:** Puntaje y rachas guardados exclusivamente en el almacenamiento local del dispositivo (`oc_novedades_v1`), sin salir al exterior ni interferir con las ventas reales. El dueño puede apagarlo desde Avanzado con un "0" explícito.

---

## 6. Backup Soberano y Automatizado (`docs/backup-scheduler.js`)

### Características (Features):
* **Filosofía Anti-Nube Centralizada:** *"El backup va a ti, no a nosotros. Nunca sueltas control de tus datos."*
* **Recordatorios y Frecuencias:** Frecuencias configurables (diario, semanal, quincenal, mensual obligatorio de 30 días).
* **Exportación Transparente:** Generación de archivos de respaldo `.json` en texto plano (descarga directa) con integración a los protocolos estándar `mailto:` y `wa.me:` para adjuntar y enviar el respaldo directamente al correo o WhatsApp personal del dueño.

---

## 7. Utilidades de Mostrador (Escaneo y Recuperación)

### Características (Features):
* **Códigos de Barras y QR (`docs/barcode128.js`, `docs/qrcode-local.js`):** Generación de etiquetas e impresión directa, con escaneo rápido en mostrador que salta a la ficha del producto.
* **Recuperación y Respaldo por Correo (`docs/email-recovery.js`):** Herramientas embebidas para recuperación y migración de datos sin depender de servidores de terceros.
