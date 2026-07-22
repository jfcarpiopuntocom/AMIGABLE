/* novedades.js — "Novedades" del empleado: gamificación experimental + resumen
   de alertas del turno. Módulo 100% aparte, JAMAS toca ventas/perchas/
   inventario reales — solo LEE (fetch ya resuelto) y cuenta puntos propios en
   su propio localStorage. Si este archivo entero fallara, nada más de la app
   se entera: todo va en try/catch y el mount es aditivo.

   FEATURE EXPERIMENTAL (JFC, 2026-07-22): encendida por DEFECTO desde el
   primer login del empleado. El dueño puede apagarla en Avanzado — solo un
   "0" explícito la desactiva. Apagada = no se engancha nada (ni el fetch, ni
   el botón de nav).

   Puntaje SOLO en dispositivo (localStorage oc_novedades_v1), no compite con
   nadie, no sale del dispositivo, no sincroniza. Es refuerzo psicológico
   individual (estilo Duolingo) para 4 buenos hábitos del turno:
     - Racha diaria de uso (login)
     - Ventas registradas
     - Fotos de percha al día
     - Transferencias atendidas
*/
(function () {
  var LS_ON = "oc_gamificacion_on";
  var LS_STATE = "oc_novedades_v1";
  var ZONA = "America/Guayaquil";

  // DEFAULT ON (JFC, 2026-07-22): antes apagado por defecto, ahora encendido
  // para que el empleado vea Novedades desde el primer login. El dueño puede
  // apagarla en Avanzado — solo un "0" explícito la desactiva.
  function on() {
    try { var v = localStorage.getItem(LS_ON); return v === null || v === "1"; } catch (_) { return true; }
  }
  function hoyISO() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
    catch (_) { return new Date().toISOString().slice(0, 10); }
  }
  function leer() {
    try {
      return JSON.parse(localStorage.getItem(LS_STATE)) || { racha: 0, ultimoLogin: "", puntos: 0, insignias: [], ventasHoy: 0, ultimaFechaVentas: "", fotosOk: false, transfPendientes: 0, noLeidas: 0, ultimaVisita: 0 };
    } catch (_) { return { racha: 0, ultimoLogin: "", puntos: 0, insignias: [], ventasHoy: 0, ultimaFechaVentas: "", fotosOk: false, transfPendientes: 0, noLeidas: 0, ultimaVisita: 0 }; }
  }
  function guardar(st) { try { localStorage.setItem(LS_STATE, JSON.stringify(st)); } catch (_) {} }

  function otorgar(st, id, etiqueta) {
    if (st.insignias.indexOf(id) === -1) {
      st.insignias.push(id);
      st.puntos += 10;
      st.noLeidas += 1;
      st._nueva = etiqueta;
    }
  }

  // --- Registrar login del día: racha ---
  function marcarLogin() {
    var st = leer();
    var hoy = hoyISO();
    if (st.ultimoLogin !== hoy) {
      // BUGFIX: la llamada a Intl para "ayer" no tenía try/catch — si fallaba en
      // un dispositivo viejo (Intl sin soporte de ZONA), el error subía, el catch
      // del listener lo tragaba, y el panel entero dejaba de montar silenciosamente.
      var ayerISO;
      try {
        var ayer = new Date(Date.now() - 86400000);
        ayerISO = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(ayer);
      } catch (_) {
        // DST-safe fallback: rotar un día de calendario hacia atrás desde la fecha local
        var dAyer = new Date(hoy + "T12:00:00"); dAyer.setDate(dAyer.getDate() - 1);
        ayerISO = dAyer.toISOString().slice(0, 10);
      }
      st.racha = (st.ultimoLogin === ayerISO) ? (st.racha + 1) : 1;
      st.ultimoLogin = hoy;
      st.puntos += 5;
      st.noLeidas += 1;
      if (st.racha === 3) otorgar(st, "racha3", "¡3 días seguidos!");
      if (st.racha === 7) otorgar(st, "racha7", "¡Una semana completa!");
      if (st.racha === 30) otorgar(st, "racha30", "¡Un mes de racha!");
      guardar(st);
    }
  }

  // --- Interceptar fetch de forma ADITIVA (encadena con lo que ya esté envuelto,
  //     nunca lo reemplaza — mismo patrón ya usado por OCSync en avanzado-extra.js) ---
  function engancharFetch() {
    if (window.__ocNovedadesPatched) return;
    window.__ocNovedadesPatched = true;
    var fetchPrevio = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      var res = await fetchPrevio(input, init);
      try {
        if (res.ok) {
          var url = typeof input === "string" ? input : (input && input.url) || "";
          var metodo = ((init && init.method) || "GET").toUpperCase();
          if (metodo === "POST" && url.indexOf("/api/ventas/cierre") !== -1) marcarVenta();
          else if (metodo === "POST" && url.indexOf("/api/perchas") !== -1 && url.indexOf("foto") !== -1) marcarFotoPercha();
          else if (metodo === "POST" && url.indexOf("/api/transferencias") !== -1) marcarTransferencia();
        }
      } catch (_) {}
      return res;
    };
  }

  function marcarVenta() {
    var st = leer();
    var hoy = hoyISO();
    if (st.ultimaFechaVentas !== hoy) { st.ventasHoy = 0; st.ultimaFechaVentas = hoy; }
    st.ventasHoy += 1;
    st.puntos += 2;
    if (st.ventasHoy === 5) otorgar(st, "ventas5_" + hoy, "¡5 ventas hoy!");
    guardar(st);
  }
  function marcarFotoPercha() {
    var st = leer();
    st.fotosOk = true;
    st.puntos += 5;
    // noLeidas lo maneja otorgar() — no incrementar aquí también (double-increment bug)
    otorgar(st, "foto_" + hoyISO(), "Percha al día");
    guardar(st);
  }
  function marcarTransferencia() {
    var st = leer();
    st.puntos += 3;
    // noLeidas lo maneja otorgar() — no incrementar aquí también (double-increment bug)
    otorgar(st, "transf_" + hoyISO(), "Transferencia atendida");
    guardar(st);
  }

  // --- UI: botón de nav con glow + contador ---
  var css = document.createElement("style");
  css.textContent =
    "#oc-nav-novedades{position:relative;}" +
    "#oc-nav-novedades .oc-nov-badge{position:absolute;top:2px;right:6px;min-width:16px;height:16px;" +
    "border-radius:8px;background:var(--rust,#b2461f);color:#FFFFFF;font-size:13px;font-weight:700;" +
    "line-height:16px;text-align:center;padding:0 3px;}" +
    "@keyframes ocNovGlow{0%,100%{box-shadow:0 0 0 0 rgba(232,160,32,.55);}50%{box-shadow:0 0 0 5px rgba(232,160,32,0);}}" +
    "#oc-nav-novedades.oc-nov-glow{animation:ocNovGlow 1.6s ease-in-out infinite;}" +
    "@media (prefers-reduced-motion: reduce){#oc-nav-novedades.oc-nov-glow{animation:none;}}" +
    ".oc-nov-card{background:var(--blanco-calido,#fbf5e8);border:2px solid var(--brass,#9c7a35);border-radius:10px;padding:16px;margin-bottom:14px;}" +
    ".oc-nov-insignia{display:inline-block;background:var(--amarillo-claro,#fff3c4);border:2px solid var(--brass,#9c7a35);border-radius:20px;padding:6px 12px;margin:0 6px 6px 0;font-size:14px;font-weight:700;color:var(--ink,#211c14);}";
  document.head.appendChild(css);

  function montarNav() {
    if (document.getElementById("oc-nav-novedades")) return;
    var nav = document.querySelector("nav");
    var refBtn = document.querySelector('nav button[data-vista="hoy"]');
    if (!nav || !refBtn) return;
    var b = document.createElement("button");
    b.id = "oc-nav-novedades";
    b.dataset.vista = "novedades";
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c-4 3.4-6 7-6 10.2A6 6 0 0 0 12 21a6 6 0 0 0 6-8.3c0-3.2-2-6.8-6-10.2z"></path></svg><span>Novedades</span>';
    refBtn.insertAdjacentElement("afterend", b);
    b.addEventListener("click", function () {
      document.querySelectorAll("nav button").forEach(function (x) { x.classList.remove("activo"); });
      b.classList.add("activo");
      document.querySelectorAll(".vista").forEach(function (v) { v.classList.remove("activa"); });
      var sec = document.getElementById("vista-novedades");
      if (sec) sec.classList.add("activa");
      var st = leer(); st.noLeidas = 0; st.ultimaVisita = Date.now(); guardar(st);
      actualizarBadge();
      render();
    });
    actualizarBadge();
  }

  function actualizarBadge() {
    var b = document.getElementById("oc-nav-novedades");
    if (!b) return;
    var st = leer();
    var existente = b.querySelector(".oc-nov-badge");
    if (existente) existente.remove();
    if (st.noLeidas > 0) {
      var badge = document.createElement("span");
      badge.className = "oc-nov-badge";
      badge.textContent = st.noLeidas > 9 ? "9+" : String(st.noLeidas);
      b.appendChild(badge);
      b.classList.add("oc-nov-glow");
    } else {
      b.classList.remove("oc-nov-glow");
    }
  }

  function montarSeccion() {
    if (document.getElementById("vista-novedades")) return;
    var main = document.querySelector("main");
    if (!main) return;
    var sec = document.createElement("section");
    sec.id = "vista-novedades";
    sec.className = "vista";
    main.appendChild(sec);
  }

  function racheFuego(n) {
    if (n <= 0) return "";
    return "🔥".repeat(Math.min(n, 7)) + (n > 7 ? " ×" + n : "");
  }

  // Mensaje motivacional segun la racha — para que el panel se sienta vivo
  // desde el primer login, no solo un contador vacio.
  function mensajeRacha(st) {
    if (st.racha <= 1) return "¡Bienvenido a Novedades! Cada turno que abres suma. Empieza tu racha hoy.";
    if (st.racha < 3) return "Vas bien — sigue entrando cada día para hacer crecer tu racha.";
    if (st.racha < 7) return "¡Racha sólida! Ya llevas " + st.racha + " días seguidos.";
    if (st.racha < 30) return "¡Impresionante constancia! " + st.racha + " días seguidos y contando.";
    return "Racha de leyenda: " + st.racha + " días seguidos. Este negocio funciona porque tú apareces.";
  }

  // TIPS: consejos cortos de buenas prácticas, rotan por día del año (estable
  // durante el turno, cambia mañana). Contenido propio, no copia nada externo.
  var TIPS = [
    "Un producto con foto reciente en Perchas se vende más rápido: el cliente confía en lo que ve.",
    "Cerrar cada venta en el momento evita que el inventario se desactualice para el siguiente turno.",
    "Los productos en dorado son tu oportunidad del día: dales un empujón antes que los rojos.",
    "Atender una transferencia pendiente apenas llega evita que el cliente se vaya a otro lado.",
    "Revisar Inventario al abrir turno te ahorra sorpresas a media tarde.",
    "Una racha diaria no es sobre perfección — es sobre no dejar pasar el día sin revisar tu negocio."
  ];
  function tipDelDia() {
    // BUGFIX: Date.now()/86400000 usa medianoche UTC — en Ecuador cambia a las 7pm local.
    // hoyISO() devuelve la fecha local (ZONA-aware), así que el tip cambia en la
    // misma medianoche que la racha, nunca en medio del turno.
    return TIPS[Number(hoyISO().replace(/-/g, "")) % TIPS.length];
  }

  async function cargarInfoTurno() {
    var API_ = (typeof API !== "undefined" ? API : "/api");
    var ubic = (typeof ubicacionActual !== "undefined" ? ubicacionActual : "todas");
    var out = { alertas: [], impulsados: [], ventasHoyReal: null, error: false };
    try {
      var dash = await fetch(API_ + "/dashboard?ubicacionId=" + ubic).then(function (r) { return r.json(); });
      out.alertas = (dash && Array.isArray(dash.alertas)) ? dash.alertas.slice(0, 4) : [];
      out.ventasHoyReal = dash && dash.resumenDia ? dash.resumenDia.ventasCount : null;
    } catch (_) { out.error = true; }
    try {
      var prods = await fetch(API_ + "/productos?ubicacionId=" + ubic).then(function (r) { return r.json(); });
      out.impulsados = (Array.isArray(prods) ? prods : []).filter(function (p) { return p.estrella; }).slice(0, 4);
    } catch (_) {}
    return out;
  }

  function render() {
    var sec = document.getElementById("vista-novedades");
    if (!sec) return;
    var st = leer();
    var insigniasHtml = st.insignias.length
      ? st.insignias.slice(-8).map(function (id) { return '<span class="oc-nov-insignia">🏅 ' + escHtmlLocal(etiquetaInsignia(id)) + "</span>"; }).join("")
      : '<p style="font-size:14px;color:var(--ink-soft,#5d5340);">Aún no hay insignias — empiezan a aparecer con tu primer buen hábito del día.</p>';

    sec.innerHTML =
      '<h3 class="seccion" style="margin-top:0;">Novedades</h3>' +
      '<div class="oc-nov-card">' +
        '<h4 style="margin:0 0 6px;font-size:15px;">Tu día de hoy</h4>' +
        '<p style="font-size:14px;color:var(--ink-soft,#5d5340);margin:0 0 10px;">' + escHtmlLocal(mensajeRacha(st)) + '</p>' +
        '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:10px;">' +
          '<div><div style="font-size:24px;">' + racheFuego(st.racha) + '</div><div style="font-size:13px;color:var(--ink-soft,#5d5340);">Racha: ' + st.racha + ' día' + (st.racha === 1 ? "" : "s") + '</div></div>' +
          '<div><div style="font-size:24px;font-weight:700;color:var(--rust,#b2461f);">' + st.puntos + '</div><div style="font-size:13px;color:var(--ink-soft,#5d5340);">Puntos</div></div>' +
          '<div><div style="font-size:24px;font-weight:700;">' + st.ventasHoy + '</div><div style="font-size:13px;color:var(--ink-soft,#5d5340);">Ventas hoy</div></div>' +
        '</div>' +
        insigniasHtml +
      '</div>' +
      '<div class="oc-nov-card">' +
        '<h4 style="margin:0 0 6px;font-size:15px;">💡 Consejo del día</h4>' +
        '<p style="font-size:14px;color:var(--ink-soft,#5d5340);margin:0;">' + escHtmlLocal(tipDelDia()) + '</p>' +
      '</div>' +
      '<div class="oc-nov-card" id="oc-nov-turno">' +
        '<h4 style="margin:0 0 6px;font-size:15px;">📋 Alertas de tu turno</h4>' +
        '<p style="font-size:14px;color:var(--ink-soft,#5d5340);margin:0;">Cargando…</p>' +
      '</div>';

    cargarInfoTurno().then(function (info) {
      var cont = document.getElementById("oc-nov-turno");
      if (!cont) return;
      if (info.error) {
        cont.innerHTML = '<h4 style="margin:0 0 6px;font-size:15px;">📋 Alertas de tu turno</h4><p style="font-size:14px;color:var(--ink-soft,#5d5340);margin:0;">Revisa Inventario para ver los productos que necesitan tu atención (colores rojo y dorado) y Perchas para las fotos pendientes del día.</p>';
        return;
      }
      var alertasHtml = info.alertas.length
        ? '<ul style="margin:6px 0 14px;padding-left:0;list-style:none;">' + info.alertas.map(function (a) {
            var color = a.estado === "rojo" ? "var(--rust,#b2461f)" : (a.estado === "amarillo" ? "#8a6d1f" : "var(--ink,#211c14)");
            return '<li style="font-size:14px;color:' + color + ';font-weight:700;margin-bottom:4px;">● ' + escHtmlLocal(a.mensaje) + '</li>';
          }).join("") + '</ul>'
        : '<p style="font-size:14px;color:var(--ink-soft,#5d5340);margin:6px 0 14px;">Sin alertas pendientes — todo tranquilo por ahora.</p>';
      var impulsadosHtml = info.impulsados.length
        ? '<h4 style="margin:0 0 6px;font-size:15px;">⭐ Para impulsar hoy</h4><ul style="margin:0;padding-left:0;list-style:none;">' + info.impulsados.map(function (p) {
            return '<li style="font-size:14px;color:var(--ink,#211c14);margin-bottom:4px;">⭐ ' + escHtmlLocal(p.nombre) + '</li>';
          }).join("") + '</ul>'
        : '';
      cont.innerHTML = '<h4 style="margin:0 0 6px;font-size:15px;">📋 Alertas de tu turno</h4>' + alertasHtml + impulsadosHtml;
    }).catch(function () {});
  }

  function etiquetaInsignia(id) {
    if (id.indexOf("racha3") === 0) return "3 días seguidos";
    if (id.indexOf("racha7") === 0) return "Una semana completa";
    if (id.indexOf("racha30") === 0) return "Un mes de racha";
    if (id.indexOf("ventas5") === 0) return "5 ventas en un día";
    if (id.indexOf("foto_") === 0) return "Percha al día";
    if (id.indexOf("transf_") === 0) return "Transferencia atendida";
    return "Logro";
  }
  function escHtmlLocal(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // --- Switch en Avanzado (solo dueño) ---
  function montarSwitchAvanzado() {
    var vista = document.getElementById("vista-avanzado");
    if (!vista || document.getElementById("oc-nov-switch-card")) return;
    var card = document.createElement("div");
    card.id = "oc-nov-switch-card";
    card.className = "tag-card";
    card.style.cssText = "text-align:left;margin-top:22px;";
    card.innerHTML =
      '<h3 class="seccion" style="margin-top:0;">Motivación del empleado</h3>' +
      '<p style="font-size:14px;color:var(--ink-soft,#5d5340);margin-top:0;">Le agrega a tus empleados un panel propio de "Novedades": racha de uso, puntos e insignias por buenos hábitos del turno (ventas, fotos de percha, transferencias). No compite entre empleados, no sale del dispositivo, no afecta ningún dato de negocio.</p>' +
      '<label style="display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;cursor:pointer;">' +
        '<input type="checkbox" id="oc-nov-toggle" style="width:20px;height:20px;">' +
        'Activar logros y racha para empleados' +
      '</label>';
    vista.appendChild(card);
    var chk = document.getElementById("oc-nov-toggle");
    chk.checked = on();
    chk.addEventListener("change", function () {
      try { localStorage.setItem(LS_ON, chk.checked ? "1" : "0"); } catch (_) {}
    });
  }

  function montarTodoEmpleado() {
    if (!on()) return;
    engancharFetch();
    marcarLogin();
    montarSeccion();
    montarNav();
    // render() LAZY: el click del botón ya llama render(). Llamarlo aquí haría
    // 2 fetches (dashboard + productos) en cada login aunque el empleado nunca
    // abra Novedades. La sección queda vacía pero oculta — sin costo hasta que
    // se necesite.
  }

  window.addEventListener("oc-login", function (e) {
    try {
      var detalle = e && e.detail || {};
      if (detalle.rol === "empleado" && !detalle.demo) montarTodoEmpleado();
      if (detalle.rol === "dueno" && !detalle.demo) {
        // El switch vive en Avanzado; se monta cuando esa vista existe (ya está en el HTML estático).
        montarSwitchAvanzado();
      }
    } catch (_) {}
  });

  window.addEventListener("oc-logout", function () {
    try {
      var b = document.getElementById("oc-nav-novedades");
      if (b) b.remove();
      var sec = document.getElementById("vista-novedades");
      if (sec) sec.remove();
      var card = document.getElementById("oc-nov-switch-card");
      if (card) card.remove();
    } catch (_) {}
  });
})();
