# Las tres apps: qué las hace distintas y dónde todavía no lo son
2026-08-14 · auditado contra el código, no contra la intención

Tres productos que comparten motor y no deberían compartir carácter. Este documento existe para separar las dos cosas: **lo que debe ser distinto** (el carácter de cada una) y **lo que no debería serlo** (la técnica y los guardas). Cada afirmación sale de leer los tres repos hoy.

---

## 1. Qué es cada una

| | amigable-123 | friendly-123 | consultorio-123 |
|---|---|---|---|
| Para quién | Comercio pequeño y mediano, Ecuador y LatAm | El mismo comercio, en Estados Unidos | Consultorios y prácticas de salud |
| Idioma | Español | Inglés, con español retenido completo | Bilingüe, español de cara al usuario |
| Precio | $199 | $399 | $399 |
| Licencia | `AMG-XXXX-XXXX-XXXX` | `F123-XXXX-XXXX` | `C123-XXXX-XXXX` |
| Estado real | En producción, negocios reales | Un prospecto ojeándola | Sin usuarios |
| Objeto central | Producto en percha | Producto en percha | Paciente y tratamiento |
| Lo que se cobra | Una venta | Una venta | Una atención |
| Lo que se cuenta | Inventario que se revende | Inventario que se revende | Insumos que se consumen |

La diferencia de fondo de consultorio-123 no es de idioma ni de precio: **cambia el objeto**. En las dos primeras, el inventario es lo que genera ingreso. En la tercera, el inventario es un costo y el ingreso viene del tiempo del médico. Por eso su inventario se cuenta con el método de inicial más compras menos final, sin precio de venta, y por eso el tablero de inicio dejó de mostrar cuánto vale el inventario.

---

## 2. Lo que legítimamente las separa

**Solo consultorio-123**
`agenda.js` y `agenda-ui.js`, la agenda de citas con exportación a Google Calendar y Outlook. Los cinco módulos `nucleo-*`: ingresos separados en caja chica y bancos, inventario por conteo periódico, cuentas por cobrar de pacientes, estado de resultados y su interfaz. `consola.html`. El menú entero, reordenado alrededor del día de un médico: Hoy, Agenda, Pacientes, Contabilidad, Estado de resultados, y solo después Atenciones e Insumos.

**Solo amigable-123**
`percha-reposicion.js` y `simon-config.js`, que son la lógica de perchas y ferias, muy de comercio ecuatoriano. `ahorra.html`, la landing con calculadora de horas en dólares de LatAm.

**Solo friendly-123**
`save.html`, la misma landing reencuadrada para Estados Unidos: tarifa horaria de $25 a $35, ROI en dólares de allá, precio de $399. `i18n.js` como capa bilingüe real.

**PIN de cuatro dígitos en consultorio-123.** amigable-123 y friendly-123 usan tres (888 demo, 260 empleado, 357 contador, 789 activar). consultorio-123 usa cuatro (8888 demo, 7895 activar), **por diseño y confirmado por JFC el 2026-08-14**: detrás de ese acceso hay datos de salud. No se unifica con las hermanas por consistencia. Queda escrito en el `auth-ui.js`, en el recuadro de códigos del gate y aquí, para que nadie lo "corrija" después.

Nada de esto es deuda. Es carácter, y está bien.

---

## 3. Lo que NO debería separarlas, y hoy las separa

### 3.1 El stack de observabilidad existe solo en amigable-123

Seis módulos viven únicamente en el repo de amigable:

| Módulo | Qué hace | friendly | consultorio |
|---|---|---|---|
| `logger.js` | Logging multinivel, de TRACE a AUDIT | falta | falta |
| `telemetry.js` | Cola de telemetría con buffer acotado | falta | falta |
| `audit-store.js` | Auditoría permanente: quién hizo qué, cuándo y dónde | falta | falta |
| `sync-queue.js` | Drenaje de telemetría, hoy en dry run | falta | falta |
| `identity-context.js` | Puebla el contexto de identidad para todo lo anterior | falta | falta |
| `ui-actions.js` | Toda interacción pasa por el bus, no por el botón | falta | falta |

Los guardas que protegen **datos** sí están homologados en las tres: aislamiento de almacenamiento, hechos con cadena de hash, reconciliación, cifrado, durabilidad, identidad de dispositivo, archivo, respaldo, cartera, caja chica y planes de pago. Lo que falta en dos de tres es la capacidad de **saber qué pasó** cuando algo sale mal.

Consecuencia concreta: si un cliente de friendly-123 reporta un descuadre, en amigable-123 hay un registro de auditoría para reconstruirlo y en friendly-123 no.

### 3.2 consultorio-123 emitía licencias con el prefijo de friendly-123

`generarCodigoSync()` devolvía `F123-`, que es el espacio de códigos de otro producto. Como el código de licencia **es la sala de sincronización**, dos productos distintos compartían espacio de nombres, y en el panel las dos familias quedaban indistinguibles.

**Corregido hoy**, de forma asimétrica a propósito: se genera `C123-` y se siguen **aceptando** los `F123-` viejos, para no romperle la licencia a ninguna instancia ya activada. La tolerancia se quita el día que se confirme que no queda ninguna.

Queda una constante interna llamada `F123_PB_URL` en `avanzado-extra.js`. Es una clave de `localStorage`, no texto visible, y renombrarla huerfanaría el valor guardado. Se deja a propósito.

### 3.3 El gate de dos apps no decía qué teclear (corregido)

amigable-123 muestra en la pantalla del PIN un recuadro con los códigos demo (888 dueño, 260 empleado, 357 contador, 789 activar) y un enlace a la landing. **friendly-123 y consultorio-123 no tenían ninguno de los dos.** El visitante llegaba a un teclado numérico sin ninguna pista.

En friendly-123 era peor que una omisión: su propio `checklist.html` le dice al visitante que entre con 888, y el gate no lo confirmaba, con un prospecto mirando esa app.

**Corregido hoy** en las dos. consultorio-123 no lleva enlace a landing porque todavía no tiene una: un enlace roto es peor que ninguno.

### 3.4 consultorio-123 no tiene puerta de entrada comercial todavía

No tiene landing propia ni checklist. amigable-123 tiene `ahorra.html` más `checklist.html`; friendly-123 tiene `save.html` más `checklist.html`; consultorio-123 tiene solo el manual.

**Es un pendiente conocido, no un descuido** (JFC, 2026-08-14): van pronto. Se anota aquí para que no se pierda, no como falla.

---

## 4. Lo que ya quedó parejo

- Los seis guardas de datos y los tres módulos de dinero, en las tres.
- El fix de doble escritura de `cartera.js`, `caja-chica.js` y `nucleo-cxc.js`.
- Cuotas y abonos con calendario real, con estado cumplido cuando la deuda se salda.
- Validación antes de tocar dinero, que era el hueco más grave de la pasada Hugo/Paco/Luis.
- Tipografía, paleta y logo real en base64.
- Piso de 13px en todo texto visible, cero `rgba()` como color de texto.
- Comportamiento arriba, estaciones abajo, sin metáforas ni emojis fuera de estrellas y corazones.
- Límite del plan gratuito idéntico: 25 productos, 100 ventas al mes, 1 empleado.

---

## 5. Qué haría, en este orden

1. **Los códigos demo en el gate de friendly-123 y consultorio-123.** Es media hora y hoy hay un prospecto mirando friendly sin saber qué teclear.
2. **Portar el stack de observabilidad** a las otras dos. Seis archivos que ya funcionan; el trabajo es el cableado y la verificación.
3. **Landing y checklist de consultorio.** Confirmado como próximo por JFC.

Lo primero ya está hecho. Lo segundo es una sesión. Lo tercero, pronto.
