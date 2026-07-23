// AMIGABLE — Relay de sincronizacion en tiempo real (2026-07-23)
// ============================================================================
// QUE HACE: rebota mensajes WebSocket entre dispositivos conectados a la
// MISMA sala. Nada mas.
//
// QUE NO HACE, A PROPOSITO:
//   - No guarda NADA. Cero ctx.storage.put en todo este archivo.
//   - No lee el contenido de los mensajes — el cliente los cifra con
//     AES-GCM (clave derivada del codigo de sala, que este Worker NUNCA ve)
//     antes de enviarlos. Aqui solo viajan blobs opacos.
//   - No requiere autenticacion de cuenta: la sala misma (su id, dificil de
//     adivinar) mas el cifrado son el control de acceso.
//   - No es necesario para que AMIGABLE funcione: si este Worker se cae,
//     se borra, o el dueno nunca lo activa, la app sigue 100% operativa en
//     modo solo-local (localStorage, como siempre fue).
//
// Limites deliberados: maximo 12 dispositivos por sala, mensajes hasta 64KB.
// Un dispositivo grosero (spam, mensajes gigantes) se ignora, no rompe nada.
// ============================================================================
import { DurableObject } from "cloudflare:workers";

const MAX_SOCKETS_POR_SALA = 12;
const MAX_BYTES_POR_MENSAJE = 64 * 1024;

export class SalaSync extends DurableObject {
  // Acepta el upgrade a WebSocket usando la Hibernation API: la sala puede
  // "dormir" entre mensajes sin perder las conexiones (barato, escala solo).
  fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    if (this.ctx.getWebSockets().length >= MAX_SOCKETS_POR_SALA) {
      return new Response("Sala llena (maximo 12 dispositivos a la vez).", { status: 503 });
    }
    const par = new WebSocketPair();
    const [cliente, servidor] = Object.values(par);
    this.ctx.acceptWebSocket(servidor);
    this._difundirPresencia();
    return new Response(null, { status: 101, webSocket: cliente });
  }

  // Reenvia el mensaje (ya cifrado por el cliente) a todos los DEMAS
  // dispositivos conectados a esta sala. No lo inspecciona ni lo guarda.
  webSocketMessage(ws, message) {
    const tamano = typeof message === "string" ? message.length : message.byteLength;
    if (tamano > MAX_BYTES_POR_MENSAJE) return; // se descarta en silencio, sordo a proposito
    for (const par of this.ctx.getWebSockets()) {
      if (par === ws) continue;
      try { par.send(message); } catch (_) { /* ese dispositivo ya no esta, seguimos */ }
    }
  }

  webSocketClose(ws, code, reason) {
    try { ws.close(code, reason); } catch (_) {}
    // El socket que se acaba de cerrar TODAVIA aparece en getWebSockets()
    // en este punto (confirmado probando en vivo: sin excluirlo, el conteo
    // quedaba desfasado +1 al desconectar) — se excluye a mano.
    this._difundirPresencia(ws);
  }

  webSocketError(ws) {
    try { ws.close(1011, "error"); } catch (_) {}
    this._difundirPresencia(ws);
  }

  // Contador de "cuantos equipos estan conectados ahora" (plan sincro-equipos,
  // fase 3, 2026-07-23). Frame de TEXTO plano (no cifrado) — es solo un
  // numero de conexiones, no dato del negocio, así que no hace falta E2E
  // aqui. El cliente distingue texto (presencia) de binario (Op cifrada real).
  // excluir: socket que se esta cerrando ahora mismo, si aplica.
  _difundirPresencia(excluir) {
    const activos = this.ctx.getWebSockets().filter((s) => s !== excluir);
    const n = activos.length;
    const frame = JSON.stringify({ __presencia__: true, n });
    for (const s of activos) {
      try { s.send(frame); } catch (_) {}
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Sala = instanceId (o deviceId en demo) del lado cliente. 3-64 chars
    // alfanumericos — suficiente entropia para no ser adivinable a fuerza bruta
    // trivial, y el cifrado E2E es la defensa real, no el nombre de la sala.
    const m = url.pathname.match(/^\/sala\/([a-zA-Z0-9_-]{3,64})$/);
    if (!m) {
      return new Response(
        "AMIGABLE Sync Relay — sordo y desmemoriado a proposito.\nUsa /sala/:id con upgrade a WebSocket.\n",
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
    const id = env.SALA.idFromName(m[1]);
    const stub = env.SALA.get(id);
    return stub.fetch(request);
  },
};
