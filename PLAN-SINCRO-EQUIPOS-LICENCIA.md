# PLAN — Sincro-Equipos: la licencia como nodo unificador (2026-07-23)

> Para ejecutar con Sonnet 5. Responde a la pregunta de JFC: "¿ya tenemos
> esto? ¿es posible? ¿qué falta?" — análisis primero, luego fases.

## Resumen ejecutivo

**Lo que ya existe (Fase 0-5 del plan anterior, `PLAN-MULTIPERCHA-SYNC.md`,
commit `5ed8c21`, en producción):** un sistema de sync en tiempo real
funcional — relay Cloudflare cifrado E2E, deltas de stock, idempotencia,
reconexión automática, alerta de descuadre visible. **Esto YA resuelve el
problema central** (no chocan inventario, segundos de latencia, sin choques
en la misma percha). Verificado en vivo con dos clientes reales.

**Lo que le falta para ser lo que JFC describe — "la licencia como servidor
que une a todos, sin leerse QR entre ellos":** hoy el "código de sala" es un
secreto SEPARADO del sistema de licencia, que el dueño tiene que generar y
compartir a mano (QR o texto) la PRIMERA vez que activa cada dispositivo del
equipo. Funciona, pero es un paso manual extra que no aprovecha que la
licencia YA es, conceptualmente, el identificador del negocio.

**El descubrimiento clave de este análisis:** revisando `auth-ui.js`, el
`licenseCode` actual (`generarCodigoAMG()`, formato `AMG-XXXX-XXXX`) se
genera **al azar, por dispositivo, en cada activación** — NO es hoy un
código compartido entre los dispositivos de un mismo negocio. Cada teléfono
que se activa con PIN 789 inventa su propio código. Osea: la premisa de JFC
("el número de licencia ya es lo que nos une") es la meta correcta, pero
**el código actual no cumple ese rol todavía** — hay que construirlo.

**Verdad física insalvable, para ser honestos:** no existe forma de que un
teléfono nuevo se una a un grupo sincronizado sin que ALGÚN secreto viaje a
ese teléfono al menos UNA vez (así sea "el código de licencia", así sea un
QR, así sea escribirlo a mano). Lo que SÍ se puede eliminar por completo es
la fricción que JFC correctamente rechaza: **leer un QR o repetir un código
después de CADA venta.** La meta realista y lograble es: **un solo código,
una sola vez, al configurar el teléfono — nunca más.**

---

## Fase 0 — Ya construido (no repetir, solo entender)

- `relay/` (Cloudflare Worker desplegado) + `docs/sync-realtime.js` +
  puente en `mock-backend.js` (`window.OCSync`, `emitirOpStock`). Ver
  `PLAN-MULTIPERCHA-SYNC.md` y commits `5ed8c21`…`4f14bcf`.
- Panel "Sincronizar equipo" en Avanzado (`avanzado-extra.js`) — hoy pide un
  **código de sala escrito a mano** por el dueño, separado de la licencia.
- `licenseCode` / `instanceId`: generados en `auth-ui.js`,
  `construirModalActivacion` → `generarCodigoAMG()` + `crypto.randomUUID()`.
  Viajan solo por `enviarHeartbeatLicencia` (Worker de licencias, NO el
  relay de sync — son dos sistemas hoy sin relación entre sí).
- Fix reciente (commit `4f14bcf`): el sync YA registra venta+comisión en
  dispositivos remotos, no solo el delta de stock — la parte de comisiones
  de "sincro-equipos" ya funciona.

## Fase 1 — Unificar licencia y sala de sync (el cambio central)

**Objetivo:** que el `licenseCode` sea, automáticamente, la semilla de la
sala de sync — sin que el dueño tenga que generar/copiar un código aparte.

1. En `construirModalActivacion` (auth-ui.js): cuando se genera
   `licenseCode` para el dispositivo del DUEÑO, guardarlo también como
   sala de sync activa (llamar `window.OCSyncControl.activar(licenseCode)`
   automáticamente al activar — cero paso manual para el dueño).
2. Nuevo flujo "Unirme al equipo de [negocio]" para dispositivos de
   empleados/admins: en vez de pedir PIN 789 (que da modo dueño ilimitado,
   no corresponde a un empleado), un flujo LIVIANO que solo pide el
   `licenseCode` del negocio (dado por el dueño UNA vez, por WhatsApp/voz/
   papel — como ya se comparte cualquier clave de wifi de un local) y activa
   sync con ese código. No activa modo dueño, no toca `amigable_owned`.
3. Guardar el `licenseCode` usado para sync en una clave de localStorage
   separada de la licencia de activación (`amigable_sync_licencia`) para
   que un dispositivo pueda estar sincronizado SIN estar "activado"
   (empleados no necesitan pagar/activar, solo sincronizar).
4. Panel "Sincronizar equipo" en Avanzado: si ya hay `licenseCode` local,
   usarlo como valor por defecto del campo (precargado, no vacío) — el
   dueño solo confirma, no re-teclea.

## Fase 2 — Onboarding de un dispositivo nuevo, sin QR repetido

1. Botón "Compartir con mi equipo" en Avanzado (dueño): genera un mensaje
   de WhatsApp pre-armado con el `licenseCode` y un link corto a la app
   ("Abre esto y pega este código UNA vez: AMG-XXXX-XXXX"). Un solo envío,
   no por cada venta — exactamente lo que JFC pide.
2. QR opcional (ya existe la librería `qrcode-local.js`) SOLO como atajo
   visual del mismo código, para el caso "estamos los dos en la feria y es
   más rápido escanear que dictar" — sigue siendo UNA vez por dispositivo,
   nunca por venta. Dejar clarísimo en el texto de la UI: "esto se hace una
   sola vez por celular, no todos los días."

## Fase 3 — Version control inteligente + failsafes (robustecer lo ya construido)

Ya existe: opId idempotente, lamport counter, hash-chain de `mov()`, alerta
de descuadre. Lo que falta para "award-winning":

1. **Contador de dispositivos conectados en vivo**: el relay ya sabe cuántos
   sockets hay por sala (`ctx.getWebSockets().length`, ver `relay/src/index.js`).
   Exponer ese número al cliente (mensaje especial `{tipo:"presencia",n:N}`
   broadcast al conectar/desconectar) y mostrarlo en la pastilla de estado:
   "Sincronizado · 4 equipos" en vez de solo "Sincronizado".
2. **Snapshot de catálogo al unirse** (hoy es una limitación documentada:
   solo sincroniza STOCK, no catálogo nuevo). Fase futura, no bloqueante:
   al conectar por primera vez, si el dispositivo nuevo tiene 0 productos,
   ofrecer "pedir el catálogo actual a un dispositivo ya sincronizado" —
   pide un snapshot cifrado completo por el mismo canal, una sola vez.
3. **Reloj de referencia**: usar el `fecha` que YA viaja en cada Op (ISO,
   UTC) como fuente de verdad para "mes actual" en vez de `Date.now()`
   local en cada dispositivo — mitiga el riesgo #4 de la auditoría anterior
   (desfase de reloj entre celulares) sin necesitar servidor de tiempo.
4. **Botón "Forzar resync"** en el panel de Avanzado: reconecta y re-declara
   presencia — failsafe manual para cuando alguien duda si está sincronizado
   de verdad (ansiedad real en feria, vale la pena el botón aunque rara vez
   se use).

## Verificación (todas las fases)

- `node --check` + `acorn` en cada archivo tocado, como en todo este sesión.
- Prueba en vivo con 2+ "dispositivos" reales (dos clientes WebSocket Node,
  igual que se hizo para verificar el relay) confirmando: código de
  licencia activa sync sin paso adicional, contador de presencia sube/baja
  al conectar/desconectar, venta en un dispositivo aparece en el otro en
  segundos con comisión correcta.
- Backups + commits por fase, igual que el resto del proyecto.

## Qué NO hacer

- NO fusionar `licenseCode` con contraseñas/PINs de usuario — sigue siendo
  un secreto de NIVEL NEGOCIO, no de nivel-persona (los PINs del Equipo
  siguen siendo el control de acceso individual).
- NO prometer sync de catálogo completo en esta ronda — es Fase 3.2, más
  grande, y el stock+comisión ya resuelve el dolor real de las ferias.
- NO tocar el Worker de licencias (`enviarHeartbeatLicencia`) — es un
  sistema aparte, con su propia regla de "solo estos campos viajan". El
  relay de sync sigue siendo 100% independiente de él.
