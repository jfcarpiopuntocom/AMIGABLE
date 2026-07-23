# PLAN — Multi-percha + Sincronización en tiempo real (2026-07-22)

> Para ejecutar con Sonnet 5, fase por fase, cada una autocontenida.
> Decisiones ya tomadas por JFC (NO re-preguntar): transporte = **relay tonto
> E2E-cifrado**, hosting = **Cloudflare Workers + Durable Objects**.
> Principios inviolables: datos SIEMPRE en el dispositivo (localStorage/mock-backend),
> la app funciona 100% sin el relay, el relay NO guarda nada, cero dependencia
> obligatoria, español neutro, reglas visuales de CLAUDE.md.

## Contexto del código (verificado 2026-07-22)

- `docs/mock-backend.js` (minificado, 1 línea): intercepta `window.fetch` para `/api/*`.
  - Estado en `localStorage` clave `OC_STATE_KEY="amigable_demo_state_v4"`, guardado por
    `guardarEstadoLocal()` (char ~24430) con `_localRev` incremental.
  - `function mov(tipo,detalle)` (char ~34693): log de movimientos con hash-chain
    (`prevSello`/`sello` via `selloHash(movHuella(m))`) — YA es un op-log embrionario.
  - Stock muta en 6 sitios: `stockActual-=` (~47790 venta, ~54072, ~59221) y
    `stockActual+=` (~49018, ~49579 anulación, ~54678 ajuste).
  - Producto: `{id, nombre, categoria, sku, barcode, ubicacionId, precio, costo,
    stockActual, umbralRojo, umbralAmarillo, proveedor, tipoProveedor,
    comisionProveedorPct, estrella, perecible, fechaCaducidad, metodoCosteo, foto}`.
  - REGLA en cabecera del archivo: mock-backend JAMÁS hace fetch externo. El
    cliente de sync va en ARCHIVO NUEVO (`docs/sync-realtime.js`), no aquí.
- `docs/index.html`: script principal líneas ~1470-3892. `guardarEdicionProducto`,
  `cargarInventario`, `pintarFicha`, modal `modalFicha`.
- `docs/vista-perchas.js` (IIFE minificada): carpetas por percha, cuenta productos
  por `ubicacionId` único.
- Identidad: `localStorage "amigable_owned"` con `instanceId` (activación PIN 789).
- Iconos: usar `icoOC(nombre,color,size)` — nunca emojis (memoria feedback-estetica-blocky).

## Arquitectura acordada

### A. Multi-percha (distribución de stock)
Un producto puede vivir repartido en varias perchas.
- Nuevo campo `distribucion: { [ubicacionId]: cantidad }` en cada producto.
  Invariante: `stockActual === suma(distribucion)`. `ubicacionId` se conserva como
  "percha principal" (compat total con TODO el código existente).
- Migración lazy al cargar estado: si un producto no tiene `distribucion`,
  `distribucion = { [ubicacionId||"todas"]: stockActual }`.
- TODA mutación de stock lleva `ubicacionId` y ajusta `distribucion` + `stockActual`
  juntos (helper único `ajustarStock(p, ubicacionId, delta)` — un solo camino).

### B. Sync tiempo real (5-7 dispositivos, < 2 s)
Op-log con deltas conmutativos + relay tonto:
- Cada mutación se convierte en **Op**: `{opId(uuid), deviceId, lamport, tipo,
  payload, fecha}`. Los movimientos existentes (mov + hash-chain) se conservan;
  las Ops son la capa de replicación.
- **Solo deltas, jamás valores absolutos de stock** en las Ops (dos ventas
  simultáneas del mismo producto se suman en vez de pisarse → cero sobreoferta
  por updates perdidos). Ediciones de ficha (precio, nombre…) usan
  last-writer-wins por `lamport` + `deviceId` como desempate.
- Aplicación idempotente: `Set` de `opId` vistos; re-recibir una Op es no-op.
- Relay: Cloudflare Worker + un Durable Object por sala (`sala = instanceId`).
  Solo hace broadcast WebSocket de blobs cifrados. NO persiste, NO lee contenido.
- E2E: clave de sala derivada (PBKDF2/HKDF WebCrypto) de un código que el dueño
  comparte por QR/texto. AES-GCM por mensaje. El relay jamás ve claro.
- Resync al (re)conectar: cada dispositivo anuncia `{lamportMax, hashEstado}`;
  se piden Ops faltantes; si el hueco es muy grande, el dispositivo con más Ops
  ofrece snapshot completo cifrado.
- Offline-first: cola local de Ops pendientes (localStorage), flush al reconectar.
  Sin relay la app es EXACTAMENTE la de hoy.

---

## Fase 0 — Descubrimiento de documentación (SIEMPRE PRIMERO)
1. Invocar skills `wrangler` y `durable-objects` (están en la lista de skills del
   entorno) y leer sus instrucciones ANTES de escribir el worker.
2. Confirmar APIs reales: `WebSocketPair`, `DurableObject` con
   `state.acceptWebSocket()` (hibernation API), `wrangler deploy`.
3. Confirmar WebCrypto en Safari iOS 15+: `crypto.subtle.deriveKey` (PBKDF2),
   `AES-GCM` — disponibles; NO usar librerías externas.
4. Salida: lista "APIs permitidas" con citas. Anti-patrón: inventar métodos de DO;
   parámetros no documentados de wrangler.toml.

## Fase 1 — Multi-percha en mock-backend.js
Archivos: `docs/mock-backend.js` (backup + chmod 444 antes; editar vía Python
regex sobre el minificado, NUNCA Read completo).
1. Migración lazy en `cargarEstadoLocal()`/normalización: sembrar `distribucion`.
2. Helper `ajustarStock(p, ubicacionId, delta)`; reemplazar los 6 sitios de
   mutación directa (`stockActual-=`/`+=`) para que pasen por él.
3. `ficha(p)` y lista GET exponen `distribucion`.
4. `PATCH /productos/:id` acepta `distribucion` (validar: enteros ≥ 0, recalcular
   `stockActual`, `ubicacionId` = percha con más stock salvo override explícito).
5. Nuevo `POST /productos/:id/distribuir {desde, hacia, cantidad}` → mov("transferencia").
6. `filtrar(uid)` incluye productos con `distribucion[uid] > 0` (no solo ubicacionId).
Verificación: node --check; grep cero `stockActual-=`/`+=` fuera del helper;
prueba en consola: transferir y vender por percha cuadra sumas.

## Fase 2 — Multi-percha en UI
Archivos: `docs/index.html`, `docs/vista-perchas.js` (backups primero).
1. Editar ficha: bajo el select "Percha" (que pasa a llamarse "Percha principal"),
   panel "Distribución por percha" — una fila por percha con stock > 0 + botón
   "Mover unidades" (usa `/distribuir`). Solo dueño.
2. `pintarFicha`: si hay >1 percha con stock, línea "Distribuido: Centro 12 ·
   Feria 8" (icoOC percha).
3. Tarjeta inventario: badge percha muestra "3 perchas" cuando aplica.
4. vista-perchas: carpeta cuenta por `distribucion[perchaId]`, no por ubicacionId.
5. Vender/escanear: si el producto está en varias perchas, selector rápido de
   percha origen (default: la de más stock) — un tap, sin fricción.
Verificación: flujo completo multi-tab demo 888; grep de reglas visuales.

## Fase 3 — Op-log replicable en mock-backend.js
1. `deviceId` persistente (localStorage `amigable_device_id`, uuid).
2. Contador `lamport` persistido; cada mutación local emite Op a una cola
   `amigable_ops_out` y la aplica localmente.
3. `window.OCSync = { aplicarOpRemota(op), exportarOpsDesde(lamport), estadoHash() }`
   expuesto por mock-backend (interfaz interna, sin red — la red vive en Fase 5).
4. `aplicarOpRemota`: idempotente por opId; deltas de stock via `ajustarStock`;
   LWW para campos de ficha; registra mov() con atribución del usuario remoto.
Verificación: dos pestañas, aplicar Ops cruzadas a mano por consola, estados
convergen (mismo `estadoHash()`).

## Fase 4 — Relay Cloudflare Worker
Archivos NUEVOS: `relay/wrangler.toml`, `relay/src/sala-sync.js`. Repo mismo
(AMIGABLE), carpeta `relay/` — no toca `docs/`.
1. Worker con Durable Object `SalaSync`: `fetch` → upgrade WebSocket,
   `acceptWebSocket` (hibernation), broadcast a los demás sockets de la sala.
   Sala por path `/sala/:id`. Límite: rechazar mensajes > 64 KB; máx 12 sockets.
2. CERO almacenamiento: sin `state.storage`, sin logs de contenido. Comentario
   cabecera: "Este relay es sordo y desmemoriado A PROPÓSITO".
3. `wrangler deploy` (cuenta CF de JFC; pedir a JFC correr `wrangler login` si
   no hay sesión). Anotar URL resultante.
Verificación: `wscat`/consola browser: dos clientes conectados a la misma sala
se ven los mensajes; el DO no persiste (redeploy pierde todo = correcto).

## Fase 5 — Cliente de sync (`docs/sync-realtime.js`, archivo NUEVO)
1. Config: URL del relay hardcodeada + `salaId = instanceId` (o el propio
   deviceId como sala en demo). Feature-flag `localStorage amigable_sync_on`.
2. Clave: código de sala (6 palabras o QR) → PBKDF2 → AES-GCM. Cifrar/descifrar
   cada frame. El código NUNCA viaja al relay.
3. Bucle: conectar WS → handshake `{lamportMax, estadoHash}` → pedir/enviar Ops
   faltantes → suscribirse a `amigable_ops_out` (hook en guardarEstadoLocal o
   evento custom `oc-op-local`) → broadcast inmediato (< 1 s).
4. Reconexión exponencial (1 s → 30 s máx); cola offline persistida.
5. UI: pastilla de estado en header (icoOC + "Sincronizado · N equipos" /
   "Solo local") + panel del dueño en Avanzado: activar sync, mostrar QR del
   código de sala, lista de dispositivos conectados. Texto claro: "Si apagas
   esto, la app sigue igual que siempre".
6. `<script src="./sync-realtime.js">` al final de index.html.
Verificación: 3 pestañas (o 2 dispositivos reales): venta en una aparece en las
otras en < 2 s; matar el relay → la app sigue; revivirlo → convergen.

## Fase 6 — Anti-atropello y pruebas de conflicto
1. Test guiado: 2 dispositivos venden las 2 últimas unidades del mismo producto
   a la vez → stock termina en 0 exacto (deltas), y si queda negativo se pinta
   alerta roja "Descuadre: revisa percha X" (nunca silencioso).
2. Snooze de escritura: si llega Op remota mientras el dueño tiene el form de
   editar abierto, avisar "Otro dispositivo editó esta ficha" al guardar (comparar
   lamport) — ofrecer recargar o pisar.
3. Hash-chain: las Ops remotas entran al mov() local con sello propio — la
   cadena local sigue siendo tamper-evidente por dispositivo.
Verificación: simulación con throttling de red; documentar resultados en el commit.

## Fase 7 — Verificación final y entrega
1. `node --check` de todos los JS + los 5 scripts inline de index.html.
2. Greps anti-patrón: cero `fetch(` nuevos en mock-backend; cero valores
   absolutos de stock en Ops (`grep "stockActual:" en payloads`); cero opacity/
   rgba en texto nuevo; cero emojis nuevos (usar icoOC).
3. Backups con timestamp + chmod 444 hechos en cada fase; commit por fase,
   push a main, URL en vivo citada.
4. Actualizar `docs/manual.html` (sección "Trabajar en equipo sincronizado") y
   `novedades.js`.

## Anti-patrones globales (NO hacer)
- NO meter red en mock-backend.js (regla escrita en su cabecera).
- NO CRDT library externa (Yjs/Automerge): deltas + LWW propios bastan y pesan 0 KB.
- NO absolutos de stock en Ops. NO persistencia en el relay. NO exigir el relay
  para funcionar. NO tocar el esquema de PINs ni la licencia. NO paneles nuevos:
  el control vive en Avanzado (memoria: panel maestro único).
