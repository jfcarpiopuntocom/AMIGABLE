// idb-archivo.js — AMIGABLE (Fase 2 del plan de blindaje de datos, 2026-08-04)
// ============================================================================
// POR QUE: cuando localStorage se llena, guardarEstadoLocal() (mock-backend.js)
// tenia que elegir entre no guardar la venta de HOY o recortar/borrar el log de
// actividad VIEJO. El log de actividad es a la vez la evidencia forense de un
// robo y el insumo de la reconciliacion (hechos.js/reconciliacion.js) — hasta
// ahora, recortarlo significaba BORRARLO para siempre.
//
// Este modulo mueve los movimientos viejos a IndexedDB (sin techo practico de
// espacio, mismo criterio que idb-fotos.js) en vez de descartarlos.
//
// CONTRATO: put() usa el id del propio movimiento como clave — reintentar con
// el mismo lote no duplica nada. Si IndexedDB no existe: no-op seguro.
(function(){const DB_NAME="amigable_archivo";const STORE="movimientos";const SOPORTADO="indexedDB"in window;let dbPromise=null;function abrirDB(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:"id"})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error("IndexedDB bloqueado (otra pestaña con una version vieja abierta)"))});return dbPromise}async function archivarLote(movimientos){if(!SOPORTADO||!Array.isArray(movimientos)||!movimientos.length)return false;try{const db=await abrirDB();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");const store=tx.objectStore(STORE);movimientos.forEach((m,i)=>{const conId=m&&m.id?m:{...m,id:(m&&m.fecha?m.fecha:"sinfecha")+"_"+i+"_"+Math.random().toString(36).slice(2,8)};store.put(conId)});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});return true}catch(err){console.error("[idb-archivo] archivarLote:",err);return false}}async function leerTodos(){if(!SOPORTADO)return[];try{const db=await abrirDB();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readonly");const req=tx.objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)})}catch(err){console.error("[idb-archivo] leerTodos:",err);return[]}}async function contar(){if(!SOPORTADO)return 0;try{const db=await abrirDB();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readonly");const req=tx.objectStore(STORE).count();req.onsuccess=()=>resolve(req.result||0);req.onerror=()=>reject(req.error)})}catch(_){return 0}}window.OCArchivo={archivarLote:archivarLote,leerTodos:leerTodos,contar:contar,soportado:()=>SOPORTADO}})();
