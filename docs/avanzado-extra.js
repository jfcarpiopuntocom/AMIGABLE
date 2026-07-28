(function(){const escHtml=window.escHtml||(s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])));function $(id){return document.getElementById(id)}const API="/api";
  /* Fix 2026-07-23 (JFC): el respaldo escaneaba solo localStorage para las fotos
     de percha, pero idb-fotos.js migra esas fotos a IndexedDB y las borra de
     localStorage — el respaldo quedaba sin fotos, silenciosamente, en cualquier
     dispositivo donde ya corrió la migración. Ahora se leen primero de
     window.OCFotos (IndexedDB) y se completa con lo que quede en localStorage
     (dispositivos viejos sin IndexedDB o migración a medias). */
  async function recolectarFotosPerchasRespaldo(){const out={};try{if(window.OCFotos){const todas=await window.OCFotos.leerTodas();Object.entries(todas||{}).forEach(([id,dataUrl])=>{out["vp_foto_percha_"+id]=dataUrl})}}catch(_){}try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf("vp_foto_percha_")===0&&!(k in out))out[k]=localStorage.getItem(k)}}catch(_){}return out}let desbloqueadaSesion=false;function ubic(){const s=$("selectUbicacion");return s?s.value:"todas"}const money=n=>"$"+Number(n||0).toFixed(2);let reasignacionViaMaestro=false;const OCSync=function(){const MET_ESCRITURA=["POST","PUT","PATCH","DELETE"];const RUTAS_EXCLUIDAS=["/api/sync","/api/respaldo"];const fetchOriginal=window.fetch.bind(window);let cola=[];let temporizador=null;let syncOn=localStorage.getItem("oc_sync_on")==="1";function deviceId(){let id=localStorage.getItem("oc_device_id");if(!id){id=Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);localStorage.setItem("oc_device_id",id)}return id}function opId(){return deviceId()+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6)}function urlDe(input){return typeof input==="string"?input:input&&input.url||""}if(!window.__ocSyncPatched){window.__ocSyncPatched=true;window.fetch=async function(input,init){const res=await fetchOriginal(input,init);try{if(syncOn&&res.ok){const url=urlDe(input);const method=(init&&init.method||"GET").toUpperCase();const excluida=RUTAS_EXCLUIDAS.some(r=>url.indexOf(r)!==-1);if(url.indexOf("/api/")!==-1&&!excluida&&MET_ESCRITURA.includes(method)){cola.push({id:opId(),ts:Date.now(),dev:deviceId(),method:method,url:url,body:init&&init.body||null});await guardarColaCifrada()}}}catch(_){}return res}}async function guardarColaCifrada(){if(!window.OCSecure.syncActiva())return;const blob=await window.OCSecure.cifrarSync(JSON.stringify(cola));if(blob)localStorage.setItem("oc_sync_pending",blob)}async function restaurarCola(){if(!window.OCSecure.syncActiva())return;const blob=localStorage.getItem("oc_sync_pending");if(!blob)return;const texto=await window.OCSecure.descifrarSync(blob);if(texto){try{cola=JSON.parse(texto)||[]}catch{cola=[]}}}function idsAplicados(){try{return new Set(JSON.parse(localStorage.getItem("oc_sync_ids_aplicados")||"[]"))}catch{return new Set}}function guardarIdsAplicados(set){localStorage.setItem("oc_sync_ids_aplicados",JSON.stringify(Array.from(set).slice(-3e3)))}async function reproducir(ops){const aplicados=idsAplicados();const porDispositivo={};ops.forEach(op=>{if(op&&typeof op==="object"&&op.dev!==deviceId()&&op.id&&!aplicados.has(op.id))(porDispositivo[op.dev]=porDispositivo[op.dev]||[]).push(op)});for(const dev in porDispositivo){const pendientes=porDispositivo[dev].sort((a,b)=>a.ts-b.ts);for(const op of pendientes){if(typeof op.url!=="string"||op.url.indexOf("/api/")!==0)break;try{await fetchOriginal(op.url,{method:op.method,headers:{"Content-Type":"application/json"},body:op.body});aplicados.add(op.id)}catch(_){break}}}guardarIdsAplicados(aplicados)}async function activar(pin){const ok=await window.OCSecure.activarSync(pin);if(!ok)return false;syncOn=true;localStorage.setItem("oc_sync_on","1");await restaurarCola();arrancarIntervalo();return true}function desactivar(){syncOn=false;localStorage.removeItem("oc_sync_on");window.OCSecure.desactivarSync();if(temporizador)clearInterval(temporizador)}function activa(){return syncOn}function requiereReactivar(){return syncOn&&!window.OCSecure.syncActiva()}function pendientes(){return cola.length}async function push(){if(!syncOn||!window.OCSecure.syncActiva()||!cola.length)return{ok:true,enviado:0};const n=cola.length;const paraEnviar=cola.slice(0,n);const blob=await window.OCSecure.cifrarSync(JSON.stringify(paraEnviar));try{const res=await fetchOriginal(`${API}/sync/push`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({device:deviceId(),blob:blob})});if(!res.ok)return{ok:false,motivo:"Tu servidor de sync rechazó el envío."};cola=cola.slice(n);await guardarColaCifrada();return{ok:true,enviado:n}}catch(_){return{ok:false,motivo:"Sin conexión a tu servidor de sync (¿ya agregaste las rutas /api/sync?)."}}}async function pull(){if(!syncOn||!window.OCSecure.syncActiva())return{ok:true,recibido:0};try{const res=await fetchOriginal(`${API}/sync/pull?device=${encodeURIComponent(deviceId())}`,{method:"GET"});if(!res.ok)return{ok:false,motivo:"Tu servidor de sync rechazó la consulta."};const paquetes=await res.json()||[];let recibido=0;for(const p of paquetes){if(p.device===deviceId())continue;const texto=await window.OCSecure.descifrarSync(p.blob);if(!texto)continue;let ops=[];try{ops=JSON.parse(texto)}catch(_){}if(ops.length){await reproducir(ops);recibido+=ops.length}}return{ok:true,recibido:recibido}}catch(_){return{ok:false,motivo:"Sin conexión a tu servidor de sync."}}}let onlineListenerListo=false;function arrancarIntervalo(){if(temporizador)clearInterval(temporizador);temporizador=setInterval(()=>{if(window.OCAuth&&!window.OCAuth.rolActual())return;push().then(pull)},4*60*1e3);if(!onlineListenerListo){onlineListenerListo=true;window.addEventListener("online",()=>{if(syncOn)push().then(pull)})}}async function generarPaqueteManual(){if(!cola.length)return null;const blob=await window.OCSecure.cifrarSync(JSON.stringify(cola));const paquete={v:1,device:deviceId(),blob:blob};return"OCSYNC1:"+btoa(unescape(encodeURIComponent(JSON.stringify(paquete))))}const MANUAL_MAX_BYTES=2*1024*1024;async function importarPaqueteManual(texto){texto=(texto||"").trim();if(texto.indexOf("OCSYNC1:")!==0)return{ok:false,motivo:"Ese texto no es un paquete de sincronización válido."};if(texto.length>MANUAL_MAX_BYTES)return{ok:false,motivo:"Ese paquete es demasiado grande para ser válido."};let paquete;try{paquete=JSON.parse(decodeURIComponent(escape(atob(texto.slice(8)))))}catch(_){return{ok:false,motivo:"El paquete está corrupto o incompleto."}}if(!paquete||paquete.v!==1||typeof paquete.blob!=="string"||typeof paquete.device!=="string")return{ok:false,motivo:"El paquete no tiene el formato esperado."};if(paquete.device===deviceId())return{ok:false,motivo:"Ese paquete es de este mismo dispositivo."};const texto2=await window.OCSecure.descifrarSync(paquete.blob);if(!texto2)return{ok:false,motivo:"No se pudo descifrar (¿es del mismo negocio, con el mismo PIN de dueño activado aquí?)."};let ops=[];try{ops=JSON.parse(texto2)}catch(_){}if(!Array.isArray(ops))return{ok:false,motivo:"El contenido del paquete no es una lista de operaciones válida."};if(!ops.length)return{ok:true,recibido:0};try{await reproducir(ops)}catch(_){return{ok:false,motivo:"El paquete tiene operaciones dañadas y no se pudo aplicar."}}return{ok:true,recibido:ops.length}}if(syncOn)restaurarCola();return{activar:activar,desactivar:desactivar,activa:activa,requiereReactivar:requiereReactivar,pendientes:pendientes,push:push,pull:pull,generarPaqueteManual:generarPaqueteManual,importarPaqueteManual:importarPaqueteManual,deviceId:deviceId}}();function init(){const vista=$("vista-avanzado");if(!vista||vista.dataset.ocReady)return;vista.dataset.ocReady="1";const cont=document.createElement("div");cont.id="oc-contable";cont.style.display="none";const tboxes=document.createElement("div");tboxes.id="oc-taccounts";tboxes.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin:6px 0 22px;";cont.appendChild(tboxes);const chartBox=document.createElement("div");chartBox.className="tag-card";chartBox.style.cssText="margin-bottom:22px;text-align:left;";chartBox.innerHTML=`<h3 class="seccion" style="margin-top:0;">Comparativo por ubicación (este mes)</h3><div id="oc-chart"></div>`;cont.appendChild(chartBox);const marcadores=["tablaPL","tablaBalance","tablaValorizado"];marcadores.forEach(idTabla=>{const tabla=$(idTabla);if(!tabla)return;const wrap=tabla.closest(".tabla-wrap");const h3=wrap&&wrap.previousElementSibling;if(h3&&h3.tagName==="H3")cont.appendChild(h3);if(wrap)cont.appendChild(wrap)});const descargaBox=document.createElement("div");descargaBox.className="tag-card";descargaBox.style.cssText="text-align:left;margin-top:22px;";descargaBox.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Reporte para el contador</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">P&amp;G, balance e inventario valorizado en un solo archivo, listo para Excel. No es una declaración ante el SRI — es el insumo para que tu contador la prepare.</p>\n      <button id="oc-descargar-csv" class="ir" style="background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">📄 Descargar reporte contable (.csv)</button>\n    `;cont.appendChild(descargaBox);const respaldo=document.createElement("div");respaldo.className="tag-card";respaldo.style.cssText="text-align:left;margin-top:22px;";respaldo.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Respaldo</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">\n        Descarga TODO tu negocio (productos, ventas, movimientos, gastos, claves y fotos de perchas) en un archivo. Guárdalo en tu correo, tu Drive, donde sea — es tu copia de seguridad si se borra el caché o se daña el dispositivo.</p>\n      <div style="display:flex;gap:10px;flex-wrap:wrap;">\n        <button id="oc-exportar" class="ir" style="background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">⬇️ Exportar respaldo</button>\n        <label class="ir" style="background:var(--rust);color:var(--blanco-calido);border-color:var(--rust-deep);display:inline-flex;align-items:center;cursor:pointer;">⬆️ Importar respaldo\n          <input id="oc-importar-file" type="file" accept=".json" style="display:none;">\n        </label>\n      </div>\n      <p id="oc-respaldo-msg" style="font-size:14px;margin-top:10px;font-weight:700;"></p>\n      <hr style="border:none;border-top:1px solid var(--azul-suave,#dde5ec);margin:16px 0;">\n      <h4 style="margin:0 0 6px;font-size:14px;">🔐 Caja fuerte local (automática)</h4>\n      <p style="font-size:13px;color:var(--ink-soft);margin-top:0;">\n        Además del respaldo manual de arriba, amigable-123 guarda solo AQUÍ (en este navegador) una foto de tus datos cada cierto tiempo,\n        por si borras algo sin querer. Esto NO reemplaza el respaldo manual — si se borra el caché del navegador, se pierden estos puntos también.\n        <em>Próximamente: replicación automática de estos puntos entre tus dispositivos. Mientras tanto, puedes copiar tus datos a otro equipo desde Avanzado → Sincronizar por QR.</em></p>\n      <p id="oc-caja-alerta" style="font-size:13px;font-weight:700;"></p>\n      <div style="display:flex;gap:10px;flex-wrap:wrap;">\n        <button id="oc-caja-guardar" style="font-size:13px;padding:8px 12px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">📸 Guardar punto ahora</button>\n        <button id="oc-caja-ver" style="font-size:13px;padding:8px 12px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">🗂️ Ver puntos guardados</button>\n      </div>\n      <div id="oc-caja-lista" style="display:none;margin-top:10px;"></div>\n    `;cont.appendChild(respaldo);(async()=>{try{if(!navigator.storage||!navigator.storage.estimate)return;const{usage,quota}=await navigator.storage.estimate();const p=document.createElement("p");p.id="oc-storage-info";p.style.cssText="font-size:12px;color:var(--ink-soft);margin:10px 0 0;font-family:monospace;";if(!quota)return;const mb=n=>(n/1048576).toFixed(1)+" MB";p.textContent="Storage: "+mb(usage)+" used / "+mb(quota)+" quota ("+Math.round((usage/quota)*100)+"%)";const lista=document.getElementById("oc-caja-lista");if(lista&&lista.parentNode&&!document.getElementById("oc-storage-info"))lista.parentNode.insertBefore(p,lista.nextSibling);}catch(_){}})();fetch(`${API}/instancia`).then(r=>r.json()).then(({apropiada})=>{if(!apropiada){const b=document.getElementById("oc-exportar");if(b){b.disabled=true;b.title="Activa este dispositivo (PIN 789) para exportar respaldos.";b.style.opacity="0.5";b.style.cursor="not-allowed"}}}).catch(()=>{});const lock=document.createElement("div");lock.id="oc-acct-lock";lock.className="tag-card";lock.innerHTML=`<button id="oc-acct-open">🔒 Ver capa contable</button>`;const aviso=vista.querySelector(".avanzado-aviso");if(aviso)aviso.insertAdjacentElement("afterend",lock);else vista.appendChild(lock);vista.appendChild(cont);$("oc-acct-open").addEventListener("click",async()=>{if(!desbloqueadaSesion){const ok=await window.OCAuth.pedirSubclaveContable();if(!ok)return;desbloqueadaSesion=true}lock.style.display="none";cont.style.display="block";await render()});const gestion=document.createElement("div");gestion.className="panel-escaner tag-card";gestion.style.cssText="text-align:left;margin-top:22px;";gestion.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Acceso y recuperación</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">Correo del dueño para recuperar las claves. Una vez guardado se oculta y queda ofuscado.</p>\n      <div id="oc-email-row"></div>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:18px;">Tu WhatsApp (opcional) — para que la app te envie resumenes utiles, y para fortalecer como sincronizan tus datos entre dispositivos.</p>\n      <div id="oc-whatsapp-row"></div>\n      <div id="oc-clave-block" style="margin-top:18px;">\n        <p style="font-size:14px;color:var(--ink-soft);">Claves (PIN de 3 dígitos). Por seguridad, los códigos actuales NO se muestran aquí (se guardan cifrados) — escribe los NUEVOS solo si quieres cambiarlos.</p>\n        <div style="display:flex;flex-direction:column;gap:8px;max-width:340px;">\n          <label style="font-size:13px;">Dueño <input id="oc-c-owner" maxlength="3" inputmode="numeric" placeholder="•••" style="margin-left:8px;width:90px;text-align:center;font-family:var(--font-mono);padding:8px;border:2px solid var(--azul-medio);border-radius:5px;"></label>\n          <label style="font-size:13px;">Empleado <input id="oc-c-emp" maxlength="3" inputmode="numeric" placeholder="•••" style="margin-left:8px;width:90px;text-align:center;font-family:var(--font-mono);padding:8px;border:2px solid var(--azul-medio);border-radius:5px;"></label>\n          <label style="font-size:13px;">Contable <input id="oc-c-acct" maxlength="3" inputmode="numeric" placeholder="•••" style="margin-left:8px;width:90px;text-align:center;font-family:var(--font-mono);padding:8px;border:2px solid var(--azul-medio);border-radius:5px;"></label>\n        </div>\n        <button id="oc-save-codes" class="ir" style="margin-top:12px;background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">Guardar nuevas claves</button>\n        <p id="oc-codes-msg" style="font-size:14px;margin-top:8px;"></p><hr style="border:none;border-top:1px solid var(--azul-suave,#dde5ec);margin:16px 0;"><h4 style="margin:0 0 6px;font-size:14px;color:var(--ink);">Password de recuperacion</h4><p style="font-size:13px;color:var(--ink-soft);margin-top:0;">Tu llave para recuperar el acceso si olvidas tu PIN, sin depender de nadie. <span id="oc-pwd-estado" style="font-weight:700;"></span></p><button id="oc-pwd-cambiar" style="font-size:13px;padding:8px 12px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Crear o cambiar mi password</button>\n      </div>`;vista.appendChild(gestion);(function(){try{var _pe=document.getElementById("oc-pwd-estado");if(_pe&&window.OCAuth&&window.OCAuth.tieneOwnerPassword){var _t=window.OCAuth.tieneOwnerPassword();_pe.textContent=_t?"Ya la tienes configurada.":"Aun no la has creado.";_pe.style.color=_t?"var(--verde,#2f7a4f)":"var(--rust,#E86040)";}var _pb=document.getElementById("oc-pwd-cambiar");if(_pb)_pb.addEventListener("click",function(){if(window.OCAuth&&window.OCAuth.pedirPasswordInicial){window.OCAuth.pedirPasswordInicial();setTimeout(function(){var e=document.getElementById("oc-pwd-estado");if(e&&window.OCAuth.tieneOwnerPassword()){e.textContent="Ya la tienes configurada.";e.style.color="var(--verde,#2f7a4f)";}},3000);}});}catch(_){}})();
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
  const salaActiva = window.OCSyncControl.salaActiva();
  const codigoPrecargado = (function () {
    try { return (JSON.parse(localStorage.getItem("amigable_owned") || "null") || {}).licenseCode || ""; } catch (_) { return ""; }
  })();
  panel.innerHTML = `
    <h3 class="seccion" style="margin-top:0;">Sincronizar equipo</h3>
    <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">
      Todos los dispositivos de tu equipo (dueño, admins, empleados) que tengan
      el código de tu negocio quedan sincronizados en segundos, siempre —
      no solo en ferias. Ventas, ajustes y transferencias de stock se avisan
      entre todos al instante, para que nadie venda las mismas últimas
      unidades sin saberlo.
    </p>
    <p style="font-size:13px;color:var(--sim-verde-dk,#1a6e3c);font-weight:700;margin-top:0;">
      Tus datos solo viajan cifrados entre los dispositivos de tu propio
      equipo. Nunca llegan a AMIGABLE ni a nadie más — ni siquiera nosotros
      podemos leerlos. Es completamente opcional.
    </p>
    <div id="oc-sync-estado" style="font-size:13px;font-weight:700;margin-bottom:10px;"></div>
    <div id="oc-sync-apagado" style="display:${salaActiva ? "none" : "flex"};gap:8px;flex-wrap:wrap;align-items:center;">
      <input id="oc-sync-codigo" type="text" value="${escHtml(codigoPrecargado)}" placeholder="Código de tu negocio (AMG-XXXX-XXXX)" maxlength="40"
        style="flex:1;min-width:220px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;">
      <button id="oc-sync-activar" class="ir">Activar</button>
    </div>
    <div id="oc-sync-activo" style="display:${salaActiva ? "block" : "none"};">
      <p style="font-size:13px;color:var(--ink-soft);">Código de tu equipo — compártelo con cada celular nuevo UNA sola vez:</p>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <code id="oc-sync-codigo-actual" style="font-size:16px;font-weight:700;background:var(--paper-deep,#E2E8ED);padding:6px 12px;border-radius:6px;">${escHtml(salaActiva || "")}</code>
        <div id="oc-sync-qr" style="margin-top:8px;"></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
        <button id="oc-sync-compartir" class="ir" style="background:#25D366;border-color:#1da851;">Compartir con mi equipo</button>
        <button id="oc-sync-resincronizar">Resincronizar</button>
        <button id="oc-sync-desactivar" style="border-color:var(--rojo);color:var(--rojo);">Desactivar sincronización</button>
      </div>
    </div>
    <p id="oc-sync-msg" style="font-size:13px;margin-top:8px;font-weight:700;"></p>`;
  vista.appendChild(panel);

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
    const codigo = (window.OCSyncControl.salaActiva() || "").trim();
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
  document.getElementById("oc-sync-desactivar").addEventListener("click", () => {
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
      '<p><strong style="color:var(--ink);">Estándares.</strong> Nos guiamos por los principios más exigentes disponibles en Ecuador y a nivel internacional — incluida la UE en lo que aplica sin comprometer la autonomía del usuario sobre sus propios datos: minimización de datos, cifrado de extremo a extremo para la sincronización entre equipos, y descentralización (sin base de datos central de tu negocio).</p>' +
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
          <label style="font-size:13px;">PIN (3 dígitos)<br><span style="font-size:12px;font-weight:400;color:var(--rojo,#a3392a);">Evita repetir el PIN del dueño o del contador — si coinciden, este empleado no podrá entrar.</span><!-- Microcirugia 7 (2026-07-08 · reforzado 2026-07-23): aviso de colisión. El mock no puede verificar contra el PIN del dueño/contador (esos hashes viven en crypto-store). Si colisionan, el miembro queda bloqueado silenciosamente — ahora se avisa en la propia UI de alta. -->
            <span style="display:block;font-size:12px;color:var(--rojo,#a3392a);margin-top:3px;font-weight:400;">
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
              <option value="empleado">Empleado — acceso operativo (ventas, inventario, perchas)</option>
              <option value="admin">Administrador — acceso completo excepto credenciales del dueño</option>
            </select>
            <span style="display:block;font-size:12px;color:var(--ink-soft);margin-top:3px;">
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
          ? `<span style="font-size:11px;font-weight:700;background:#E8A020;color:#fff;padding:2px 7px;border-radius:10px;">Admin</span>`
          : `<span style="font-size:11px;font-weight:700;background:var(--azul-medio,#2c4a68);color:#fff;padding:2px 7px;border-radius:10px;">Empleado</span>`;
        // Admin solo puede editar empleados, no a otros admins (seguridad por capas)
        const puedeEditar = isDueno() || (isAdmin() && u.rol === "empleado");
        tr.innerHTML = `
          <td style="padding:8px;">
            <div style="font-weight:700;">${escHtml(u.nombre)}</div>
            ${u.email ? `<div style="font-size:12px;color:var(--ink-soft);">${escHtml(u.email)}</div>` : ""}
          </td>
          <td style="padding:8px;text-align:center;">${rolBadge}</td>
          <td style="padding:8px;text-align:center;color:${estadoColor};font-weight:700;">${estadoTxt}</td>
          <td style="padding:8px;text-align:right;white-space:nowrap;">
            ${puedeEditar ? `
              <button data-toggle-id="${escHtml(u.id)}" data-activo="${u.activo}"
                style="font-size:12px;padding:5px 10px;border:2px solid ${btnEstColor};
                       border-radius:5px;background:transparent;color:${btnEstColor};cursor:pointer;">
                ${btnEstLabel}
              </button>
              <button data-cambiar-pin="${escHtml(u.id)}"
                style="font-size:12px;padding:5px 10px;border:2px solid var(--azul-medio);
                       border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;margin-left:4px;">
                PIN
              </button>
            ` : `<span style="font-size:12px;color:var(--ink-soft);">Solo dueño</span>`}
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
            if (!r.ok) { const e = await r.json(); alert(e.error || "Error al actualizar."); return; }
            await renderEmpleados();
          } catch (_) { alert("Error de red."); }
        });
      });

      // Bind: mostrar/ocultar fila de cambio de PIN
      tbody.querySelectorAll("[data-cambiar-pin]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = document.getElementById("oc-pin-row-" + btn.dataset.cambiarPin);
          if (row) row.style.display = row.style.display === "none" ? "" : "none";
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
            if (inp) inp.value = "";
            setTimeout(() => renderEmpleados(), 1500);
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
        msgEl.textContent = `${data.rol === "admin" ? "Admin" : "Empleado"} "${data.nombre}" agregado.`;
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
    try{const afPanel=document.createElement("div");afPanel.className="tag-card";afPanel.id="oc-antifraude-panel";afPanel.style.cssText="text-align:left;margin-top:22px;";afPanel.innerHTML=`\n        <h3 class="seccion" style="margin-top:0;">Control anti fraude</h3>\n        <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">Integridad del historial y señales de riesgo del día. Cada movimiento va sellado: si alguien edita o borra el historial en este equipo, aquí se nota.</p>\n        <div id="oc-af-integridad" style="margin-bottom:14px;"></div>\n        <div id="oc-af-senales"></div>\n        <button id="oc-af-refrescar" class="ir" style="margin-top:12px;background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">Verificar ahora</button>\n        <p style="font-size:13px;color:var(--ink-soft);margin:10px 0 0;">El sello detecta manipulación casual del historial. No es a prueba de expertos (el equipo es local), pero deja evidencia de cualquier edición común.</p>`;vista.appendChild(afPanel);async function renderAntiFraude(){const cont=$("oc-af-integridad");if(cont){try{const d=await(await fetch("/api/integridad")).json();if(d.ok){cont.innerHTML=`<div style="padding:10px 12px;border-radius:8px;background:#e7f7ee;border:2px solid #1a6e3c;"><strong style="color:#1a6e3c;">✓ Historial íntegro</strong> <span style="color:#0F1923;font-size:14px;">— ${d.sellados} movimiento(s) sellado(s)${d.historico?", "+d.historico+" histórico(s) sin sello":""}.</span></div>`}else{const det=d.ruptura?`en la posición ${d.ruptura.index} (${escHtml(d.ruptura.tipo)} · ${escHtml(d.ruptura.usuarioNombre)} · ${escHtml(new Date(d.ruptura.fecha).toLocaleString())}) — ${escHtml(d.ruptura.motivo)}`:d.colaOk===false?"se recortó el final del historial":"inconsistencia detectada";cont.innerHTML=`<div style="padding:10px 12px;border-radius:8px;background:#fdecea;border:2px solid #a3392a;"><strong style="color:#a3392a;">⚠ El historial fue alterado</strong> <span style="color:#0F1923;font-size:14px;">— ${det}.</span></div>`}}catch(_){cont.innerHTML=""}}const sen=$("oc-af-senales");if(sen){try{const movs=await(await fetch("/api/actividad")).json();const hoy=(new Date).toISOString().slice(0,10);const delHoy=(Array.isArray(movs)?movs:[]).filter(m=>(m.fecha||"").slice(0,10)===hoy);const anul={},merma={};delHoy.forEach(m=>{const q=m.usuarioNombre||"Sistema";if(m.tipo==="anulacion")anul[q]=(anul[q]||0)+1;if(m.tipo==="ajuste"&&m.detalle&&Number(m.detalle.delta)<0)merma[q]=(merma[q]||0)+Math.abs(Number(m.detalle.delta))});const bloque=(titulo,obj,unidad)=>{const ents=Object.entries(obj);if(!ents.length)return`<p style="font-size:14px;color:var(--ink-soft);margin:6px 0;">${titulo}: sin actividad hoy.</p>`;return`<p style="font-size:14px;font-weight:700;color:var(--ink);margin:10px 0 2px;">${titulo}:</p>`+ents.map(([n,v])=>`<div style="font-size:14px;color:#0F1923;padding:2px 0;">• ${escHtml(n)}: <strong>${v}</strong> ${unidad}</div>`).join("")};sen.innerHTML=bloque("Anulaciones de venta por persona (hoy)",anul,"anulación(es)")+bloque("Unidades bajadas a mano / mermas por persona (hoy)",merma,"unidad(es)")}catch(_){sen.innerHTML=""}}}const btnAF=$("oc-af-refrescar");if(btnAF)btnAF.addEventListener("click",renderAntiFraude);renderAntiFraude();window.addEventListener("oc-login",renderAntiFraude)}catch(e){console.error("Panel anti fraude no cargó (aislado, no rompe Avanzado):",e)}const transfPanel=document.createElement("div");transfPanel.className="tag-card";transfPanel.style.cssText="text-align:left;margin-top:22px;";transfPanel.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Transferencias entre ubicaciones</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">Solicitudes de traspaso de stock entre tus locales.</p>\n      <div id="oc-transf-lista"></div>`;vista.appendChild(transfPanel);renderTransferencias();const syncPanel=document.createElement("div");syncPanel.className="tag-card";syncPanel.style.cssText="text-align:left;margin-top:22px;";const pbUrlActual=localStorage.getItem("OC_PB_URL")||"";const conectado=!!window.OC_PB_CONNECTED;syncPanel.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Sincronización remota (opcional)</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">\n        Por defecto este negocio corre 100% local, sin depender de internet.\n        Solo si quieres recibir actualizaciones desde el panel central, pega\n        aquí la URL de tu PocketBase en Fly.io.\n      </p>\n      <p style="font-size:14px;font-weight:700;margin:8px 0;color:${conectado?"var(--sim-verde-dk)":"var(--ink)"};">\n        Estado: ${conectado?"🟢 Conectado":"⚪ Local (sin sync)"}\n      </p>\n      <input id="oc-pb-url" type="text" placeholder="https://tu-negocio.fly.dev" value="${escHtml(pbUrlActual)}" style="width:100%;max-width:340px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;">\n      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;">\n        <button id="oc-pb-guardar" class="ir" style="background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">Guardar y conectar</button>\n        ${pbUrlActual?`<button id="oc-pb-quitar" class="ir" style="background:transparent;color:var(--rojo);border-color:var(--rojo);">Volver a local</button>`:""}\n      </div>\n      <p id="oc-pb-msg" style="font-size:14px;margin-top:8px;"></p>`;vista.appendChild(syncPanel);$("oc-pb-guardar").addEventListener("click",()=>{const url=$("oc-pb-url").value.trim();if(!url){msg("oc-pb-msg","Pega la URL de tu PocketBase primero.","var(--rojo)");return}localStorage.setItem("OC_PB_URL",url);msg("oc-pb-msg","Guardado. Recargando para conectar...","var(--sim-verde-dk)");setTimeout(()=>window.location.reload(),800)});const btnQuitar=document.getElementById("oc-pb-quitar");if(btnQuitar)btnQuitar.addEventListener("click",()=>{localStorage.removeItem("OC_PB_URL");msg("oc-pb-msg","Sync quitado. Recargando en modo local...","var(--ink)");setTimeout(()=>window.location.reload(),800)});const syncDevPanel=document.createElement("div");syncDevPanel.id="oc-syncdev-panel";syncDevPanel.className="tag-card";syncDevPanel.style.cssText="text-align:left;margin-top:22px;";vista.appendChild(syncDevPanel);pintarSyncDev();window.OCAuth.listo().then(()=>{pintarEmail();pintarWhatsapp()});$("oc-save-codes").addEventListener("click",async()=>{if(window.OCAuth.esDemo&&window.OCAuth.esDemo())return;const o=$("oc-c-owner").value.trim(),e=$("oc-c-emp").value.trim(),a=$("oc-c-acct").value.trim();const valido=s=>/^[0-9]{3}$/.test(s);if(![o,e,a].every(valido)){msg("oc-codes-msg","Cada clave debe ser 3 dígitos (0-9).","var(--rojo)");return}const correoActual=window.OCSecure.leerCorreo();if(!correoActual){msg("oc-codes-msg","Antes de cambiar las claves, registra tu correo de recuperación arriba (si olvidas el código nuevo, sin correo no hay forma de recuperarlo).","var(--rojo)");return}await window.OCSecure.guardarSecreto(o,[e],a,correoActual);$("oc-c-owner").value="";$("oc-c-emp").value="";$("oc-c-acct").value="";msg("oc-codes-msg","Claves guardadas y cifradas.","var(--verde)")});$("oc-descargar-csv").addEventListener("click",async()=>{const u=ubic();const[pl,bal,val]=await Promise.all([fetch(`${API}/reportes/pl?ubicacionId=${u}`).then(r=>r.json()),fetch(`${API}/reportes/balance?ubicacionId=${u}`).then(r=>r.json()),fetch(`${API}/reportes/valorizado?ubicacionId=${u}`).then(r=>r.json())]);const fila=(a,b)=>`"${a}","${b}"`;const filas=[fila("Reporte contable — amigable-123",(new Date).toLocaleString("es-EC")),fila("AVISO","Insumo para el contador. No es una declaración válida ante el SRI."),fila("",""),fila("PÉRDIDAS Y GANANCIAS (hoy)",""),fila("Ventas cobradas (con IVA)",money(pl.ingresosConIva)),fila("IVA cobrado (15%, se liquida al SRI)",money(pl.ivaCobrado)),fila("Ingresos netos (sin IVA)",money(pl.ingresos)),fila("Costo de ventas",money(pl.costoVentas)),fila("Utilidad bruta",money(pl.utilidadBruta)),fila("Gastos operativos",money(pl.gastosOperativos)),fila("Utilidad neta",money(pl.utilidadNeta)),fila("",""),fila("BALANCE SIMPLIFICADO",""),fila("Ingresos del día estimados",money(bal.activos.efectivoEstimado)),fila("Inventario valorizado",money(bal.activos.inventarioValorizado)),fila("Total activos",money(bal.activos.total)),fila("",""),fila("INVENTARIO VALORIZADO POR PRODUCTO",""),fila("Producto","Stock,Costo,Venta,Utilidad potencial"),...val.productos.map(p=>fila(p.nombre,`${p.stockActual},${money(p.valorCosto)},${money(p.valorVenta)},${money(p.utilidadPotencial)}`))];const csv="\ufeff"+filas.join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`reporte-contable-amigable-${(new Date).toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href)});$("oc-exportar").addEventListener("click",async()=>{try{const{apropiada}=await(await fetch(`${API}/instancia`)).json();if(!apropiada){msg("oc-respaldo-msg","Activa este dispositivo (PIN 789) para exportar.","var(--rojo)");return}}catch(_){}try{const datos=await(await fetch(`${API}/respaldo/exportar`)).json();const fotosPerchas=await recolectarFotosPerchasRespaldo();const paquete={schemaVersion:2,fecha:(new Date).toISOString(),datos:datos,oc_secure:(function(){try{const s=JSON.parse(localStorage.getItem("oc_secure"));if(s)delete s.ownerPinR;return s?JSON.stringify(s):null}catch(_){return localStorage.getItem("oc_secure")}})(),fotosPerchas:fotosPerchas};const contenidoPlano=JSON.stringify(paquete);const checksum=await window.OCSecure.hashTexto(contenidoPlano);const clave=prompt("Clave para proteger este respaldo (mínimo 8 caracteres). Déjalo en blanco para exportar sin cifrar:");if(clave===null){if(window.dialogosBloqueados&&window.dialogosBloqueados()){msg("oc-respaldo-msg","Tu navegador bloquea los diálogos (pasa en el navegador de WhatsApp). Abre amigable-123 en Chrome o Safari para exportar con clave.","var(--rojo)");return}msg("oc-respaldo-msg","Exportación cancelada.","var(--ink)");return}let archivoFinal;if(clave&&clave.trim()){const cifrado=await window.OCSecure.cifrarTextoConClave(contenidoPlano,clave.trim());archivoFinal=JSON.stringify({amigableRespaldoCifrado:true,checksum:checksum,...cifrado},null,2)}else{archivoFinal=JSON.stringify({...paquete,checksum:checksum},null,2)}const blob=new Blob([archivoFinal],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`respaldo-amigable-${(new Date).toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);localStorage.setItem("oc_ultimo_export_manual",String(Date.now()));msg("oc-respaldo-msg","Respaldo descargado"+(clave?" y cifrado":"")+". Guárdalo en un lugar seguro.","var(--verde)")}catch(e){msg("oc-respaldo-msg","No se pudo exportar: "+e.message,"var(--rojo)")}});$("oc-importar-file").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{let paquete=JSON.parse(await file.text());if(paquete.amigableRespaldoCifrado){const clave=prompt("Este respaldo está cifrado. Ingresa la clave con la que se exportó:");if(!clave){e.target.value="";return}const texto=await window.OCSecure.descifrarTextoConClave(paquete,clave.trim());if(!texto){msg("oc-respaldo-msg","Clave incorrecta o archivo dañado.","var(--rojo)");e.target.value="";return}const checksumOk=paquete.checksum?await window.OCSecure.hashTexto(texto)===paquete.checksum:true;if(!checksumOk){msg("oc-respaldo-msg","El contenido no coincide con su checksum — el archivo pudo dañarse.","var(--rojo)");e.target.value="";return}paquete=JSON.parse(texto)}else if(paquete.checksum){const{checksum:checksum,...resto}=paquete;const ok=await window.OCSecure.hashTexto(JSON.stringify(resto))===checksum;if(!ok){msg("oc-respaldo-msg","El contenido no coincide con su checksum — el archivo pudo dañarse.","var(--rojo)");e.target.value="";return}}if(!paquete.datos){msg("oc-respaldo-msg","Ese archivo no parece un respaldo de amigable-123.","var(--rojo)");return}if((paquete.schemaVersion||1)>2){msg("oc-respaldo-msg","Este respaldo es de una versión más nueva de amigable-123 que esta pantalla — actualiza la app antes de importarlo.","var(--rojo)");return}if(!confirm("Esto REEMPLAZA todos los datos actuales (productos, ventas, claves) con los del respaldo. ¿Continuar?"))return;const res=await fetch(`${API}/respaldo/importar`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(paquete.datos)});const r=await res.json();if(!res.ok){msg("oc-respaldo-msg",r.error,"var(--rojo)");return}if(paquete.oc_secure)localStorage.setItem("oc_secure",paquete.oc_secure);if(paquete.fotosPerchas)Object.entries(paquete.fotosPerchas).forEach(([k,v])=>{try{localStorage.setItem(k,v)}catch(_){}});window.dispatchEvent(new CustomEvent("oc-datos-importados"));msg("oc-respaldo-msg","Respaldo importado. La pantalla ya muestra los datos restaurados.","var(--verde)")}catch(err){msg("oc-respaldo-msg","No se pudo importar: "+err.message,"var(--rojo)")}e.target.value=""});const CAJA_MAX_SNAPSHOTS=7;const CAJA_INTERVALO_MS=30*60*1e3;const CAJA_ALERTA_DIAS=7;function cajaLeer(){try{return JSON.parse(localStorage.getItem("oc_caja_snapshots")||"[]")}catch{return[]}}function cajaGuardar(lista){try{localStorage.setItem("oc_caja_snapshots",JSON.stringify(lista.slice(-CAJA_MAX_SNAPSHOTS)));return true}catch{return false}}async function cajaGuardarPunto(silencioso){try{const datos=await(await fetch(`${API}/respaldo/exportar`)).json();const contenido=JSON.stringify({fecha:(new Date).toISOString(),datos:datos});const checksum=await window.OCSecure.hashTexto(contenido);const lista=cajaLeer();lista.push({fecha:(new Date).toISOString(),contenido:contenido,checksum:checksum});const guardado=cajaGuardar(lista);if(!silencioso){msg("oc-respaldo-msg",guardado?"Punto de restauración guardado en este navegador.":"No se pudo guardar (¿localStorage lleno? intenta exportar un respaldo manual y libera espacio).",guardado?"var(--verde)":"var(--rojo)")}}catch(_){if(!silencioso)msg("oc-respaldo-msg","No se pudo tomar el punto de restauración.","var(--rojo)")}}async function cajaRestaurar(idx){const lista=cajaLeer();const punto=lista[idx];if(!punto)return;const okChecksum=await window.OCSecure.hashTexto(punto.contenido)===punto.checksum;if(!okChecksum){msg("oc-respaldo-msg","Este punto no pasó la verificación de checksum — puede estar corrupto. No se restauró nada.","var(--rojo)");return}if(!confirm(`Esto REEMPLAZA los datos actuales con el punto del ${new Date(punto.fecha).toLocaleString()}. ¿Continuar?`))return;let paquete;try{paquete=JSON.parse(punto.contenido)}catch{msg("oc-respaldo-msg","El punto está corrupto.","var(--rojo)");return}const res=await fetch(`${API}/respaldo/importar`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(paquete.datos)});if(!res.ok){const r=await res.json();msg("oc-respaldo-msg",r.error||"No se pudo restaurar.","var(--rojo)");return}window.dispatchEvent(new CustomEvent("oc-datos-importados"));msg("oc-respaldo-msg","Restaurado. La pantalla ya muestra los datos del punto elegido.","var(--verde)")}function cajaPintarAlerta(){const ultimo=Number(localStorage.getItem("oc_ultimo_export_manual")||0);const el=$("oc-caja-alerta");if(!el)return;if(!ultimo){el.textContent="⚠️ Todavía no has hecho ningún respaldo manual (el de arriba) — hazlo al menos una vez.";el.style.color="var(--rust)";return}const dias=Math.floor((Date.now()-ultimo)/864e5);if(dias>=CAJA_ALERTA_DIAS){el.textContent=`⚠️ Tu último respaldo manual tiene ${dias} días — considera hacer uno nuevo.`;el.style.color="var(--rust)"}else{el.textContent=`✅ Último respaldo manual: hace ${dias} día(s).`;el.style.color="var(--verde)"}}cajaPintarAlerta();(async()=>{try{if(!navigator.storage||!navigator.storage.estimate)return;const{usage,quota}=await navigator.storage.estimate();if(!quota)return;const pct=Math.round((usage/quota)*100);if(pct<80)return;const aviso=document.createElement("p");aviso.id="oc-storage-aviso";aviso.style.cssText="font-size:14px;font-weight:700;color:var(--rojo,#a3392a);background:#fff5f5;border:2px solid var(--rojo,#a3392a);border-radius:8px;padding:10px 14px;margin:0 0 14px;";aviso.textContent="Espacio al "+pct+"% — considera borrar fotos viejas de perchas o hacer un respaldo desde Checkpoints y luego liberar espacio en tu dispositivo.";const vista=document.getElementById("vista-avanzado");if(vista&&!document.getElementById("oc-storage-aviso"))vista.insertBefore(aviso,vista.firstChild);}catch(_){}})();setInterval(()=>{if(window.OCAuth&&window.OCAuth.rolActual())cajaGuardarPunto(true)},CAJA_INTERVALO_MS);setTimeout(()=>cajaGuardarPunto(true),5e3);$("oc-caja-guardar").addEventListener("click",()=>cajaGuardarPunto(false));$("oc-caja-ver").addEventListener("click",()=>{const cont=$("oc-caja-lista");if(cont.style.display!=="none"){cont.style.display="none";return}const lista=cajaLeer();cont.innerHTML=lista.length?lista.slice().reverse().map((p,i)=>{const idxReal=lista.length-1-i;return`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--azul-suave,#dde5ec);font-size:13px;">\n              <span>${escHtml(new Date(p.fecha).toLocaleString())}</span>\n              <button data-caja-restaurar="${idxReal}" style="font-size:13px;padding:6px 10px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Restaurar</button>\n            </div>`}).join(""):`<p style="font-size:13px;color:var(--ink-soft);">Todavía no hay puntos guardados.</p>`;cont.style.display="block";cont.querySelectorAll("[data-caja-restaurar]").forEach(b=>b.addEventListener("click",()=>cajaRestaurar(Number(b.dataset.cajaRestaurar))))})}async function renderTransferencias(){const cont=$("oc-transf-lista");if(!cont)return;/* Reforzado JFC 2026-07-18: guard de red, sin esto un fallo dejaba la lista muda tras aprobar/rechazar/confirmar */let lista;try{lista=await(await fetch(`${API}/transferencias`)).json()}catch(err){console.error("[renderTransferencias]",err);cont.innerHTML=`<p style="font-size:14px;color:var(--rojo,#a3392a);">No se pudo cargar. Revisa tu conexión e intenta de nuevo.</p>`;return}if(!lista.length){cont.innerHTML=`<p style="font-size:14px;color:var(--ink-soft);">No hay transferencias todavía.</p>`;return}cont.innerHTML=lista.map(t=>{const colorEstado=t.estado==="recibida"?"verde":t.estado==="rechazada"?"rojo":t.estado==="en_transito"?"azul":"amarillo";let acciones="";if(t.estado==="solicitada"){acciones=`<button data-transf-aprobar="${t.id}" style="font-size:13px;padding:6px 10px;border:2px solid var(--verde);border-radius:5px;background:transparent;color:var(--verde);cursor:pointer;">Aprobar</button>\n          <button data-transf-rechazar="${t.id}" style="font-size:13px;padding:6px 10px;border:2px solid var(--rojo);border-radius:5px;background:transparent;color:var(--rojo);cursor:pointer;">Rechazar</button>`}else if(t.estado==="en_transito"){acciones=`<button data-transf-confirmar="${t.id}" style="font-size:13px;padding:6px 10px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Confirmar recepción</button>`}return`<div class="tag-card" style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:8px;flex-wrap:wrap;">\n        <div style="flex:1;min-width:180px;">\n          <strong>${escHtml(t.nombre)}</strong> · ${t.cantidad} un.\n          <div style="font-size:12px;color:var(--ink-soft);">${escHtml(t.desdeNombre)} → ${escHtml(t.haciaNombre)}</div>\n        </div>\n        <span class="badge-estado ${colorEstado}">${t.estado.replace("_"," ")}</span>\n        ${acciones}\n      </div>`}).join("");cont.querySelectorAll("[data-transf-aprobar]").forEach(btn=>btn.addEventListener("click",async()=>{const res=await fetch(`${API}/transferencias/${btn.dataset.transfAprobar}/aprobar`,{method:"POST"});const r=await res.json();if(!res.ok){alert(r.error);return}renderTransferencias()}));cont.querySelectorAll("[data-transf-rechazar]").forEach(btn=>btn.addEventListener("click",async()=>{await fetch(`${API}/transferencias/${btn.dataset.transfRechazar}/rechazar`,{method:"POST"});renderTransferencias()}));cont.querySelectorAll("[data-transf-confirmar]").forEach(btn=>btn.addEventListener("click",async()=>{let res,r;try{res=await fetch(`${API}/transferencias/${btn.dataset.transfConfirmar}/confirmar-recepcion`,{method:"POST"});r=await res.json()}catch(err){console.error("[transf-confirmar]",err);alert("No se pudo conectar con el servidor. Intenta de nuevo.");return}if(!res.ok){alert(r.error);return}renderTransferencias();cargarInventario()}))}function pintarWhatsapp(){const wa=window.OCSecure.leerWhatsapp();const row=$("oc-whatsapp-row");row.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;"><input id="oc-whatsapp-in" type="tel" inputmode="tel" placeholder="+593 99 123 4567" value="${escHtml(wa)}" style="flex:1;min-width:200px;padding:10px;border:2px solid var(--azul-medio);border-radius:5px;font-family:var(--font-mono);"><button id="oc-whatsapp-save" class="ir" style="background:var(--rust);color:var(--blanco-calido);border-color:var(--rust-deep);">Guardar</button></div><p style="font-size:13px;color:var(--ink-soft);margin-top:6px;">Incluye el código de país (ej. +593) para que el número funcione como link.</p><p id="oc-whatsapp-msg" style="font-size:14px;margin-top:8px;"></p>`;$("oc-whatsapp-save").addEventListener("click",async()=>{if(window.OCAuth.esDemo&&window.OCAuth.esDemo())return;const v=$("oc-whatsapp-in").value.trim();if(v&&!/^\+?[0-9 ()-]{7,20}$/.test(v)){msg("oc-whatsapp-msg","Numero de telefono invalido.","var(--rojo)");return}const waOk=window.OCSecure.actualizarWhatsapp(v);if(!waOk){msg("oc-whatsapp-msg","No se pudo guardar (error de almacenamiento).","var(--rojo)");return;}msg("oc-whatsapp-msg","Guardado.","var(--verde)");try{const url=window.OCAuth.workerUrl();let owned={};try{owned=JSON.parse(localStorage.getItem("amigable_owned")||"null")||{}}catch(_){}if(url&&owned.instanceId){fetch(url.replace(/\/+$/,"")+"/checkin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({instanceId:owned.instanceId,licenseCode:owned.licenseCode||"",email:window.OCSecure.leerCorreo()||"",whatsapp:v,accion:"update",producto:"amigable"})}).catch(()=>{})}}catch(_){}})}function pintarEmail(){const email=window.OCSecure.leerCorreo();const row=$("oc-email-row");if(email){row.innerHTML=`<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">\n        <span style="font-family:var(--font-mono);font-size:15px;color:var(--ink);">${window.OCAuth.enmascarar(email)}</span>\n        <button id="oc-email-edit" style="font-size:13px;padding:8px 12px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Cambiar (requiere código maestro)</button></div>`;$("oc-email-edit").addEventListener("click",pedirMaestroYCambiarCorreo)}else{row.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;">\n        <input id="oc-email-in" type="email" placeholder="correo@dominio.com" style="flex:1;min-width:200px;padding:10px;border:2px solid var(--azul-medio);border-radius:5px;font-family:var(--font-mono);">\n        <button id="oc-email-save" class="ir" style="background:var(--rust);color:var(--blanco-calido);border-color:var(--rust-deep);">Guardar</button></div>\n        <p id="oc-email-msg" style="font-size:14px;margin-top:8px;"></p>`;$("oc-email-save").addEventListener("click",()=>{if(window.OCAuth.esDemo&&window.OCAuth.esDemo())return;const v=$("oc-email-in").value.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){msg("oc-email-msg","Correo no válido.","var(--rojo)");return}window.OCSecure.actualizarCorreo(v);pintarEmail();if(reasignacionViaMaestro){reasignacionViaMaestro=false;window.OCAuth.abrirFlujoReset(v)}})}}function pedirMaestroYCambiarCorreo(){const cont=document.createElement("div");cont.className="oc-subgate";cont.innerHTML=`<div class="caja" style="background:var(--blanco-calido);border:2px solid var(--brass);border-radius:8px;padding:26px 22px;max-width:420px;width:100%;text-align:center;">\n      <h2 style="font-family:var(--font-display);color:var(--ink);font-size:20px;margin:0 0 4px;">Código maestro</h2>\n      <p style="font-size:14px;color:var(--ink-soft);margin-bottom:14px;">Solo JFC lo tiene. Identifica al dueño en persona o videollamada antes de dárselo.</p>\n      <input id="mst-codigo" type="text" style="width:100%;padding:10px;border:2px solid var(--azul-medio);border-radius:5px;font-family:var(--font-mono);text-align:center;">\n      <div style="display:flex;gap:8px;margin-top:12px;">\n        <button id="mst-cancelar" style="flex:1;padding:10px;border-radius:6px;border:2px solid var(--azul-medio);background:transparent;color:var(--azul-medio);cursor:pointer;">Cancelar</button>\n        <button id="mst-ok" class="ir" style="flex:1;">Verificar</button>\n      </div>\n      <p id="mst-msg" style="font-size:14px;margin-top:10px;font-weight:700;color:var(--rojo);"></p>\n    </div>`;document.body.appendChild(cont);cont.querySelector("#mst-cancelar").addEventListener("click",()=>cont.remove());cont.querySelector("#mst-ok").addEventListener("click",async()=>{const codigo=cont.querySelector("#mst-codigo").value.trim();const ok=await window.OCSecure.verificarMaestro(codigo);if(!ok){cont.querySelector("#mst-msg").textContent="Código maestro incorrecto.";return}window.OCSecure.actualizarCorreo("");reasignacionViaMaestro=true;cont.remove();pintarEmail()})}function msg(id,txt,color){const el=$(id);if(el){el.style.color=color;el.textContent=txt}}function pintarSyncDev(){const box=$("oc-syncdev-panel");if(!box)return;const activo=OCSync.activa();const necesitaPin=OCSync.requiereReactivar();const pend=OCSync.pendientes();box.innerHTML=`\n      <h3 class="seccion" style="margin-top:0;">Sincronización entre dispositivos</h3>\n      <p style="font-size:14px;color:var(--ink-soft);margin-top:0;">\n        Para cuando el mismo negocio corre en más de un celular/tablet (ej. caja y bodega).\n        Cada dispositivo cifra sus propios cambios con tu PIN de dueño — ni siquiera el\n        servidor de sincronización puede leerlos.\n      </p>\n      <p style="font-size:14px;font-weight:700;margin:8px 0;color:${activo&&!necesitaPin?"var(--sim-verde-dk)":"var(--ink)"};">\n        Estado: ${!activo?"⚪ Desactivada":necesitaPin?"🟡 Activada, pero pide tu PIN de nuevo en este navegador":"🟢 Activada"}\n        ${activo&&!necesitaPin&&pend?` · ${pend} cambio(s) sin enviar`:""}\n      </p>\n      <p id="oc-syncdev-msg" style="font-size:14px;font-weight:700;margin-bottom:10px;"></p>\n      ${!activo||necesitaPin?`\n        <button id="oc-syncdev-activar" class="ir" style="background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">${necesitaPin?"Ingresar PIN para reactivar":"Activar en este dispositivo (pide tu PIN)"}</button>\n      `:`\n        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">\n          <button id="oc-syncdev-push" class="ir" style="background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">🔄 Sync automático (Fly.io)</button>\n          <button id="oc-syncdev-copiar" class="ir" style="background:var(--rust);color:var(--blanco-calido);border-color:var(--rust-deep);">📋 Copiar cambios para enviar</button>\n          <button id="oc-syncdev-wa-cambios" class="ir" style="background:#25D366;color:#0a3d20;border-color:#1da851;">📲 Cambios recientes → WhatsApp</button>\n          <button id="oc-syncdev-wa-respaldo" class="ir" style="background:#128C7E;color:#e8fff7;border-color:#0c6b60;">📲 Respaldo completo → WhatsApp</button>\n          <button id="oc-syncdev-qr-mostrar" class="ir" style="background:var(--azul-oscuro);color:var(--blanco-calido);border-color:var(--brass);">📱 Mostrar QR de cambios</button>\n          <button id="oc-syncdev-qr-escanear" class="ir" style="background:var(--azul-oscuro);color:var(--blanco-calido);border-color:var(--brass);">📷 Escanear QR del otro equipo</button>\n          <button id="oc-syncdev-off" style="font-size:13px;padding:8px 12px;border:2px solid var(--rojo);border-radius:5px;background:transparent;color:var(--rojo);cursor:pointer;">Desactivar</button>\n        </div>\n        <div id="oc-syncdev-qr-zona" style="display:none;margin:10px 0;text-align:center;"></div>\n        <details><summary style="font-size:14px;cursor:pointer;color:var(--azul-medio);">Pegar cambios recibidos de otro dispositivo</summary>\n          <textarea id="oc-syncdev-pegar" rows="3" placeholder="Pega aquí el texto que empieza con OCSYNC1:..." style="width:100%;margin-top:8px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;font-family:var(--font-mono);font-size:12px;"></textarea>\n          <button id="oc-syncdev-importar" class="ir" style="margin-top:8px;background:var(--azul-medio);color:var(--blanco-calido);border-color:var(--azul-oscuro);">Importar</button>\n        </details>\n      `}`;const btnActivar=$("oc-syncdev-activar");if(btnActivar)btnActivar.addEventListener("click",async()=>{const pin=prompt("PIN del dueño (3 dígitos) para activar sincronización en este dispositivo:");if(pin===null)return;const ok=await OCSync.activar(pin.trim());msg("oc-syncdev-msg",ok?"Sincronización activada en este dispositivo.":"PIN incorrecto.",ok?"var(--verde)":"var(--rojo)");pintarSyncDev()});const btnPush=$("oc-syncdev-push");if(btnPush)btnPush.addEventListener("click",async()=>{msg("oc-syncdev-msg","Enviando y recibiendo...","var(--ink)");const rPush=await OCSync.push();const rPull=await OCSync.pull();if(rPush.ok&&rPull.ok)msg("oc-syncdev-msg",`Listo. Enviados: ${rPush.enviado||0} · Recibidos: ${rPull.recibido||0}.`,"var(--verde)");else msg("oc-syncdev-msg",(rPush.motivo||rPull.motivo)+' Mientras tanto, usa "Copiar cambios".',"var(--rojo)");pintarSyncDev()});const btnCopiar=$("oc-syncdev-copiar");if(btnCopiar)btnCopiar.addEventListener("click",async()=>{const texto=await OCSync.generarPaqueteManual();if(!texto){msg("oc-syncdev-msg","No hay cambios pendientes en este dispositivo.","var(--ink)");return}try{await navigator.clipboard.writeText(texto);msg("oc-syncdev-msg","Copiado. Envíalo por WhatsApp u otro medio al otro dispositivo.","var(--verde)")}catch(_){prompt("Copia este texto manualmente:",texto)}pintarSyncDev()});const btnWaCambios=$("oc-syncdev-wa-cambios");if(btnWaCambios)btnWaCambios.addEventListener("click",async()=>{const texto=await OCSync.generarPaqueteManual();if(!texto){msg("oc-syncdev-msg","No hay cambios pendientes en este dispositivo.","var(--ink)");return}const mensaje="amigable-123 — cambios para sincronizar. Pega esto en el otro equipo (Avanzado → Pegar cambios):\n\n"+texto;if(navigator.share){try{await navigator.share({text:mensaje});msg("oc-syncdev-msg","Compartido. En el otro equipo: Avanzado → Pegar cambios.","var(--verde)");return}catch(_){}}if(mensaje.length<1500){window.open("https://wa.me/?text="+encodeURIComponent(mensaje),"_blank");msg("oc-syncdev-msg","Abrí WhatsApp con los cambios listos para enviar.","var(--verde)");return}try{await navigator.clipboard.writeText(texto);msg("oc-syncdev-msg","Son muchos cambios para un enlace directo. Los copié — pégalos tú en WhatsApp.","var(--verde)")}catch(_){prompt("Copia este texto y envíalo por WhatsApp:",texto)}});const btnWaResp=$("oc-syncdev-wa-respaldo");if(btnWaResp)btnWaResp.addEventListener("click",async()=>{try{const datos=await(await fetch(`${API}/respaldo/exportar`)).json();const fotosPerchas=await recolectarFotosPerchasRespaldo();const paquete={schemaVersion:2,fecha:(new Date).toISOString(),datos:datos,oc_secure:(function(){try{const s=JSON.parse(localStorage.getItem("oc_secure"));if(s)delete s.ownerPinR;return s?JSON.stringify(s):null}catch(_){return localStorage.getItem("oc_secure")}})(),fotosPerchas:fotosPerchas};const contenidoPlano=JSON.stringify(paquete);const checksum=await window.OCSecure.hashTexto(contenidoPlano);const clave=prompt("Clave para cifrar el respaldo antes de mandarlo por WhatsApp (mínimo 8 caracteres). Es obligatoria: este archivo contiene tus claves.");if(clave===null){msg("oc-syncdev-msg","Envío cancelado.","var(--ink)");return}if(!clave.trim()||clave.trim().length<8){msg("oc-syncdev-msg","Necesitas una clave de al menos 8 caracteres para enviar por WhatsApp (el archivo lleva tus claves). Envío cancelado.","var(--rojo)");return}const cif=await window.OCSecure.cifrarTextoConClave(contenidoPlano,clave.trim());const archivoFinal=JSON.stringify({amigableRespaldoCifrado:true,checksum:checksum,...cif},null,2);const nombre=`respaldo-amigable-${(new Date).toISOString().slice(0,10)}.json`;const file=new File([archivoFinal],nombre,{type:"application/json"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"Respaldo amigable-123",text:"Respaldo de mi negocio (amigable-123)."});msg("oc-syncdev-msg","Respaldo compartido. En el otro equipo: Avanzado → Importar respaldo.","var(--verde)")}else{const a=document.createElement("a");a.href=URL.createObjectURL(file);a.download=nombre;a.click();URL.revokeObjectURL(a.href);msg("oc-syncdev-msg","Tu navegador no comparte archivos directo. Lo descargué — adjúntalo tú en WhatsApp.","var(--ink)")}}catch(e){msg("oc-syncdev-msg","No se pudo preparar el respaldo: "+e.message,"var(--rojo)")}});const btnImportar=$("oc-syncdev-importar");if(btnImportar)btnImportar.addEventListener("click",async()=>{const texto=$("oc-syncdev-pegar").value;const r=await OCSync.importarPaqueteManual(texto);msg("oc-syncdev-msg",r.ok?`Importado. ${r.recibido||0} cambio(s) aplicados.`:r.motivo,r.ok?"var(--verde)":"var(--rojo)");if(r.ok)$("oc-syncdev-pegar").value=""});const btnOff=$("oc-syncdev-off");if(btnOff)btnOff.addEventListener("click",()=>{if(!confirm("¿Desactivar sincronización en este dispositivo?"))return;OCSync.desactivar();pintarSyncDev()});const QR_CHUNK=700;function qrLib(){return window.qrcode||null}async function mostrarQRCambios(){const zona=$("oc-syncdev-qr-zona");if(zona.style.display!=="none"){zona.style.display="none";zona.innerHTML="";return}if(!qrLib()){msg("oc-syncdev-msg","El generador QR local no cargó (qrcode-local.js).","var(--rojo)");return}const texto=await OCSync.generarPaqueteManual();if(!texto){msg("oc-syncdev-msg","No hay cambios pendientes en este dispositivo.","var(--ink)");return}const sesion=Math.random().toString(36).slice(2,6);const total=Math.ceil(texto.length/QR_CHUNK);if(total>12){msg("oc-syncdev-msg",`Son demasiados cambios para QR (${total} códigos). Usa "Copiar cambios" y pégalo en el otro equipo — misma seguridad.`,"var(--rojo)");return}let html=`<p style="font-size:14px;font-weight:700;color:var(--ink);">Escanea ${total>1?"los "+total+" códigos, en cualquier orden,":"este código"} desde el otro equipo (Avanzado → Escanear QR):</p>`;for(let i=0;i<total;i++){const frag="OCQ|"+sesion+"|"+(i+1)+"|"+total+"|"+texto.slice(i*QR_CHUNK,(i+1)*QR_CHUNK);const q=qrLib()(0,"M");q.addData(frag);q.make();html+=`<div style="display:inline-block;background:#FFFFFF;padding:10px;border:2px solid var(--sim-plata,#C4CDD8);border-radius:8px;margin:6px;"><img src="${q.createDataURL(4,8)}" alt="QR ${i+1} de ${total}" style="display:block;max-width:240px;width:100%;image-rendering:pixelated;"><span style="font-family:var(--font-mono);font-size:13px;color:#0F1923;">${i+1} / ${total}</span></div>`}zona.innerHTML=html;zona.style.display="block";msg("oc-syncdev-msg","QR listos. Los cambios NO se borran de aquí hasta que el otro equipo los importe (dedup por operación: escanear dos veces no duplica).","var(--verde)")}let escaneoActivo=null;function detenerEscaneo(){if(!escaneoActivo)return;clearInterval(escaneoActivo.timer);escaneoActivo.stream.getTracks().forEach(t=>t.stop());const ov=$("oc-syncdev-qr-overlay");if(ov)ov.remove();escaneoActivo=null}window.addEventListener("pagehide",detenerEscaneo);document.addEventListener("visibilitychange",()=>{if(document.hidden)detenerEscaneo()});async function escanearQRCambios(){if(!("BarcodeDetector"in window)){msg("oc-syncdev-msg",'Este navegador no puede escanear QR (típico en iPhone). Usa "Copiar cambios" y pégalo en el otro equipo — misma seguridad.',"var(--rojo)");return}if(!window.OCSecure.syncActiva()){msg("oc-syncdev-msg","Primero activa la sincronización con tu PIN.","var(--rojo)");return}let stream;try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})}catch(_){msg("oc-syncdev-msg","No se pudo abrir la cámara (¿permiso denegado?).","var(--rojo)");return}const ov=document.createElement("div");ov.id="oc-syncdev-qr-overlay";ov.style.cssText="position:fixed;inset:0;z-index:10001;background:#0F1923;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;";ov.innerHTML=`\n        <video autoplay playsinline style="width:100%;max-width:420px;border-radius:10px;border:3px solid #5294AC;"></video>\n        <p id="oc-qr-progreso" style="color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-size:17px;font-weight:700;margin:0;">Apunta al QR del otro equipo…</p>\n        <button id="oc-qr-cerrar" style="min-height:44px;padding:10px 22px;border-radius:8px;border:2px solid #5294AC;background:transparent;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-size:16px;font-weight:700;cursor:pointer;">Cancelar</button>`;document.body.appendChild(ov);const video=ov.querySelector("video");video.srcObject=stream;const detector=new BarcodeDetector({formats:["qr_code"]});const frags={};let sesion=null,total=0;const timer=setInterval(async()=>{try{const codes=await detector.detect(video);for(const c of codes){const v=String(c.rawValue||"");if(v.indexOf("OCQ|")!==0)continue;const[,ses,iStr,nStr]=v.split("|",4);const pedazo=v.split("|").slice(4).join("|");if(sesion&&ses!==sesion)continue;sesion=sesion||ses;total=Number(nStr)||0;frags[Number(iStr)]=pedazo;const tengo=Object.keys(frags).length;$("oc-qr-progreso").textContent=`Leídos ${tengo} de ${total}…`;if(total>0&&tengo>=total){detenerEscaneo();let texto="";for(let i=1;i<=total;i++)texto+=frags[i];const r=await OCSync.importarPaqueteManual(texto);msg("oc-syncdev-msg",r.ok?`Importado por QR: ${r.recibido||0} cambio(s) aplicados.`:r.motivo,r.ok?"var(--verde)":"var(--rojo)");return}}}catch(_){}},300);escaneoActivo={stream:stream,timer:timer};$("oc-qr-cerrar").addEventListener("click",detenerEscaneo)}const btnQRMostrar=$("oc-syncdev-qr-mostrar");if(btnQRMostrar)btnQRMostrar.addEventListener("click",mostrarQRCambios);const btnQREscanear=$("oc-syncdev-qr-escanear");if(btnQREscanear)btnQREscanear.addEventListener("click",escanearQRCambios)}async function render(){const u=ubic();/* Reforzado JFC 2026-07-18: guard de red — sin esto el panel contable quedaba visible pero vacio tras desbloquear con PIN */let pl,bal;try{[pl,bal]=await Promise.all([fetch(`${API}/reportes/pl?ubicacionId=${u}`).then(r=>r.json()),fetch(`${API}/reportes/balance?ubicacionId=${u}`).then(r=>r.json())])}catch(err){console.error("[render/oc-taccounts]",err);$("oc-taccounts").innerHTML=`<p style="color:var(--rojo,#a3392a);font-size:14px;">No se pudo cargar. Revisa tu conexión e intenta de nuevo.</p>`;return}const cuentas=[{nombre:"Caja (Activo)",debe:[["Cobrado hoy (con IVA)",pl.ingresosConIva]],haber:[["Gastos operativos",pl.gastosOperativos]]},{nombre:"Ventas (Ingreso)",debe:[],haber:[["Ingresos netos del día",pl.ingresos]]},{nombre:"IVA por Pagar (Pasivo)",debe:[],haber:[["IVA cobrado hoy (15%)",pl.ivaCobrado]]},{nombre:"Costo de Ventas (Gasto)",debe:[["Costo de lo vendido",pl.costoVentas]],haber:[]},{nombre:"Inventario (Activo)",debe:[["Saldo valorizado",bal.activos.inventarioValorizado]],haber:[["Salida por ventas",pl.costoVentas]]},{nombre:"Gastos Operativos (Gasto)",debe:[["Prorrateo del día",pl.gastosOperativos]],haber:[]}];$("oc-taccounts").innerHTML=cuentas.map(tAccount).join("");await renderChart()}async function renderChart(){const box=$("oc-chart");if(!box)return;/* Reforzado JFC 2026-07-18: guard de red para el grafico de comisiones */let filas;try{filas=await(await fetch(`${API}/liquidaciones`)).json()}catch(err){console.error("[renderChart]",err);box.innerHTML=`<p style="font-size:14px;color:var(--rojo,#a3392a);">No se pudo cargar. Revisa tu conexión e intenta de nuevo.</p>`;return}if(!filas.length){box.innerHTML=`<p style="font-size:14px;color:var(--ink-soft);">Sin ubicaciones tipo socio/franquicia/consignación todavía.</p>`;return}const maxCumplimiento=Math.max(100,...filas.map(f=>f.cumplimientoMeta||0));box.innerHTML=filas.map(f=>{const comisionEfectivaPct=f.ventasBrutas>0?f.comisionSocio/f.ventasBrutas*100:0;const anchoMeta=Math.min(100,(f.cumplimientoMeta||0)/maxCumplimiento*100);return`\n      <div style="margin-bottom:16px;">\n        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">\n          <strong>${escHtml(f.ubicacion)}</strong>\n          <span style="color:var(--ink-soft);">${fmtVentas(f.ventasBrutas)} vendido · ${f.cumplimientoMeta??0}% de meta</span>\n        </div>\n        <div style="background:var(--sim-azul-bg,#D4ECF5);border-radius:6px;overflow:hidden;height:22px;position:relative;">\n          <div style="background:${(f.cumplimientoMeta||0)>=100?"var(--sim-verde,#00C87A)":"var(--sim-azul,#5294AC)"};height:100%;width:${anchoMeta}%;transition:width .3s;"></div>\n        </div>\n        <div style="font-size:12px;color:var(--ink-soft);margin-top:3px;">Comisión efectiva pagada: ${comisionEfectivaPct.toFixed(1)}% (${money(f.comisionSocio)})</div>\n      </div>`}).join("")}function fmtVentas(n){return"$"+Number(n||0).toFixed(2)}function tAccount(c){const filas=Math.max(c.debe.length,c.haber.length,1);let rows="";for(let i=0;i<filas;i++){const d=c.debe[i],h=c.haber[i];rows+=`<tr>\n        <td style="width:50%;padding:4px 6px;font-size:13px;border-right:1.5px solid var(--sim-azul);">${d?d[0]+" "+money(d[1]):""}</td>\n        <td style="width:50%;padding:4px 6px;font-size:13px;">${h?h[0]+" "+money(h[1]):""}</td></tr>`}return`<div class="tag-card" style="padding:12px;border-left:3px solid var(--sim-azul);">\n      <div style="font-family:var(--font-display);font-weight:700;font-size:14px;text-align:center;color:var(--sim-azul-dk);border-bottom:2px solid var(--sim-azul);padding-bottom:6px;margin-bottom:4px;">${escHtml(c.nombre)}</div>\n      <table style="width:100%;border-collapse:collapse;">\n        <tr>\n          <th style="font-size:11px;color:var(--sim-azul);border-right:1.5px solid var(--sim-azul);border-bottom:1px solid var(--sim-azul);">DEBE</th>\n          <th style="font-size:11px;color:var(--sim-azul);border-bottom:1px solid var(--sim-azul);">HABER</th>\n        </tr>\n        ${rows}\n      </table></div>`}document.addEventListener("change",e=>{if(e.target&&e.target.id==="selectUbicacion"&&desbloqueadaSesion&&$("oc-contable")&&$("oc-contable").style.display!=="none")render()});window.addEventListener("oc-login",e=>{if(!e.detail||e.detail.rol!=="contador")return;if(document.querySelector('nav button[data-vista="contable"]'))return;try{initSeguro()}catch(_){}const navEl=document.querySelector("nav");const btn=document.createElement("button");btn.dataset.vista="contable";btn.innerHTML="<span>Contable</span>";if(navEl)navEl.appendChild(btn);const main=document.querySelector("main");const sec=document.createElement("section");sec.id="vista-contable";sec.className="vista";if(main)main.appendChild(sec);const lock=$("oc-acct-lock");if(lock)lock.style.display="none";const contEl=$("oc-contable");if(contEl){sec.appendChild(contEl);contEl.style.display="block"}btn.addEventListener("click",()=>{document.querySelectorAll("nav button").forEach(b=>b.classList.remove("activo"));btn.classList.add("activo");document.querySelectorAll(".vista").forEach(v=>v.classList.remove("activa"));sec.classList.add("activa")});btn.classList.add("activo");document.querySelectorAll(".vista").forEach(v=>v.classList.remove("activa"));sec.classList.add("activa");render()});function initSeguro(){try{init()}catch(e){console.error("Avanzado init falló (aislado):",e)}}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initSeguro);else initSeguro()})();