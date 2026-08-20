/*!
 * feature-gate.js — R4: kill-switch remoto por feature (JFC 2026-08-20)
 *
 * QUE RESUELVE: hoy, apagar una feature rota en produccion exige subir el
 * shell entero y esperar a que cada telefono actualice. Esto lee un campo
 * nuevo de version.json ("apagar": ["idDeFeature", ...]) SIN cachearlo
 * nunca (mismo tratamiento que A4 le da a version.json), asi que un cambio
 * ahi se ve apenas el dispositivo tiene red, sin republicar el shell.
 *
 * COMO SE USA: antes de correr una feature que podria tener un kill-switch,
 * preguntar `window.OCApagado("idDeFeature")`. Si da true, mostrar el aviso
 * de "temporalmente desactivado" en vez de ejecutar la feature.
 *
 * FALLA ABIERTO A PROPOSITO: mientras el fetch no responde (o si falla),
 * OCApagado() devuelve false para CUALQUIER id — un kill-switch que no
 * pudo hablar con el server nunca debe tumbar la app por su cuenta. Esto
 * es autocuracion, no un guardian: solo apaga lo que alguien apago a
 * proposito, nunca por accidente de red.
 */
(function () {
  "use strict";
  var _apagados = [];
  var _listo = false;
  try {
    fetch("version.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (v) {
        if (v && Array.isArray(v.apagar)) _apagados = v.apagar;
        _listo = true;
      })
      .catch(function () { _listo = true; });
  } catch (_) { _listo = true; }

  var _usado = false;
  window.OCApagado = function (id) {
    _usado = true;
    return _apagados.indexOf(id) !== -1;
  };
  window.OCApagadoListo = function () {
    return _listo;
  };

  // AUTOCURACION (JFC 2026-08-20, bug A2/G5): el kill-switch se cargaba pero
  // nada de la app lo consultaba nunca -- si algun dia se pone algo en
  // version.json.apagar, no pasaria nada porque nadie pregunta. Avisa fuerte
  // en consola si tras 5s de carga OCApagado() nunca se llamo, en vez de
  // fallar en silencio como hoy.
  setTimeout(function () {
    if (!_usado) {
      try { console.warn("[feature-gate] OCApagado() nunca se llamo en los primeros 5s -- el kill-switch esta montado pero ninguna feature lo consulta todavia."); } catch (_) {}
    }
  }, 5000);
})();
