// tutorial-ui.js — TUTORIAL INTERACTIVO de amigable-123 (JFC 2026-07-17).
// NO es la guia de bienvenida (welcome-ui.js, un modal de lectura) ni la Ayuda
// (help-ui.js): esto es un TOUR EN VIVO sobre la interfaz real. Oscurece la
// pantalla, ilumina el elemento del que se habla, navega solo entre las vistas
// y termina llevando al dueno a crear su primer producto.
// Se lanza con window.OCTutorial.iniciar() — el boton "Ver el tutorial ahora"
// de la tarjeta de bienvenida (welcome-ui.js) lo invoca.
// Con 888 el recorrido pasa sobre el stock de demo; con 789 (tienda real
// recien activada) pasa sobre la tienda vacia — mismos pasos, mismo tour.
(function () {
  // Cada paso: vista a la que navegar, selector a iluminar (si falta, se
  // ilumina el boton del nav de esa vista), titulo y texto. Textos ES (esta
  // app es solo espanol, por decision de JFC).
  const PASOS = [
    { vista: "hoy", sel: "nav", titulo: "Tu barra de navegación", texto: "Desde aquí te mueves por toda la app. Este tutorial te lleva de la mano por cada sección — usa Siguiente para avanzar." },
    { vista: "hoy", sel: null, titulo: "Hoy: tu día de un vistazo", texto: "Semáforo general, ventas de hoy y alertas de stock. Si algo necesita tu atención, aparece aquí primero, en rojo." },
    { vista: "inventario", sel: "#btnAltaProducto", titulo: "Crea tus productos aquí", texto: "Con este botón das de alta un producto: nombre, precio, costo y stock. Es el corazón de tu negocio — al final del tutorial vuelves aquí a crear el tuyo." },
    { vista: "inventario", sel: "#gridInventario", titulo: "Tus productos hablan en colores", texto: "Rojo: reponer urgente. Amarillo: revisar pronto. Azul: buen margen, impúlsalo. Verde: todo en orden. No hay que interpretar números — el color te lo dice." },
    { vista: "escanear", sel: null, titulo: "Vende en segundos", texto: "Escanea el código de barras (o escribe el SKU) y la venta queda registrada con stock descontado. Sin cajas registradoras ni pasos extra." },
    { vista: "perchas", sel: "#perchaCrear", titulo: "Crea tus perchas", texto: "Una percha es un punto de venta: tu local, un stand de socio, una feria. Aquí las creas y les asignas productos, con comisión por socio si aplica." },
    { vista: "clientes", sel: "#btnNuevoCliente", titulo: "Tus clientes", texto: "Registra clientes, evalúa trato y confiabilidad, y mira su historial. Tú decides a quién fiar y a quién no, con datos." },
    { vista: "comisiones", sel: null, titulo: "Comisiones sin peleas", texto: "La app calcula sola cuánto le toca a cada socio o promotora según lo vendido. Liquidas con un toque y puedes mandar el recibo por WhatsApp." },
    { vista: "avanzado", sel: null, titulo: "Avanzado: tu caja fuerte", texto: "Respaldos, claves, correo de recuperación, reportes contables y gastos. Todo vive en TU dispositivo — sin nube, sin suscripciones." },
  ];

  let idx = -1;
  let capa = null, foco = null, tarjeta = null;
  let reposicionar = null;

  function $(s) { return document.querySelector(s); }

  function css() {
    if (document.getElementById("oc-tut-css")) return;
    const st = document.createElement("style");
    st.id = "oc-tut-css";
    // Colores solidos siempre (regla visual JFC): texto blanco puro sobre
    // tarjeta oscura, acentos de marca. Botones min 44px.
    st.textContent =
      "#oc-tut-foco{position:fixed;z-index:10060;pointer-events:none;border:3px solid #E86040;border-radius:10px;box-shadow:0 0 0 9999px rgba(15,25,35,.78);transition:all .28s ease;}" +
      "#oc-tut-card{position:fixed;z-index:10061;width:min(340px,calc(100vw - 24px));background:#0F1923;border:2px solid #E86040;border-radius:12px;padding:16px;box-shadow:0 10px 34px #060d14;}" +
      "#oc-tut-card .paso{font-family:var(--font-mono,monospace);font-size:13px;font-weight:700;letter-spacing:.06em;color:#28ECAA !important;-webkit-text-fill-color:#28ECAA !important;margin:0 0 4px;}" +
      "#oc-tut-card h3{font-family:var(--font-display,sans-serif);font-size:19px;font-weight:700;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;margin:0 0 6px;line-height:1.2;}" +
      "#oc-tut-card p{font-size:15px;line-height:1.45;color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;margin:0 0 12px;}" +
      "#oc-tut-card .fila{display:flex;gap:8px;}" +
      "#oc-tut-card button{min-height:44px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;touch-action:manipulation;}" +
      "#oc-tut-atras{flex:0 0 auto;padding:0 14px;border:2px solid #5294AC;background:transparent;color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;}" +
      "#oc-tut-sig{flex:1;border:2px solid #E86040;background:#E86040;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}" +
      "#oc-tut-salir{width:100%;margin-top:8px;min-height:44px;border:none;background:transparent;color:#CCCCCC !important;-webkit-text-fill-color:#CCCCCC !important;font-size:13px;text-decoration:underline;cursor:pointer;}" +
      "@media (prefers-color-scheme: dark){#oc-tut-card h3{color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}#oc-tut-card p{color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;}}";
    document.head.appendChild(st);
  }

  function irAVista(nombre) {
    const b = document.querySelector('nav button[data-vista="' + nombre + '"]');
    if (b) b.click();
    return b;
  }

  function objetivoDe(paso) {
    // El selector puede no existir (vista aun sin pintar): fallback al boton
    // del nav de esa vista, y de ultimo el propio nav.
    let el = paso.sel ? $(paso.sel) : null;
    if (!el) el = $('main .vista.activa') || $('[id^="vista-"].activa') || $('#vista-' + paso.vista);
    if (!el) el = document.querySelector('nav button[data-vista="' + paso.vista + '"]');
    if (!el) el = $("nav");
    return el;
  }

  function pintar() {
    const paso = PASOS[idx];
    const el = objetivoDe(paso);
    if (!el) return;
    try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_) {}
    const r = el.getBoundingClientRect();
    const pad = 6;
    foco.style.left = Math.max(4, r.left - pad) + "px";
    foco.style.top = Math.max(4, r.top - pad) + "px";
    foco.style.width = Math.min(window.innerWidth - 8, r.width + pad * 2) + "px";
    foco.style.height = Math.min(window.innerHeight - 8, r.height + pad * 2) + "px";
    tarjeta.querySelector(".paso").textContent = "Paso " + (idx + 1) + " de " + PASOS.length;
    tarjeta.querySelector("h3").textContent = paso.titulo;
    tarjeta.querySelector(".cuerpo").textContent = paso.texto;
    document.getElementById("oc-tut-atras").style.display = idx === 0 ? "none" : "";
    document.getElementById("oc-tut-sig").textContent = idx === PASOS.length - 1 ? "Crear mi primer producto" : "Siguiente";
    // Tarjeta debajo del foco si cabe; si no, encima; siempre dentro de pantalla.
    const ch = tarjeta.offsetHeight || 190;
    let top = r.bottom + pad + 12;
    if (top + ch > window.innerHeight - 10) top = Math.max(10, r.top - pad - ch - 12);
    let left = Math.min(Math.max(12, r.left), window.innerWidth - (tarjeta.offsetWidth || 340) - 12);
    tarjeta.style.top = top + "px";
    tarjeta.style.left = left + "px";
  }

  function paso(n) {
    idx = Math.max(0, n);
    if (idx >= PASOS.length) return terminar();
    irAVista(PASOS[idx].vista);
    // Espera corta a que la vista pinte antes de medir el objetivo.
    setTimeout(pintar, 620);
    // segundo ajuste tras asentar scroll/animacion: realinea el foco
    setTimeout(() => { if (idx === n) pintar(); }, 900);
  }

  function terminar() {
    // Cierre del tour: aterriza en Inventario, listo para crear el primer
    // producto de verdad. El tutorial se puede repetir cuando quiera desde
    // la tarjeta de bienvenida (Ayuda → ver bienvenida → Ver el tutorial).
    cerrar();
    irAVista("inventario");
    const b = $("#btnAltaProducto");
    if (b) { try { b.scrollIntoView({ block: "center" }); } catch (_) {} }
  }

  function cerrar() {
    if (capa) { capa.remove(); capa = null; }
    if (foco) { foco.remove(); foco = null; }
    if (tarjeta) { tarjeta.remove(); tarjeta = null; }
    if (reposicionar) {
      window.removeEventListener("resize", reposicionar);
      window.removeEventListener("scroll", reposicionar, true);
      reposicionar = null;
    }
    idx = -1;
  }

  function iniciar() {
    if (foco) cerrar();
    css();
    foco = document.createElement("div"); foco.id = "oc-tut-foco";
    tarjeta = document.createElement("div"); tarjeta.id = "oc-tut-card";
    tarjeta.innerHTML =
      '<p class="paso"></p><h3></h3><p class="cuerpo"></p>' +
      '<div class="fila"><button id="oc-tut-atras">Atrás</button><button id="oc-tut-sig">Siguiente</button></div>' +
      '<button id="oc-tut-salir">Salir del tutorial</button>';
    document.body.appendChild(foco);
    document.body.appendChild(tarjeta);
    tarjeta.querySelector("#oc-tut-sig").addEventListener("click", () => paso(idx + 1));
    tarjeta.querySelector("#oc-tut-atras").addEventListener("click", () => paso(idx - 1));
    tarjeta.querySelector("#oc-tut-salir").addEventListener("click", cerrar);
    reposicionar = () => { if (idx >= 0) pintar(); };
    window.addEventListener("resize", reposicionar);
    window.addEventListener("scroll", reposicionar, true);
    paso(0);
  }

  window.OCTutorial = { iniciar: iniciar, cerrar: cerrar };
})();
