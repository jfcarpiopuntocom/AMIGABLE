/* ============================================================================
   micelio-ui.js — la cara visible del micelio, dentro de la app.
   AMIGABLE-123 · 2026-08-15 · JFC

   Tres cosas, en orden de importancia:

   1. LA CINTA. Si TU dispositivo lleva rato sin hablar con el equipo, aparece
      una cinta arriba de todo. No un iconito: una cinta. El que está a ciegas
      es el único que puede arreglarlo moviéndose a donde haya señal, y es
      justo el que no se entera.

   2. EL PANEL DEL EQUIPO, dentro de Avanzado. Quién está al día, quién
      rezagado, quién a ciegas, con el apodo que el negocio le puso.

   3. EL APODO Y LA PERILLA. Un solo campo libre: el negocio decide si escribe
      "Rosa" o "el celular del mostrador". Y los umbrales, movibles.

   Este módulo solo pinta. La lógica está en micelio-vivo.js. Si esto falla,
   el micelio sigue funcionando y la app sigue vendiendo: solo no se ve.
   ============================================================================ */
(function () {
  "use strict";

  if (!window.OCMicelio) return;   /* sin motor no hay cara */

  var M = window.OCMicelio;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var ROL = { dueno: "Dueño", admin: "Admin", empleado: "Empleado", contador: "Contador" };
  function comoSeLlama(m) {
    /* El apodo manda; si no hay, el rol; si tampoco, el id corto. Nunca el
       PIN: el PIN no se enseña, se teclea. */
    return m.apodo || ROL[m.rol] || ("Dispositivo " + String(m.id).slice(1, 5));
  }

  /* ======================================================== 1. LA CINTA === */
  var cinta = null;
  function pintarCinta() {
    var e = M.miEstado();
    if (e.estado === "al_dia") { if (cinta) { cinta.remove(); cinta = null; } return; }
    if (!cinta) {
      cinta = document.createElement("div");
      cinta.id = "oc-micelio-cinta";
      cinta.setAttribute("role", "status");
      cinta.style.cssText =
        "position:sticky;top:0;z-index:900;padding:11px 14px;font-size:15px;line-height:1.5;" +
        "font-weight:700;text-align:center;";
      document.body.insertBefore(cinta, document.body.firstChild);
    }
    var ciego = e.estado === "ciegas";
    cinta.style.background = ciego ? "#E8365D" : "#FFC700";
    cinta.style.color = ciego ? "#FFFFFF" : "#3D2E00";
    cinta.style.webkitTextFillColor = ciego ? "#FFFFFF" : "#3D2E00";
    cinta.textContent = ciego
      ? "Llevas " + e.cuando.replace("hace ", "") + " sin sincronizar con tu equipo. Cuidado con vender algo que otro ya vendió."
      : "Tu dispositivo lleva " + e.cuando.replace("hace ", "") + " sin sincronizar. Suele ser la señal.";
  }

  /* ================================================ 2. PANEL DEL EQUIPO === */
  function filaEquipo(m) {
    var et = M.etiquetas[m.estado];
    return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 0;' +
      'border-bottom:1px solid var(--azul-suave,#dde5ec);">' +
      '<span style="display:inline-block;min-width:96px;padding:4px 11px;border-radius:20px;font-size:13px;' +
      'font-weight:700;text-align:center;background:' + et.color + ';color:' + et.tinta + ';">' + et.texto + "</span>" +
      '<span style="font-size:16px;font-weight:700;color:#0F1923;">' + esc(comoSeLlama(m)) +
      (m.soyYo ? ' <span style="font-size:13px;font-weight:700;color:#B54E0A;">(este dispositivo)</span>' : "") + "</span>" +
      '<span style="font-size:14px;color:#2C3E50;margin-left:auto;">' + esc(m.cuando) + "</span>" +
      "</div>";
  }

  function pintarPanel() {
    var cont = document.getElementById("oc-micelio-panel");
    if (!cont) return;
    var eq = M.equipo();
    var u = M.umbrales();
    var ciegos = eq.filter(function (m) { return m.estado === "ciegas"; }).length;
    var yo = M.yo();

    cont.innerHTML =
      '<h3 style="font-size:17px;font-weight:700;margin:0 0 4px;color:#0F1923;">Tu equipo ahora</h3>' +
      '<p style="font-size:14px;line-height:1.55;margin:0 0 12px;color:#2C3E50;">' +
      (ciegos
        ? "Hay " + ciegos + (ciegos === 1 ? " dispositivo que lleva" : " dispositivos que llevan") +
          " rato sin sincronizar. Mientras estén así, pueden vender algo que aquí ya se vendió."
        : "Todos los dispositivos del equipo están hablando entre sí.") +
      "</p>" +
      '<div>' + eq.map(filaEquipo).join("") + "</div>" +

      /* --- el apodo --- */
      '<div style="margin-top:16px;">' +
      '<label for="oc-mic-apodo" style="display:block;font-size:14px;font-weight:700;color:#0F1923;margin:0 0 5px;">Cómo llamar a este dispositivo</label>' +
      '<p style="font-size:14px;line-height:1.5;margin:0 0 7px;color:#2C3E50;">Puede ser la persona o el aparato: "Rosa", "el celular del mostrador", "Tablet feria". Lo verá tu equipo.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<input id="oc-mic-apodo" type="text" maxlength="28" value="' + esc(yo.apodo) + '" placeholder="Rosa, o el celular del mostrador" ' +
      'style="flex:1;min-width:min(100%,200px);min-height:44px;padding:10px 13px;border:2px solid var(--azul-medio,#2E6278);' +
      'border-radius:8px;font-size:16px;color:#0F1923;background:#FFFFFF;">' +
      '<button type="button" id="oc-mic-apodo-ok" style="min-height:44px;padding:11px 18px;border-radius:8px;border:2px solid #0F1923;' +
      'background:#0F1923;color:#FFFFFF;font-size:15px;font-weight:700;cursor:pointer;">Guardar</button>' +
      "</div>" +
      '<p id="oc-mic-apodo-msg" style="font-size:14px;margin:7px 0 0;min-height:19px;color:#00975C;"></p>' +
      "</div>" +

      /* --- la perilla --- */
      '<details style="margin-top:14px;">' +
      '<summary style="font-size:15px;font-weight:700;color:#0F1923;cursor:pointer;padding:8px 0;min-height:44px;display:flex;align-items:center;">Ajustar cuándo avisar</summary>' +
      '<p style="font-size:14px;line-height:1.5;margin:6px 0 10px;color:#2C3E50;">' +
      'Los valores de fábrica sirven para casi todos. Muévelos si tu negocio trabaja donde la señal es mala, o si al revés necesitas enterarte al minuto.</p>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">' +
      '<div><label for="oc-mic-rez" style="display:block;font-size:14px;font-weight:700;color:#0F1923;margin:0 0 4px;">Rezagado tras</label>' +
      '<input id="oc-mic-rez" type="number" min="1" max="600" value="' + u.rezagado + '" style="width:110px;min-height:44px;padding:10px;' +
      'border:2px solid var(--azul-medio,#2E6278);border-radius:8px;font-size:16px;color:#0F1923;background:#FFFFFF;"> ' +
      '<span style="font-size:14px;color:#2C3E50;">minutos</span></div>' +
      '<div><label for="oc-mic-cie" style="display:block;font-size:14px;font-weight:700;color:#0F1923;margin:0 0 4px;">A ciegas tras</label>' +
      '<input id="oc-mic-cie" type="number" min="2" max="2880" value="' + u.ciegas + '" style="width:110px;min-height:44px;padding:10px;' +
      'border:2px solid var(--azul-medio,#2E6278);border-radius:8px;font-size:16px;color:#0F1923;background:#FFFFFF;"> ' +
      '<span style="font-size:14px;color:#2C3E50;">minutos</span></div>' +
      '<button type="button" id="oc-mic-umb-ok" style="min-height:44px;padding:11px 18px;border-radius:8px;border:2px solid #0F1923;' +
      'background:#FFFFFF;color:#0F1923;font-size:15px;font-weight:700;cursor:pointer;">Guardar</button>' +
      "</div>" +
      '<p id="oc-mic-umb-msg" style="font-size:14px;margin:7px 0 0;min-height:19px;color:#00975C;"></p>' +
      "</details>" +

      /* --- avisos del navegador --- */
      '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--azul-suave,#dde5ec);">' +
      '<p style="font-size:14px;line-height:1.55;margin:0 0 8px;color:#2C3E50;">' +
      'Puedes recibir un aviso del navegador cuando este dispositivo quede fuera del loop, aunque tengas la app en segundo plano.</p>' +
      '<button type="button" id="oc-mic-avisos" style="min-height:44px;padding:11px 18px;border-radius:8px;border:2px solid #0F1923;' +
      'background:#FFFFFF;color:#0F1923;font-size:15px;font-weight:700;cursor:pointer;">Activar avisos en este dispositivo</button>' +
      '<p id="oc-mic-avisos-msg" style="font-size:14px;line-height:1.5;margin:8px 0 0;min-height:19px;color:#2C3E50;"></p>' +
      "</div>";

    cablearPanel();
  }

  function cablearPanel() {
    var msg = function (id, txt, color) {
      var e = document.getElementById(id);
      if (!e) return;
      e.style.color = color || "#00975C";
      e.style.webkitTextFillColor = color || "#00975C";
      e.textContent = txt;
    };

    var bA = document.getElementById("oc-mic-apodo-ok");
    if (bA) bA.addEventListener("click", function () {
      var v = M.ponerApodo(document.getElementById("oc-mic-apodo").value);
      msg("oc-mic-apodo-msg", v ? 'Guardado. Tu equipo verá "' + v + '".' : "Sin apodo: tu equipo verá tu rol.");
    });

    var bU = document.getElementById("oc-mic-umb-ok");
    if (bU) bU.addEventListener("click", function () {
      var r = Number(document.getElementById("oc-mic-rez").value);
      var c = Number(document.getElementById("oc-mic-cie").value);
      if (!(r > 0) || !(c > 0)) { msg("oc-mic-umb-msg", "Los dos valores tienen que ser minutos mayores que cero.", "#A8123A"); return; }
      if (c <= r) { msg("oc-mic-umb-msg", '"A ciegas" tiene que ser mayor que "rezagado", si no nadie sería nunca rezagado.', "#A8123A"); return; }
      M.ponerUmbrales(r, c);
      msg("oc-mic-umb-msg", "Guardado. Rezagado a los " + r + " min, a ciegas a los " + c + " min.");
    });

    var bN = document.getElementById("oc-mic-avisos");
    if (bN) {
      /* Estado actual, dicho antes de tocar nada: si el navegador ya los tiene
         bloqueados, el botón no los va a desbloquear y hay que decirlo. */
      try {
        if (!("Notification" in window)) msg("oc-mic-avisos-msg", "Este navegador no puede mostrar avisos. El aviso en pantalla sigue funcionando.", "#2C3E50");
        else if (Notification.permission === "granted") msg("oc-mic-avisos-msg", "Los avisos ya están activos en este dispositivo.");
        else if (Notification.permission === "denied") msg("oc-mic-avisos-msg", "Los avisos están bloqueados para este sitio. Se activan desde los ajustes del navegador, no desde aquí.", "#B54E0A");
      } catch (_) {}

      bN.addEventListener("click", function () {
        M.pedirPermisoAviso().then(function (r) {
          if (r === "granted") {
            msg("oc-mic-avisos-msg", "Listo. Te avisaremos si este dispositivo queda fuera del loop.");
            /* Ya que el dueño dijo que sí a esto, se pide también que el
               navegador no borre los datos del negocio por falta de espacio.
               Va junto porque es el mismo gesto: "esto lo quiero en serio". */
            M.pedirPersistencia().then(function (ok) {
              if (ok) msg("oc-mic-avisos-msg", "Listo. Te avisaremos si este dispositivo queda fuera del loop, y el navegador ya no borrará tus datos por falta de espacio.");
            });
          } else if (r === "denied") {
            msg("oc-mic-avisos-msg", "Los dejaste bloqueados. El aviso en pantalla sigue funcionando igual.", "#B54E0A");
          } else {
            msg("oc-mic-avisos-msg", "Este navegador no puede mostrar avisos. El aviso en pantalla sigue funcionando.", "#2C3E50");
          }
        });
      });
    }
  }

  /* =============================================================== ciclo === */
  function refrescar() {
    try { pintarCinta(); } catch (_) {}
    try {
      /* El panel solo se repinta si está a la vista: repintarlo mientras el
         usuario escribe su apodo le borraría lo tecleado. */
      var c = document.getElementById("oc-micelio-panel");
      if (c && c.offsetParent && document.activeElement !== document.getElementById("oc-mic-apodo")) pintarPanel();
    } catch (_) {}
  }

  window.addEventListener("oc-micelio-cambio", refrescar);
  window.addEventListener("oc-login", function () { setTimeout(refrescar, 400); });
  setInterval(refrescar, 30000);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refrescar);
  else refrescar();

  window.OCMicelioUI = { pintarPanel: pintarPanel, refrescar: refrescar, comoSeLlama: comoSeLlama };
})();
