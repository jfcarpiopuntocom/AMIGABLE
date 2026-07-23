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

**Corrección de diseño (JFC 2026-07-23, tras revisar la primera versión de
este plan):** el mensaje de WhatsApp de la Fase 2 es SOLO para el momento en
que un teléfono nuevo entra al equipo — una vez en la vida de ese teléfono,
jamás recurrente, jamás por venta ni por novedad. Y JFC prefiere la versión
más fuerte: **sync 24/7 nativo, encendido por el simple hecho de tener
licencia**, sin un interruptor de "activar/desactivar" que alguien tenga que
tocar. Se activa solo al licenciarse (dueño) o al unirse con el código
(equipo), y desde ahí corre para siempre en segundo plano — igual que el
gateway de OmniRoute arranca solo con Windows, este arranca solo con la app.
El botón de emergencia se llama **"Resincronizar"** (no "forzar" — ese verbo
espanta al usuario normal), vive escondido en Avanzado, y NO es algo que se
espera que nadie use seguido — es un salvavidas raro, no un paso del flujo.

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
sala de sync — sin que el dueño tenga que generar/copiar un código aparte,
Y SIN un interruptor manual de "activar sync": si el dispositivo tiene
`licenseCode` (dueño) o un `amigable_sync_licencia` recibido (equipo), el
sync YA está corriendo, siempre, en segundo plano, sin pedir permiso cada
vez. Nada de "modo evento" que se prende y apaga — es un estado permanente
del dispositivo, como estar conectado a internet.

1. En `construirModalActivacion` (auth-ui.js): al generar `licenseCode`
   para el dispositivo del DUEÑO, llamar `window.OCSyncControl.activar(licenseCode)`
   en el mismo instante — cero paso manual, cero botón, cero pantalla nueva.
2. Nuevo flujo "Unirme al equipo de [negocio]" para dispositivos de
   empleados/admins: en vez de pedir PIN 789 (que da modo dueño ilimitado,
   no corresponde a un empleado), un flujo LIVIANO que solo pide el
   `licenseCode` del negocio (dado por el dueño UNA vez, por WhatsApp/voz/
   papel — como ya se comparte cualquier clave de wifi de un local). Al
   confirmarlo, sync queda encendido PARA SIEMPRE en ese teléfono — no hay
   que repetirlo, no hay que "reactivar" para el próximo evento. No activa
   modo dueño, no toca `amigable_owned`.
3. Guardar el `licenseCode` usado para sync en una clave de localStorage
   separada de la licencia de activación (`amigable_sync_licencia`) para
   que un dispositivo pueda estar sincronizado SIN estar "activado"
   (empleados no necesitan pagar/activar, solo sincronizar).
4. Panel "Sincronizar equipo" en Avanzado deja de ser un formulario de
   activar/desactivar y pasa a ser un panel de ESTADO: muestra que está
   corriendo (siempre, si hay licencia), el código para compartir con
   nuevos teléfonos, y el botón "Resincronizar" de la Fase 3. Copy explícito
   y visible: **"Tus datos solo viajan cifrados entre los dispositivos de tu
   propio equipo. Nunca llegan a AMIGABLE ni a nadie más — ni siquiera
   nosotros podemos leerlos."** — la gente debe poder confiar sin tener que
   preguntar.

## Fase 2 — Onboarding de un dispositivo nuevo, sin QR repetido

**Ojo, esto pasa UNA vez en la vida útil de cada teléfono — nunca por
venta, nunca por evento, nunca recurrente.** Un teléfono que ya se unió
queda sincronizado 24/7 para siempre; esta fase es solo la puerta de
entrada la primera vez.

1. Botón "Compartir con mi equipo" en Avanzado (dueño): genera un mensaje
   de WhatsApp pre-armado con el `licenseCode` y un link corto a la app
   ("Abre esto y pega este código UNA vez: AMG-XXXX-XXXX. No hace falta
   repetirlo — tu celular queda sincronizado para siempre"). Copy explícito
   sobre el "para siempre" para que nadie piense que hay que reenviarlo
   antes de cada feria.
2. QR opcional (ya existe la librería `qrcode-local.js`) SOLO como atajo
   visual del mismo código, para el caso "estamos los dos en la feria y es
   más rápido escanear que dictar" — sigue siendo UNA vez por dispositivo,
   para siempre, nunca por venta.

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
4. **Botón "Resincronizar"** (nunca "forzar" — ese verbo asusta al usuario
   normal) en el panel de Avanzado: reconecta y re-declara presencia. Es un
   salvavidas raro para cuando alguien duda si está sincronizado de verdad
   (ansiedad real en feria) — NO es parte del flujo esperado, no se le pide
   a nadie que lo use seguido, y su presencia en la UI debe sentirse
   discreta/secundaria, no como un paso más del proceso normal.

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
- NO diseñar esto como "modo evento/feria" que se prende y apaga — es un
  estado permanente del dispositivo. Da igual si hay feria o es un martes
  cualquiera: si el teléfono tiene licencia o código de equipo, sincroniza
  24/7, punto.
- NO llamar "Forzar" a ningún botón — usar "Resincronizar", y tratarlo como
  excepción rara, no como parte del uso diario esperado.
