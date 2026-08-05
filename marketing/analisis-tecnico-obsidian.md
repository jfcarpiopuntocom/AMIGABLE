---
name: analisis-tecnico-amigable-123-maestro
description: Reporte técnico y comercial maestro, profundo y deslumbrante de amigable-123, enriquecido con la inspección de todos los archivos del nucleo (crypto-store, vista-perchas, email-recovery, mock-backend, sw, qrcode, barcode128, etc.).
type: reference
---

# 🛡️ amigable-123: Análisis Técnico y Comercial Maestro
> **Arquitectura Local-First, Criptografía de Grado Bancario y Operación Autónoma**  
> *Eslogan Oficial:* "Deja de adivinar. Empieza a ver."  
> *Demo público:* [https://jfcarpiopuntocom.github.io/AMIGABLE/](https://jfcarpiopuntocom.github.io/AMIGABLE/)

---

## 📊 Tabla de Contenidos
1. [Arquitectura Criptográfica y Seguridad Local-First (`crypto-store.js`)](#1-arquitectura-criptográfica-y-seguridad-local-first-crypto-storejs)
2. [Gestión de Perchas, Socios y Multimedia (`vista-perchas.js` + `idb-fotos.js`)](#2-gestión-de-perchas-socios-y-multimedia-vista-perchasjs--idb-fotosjs)
3. [Filosofía Anti-Nube y Recuperación Autónoma (`email-recovery.js`)](#3-filosofía-anti-nube-y-recuperación-autónoma-email-recoveryjs)
4. [Códigos de Barras y Códigos QR Locales (`barcode128.js` + `qrcode-local.js`)](#4-códigos-de-barras-y-códigos-qr-locales-barcode128js--qrcode-localjs)
5. [Mock Backend, Service Workers y Servidor Estático (`mock-backend.js`, `sw.js`, `serve-static.js`)](#5-mock-backend-service-workers-y-servidor-estático-mock-backendjs-swjs-serve-staticjs)
6. [El Ecosistema Visual: El Sistema Simon](#6-el-ecosistema-visual-el-sistema-simon)

---

## 1. Arquitectura Criptográfica y Seguridad Local-First (`crypto-store.js`)

A diferencia de las aplicaciones web tradicionales que delegan la seguridad a bases de datos remotas y servidores de terceros, **amigable-123** implementa un motor de cifrado de nivel bancario que opera íntegramente en el navegador del cliente.

* **Derivación de Claves (PBKDF2 + SHA-256):** Los PINs del dueño, empleados y código maestro no se almacenan nunca en texto plano. Se procesan mediante **PBKDF2** con 150,000 iteraciones y un salt aleatorio de 16 bytes.
* **Cifrado de Bóveda (AES-GCM 256 bits):** Permite sincronizar y cifrar la bóveda de datos de forma segura entre dispositivos autorizados.
* **Respaldo Cifrado con Passphrase:** El usuario puede exportar sus copias de seguridad cifradas mediante contraseñas (mínimo 8 caracteres) bajo el estándar `AES-256-GCM`.
* **Guard de Contexto Seguro (`isSecureContext`):** Detecta automáticamente si la aplicación se está ejecutando en un entorno no seguro (como una IP de red local `http://192.168.x.x`), emitiendo alertas preventivas para asegurar que las funciones criptográficas de `crypto.subtle` no fallen silenciosamente.
* **Resiliencia de Almacenamiento:** Incluye rutinas automáticas de limpieza de cachés antiguas en `LocalStorage` si el dispositivo se queda sin espacio, priorizando siempre la persistencia de las credenciales de acceso.

---

## 2. Gestión de Perchas, Socios y Multimedia (`vista-perchas.js` + `idb-fotos.js`)

El comercio minorista descentralizado (stands en ferias, quioscos, bazares o consignaciones con socios) encuentra su solución operativa en el motor de perchas:

* **El Concepto de "Percha":** Todo inventario secundario o ubicación externa se administra bajo el modelo unificado de perchas.
* **Compresión de Imágenes Local:** Las fotografías de las perchas se comprimen automáticamente a formato JPEG (ancho máximo de 640px) y se almacenan localmente en **IndexedDB**, garantizando fluidez incluso en tablets o teléfonos de gama baja sin saturar el almacenamiento.
* **Liquidación por WhatsApp:** Cálculo automatizado de ventas, metas y comisiones de socios, generando un recibo detallado listo para enviarse a través de un enlace de WhatsApp con un solo toque.

---

## 3. Filosofía Anti-Nube y Recuperación Autónoma (`email-recovery.js`)

* **El Principio del "Mailto Soberano":** En lugar de depender de servicios de terceros costosos o servidores en la nube que puedan comprometer la privacidad de las credenciales, la recuperación de PINs implementa un flujo auto-contenido mediante `mailto:` (del dueño hacia su propio correo). 
* **Transparencia Radical:** El PIN de acceso se muestra de forma inmediata en la pantalla de la interfaz (`auth-ui.js`), garantizando que el usuario **nunca quede bloqueado sin salida**, sin que sus datos pasen jamás por un servidor intermediario.

---

## 4. Códigos de Barras y Códigos QR Locales (`barcode128.js` + `qrcode-local.js`)

* **Autonomía Absoluta:** Sin depender de librerías externas de CDN que requieran internet, `barcode128.js` (Code128) y `qrcode-local.js` (basado en el motor clásico de Kazuhiko Arase) corren de forma nativa en el cliente.
* **Uso en Mostrador:** Permiten generar e imprimir etiquetas físicas para cualquier producto y escanearlas al instante con la cámara del dispositivo en el mostrador para saltar de inmediato a la ficha técnica o de inventario.

---

## 5. Mock Backend, Service Workers y Servidor Estático (`mock-backend.js`, `sw.js`, `serve-static.js`)

* **Mock Backend en Navegador (`mock-backend.js`):** Emula una API completa utilizando `LocalStorage`. Permite desplegar y probar toda la app de forma estática sin necesidad de un servidor Node.js activo.
* **Service Worker Progresivo (`sw.js`):** Cachea de forma inteligente los recursos estáticos del shell para asegurar tiempos de carga de milisegundos y soporte offline ininterrumpido.
* **Servidor Estático Integrado (`serve-static.js`):** Proporciona la infraestructura mínima en Node.js para servir el contenido estático de `docs/` en despliegues locales limpios mediante un simple `npm start` o `python -m http.server`.
* **Página de Error Estándar (`404.html`):** Mantiene la identidad visual Sinclair/Simon de la marca incluso ante rutas inexistentes, guiando de regreso al usuario a la consola o al inicio de sesión.

---

## 6. El Ecosistema Visual: El Sistema Simon

Todo el poder técnico anterior se esconde detrás de una interfaz regida por el **Sistema Simon**, donde la gestión del negocio se reduce a colores instantáneos:

| Color | Estado | Significado Operativo |
| :---: | :--- | :--- |
| 🟢 | **Verde** (`--sim-verde`) | Stock óptimo. Todo va bien. |
| 🟡 | **Dorado** (`--sim-amarillo`) | Oportunidad o umbral de atención próximo. |
| 🔵 | **Azul** (`--sim-azul`) | Estado estable y control óptimo en perchas. |
| 🟠 | **Naranja** (`--sim-naranja`) | Stock en movimiento rápido; prepárate para reponer. |
| 🔴 | **Rojo** (`--sim-rojo`) | Quiebre de stock inminente. Acción inmediata. |
| ⚫ | **Negro** (`--sim-negro`) | Stock muerto. Dinero atrapado que debe liquidarse para recuperar efectivo. |
