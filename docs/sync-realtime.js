// AMIGABLE — Cliente de sincronizacion en tiempo real (2026-07-23)
// ============================================================================
// QUE HACE: si el dueño activa "Sincronizar equipo" en Avanzado y comparte un
// codigo de sala con los demas dispositivos, las VENTAS, AJUSTES, ANULACIONES
// y TRANSFERENCIAS de stock hechas en cualquier dispositivo de la sala llegan
// a los demas en segundos — para que 5-7 personas vendiendo del mismo
// inventario en un evento no se atropellen ni sobrevendan.
//
// COMO SE PROTEGE LA APP (lazy approach, cero dependencia obligatoria):
//   - Si esto nunca se activa, o el relay esta caido, o se borra este
//     archivo entero: la app funciona EXACTAMENTE igual que siempre
//     (solo local, como fue desde el dia 1).
//   - mock-backend.js JAMAS toca la red — este archivo es el UNICO que abre
//     un WebSocket, y solo si el dueño lo pidio explicitamente.
//   - El relay (Cloudflare Worker) es "sordo y desmemoriado a proposito":
//     solo rebota blobs cifrados, nunca los guarda ni los lee en claro.
//   - Cifrado E2E: la clave sale del codigo de sala via PBKDF2+AES-GCM,
//     nunca viaja al relay. Sin el codigo, un mensaje interceptado es ruido.
//   - Alcance v1: SOLO se sincronizan cambios de STOCK (venta, ajuste,
//     anulacion, transferencia) sobre productos que YA EXISTEN en ambos
//     dispositivos (mismo id) — el catalogo (altas, precios, fotos, perchas)
//     se configura antes del evento, en un solo dispositivo, y se reparte
//     por backup/restauracion como siempre. Sincronizar el catalogo completo
//     es una fase futura, documentada aparte.
// ============================================================================
(function () {
  const RELAY_URL = "wss://amigable-sync-relay.jfcarpio.workers.dev/sala/";
  const ROOM_KEY = "amigable_sync_room"; // {codigo} — si no existe, sync apagado
  const DEVICE_ID_KEY = "amigable_device_id";
  const LAMPORT_KEY = "amigable_sync_lamport";
  const COLA_KEY = "amigable_sync_cola"; // ops pendientes de enviar (offline)
  const SALT_FIJO = "amigable-sync-v1"; // salt fijo: codigo de sala = "clave de cuarto", no defensa contra MITM

  function uuidCorto() {
    const c = globalThis.crypto;
    if (c && c.randomUUID) return c.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0, v = ch === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function deviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) { id = uuidCorto(); try { localStorage.setItem(DEVICE_ID_KEY, id); } catch (_) {} }
    return id;
  }

  function siguienteLamport() {
    let n = Number(localStorage.getItem(LAMPORT_KEY) || 0) + 1;
    try { localStorage.setItem(LAMPORT_KEY, String(n)); } catch (_) {}
    return n;
  }

  function leerCola() {
    try { const a = JSON.parse(localStorage.getItem(COLA_KEY) || "[]"); return Array.isArray(a) ? a : []; }
    catch (_) { return []; }
  }
  function guardarCola(cola) {
    try { localStorage.setItem(COLA_KEY, JSON.stringify(cola.slice(-200))); } catch (_) {}
  }

  function leerSala() {
    try { return JSON.parse(localStorage.getItem(ROOM_KEY) || "null"); } catch (_) { return null; }
  }

  // --- Cripto: PBKDF2(codigo) -> AES-GCM. El codigo nunca sale de este dispositivo. ---
  async function derivarClave(codigo) {
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey("raw", enc.encode(codigo), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: enc.encode(SALT_FIJO), iterations: 100000, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  }
  async function idDeSala(codigo) {
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest("SHA-256", enc.encode("amigable-sala:" + codigo));
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
  }
  async function cifrar(clave, objeto) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const datos = new TextEncoder().encode(JSON.stringify(objeto));
    const cif = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, clave, datos);
    const paquete = new Uint8Array(iv.length + cif.byteLength);
    paquete.set(iv, 0); paquete.set(new Uint8Array(cif), iv.length);
    return paquete.buffer;
  }
  async function descifrar(clave, buffer) {
    const bytes = new Uint8Array(buffer);
    const iv = bytes.slice(0, 12), cif = bytes.slice(12);
    const claro = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, clave, cif);
    return JSON.parse(new TextDecoder().decode(claro));
  }

  // --- Estado de conexion ---
  let ws = null, claveActual = null, salaIdActual = null, reintentoMs = 1000;
  let estadoActual = "apagado"; // apagado | conectando | conectado | reconectando
  const listenersEstado = [];
  function notificarEstado(nuevo) {
    estadoActual = nuevo;
    listenersEstado.forEach((fn) => { try { fn(nuevo); } catch (_) {} });
  }

  async function conectar() {
    const sala = leerSala();
    if (!sala || !sala.codigo) { notificarEstado("apagado"); return; }
    notificarEstado(estadoActual === "apagado" ? "conectando" : "reconectando");
    claveActual = await derivarClave(sala.codigo);
    salaIdActual = await idDeSala(sala.codigo);
    try { ws = new WebSocket(RELAY_URL + salaIdActual); }
    catch (_) { return programarReintento(); }

    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      reintentoMs = 1000;
      notificarEstado("conectado");
      vaciarCola();
    };
    ws.onmessage = async (ev) => {
      try {
        const op = await descifrar(claveActual, ev.data);
        if (window.OCSync && window.OCSync.aplicarOpRemota) window.OCSync.aplicarOpRemota(op);
        window.dispatchEvent(new CustomEvent("oc-sync-op-remota", { detail: op }));
      } catch (_) { /* mensaje ilegible (codigo distinto, ruido) — se ignora, sordo a proposito */ }
    };
    ws.onclose = () => { notificarEstado("reconectando"); programarReintento(); };
    ws.onerror = () => { try { ws.close(); } catch (_) {} };
  }

  function programarReintento() {
    if (!leerSala()) return; // el dueño apago sync mientras tanto: no insistir
    setTimeout(conectar, reintentoMs);
    reintentoMs = Math.min(reintentoMs * 2, 30000);
  }

  async function vaciarCola() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const cola = leerCola();
    if (!cola.length) return;
    for (const op of cola) {
      try { ws.send(await cifrar(claveActual, op)); } catch (_) { return; } // corta si algo falla, reintenta despues
    }
    guardarCola([]);
  }

  // --- Puente con mock-backend.js: emitirOpStock(tipo, payload) llama aqui ---
  window.OCSyncEmit = function (tipo, payload) {
    const sala = leerSala();
    if (!sala) return; // sync apagado: no-op total, cero overhead
    const op = {
      opId: uuidCorto(), deviceId: deviceId(), deviceNombre: (window.OCCurrentUser && window.OCCurrentUser.nombre) || null,
      lamport: siguienteLamport(), tipo, payload, fecha: (new Date()).toISOString(),
    };
    if (ws && ws.readyState === WebSocket.OPEN) {
      cifrar(claveActual, op).then((buf) => { try { ws.send(buf); } catch (_) { encolar(op); } });
    } else {
      encolar(op);
    }
  };
  function encolar(op) { const cola = leerCola(); cola.push(op); guardarCola(cola); }

  // --- API publica para la UI (Avanzado) ---
  window.OCSyncControl = {
    activar(codigo) {
      codigo = String(codigo || "").trim();
      if (codigo.length < 6) return { ok: false, error: "El codigo de sala debe tener al menos 6 caracteres." };
      try { localStorage.setItem(ROOM_KEY, JSON.stringify({ codigo })); } catch (_) {}
      reintentoMs = 1000;
      conectar();
      return { ok: true };
    },
    desactivar() {
      try { localStorage.removeItem(ROOM_KEY); } catch (_) {}
      if (ws) { try { ws.close(); } catch (_) {} ws = null; }
      notificarEstado("apagado");
    },
    estado() { return estadoActual; },
    salaActiva() { const s = leerSala(); return s ? s.codigo : null; },
    onEstado(fn) { listenersEstado.push(fn); },
  };

  // Reconexion automatica al volver a tener foco/red (celular que se bloqueo, wifi que parpadeo)
  window.addEventListener("online", () => { if (leerSala() && estadoActual !== "conectado") { reintentoMs = 1000; conectar(); } });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && leerSala() && (!ws || ws.readyState !== WebSocket.OPEN)) { reintentoMs = 1000; conectar(); }
  });

  // Arranque: si ya habia una sala configurada de antes, reconectar solo.
  if (leerSala()) conectar();
})();
