(function(){const escHtml=window.escHtml||(s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])));function $(id){return document.getElementById(id)}const API="/api";
  /* Fix 2026-07-23 (JFC): el respaldo escaneaba solo localStorage para las fotos
     de percha, pero idb-fotos.js migra esas fotos a IndexedDB y las borra de
     localStorage — el respaldo quedaba sin fotos, silenciosamente, en cualquier
     dispositivo donde ya corrió la migración. Ahora se leen primero de
     window.OCFotos (IndexedDB) y se completa con lo que quede en localStorage
     (dispositivos viejos sin IndexedDB o migración a medias). */
  async function recolectarFotosPerchasRespaldo(){const out={};try{if(window.OCFotos){const todas=await window.OCFotos.leerTodas();Object.entries(todas||{}).forEach(([id,dataUrl])=>{out["vp_foto_percha_"+id]=dataUrl})}}catch(_){}try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf("vp_foto_percha_")===0&&!(k in out))out[k]=localStorage.getItem(k)}}catch(_){}return out}let desbloqueadaSesion=false;function ubic(){const s=$("selectUbicacion");return s?s.value:"todas"}const money=n=>"$"+Number(n||0).toFixed(2);let reasignacionViaMaestro=false;const OCSync=function(){const MET_ESCRITURA=["POST","PUT","PATCH","DELETE"];const RUTAS_EXCLUIDAS=["/api/sync","/api/respaldo"];const fetchOriginal=window.fetch.bind(window);let cola=[];let temporizador=null;let syncOn=localStorage.getItem("oc_sync_on")==="1";function deviceId(){let id=localStorage.getItem("oc_device_id");if(!id){id=Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);localStorage.setItem("oc_device_id",id)}return id}function opId(){return deviceId()+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6)}function urlDe(input){return typeof input==="string"?input:input&&input.url||""}if(!window.__ocSyncPatched){window.__ocSyncPatched=true;window.fetch=async function(input,init){const res=await fetchOriginal(input,init);try{if(syncOn&&res.ok){const url=urlDe(input);const method=(init&&init.method||"GET").toUpperCase();const excluida=RUTAS_EXCLUIDAS.some(r=>url.indexOf(r)!==-1);if(url.indexOf("/api/")!==-1&&!excluida&&MET_ESCRITURA.includes(method)){cola.push({id:opId(),ts:Date.now(),dev:deviceId(),method:method,url:url,body:init&&init.body||null});await guardarColaCifrada()}}}catch(_){}return res}}async function guardarColaCifrada(){if(!window.OCSecure.syncActiva())return;const blob=await window.OCSecure.cifrarSync(JSON.stringify(cola));if(blob)localStorage.setItem("oc_sync_pending",blob)}async function restaurarCola(){if(!window.OCSecure.syncActiva())return;const blob=localStorage.getItem("oc_sync_pending");if(!blob)return;const texto=await window.OCSecure.descifrarSync(blob);if(texto){try{cola=JSON.parse(texto)||[]}catch{cola=[]}}}function idsAplicados(){try{return new Set(JSON.parse(localStorage.getItem("oc_sync_ids_aplicados")||"[]"))}catch{return new Set}}function guardarIdsAplicados(set){localStorage.setItem("oc_sync_ids_aplicados",JSON.stringify(Array.from(set).slice(-3e3)))}async function reproducir(ops){const aplicados=idsAplicados();const porDispositivo={};ops.forEach(op=>{if(op&&typeof op==="object"&&op.dev!==deviceId()&&op.id&&!aplicados.has(op.id))(porDispositivo[op.dev]=porDispositivo[op.dev]||[]).push(op)});for(const dev in porDispositivo){const pendientes=porDispositivo[dev].sort((a,b)=>a.ts-b.ts);for(const op of pendientes){if(typeof op.url!=="string"||op.url.indexOf("/api/")!==0)break;try{await fetchOriginal(op.url,{method:op.method,headers:{"Content-Type":"application/json"},body:op.body});aplicados.add(op.id)}catch(_){break}}}guardarIdsAplicados(aplicados)}async function activar(pin){const ok=await window.OCSecure.activarSync(pin);if(!ok)return false;syncOn=true;localStorage.setItem("oc_sync_on","1");await restaurarCola();arrancarIntervalo();return true}function desactivar(){syncOn=false;localStorage.removeItem("oc_sync_on");window.OCSecure.desactivarSync();if(temporizador)clearInterval(temporizador)}function activa(){return syncOn}function requiereReactivar(){return syncOn&&!window.OCSecure.syncActiva()}function pendientes(){return cola.length}async function push(){if(!syncOn||!window.OCSecure.syncActiva()||!cola.length)return{ok:true,enviado:0};const n=cola.length;const paraEnviar=cola.slice(0,n);const blob=await window.OCSecure.cifrarSync(JSON.stringify(paraEnviar));try{const res=await fetchOriginal(`${API}/sync/push`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({device:deviceId(),blob:blob})});if(!res.ok)return{ok:false,motivo:"Tu servidor de sync rechazó el envío."};cola=cola.slice(n);await guardarColaCifrada();return{ok:true,enviado:n}}catch(_){return{ok:false,motivo:"Sin conexión a tu servidor de sync (¿ya agregaste las rutas /api/sync?)."}}}async function pull(){if(!syncOn||!window.OCSecure.syncActiva())return{ok:true,recibido:0};try{const res=await fetchOriginal(`${API}/sync/pull?device=${encodeURIComponent(deviceId())}`,{method:"GET"});if(!res.ok)return{ok:false,motivo:"Tu servidor de sync rechazó la consulta."};const paquetes=await res.json()||[];let recibido=0;for(const p of paquetes){if(p.device===deviceId())continue;const texto=await window.OCSecure.descifrarSync(p.blob);if(!texto)continue;let ops=[];try{ops=JSON.parse(texto)}catch(_){}if(ops.length){await reproducir(ops);recibido+=ops.length}}return{ok:true,recibido:recibido}}catch(_){return{ok:false,motivo:"Sin conexión a tu servidor de sync."}}}let onlineListenerListo=false;// FIX (JFC 2026-07-28, auditoria sync): push()/pull() apuntan a /api/sync/push
// y /api/sync/pull, rutas de un servidor propio (Fly.io) que nunca se
// desplego — mock-backend.js no las implementa. El intervalo de 4 minutos
// llamaba a esas rutas para siempre, en el vacio, cada vez que alguien
// activaba este panel: ancho de banda y bateria gastados en una llamada que
// SIEMPRE fallaba. Se deja el temporizador declarado (por si push/pull se
// implementan a futuro) pero sin disparar la llamada muerta. El camino que
// SI funciona hoy es "Copiar cambios"/WhatsApp/QR, que no depende de esto.
function arrancarIntervalo(){if(temporizador)clearInterval(temporizador)}async function generarPaqueteManual(){if(!cola.length)return null;const blob=await window.OCSecure.cifrarSync(JSON.stringify(cola));const paquete={v:1,device:deviceId(),blob:blob};return"OCSYNC1:"+btoa(unescape(encodeURIComponent(JSON.stringify(paquete))))}const MANUAL_MAX_BYTES=2*1024*1024;async function importarPaqueteManual(texto){texto=(texto||"").trim();if(texto.indexOf("OCSYNC1:")!==0)return{ok:false,motivo:"Ese texto no es un paquete de sincronización válido."};if(texto.length>MANUAL_MAX_BYTES)return{ok:false,motivo:"Ese paquete es demasiado grande para ser válido."};let paquete;try{paquete=JSON.parse(decodeURIComponent(escape(atob(texto.slice(8)))))}catch(_){return{ok:false,motivo:"El paquete está corrupto o incompleto."}}if(!paquete||paquete.v!==1||typeof paquete.blob!=="string"||typeof paquete.device!=="string")return{ok:false,motivo:"El paquete no tiene el formato esperado."};if(paquete.device===deviceId())return{ok:false,motivo:"Ese paquete es de este mismo dispositivo."};const texto2=await window.OCSecure.descifrarSync(paquete.blob);if(!texto2)return{ok:false,motivo:"No se pudo descifrar (¿es del mismo negocio, con el mismo PIN de dueño activado aquí?)."};let ops=[];try{ops=JSON.parse(texto2)}catch(_){}if(!Array.isArray(ops))return{ok:false,motivo:"El contenido del paquete no es una lista de operaciones válida."};if(!ops.length)return{ok:true,recibido:0};try{await reproducir(ops)}catch(_){return{ok:false,motivo:"El paquete tiene operaciones dañadas y no se pudo aplicar."}}return{ok:true,recibido:ops.length}}if(syncOn)restaurarCola();return{activar:activar,desactivar:desactivar,activa:activa,requiereReactivar:requiereReactivar,pendientes:pendientes,push:push,pull:pull,generarPaqueteManual:generarPaqueteManual,importarPaqueteManual:importarPaqueteManual,deviceId:deviceId}}();function init(){const vista=$("vista-avanzado");if(!vista||vista.dataset.ocReady)return;vista.dataset.ocReady="1";const cont=document.createElement("div");cont.id="oc-contable";cont.style.display="none";const tboxes=document.createElement("div");tboxes.id="oc-taccounts";tboxes.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin:6px 0 22px;";cont.appendChild(tboxes);const chartBox=document.createElement("div");chartBox.className="tag-card";chartBox.style.cssText="margin-bottom:22px;text-align:left;";chartBox.innerHTML=`<h3 class="seccion" style="margin-top:0;">Comparativo por ubicación (este mes)</h3><div id="oc-chart"></div>`;cont.appendChild(chartBox);const marcadores=["tablaPL","tablaBalance","tablaValorizado"];marcadores.forEach(idTabla=>{const tabla=$(idTabla);if(!tabla)return;const wrap=tabla.closest(".tabla-wrap");const h3=wrap&&wrap.previousElementSibling;if(h3&&h3.tagName==="H3")cont.appendChild(h3);if(wrap)cont.appendChild(wrap)});const descargaBox=document.createElement("div");descargaBox.className="tag-card";descargaBox.style.cssText="text-align:left;margin-top:22px;";descargaBox.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Reporte para el contador</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">P&amp;G, balance e inventario valorizado en un solo archivo, listo para Excel. No es una declaración ante el SRI — es el insumo para que tu contador la prepare.</p>\n      <button id="oc-descargar-csv" class="ir" style="background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">Descargar reporte contable (.csv)</button>\n    `;cont.appendChild(descargaBox);const respaldo=document.createElement("div");respaldo.className="tag-card";respaldo.style.cssText="text-align:left;margin-top:22px;";respaldo.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Respaldo</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">\n        Descarga TODO tu negocio (productos, ventas, movimientos, gastos, claves y fotos de perchas) en un archivo. Guárdalo en tu correo, tu Drive, donde sea — es tu copia de seguridad si se borra el caché o se daña el dispositivo.</p>\n      <div style="display:flex;gap:10px;flex-wrap:wrap;">\n        <button id="oc-exportar" class="ir" style="background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">⬇️ Exportar respaldo</button>\n        <label class="ir" style="background:var(--rust);color:var(--blanco-calido);border-color:var(--rust-deep);display:inline-flex;align-items:center;cursor:pointer;">⬆️ Importar respaldo\n          <input id="oc-importar-file" type="file" accept=".json" style="display:none;">\n        </label>\n      </div>\n      <p id="oc-respaldo-msg" style="font-size:14px;margin-top:10px;font-weight:700;"></p>\n      <hr style="border:none;border-top:1px solid var(--azul-suave,#dde5ec);margin:16px 0;">\n      <h4 style="margin:0 0 6px;font-size:14px;">Caja fuerte local (automática)</h4>\n      <p style="font-size:13px;color:var(--ink-soft);margin-top:0;">\n        Además del respaldo manual de arriba, amigable-123 guarda solo AQUÍ (en este navegador) una foto de tus datos cada cierto tiempo,\n        por si borras algo sin querer. Esto NO reemplaza el respaldo manual — si se borra el caché del navegador, se pierden estos puntos también.\n        <em>Próximamente: replicación automática de estos puntos entre tus dispositivos. Mientras tanto, puedes copiar tus datos a otro equipo desde Avanzado → Sincronizar por QR.</em></p>\n      <p id="oc-caja-alerta" style="font-size:13px;font-weight:700;"></p>\n      <div style="display:flex;gap:10px;flex-wrap:wrap;">\n        <button id="oc-caja-guardar" style="font-size:13px;padding:8px 12px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Guardar punto ahora</button>\n        <button id="oc-caja-ver" style="font-size:13px;padding:8px 12px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Ver puntos guardados</button>\n      </div>\n      <div id="oc-caja-lista" style="display:none;margin-top:10px;"></div>\n    `;cont.appendChild(respaldo);(async()=>{try{if(!navigator.storage||!navigator.storage.estimate)return;const{usage,quota}=await navigator.storage.estimate();const p=document.createElement("p");p.id="oc-storage-info";p.style.cssText="font-size:13px;color:var(--ink-soft);margin:10px 0 0;font-family:monospace;";if(!quota)return;const mb=n=>(n/1048576).toFixed(1)+" MB";p.textContent="Storage: "+mb(usage)+" used / "+mb(quota)+" quota ("+Math.round((usage/quota)*100)+"%)";const lista=document.getElementById("oc-caja-lista");if(lista&&lista.parentNode&&!document.getElementById("oc-storage-info"))lista.parentNode.insertBefore(p,lista.nextSibling);}catch(_){}})();fetch(`${API}/instancia`).then(r=>r.json()).then(({apropiada})=>{if(!apropiada){const b=document.getElementById("oc-exportar");if(b){b.disabled=true;b.title="Activa este dispositivo (PIN 789) para exportar respaldos.";b.style.opacity="0.5";b.style.cursor="not-allowed"}}}).catch(()=>{});const lock=document.createElement("div");lock.id="oc-acct-lock";lock.className="tag-card";lock.innerHTML=`<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;"><button id="oc-acct-open">Ver capa contable</button><button id="oc-sync-tablero" class="ir" style="background:#0F1923;border-color:#0F1923;color:#FFFFFF;">Abrir mi tablero de control</button></div>`;const aviso=vista.querySelector(".avanzado-aviso");if(aviso)aviso.insertAdjacentElement("afterend",lock);else vista.appendChild(lock);vista.appendChild(cont);$("oc-acct-open").addEventListener("click",async()=>{if(!desbloqueadaSesion){const ok=await window.OCAuth.pedirSubclaveContable();if(!ok)return;desbloqueadaSesion=true}lock.style.display="none";cont.style.display="block";await render()});const gestion=document.createElement("div");gestion.className="panel-escaner tag-card";gestion.style.cssText="text-align:left;margin-top:22px;";gestion.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Acceso y recuperación</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">Correo del dueño para recuperar las claves. Una vez guardado se oculta y queda ofuscado.</p>\n      <div id="oc-email-row"></div>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:18px;">Tu WhatsApp (opcional) — para que la app te envie resumenes utiles, y para fortalecer como sincronizan tus datos entre dispositivos.</p>\n      <div id="oc-whatsapp-row"></div>\n      <div id="oc-clave-block" style="margin-top:18px;">\n        <p style="font-size:14px;color:var(--ink-soft);">Claves (PIN de 3 dígitos). Por seguridad, los códigos actuales NO se muestran aquí (se guardan cifrados) — escribe los NUEVOS solo si quieres cambiarlos.</p>\n        <div style="display:flex;flex-direction:column;gap:8px;max-width:340px;">\n          <label style="font-size:13px;">Dueño <input id="oc-c-owner" maxlength="3" inputmode="numeric" placeholder="•••" style="margin-left:8px;width:90px;text-align:center;font-family:var(--font-mono);padding:8px;border:2px solid var(--azul-medio);border-radius:5px;"></label>\n          <label style="font-size:13px;">Encargado <input id="oc-c-emp" maxlength="3" inputmode="numeric" placeholder="•••" style="margin-left:8px;width:90px;text-align:center;font-family:var(--font-mono);padding:8px;border:2px solid var(--azul-medio);border-radius:5px;"></label>\n          <label style="font-size:13px;">Contable <input id="oc-c-acct" maxlength="3" inputmode="numeric" placeholder="•••" style="margin-left:8px;width:90px;text-align:center;font-family:var(--font-mono);padding:8px;border:2px solid var(--azul-medio);border-radius:5px;"></label>\n        </div>\n        <button id="oc-save-codes" class="ir" style="margin-top:12px;background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">Guardar nuevas claves</button>\n        <p id="oc-codes-msg" style="font-size:14px;margin-top:8px;"></p><hr style="border:none;border-top:1px solid var(--azul-suave,#dde5ec);margin:16px 0;"><h4 style="margin:0 0 6px;font-size:14px;color:var(--ink);">Password de recuperacion</h4><p style="font-size:13px;color:var(--ink-soft);margin-top:0;">Tu llave para recuperar el acceso si olvidas tu PIN, sin depender de nadie. <span id="oc-pwd-estado" style="font-weight:700;"></span></p><button id="oc-pwd-cambiar" style="font-size:13px;padding:8px 12px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Crear o cambiar mi password</button>\n      </div>`;vista.appendChild(gestion);(function(){try{var _pe=document.getElementById("oc-pwd-estado");if(_pe&&window.OCAuth&&window.OCAuth.tieneOwnerPassword){var _t=window.OCAuth.tieneOwnerPassword();_pe.textContent=_t?"Ya la tienes configurada.":"Aun no la has creado.";_pe.style.color=_t?"var(--verde,#2f7a4f)":"var(--rust,#E86040)";}var _pb=document.getElementById("oc-pwd-cambiar");if(_pb)_pb.addEventListener("click",function(){if(window.OCAuth&&window.OCAuth.pedirPasswordInicial){window.OCAuth.pedirPasswordInicial();setTimeout(function(){var e=document.getElementById("oc-pwd-estado");if(e&&window.OCAuth.tieneOwnerPassword()){e.textContent="Ya la tienes configurada.";e.style.color="var(--verde,#2f7a4f)";}},3000);}});}catch(_){}})();
/* --- Respaldo soberano por correo/WhatsApp (portado desde friendly-123, JFC 2026-07-21) ---
   Vive FUERA de la subclave contable (junto a Gestión): preferencia de seguridad
   del dueño, no dato contable sensible. El módulo backup-scheduler.js hace todo
   el trabajo; aquí solo montamos. */
// === SINCRONIZAR EQUIPO (tiempo real, 2026-07-23; ajustado por licencia) ===
// Solo dueño. Si nunca hay licencia/codigo, la app funciona exactamente igual
// que siempre (solo local) - este panel es 100% opcional, cero dependencia.
// 2026-07-23: sync ya NO es un "modo evento" que se prende y apaga - el
// dueño lo activa solo (automatico al licenciarse) y desde ahi corre 24/7
// para siempre, haya o no haya feria. Este panel es de ESTADO, no de switch.
(function () {
  if (!window.OCSyncControl) return; // sync-realtime.js no cargo (offline first-load raro): panel se omite, no rompe nada
  const panel = document.createElement("div");
  panel.className = "tag-card";
  panel.id = "oc-sync-panel";
  panel.style.cssText = "text-align:left;margin-top:22px;";
  /* La sala se muestra bajo el rotulo "Tu licencia", asi que una sala de otra
     app se leia como una licencia ajena (bug en vivo, iPhone de JFC). Se filtra
     igual que la licencia: si no es de esta familia se trata como si no hubiera
     sala, y el panel ofrece activarla con la propia. */
  const _salaCruda = window.OCSyncControl.salaActiva();
  const salaActiva = /^AMG-/i.test(String(_salaCruda || "")) ? _salaCruda : "";
  if (_salaCruda && !salaActiva) {
    try { console.warn("[sync] sala de otra app, se ignora:", _salaCruda); } catch (_) {}
  }
  /* LICENCIA AJENA (bug en vivo, iPhone de JFC, 2026-08-15). aislamiento.js
     rescata del espacio comun las claves con prefijo "amigable_", y
     friendly-123 —que es un fork de esta app— escribe con esos mismos nombres.
     En un telefono donde se abrieron las dos, AMIGABLE terminaba mostrando la
     licencia F123 de la otra app como si fuera la propia.

     Aqui SOLO se acepta una licencia de esta app. No se borra nada: la ajena
     se ignora y punto, porque borrarla dejaria sin acceso a la otra app. */
  function _licenciaDeEstaApp() {
    try {
      var c = (JSON.parse(localStorage.getItem("amigable_owned") || "null") || {}).licenseCode || "";
      return /^AMG-/i.test(c) ? c : "";
    } catch (_) { return ""; }
  }
  const codigoPrecargado = _licenciaDeEstaApp();
  panel.innerHTML = `
    <h3 class="seccion" style="margin-top:0;">Sincronizar equipo</h3>
    <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">
      Todos los dispositivos de tu equipo (dueño, admins, empleados) que tengan
      tu licencia quedan sincronizados en segundos, siempre —
      no solo en ferias. Ventas, ajustes y transferencias de stock se avisan
      entre todos al instante, para que nadie venda las mismas últimas
      unidades sin saberlo.
    </p>
    <p style="font-size:13px;color:var(--sim-verde-dk,#1a6e3c);font-weight:700;margin-top:0;">
      Tus datos solo viajan cifrados entre los dispositivos de tu propio
      equipo. Nunca llegan a AMIGABLE ni a nadie más — ni siquiera nosotros
      podemos leerlos.
    </p>
    <div id="oc-sync-estado" style="font-size:13px;font-weight:700;margin-bottom:10px;"></div>
    <div id="oc-sync-apagado" style="display:${salaActiva ? "none" : "flex"};gap:8px;flex-wrap:wrap;align-items:center;">
      <input id="oc-sync-codigo" type="text" value="${escHtml(codigoPrecargado)}" placeholder="Tu licencia (AMG-XXXX-XXXX-XXXX)" maxlength="40"
        style="flex:1;min-width:220px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;">
      <button id="oc-sync-activar" class="ir">Activar</button>
    </div>
    <div id="oc-sync-activo" style="display:${salaActiva ? "block" : "none"};">
      <p style="font-size:13px;color:var(--ink-soft);">Tu licencia — compártela con cada celular nuevo UNA sola vez:</p>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <code id="oc-sync-codigo-actual" style="font-size:16px;font-weight:700;background:var(--paper-deep,#E2E8ED);padding:6px 12px;border-radius:6px;">${escHtml(salaActiva || "")}</code>
        <div id="oc-sync-qr" style="margin-top:8px;"></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
        <button id="oc-sync-compartir" class="ir" style="background:#25D366;border-color:#1da851;">Compartir con mi equipo</button>
        <button id="oc-sync-resincronizar">Resincronizar</button>
        <button id="oc-sync-rotar" style="border-color:#E86040;color:#E86040;">Cambiar el c&oacute;digo</button>
        <button id="oc-sync-desactivar" style="border-color:var(--rojo);color:var(--rojo);">Desactivar sincronización</button>
      </div>
    </div>
    <p id="oc-sync-msg" style="font-size:13px;margin-top:8px;font-weight:700;"></p>`;
  vista.appendChild(panel);

  /* Mascara de guiones en el codigo de sincronizacion (JFC 2026-07-28, punto 7).
     El helper vive en auth-ui.js y se expone por window.OCAuth.mascaraLicencia.
     Importa especialmente AQUI: este campo define la SALA de sync, y
     OCSyncControl.activar() solo exige 6 caracteres — un codigo mal tecleado
     no da error, mete al equipo en una sala vacia y la desincronizacion es
     silenciosa. Si auth-ui.js no cargo todavia, el input sigue funcionando
     normal (solo sin ayuda de formato). */
  try {
    if (window.OCAuth && window.OCAuth.mascaraLicencia) {
      window.OCAuth.mascaraLicencia(document.getElementById("oc-sync-codigo"));
    }
  } catch (_) {}

  const pillTexto = (estado, n) => {
    if (estado === "conectado") return "Sincronizado" + (n != null ? ` · ${n} equipo${n === 1 ? "" : "s"}` : "");
    // Refuerzo (2026-07-23): tras varios intentos seguidos sin exito, avisar
    // en vez de reintentar mudo para siempre — el usuario no puede saber por
    // que no sincroniza si nunca se le dice nada.
    if (window.OCSyncControl.problemaPersistente && window.OCSyncControl.problemaPersistente()) {
      return "No se pudo conectar — revisa el código o tu conexión";
    }
    return ({
      apagado: "Solo local — sin sincronizar",
      conectando: "Conectando…",
      reconectando: "Reconectando…",
    }[estado] || estado);
  };
  const pillColor = (estado) => {
    if (estado === "conectado") return "var(--sim-verde-dk,#1a6e3c)";
    if (estado === "apagado") return "var(--ink-soft)";
    if (window.OCSyncControl.problemaPersistente && window.OCSyncControl.problemaPersistente()) return "var(--rojo,#a3392a)";
    return "#B8760A";
  };

  function pintarEstado(estado, n) {
    const el = document.getElementById("oc-sync-estado");
    if (!el) return;
    const e = estado || window.OCSyncControl.estado();
    el.textContent = pillTexto(e, n != null ? n : window.OCSyncControl.presencia());
    el.style.color = pillColor(e);
  }
  pintarEstado();
  window.OCSyncControl.onEstado(pintarEstado);

  function pintarQR(codigo) {
    const cont = document.getElementById("oc-sync-qr");
    if (!cont || !window.qrcode) return;
    try {
      const q = window.qrcode(0, "M");
      q.addData("AMIGABLE-SYNC:" + codigo);
      q.make();
      cont.innerHTML = `<img src="${q.createDataURL(4, 4)}" width="120" height="120" alt="QR del código de tu negocio" style="border-radius:6px;">`;
    } catch (_) { /* QR es un extra visual — si falla, el código en texto ya basta */ }
  }
  if (salaActiva) pintarQR(salaActiva);

  document.getElementById("oc-sync-activar").addEventListener("click", (ev) => {
    // Refuerzo (2026-07-23): sin esto, clics rapidos disparaban varias
    // conexiones a la vez (ya blindado en conectar(), pero evitar el
    // trabajo doble en el boton es mas limpio y evita parpadeo visual).
    const btn = ev.currentTarget;
    if (btn.disabled) return;
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; }, 1200);
    const codigo = document.getElementById("oc-sync-codigo").value;
    /* Guard: una licencia de otra app no abre una sala de esta. Sin esto, pegar
       por error el codigo de friendly-123 metia este negocio en la sala de otro
       y despues el panel mostraba ese codigo como si fuera su licencia. */
    if (codigo.trim() && !/^AMG-/i.test(codigo.trim())) {
      msg("oc-sync-msg", "Esa licencia no es de amigable-123. La tuya empieza con AMG-.", "var(--rojo)");
      btn.disabled = false;
      return;
    }
    const r = window.OCSyncControl.activar(codigo);
    const msg = document.getElementById("oc-sync-msg");
    if (!r.ok) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = r.error; return; }
    msg.textContent = "";
    document.getElementById("oc-sync-apagado").style.display = "none";
    document.getElementById("oc-sync-activo").style.display = "block";
    document.getElementById("oc-sync-codigo-actual").textContent = codigo.trim();
    pintarQR(codigo.trim());
  });
  const btnCompartir = document.getElementById("oc-sync-compartir");
  if (btnCompartir) btnCompartir.addEventListener("click", () => {
    /* Mismo filtro que arriba: nunca compartir una sala que no es de esta app. */
    const _c = (window.OCSyncControl.salaActiva() || "").trim();
    const codigo = /^AMG-/i.test(_c) ? _c : "";
    const negocio = (function () { try { const s = document.getElementById("oc-negocio-nombre"); return s ? s.textContent.trim() : ""; } catch (_) { return ""; } })();
    // Ojo (2026-07-23): esto se manda UNA vez por celular nuevo, nunca por
    // venta ni por evento — el texto lo dice explícito para que nadie piense
    // que hay que repetirlo antes de cada feria.
    const texto = [
      `Únete a nuestro equipo en AMIGABLE-123${negocio ? " (" + negocio + ")" : ""}.`,
      `Abre la app y toca "¿Nuevo en este equipo?" en la pantalla de PIN, pega este código UNA sola vez:`,
      codigo,
      ``,
      `No hace falta repetirlo — tu celular queda sincronizado con el equipo para siempre.`,
    ].join("\n");
    window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank");
  });
  const btnResync = document.getElementById("oc-sync-resincronizar");
  if (btnResync) btnResync.addEventListener("click", () => {
    const msg = document.getElementById("oc-sync-msg");
    window.OCSyncControl.resincronizar();
    msg.style.color = "var(--sim-verde-dk,#1a6e3c)";
    msg.textContent = "Resincronizando…";
    setTimeout(() => { if (msg.textContent === "Resincronizando…") msg.textContent = ""; }, 3000);
  });
  /* TABLERO DE CONTROL (M13/M14/M15, 2026-08-15).
     Solo dueno y admin. El boton oculto NO es la seguridad: la seguridad es
     que el tablero exige el codigo de la sala, que un empleado no tiene. Son
     dos capas independientes, como el resto de la app. */
  (function(){
    var _t = document.getElementById("oc-sync-tablero");
    if (!_t || _t.dataset.listo) return;
    _t.dataset.listo = "1";
    /* Se pinta el panel del equipo apenas se rinde esta vista. */
    try { if (window.OCMicelioUI) window.OCMicelioUI.pintarPanel(); } catch (_) {}
    _t.addEventListener("click", function(){ ocAbrirTablero(); });

    /* El rol se comprueba EN CADA LOGIN, no una sola vez al inicializar. Antes
       se hacia con un setTimeout y el boton desaparecia para siempre: en ese
       momento todavia no habia nadie dentro, rolActual() era null, y null no es
       duenio. Se OCULTA en vez de borrarse, para que el siguiente login pueda
       volver a mostrarlo.

       Ocultarlo NO es la seguridad: la seguridad es que el tablero exige el
       codigo de la sala Y el PIN, y los verifica el dispositivo. */
    var segunRol = function () {
      try {
        var rol = window.OCAuth && window.OCAuth.rolActual && window.OCAuth.rolActual();
        _t.style.display = (rol === "dueno" || rol === "admin") ? "" : "none";
      } catch (_) {}
    };
    segunRol();
    window.addEventListener("oc-login", segunRol);
    window.addEventListener("oc-logout", segunRol);
  })(),
  (function(){var _r=document.getElementById("oc-sync-rotar");if(_r&&!_r.dataset.listo){_r.dataset.listo="1";_r.addEventListener("click",ocRotarCodigoSala);}})(),document.getElementById("oc-sync-desactivar").addEventListener("click", () => {
    window.OCSyncControl.desactivar();
    document.getElementById("oc-sync-apagado").style.display = "flex";
    document.getElementById("oc-sync-activo").style.display = "none";
  });
})();
// === FIN SINCRONIZAR EQUIPO ==================================================
(function(){
  var bkMount = document.createElement("div");
  bkMount.id = "oc-backup-scheduler-mount";
  vista.appendChild(bkMount);
  if (window.OCBackupScheduler) window.OCBackupScheduler.montar(bkMount);
})();
// === MI CONSTANCIA DE TRABAJO (JFC 2026-07-28, punto 13) =====================
// El respaldo del dueno protege al negocio; este protege a la PERSONA que
// atiende. Se pinta solo si quien mira es empleado — montar() se autolimita, no
// hace falta filtrar por rol aqui. Ver docs/respaldo-empleado.js para el
// alcance exacto de lo que viaja y lo que no (los costos NO viajan).
(function(){
  var reMount = document.createElement("div");
  reMount.id = "oc-respaldo-empleado-mount";
  vista.appendChild(reMount);
  if (window.OCRespaldoEmpleado) window.OCRespaldoEmpleado.montar(reMount);
})();
// === PUNTOS DE RETORNO (micelio Fase B) ======================================
// El div ya existe en index.html, colocado a proposito ANTES del edutip y del
// bloque de soporte tecnico: JFC pidio el checksum al fondo del todo.
(function(){
  var m = document.getElementById("oc-reconciliacion-mount");
  if (m && window.AMG && window.AMG.Reconciliacion) window.AMG.Reconciliacion.montarPanel(m);
})();
// === MIS SINCRONIZACIONES (2026-07-28): agrupa Respaldo + Sincronizar equipo
// + Caja fuerte automatica bajo un solo mini-header azul (lado sereno de la
// app, mismo tratamiento visual que Mi Equipo). 100% aditivo: NO recrea los
// paneles, solo los MUEVE (appendChild re-parenta, listeners intactos) dentro
// de un wrapper nuevo. Si algun panel no existe (modulo no cargo), se omite
// sin romper nada. NO BORRAR los paneles originales, solo se reubican. ===
(function () {
  try {
    var panelSync = document.getElementById("oc-sync-panel");
    var mountBackupSched = document.getElementById("oc-backup-scheduler-mount");
    // NOTA: el Respaldo manual/exportar NO se incluye aqui a proposito -
    // vive detras del PIN de la capa contable (Ver capa contable) desde
    // antes de este cambio, y mover su nodo lo hubiera sacado de esa
    // proteccion sin autorizacion. Sincronizar equipo y Caja fuerte ya
    // eran publicos (fuera de esa capa), asi que agruparlos aqui no
    // cambia ningun control de acceso existente.
    var piezas = [panelSync, mountBackupSched].filter(Boolean);
    if (!piezas.length) return;

    var wrap = document.createElement("div");
    wrap.className = "tag-card";
    wrap.id = "oc-mis-sincronizaciones";
    wrap.style.cssText = "text-align:left;margin-top:22px;border-top:5px solid var(--azul-medio,#2c4a68);background:var(--blanco-calido,#fbf5e8);";
    wrap.innerHTML =
      '<h3 class="seccion" style="margin-top:0;color:var(--azul-medio,#2c4a68);">Mis Sincronizaciones</h3>' +
      '<p style="font-size:14px;color:var(--ink-soft);margin-top:0;">' +
      'amigable-123 es, en el fondo, un cuaderno compartido de control de inventario, perchas y clientes, en colores. ' +
      'Aquí controlas cómo ese cuaderno se comparte entre tus dispositivos y los de tu equipo. ' +
      '(El respaldo manual descargable vive dentro de la capa contable, protegido con tu PIN.)</p>' +
      '<div id="oc-sync-faq" style="display:flex;flex-direction:column;gap:6px;margin:10px 0 18px;font-size:13px;color:var(--ink-soft);">' +
        '<div><strong style="color:var(--ink);">(?) Sincronizar equipo</strong> — mantiene a todos tus dispositivos (dueño, admins, empleados) al día en segundos, cifrado, para siempre mientras esté activo.</div>' +
        '<div><strong style="color:var(--ink);">(?) Caja fuerte automática</strong> — puntos de restauración guardados solo en este navegador por si borras algo sin querer. No reemplaza el respaldo manual.</div>' +
      '</div>';
    var primerNodo = piezas[0];
    primerNodo.parentNode.insertBefore(wrap, primerNodo);
    piezas.forEach(function (el) { wrap.appendChild(el); });
  } catch (_) { /* si algo falla aqui, los paneles originales quedan donde ya estaban - cero riesgo */ }
})();
// === FIN MIS SINCRONIZACIONES ===

// === POLITICA DE PRIVACIDAD Y DATOS (2026-07-28) ===========================
// Desplegable informativo al fondo de Avanzado. Texto legal/descriptivo,
// no hay logica de negocio aqui. Estandares referenciados: RGPD/UE (derecho
// de acceso, portabilidad y minimizacion de datos) aplicados voluntariamente
// aunque AMIGABLE no procese datos de terceros (arquitectura sin nube: los
// datos del negocio NUNCA salen del dispositivo/equipo del usuario).
(function () {
  try {
    var priv = document.createElement("details");
    priv.className = "tag-card";
    priv.id = "oc-privacidad";
    priv.style.cssText = "text-align:left;margin-top:22px;";
    priv.innerHTML =
      '<summary style="cursor:pointer;font-size:15px;font-weight:700;color:var(--ink);">Política de Privacidad y Manejo de Datos</summary>' +
      '<div style="font-size:14px;color:var(--ink-soft);margin-top:12px;line-height:1.55;">' +
      '<p>amigable-123 es un cuaderno compartido de control de inventario, perchas y clientes, en colores. No manejamos ni almacenamos los datos de tu negocio: permanecen en tu dispositivo y en los de tu equipo. Solo registramos tus datos de contacto (correo, licencia) para poder darte soporte.</p>' +
      '<p><strong style="color:var(--ink);">Código abierto y auditable.</strong> Sin bloatware, sin publicidad de terceros, sin venta ni arriendo de tus datos de contacto a terceros, sin código malicioso ni formas invasivas de recolección.</p>' +
      '<p><strong style="color:var(--ink);">Estándares.</strong> Nos guiamos por los principios más exigentes disponibles en Ecuador y a nivel internacional — incluidos los del GDPR europeo (Reglamento General de Protección de Datos) en lo que aplica sin comprometer la autonomía del usuario sobre sus propios datos: minimización de datos, derecho al olvido (tus datos viven solo en tu dispositivo — borrarlos es instantáneo y total), cifrado de extremo a extremo para la sincronización entre equipos, y descentralización (sin base de datos central de tu negocio).</p>' +
      '<p><strong style="color:var(--ink);">Es una PWA (Progressive Web App).</strong> Su creador la mantiene funcionando sólidamente, pero cada usuario con licencia gobierna sus propios datos y conserva una privacidad que ni una libreta de papel ni una app de pago mensual indefinido pueden ofrecer al mismo tiempo — esa diferencia es la que justifica invertir en cifrado, descentralización y autonomía real del usuario.</p>' +
      '<p style="font-size:13px;">amigable-123 no se responsabiliza por usos extralegales o ilegales de cualquier tipo. Fue concebida para el micro y pequeño emprendedor o comerciante.</p>' +
      '</div>';
    vista.appendChild(priv);
  } catch (_) {}
})();
// === FIN POLITICA DE PRIVACIDAD ============================================
// === EQUIPO (multi-usuario, admins + empleados, 2026-07-22) ===========
    // Panel de gestión del Equipo: admins + empleados con PINs y correos.
    // - Dueño: crea admins y empleados, cambia cualquier PIN, desactiva cualquiera.
    // - Admin: crea y gestiona empleados (NO puede crear otros admins ni editar el PIN de admins).
    // - Límite free: 1 empleado (admins exentos — son co-dueños, no personal).
    const isDueno = () => window.OCAuth && window.OCAuth.rolActual() === "dueno";
    const isAdmin = () => window.OCAuth && window.OCAuth.rolActual() === "admin";

    const equipoPanel = document.createElement("div");
    equipoPanel.className = "tag-card";
    equipoPanel.id = "oc-emp-panel";
    equipoPanel.style.cssText = "text-align:left;margin-top:22px;border-top:5px solid var(--azul-medio,#2c4a68);";
    equipoPanel.innerHTML = `
      <h3 class="seccion" style="margin-top:0;color:var(--azul-medio,#2c4a68);">Mi Equipo</h3>
      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">
        Da de alta o de baja roles, edita PINs y agrupa todo tu equipo aquí. Cada miembro tiene su
        propio PIN de 3 dígitos y su nombre visible en la tabla — el PIN identifica el dispositivo,
        el nombre identifica a la persona. Sus ventas, ajustes y movimientos quedan registrados con
        su nombre en el historial. El PIN del dueño no aparece aquí.
      </p>
      <div id="oc-emp-lista" style="margin-bottom:18px;"></div>
      <details id="oc-emp-form-wrap" style="margin-bottom:6px;">
        <summary style="cursor:pointer;font-size:14px;font-weight:700;color:var(--azul-medio);margin-bottom:10px;">
          + Agregar miembro del equipo
        </summary>
        <div style="display:flex;flex-direction:column;gap:8px;max-width:340px;margin-top:10px;">
          <label style="font-size:13px;">Nombre
            <input id="oc-emp-nombre" maxlength="60" placeholder="Ej: María Auquilla"
              style="display:block;width:100%;margin-top:4px;padding:8px;border:2px solid var(--azul-medio);
                     border-radius:5px;font-size:14px;box-sizing:border-box;">
          </label>
          <label style="font-size:13px;">Correo (opcional — para notificaciones)
            <input id="oc-emp-email" type="email" maxlength="160" placeholder="correo@ejemplo.com"
              style="display:block;width:100%;margin-top:4px;padding:8px;border:2px solid var(--azul-medio);
                     border-radius:5px;font-size:14px;box-sizing:border-box;">
          </label>
          <label style="font-size:13px;">PIN (3 dígitos)<br><span style="font-size:13px;font-weight:400;color:var(--rojo,#a3392a);">Evita repetir el PIN del dueño o del contador — si coinciden, este empleado no podrá entrar.</span><!-- Microcirugia 7 (2026-07-08 · reforzado 2026-07-23): aviso de colisión. El mock no puede verificar contra el PIN del dueño/contador (esos hashes viven en crypto-store). Si colisionan, el miembro queda bloqueado silenciosamente — ahora se avisa en la propia UI de alta. -->
            <span style="display:block;font-size:13px;color:var(--rojo,#a3392a);margin-top:3px;font-weight:400;">
              No uses el mismo PIN del dueño, empleado general ni contador.
            </span>
            <input id="oc-emp-pin" maxlength="3" inputmode="numeric" placeholder="•••"
              style="display:block;width:100%;margin-top:4px;padding:8px;border:2px solid var(--azul-medio);
                     border-radius:5px;font-size:14px;text-align:center;font-family:var(--font-mono);
                     box-sizing:border-box;letter-spacing:.2em;">
          </label>
          <label id="oc-emp-rol-label" style="font-size:13px;">Rol
            <select id="oc-emp-rol"
              style="display:block;width:100%;margin-top:4px;padding:8px;border:2px solid var(--azul-medio);
                     border-radius:5px;font-size:14px;box-sizing:border-box;background:var(--blanco-calido,#fbf5e8);">
              <option value="empleado">Encargado — acceso operativo (ventas, inventario, perchas)</option>
              <option value="admin">Administrador — acceso completo excepto credenciales del dueño</option>
            </select>
            <span style="display:block;font-size:13px;color:var(--ink-soft);margin-top:3px;">
              Solo el dueño puede crear administradores.
            </span>
          </label>
          <button id="oc-emp-agregar" class="ir"
            style="background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">
            Agregar al equipo
          </button>
          <p id="oc-emp-msg" style="font-size:14px;margin:0;font-weight:700;"></p>
        </div>
      </details>`;
    vista.appendChild(equipoPanel);

    // Renderiza la tabla del equipo (llama al endpoint cada vez que hay cambio).
    // También actualiza la visibilidad del selector de rol (dueño vs admin),
    // porque init() corre antes del login y el rol real no está disponible aún.
    async function renderEmpleados() {
      const rolLabel = document.getElementById("oc-emp-rol-label");
      if (rolLabel) rolLabel.style.display = isDueno() ? "" : "none";
      const lista = document.getElementById("oc-emp-lista");
      if (!lista) return;
      let equipo = [];
      try {
        const r = await fetch("/api/usuarios");
        if (r.ok) equipo = await r.json();
      } catch (_) {}

      if (!equipo.length) {
        lista.innerHTML = '<p style="font-size:14px;color:var(--ink-soft);margin:0;">Aún no hay miembros del equipo.</p>';
        return;
      }

      // "Última ubicación" (portado de friendly-123, 2026-07-30): geo-ping.js
      // es un archivo aparte y opcional — si no cargó, o no hay AMG.GeoPing, o
      // falla la lectura de IndexedDB, esto se degrada a un mapa vacío sin
      // romper el resto de Mi Equipo. Solo dueño/admin ven esto — un
      // empleado viendo a sus compañeros no necesita saber dónde estuvieron.
      let ultimasUbic = {};
      if ((isDueno() || isAdmin()) && window.AMG && window.AMG.GeoPing && window.AMG.GeoPing.ultimosPorPin) {
        try { ultimasUbic = await window.AMG.GeoPing.ultimosPorPin(); } catch (_) { ultimasUbic = {}; }
      }
      const hacetiempo = (ts) => {
        const min = Math.round((Date.now() - ts) / 60000);
        if (min < 1) return "recién";
        if (min < 60) return `hace ${min} min`;
        const h = Math.round(min / 60);
        if (h < 24) return `hace ${h}h`;
        return `hace ${Math.round(h / 24)}d`;
      };

      lista.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="border-bottom:2px solid var(--azul-suave,#dde5ec);">
            <th style="text-align:left;padding:6px 8px;font-weight:700;">Miembro</th>
            <th style="text-align:center;padding:6px 8px;font-weight:700;">Rol</th>
            <th style="text-align:center;padding:6px 8px;font-weight:700;">Estado</th>
            <th style="text-align:right;padding:6px 8px;font-weight:700;">Acciones</th>
          </tr></thead>
          <tbody id="oc-emp-tbody"></tbody>
        </table>`;
      const tbody = document.getElementById("oc-emp-tbody");

      equipo.forEach((u) => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid var(--azul-suave,#dde5ec)";
        const estadoColor  = u.activo ? "var(--sim-verde-dk,#1a6e3c)" : "var(--rojo,#a3392a)";
        const estadoTxt    = u.activo ? "Activo" : "Inactivo";
        const btnEstLabel  = u.activo ? "Desactivar" : "Activar";
        const btnEstColor  = u.activo ? "var(--rojo,#a3392a)" : "var(--sim-verde-dk,#1a6e3c)";
        const rolBadge     = u.rol === "admin"
          ? `<span style="font-size:13px;font-weight:700;background:#E8A020;color:#fff;padding:2px 7px;border-radius:10px;">Admin</span>`
          : `<span style="font-size:13px;font-weight:700;background:var(--azul-medio,#2c4a68);color:#fff;padding:2px 7px;border-radius:10px;">Encargado</span>`;
        // Admin solo puede editar empleados, no a otros admins (seguridad por capas)
        const puedeEditar = isDueno() || (isAdmin() && u.rol === "empleado");
        const ping = ultimasUbic["u:" + u.id];
        const ubicHtml = (isDueno() || isAdmin())
          ? (ping
              ? `<div style="font-size:13px;color:var(--ink-soft);">📍 Última vez: ${hacetiempo(ping.ts)}${
                  (ping.lat != null && ping.lon != null)
                    ? ` · <a href="https://www.google.com/maps?q=${ping.lat},${ping.lon}" target="_blank" rel="noopener" style="color:var(--azul-medio);">ver en el mapa</a>` +
                      (ping.precision != null && ping.precision > 300
                        ? ` <span style="color:#E8A020;">(aproximado, ±${ping.precision}m — no exacto)</span>`
                        : ping.precision != null ? ` (±${ping.precision}m)` : "")
                    : " · sin ubicación esa vez"
                }</div>`
              : `<div style="font-size:13px;color:var(--ink-soft);">📍 Sin ubicación registrada</div>`)
          : "";
        tr.innerHTML = `
          <td style="padding:8px;">
            <div style="font-weight:700;">${escHtml(u.nombre)}</div>
            ${u.email ? `<div style="font-size:13px;color:var(--ink-soft);">${escHtml(u.email)}</div>` : ""}
            ${ubicHtml}
          </td>
          <td style="padding:8px;text-align:center;">${rolBadge}</td>
          <td style="padding:8px;text-align:center;color:${estadoColor};font-weight:700;">${estadoTxt}</td>
          <td style="padding:8px;text-align:right;white-space:nowrap;">
            ${puedeEditar ? `
              <button data-toggle-id="${escHtml(u.id)}" data-activo="${u.activo}"
                style="font-size:13px;padding:5px 10px;border:2px solid ${btnEstColor};
                       border-radius:5px;background:transparent;color:${btnEstColor};cursor:pointer;">
                ${btnEstLabel}
              </button>
              <button data-cambiar-pin="${escHtml(u.id)}"
                style="font-size:13px;padding:5px 10px;border:2px solid var(--azul-medio);
                       border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;margin-left:4px;">
                PIN
              </button>
              <button data-editar-datos="${escHtml(u.id)}"
                style="font-size:13px;padding:5px 10px;border:2px solid var(--brass,#9c7a35);
                       border-radius:5px;background:transparent;color:var(--brass,#9c7a35);cursor:pointer;margin-left:4px;">
                Editar
              </button>
            ` : `<span style="font-size:13px;color:var(--ink-soft);">Solo dueño</span>`}
          </td>`;
        tbody.appendChild(tr);

        // Fila inline para cambiar PIN (oculta hasta click en "PIN")
        if (puedeEditar) {
          const trPin = document.createElement("tr");
          trPin.id = `oc-pin-row-${u.id}`;
          trPin.style.cssText = "display:none;background:var(--azul-suave,#EEF3F7);";
          trPin.innerHTML = `
            <td colspan="4" style="padding:10px 12px;">
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <span style="font-size:13px;font-weight:700;">Nuevo PIN para ${escHtml(u.nombre)}:</span>
                <input data-pin-input="${escHtml(u.id)}" maxlength="3" inputmode="numeric" placeholder="•••"
                  style="width:80px;padding:7px 10px;border:2px solid var(--azul-medio);border-radius:5px;
                         font-size:14px;text-align:center;font-family:var(--font-mono);letter-spacing:.15em;">
                <button data-guardar-pin="${escHtml(u.id)}"
                  style="padding:7px 14px;border:2px solid var(--azul-medio);border-radius:5px;
                         background:var(--azul-medio);color:var(--blanco-calido);font-size:13px;font-weight:700;cursor:pointer;">
                  Guardar
                </button>
                <span data-pin-msg="${escHtml(u.id)}" style="font-size:13px;font-weight:700;"></span>
              </div>
            </td>`;
          tbody.appendChild(trPin);

          // Fila inline para editar nombre y rol (JFC 2026-07-28: "se puede
          // activar/desactivar y cambiar PIN, pero NO editar nombre ni rol
          // despues de creado" — el rol solo lo cambia el dueño, un admin
          // puede renombrar a un empleado pero no ascenderlo).
          const trDatos = document.createElement("tr");
          trDatos.id = `oc-datos-row-${u.id}`;
          trDatos.style.cssText = "display:none;background:var(--azul-suave,#EEF3F7);";
          trDatos.innerHTML = `
            <td colspan="4" style="padding:10px 12px;">
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <input data-nombre-input="${escHtml(u.id)}" value="${escHtml(u.nombre)}" maxlength="60"
                  placeholder="Nombre"
                  style="min-width:140px;padding:7px 10px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;">
                ${isDueno() ? `
                <select data-rol-input="${escHtml(u.id)}"
                  style="padding:7px 10px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;">
                  <option value="empleado"${u.rol !== "admin" ? " selected" : ""}>Encargado</option>
                  <option value="admin"${u.rol === "admin" ? " selected" : ""}>Admin</option>
                </select>` : ""}
                <button data-guardar-datos="${escHtml(u.id)}"
                  style="padding:7px 14px;border:2px solid var(--brass,#9c7a35);border-radius:5px;
                         background:var(--brass,#9c7a35);color:var(--blanco-calido);font-size:13px;font-weight:700;cursor:pointer;">
                  Guardar
                </button>
                <span data-datos-msg="${escHtml(u.id)}" style="font-size:13px;font-weight:700;"></span>
              </div>
            </td>`;
          tbody.appendChild(trDatos);
        }
      });

      // Bind: toggle activo/inactivo
      tbody.querySelectorAll("[data-toggle-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.toggleId;
          const activo = btn.dataset.activo === "true";
          try {
            const r = await fetch("/api/usuarios/" + id, {
              method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ activo: !activo }),
            });
            if (!r.ok) { const e = await r.json(); await ocAlert(e.error || "Error al actualizar."); return; }
            await renderEmpleados();
          } catch (_) { await ocAlert("Error de red."); }
        });
      });

      // Bind: mostrar/ocultar fila de cambio de PIN
      tbody.querySelectorAll("[data-cambiar-pin]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = document.getElementById("oc-pin-row-" + btn.dataset.cambiarPin);
          if (row) row.style.display = row.style.display === "none" ? "" : "none";
        });
      });

      // Bind: mostrar/ocultar fila de editar nombre/rol
      tbody.querySelectorAll("[data-editar-datos]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = document.getElementById("oc-datos-row-" + btn.dataset.editarDatos);
          if (row) row.style.display = row.style.display === "none" ? "" : "none";
        });
      });

      // Bind: guardar nombre/rol
      tbody.querySelectorAll("[data-guardar-datos]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.guardarDatos;
          const inpNombre = tbody.querySelector(`[data-nombre-input="${id}"]`);
          const selRol = tbody.querySelector(`[data-rol-input="${id}"]`);
          const msg = tbody.querySelector(`[data-datos-msg="${id}"]`);
          const nombre = (inpNombre ? inpNombre.value : "").trim();
          msg.style.color = "var(--rojo,#a3392a)";
          if (!nombre) { msg.textContent = "El nombre no puede quedar vacío."; return; }
          const patchBody = { nombre };
          if (selRol) patchBody.rol = selRol.value;
          try {
            const r = await fetch("/api/usuarios/" + id, {
              method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patchBody),
            });
            if (!r.ok) { const e = await r.json(); msg.textContent = e.error || "Error al actualizar."; return; }
            await renderEmpleados();
          } catch (_) { msg.textContent = "Error de red."; }
        });
      });

      // Bind: guardar nuevo PIN
      tbody.querySelectorAll("[data-guardar-pin]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id  = btn.dataset.guardarPin;
          const inp = tbody.querySelector(`[data-pin-input="${id}"]`);
          const msg = tbody.querySelector(`[data-pin-msg="${id}"]`);
          const pin = (inp ? inp.value : "").trim();
          msg.style.color = "var(--rojo,#a3392a)";
          if (!/^\d{3}$/.test(pin)) { msg.textContent = "El PIN debe tener 3 dígitos."; return; }
          try {
            const r = await fetch("/api/usuarios/" + id, {
              method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pin }),
            });
            const data = await r.json();
            if (!r.ok) { msg.textContent = data.error || "Error al guardar PIN."; return; }
            msg.style.color = "var(--sim-verde-dk,#1a6e3c)";
            msg.textContent = "PIN actualizado.";
            // Entrega por correo (JFC 2026-07-30): mailto abre EL PROPIO cliente
            // de correo del dueño con el mensaje listo — sin backend, sin nube,
            // cumple la regla dura NUNCA CLOUD. El PIN nunca se guarda en claro
            // en ningún servidor; solo pasa por esta URL local hacia el mailer.
            const miembro = equipo.find((x) => x.id === id);
            if (miembro && miembro.email) {
              const asunto = encodeURIComponent(`Tu PIN de acceso — ${miembro.nombre}`);
              const cuerpo = encodeURIComponent(`Hola ${miembro.nombre},\n\nTu nuevo PIN de acceso es: ${pin}\n\nGuárdalo en un lugar seguro.`);
              const linkMail = document.createElement("a");
              linkMail.href = `mailto:${miembro.email}?subject=${asunto}&body=${cuerpo}`;
              linkMail.textContent = " Enviar por correo";
              linkMail.style.cssText = "margin-left:8px;color:var(--azul-medio);font-weight:700;";
              msg.appendChild(linkMail);
            }
            if (inp) inp.value = "";
            setTimeout(() => renderEmpleados(), 4000);
          } catch (_) { msg.textContent = "Error de red."; }
        });
      });
    }

    // Bind form: agregar miembro del equipo
    document.getElementById("oc-emp-agregar").addEventListener("click", async () => {
      const nombre = (document.getElementById("oc-emp-nombre").value || "").trim();
      const email  = (document.getElementById("oc-emp-email").value  || "").trim();
      const pin    = (document.getElementById("oc-emp-pin").value    || "").trim();
      const rolSel = document.getElementById("oc-emp-rol");
      // Admin que llega aquí solo puede crear empleados; dueño puede elegir admin
      const rol = (isDueno() && rolSel) ? (rolSel.value || "empleado") : "empleado";
      const msgEl = document.getElementById("oc-emp-msg");
      msgEl.style.color = "var(--rojo,#a3392a)";
      if (!nombre) { msgEl.textContent = "El nombre es obligatorio."; return; }
      if (!/^\d{3}$/.test(pin)) { msgEl.textContent = "El PIN debe tener exactamente 3 dígitos."; return; }
      try {
        const r = await fetch("/api/usuarios", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, pin, email: email || undefined, rol }),
        });
        const data = await r.json();
        if (!r.ok) { msgEl.textContent = data.error || "Error al agregar miembro."; return; }
        msgEl.style.color = "var(--sim-verde-dk,#1a6e3c)";
        msgEl.textContent = `${data.rol === "admin" ? "Admin" : "Encargado"} "${data.nombre}" agregado.`;
        if (email) {
          const asunto = encodeURIComponent(`Tu PIN de acceso — ${data.nombre}`);
          const cuerpo = encodeURIComponent(`Hola ${data.nombre},\n\nTu PIN de acceso es: ${pin}\n\nGuárdalo en un lugar seguro.`);
          const linkMail = document.createElement("a");
          linkMail.href = `mailto:${email}?subject=${asunto}&body=${cuerpo}`;
          linkMail.textContent = " Enviar por correo";
          linkMail.style.cssText = "margin-left:8px;color:var(--azul-medio);font-weight:700;";
          msgEl.appendChild(linkMail);
        }
        document.getElementById("oc-emp-nombre").value = "";
        document.getElementById("oc-emp-email").value  = "";
        document.getElementById("oc-emp-pin").value    = "";
        if (rolSel) rolSel.value = "empleado";
        document.getElementById("oc-emp-form-wrap").open = false;
        await renderEmpleados();
      } catch (_) { msgEl.textContent = "Error de red."; }
    });

    // Cargar equipo al montar la vista Avanzado + refrescar en cada login
    renderEmpleados();
    window.addEventListener("oc-login", renderEmpleados);
    // === FIN EQUIPO ========================================================

    // === LOG DE ACTIVIDAD (2026-07-22) =====================================
    // Disponible para dueño y admins. Muestra los últimos 100 movimientos con
    // quién los hizo, cuándo y qué (tipo + detalle). El log es append-only
    // y sellado (anti-tamper via mock-backend.js). Este panel solo LEE.
    const logPanel = document.createElement("div");
    logPanel.className = "tag-card";
    logPanel.id = "oc-log-panel";
    logPanel.style.cssText = "text-align:left;margin-top:22px;";
    logPanel.innerHTML = `
      <h3 class="seccion" style="margin-top:0;">Log de actividad</h3>
      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">
        Últimos 100 movimientos registrados en este dispositivo. Cada entrada incluye
        quién lo hizo y cuándo. El historial es de solo lectura — no se puede editar.
      </p>
      <button id="oc-log-cargar"
        style="font-size:13px;padding:7px 14px;border:2px solid var(--azul-medio);
               border-radius:6px;background:transparent;color:var(--azul-medio);cursor:pointer;margin-bottom:12px;">
        Cargar historial
      </button>
      <div id="oc-log-body"></div>`;
    vista.appendChild(logPanel);

    document.getElementById("oc-log-cargar").addEventListener("click", async () => {
      const logBody = document.getElementById("oc-log-body");
      logBody.innerHTML = '<p style="font-size:13px;color:var(--ink-soft);">Cargando...</p>';
      try {
        const r = await fetch("/api/actividad");
        if (!r.ok) { logBody.innerHTML = '<p style="color:var(--rojo,#a3392a);">No se pudo cargar el historial.</p>'; return; }
        const movs = await r.json();
        if (!movs.length) { logBody.innerHTML = '<p style="font-size:14px;color:var(--ink-soft);">Sin movimientos registrados aún.</p>'; return; }
        const tipoLabel = (t) => {
          const m = {
            alta: "Alta producto", venta: "Venta", ajuste: "Ajuste stock",
            edicion: "Edición producto", baja: "Baja producto",
            "usuario-alta": "Nuevo miembro", "usuario-editar": "Edición miembro",
            transferencia: "Transferencia", liquidacion: "Liquidación", estrella: "Estrella"
          };
          return m[t] || t;
        };
        logBody.innerHTML = `<div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="border-bottom:2px solid var(--azul-suave,#dde5ec);">
              <th style="text-align:left;padding:5px 8px;font-weight:700;white-space:nowrap;">Cuándo</th>
              <th style="text-align:left;padding:5px 8px;font-weight:700;">Quién</th>
              <th style="text-align:left;padding:5px 8px;font-weight:700;">Qué</th>
            </tr></thead>
            <tbody>${movs.slice(0, 100).map((m) => {
              const fecha = new Date(m.fecha).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" });
              const det   = m.detalle ? Object.entries(m.detalle).map(([k, v]) => `${k}: ${v}`).join(", ") : "";
              return `<tr style="border-bottom:1px solid var(--azul-suave,#dde5ec);">
                <td style="padding:5px 8px;white-space:nowrap;color:var(--ink-soft);">${escHtml(fecha)}</td>
                <td style="padding:5px 8px;font-weight:700;">${escHtml(m.usuarioNombre || "Sistema")}</td>
                <td style="padding:5px 8px;">${escHtml(tipoLabel(m.tipo))}${det ? ` — <span style="color:var(--ink-soft);">${escHtml(det)}</span>` : ""}</td>
              </tr>`;
            }).join("")}</tbody>
          </table></div>`;
      } catch (_) { logBody.innerHTML = '<p style="color:var(--rojo,#a3392a);">Error de red.</p>'; }
    });
    // === FIN LOG ===========================================================

    // FIX (2026-07-22): el "try{" que abria este bloque se perdio cuando el
    // panel Equipo/Log reemplazo al viejo empPanel minificado — el catch de
    // mas abajo quedaba huerfano y rompia TODO el archivo (SyntaxError
    // "Unexpected token catch"), lo que apagaba en silencio el boton
    // "Ver capa contable" y cualquier otra cosa de Avanzado. Restaurado.
    try{const afPanel=document.createElement("div");afPanel.className="tag-card";afPanel.id="oc-antifraude-panel";afPanel.style.cssText="text-align:left;margin-top:22px;";afPanel.innerHTML=`\n        <h3 class="seccion" style="margin-top:0;">Control anti fraude</h3>\n        <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">Integridad del historial y señales de riesgo del día. Cada movimiento va sellado: si alguien edita o borra el historial en este equipo, aquí se nota.</p>\n        <div id="oc-af-integridad" style="margin-bottom:14px;"></div>\n        <div id="oc-af-senales"></div>\n        <button id="oc-af-refrescar" class="ir" style="margin-top:12px;background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">Verificar ahora</button>\n        <p style="font-size:13px;color:var(--ink-soft);margin:10px 0 0;">El sello detecta manipulación casual del historial. No es a prueba de expertos (el equipo es local), pero deja evidencia de cualquier edición común.</p>`;vista.appendChild(afPanel);async function renderAntiFraude(){const cont=$("oc-af-integridad");if(cont){try{const d=await(await fetch("/api/integridad")).json();if(d.ok){cont.innerHTML=`<div style="padding:10px 12px;border-radius:8px;background:#e7f7ee;border:2px solid #1a6e3c;"><strong style="color:#1a6e3c;">✓ Historial íntegro</strong> <span style="color:#0F1923;font-size:14px;">— ${d.sellados} movimiento(s) sellado(s)${d.historico?", "+d.historico+" histórico(s) sin sello":""}.</span></div>`}else{const det=d.ruptura?`en la posición ${d.ruptura.index} (${escHtml(d.ruptura.tipo)} · ${escHtml(d.ruptura.usuarioNombre)} · ${escHtml(new Date(d.ruptura.fecha).toLocaleString())}) — ${escHtml(d.ruptura.motivo)}`:d.colaOk===false?"se recortó el final del historial":"inconsistencia detectada";cont.innerHTML=`<div style="padding:10px 12px;border-radius:8px;background:#fdecea;border:2px solid #a3392a;"><strong style="color:#a3392a;">El historial fue alterado</strong> <span style="color:#0F1923;font-size:14px;">— ${det}.</span></div>`}}catch(_){cont.innerHTML=""}}const sen=$("oc-af-senales");if(sen){try{const movs=await(await fetch("/api/actividad")).json();const hoy=(new Date).toISOString().slice(0,10);const delHoy=(Array.isArray(movs)?movs:[]).filter(m=>(m.fecha||"").slice(0,10)===hoy);const anul={},merma={};delHoy.forEach(m=>{const q=m.usuarioNombre||"Sistema";if(m.tipo==="anulacion")anul[q]=(anul[q]||0)+1;if(m.tipo==="ajuste"&&m.detalle&&Number(m.detalle.delta)<0)merma[q]=(merma[q]||0)+Math.abs(Number(m.detalle.delta))});const bloque=(titulo,obj,unidad)=>{const ents=Object.entries(obj);if(!ents.length)return`<p style="font-size:14px;color:var(--ink-soft);margin:6px 0;">${titulo}: sin actividad hoy.</p>`;return`<p style="font-size:14px;font-weight:700;color:var(--ink);margin:10px 0 2px;">${titulo}:</p>`+ents.map(([n,v])=>`<div style="font-size:14px;color:#0F1923;padding:2px 0;">• ${escHtml(n)}: <strong>${v}</strong> ${unidad}</div>`).join("")};sen.innerHTML=bloque("Anulaciones de venta por persona (hoy)",anul,"anulación(es)")+bloque("Unidades bajadas a mano / mermas por persona (hoy)",merma,"unidad(es)")}catch(_){sen.innerHTML=""}}}const btnAF=$("oc-af-refrescar");if(btnAF)btnAF.addEventListener("click",renderAntiFraude);renderAntiFraude();window.addEventListener("oc-login",renderAntiFraude)}catch(e){console.error("Panel anti fraude no cargó (aislado, no rompe Avanzado):",e)}const transfPanel=document.createElement("div");transfPanel.className="tag-card";transfPanel.style.cssText="text-align:left;margin-top:22px;";transfPanel.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Transferencias entre ubicaciones</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">Solicitudes de traspaso de stock entre tus locales.</p>\n      <div id="oc-transf-lista"></div>`;vista.appendChild(transfPanel);renderTransferencias();window.__ocRenderTransferencias=renderTransferencias;const syncPanel=document.createElement("div");syncPanel.className="tag-card";syncPanel.style.cssText="text-align:left;margin-top:22px;";const pbUrlActual=localStorage.getItem("OC_PB_URL")||"";const conectado=!!window.OC_PB_CONNECTED;syncPanel.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Sincronización remota (opcional)</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">\n        Por defecto este negocio corre 100% local, sin depender de internet.\n        Solo si quieres recibir actualizaciones desde el panel central, pega\n        aquí la URL de tu PocketBase en Fly.io.\n      </p>\n      <p style="font-size:14px;font-weight:700;margin:8px 0;color:${conectado?"var(--sim-verde-dk)":"var(--ink)"};">\n        Estado: ${conectado?"Conectado":"Local (sin sync)"}\n      </p>\n      <input id="oc-pb-url" type="text" placeholder="https://tu-negocio.fly.dev" value="${escHtml(pbUrlActual)}" style="width:100%;max-width:340px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;">\n      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;">\n        <button id="oc-pb-guardar" class="ir" style="background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">Guardar y conectar</button>\n        ${pbUrlActual?`<button id="oc-pb-quitar" class="ir" style="background:transparent;color:var(--rojo);border-color:var(--rojo);">Volver a local</button>`:""}\n      </div>\n      <p id="oc-pb-msg" style="font-size:14px;margin-top:8px;"></p>`;vista.appendChild(syncPanel);$("oc-pb-guardar").addEventListener("click",()=>{const url=$("oc-pb-url").value.trim();if(!url){msg("oc-pb-msg","Pega la URL de tu PocketBase primero.","var(--rojo)");return}localStorage.setItem("OC_PB_URL",url);msg("oc-pb-msg","Guardado. Recargando para conectar...","var(--sim-verde-dk)");setTimeout(()=>window.location.reload(),800)});const btnQuitar=document.getElementById("oc-pb-quitar");if(btnQuitar)btnQuitar.addEventListener("click",()=>{localStorage.removeItem("OC_PB_URL");msg("oc-pb-msg","Sync quitado. Recargando en modo local...","var(--ink)");setTimeout(()=>window.location.reload(),800)});/* MICELIO VIVO (2026-08-15): tarjeta PROPIA, como todos los demas paneles.
   Estuvo un rato metida dentro del panel de sync y eso descolocaba el riel de
   navegacion de Avanzado, que arma su menu con los hijos directos de la vista.
   NO volver a anidarla dentro de otro panel. */
try{var micPanel=document.createElement("div");micPanel.className="tag-card";micPanel.style.cssText="text-align:left;margin-top:22px;";micPanel.innerHTML='<h3 class="seccion" style="margin-top:0;">Tu equipo ahora</h3><div id="oc-micelio-panel"></div>';vista.appendChild(micPanel);if(window.OCMicelioUI)window.OCMicelioUI.pintarPanel();}catch(e){console.error("Panel micelio no cargo (aislado, no rompe Avanzado):",e)}
const syncDevPanel=document.createElement("div");syncDevPanel.id="oc-syncdev-panel";syncDevPanel.className="tag-card";syncDevPanel.style.cssText="text-align:left;margin-top:22px;";vista.appendChild(syncDevPanel);pintarSyncDev();
/* === RIEL FLEX (sobre baseline docs.zip — NO display:none) ============
   Menú izquierdo + columna contenido. Todo visible. Scroll only.
   No borra features. MutationObserver recoge geo-ping etc. */
(function(){
try{
  var HINTS={
    "Capa contable":"Cuentas T, P&G, balance e inventario. Pide subclave.",
    "Actividad reciente":"Historial operativo del día.",
    "Gastos mensuales":"Arriendo, luz, sueldos… prorrateados al P&G.",
    "Respaldo":"Exporta o importa TODO el negocio.",
    "Acceso y recuperación":"Correo, WhatsApp, PINs y password.",
    "Sincronizar equipo":"Cambios por WhatsApp/QR entre equipos.",
    "Mis Sincronizaciones":"Estado de sync entre dispositivos.",
    "Mi Equipo":"Empleados, roles y PINs de este negocio.",
    "Log de actividad":"Quién hizo qué y cuándo.",
    "Control anti fraude":"Integridad de operaciones sensibles.",
    "Transferencias entre ubicaciones":"Mover stock entre sucursales.",
    "Tu equipo ahora":"Quien esta sincronizado y quien no.",
    "Sincronización remota (opcional)":"PocketBase propio si lo configuraste.",
    "Enviar cambios a mano (sin internet)":"Paquete cifrado para otro equipo.",
    "Dónde estuvo el equipo":"Pings de ubicación con sesión abierta."
  };
  function esComo(t){t=(t||"").trim();return /^¿Cómo funciona/i.test(t)||/^Como funciona/i.test(t)}
  function tituloDe(n){
    if(!n||n.nodeType!==1)return null;
    if(n.id==="oc-acct-lock")return "Capa contable";
    if(n.id==="oc-contable"||n.id==="oc-riel-fila"||n.id==="oc-riel-nav"||n.id==="oc-riel-contenido")return null;
    if(/^H[1-6]$/.test(n.tagName)){var t=n.textContent.trim();return esComo(t)?null:(t||null)}
    if(n.tagName==="DETAILS"){var s=n.querySelector("summary");if(!s)return null;var ts=s.textContent.trim();return esComo(ts)?null:(ts||null)}
    var h=null;try{h=n.querySelector(":scope > h3, :scope > h4")}catch(_){}
    if(!h)h=n.querySelector("h3,h4");
    if(!h)return null;
    var th=h.textContent.trim();return esComo(th)?null:(th||null);
  }
  function idDe(n,i){if(n.id==="oc-acct-lock"||n.id==="amg-geo-caja")return n.id;if(!n.id)n.id="oc-riel-a"+i;return n.id}
  function hint(n,t){if(!HINTS[t]||n.querySelector(".oc-riel-hint"))return;var p=document.createElement("p");p.className="oc-riel-hint";p.style.cssText="font-size:13px;color:var(--ink-soft,#5d5340);margin:0 0 10px;line-height:1.45;";p.textContent=HINTS[t];try{var h=n.querySelector("h3,h4");if(h)h.insertAdjacentElement("afterend",p);else n.insertBefore(p,n.firstChild)}catch(_){}}

  var prev=document.getElementById("oc-riel-fila");
  if(prev){var c0=document.getElementById("oc-riel-contenido");if(c0){while(c0.firstChild)vista.appendChild(c0.firstChild)}prev.remove()}

  var fila=document.createElement("div");fila.id="oc-riel-fila";
  fila.style.cssText="display:flex;align-items:flex-start;gap:0;margin:8px 0 12px;width:100%;box-sizing:border-box;";
  var nav=document.createElement("div");nav.id="oc-riel-nav";nav.setAttribute("role","navigation");nav.setAttribute("aria-label","Secciones de Avanzado");
  nav.style.cssText="flex:0 0 148px;width:148px;position:sticky;top:8px;align-self:flex-start;padding:0 10px 0 0;margin:0 14px 0 0;border-right:2px solid var(--azul-suave,#dde5ec);display:flex;flex-direction:column;max-height:calc(100vh - 24px);overflow-y:auto;background:var(--blanco-calido,#F8F9FB);z-index:3;box-sizing:border-box;";
  var contR=document.createElement("div");contR.id="oc-riel-contenido";
  contR.style.cssText="flex:1 1 0%;min-width:0;box-sizing:border-box;";

  var kids=Array.prototype.slice.call(vista.children);
  var mover=[], secciones=[], idx=0;
  kids.forEach(function(n,i){
    if(i<2)return;
    if(n.id==="oc-riel-fila")return;
    if(n.tagName==="DETAILS"){var sm=n.querySelector("summary");if(sm&&esComo(sm.textContent))return}
    mover.push(n);
  });
  mover.forEach(function(n){
    contR.appendChild(n);
    if(n.id==="oc-contable")return;
    var t=tituloDe(n);if(!t)return;
    var id=idDe(n,idx++);hint(n,t);secciones.push({id:id,label:t});
  });
  nav.innerHTML=secciones.map(function(s){
    return '<button type="button" data-riel-go="'+s.id+'" style="display:block;width:100%;text-align:left;background:none;border:none;border-left:3px solid transparent;padding:9px 8px;margin:0;font-size:13px;font-weight:700;cursor:pointer;line-height:1.3;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;">'+s.label+"</button>";
  }).join("");
  fila.appendChild(nav);fila.appendChild(contR);vista.appendChild(fila);

  function activo(id){
    nav.querySelectorAll("[data-riel-go]").forEach(function(b){
      var a=b.getAttribute("data-riel-go")===id;
      b.style.borderLeftColor=a?"var(--azul-medio,#2c4a68)":"transparent";
      b.style.background=a?"var(--azul-suave,#dde5ec)":"none";
      b.style.color=a?"var(--azul-medio,#2c4a68)":"var(--ink-soft,#5d5340)";
      b.style.setProperty("-webkit-text-fill-color",a?"var(--azul-medio,#2c4a68)":"var(--ink-soft,#5d5340)");
    });
  }
  nav.addEventListener("click",function(e){
    var b=e.target.closest("[data-riel-go]");if(!b)return;
    var id=b.getAttribute("data-riel-go"), el=document.getElementById(id);
    if(el){try{el.scrollIntoView({behavior:"smooth",block:"start"})}catch(_){el.scrollIntoView(true)}activo(id);try{localStorage.setItem("amigable_riel_tab",id)}catch(_){}}
  });
  try{var last=localStorage.getItem("amigable_riel_tab");if(last&&document.getElementById(last))activo(last);else if(secciones[0])activo(secciones[0].id)}catch(_){if(secciones[0])activo(secciones[0].id)}

  var obs=new MutationObserver(function(muts){
    muts.forEach(function(m){
      m.addedNodes.forEach(function(n){
        if(n.nodeType!==1||n===fila)return;
        if(n.parentNode===vista)contR.appendChild(n);
        if(n.parentNode!==contR&&n.parentNode!==vista)return;
        var t=tituloDe(n);if(!t)return;
        var id=idDe(n,secciones.length);
        if(secciones.some(function(s){return s.id===id}))return;
        hint(n,t);secciones.push({id:id,label:t});
        var b=document.createElement("button");b.type="button";b.setAttribute("data-riel-go",id);
        b.style.cssText="display:block;width:100%;text-align:left;background:none;border:none;border-left:3px solid transparent;padding:9px 8px;margin:0;font-size:13px;font-weight:700;cursor:pointer;line-height:1.3;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;";
        b.textContent=t;nav.appendChild(b);
      });
    });
  });
  obs.observe(vista,{childList:true});
  obs.observe(contR,{childList:true});

  function resp(){
    try{
      var angosto=window.matchMedia&&window.matchMedia("(max-width:720px)").matches;
      if(angosto){
        fila.style.flexDirection="column";
        /* DOS BUGS QUE HACIAN "retazos encima de retazos" en el telefono
           (JFC 2026-08-15):

           1. Faltaba display:flex. cssText REEMPLAZA todo el estilo, y el modo
              ancho si lo pone: al pasar a angosto el nav perdia el flex y los
              chips se desbordaban unos sobre otros.
           2. position:sticky con overflow:visible dejaba el nav FLOTANDO sobre
              el contenido al hacer scroll. Arriba y quieto se lee; encima del
              texto, no. En angosto va estatico.

           Y con tope de alto: 18 chips sin limite empujaban el contenido tan
           abajo que parecia que no habia nada. */
        nav.style.cssText="display:flex;flex:0 0 auto;width:100%;box-sizing:border-box;position:static;top:auto;max-height:34vh;overflow-y:auto;-webkit-overflow-scrolling:touch;flex-direction:row;flex-wrap:wrap;gap:6px;align-content:flex-start;border-right:none;border-bottom:2px solid var(--azul-suave,#dde5ec);padding:8px 0;margin:0 0 14px 0;background:var(--blanco-calido,#F8F9FB);";
        nav.querySelectorAll("[data-riel-go]").forEach(function(b){b.style.width="auto";b.style.flex="0 0 auto";b.style.borderLeft="none";b.style.margin="0";b.style.padding="9px 12px";b.style.whiteSpace="nowrap"});
      }else{
        fila.style.flexDirection="row";
        nav.style.cssText="flex:0 0 148px;width:148px;position:sticky;top:8px;align-self:flex-start;padding:0 10px 0 0;margin:0 14px 0 0;border-right:2px solid var(--azul-suave,#dde5ec);display:flex;flex-direction:column;max-height:calc(100vh - 24px);overflow-y:auto;background:var(--blanco-calido,#F8F9FB);z-index:3;box-sizing:border-box;";
        nav.querySelectorAll("[data-riel-go]").forEach(function(b){b.style.width="100%";b.style.padding="9px 8px"});
      }
    }catch(_){}
  }
  /* GUARDS: el layout se recalcula en cada evento que puede cambiarlo. Sin
     esto quedaba con las medidas del arranque: girar el telefono o que el
     MutationObserver agregara una entrada dejaba el nav mal medido. */
  resp();
  try{
    window.addEventListener("resize",resp);
    window.addEventListener("orientationchange",function(){setTimeout(resp,150)});
    if(window.matchMedia){var mq=window.matchMedia("(max-width:720px)");
      if(mq.addEventListener)mq.addEventListener("change",resp);else if(mq.addListener)mq.addListener(resp);}
    new MutationObserver(function(){resp()}).observe(nav,{childList:true});
  }catch(_){}
}catch(_){}
})();
;window.OCAuth.listo().then(()=>{pintarEmail();pintarWhatsapp()});$("oc-save-codes").addEventListener("click",async()=>{if(window.OCAuth.esDemo&&window.OCAuth.esDemo())return;const o=$("oc-c-owner").value.trim(),e=$("oc-c-emp").value.trim(),a=$("oc-c-acct").value.trim();const valido=s=>/^[0-9]{3}$/.test(s);if(![o,e,a].every(valido)){msg("oc-codes-msg","Cada clave debe ser 3 dígitos (0-9).","var(--rojo)");return}const correoActual=window.OCSecure.leerCorreo();if(!correoActual){msg("oc-codes-msg","Antes de cambiar las claves, registra tu correo de recuperación arriba (si olvidas el código nuevo, sin correo no hay forma de recuperarlo).","var(--rojo)");return}await window.OCSecure.guardarSecreto(o,[e],a,correoActual);$("oc-c-owner").value="";$("oc-c-emp").value="";$("oc-c-acct").value="";msg("oc-codes-msg","Claves guardadas y cifradas.","var(--verde)")});$("oc-descargar-csv").addEventListener("click",async()=>{const u=ubic();const[pl,bal,val]=await Promise.all([fetch(`${API}/reportes/pl?ubicacionId=${u}`).then(r=>r.json()),fetch(`${API}/reportes/balance?ubicacionId=${u}`).then(r=>r.json()),fetch(`${API}/reportes/valorizado?ubicacionId=${u}`).then(r=>r.json())]);const fila=(a,b)=>`"${a}","${b}"`;const filas=[fila("Reporte contable — amigable-123",(new Date).toLocaleString("es-EC")),fila("AVISO","Insumo para el contador. No es una declaración válida ante el SRI."),fila("",""),fila("PÉRDIDAS Y GANANCIAS (hoy)",""),fila("Ventas cobradas (con IVA)",money(pl.ingresosConIva)),fila("IVA cobrado (15%, se liquida al SRI)",money(pl.ivaCobrado)),fila("Ingresos netos (sin IVA)",money(pl.ingresos)),fila("Costo de ventas",money(pl.costoVentas)),fila("Utilidad bruta",money(pl.utilidadBruta)),fila("Gastos operativos",money(pl.gastosOperativos)),fila("Utilidad neta",money(pl.utilidadNeta)),fila("",""),fila("BALANCE SIMPLIFICADO",""),fila("Ingresos del día estimados",money(bal.activos.efectivoEstimado)),fila("Inventario valorizado",money(bal.activos.inventarioValorizado)),fila("Total activos",money(bal.activos.total)),fila("",""),fila("INVENTARIO VALORIZADO POR PRODUCTO",""),fila("Producto","Stock,Costo,Venta,Utilidad potencial"),...val.productos.map(p=>fila(p.nombre,`${p.stockActual},${money(p.valorCosto)},${money(p.valorVenta)},${money(p.utilidadPotencial)}`))];const csv="\ufeff"+filas.join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`reporte-contable-amigable-${(new Date).toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href)});$("oc-exportar").addEventListener("click",async()=>{try{const{apropiada}=await(await fetch(`${API}/instancia`)).json();if(!apropiada){msg("oc-respaldo-msg","Activa este dispositivo (PIN 789) para exportar.","var(--rojo)");return}}catch(_){}try{const datos=await(await fetch(`${API}/respaldo/exportar`)).json();try{if(window.OCArchivo){const arch=await window.OCArchivo.leerTodos();if(arch.length)datos.movimientos=[...arch,...(datos.movimientos||[])]}}catch(_){}const fotosPerchas=await recolectarFotosPerchasRespaldo();const paquete={schemaVersion:2,fecha:(new Date).toISOString(),datos:datos,oc_secure:(function(){try{const s=JSON.parse(localStorage.getItem("oc_secure"));if(s)delete s.ownerPinR;return s?JSON.stringify(s):null}catch(_){return localStorage.getItem("oc_secure")}})(),fotosPerchas:fotosPerchas};const contenidoPlano=JSON.stringify(paquete);const checksum=await window.OCSecure.hashTexto(contenidoPlano);const clave=prompt("Clave para proteger este respaldo (mínimo 8 caracteres). Déjalo en blanco para exportar sin cifrar:");if(clave===null){if(window.dialogosBloqueados&&window.dialogosBloqueados()){msg("oc-respaldo-msg","Tu navegador bloquea los diálogos (pasa en el navegador de WhatsApp). Abre amigable-123 en Chrome o Safari para exportar con clave.","var(--rojo)");return}msg("oc-respaldo-msg","Exportación cancelada.","var(--ink)");return}async function _verificarRespaldo(archivoFinal,checksum,clave){const relectura=JSON.parse(archivoFinal);let texto;if(relectura.amigableRespaldoCifrado){if(!clave||!clave.trim())throw new Error("falta la clave para reverificar");texto=await window.OCSecure.descifrarTextoConClave(relectura,clave.trim());if(!texto)throw new Error("no se pudo descifrar de vuelta con la misma clave")}else{const{checksum:_c,...resto}=relectura;texto=JSON.stringify(resto)}const checksumRelectura=await window.OCSecure.hashTexto(texto);if(checksumRelectura!==checksum)throw new Error("el checksum no coincide tras releer el archivo")}let archivoFinal;if(clave&&clave.trim()){const cifrado=await window.OCSecure.cifrarTextoConClave(contenidoPlano,clave.trim());archivoFinal=JSON.stringify({amigableRespaldoCifrado:true,checksum:checksum,...cifrado},null,2)}else{archivoFinal=JSON.stringify({...paquete,checksum:checksum},null,2)}try{await _verificarRespaldo(archivoFinal,checksum,clave)}catch(eVerif){msg("oc-respaldo-msg","El respaldo no pasó su propia verificación ("+eVerif.message+") — no se descargó. Intenta de nuevo; si se repite, avisa a soporte.","var(--rojo)");return}const blob=new Blob([archivoFinal],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`respaldo-amigable-${(new Date).toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);localStorage.setItem("oc_ultimo_export_manual",String(Date.now()));localStorage.setItem("oc_ultimo_export_verificado",String(Date.now()));msg("oc-respaldo-msg","Respaldo descargado y verificado"+(clave?" y cifrado":"")+". Guárdalo en un lugar seguro.","var(--verde)")}catch(e){msg("oc-respaldo-msg","No se pudo exportar: "+e.message,"var(--rojo)")}});$("oc-importar-file").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{let paquete=JSON.parse(await file.text());if(paquete.amigableRespaldoCifrado){const clave=await(window.promptSeguro?window.promptSeguro("Este respaldo está cifrado. Ingresa la clave con la que se exportó:"):Promise.resolve(prompt("Este respaldo está cifrado. Ingresa la clave con la que se exportó:")));if(!clave){e.target.value="";msg("oc-respaldo-msg","Importación cancelada — no se ingresó una clave.","var(--ink)");return}const texto=await window.OCSecure.descifrarTextoConClave(paquete,clave.trim());if(!texto){msg("oc-respaldo-msg","Clave incorrecta o archivo dañado.","var(--rojo)");e.target.value="";return}const checksumOk=paquete.checksum?await window.OCSecure.hashTexto(texto)===paquete.checksum:true;if(!checksumOk){msg("oc-respaldo-msg","El contenido no coincide con su checksum — el archivo pudo dañarse.","var(--rojo)");e.target.value="";return}paquete=JSON.parse(texto)}else if(paquete.checksum){const{checksum:checksum,...resto}=paquete;const ok=await window.OCSecure.hashTexto(JSON.stringify(resto))===checksum;if(!ok){msg("oc-respaldo-msg","El contenido no coincide con su checksum — el archivo pudo dañarse.","var(--rojo)");e.target.value="";return}}if(!paquete.datos){msg("oc-respaldo-msg","Ese archivo no parece un respaldo de amigable-123.","var(--rojo)");return}if((paquete.schemaVersion||1)>2){msg("oc-respaldo-msg","Este respaldo es de una versión más nueva de amigable-123 que esta pantalla — actualiza la app antes de importarlo.","var(--rojo)");return}if(!confirm("Esto REEMPLAZA todos los datos actuales (productos, ventas, claves) con los del respaldo. ¿Continuar?"))return;const res=await fetch(`${API}/respaldo/importar`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(paquete.datos)});const r=await res.json();if(!res.ok){msg("oc-respaldo-msg",r.error,"var(--rojo)");return}let secretoOk=true;if(paquete.oc_secure){secretoOk=false;try{localStorage.setItem("oc_secure",paquete.oc_secure);secretoOk=true}catch(_){try{const rm=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf("vp_foto_percha_")===0)rm.push(k)}rm.forEach(kk=>{try{localStorage.removeItem(kk)}catch(_){}});localStorage.setItem("oc_secure",paquete.oc_secure);secretoOk=true}catch(_){secretoOk=false}}}if(paquete.fotosPerchas)Object.entries(paquete.fotosPerchas).forEach(([k,v])=>{try{localStorage.setItem(k,v)}catch(_){}});window.dispatchEvent(new CustomEvent("oc-datos-importados"));if(secretoOk){msg("oc-respaldo-msg","Respaldo importado. La pantalla ya muestra los datos restaurados.","var(--verde)")}else{msg("oc-respaldo-msg","Productos y ventas se importaron, pero tus claves (PIN) NO se pudieron guardar (memoria del dispositivo llena). Sigues usando tu PIN actual de este dispositivo. Libera espacio e intenta importar de nuevo, o cambia las claves manualmente en Códigos de acceso.","var(--rojo)")}}catch(err){msg("oc-respaldo-msg","No se pudo importar: "+err.message,"var(--rojo)")}e.target.value=""});const CAJA_MAX_SNAPSHOTS=7;const CAJA_INTERVALO_MS=30*60*1e3;const CAJA_ALERTA_DIAS=7;function cajaLeer(){try{return JSON.parse(localStorage.getItem("oc_caja_snapshots")||"[]")}catch{return[]}}function cajaGuardar(lista){try{localStorage.setItem("oc_caja_snapshots",JSON.stringify(lista.slice(-CAJA_MAX_SNAPSHOTS)));return true}catch{return false}}async function cajaGuardarPunto(silencioso){try{const datos=await(await fetch(`${API}/respaldo/exportar`)).json();const contenido=JSON.stringify({fecha:(new Date).toISOString(),datos:datos});const checksum=await window.OCSecure.hashTexto(contenido);const lista=cajaLeer();lista.push({fecha:(new Date).toISOString(),contenido:contenido,checksum:checksum});const guardado=cajaGuardar(lista);if(!silencioso){msg("oc-respaldo-msg",guardado?"Punto de restauración guardado en este navegador.":"No se pudo guardar (¿localStorage lleno? intenta exportar un respaldo manual y libera espacio).",guardado?"var(--verde)":"var(--rojo)")}}catch(_){if(!silencioso)msg("oc-respaldo-msg","No se pudo tomar el punto de restauración.","var(--rojo)")}}async function cajaRestaurar(idx){const lista=cajaLeer();const punto=lista[idx];if(!punto)return;const okChecksum=await window.OCSecure.hashTexto(punto.contenido)===punto.checksum;if(!okChecksum){msg("oc-respaldo-msg","Este punto no pasó la verificación de checksum — puede estar corrupto. No se restauró nada.","var(--rojo)");return}if(!confirm(`Esto REEMPLAZA los datos actuales con el punto del ${new Date(punto.fecha).toLocaleString()}. ¿Continuar?`))return;let paquete;try{paquete=JSON.parse(punto.contenido)}catch{msg("oc-respaldo-msg","El punto está corrupto.","var(--rojo)");return}const res=await fetch(`${API}/respaldo/importar`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(paquete.datos)});if(!res.ok){const r=await res.json();msg("oc-respaldo-msg",r.error||"No se pudo restaurar.","var(--rojo)");return}window.dispatchEvent(new CustomEvent("oc-datos-importados"));msg("oc-respaldo-msg","Restaurado. La pantalla ya muestra los datos del punto elegido.","var(--verde)")}function cajaPintarAlerta(){const ultimo=Number(localStorage.getItem("oc_ultimo_export_manual")||0);const el=$("oc-caja-alerta");if(!el)return;if(!ultimo){el.textContent="Todavía no has hecho ningún respaldo manual (el de arriba) — hazlo al menos una vez.";el.style.color="var(--rust)";return}const dias=Math.floor((Date.now()-ultimo)/864e5);if(dias>=CAJA_ALERTA_DIAS){el.textContent=`Tu último respaldo manual tiene ${dias} días — considera hacer uno nuevo.`;el.style.color="var(--rust)"}else{el.textContent=`Último respaldo manual: hace ${dias} día(s).`;el.style.color="var(--verde)"}}cajaPintarAlerta();(async()=>{try{if(!navigator.storage||!navigator.storage.estimate)return;const{usage,quota}=await navigator.storage.estimate();if(!quota)return;const pct=Math.round((usage/quota)*100);if(pct<80)return;const aviso=document.createElement("p");aviso.id="oc-storage-aviso";aviso.style.cssText="font-size:14px;font-weight:700;color:var(--rojo,#a3392a);background:#fff5f5;border:2px solid var(--rojo,#a3392a);border-radius:8px;padding:10px 14px;margin:0 0 14px;";aviso.textContent="Espacio al "+pct+"% — considera borrar fotos viejas de perchas o hacer un respaldo desde Checkpoints y luego liberar espacio en tu dispositivo.";const vista=document.getElementById("vista-avanzado");if(vista&&!document.getElementById("oc-storage-aviso"))vista.insertBefore(aviso,vista.firstChild);}catch(_){}})();(async()=>{try{if(!window.OCStorageDurable)return;const persistido=await window.OCStorageDurable.verificarYSolicitar();if(persistido!==false)return;if(document.getElementById("oc-persist-aviso"))return;const aviso=document.createElement("p");aviso.id="oc-persist-aviso";aviso.style.cssText="font-size:14px;font-weight:700;color:var(--rojo,#a3392a);background:#fff5f5;border:2px solid var(--rojo,#a3392a);border-radius:8px;padding:10px 14px;margin:0 0 14px;";aviso.textContent="Tus datos viven solo en este navegador y el sistema operativo puede borrarlos si no usas la app por varios días — instala amigable-123 en tu pantalla de inicio (menú del navegador → \"Agregar a inicio\" / \"Instalar app\") y haz un respaldo seguido en Checkpoints.";const vista=document.getElementById("vista-avanzado");if(vista&&!document.getElementById("oc-persist-aviso"))vista.insertBefore(aviso,vista.firstChild);}catch(_){}})();setInterval(()=>{if(window.OCAuth&&window.OCAuth.rolActual())cajaGuardarPunto(true)},CAJA_INTERVALO_MS);setTimeout(()=>cajaGuardarPunto(true),5e3);$("oc-caja-guardar").addEventListener("click",()=>cajaGuardarPunto(false));$("oc-caja-ver").addEventListener("click",()=>{const cont=$("oc-caja-lista");if(cont.style.display!=="none"){cont.style.display="none";return}const lista=cajaLeer();cont.innerHTML=lista.length?lista.slice().reverse().map((p,i)=>{const idxReal=lista.length-1-i;return`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--azul-suave,#dde5ec);font-size:13px;">\n              <span>${escHtml(new Date(p.fecha).toLocaleString())}</span>\n              <button data-caja-restaurar="${idxReal}" style="font-size:13px;padding:6px 10px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Restaurar</button>\n            </div>`}).join(""):`<p style="font-size:13px;color:var(--ink-soft);">Todavía no hay puntos guardados.</p>`;cont.style.display="block";cont.querySelectorAll("[data-caja-restaurar]").forEach(b=>b.addEventListener("click",()=>cajaRestaurar(Number(b.dataset.cajaRestaurar))))})}async function renderTransferencias(){const cont=$("oc-transf-lista");if(!cont)return;/* Reforzado JFC 2026-07-18: guard de red, sin esto un fallo dejaba la lista muda tras aprobar/rechazar/confirmar */let lista;try{lista=await(await fetch(`${API}/transferencias`)).json()}catch(err){console.error("[renderTransferencias]",err);cont.innerHTML=`<p style="font-size:14px;color:var(--rojo,#a3392a);">No se pudo cargar. Revisa tu conexión e intenta de nuevo.</p>`;return}if(!lista.length){cont.innerHTML=`<p style="font-size:14px;color:var(--ink-soft);">No hay transferencias todavía.</p>`;return}cont.innerHTML=lista.map(t=>{const colorEstado=t.estado==="recibida"?"verde":t.estado==="rechazada"?"rojo":t.estado==="en_transito"?"azul":"amarillo";let acciones="";if(t.estado==="solicitada"){acciones=`<button data-transf-aprobar="${t.id}" style="font-size:13px;padding:6px 10px;border:2px solid var(--verde);border-radius:5px;background:transparent;color:var(--verde);cursor:pointer;">Aprobar</button>\n          <button data-transf-rechazar="${t.id}" style="font-size:13px;padding:6px 10px;border:2px solid var(--rojo);border-radius:5px;background:transparent;color:var(--rojo);cursor:pointer;">Rechazar</button>`}else if(t.estado==="en_transito"){acciones=`<button data-transf-confirmar="${t.id}" style="font-size:13px;padding:6px 10px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Confirmar recepción</button>`}return`<div class="tag-card" style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:8px;flex-wrap:wrap;">\n        <div style="flex:1;min-width:180px;">\n          <strong>${escHtml(t.nombre)}</strong> · ${t.cantidad} un.\n          <div style="font-size:13px;color:var(--ink-soft);">${escHtml(t.desdeNombre)} → ${escHtml(t.haciaNombre)}</div>\n        </div>\n        <span class="badge-estado ${colorEstado}">${t.estado.replace("_"," ")}</span>\n        ${acciones}\n      </div>`}).join("");cont.querySelectorAll("[data-transf-aprobar]").forEach(btn=>btn.addEventListener("click",async()=>{const res=await fetch(`${API}/transferencias/${btn.dataset.transfAprobar}/aprobar`,{method:"POST"});const r=await res.json();if(!res.ok){await ocAlert(r.error);return}renderTransferencias()}));cont.querySelectorAll("[data-transf-rechazar]").forEach(btn=>btn.addEventListener("click",async()=>{await fetch(`${API}/transferencias/${btn.dataset.transfRechazar}/rechazar`,{method:"POST"});renderTransferencias()}));cont.querySelectorAll("[data-transf-confirmar]").forEach(btn=>btn.addEventListener("click",async()=>{let res,r;try{res=await fetch(`${API}/transferencias/${btn.dataset.transfConfirmar}/confirmar-recepcion`,{method:"POST"});r=await res.json()}catch(err){console.error("[transf-confirmar]",err);await ocAlert("No se pudo conectar con el servidor. Intenta de nuevo.");return}if(!res.ok){await ocAlert(r.error);return}renderTransferencias();cargarInventario()}))}function pintarWhatsapp(){const wa=window.OCSecure.leerWhatsapp();const row=$("oc-whatsapp-row");row.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;"><input id="oc-whatsapp-in" type="tel" inputmode="tel" placeholder="+593 99 123 4567" value="${escHtml(wa)}" style="flex:1;min-width:200px;padding:10px;border:2px solid var(--azul-medio);border-radius:5px;font-family:var(--font-mono);"><button id="oc-whatsapp-save" class="ir" style="background:var(--rust);color:var(--blanco-calido);border-color:var(--rust-deep);">Guardar</button></div><p style="font-size:13px;color:var(--ink-soft);margin-top:6px;">Incluye el código de país (ej. +593) para que el número funcione como link.</p><p id="oc-whatsapp-msg" style="font-size:14px;margin-top:8px;"></p>`;$("oc-whatsapp-save").addEventListener("click",async()=>{if(window.OCAuth.esDemo&&window.OCAuth.esDemo())return;const v=$("oc-whatsapp-in").value.trim();if(v&&!/^\+?[0-9 ()-]{7,20}$/.test(v)){msg("oc-whatsapp-msg","Numero de telefono invalido.","var(--rojo)");return}const waOk=window.OCSecure.actualizarWhatsapp(v);if(!waOk){msg("oc-whatsapp-msg","No se pudo guardar (error de almacenamiento).","var(--rojo)");return;}msg("oc-whatsapp-msg","Guardado.","var(--verde)");try{const url=window.OCAuth.workerUrl();let owned={};try{owned=JSON.parse(localStorage.getItem("amigable_owned")||"null")||{}}catch(_){}if(url&&owned.instanceId){fetch(url.replace(/\/+$/,"")+"/checkin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({instanceId:owned.instanceId,licenseCode:owned.licenseCode||"",email:window.OCSecure.leerCorreo()||"",whatsapp:v,accion:"update",producto:"amigable"})}).catch(()=>{})}}catch(_){}})}function pintarEmail(){const email=window.OCSecure.leerCorreo();const row=$("oc-email-row");if(email){row.innerHTML=`<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">\n        <span style="font-family:var(--font-mono);font-size:15px;color:var(--ink);">${window.OCAuth.enmascarar(email)}</span>\n        <button id="oc-email-edit" style="font-size:13px;padding:8px 12px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Cambiar (requiere código maestro)</button></div>`;$("oc-email-edit").addEventListener("click",pedirMaestroYCambiarCorreo)}else{row.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;">\n        <input id="oc-email-in" type="email" placeholder="correo@dominio.com" style="flex:1;min-width:200px;padding:10px;border:2px solid var(--azul-medio);border-radius:5px;font-family:var(--font-mono);">\n        <button id="oc-email-save" class="ir" style="background:var(--rust);color:var(--blanco-calido);border-color:var(--rust-deep);">Guardar</button></div>\n        <p id="oc-email-msg" style="font-size:14px;margin-top:8px;"></p>`;$("oc-email-save").addEventListener("click",()=>{if(window.OCAuth.esDemo&&window.OCAuth.esDemo())return;const v=$("oc-email-in").value.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){msg("oc-email-msg","Correo no válido.","var(--rojo)");return}window.OCSecure.actualizarCorreo(v);pintarEmail();if(reasignacionViaMaestro){reasignacionViaMaestro=false;window.OCAuth.abrirFlujoReset(v)}})}}function pedirMaestroYCambiarCorreo(){const cont=document.createElement("div");cont.className="oc-subgate";cont.innerHTML=`<div class="caja" style="background:var(--blanco-calido);border:2px solid var(--brass);border-radius:8px;padding:26px 22px;max-width:420px;width:100%;text-align:center;">\n      <h2 style="font-family:var(--font-display);color:var(--ink);font-size:20px;margin:0 0 4px;">Código maestro</h2>\n      <p style="font-size:14px;color:var(--ink-soft);margin-bottom:14px;">Solo JFC lo tiene. Identifica al dueño en persona o videollamada antes de dárselo.</p>\n      <input id="mst-codigo" type="text" style="width:100%;padding:10px;border:2px solid var(--azul-medio);border-radius:5px;font-family:var(--font-mono);text-align:center;">\n      <div style="display:flex;gap:8px;margin-top:12px;">\n        <button id="mst-cancelar" style="flex:1;padding:10px;border-radius:6px;border:2px solid var(--azul-medio);background:transparent;color:var(--azul-medio);cursor:pointer;">Cancelar</button>\n        <button id="mst-ok" class="ir" style="flex:1;">Verificar</button>\n      </div>\n      <p id="mst-msg" style="font-size:14px;margin-top:10px;font-weight:700;color:var(--rojo);"></p>\n    </div>`;document.body.appendChild(cont);cont.querySelector("#mst-cancelar").addEventListener("click",()=>cont.remove());cont.querySelector("#mst-ok").addEventListener("click",async()=>{const codigo=cont.querySelector("#mst-codigo").value.trim();const ok=await window.OCSecure.verificarMaestro(codigo);if(!ok){cont.querySelector("#mst-msg").textContent="Código maestro incorrecto.";return}window.OCSecure.actualizarCorreo("");reasignacionViaMaestro=true;cont.remove();pintarEmail()})}function msg(id,txt,color){const el=$(id);if(el){el.style.color=color;el.textContent=txt}}function pintarSyncDev(){const box=$("oc-syncdev-panel");if(!box)return;const activo=OCSync.activa();const necesitaPin=OCSync.requiereReactivar();const pend=OCSync.pendientes();box.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Enviar cambios a mano (sin internet)</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">\n        Para cuando el mismo negocio corre en más de un celular/tablet y no hay wifi ni\n        datos — copia los cambios de este dispositivo y pégalos o mándalos por WhatsApp\n        al otro. Cada dispositivo cifra sus propios cambios con tu PIN de dueño — nadie\n        más puede leerlos, ni siquiera nosotros.\n        Si tienes internet, usa mejor <strong>Sincronizar equipo</strong> arriba — eso\n        es automático y en vivo; esto es el respaldo para cuando no hay señal.\n      </p>\n      <p style="font-size:14px;font-weight:700;margin:8px 0;color:${activo&&!necesitaPin?"var(--sim-verde-dk)":"var(--ink)"};">\n        Estado: ${!activo?"Desactivada":necesitaPin?"Activada, pero pide tu PIN de nuevo en este navegador":"Activada"}\n        ${activo&&!necesitaPin&&pend?` · ${pend} cambio(s) sin enviar`:""}\n      </p>\n      <p id="oc-syncdev-msg" style="font-size:14px;font-weight:700;margin-bottom:10px;"></p>\n      ${!activo||necesitaPin?`\n        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">\n          <input id="oc-syncdev-pin" type="tel" inputmode="numeric" maxlength="3" placeholder="PIN del dueño"\n            style="width:110px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;font-family:var(--font-mono);text-align:center;letter-spacing:.15em;">\n          <button id="oc-syncdev-activar" class="ir" style="background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">${necesitaPin?"Reactivar":"Activar en este dispositivo"}</button>\n        </div>\n      `:`\n        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">\n          <button id="oc-syncdev-copiar" class="ir" style="background:var(--rust);color:var(--blanco-calido);border-color:var(--rust-deep);">📋 Copiar cambios para enviar</button>\n          <button id="oc-syncdev-wa-cambios" class="ir" style="background:#25D366;color:#0a3d20;border-color:#1da851;">📲 Cambios recientes → WhatsApp</button>\n          <button id="oc-syncdev-wa-respaldo" class="ir" style="background:#128C7E;color:#e8fff7;border-color:#0c6b60;">📲 Respaldo completo → WhatsApp</button>\n          <button id="oc-syncdev-qr-mostrar" class="ir" style="background:var(--azul-oscuro);color:var(--blanco-calido);border-color:var(--brass);">📱 Mostrar QR de cambios</button>\n          <button id="oc-syncdev-qr-escanear" class="ir" style="background:var(--azul-oscuro);color:var(--blanco-calido);border-color:var(--brass);">Escanear QR del otro equipo</button>\n          <button id="oc-syncdev-off" style="font-size:13px;padding:8px 12px;border:2px solid var(--rojo);border-radius:5px;background:transparent;color:var(--rojo);cursor:pointer;">Desactivar</button>\n        </div>\n        <div id="oc-syncdev-qr-zona" style="display:none;margin:10px 0;text-align:center;"></div>\n        <details><summary style="font-size:14px;cursor:pointer;color:var(--azul-medio);">Pegar cambios recibidos de otro dispositivo</summary>\n          <textarea id="oc-syncdev-pegar" rows="3" placeholder="Pega aquí el texto que empieza con OCSYNC1:..." style="width:100%;margin-top:8px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;font-family:var(--font-mono);font-size:13px;"></textarea>\n          <button id="oc-syncdev-importar" class="ir" style="margin-top:8px;background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">Importar</button>\n        </details>\n      `}`;const btnActivar=$("oc-syncdev-activar");if(btnActivar)btnActivar.addEventListener("click",async()=>{const pinInput=$("oc-syncdev-pin");const pin=(pinInput?pinInput.value:"").trim();if(!/^\d{3}$/.test(pin)){msg("oc-syncdev-msg","El PIN debe ser 3 dígitos.","var(--rojo)");return}const ok=await OCSync.activar(pin);msg("oc-syncdev-msg",ok?"Activado en este dispositivo.":"PIN incorrecto.",ok?"var(--verde)":"var(--rojo)");pintarSyncDev()});const btnCopiar=$("oc-syncdev-copiar");if(btnCopiar)btnCopiar.addEventListener("click",async()=>{const texto=await OCSync.generarPaqueteManual();if(!texto){msg("oc-syncdev-msg","No hay cambios pendientes en este dispositivo.","var(--ink)");return}try{await navigator.clipboard.writeText(texto);msg("oc-syncdev-msg","Copiado. Envíalo por WhatsApp u otro medio al otro dispositivo.","var(--verde)")}catch(_){prompt("Copia este texto manualmente:",texto)}pintarSyncDev()});const btnWaCambios=$("oc-syncdev-wa-cambios");if(btnWaCambios)btnWaCambios.addEventListener("click",async()=>{const texto=await OCSync.generarPaqueteManual();if(!texto){msg("oc-syncdev-msg","No hay cambios pendientes en este dispositivo.","var(--ink)");return}const mensaje="amigable-123 — cambios para sincronizar. Pega esto en el otro equipo (Avanzado → Pegar cambios):\n\n"+texto;if(navigator.share){try{await navigator.share({text:mensaje});msg("oc-syncdev-msg","Compartido. En el otro equipo: Avanzado → Pegar cambios.","var(--verde)");return}catch(_){}}if(mensaje.length<1500){window.open("https://wa.me/?text="+encodeURIComponent(mensaje),"_blank");msg("oc-syncdev-msg","Abrí WhatsApp con los cambios listos para enviar.","var(--verde)");return}try{await navigator.clipboard.writeText(texto);msg("oc-syncdev-msg","Son muchos cambios para un enlace directo. Los copié — pégalos tú en WhatsApp.","var(--verde)")}catch(_){prompt("Copia este texto y envíalo por WhatsApp:",texto)}});const btnWaResp=$("oc-syncdev-wa-respaldo");if(btnWaResp)btnWaResp.addEventListener("click",async()=>{try{const datos=await(await fetch(`${API}/respaldo/exportar`)).json();try{if(window.OCArchivo){const arch=await window.OCArchivo.leerTodos();if(arch.length)datos.movimientos=[...arch,...(datos.movimientos||[])]}}catch(_){}const fotosPerchas=await recolectarFotosPerchasRespaldo();const paquete={schemaVersion:2,fecha:(new Date).toISOString(),datos:datos,oc_secure:(function(){try{const s=JSON.parse(localStorage.getItem("oc_secure"));if(s)delete s.ownerPinR;return s?JSON.stringify(s):null}catch(_){return localStorage.getItem("oc_secure")}})(),fotosPerchas:fotosPerchas};const contenidoPlano=JSON.stringify(paquete);const checksum=await window.OCSecure.hashTexto(contenidoPlano);const clave=await(window.promptSeguro?window.promptSeguro("Clave para cifrar el respaldo antes de mandarlo por WhatsApp (mínimo 8 caracteres). Es obligatoria: este archivo contiene tus claves."):Promise.resolve(prompt("Clave para cifrar el respaldo antes de mandarlo por WhatsApp (mínimo 8 caracteres). Es obligatoria: este archivo contiene tus claves.")));if(clave===null){msg("oc-syncdev-msg","Envío cancelado.","var(--ink)");return}if(!clave.trim()||clave.trim().length<8){msg("oc-syncdev-msg","Necesitas una clave de al menos 8 caracteres para enviar por WhatsApp (el archivo lleva tus claves). Envío cancelado.","var(--rojo)");return}const cif=await window.OCSecure.cifrarTextoConClave(contenidoPlano,clave.trim());const archivoFinal=JSON.stringify({amigableRespaldoCifrado:true,checksum:checksum,...cif},null,2);try{await _verificarRespaldo(archivoFinal,checksum,clave)}catch(eVerif){msg("oc-syncdev-msg","El respaldo no pasó su propia verificación ("+eVerif.message+") — no se envió. Intenta de nuevo.","var(--rojo)");return}const nombre=`respaldo-amigable-${(new Date).toISOString().slice(0,10)}.json`;const file=new File([archivoFinal],nombre,{type:"application/json"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"Respaldo amigable-123",text:"Respaldo de mi negocio (amigable-123)."});msg("oc-syncdev-msg","Respaldo compartido. En el otro equipo: Avanzado → Importar respaldo.","var(--verde)")}else{const a=document.createElement("a");a.href=URL.createObjectURL(file);a.download=nombre;a.click();URL.revokeObjectURL(a.href);msg("oc-syncdev-msg","Tu navegador no comparte archivos directo. Lo descargué — adjúntalo tú en WhatsApp.","var(--ink)")}}catch(e){msg("oc-syncdev-msg","No se pudo preparar el respaldo: "+e.message,"var(--rojo)")}});const btnImportar=$("oc-syncdev-importar");if(btnImportar)btnImportar.addEventListener("click",async()=>{const texto=$("oc-syncdev-pegar").value;const r=await OCSync.importarPaqueteManual(texto);msg("oc-syncdev-msg",r.ok?`Importado. ${r.recibido||0} cambio(s) aplicados.`:r.motivo,r.ok?"var(--verde)":"var(--rojo)");if(r.ok)$("oc-syncdev-pegar").value=""});const btnOff=$("oc-syncdev-off");if(btnOff)btnOff.addEventListener("click",()=>{if(!confirm("¿Desactivar sincronización en este dispositivo?"))return;OCSync.desactivar();pintarSyncDev()});const QR_CHUNK=700;function qrLib(){return window.qrcode||null}async function mostrarQRCambios(){const zona=$("oc-syncdev-qr-zona");if(zona.style.display!=="none"){zona.style.display="none";zona.innerHTML="";return}if(!qrLib()){msg("oc-syncdev-msg","El generador QR local no cargó (qrcode-local.js).","var(--rojo)");return}const texto=await OCSync.generarPaqueteManual();if(!texto){msg("oc-syncdev-msg","No hay cambios pendientes en este dispositivo.","var(--ink)");return}const sesion=Math.random().toString(36).slice(2,6);const total=Math.ceil(texto.length/QR_CHUNK);if(total>12){msg("oc-syncdev-msg",`Son demasiados cambios para QR (${total} códigos). Usa "Copiar cambios" y pégalo en el otro equipo — misma seguridad.`,"var(--rojo)");return}let html=`<p style="font-size:14px;font-weight:700;color:var(--ink);">Escanea ${total>1?"los "+total+" códigos, en cualquier orden,":"este código"} desde el otro equipo (Avanzado → Escanear QR):</p>`;for(let i=0;i<total;i++){const frag="OCQ|"+sesion+"|"+(i+1)+"|"+total+"|"+texto.slice(i*QR_CHUNK,(i+1)*QR_CHUNK);const q=qrLib()(0,"M");q.addData(frag);q.make();html+=`<div style="display:inline-block;background:#FFFFFF;padding:10px;border:2px solid var(--sim-plata,#C4CDD8);border-radius:8px;margin:6px;"><img src="${q.createDataURL(4,8)}" alt="QR ${i+1} de ${total}" style="display:block;max-width:240px;width:100%;image-rendering:pixelated;"><span style="font-family:var(--font-mono);font-size:13px;color:#0F1923;">${i+1} / ${total}</span></div>`}zona.innerHTML=html;zona.style.display="block";msg("oc-syncdev-msg","QR listos. Los cambios NO se borran de aquí hasta que el otro equipo los importe (dedup por operación: escanear dos veces no duplica).","var(--verde)")}let escaneoActivo=null;function detenerEscaneo(){if(!escaneoActivo)return;clearInterval(escaneoActivo.timer);escaneoActivo.stream.getTracks().forEach(t=>t.stop());const ov=$("oc-syncdev-qr-overlay");if(ov)ov.remove();escaneoActivo=null}window.addEventListener("pagehide",detenerEscaneo);document.addEventListener("visibilitychange",()=>{if(document.hidden)detenerEscaneo()});async function escanearQRCambios(){if(!("BarcodeDetector"in window)){msg("oc-syncdev-msg",'Este navegador no puede escanear QR (típico en iPhone). Usa "Copiar cambios" y pégalo en el otro equipo — misma seguridad.',"var(--rojo)");return}if(!window.OCSecure.syncActiva()){msg("oc-syncdev-msg","Primero activa la sincronización con tu PIN.","var(--rojo)");return}let stream;try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})}catch(_){msg("oc-syncdev-msg","No se pudo abrir la cámara (¿permiso denegado?).","var(--rojo)");return}const ov=document.createElement("div");ov.id="oc-syncdev-qr-overlay";ov.style.cssText="position:fixed;inset:0;z-index:10001;background:#0F1923;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;";ov.innerHTML=`\n        <video autoplay playsinline style="width:100%;max-width:420px;border-radius:10px;border:3px solid #5294AC;"></video>\n        <p id="oc-qr-progreso" style="color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-size:17px;font-weight:700;margin:0;">Apunta al QR del otro equipo…</p>\n        <button id="oc-qr-cerrar" style="min-height:44px;padding:10px 22px;border-radius:8px;border:2px solid #5294AC;background:transparent;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-size:16px;font-weight:700;cursor:pointer;">Cancelar</button>`;document.body.appendChild(ov);const video=ov.querySelector("video");video.srcObject=stream;const detector=new BarcodeDetector({formats:["qr_code"]});const frags={};let sesion=null,total=0;const timer=setInterval(async()=>{try{const codes=await detector.detect(video);for(const c of codes){const v=String(c.rawValue||"");if(v.indexOf("OCQ|")!==0)continue;const[,ses,iStr,nStr]=v.split("|",4);const pedazo=v.split("|").slice(4).join("|");if(sesion&&ses!==sesion)continue;sesion=sesion||ses;total=Number(nStr)||0;frags[Number(iStr)]=pedazo;const tengo=Object.keys(frags).length;$("oc-qr-progreso").textContent=`Leídos ${tengo} de ${total}…`;if(total>0&&tengo>=total){detenerEscaneo();let texto="";for(let i=1;i<=total;i++)texto+=frags[i];const r=await OCSync.importarPaqueteManual(texto);msg("oc-syncdev-msg",r.ok?`Importado por QR: ${r.recibido||0} cambio(s) aplicados.`:r.motivo,r.ok?"var(--verde)":"var(--rojo)");return}}}catch(_){}},300);escaneoActivo={stream:stream,timer:timer};$("oc-qr-cerrar").addEventListener("click",detenerEscaneo)}const btnQRMostrar=$("oc-syncdev-qr-mostrar");if(btnQRMostrar)btnQRMostrar.addEventListener("click",mostrarQRCambios);const btnQREscanear=$("oc-syncdev-qr-escanear");if(btnQREscanear)btnQREscanear.addEventListener("click",escanearQRCambios)}async function render(){const u=ubic();/* Reforzado JFC 2026-07-18: guard de red — sin esto el panel contable quedaba visible pero vacio tras desbloquear con PIN */let pl,bal;try{[pl,bal]=await Promise.all([fetch(`${API}/reportes/pl?ubicacionId=${u}`).then(r=>r.json()),fetch(`${API}/reportes/balance?ubicacionId=${u}`).then(r=>r.json())])}catch(err){console.error("[render/oc-taccounts]",err);$("oc-taccounts").innerHTML=`<p style="color:var(--rojo,#a3392a);font-size:14px;">No se pudo cargar. Revisa tu conexión e intenta de nuevo.</p>`;return}const cuentas=[{nombre:"Caja (Activo)",debe:[["Cobrado hoy (con IVA)",pl.ingresosConIva]],haber:[["Gastos operativos",pl.gastosOperativos]]},{nombre:"Ventas (Ingreso)",debe:[],haber:[["Ingresos netos del día",pl.ingresos]]},{nombre:"IVA por Pagar (Pasivo)",debe:[],haber:[["IVA cobrado hoy (15%)",pl.ivaCobrado]]},{nombre:"Costo de Ventas (Gasto)",debe:[["Costo de lo vendido",pl.costoVentas]],haber:[]},{nombre:"Inventario (Activo)",debe:[["Saldo valorizado",bal.activos.inventarioValorizado]],haber:[["Salida por ventas",pl.costoVentas]]},{nombre:"Gastos Operativos (Gasto)",debe:[["Prorrateo del día",pl.gastosOperativos]],haber:[]}];$("oc-taccounts").innerHTML=cuentas.map(tAccount).join("");await renderChart()}async function renderChart(){const box=$("oc-chart");if(!box)return;/* Reforzado JFC 2026-07-18: guard de red para el grafico de comisiones */let filas;try{filas=await(await fetch(`${API}/liquidaciones`)).json()}catch(err){console.error("[renderChart]",err);box.innerHTML=`<p style="font-size:14px;color:var(--rojo,#a3392a);">No se pudo cargar. Revisa tu conexión e intenta de nuevo.</p>`;return}if(!filas.length){box.innerHTML=`<p style="font-size:14px;color:var(--ink-soft);">Sin ubicaciones tipo socio/franquicia/consignación todavía.</p>`;return}const maxCumplimiento=Math.max(100,...filas.map(f=>f.cumplimientoMeta||0));box.innerHTML=filas.map(f=>{const comisionEfectivaPct=f.ventasBrutas>0?f.comisionSocio/f.ventasBrutas*100:0;const anchoMeta=Math.min(100,(f.cumplimientoMeta||0)/maxCumplimiento*100);return`\n      <div style="margin-bottom:16px;">\n        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">\n          <strong>${escHtml(f.ubicacion)}</strong>\n          <span style="color:var(--ink-soft);">${fmtVentas(f.ventasBrutas)} vendido · ${f.cumplimientoMeta??0}% de meta</span>\n        </div>\n        <div style="background:var(--sim-azul-bg,#D4ECF5);border-radius:6px;overflow:hidden;height:22px;position:relative;">\n          <div style="background:${(f.cumplimientoMeta||0)>=100?"var(--sim-verde,#00C87A)":"var(--sim-azul,#5294AC)"};height:100%;width:${anchoMeta}%;transition:width .3s;"></div>\n        </div>\n        <div style="font-size:13px;color:var(--ink-soft);margin-top:3px;">Comisión efectiva pagada: ${comisionEfectivaPct.toFixed(1)}% (${money(f.comisionSocio)})</div>\n      </div>`}).join("")}function fmtVentas(n){return"$"+Number(n||0).toFixed(2)}function tAccount(c){const filas=Math.max(c.debe.length,c.haber.length,1);let rows="";for(let i=0;i<filas;i++){const d=c.debe[i],h=c.haber[i];rows+=`<tr>\n        <td style="width:50%;padding:4px 6px;font-size:13px;border-right:1.5px solid var(--sim-azul);">${d?d[0]+" "+money(d[1]):""}</td>\n        <td style="width:50%;padding:4px 6px;font-size:13px;">${h?h[0]+" "+money(h[1]):""}</td></tr>`}return`<div class="tag-card" style="padding:12px;border-left:3px solid var(--sim-azul);">\n      <div style="font-family:var(--font-display);font-weight:700;font-size:14px;text-align:center;color:var(--sim-azul-dk);border-bottom:2px solid var(--sim-azul);padding-bottom:6px;margin-bottom:4px;">${escHtml(c.nombre)}</div>\n      <table style="width:100%;border-collapse:collapse;">\n        <tr>\n          <th style="font-size:13px;color:var(--sim-azul);border-right:1.5px solid var(--sim-azul);border-bottom:1px solid var(--sim-azul);">DEBE</th>\n          <th style="font-size:13px;color:var(--sim-azul);border-bottom:1px solid var(--sim-azul);">HABER</th>\n        </tr>\n        ${rows}\n      </table></div>`}document.addEventListener("change",e=>{if(e.target&&e.target.id==="selectUbicacion"&&desbloqueadaSesion&&$("oc-contable")&&$("oc-contable").style.display!=="none")render()});window.addEventListener("oc-login",e=>{if(!e.detail||e.detail.rol!=="contador")return;if(document.querySelector('nav button[data-vista="contable"]'))return;try{initSeguro()}catch(_){}const navEl=document.querySelector("nav");const btn=document.createElement("button");btn.dataset.vista="contable";btn.innerHTML="<span>Contable</span>";if(navEl)navEl.appendChild(btn);const main=document.querySelector("main");const sec=document.createElement("section");sec.id="vista-contable";sec.className="vista";if(main)main.appendChild(sec);const lock=$("oc-acct-lock");if(lock)lock.style.display="none";const contEl=$("oc-contable");if(contEl){sec.appendChild(contEl);contEl.style.display="block"}btn.addEventListener("click",()=>{document.querySelectorAll("nav button").forEach(b=>b.classList.remove("activo"));btn.classList.add("activo");document.querySelectorAll(".vista").forEach(v=>v.classList.remove("activa"));sec.classList.add("activa")});btn.classList.add("activo");document.querySelectorAll(".vista").forEach(v=>v.classList.remove("activa"));sec.classList.add("activa");render()});function initSeguro(){try{init()}catch(e){console.error("Avanzado init falló (aislado):",e)}}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initSeguro);else initSeguro()
  /* ==========================================================================
     B3 (JFC, 2026-08-14): cambiar el codigo de la sala. CASO EXTREMO.
     Ver el comentario largo del parche: dar de baja a un ex empleado resuelve
     el 95% y es mucho menos molesto. Esto es para cuando el codigo SE FILTRO.
     El panel de control BLOQUEA instancias; el dueno ROTA el codigo. No al
     reves: rotar desde el panel dejaria al dueno fuera de su propia sala.
     ========================================================================== */
  /* ==========================================================================
     ocAbrirTablero (M13/M15). El enlace lleva el codigo en el fragmento (#),
     que por como funcionan los navegadores NO se manda al servidor: ni GitHub
     Pages ni nadie ve el codigo pasar. El tablero lo lee y lo borra de la
     barra de direcciones al instante.

     El aviso va ANTES de copiar el enlace, que es donde ocurre el riesgo, no
     enterrado en el manual.
     ========================================================================== */
  function ocAbrirTablero(codigo) {
    /* Sin argumento se lee del storage: este boton vive junto a la capa
       contable, fuera del render de la seccion de sync, donde salaActiva ni
       siquiera esta puesta todavia. */
    if (!codigo) { try { codigo = JSON.parse(localStorage.getItem("amigable_sync_room") || "{}").codigo || ""; } catch (_) { codigo = ""; } }
    /* Una sala que no es de esta app no abre este tablero: ver el comentario
       de _licenciaDeEstaApp. Mejor pedirla que proyectar el negocio de otra. */
    if (codigo && !/^AMG-/i.test(codigo)) codigo = "";
    if (!codigo) {
      alert("Primero enciende la sincronización de equipo, aquí en Avanzado: el tablero se conecta con ese mismo código.");
      return;
    }
    var url = new URL("tablero.html", location.href).href + "#c=" + encodeURIComponent(codigo);
    var m = document.createElement("div");
    m.className = "oc-subgate";
    m.id = "oc-tab-modal";
    m.innerHTML =
      '<div class="caja" style="background:#FFFFFF;max-width:460px;">' +
      '<h3 style="margin:0 0 8px;font-size:19px;color:#0F1923;">Tu tablero de control</h3>' +
      '<p style="font-size:15px;line-height:1.55;margin:0 0 12px;color:#2C3E50;">' +
      'Tu negocio completo en una pantalla grande, para revisarlo sin la compresi&oacute;n del d&iacute;a a d&iacute;a.</p>' +
      '<p style="font-size:15px;line-height:1.55;margin:0 0 12px;color:#2C3E50;background:#F8F9FB;' +
      'border-left:4px solid #00C87A;border-radius:0 8px 8px 0;padding:11px 13px;">' +
      'El tablero es un lienzo: no guarda nada. Tus datos siguen en los dispositivos de tu equipo ' +
      'y desde ah&iacute; se proyectan, cifrados. Para que se llene, deja este dispositivo encendido.</p>' +
      '<p style="font-size:15px;line-height:1.55;margin:0 0 14px;color:#B54E0A;font-weight:700;">' +
      'Este enlace lleva tu c&oacute;digo. M&aacute;ndalo solo a quien ya tiene acceso al negocio: ' +
      'adem&aacute;s del c&oacute;digo, el tablero pide tu PIN.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button id="oc-tab-abrir" class="ir" style="background:#0F1923;border-color:#0F1923;">Abrir el tablero</button>' +
      '<button id="oc-tab-copiar">Copiar el enlace</button>' +
      '<button id="oc-tab-cerrar">Cerrar</button></div>' +
      '<p id="oc-tab-msg" style="font-size:14px;margin:10px 0 0;min-height:19px;color:#00975C;"></p></div>';
    document.body.appendChild(m);
    var cerrar = function () { try { m.remove(); } catch (_) {} };
    m.addEventListener("click", function (e) { if (e.target === m) cerrar(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { cerrar(); document.removeEventListener("keydown", esc); }
    });
    document.getElementById("oc-tab-cerrar").addEventListener("click", cerrar);
    document.getElementById("oc-tab-abrir").addEventListener("click", function () {
      window.open(url, "_blank", "noopener");
      cerrar();
    });
    document.getElementById("oc-tab-copiar").addEventListener("click", function () {
      var msg = document.getElementById("oc-tab-msg");
      /* Sin clipboard API (http, navegador viejo) se cae al textarea de toda
         la vida antes que dejar al usuario sin poder copiar. */
      var ok = function () { msg.textContent = "Enlace copiado."; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(ok, function () { legacy(); });
      } else { legacy(); }
      function legacy() {
        try {
          var ta = document.createElement("textarea");
          ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
          ok();
        } catch (_) { msg.style.color = "#A8123A"; msg.textContent = "No se pudo copiar. Abre el tablero y guarda la p\u00e1gina en favoritos."; }
      }
    });
  }

  /* Segunda puerta (M13): Ayuda(?) llama aqui. El modal, el aviso y el gate
     de rol viven en un solo sitio: dos entradas, una sola implementacion. */
  try {
    /* El codigo se lee del storage, NO de la variable salaActiva: esa solo
       existe despues de pintar la vista Avanzado, y la puerta de Ayuda(?) se
       puede tocar sin haber entrado nunca ahi. Misma clave que usa
       sync-realtime.js (leerSala); si cambia alla, cambia aqui. */
    var _salaGuardada = function () {
      try {
        var raw = localStorage.getItem("amigable_sync_room");
        if (!raw) return "";
        var o = JSON.parse(raw);
        return (o && o.codigo) ? o.codigo : "";
      } catch (_) { return ""; }
    };
    window.OCTablero = {
      disponible: function () {
        try {
          var rol = window.OCAuth && window.OCAuth.rolActual && window.OCAuth.rolActual();
          return !!(_salaGuardada() && (rol === "dueno" || rol === "admin"));
        } catch (_) { return false; }
      },
      abrir: function () { var c = _salaGuardada(); if (c && this.disponible()) ocAbrirTablero(c); },
    };
  } catch (_) {}

  function ocRotarCodigoSala() {
    if (document.getElementById("oc-rot-modal")) return;
    var m = document.createElement("div");
    m.className = "oc-subgate";
    m.id = "oc-rot-modal";
    m.innerHTML =
      '<div class="caja" style="background:#FFFFFF;border:2px solid #E86040;border-radius:16px;padding:24px 20px;max-width:460px;width:100%;text-align:left;margin:auto;">' +
      '<h2 style="font-size:21px;font-weight:800;margin:0 0 12px;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;">Cambiar el c&oacute;digo de tu negocio</h2>' +
      '<p style="font-size:16px;line-height:1.5;margin:0 0 12px;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;">Se genera un c&oacute;digo nuevo y el actual deja de servir. Todos los tel&eacute;fonos de tu equipo tendr&aacute;n que volver a unirse con el nuevo, incluido el tuyo si usas m&aacute;s de un dispositivo.</p>' +
      '<p style="font-size:15px;line-height:1.5;margin:0 0 12px;padding:11px 13px;background:#F8F9FB;border-left:4px solid #2C3E50;border-radius:0 8px 8px 0;color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;">Haz esto solo si el c&oacute;digo se filtr&oacute;: alguien lo public&oacute;, lo dej&oacute; en un grupo, o se fue de la empresa con &eacute;l anotado. Para un ex empleado normal alcanza con darlo de baja en Usuarios, que es mucho menos molesto para el resto del equipo.</p>' +
      '<p style="font-size:15px;line-height:1.5;margin:0 0 18px;padding:11px 13px;background:#FFF6F2;border-left:4px solid #E86040;border-radius:0 8px 8px 0;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;">Esto corta el acceso de aqu&iacute; en adelante. Lo que esa persona ya haya visto o copiado no se puede recuperar.</p>' +
      '<button type="button" id="oc-rot-ok" style="width:100%;min-height:48px;padding:13px;border:none;border-radius:12px;background:#E86040;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-weight:800;font-size:16px;cursor:pointer;">S&iacute;, cambiar el c&oacute;digo</button>' +
      '<button type="button" id="oc-rot-no" style="width:100%;min-height:44px;margin-top:10px;background:none;border:none;font-size:15px;color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;cursor:pointer;">Mejor no</button>' +
      '<p id="oc-rot-msg" style="font-size:15px;font-weight:700;margin:12px 0 0;"></p>' +
      "</div>";
    document.body.appendChild(m);
    function cerrar() { try { m.remove(); } catch (_) {} document.removeEventListener("keydown", onKey, true); }
    function onKey(e) { if (e.key === "Escape" || e.key === "Esc") { e.stopPropagation(); cerrar(); } }
    document.addEventListener("keydown", onKey, true);
    m.addEventListener("click", function (e) { if (e.target === m) cerrar(); });
    m.querySelector("#oc-rot-no").addEventListener("click", cerrar);
    m.querySelector("#oc-rot-ok").addEventListener("click", function (ev) {
      var btn = ev.currentTarget;
      if (btn.disabled) return;
      btn.disabled = true;
      var msg = m.querySelector("#oc-rot-msg");
      try {
        /* El generador vive en auth-ui.js, que ya usa crypto.getRandomValues y
           el simbolo de verificacion de Crockford. No se duplica aqui. */
        var nuevo = (window.OCAuth && window.OCAuth.generarCodigo) ? window.OCAuth.generarCodigo() : null;
        if (!nuevo) throw new Error("generador no disponible");

        /* ORDEN A PROPOSITO: primero se guarda en el registro local, despues se
           mueve la sala. Si el navegador muriera en medio, el dueno conserva el
           codigo nuevo escrito y puede volver a unirse a mano. Al reves quedaria
           en una sala cuyo codigo no sabe. */
        var owned = {};
        try { owned = JSON.parse(localStorage.getItem("amigable_owned") || "null") || {}; } catch (_) {}
        owned.licenseCode = nuevo;
        owned.licenseRotadaEn = Date.now();
        localStorage.setItem("amigable_owned", JSON.stringify(owned));

        if (window.OCSyncControl) {
          try { window.OCSyncControl.desactivar(); } catch (_) {}
          window.OCSyncControl.activar(nuevo);
        }
        try {
          if (window.OCAuth && window.OCAuth.heartbeat) {
            window.OCAuth.heartbeat({ instanceId: owned.instanceId, licenseCode: nuevo, accion: "rotacion" });
          }
        } catch (_) { /* el heartbeat es informativo: si falla, la rotacion vale igual */ }

        msg.style.color = "#00805A";
        msg.innerHTML = "C&oacute;digo nuevo. Comp&aacute;rtelo con tu equipo uno a uno:<br><code style=\'font-family:monospace;font-size:17px;letter-spacing:.08em;\'>" +
          String(nuevo).replace(/[&<>]/g, "") + "</code>";
        btn.style.display = "none";
      } catch (e) {
        btn.disabled = false;
        msg.style.color = "#B0183E";
        msg.textContent = (e && e.message) || "No se pudo cambiar el codigo.";
      }
    });
  }

})();
