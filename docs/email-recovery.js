// email-recovery.js — Recuperación de PIN vía Cloudflare Worker + Resend.
// Reemplaza la dependencia de EmailJS (requería credenciales externas y cargaba
// un script de CDN). Ahora usa el Worker que ya existe para el heartbeat de
// licencias, con un nuevo endpoint /recover-pin.
//
// Flujo:
//   1. auth-ui.js llama OCEmailRecovery.enviarCodigo(email, pin, instanceId).
//   2. Llamamos al Worker /recover-pin con esos 3 datos.
//   3. El Worker valida el instanceId contra KV (anti-abuso leve) y manda el
//      correo via Resend (API key guardada como Worker secret RESEND_API_KEY).
//   4. Si el Worker falla por cualquier razón (sin internet, no desplegado,
//      Resend caído, timeout), devolvemos { enviado: false, codigo: pin } y
//      auth-ui.js muestra el PIN en pantalla — el dueño nunca queda sin salida.
//
// ESTADO ACTUAL (JFC 2026-07-22): YA DESPLEGADO Y FUNCIONANDO.
//   RESEND_API_KEY está puesto como secret y el Worker envía con el remitente
//   onboarding@resend.dev (el fallback del Worker), que funciona en cualquier
//   cuenta Resend SIN verificar dominio. No hay que hacer nada más.
//
// SI ALGÚN DÍA quieres que el correo salga desde tu propio dominio:
//   1. En Resend → Domains → Add Domain → verificar tu dominio (registros DNS).
//   2. wrangler secret put FROM_EMAIL   ← ej: noreply@tudominio.com
//   3. wrangler deploy
//   OJO: NO pongas un FROM_EMAIL de un dominio sin verificar — Resend lo
//   rechaza y el envío falla en silencio. Mientras dudes, deja el default.

(function () {
  // Misma URL obfuscada que auth-ui.js — se lee en el momento de la llamada
  // para respetar el override que el dueño haya guardado en localStorage.
  var _amgEp = "=YXZk5ycyV2ay92du8WawJXYjZmauMXYpNmblNWas1SZsJWYnlWbh9yL6MHc0RHa";
  function workerBase() {
    try {
      var ov = (localStorage.getItem("amigable_cf_worker_url") || "").trim();
      if (ov) return ov.replace(/\/+$/, "");
    } catch (_) {}
    try { return atob(_amgEp.split("").reverse().join("")).replace(/\/+$/, ""); } catch (_) { return ""; }
  }

  async function enviarCodigo(email, pin, instanceId) {
    var base = workerBase();
    if (!base) return { enviado: false, codigo: pin }; // sin URL → pantalla

    var ctrl = null;
    var timeout = null;
    try {
      ctrl = new AbortController();
      timeout = setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, 8000);
    } catch (_) {}

    try {
      var resp = await fetch(base + "/recover-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, pin: pin, instanceId: instanceId || "" }),
        signal: ctrl ? ctrl.signal : undefined,
      });
      if (timeout) clearTimeout(timeout);

      if (!resp.ok) {
        console.warn("[email-recovery] Worker respondió", resp.status);
        return { enviado: false, codigo: pin };
      }
      var result;
      try { result = await resp.json(); } catch (_) { result = {}; }
      if (result && result.enviado === true) return { enviado: true };
      // Worker vivo pero Resend no configurado → pantalla
      return { enviado: false, codigo: pin };

    } catch (err) {
      if (timeout) clearTimeout(timeout);
      console.warn("[email-recovery] red o timeout:", err && err.message);
      return { enviado: false, codigo: pin }; // fallback siempre
    }
  }

  window.OCEmailRecovery = {
    enviarCodigo: enviarCodigo,
    // configurado() — backward-compat por si algún código lo verifica
    configurado: function () { return !!workerBase(); },
  };
})();
