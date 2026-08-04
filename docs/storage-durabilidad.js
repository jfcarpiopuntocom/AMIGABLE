// storage-durabilidad.js — AMIGABLE (Fase 1 del plan de blindaje de datos, 2026-08-04)
// ============================================================================
// QUE HACE: navigator.storage.persist() se llamaba una sola vez, al activar el
// dispositivo (auth-ui.js), sin leer el resultado. Si el navegador lo negaba
// (comun en iOS Safari sin instalar la PWA, o bajo presion de espacio), nadie
// se enteraba nunca — y localStorage/IndexedDB quedan en modo "best-effort":
// el sistema operativo puede borrarlos sin avisar si el dispositivo necesita
// espacio y la app lleva dias sin abrirse.
//
// Este modulo centraliza esa llamada, LEE el resultado, lo recuerda, reintenta
// en cada arranque mientras no este concedido, y expone el estado para que la
// UI pueda avisar honestamente al dueno si sus datos siguen en riesgo.
//
// Si la API no existe o falla: no rompe nada, la app sigue exactamente igual
// que hoy. Mismo criterio de cero dependencia obligatoria que sync-realtime.js.
(function(){const KEY_ESTADO="amigable_storage_persist";function leerEstado(){try{return JSON.parse(localStorage.getItem(KEY_ESTADO)||"null")}catch(_){return null}}function guardarEstado(persistido){try{localStorage.setItem(KEY_ESTADO,JSON.stringify({persistido:persistido,verificadoEn:Date.now()}))}catch(_){}}async function verificarYSolicitar(){if(!navigator.storage||!navigator.storage.persist||!navigator.storage.persisted){guardarEstado(null);return null}try{let ya=await navigator.storage.persisted();if(!ya)ya=await navigator.storage.persist();guardarEstado(!!ya);return!!ya}catch(_){const e=leerEstado();return e?e.persistido:null}}function estadoConocido(){const e=leerEstado();return e?e.persistido:null}window.OCStorageDurable={verificarYSolicitar:verificarYSolicitar,estadoConocido:estadoConocido};try{verificarYSolicitar()}catch(_){}})();
