// worker.js — license ping for friendly-123 / amigable-123.
// Handles both products. Endpoints:
//   POST /checkin  — public, called on activation & login (body.accion = "register"|"login")
//   POST /register — alias for /checkin (legacy)
//   GET  /licencias                    — requires X-Master-Key header
//   POST /licencias/:id/estado         — requires X-Master-Key header
//
// SCOPE, ON PURPOSE (JFC 2026-07-16): this worker exists ONLY to register/
// license-check instances and let JFC reach an owner via the WhatsApp number
// they optionally register. It does NOT and must NOT store business data
// (products, sales, backups). NO CLOUD is core to the product manifesto —
// local-first, no server, no SaaS, no POS. A "cloud backup" feature was
// built and then ripped out the same day for contradicting this. If a
// future request smells like "store the user's data on our server", stop
// and ask before building — see feedback_no_cloud_manifiesto memory.
//
// Deploy:
//   1. wrangler kv:namespace create LICENCIAS     → paste the ID below in wrangler.toml
//   2. wrangler secret put MASTER_KEY             → choose any password, paste in panel.html Config
//   3. wrangler deploy

function cors(resp) {
  resp.headers.set("Access-Control-Allow-Origin", "*");
  resp.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Master-Key");
  // FIX (JFC 2026-07-28): faltaba DELETE aqui. El navegador manda un preflight
  // OPTIONS antes de cualquier DELETE (por el header custom X-Master-Key), y si
  // este header no incluye DELETE, el preflight lo rechaza SIN llegar nunca al
  // endpoint real — el sintoma en el panel es "Error de red: failed to fetch",
  // que no tiene nada que ver con la red: es CORS bloqueando en el navegador.
  resp.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  return resp;
}
function json(obj, status = 200) {
  return cors(new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } }));
}
function requireMasterKey(req, env) {
  const k = req.headers.get("X-Master-Key") || "";
  return env.MASTER_KEY && k === env.MASTER_KEY;
}

/* ─────────────────────────────────────────────────────────────────────
   VERSION CONTROL DE LICENCIAS (JFC 2026-07-28, incidente real)

   Dos veces se perdieron ediciones de JFC sobre un registro: una vez su
   propio nombre volvio a quedar vacio, otra vez el correo de un cliente
   volvio a un valor viejo (idiomartvuenca) tras un problema de KV. Ninguna
   de las dos fue "mala suerte": el KV solo tenia el ultimo estado, sin
   forma de ver ni deshacer el paso anterior.

   guardarConHistorial() es el UNICO lugar que debe escribir en
   `inst:<instanceId>`: antes de pisar el registro, empuja el estado actual
   a `hist:<instanceId>` (array JSON, mas nuevo primero, tope 30 versiones
   para no crecer sin limite en un KV gratuito). Con eso, CUALQUIER
   sobre-escritura accidental — un bug, un deploy malo, un dedo en el panel —
   es reversible via /licencias/:id/historial + /licencias/:id/restaurar.
   NO usar env.LICENCIAS.put(`inst:...`) directo en ningun endpoint nuevo. */
const HISTORIAL_TOPE = 30;
async function guardarConHistorial(env, instanceId, registroNuevo) {
  const key = `inst:${instanceId}`;
  const anteriorRaw = await env.LICENCIAS.get(key);
  if (anteriorRaw) {
    try {
      const histKey = `hist:${instanceId}`;
      const histRaw = await env.LICENCIAS.get(histKey);
      const hist = histRaw ? JSON.parse(histRaw) : [];
      hist.unshift({ ts: Date.now(), registro: JSON.parse(anteriorRaw) });
      await env.LICENCIAS.put(histKey, JSON.stringify(hist.slice(0, HISTORIAL_TOPE)));
    } catch (_) { /* el historial nunca debe bloquear el guardado real */ }
  }
  await env.LICENCIAS.put(key, JSON.stringify(registroNuevo));
}

async function handleCheckin(req, env) {
  // Hardening (2026-07-16): endpoint publico — cap de tamano y validacion de formato
  // para que un bot no pueda llenar el KV con basura ni payloads gigantes.
  const raw = await req.text();
  if (raw.length > 4096) return json({ error: "Payload too large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch (_) { return json({ error: "Invalid JSON" }, 400); }
  const instanceId = String(body.instanceId || "").slice(0, 120);
  if (!instanceId) return json({ error: "Missing instanceId" }, 400);
  // instanceId legitimo: uuid o token alfanumerico corto (el cliente genera uuid/base36)
  if (!/^[a-zA-Z0-9-]{6,120}$/.test(instanceId)) return json({ error: "Invalid instanceId" }, 400);

  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "";
  const existenteRaw = await env.LICENCIAS.get(`inst:${instanceId}`);
  const existente = existenteRaw ? JSON.parse(existenteRaw) : {};

  // Determine product
  const producto = body.producto === "amigable" ? "amigable-123" : "friendly-123";

  const registro = {
    instanceId,
    producto,
    // FIX (JFC 2026-07-28): antes usaban "!= null" — un heartbeat pasivo que
    // mandara "" (string vacio, que SI es != null) borraba silenciosamente
    // un dato que el dueno ya habia guardado. El checkin es automatico y no
    // deliberado: nunca debe poder vaciar un campo, solo completarlo si esta
    // vacio o traer un valor nuevo no-vacio. Vaciar un campo a proposito es
    // trabajo del endpoint /editar-licencia (accion explicita del panel).
    nombreNegocio: body.nombreNegocio || existente.nombreNegocio || "",
    email: body.email || existente.email || "",
    licenseCode: body.licenseCode || existente.licenseCode || "",
    // Mejora #5 (JFC 2026-07-16): telefono de contacto del dueno, para el
    // link clickeable a wa.me en panel.html. Contacto deliberadamente
    // unidireccional (JFC -> dueno) — ver copy en avanzado-extra.js.
    whatsapp: (body.whatsapp ? String(body.whatsapp).replace(/\D/g, "").slice(0, 15) : "") || existente.whatsapp || "", // Fix-11: strip non-digits so wa.me link always works; nunca vacia un whatsapp ya guardado (mismo bug que nombreNegocio/email arriba)
    nombre: body.nombre || existente.nombre || "",
    apellido: body.apellido || existente.apellido || "",
    cedula: body.cedula || existente.cedula || "",
    // Toda instancia nueva arranca en "minima": el plan gratuito es el piso,
    // no un castigo. JFC la sube a "full" desde el panel cuando el cliente paga.
    estado: normalizarEstado(existente.estado),
    ip,
    activatedAt: existente.activatedAt || (body.activatedAt ? body.activatedAt : null),
    firstSeen: existente.firstSeen || Date.now(),
    lastSeen: Date.now(),
    lastAccion: body.accion || "checkin",
  };
  await guardarConHistorial(env, instanceId, registro);
  return json({ ok: true, estado: registro.estado });
}

/* ─────────────────────────────────────────────────────────────────────
   ESTADOS DE LICENCIA (modelo definido por JFC, 2026-07-28)

     minima     Gratis para siempre, para cualquiera, sin pedir permiso.
                Tope: 25 productos, 100 ventas al mes (se renueva cada mes)
                y 1 empleado. Es el estado por defecto de toda instancia
                nueva. JFC: "es free para cualquiera".
     full       Uso completo, sin topes. JFC la activa desde el panel
                cuando el cliente paga.
     bloqueada  Cortada por abuso o impago. Unico estado punitivo.

   "observada" quedo eliminada: no tenia sentido vigilar a alguien que ya
   esta en un plan gratuito legitimo. Los registros viejos que la tengan se
   leen como "minima".

   normalizarEstado() existe para que los registros escritos ANTES de este
   cambio sigan funcionando sin migracion. Se aplica al leer y al escribir,
   de modo que KV se va limpiando solo a medida que las instancias hacen
   checkin. NO borrar hasta que no queden registros con nombres viejos. */
const MAPA_ESTADOS_VIEJOS = {
  activa: "full",       // antes "activa" era el uso completo
  limitada: "minima",   // antes "limitada" era el tope gratuito
  observada: "minima",  // eliminada: degrada al plan gratuito, nunca castiga
};
const ESTADOS_VALIDOS = ["minima", "full", "bloqueada"];
function normalizarEstado(e) {
  const v = String(e || "").toLowerCase();
  if (ESTADOS_VALIDOS.includes(v)) return v;
  return MAPA_ESTADOS_VIEJOS[v] || "minima";
}

/* ─────────────────────────────────────────────────────────────────────
   UNA LICENCIA, VARIOS DISPOSITIVOS (JFC 2026-07-28)

   JFC vio su propia licencia AMG-7ZXZ-LS9K-XNWC dos veces en el panel y con
   razon lo llamo un error. Lo que pasa es que cada dispositivo genera su
   propio instanceId, y el KV esta indexado por instanceId — asi que activar
   la misma licencia en un segundo telefono crea una fila nueva.

   Eso NO se arregla borrando la segunda fila: las dos son reales y hacen
   falta. Un dispositivo es una cosa (tiene su IP, su ultima conexion, se
   puede perder o robar) y una licencia es otra (es el negocio, es la sala de
   sincronizacion). Fusionarlas en KV perderia el rastro de los dispositivos,
   que es justo lo que sirve cuando alguien dice "se me perdio el telefono".

   Se arregla en como se MUESTRA: el panel agrupa por codigo de licencia y
   pinta una sola fila por negocio, con sus dispositivos adentro.
   anotarHermanos() le da al panel lo que necesita para agrupar sin tener que
   recorrer la lista dos veces ni repetir aqui la regla de que es "la misma
   licencia" (comparar normalizado, no en crudo).

   Las instancias sin codigo de licencia NO se agrupan entre si: son
   dispositivos en demo, cada uno independiente. Agruparlas todas bajo ""
   habria juntado a desconocidos en una misma fila.
   ───────────────────────────────────────────────────────────────────── */
function anotarHermanos(registros) {
  const porCodigo = {};
  registros.forEach((r) => {
    if (!r) return;
    const cod = normLicencia(r.licenseCode);
    if (!cod) return;
    (porCodigo[cod] = porCodigo[cod] || []).push(r.instanceId);
  });
  registros.forEach((r) => {
    if (!r) return;
    const cod = normLicencia(r.licenseCode);
    const grupo = cod ? (porCodigo[cod] || []) : [];
    r.dispositivos = grupo.length || 1;
    r.hermanos = grupo.filter((id) => id !== r.instanceId);
  });
}

// /recover-pin — envía el PIN del dueño a su correo vía Resend.
// NO almacena el PIN en ningún lado. Recibe { email, pin, instanceId },
// valida el instanceId contra KV (anti-abuso leve), manda el correo y listo.
// Si RESEND_API_KEY no está configurado, devuelve { enviado: false } y el
// cliente cae al fallback en pantalla — sin error fatal.
async function handleRecoverPin(req, env) {
  const raw = await req.text();
  if (raw.length > 512) return json({ error: "Payload too large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch (_) { return json({ error: "Invalid JSON" }, 400); }

  const email = String(body.email || "").slice(0, 240).trim();
  const pin   = String(body.pin   || "").slice(0, 3).trim();
  const instanceId = String(body.instanceId || "").slice(0, 120).trim();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Email inválido" }, 400);
  if (!/^\d{1,3}$/.test(pin)) return json({ error: "PIN inválido" }, 400);

  // Anti-abuso (JFC 2026-07-22). Dos blindajes, ambos fail-open para NUNCA
  // romper una recuperación legítima si el KV tiene un hipo:
  //   1) El correo destino es el REGISTRADO en KV para esa instancia, no el
  //      que venga en el request. Sin esto, cualquiera con un instanceId
  //      válido podía usar el endpoint como relay de spam hacia direcciones
  //      ajenas (gastando además la cuota de Resend). Si la instancia aún no
  //      tiene correo guardado, caemos al del request (primer registro).
  //   2) Rate-limit leve por instancia (5/hora) con contador en KV con TTL.
  let emailDestino = email;
  if (instanceId && env.LICENCIAS) {
    let reg = null;
    try { const r = await env.LICENCIAS.get(`inst:${instanceId}`); reg = r ? JSON.parse(r) : null; } catch (_) { reg = null; }
    if (!reg) return json({ error: "Instancia desconocida" }, 403);
    if (reg.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reg.email)) emailDestino = reg.email;
    try {
      const rlKey = `rl:recover:${instanceId}`;
      const n = parseInt((await env.LICENCIAS.get(rlKey)) || "0", 10) || 0;
      if (n >= 5) return json({ ok: true, enviado: false, motivo: "rate_limited" });
      await env.LICENCIAS.put(rlKey, String(n + 1), { expirationTtl: 3600 });
    } catch (_) { /* fail-open: si el KV falla, dejamos pasar */ }
  }

  // Sin RESEND_API_KEY → respuesta "soft" para que el cliente use fallback en pantalla.
  if (!env.RESEND_API_KEY) {
    return json({ ok: true, enviado: false, motivo: "email_no_configurado" });
  }

    // Fallback: onboarding@resend.dev works on all Resend accounts without domain
  // verification. noreply@amigable-123.com would fail — that domain is not verified.
  const fromEmail = (env.FROM_EMAIL || "onboarding@resend.dev").trim();
  const pinDisplay = pin.padStart(3, "0"); // siempre 3 dígitos con ceros

  let resendResp;
  try {
    resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `amigable-123 <${fromEmail}>`,
        to: [emailDestino],
        subject: "Tu clave de acceso — amigable-123",
        text: [
          `Tu clave de dueño en amigable-123 es: ${pinDisplay}`,
          "",
          "Si no solicitaste esto, alguien intentó recuperar tu clave.",
          "Cámbiala en Avanzado → Claves.",
          "",
          "— amigable-123",
        ].join("\n"),
        html: [
          `<p style="font-family:sans-serif;font-size:15px;color:#0F1923;">`,
          `Tu clave de dueño en <strong>amigable-123</strong> es:</p>`,
          `<p style="font-size:40px;font-weight:bold;letter-spacing:0.25em;`,
          `color:#E86040;font-family:monospace;">${pinDisplay}</p>`,
          `<p style="font-family:sans-serif;font-size:14px;color:#555;">`,
          `Si no solicitaste esto, alguien intentó recuperar tu clave.<br>`,
          `Cámbiala en <strong>Avanzado → Claves</strong>.</p>`,
          `<p style="font-family:sans-serif;font-size:12px;color:#999;">— amigable-123</p>`,
        ].join(""),
      }),
    });
  } catch (err) {
    console.error("[recover-pin] fetch a Resend falló:", err);
    return json({ ok: false, enviado: false, motivo: "resend_network_error" });
  }

  if (!resendResp.ok) {
    const errBody = await resendResp.text().catch(() => "");
    console.error("[recover-pin] Resend respondió", resendResp.status, errBody);
    return json({ ok: false, enviado: false, motivo: "resend_error" });
  }

  return json({ ok: true, enviado: true });
}

// ===========================================================================
// Reidentificación self-service (JFC 2026-07-28) — "si alguien se sabe la
// licencia Y la cédula del dueño Y su correo, ya es suficiente prueba para
// validarse como admin". Público, sin intervención de JFC. La licencia (código
// random de 12 chars) es el secreto fuerte; cédula+correo son confirmación.
// Solo confirma/niega — nunca devuelve datos de negocio ni PII de vuelta.
// ===========================================================================
function normLicencia(s) { return String(s || "").trim().toUpperCase(); }
function normCedula(s) { return String(s || "").replace(/\D/g, ""); }
function normEmail(s) { return String(s || "").trim().toLowerCase(); }

async function handleVerificarIdentidad(req, env) {
  const raw = await req.text();
  if (raw.length > 512) return json({ error: "Payload too large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch (_) { return json({ ok: false, error: "Invalid JSON" }, 400); }

  const licenseCode = normLicencia(body.licenseCode);
  const cedula = normCedula(body.cedula);
  const email = normEmail(body.email);
  if (!licenseCode || !cedula || !email) {
    return json({ ok: false, error: "Faltan datos (licencia, cédula y correo son los 3 obligatorios)." }, 400);
  }

  // Anti-fuerza-bruta: rate-limit por licencia intentada, no por IP (una
  // licencia real solo la intenta su dueño real un puñado de veces).
  try {
    const rlKey = `rl:identidad:${licenseCode}`;
    const n = parseInt((await env.LICENCIAS.get(rlKey)) || "0", 10) || 0;
    if (n >= 8) return json({ ok: false, error: "Demasiados intentos con esta licencia. Espera una hora o contacta a soporte." }, 429);
    await env.LICENCIAS.put(rlKey, String(n + 1), { expirationTtl: 3600 });
  } catch (_) { /* fail-open: si el KV falla, no bloqueamos una verificación legítima */ }

  const lista = await env.LICENCIAS.list({ prefix: "inst:" });
  for (const k of lista.keys) {
    let reg;
    try { reg = JSON.parse(await env.LICENCIAS.get(k.name)); } catch (_) { continue; }
    if (!reg) continue;
    if (normLicencia(reg.licenseCode) === licenseCode
      && normCedula(reg.cedula) === cedula
      && normEmail(reg.email) === email) {
      return json({ ok: true, instanceId: reg.instanceId });
    }
  }
  return json({ ok: false, error: "Los datos no coinciden con ninguna licencia registrada. Revisa mayúsculas y espacios." }, 404);
}

// ===========================================================================
// EPIC "La Licencia Manda" (JFC 2026-07-24) — recuperación por licencia.
// Sigue el manifiesto NO CLOUD: NO se guardan datos de negocio. Solo un código
// efímero de liberación (TTL 1h, un solo uso) atado al instanceId, para que
// JFC pueda re-habilitar a un dueño que olvidó su PIN y su password.
// ===========================================================================

// Código legible, sin caracteres ambiguos (0/O/1/I/L). Formato XXXX-XXXX.
function codigoLiberacion() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[bytes[i] % chars.length];
  return s.slice(0, 4) + "-" + s.slice(4);
}

// POST /liberar — master-only. JFC lo dispara desde el panel tras verificar
// identidad por WhatsApp. Genera el código de un solo uso y lo devuelve para
// que JFC se lo mande al dueño. NO toca datos de negocio.
async function handleLiberar(req, env) {
  let body; try { body = await req.json(); } catch (_) { return json({ error: "Invalid JSON" }, 400); }
  const instanceId = String(body.instanceId || "").slice(0, 120).trim();
  if (!instanceId) return json({ error: "Falta instanceId" }, 400);
  const raw = await env.LICENCIAS.get(`inst:${instanceId}`);
  if (!raw) return json({ error: "Instancia no encontrada" }, 404);
  const code = codigoLiberacion();
  await env.LICENCIAS.put(`release:${instanceId}`, code, { expirationTtl: 3600 });
  return json({ ok: true, code, instanceId });
}

// POST /verificar-liberacion — público. El dueño teclea el código que JFC le
// envió por WhatsApp. Verificación contra KV, UN SOLO USO (se borra al validar),
// con rate-limit por instancia (fail-open) para frenar fuerza bruta.
async function handleVerificarLiberacion(req, env) {
  const raw0 = await req.text();
  if (raw0.length > 512) return json({ error: "Payload too large" }, 413);
  let body; try { body = JSON.parse(raw0); } catch (_) { return json({ error: "Invalid JSON" }, 400); }
  const instanceId = String(body.instanceId || "").slice(0, 120).trim();
  const code = String(body.code || "").slice(0, 20).trim().toUpperCase();
  if (!instanceId || !code) return json({ ok: false, error: "Faltan datos." }, 400);
  try {
    const rlKey = `rl:release:${instanceId}`;
    const n = parseInt((await env.LICENCIAS.get(rlKey)) || "0", 10) || 0;
    if (n >= 10) return json({ ok: false, error: "Demasiados intentos. Espera una hora." }, 429);
    await env.LICENCIAS.put(rlKey, String(n + 1), { expirationTtl: 3600 });
  } catch (_) { /* fail-open */ }
  const guardado = await env.LICENCIAS.get(`release:${instanceId}`);
  if (!guardado) return json({ ok: false, error: "No hay liberación activa. Pídela a soporte." }, 404);
  if (guardado !== code) return json({ ok: false, error: "Código inválido o expirado." }, 400);
  await env.LICENCIAS.delete(`release:${instanceId}`);
  return json({ ok: true });
}

// POST /editar-correo — master-only. JFC corrige correo/nombre/apellido/
// nombre-de-negocio de un dueño desde el panel (lápiz en la lista). El
// nombre del endpoint se conserva por compatibilidad, pero ya no es solo
// correo — ver comentario abajo.
//
// REGLA DURA (JFC 2026-07-28, incidente real: le borre su nombre y el correo
// de un cliente volvio a un valor viejo): un campo vacio en el body NUNCA
// borra un campo ya guardado. Si el dueno quiere de verdad vaciar un correo,
// eso NO existe como accion en este endpoint — se edita a un valor nuevo,
// nunca a "nada". Cada campo que llega no-vacio se valida y reemplaza; cada
// campo que llega vacio/ausente simplemente se ignora y el valor existente
// se conserva. licenseCode NUNCA se toca aqui — es hard-generado, inmutable.
async function handleEditarCorreo(req, env) {
  let body; try { body = await req.json(); } catch (_) { return json({ error: "Invalid JSON" }, 400); }
  const instanceId = String(body.instanceId || "").slice(0, 120).trim();
  if (!instanceId) return json({ error: "Falta instanceId" }, 400);
  const raw = await env.LICENCIAS.get(`inst:${instanceId}`);
  if (!raw) return json({ error: "Instancia no encontrada" }, 404);
  const reg = JSON.parse(raw);

  if (body.email !== undefined) {
    const email = String(body.email).slice(0, 240).trim();
    if (!email) return json({ error: "El correo no puede quedar vacio." }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Correo inválido" }, 400);
    reg.email = email;
  }
  if (body.nombre !== undefined) {
    const nombre = String(body.nombre).slice(0, 120).trim();
    if (!nombre) return json({ error: "El nombre no puede quedar vacio." }, 400);
    reg.nombre = nombre;
  }
  if (body.apellido !== undefined) {
    const apellido = String(body.apellido).slice(0, 120).trim();
    if (!apellido) return json({ error: "El apellido no puede quedar vacio." }, 400);
    reg.apellido = apellido;
  }
  if (body.nombreNegocio !== undefined) {
    const nombreNegocio = String(body.nombreNegocio).slice(0, 240).trim();
    if (!nombreNegocio) return json({ error: "El nombre del negocio no puede quedar vacio." }, 400);
    reg.nombreNegocio = nombreNegocio;
  }

  await guardarConHistorial(env, instanceId, reg);
  return json({ ok: true, email: reg.email, nombre: reg.nombre, apellido: reg.apellido, nombreNegocio: reg.nombreNegocio });
}

// GET /licencias/:id/historial — master-only. Devuelve las hasta 30 versiones
// anteriores del registro (mas nueva primero), para que JFC pueda ver que
// cambio y cuando antes de decidir si restaura algo.
async function handleHistorial(env, instanceId) {
  const raw = await env.LICENCIAS.get(`hist:${instanceId}`);
  return json({ ok: true, historial: raw ? JSON.parse(raw) : [] });
}

// POST /licencias/:id/restaurar — master-only. Restaura una version anterior
// por timestamp. La restauracion en si pasa por guardarConHistorial, asi que
// tambien queda deshacerse si JFC restauro la version equivocada.
async function handleRestaurar(req, env, instanceId) {
  let body; try { body = await req.json(); } catch (_) { return json({ error: "Invalid JSON" }, 400); }
  const ts = Number(body.ts);
  if (!ts) return json({ error: "Falta ts (timestamp de la version a restaurar)" }, 400);
  const raw = await env.LICENCIAS.get(`hist:${instanceId}`);
  const hist = raw ? JSON.parse(raw) : [];
  const version = hist.find((h) => h.ts === ts);
  if (!version) return json({ error: "No existe esa version en el historial" }, 404);
  await guardarConHistorial(env, instanceId, version.registro);
  return json({ ok: true, restaurado: version.registro });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return cors(new Response(null, { status: 204 }));

    // Liberación por licencia (master genera / público verifica)
    if (url.pathname === "/liberar" && req.method === "POST") {
      if (!requireMasterKey(req, env)) return json({ error: "Master Key incorrecta" }, 401);
      return handleLiberar(req, env);
    }
    if (url.pathname === "/verificar-liberacion" && req.method === "POST") {
      return handleVerificarLiberacion(req, env);
    }
    // Editar correo del dueño desde el panel (master)
    if (url.pathname === "/editar-correo" && req.method === "POST") {
      if (!requireMasterKey(req, env)) return json({ error: "Master Key incorrecta" }, 401);
      return handleEditarCorreo(req, env);
    }

    // Recuperación de PIN — público pero con validación de instanceId en KV
    if (url.pathname === "/recover-pin" && req.method === "POST") {
      return handleRecoverPin(req, env);
    }

    // Reidentificación self-service (licencia+cedula+correo) — público, rate-limited
    if (url.pathname === "/verificar-identidad" && req.method === "POST") {
      return handleVerificarIdentidad(req, env);
    }

    // Public checkin (activation + login heartbeat)
    if ((url.pathname === "/checkin" || url.pathname === "/register") && req.method === "POST") {
      return handleCheckin(req, env);
    }

    // Full instance list for panel
    if (url.pathname === "/licencias" && req.method === "GET") {
      if (!requireMasterKey(req, env)) return json({ error: "Master Key incorrecta" }, 401);
      const lista = await env.LICENCIAS.list({ prefix: "inst:" });
      const registros = await Promise.all(lista.keys.map((k) => env.LICENCIAS.get(k.name).then((v) => JSON.parse(v))));
      registros.forEach((r) => { if (r) r.estado = normalizarEstado(r.estado); });
      registros.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
      anotarHermanos(registros);
      return json(registros);
    }

    // Borrar una instancia (master). Pensado para limpiar registros de prueba,
    // no para castigar a nadie: para cortar el servicio esta "bloqueada".
    const mBorrar = url.pathname.match(/^\/licencias\/([^/]+)$/);
    if (mBorrar && req.method === "DELETE") {
      if (!requireMasterKey(req, env)) return json({ error: "Master Key incorrecta" }, 401);
      const instanceId = decodeURIComponent(mBorrar[1]);
      const raw = await env.LICENCIAS.get(`inst:${instanceId}`);
      if (!raw) return json({ error: "Instancia no encontrada" }, 404);
      // Se archiva ANTES de borrar y sin expiracion. Un borrado a un clic desde
      // un panel es exactamente donde ocurren los arrepentimientos, y son unos
      // pocos cientos de bytes. Para recuperarla: leer borrado:<instanceId> y
      // volver a escribirla en inst:<instanceId>.
      await env.LICENCIAS.put(`borrado:${instanceId}`, JSON.stringify({
        borradoEn: Date.now(), registro: JSON.parse(raw),
      }));
      await env.LICENCIAS.delete(`inst:${instanceId}`);
      return json({ ok: true, archivadoEn: `borrado:${instanceId}` });
    }

    // Change instance status
    const mEstado = url.pathname.match(/^\/licencias\/([^/]+)\/estado$/);
    if (mEstado && req.method === "POST") {
      if (!requireMasterKey(req, env)) return json({ error: "Master Key incorrecta" }, 401);
      const instanceId = decodeURIComponent(mEstado[1]);
      const raw = await env.LICENCIAS.get(`inst:${instanceId}`);
      if (!raw) return json({ error: "Instancia no encontrada" }, 404);
      const reg = JSON.parse(raw);
      let body; try { body = await req.json(); } catch (_) { body = {}; }
      const nuevoEstado = normalizarEstado(body.estado);
      if (!ESTADOS_VALIDOS.includes(String(body.estado || "").toLowerCase())
          && !MAPA_ESTADOS_VIEJOS[String(body.estado || "").toLowerCase()]) {
        return json({ error: "Estado inválido" }, 400);
      }
      reg.estado = nuevoEstado;
      await guardarConHistorial(env, instanceId, reg);
      return json({ ok: true });
    }

    // Historial de versiones de una instancia (master) — ver comentario en
    // guardarConHistorial(). Sirve para auditar y para restaurar.
    const mHistorial = url.pathname.match(/^\/licencias\/([^/]+)\/historial$/);
    if (mHistorial && req.method === "GET") {
      if (!requireMasterKey(req, env)) return json({ error: "Master Key incorrecta" }, 401);
      return handleHistorial(env, decodeURIComponent(mHistorial[1]));
    }

    // Restaurar una version anterior de una instancia (master)
    const mRestaurar = url.pathname.match(/^\/licencias\/([^/]+)\/restaurar$/);
    if (mRestaurar && req.method === "POST") {
      if (!requireMasterKey(req, env)) return json({ error: "Master Key incorrecta" }, 401);
      return handleRestaurar(req, env, decodeURIComponent(mRestaurar[1]));
    }

    return json({ error: "Not found" }, 404);
  },
};
