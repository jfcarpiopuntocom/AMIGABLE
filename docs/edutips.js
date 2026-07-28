/*!
 * edutips.js — Amigable-123
 * ============================================================================
 * QUE ES
 * ----------------------------------------------------------------------------
 * La cajita azul al pie de la vista contable. Una reflexion corta que ensena a
 * leer los numeros que el dueno ya tiene en pantalla, no un dato nuevo.
 *
 * REGLA DE COLOR (JFC 2026-07-28) — IMPORTANTE, NO ROMPER
 * ----------------------------------------------------------------------------
 * El azul esta EXCLUIDO de tableros y tarjetas de inventario: ahi el color es
 * lenguaje de accion (los colores Simon) y meter azul lo ensucia. El azul vive
 * SOLO en dos lugares, ambos serenos y ambos al pie de su seccion:
 *   1. "En observacion" — productos con margen flaco.
 *   2. Esta cajita — reflexion o tip contable.
 * Si alguna vez hace falta azul en otro lado, primero preguntar. Ver la memoria
 * project_blue_semantic_rule.
 *
 * COMO CAMBIAR EL TEXTO
 * ----------------------------------------------------------------------------
 * Edita el arreglo TIPS de abajo y listo. Rota uno por dia (deterministico, no
 * al azar: el dueno ve el mismo tip todo el dia y puede volver a leerlo, en vez
 * de que se le cambie debajo de los ojos al refrescar).
 * ============================================================================
 */
(function (global) {
  "use strict";

  // Cada tip: titulo corto + cuerpo de una o dos frases. Nada de jerga
  // contable sin traducir — si aparece un termino tecnico, se explica en la
  // misma frase. Espanol neutro, sin regionalismos.
  var TIPS = [
    {
      t: "Margen no es ganancia",
      c: "El margen es lo que queda del precio despues del costo del producto. La ganancia es lo que queda despues de TODO: arriendo, luz, sueldos. Un producto con buen margen puede seguir dejandote en cero si vendes pocas unidades."
    },
    {
      t: "Lo que no rota, cuesta",
      c: "Un producto parado en la percha es dinero tuyo dormido. Aunque no se dane, te esta costando: ese mismo dinero podria estar comprando algo que si sale."
    },
    {
      t: "Vender mas no siempre es ganar mas",
      c: "Si subes ventas bajando precios y el margen queda muy delgado, trabajas mas para ganar lo mismo. Mira la columna de margen antes de celebrar un dia de muchas ventas."
    },
    {
      t: "El gasto fijo no espera",
      c: "El arriendo y los sueldos corren los dias que vendes y los que no. Por eso el P&G reparte tu gasto mensual entre todos los dias: para que sepas cuanto necesitas vender un dia cualquiera solo para empatar."
    },
    {
      t: "Tu inventario es plata, no cosas",
      c: "El inventario valorizado te dice cuanto dinero tuyo esta ahora mismo convertido en producto. Si esa cifra crece mes a mes pero las ventas no, el dinero se te esta quedando quieto en la percha."
    },
    {
      t: "Comision pagada es costo real",
      c: "La comision de un socio o comisionista sale de tu margen, no de un bolsillo aparte. Registrala siempre: un negocio que la olvida cree que gana mas de lo que gana."
    },
    {
      t: "Precio bajo no fideliza solo",
      c: "El cliente que llega solo por precio se va con el primero que baje mas. Los datos de clientes que ya tienes sirven para saber quien vuelve — esos son los que sostienen el negocio."
    }
  ];

  // Indice deterministico por dia: el mismo tip toda la jornada. Se usa la fecha
  // local (no UTC) para que el cambio ocurra a medianoche del dueno, no a una
  // hora rara.
  function tipDeHoy() {
    try {
      var d = new Date();
      var dias = Math.floor(
        (d - new Date(d.getFullYear(), 0, 0)) / 86400000
      );
      return TIPS[Math.abs(dias) % TIPS.length];
    } catch (_) {
      return TIPS[0];
    }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Colores solidos y explicitos, con -webkit-text-fill-color: iOS en modo
  // oscuro reinterpreta los colores heredados y deja el texto invisible. Ver la
  // regla de legibilidad iOS/WhatsApp en CLAUDE.md — no quitar los !important.
  function pintar(mount) {
    if (!mount) return;
    var tip = tipDeHoy();
    mount.innerHTML =
      '<div style="font-size:.82rem;font-weight:700;letter-spacing:.04em;'
      + 'color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;'
      + 'margin:0 0 6px;">PARA APROVECHAR MEJOR TU APP</div>'
      + '<div style="font-family:Georgia,serif;font-size:17px;font-weight:700;'
      + 'color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;'
      + 'margin:0 0 6px;">' + esc(tip.t) + '</div>'
      + '<div style="font-size:16px;line-height:1.55;'
      + 'color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;'
      + 'margin:0;">' + esc(tip.c) + '</div>';
  }

  function montar() {
    pintar(document.getElementById("oc-edutip-contable"));
  }

  global.OCEdutips = { montar: montar, tipDeHoy: tipDeHoy, TIPS: TIPS };

  // La vista contable se pinta con cargarAvanzado(); montamos al cargar el DOM
  // y ademas exponemos montar() para que avanzado-extra.js lo llame si repinta.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar, { once: true });
  } else {
    montar();
  }
})(typeof window !== "undefined" ? window : this);
