/* ============================================================================
   borrador-formularios.js — que nunca se pierda lo que ya escribiste.
   AMIGABLE-123 · 2026-08-15 · JFC

   EL PROBLEMA: alguien llena el alta de un producto, le llega una llamada,
   toca "atrás" sin querer, se cae el internet, se recarga la página o el
   navegador mata la pestaña por memoria. Todo lo tecleado se pierde. En un
   cuaderno de papel eso no pasa: lo escrito se queda escrito.

   QUÉ HACE: guarda lo que hay en cada campo mientras se escribe, y lo devuelve
   al volver. Nada más. No envía nada, no valida nada, no decide nada.

   DÓNDE SE GUARDA: en este dispositivo, en el mismo almacén aislado que el
   resto de la app. No viaja a ningún servidor — es un borrador, no un dato del
   negocio.

   QUÉ NO SE GUARDA NUNCA, y esto no es negociable:
     - PIN y claves (todo input[type=password], y cualquier campo cuyo nombre
       o id mencione pin, clave, password o secreto).
     - Campos marcados a mano con data-sin-borrador.
   Un borrador que recuerda un PIN es una filtración, no una comodidad.

   CÓMO SE USA: nada. Se activa solo sobre cualquier contenedor que tenga
   data-borrador="<nombre>". Para excluir un campo: data-sin-borrador.

   CADUCIDAD: 24 horas. Un borrador de la semana pasada no ayuda, estorba.

   Si este archivo no carga, los formularios funcionan igual: solo se pierde la
   red de seguridad.
   ============================================================================ */
(function () {
  "use strict";

  var PREFIJO = "amigable_borrador_";
  var VIDA_MS = 24 * 3600000;
  var GUARDA_MS = 400;          /* se escribe al parar de teclear, no en cada tecla */

  /* Un campo es secreto si lo dice su tipo, su id, su name o su marca. Se mira
     todo, no solo el tipo: hay PINs en inputs de texto con inputmode numeric. */
  function esSecreto(el) {
    if (!el) return true;
    if (el.type === "password") return true;
    if (el.hasAttribute("data-sin-borrador")) return true;
    var pista = ((el.id || "") + " " + (el.name || "") + " " + (el.getAttribute("autocomplete") || "")).toLowerCase();
    return /pin|clave|password|passwd|secret|token|cvv|tarjeta/.test(pista);
  }

  function guardable(el) {
    if (!el || esSecreto(el)) return false;
    var t = (el.tagName || "").toUpperCase();
    if (t === "SELECT" || t === "TEXTAREA") return true;
    if (t !== "INPUT") return false;
    return ["text", "number", "email", "tel", "url", "search", "date", "checkbox", "radio", ""]
      .indexOf((el.type || "text").toLowerCase()) >= 0;
  }

  function clave(nombre) { return PREFIJO + nombre; }

  function leer(nombre) {
    try {
      var o = JSON.parse(localStorage.getItem(clave(nombre)) || "null");
      if (!o || (Date.now() - (o.t || 0)) > VIDA_MS) return null;
      return o.v || null;
    } catch (_) { return null; }
  }

  function borrar(nombre) {
    try { localStorage.removeItem(clave(nombre)); } catch (_) {}
  }

  function campos(cont) {
    return Array.prototype.filter.call(cont.querySelectorAll("input,select,textarea"), guardable);
  }

  /* La llave de cada campo es su id; si no tiene, su name; y si tampoco, su
     posición. La posición es frágil pero es mejor que perder el dato, y solo
     se usa en formularios que no pusieron id. */
  function llave(el, i) { return el.id || el.name || ("_" + i); }

  function guardar(cont, nombre) {
    try {
      var v = {};
      campos(cont).forEach(function (el, i) {
        var k = llave(el, i);
        if (el.type === "checkbox" || el.type === "radio") { if (el.checked) v[k] = "1"; }
        else if (el.value !== "") v[k] = el.value;
      });
      if (!Object.keys(v).length) { borrar(nombre); return; }
      localStorage.setItem(clave(nombre), JSON.stringify({ t: Date.now(), v: v }));
    } catch (_) {}
  }

  function restaurar(cont, nombre) {
    var v = leer(nombre);
    if (!v) return false;
    var puso = false;
    campos(cont).forEach(function (el, i) {
      var k = llave(el, i);
      if (!(k in v)) return;
      /* NO se pisa lo que el formulario ya trae puesto: al EDITAR un producto,
         los campos vienen con los valores reales y un borrador viejo los
         reemplazaria con datos que el duenio ya cambio. El borrador solo llena
         huecos (JFC: "que no cambie lo que se puede editar luego"). */
      if (el.type === "checkbox" || el.type === "radio") {
        if (!el.checked) { el.checked = v[k] === "1"; puso = puso || el.checked; }
        return;
      }
      if (el.value === "") { el.value = v[k]; puso = true; }
    });
    return puso;
  }

  /* Aviso discreto de que hubo rescate, con opción de descartar. Sin esto, el
     usuario ve campos llenos y no sabe por qué. */
  function avisar(cont, nombre) {
    if (cont.querySelector(".oc-borrador-aviso")) return;
    var p = document.createElement("p");
    p.className = "oc-borrador-aviso";
    p.style.cssText = "font-size:14px;line-height:1.5;margin:0 0 10px;padding:9px 11px;" +
      "border-radius:8px;background:#FFF8E1;border:2px solid #E8A020;color:#8A5A00;font-weight:700;";
    p.innerHTML = 'Recuperamos lo que habías escrito. ' +
      '<button type="button" style="background:none;border:none;text-decoration:underline;' +
      'cursor:pointer;font:inherit;color:#8A5A00;padding:4px;min-height:44px;">Empezar de cero</button>';
    p.querySelector("button").addEventListener("click", function () {
      campos(cont).forEach(function (el) {
        if (el.type === "checkbox" || el.type === "radio") el.checked = false; else el.value = "";
      });
      borrar(nombre);
      p.remove();
    });
    cont.insertBefore(p, cont.firstChild);
  }

  function activar(cont) {
    if (!cont || cont.dataset.borradorListo) return;
    var nombre = cont.getAttribute("data-borrador");
    if (!nombre) return;
    cont.dataset.borradorListo = "1";

    if (restaurar(cont, nombre)) avisar(cont, nombre);

    var reloj = null;
    var pendiente = function () {
      clearTimeout(reloj);
      reloj = setTimeout(function () { guardar(cont, nombre); }, GUARDA_MS);
    };
    cont.addEventListener("input", pendiente);
    cont.addEventListener("change", pendiente);

    /* Guardado inmediato al irse: el debounce de 400 ms no alcanza cuando el
       usuario cierra la pestana o cambia de app en el telefono. pagehide es el
       unico evento fiable en iOS; beforeunload no dispara alli. */
    var alSalir = function () { clearTimeout(reloj); guardar(cont, nombre); };
    window.addEventListener("pagehide", alSalir);
    window.addEventListener("beforeunload", alSalir);
    document.addEventListener("visibilitychange", function () { if (document.hidden) alSalir(); });
  }

  /* Se limpia cuando el formulario cumplio su proposito. Lo llama la app tras
     guardar de verdad: window.OCBorrador.limpiar("alta-producto"). */
  function limpiar(nombre) { borrar(nombre); }

  function escanear() {
    try {
      document.querySelectorAll("[data-borrador]").forEach(activar);
    } catch (_) {}
  }

  /* Los formularios de esta app se crean con JS despues de cargar, asi que no
     basta con escanear una vez: se vigila el DOM. */
  function arrancar() {
    escanear();
    try {
      new MutationObserver(function () { escanear(); })
        .observe(document.body, { childList: true, subtree: true });
    } catch (_) {}
  }

  window.OCBorrador = { limpiar: limpiar, activar: activar, escanear: escanear };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();
