(function(){try{window.__amgRev="amg-a7-2m8z5r"}catch(_){}const EMOJI_POOL=["💼","📊","📋","📁","🗂️","📌","📎","📝","🖊️","✏️","🔑","🔒","💰","📦","🏷️","⚖️","🔍","🖨️","📞","📱","🏢","💡","⏰","📅","🗓️","💳"];function barajar(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}let rol=null;const DEMO_PIN="456";const ACTIVATION_PIN="789";function dispositivoApropiado(){try{return!!(JSON.parse(localStorage.getItem("amigable_owned")||"null")||{}).instanceId}catch(_){return false}}function generarCodigoAMG(){var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";var seg=function(){return Array.from({length:4},function(){return chars[Math.floor(Math.random()*chars.length)]}).join("")};return"AMG-"+seg()+"-"+seg()+"-"+seg()}var _amgEp="=YXZk5ycyV2ay92du8WawJXYjZmauMXYpNmblNWas1SZsJWYnlWbh9yL6MHc0RHa";var CF_WORKER_URL_DEFAULT=function(){try{return atob(_amgEp.split("").reverse().join(""))}catch(_){return""}}();/* NO CLOUD (JFC, regla dura, ver PRIVACY.md): esta funcion es EL UNICO lugar del codigo con permiso de mandar datos fuera del dispositivo, y SOLO estos campos: instanceId, licenseCode, email/nombre/apellido/cedula/whatsapp (todos opcionales, solo si el dueno los ingreso), y la accion (register/login/update). JAMAS productos, ventas, clientes, inventario, ni nada de negocio. Ver worker.js para el lado servidor de esta regla. */async function enviarHeartbeatLicencia(datos){try{var url=(localStorage.getItem("amigable_cf_worker_url")||"").trim()||CF_WORKER_URL_DEFAULT;if(!url)return;var corta=function(v,max){if(v==null)return v;var s=String(v);return s.length>max?s.slice(0,max):s};var limpio={instanceId:corta(datos.instanceId,100),licenseCode:corta(datos.licenseCode,40),email:corta(datos.email,160),nombre:corta(datos.nombre,120),apellido:corta(datos.apellido,120),cedula:corta(datos.cedula,40),activatedAt:datos.activatedAt,accion:corta(datos.accion,30)};var ctrl=new AbortController;var t=setTimeout(function(){ctrl.abort()},8e3);var res;try{res=await fetch(url.replace(/\/+$/,"")+"/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(limpio),signal:ctrl.signal})}finally{clearTimeout(t)}try{if(res&&res.ok){var r=await res.json();if(r&&typeof r.estado==="string"&&/^[a-z]{2,20}$/.test(r.estado)){var owned=JSON.parse(localStorage.getItem("amigable_owned")||"null")||{};owned.licenseEstado=r.estado;owned.licenseEstadoAt=Date.now();var payload=JSON.stringify(owned);try{localStorage.setItem("amigable_owned",payload)}catch(_){try{var rm2=[];for(var ii=0;ii<localStorage.length;ii++){var kk=localStorage.key(ii);if(kk&&kk.indexOf("vp_foto_percha_")===0)rm2.push(kk)}rm2.forEach(function(k2){try{localStorage.removeItem(k2)}catch(_){}});localStorage.setItem("amigable_owned",payload)}catch(_){}}}}}catch(_){}}catch(_){}}let demoSesion=false;let listo=window.OCSecure.migrarSiHaceFalta();const BLOQUEO_TRAS_INTENTOS=8;const BLOQUEO_DURACION_MS=60*1e3;function leerIntentos(){try{return JSON.parse(sessionStorage.getItem("oc_intentos"))||{fallos:0,bloqueadoHasta:0}}catch{return{fallos:0,bloqueadoHasta:0}}}function guardarIntentos(x){sessionStorage.setItem("oc_intentos",JSON.stringify(x))}function registrarFallo(){const st=leerIntentos();st.fallos+=1;if(st.fallos>=BLOQUEO_TRAS_INTENTOS){st.bloqueadoHasta=Date.now()+BLOQUEO_DURACION_MS;st.fallos=0}guardarIntentos(st)}function registrarExito(){sessionStorage.removeItem("oc_intentos")}function msRestantesBloqueo(){const st=leerIntentos();return Math.max(0,st.bloqueadoHasta-Date.now())}const css=document.createElement("style");css.textContent=`\n  #oc-gate{position:fixed;inset:0;z-index:9999;background:var(--azul-oscuro,#1c3049);\n    display:flex;align-items:center;justify-content:center;padding:20px;\n    overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;overscroll-behavior-y:contain;}\n  #oc-gate .caja{background:var(--blanco-calido,#fbf5e8);border:2px solid var(--brass,#9c7a35);\n    border-radius:8px;padding:26px 22px;max-width:420px;width:100%;text-align:center;\n    margin:auto;flex:0 0 auto;}\n  #oc-gate h2{font-family:var(--font-display,sans-serif);color:var(--ink,#211c14);font-size:22px;margin:0 0 4px;}\n  #oc-gate .sub{font-size:14px;color:var(--ink-soft,#5d5340);margin-bottom:18px;}\n  .oc-slots{display:flex;gap:10px;justify-content:center;margin-bottom:16px;}\n  .oc-slots .slot{width:58px;height:58px;border:2px solid var(--azul-medio,#2c4a68);border-radius:6px;\n    display:flex;align-items:center;justify-content:center;font-size:26px;background:var(--crema,#f3e8cd);color:var(--ink,#211c14);}\n  .oc-slots .slot.lleno{border-color:var(--rust,#b2461f);}\n  .oc-pad{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}\n  .oc-pad button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;\n    padding:8px 4px;border:2px solid var(--ink,#211c14);border-radius:6px;background:var(--crema,#f3e8cd);\n    cursor:pointer;min-height:54px;}\n  .oc-pad button .dig{font-family:var(--font-display,sans-serif);font-weight:700;font-size:20px;color:var(--ink,#211c14);line-height:1;}\n  .oc-pad button .emo{font-size:13px;line-height:1;}\n  .oc-pad button:active{transform:translateY(1px);}\n  /* FIX 2026-07-07 (JFC: "se agrandan y arruinan todo"): digitar rapido el PIN\n     disparaba el double-tap zoom de iOS. touch-action:manipulation lo elimina\n     sin tocar el pinch-zoom de accesibilidad. */\n  #oc-gate button, .oc-subgate button{touch-action:manipulation;}\n  .oc-acciones{display:flex;gap:8px;margin-top:14px;}\n  .oc-acciones button{flex:1;font-family:var(--font-display,sans-serif);font-size:14px;padding:12px;\n    border-radius:6px;border:2px solid var(--azul-medio,#2c4a68);background:var(--blanco-calido,#fbf5e8);\n    color:var(--azul-medio,#2c4a68);cursor:pointer;min-height:44px;text-transform:uppercase;}\n  .oc-msg{min-height:20px;font-size:14px;font-weight:700;color:var(--rojo,#a3392a);margin-top:12px;}\n  #oc-gate.err .caja,.oc-subgate.err .caja{animation:ocshake .35s;}\n  @keyframes ocshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}\n  #oc-logout{font-family:var(--font-display,sans-serif);font-size:13px;padding:8px 12px;border-radius:5px;\n    border:2px solid var(--brass,#9c7a35);background:transparent;color:var(--blanco-calido,#fbf5e8);\n    cursor:pointer;text-transform:uppercase;}\n  /* FIX 2026-07-02: la vista se renombró de "liquidaciones" a "comisiones";\n     este selector seguía apuntando al data-vista viejo y el EMPLEADO veía el\n     botón Comisiones (datos financieros del dueño). Mantener sincronizado con\n     el data-vista del nav en index.html. */\n  body.rol-empleado nav button[data-vista="avanzado"],\n  body.rol-empleado nav button[data-vista="comisiones"]{display:none!important;}\n  /* Rol ADMIN (2026-07-22): puede ver avanzado pero NO cambiar clave/correo del dueno */\n  body.rol-admin #oc-c-owner{display:none!important;}\n  body.rol-admin #oc-email-edit,body.rol-admin #oc-email-save,body.rol-admin #oc-email-in{display:none!important;}\n  /* Rol CONTADOR (PIN 357 directo en el gate): solo ve la vista contable de solo lectura,\n     sin POS/inventario/clientes ni exportar/importar respaldo o caja fuerte local. */\n  body.rol-contador nav button:not([data-vista="contable"]){display:none!important;}\n  body.rol-contador #oc-exportar,\n  body.rol-contador label:has(#oc-importar-file),\n  body.rol-contador #oc-caja-guardar,\n  body.rol-contador #oc-caja-ver{display:none!important;}\n  #oc-acct-lock{text-align:center;padding:22px;}\n  #oc-acct-lock button{font-family:var(--font-display,sans-serif);font-size:14px;padding:12px 20px;\n    border-radius:6px;border:2px solid var(--rust,#b2461f);background:var(--rust,#b2461f);\n    color:var(--blanco-calido,#fbf5e8);cursor:pointer;min-height:44px;}\n  .oc-subgate{position:fixed;inset:0;z-index:9999;background:rgba(28,48,73,0.92);\n    display:flex;align-items:center;justify-content:center;padding:20px;\n    overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;overscroll-behavior-y:contain;}\n  .oc-subgate > .caja{margin:auto;flex:0 0 auto;}\n  /* Rol DEMO: ocultar cambio de claves y de correo (todo lo demás funciona) */\n  body.rol-demo #oc-clave-block, body.rol-demo #oc-email-edit,\n  body.rol-demo #oc-email-save, body.rol-demo #oc-email-in{display:none!important;}\n  `;document.head.appendChild(css);function montarTeclado(padEl,slotsEl,onComplete){let entrada=[];const pool=barajar(EMOJI_POOL);padEl.innerHTML="";for(let d=0;d<=9;d++){const b=document.createElement("button");b.dataset.d=String(d);b.innerHTML=`<span class="dig">${d}</span><span class="emo">${pool[d%pool.length]}</span>`;padEl.appendChild(b)}const slots=()=>slotsEl.querySelectorAll(".slot");function pintar(){slots().forEach((s,i)=>{if(entrada[i]!=null){s.textContent="●";s.classList.add("lleno")}else{s.textContent="";s.classList.remove("lleno")}})}padEl._ocTeclado={entrada:()=>entrada,push:d=>entrada.push(d),pintar:pintar,onComplete:onComplete};if(!padEl.dataset.ocListenerMontado){padEl.dataset.ocListenerMontado="1";padEl.addEventListener("click",e=>{const st=padEl._ocTeclado;const b=e.target.closest("button[data-d]");if(!b||st.entrada().length>=3)return;st.push(Number(b.dataset.d));st.pintar();if(st.entrada().length===3){const code=st.entrada().join("");setTimeout(()=>st.onComplete(code),150)}})}pintar();return{reset:()=>{entrada=[];pintar()}}}const gate=document.createElement("div");gate.id="oc-gate";gate.innerHTML=`\n    <div class="caja">\n      <img src="./logo.png" alt="amigable-123" style="max-width:min(70vw,280px);width:auto;height:auto;margin:0 auto 6px;display:block;filter:drop-shadow(0 0 1.5px rgba(255,253,245,.55)) drop-shadow(0 0 3px rgba(232,160,32,.35));">\n      <p id=\"oc-gate-tagline\" style=\"margin:0 0 10px;font-size:13px;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;text-align:center;font-family:var(--font-mono,monospace);letter-spacing:.05em;\">Deja de adivinar. Empieza a ver.</p>
      <div class="sub">Toca tu clave de 3 dígitos para entrar</div>\n      <div class="oc-slots" id="oc-slots"><div class="slot"></div><div class="slot"></div><div class="slot"></div></div>\n      <div class="oc-pad" id="oc-pad"></div>\n      <div class="oc-acciones">\n        <button id="oc-borrar">Borrar</button>\n        <button id="oc-recuperar">¿Olvidaste?</button>\n      </div>\n      <div class="oc-msg" id="oc-msg"></div>
      <button type="button" id="oc-unirse-equipo" style="background:none;border:none;color:var(--azul-medio,#2c4a68) !important;-webkit-text-fill-color:var(--azul-medio,#2c4a68) !important;font-size:13px;text-decoration:underline;cursor:pointer;margin-top:10px;padding:6px;">¿Nuevo en este equipo? Únete con el código de tu negocio</button><button type="button" id="oc-reidentificarme" style="background:none;border:none;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;font-size:12px;text-decoration:underline;cursor:pointer;margin-top:6px;padding:6px;">¿Eres el dueño y perdiste el acceso a este dispositivo? Reidentifícate</button>
      <p id=\"oc-gate-info\" style=\"margin:16px 0 0;font-size:13px;line-height:1.5;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;text-align:center;\">v1.0 &mdash; amigable-123 convierte la parte aburrida y abrumadora de manejar un negocio en algo vivo: tus productos hablan en colores que se encienden solos cuando toca actuar. Funciona offline, tus datos son solo tuyos, y no hay suscripciones ni anuncios de nadie. Tu negocio, a color.</p>
      <button type="button" id="oc-gate-privacidad" style="background:none;border:none;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;font-size:12px;text-decoration:underline;cursor:pointer;margin-top:10px;padding:6px;">Política de Privacidad y Manejo de Datos</button>
    </div>`;document.body.appendChild(gate);let teclado=null;let intervaloCountdown=null;function nuevoTeclado(){clearInterval(intervaloCountdown);const restante=msRestantesBloqueo();if(restante>0)return mostrarBloqueo(restante);$("oc-pad").style.display="";teclado=montarTeclado($("oc-pad"),$("oc-slots"),validar);$("oc-borrar").disabled=false}function mostrarBloqueo(msRestantes){$("oc-pad").style.display="none";$("oc-borrar").disabled=true;const pintar=()=>{const restante=msRestantesBloqueo();if(restante<=0){clearInterval(intervaloCountdown);nuevoTeclado();return}$("oc-msg").style.color="var(--rojo,#a3392a)";$("oc-msg").textContent=`Demasiados intentos. Espera ${Math.ceil(restante/1e3)}s.`};pintar();intervaloCountdown=setInterval(pintar,1e3)}function $(id){return document.getElementById(id)}function error(txt){$("oc-msg").style.color="var(--rojo,#a3392a)";$("oc-msg").textContent=txt;gate.classList.add("err");setTimeout(()=>gate.classList.remove("err"),400);nuevoTeclado()}async function validar(code){await listo;try{if(code===ACTIVATION_PIN&&!dispositivoApropiado()){registrarExito();return iniciarActivacion()}const sb=window.OCSecure.segundosBloqueo?window.OCSecure.segundosBloqueo("login"):0;if(sb>0){error(`Demasiados intentos. Espera ${sb}s e intenta de nuevo.`);return}const rolCombinado=await window.OCSecure.verificarOwnerOEmpleado(code);if(rolCombinado==="dueno"){registrarExito();return entrar("dueno")}if(rolCombinado==="empleado"){registrarExito();return entrar("empleado")}if(code===DEMO_PIN&&!dispositivoApropiado()){registrarExito();return entrar("demo")}if(await window.OCSecure.verificarAcct(code)){registrarExito();return entrar("contador")}const uNombrado=await verificarUsuarioNombrado(code);if(uNombrado){window.OCCurrentUser=uNombrado;registrarExito();return entrar(uNombrado.rol||"empleado")}registrarFallo();const restante=msRestantesBloqueo();if(restante>0){error(`Demasiados intentos. Espera ${Math.ceil(restante/1e3)}s.`);return}error("Clave incorrecta. Intenta de nuevo.")}catch(e){try{registrarFallo()}catch(_){}error("No se pudo verificar la clave. Intenta de nuevo.")}}async function verificarUsuarioNombrado(pin){try{const r=await fetch("/api/usuarios/verificar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pin:pin})});if(!r.ok)return null;return await r.json()}catch(_){return null}}let modalActivacion=null;function construirModalActivacion(){if(modalActivacion)return modalActivacion;var st=document.createElement("style");st.textContent=""+"#oc-act{position:fixed;inset:0;z-index:10010;background:#0F1923;display:flex;align-items:center;justify-content:center;padding:18px;}"+"#oc-act-card{background:#F8F9FB;width:100%;max-width:460px;border-radius:14px;border:2px solid #C4CDD8;border-top:4px solid #E86040;padding:26px 22px 24px;box-shadow:0 12px 40px #060d14;max-height:92vh;overflow-y:auto;}"+"#oc-act .marca{font-family:var(--font-mono,monospace);font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;margin:0 0 6px;}"+"#oc-act h2{font-family:var(--font-display,sans-serif);font-size:24px;font-weight:700;line-height:1.15;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:0 0 10px;}"+"#oc-act p{font-family:var(--font-body,sans-serif);font-size:15px;line-height:1.5;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:0 0 14px;}"+"#oc-act label.op{display:block;border:2px solid #C4CDD8;border-radius:10px;padding:12px 14px;margin:0 0 10px;cursor:pointer;background:#FFFFFF;}"+"#oc-act label.op input{margin-right:8px;}"+"#oc-act label.op strong{font-size:15px;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;}"+"#oc-act label.op span{display:block;font-size:14px;color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;margin-top:2px;}"+"#oc-act .lbl{display:block;font-size:14px;font-weight:700;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:14px 0 6px;}"+"#oc-act input[type=email],#oc-act input[type=text]{width:100%;box-sizing:border-box;padding:11px 12px;border:2px solid #5294AC;border-radius:8px;font-size:16px;font-family:var(--font-mono,monospace);color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;background:#FFFFFF;margin-bottom:2px;}"+"#oc-act .primario{width:100%;min-height:48px;margin-top:16px;padding:14px;border-radius:9px;border:2px solid #E86040;background:#E86040;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-size:16px;font-weight:700;cursor:pointer;}"+"#oc-act .secundario{width:100%;min-height:44px;margin-top:10px;padding:11px;border-radius:9px;border:2px solid #5294AC;background:transparent;color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;font-size:15px;font-weight:700;cursor:pointer;}"+"#oc-act .msg{font-size:14px;font-weight:700;margin:10px 0 0;color:#B0183E !important;-webkit-text-fill-color:#B0183E !important;}"+"#oc-act .ok{color:#0F7A3D !important;-webkit-text-fill-color:#0F7A3D !important;}"+"@media (prefers-color-scheme: dark){#oc-act-card{background:#F8F9FB;}#oc-act h2,#oc-act p,#oc-act label.op strong,#oc-act .lbl,#oc-act input[type=email]{color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;}#oc-act label.op span{color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;}#oc-act .primario{color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}}";document.head.appendChild(st);var wrap=document.createElement("div");wrap.id="oc-act";wrap.innerHTML=""+'<div id="oc-act-card">'+'<div id="oc-act-form">'+'<p class="marca">amigable-123 &middot; activar mi negocio</p>'+"<h2>Este dispositivo pasa a ser tuyo</h2>"+"<p>De aqui en adelante, esta copia es tu negocio: tus productos, tus clientes, tus claves. Todo vive en tu dispositivo, sin nube ni intermediarios.</p>"+'<p style="font-weight:700;">Lo único que necesitas registrar es tu licencia del programa — todo el resto de tus datos permanece solamente contigo, por diseño.</p>'+'<label class="op"><input type="radio" name="oc-act-datos" value="vaciar" checked><strong>Empezar vacio</strong><span>Quita los datos de ejemplo. Arrancas de cero con lo tuyo.</span></label>'+'<label class="op"><input type="radio" name="oc-act-datos" value="conservar"><strong>Conservar lo que ya cargue aqui</strong><span>Si ya metiste tus productos reales en este dispositivo, se quedan.</span></label>'+'<label class="lbl" for="oc-act-cedula">Cédula o pasaporte</label>'+'<input id="oc-act-cedula" type="text" inputmode="numeric" autocomplete="off" placeholder="1234567890">'+'<label class="lbl" for="oc-act-nombre">Primer nombre (o inicial)</label>'+'<input id="oc-act-nombre" type="text" autocomplete="given-name" placeholder="María">'+'<label class="lbl" for="oc-act-apellido">Primer apellido</label>'+'<input id="oc-act-apellido" type="text" autocomplete="family-name" placeholder="García">'+'<label class="lbl" for="oc-act-email">Correo (para recuperar el acceso si olvidas el PIN)</label>'+'<input id="oc-act-email" type="email" inputmode="email" autocomplete="email" placeholder="tucorreo@dominio.com">'+'<label class="lbl" for="oc-act-licencia-existente" style="margin-top:14px;">&iquest;Ya activaste amigable-123 en otro dispositivo? Pon tu c&oacute;digo de licencia aqu&iacute; en vez de crear uno nuevo (opcional)</label>'+'<input id="oc-act-licencia-existente" type="text" autocomplete="off" placeholder="AMG-XXXX-XXXX-XXXX" style="text-transform:uppercase;">'+'<button id="oc-act-confirmar" class="primario">Activar mi negocio</button>'+'<button id="oc-act-cancelar" class="secundario">Ahora no</button>'+'<p id="oc-act-msg" class="msg"></p>'+"</div>"+'<div id="oc-act-exito" style="display:none;">'+'<p class="marca">amigable-123 &middot; listo</p>'+"<h2>Tu negocio esta activo</h2>"+'<p id="oc-act-exito-txt"></p>'+'<button id="oc-act-entrar" class="primario">Entrar a mi negocio</button>'+"</div>"+"</div>";document.body.appendChild(wrap);try{_ocMascaraLicencia(wrap.querySelector("#oc-act-licencia-existente"))}catch(_){};modalActivacion=wrap;var emailIn=wrap.querySelector("#oc-act-email");var msgEl=wrap.querySelector("#oc-act-msg");function setMsg(t,ok){msgEl.textContent=t;msgEl.className=ok?"msg ok":"msg"}wrap.querySelector("#oc-act-cancelar").addEventListener("click",function(){wrap.style.display="none"});wrap.querySelector("#oc-act-confirmar").addEventListener("click",async function(){var email=(emailIn.value||"").trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){setMsg("Escribe un correo valido — es tu unica forma de recuperar el acceso si olvidas el PIN.");emailIn.focus();return}var cedula=(wrap.querySelector("#oc-act-cedula")?wrap.querySelector("#oc-act-cedula").value:"").trim();var nombre=(wrap.querySelector("#oc-act-nombre")?wrap.querySelector("#oc-act-nombre").value:"").trim();var apellido=(wrap.querySelector("#oc-act-apellido")?wrap.querySelector("#oc-act-apellido").value:"").trim();var vaciar=(wrap.querySelector('input[name="oc-act-datos"]:checked')||{}).value!=="conservar";var btn=wrap.querySelector("#oc-act-confirmar");btn.disabled=true;setMsg("Activando...",true);var idInstancia=globalThis.crypto&&globalThis.crypto.randomUUID?globalThis.crypto.randomUUID():Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);var _licExistente=(wrap.querySelector("#oc-act-licencia-existente")?wrap.querySelector("#oc-act-licencia-existente").value:"").trim().toUpperCase();var licenseCode=(/^AMG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(_licExistente))?_licExistente:generarCodigoAMG();try{if(window.OCSyncControl)window.OCSyncControl.activar(licenseCode)}catch(_){}try{await fetch("/api/instancia/activar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({vaciar:vaciar,instanceId:idInstancia})})}catch(_){}try{await window.OCSecure.fijarOwnerPin("789")}catch(_){}try{window.OCSecure.actualizarCorreo(email)}catch(_){}if(vaciar){try{var rm=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf("vp_foto_percha_")===0)rm.push(k)}rm.forEach(function(kk){localStorage.removeItem(kk)})}catch(_){}}var ownedData={instanceId:idInstancia,email:email,activatedAt:Date.now(),licenseCode:licenseCode};if(cedula)ownedData.cedula=cedula;if(nombre)ownedData.nombre=nombre;if(apellido)ownedData.apellido=apellido;var _ownedPayload=JSON.stringify(ownedData);try{localStorage.setItem("amigable_owned",_ownedPayload)}catch(_){try{var rmO=[];for(var io=0;io<localStorage.length;io++){var ko=localStorage.key(io);if(ko&&ko.indexOf("vp_foto_percha_")===0)rmO.push(ko)}rmO.forEach(function(kk){try{localStorage.removeItem(kk)}catch(_){}});localStorage.setItem("amigable_owned",_ownedPayload)}catch(_){}}/* NO marcar amigable_bienvenida_v3 aqui — el wizard debe mostrarse de verdad tras el primer login post-activacion (ver welcome-ui.js). Bug anterior: se marcaba "vista" en este punto sin que el usuario la viera nunca. */registrarExito();try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(_){};enviarHeartbeatLicencia({instanceId:idInstancia,licenseCode:licenseCode,email:email,nombre:nombre,apellido:apellido,cedula:cedula,activatedAt:ownedData.activatedAt,accion:"register"});var seguro=email.replace(/[&<>"']/g,"");var codigoHtml=licenseCode.replace(/[&<>"']/g,"");wrap.querySelector("#oc-act-exito-txt").innerHTML="Tu PIN de due&ntilde;o es <strong>789</strong> — c&aacute;mbialo cuando quieras en Avanzado &rarr; Claves.<br><br>"+"Correo guardado: <strong>"+seguro+"</strong><br><br>"+"Tu c&oacute;digo de licencia: <strong style='font-family:monospace;letter-spacing:.1em;font-size:18px;color:#E86040;'>"+codigoHtml+"</strong><br>"+"<small style='color:#2C3E50;'>Gu&aacute;rdalo. Aparece tambi&eacute;n en Ayuda (?). Con &eacute;l te identificamos si necesitas soporte.</small>";wrap.querySelector("#oc-act-form").style.display="none";wrap.querySelector("#oc-act-exito").style.display="block"});wrap.querySelector("#oc-act-entrar").addEventListener("click",function(){wrap.style.display="none";entrar("dueno")});return wrap}function iniciarActivacion(){var w=construirModalActivacion();w.querySelector("#oc-act-form").style.display="block";w.querySelector("#oc-act-exito").style.display="none";w.querySelector("#oc-act-msg").textContent="";w.querySelector("#oc-act-confirmar").disabled=false;w.style.display="flex";setTimeout(function(){var e=w.querySelector("#oc-act-email");if(e)e.focus()},80)}function entrar(nuevoRol){if(nuevoRol!=="demo"){try{var owned=JSON.parse(localStorage.getItem("amigable_owned")||"null")||{};if(owned.licenseEstado==="bloqueada"){error("Esta instancia está bloqueada. Contacta al administrador de amigable-123.");return}}catch(_){}}const esDemo=nuevoRol==="demo";demoSesion=esDemo;rol=esDemo?"dueno":nuevoRol;document.body.classList.toggle("rol-empleado",rol==="empleado");document.body.classList.toggle("rol-dueno",rol==="dueno");document.body.classList.toggle("rol-demo",esDemo);document.body.classList.toggle("rol-contador",rol==="contador");document.body.classList.toggle("rol-admin",rol==="admin");gate.style.display="none";document.body.style.overflow="";if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();window.scrollTo(0,0);montarLogout();reiniciarInactividad();if(!esDemo&&rol==="dueno"&&dispositivoApropiado()&&window.OCSecure&&window.OCSecure.tieneOwnerPassword&&!window.OCSecure.tieneOwnerPassword()){setTimeout(function(){try{pedirPasswordInicial()}catch(_){}},700)}if(rol==="empleado"||rol==="admin"){const n=document.querySelector('nav button[data-vista="hoy"]');if(n)n.click()}if(!esDemo){try{var ow=JSON.parse(localStorage.getItem("amigable_owned")||"null")||{};if(ow.instanceId){enviarHeartbeatLicencia({instanceId:ow.instanceId,licenseCode:ow.licenseCode,email:ow.email,nombre:ow.nombre,apellido:ow.apellido,cedula:ow.cedula,activatedAt:ow.activatedAt,accion:"login"})}}catch(_){}}window.dispatchEvent(new CustomEvent("oc-login",{detail:{rol:rol,demo:esDemo}}));if(rol==="contador"){const nc=document.querySelector('nav button[data-vista="contable"]');if(nc)nc.click()}}const INACTIVIDAD_MS=30*60*1e3;let temporizadorInactividad=null;function reiniciarInactividad(){clearTimeout(temporizadorInactividad);if(!rol)return;temporizadorInactividad=setTimeout(()=>cerrarSesion("Sesión cerrada por inactividad."),INACTIVIDAD_MS)}document.addEventListener("click",reiniciarInactividad);document.addEventListener("keydown",reiniciarInactividad);function cerrarSesion(mensaje){clearTimeout(temporizadorInactividad);rol=null;demoSesion=false;window.OCCurrentUser=null;document.body.classList.remove("rol-empleado","rol-dueno","rol-demo","rol-contador","rol-admin");nuevoTeclado();gate.style.display="flex";document.body.style.overflow="hidden";$("oc-msg").style.color=mensaje?"var(--rojo,#a3392a)":"";$("oc-msg").textContent=mensaje||"";const b=document.getElementById("oc-logout");if(b)b.remove();const chipViejo=document.getElementById("oc-user-chip");if(chipViejo)chipViejo.remove();window.dispatchEvent(new CustomEvent("oc-logout"))}$("oc-borrar").addEventListener("click",()=>{$("oc-msg").textContent="";if(teclado)teclado.reset()});$("oc-recuperar").addEventListener("click",(ev)=>{var b=ev.currentTarget;if(b.dataset.ocBusy)return;b.dataset.ocBusy="1";setTimeout(function(){delete b.dataset.ocBusy},1500);abrirFlujoReset()});$("oc-unirse-equipo").addEventListener("click",()=>abrirUnirseEquipo());$("oc-reidentificarme").addEventListener("click",()=>abrirReidentificarme());$("oc-gate-privacidad").addEventListener("click",()=>abrirPoliticaPrivacidad());nuevoTeclado();
/* Politica de Privacidad accesible DESDE el gate (2026-07-28, JFC: "es importante
   que la gente sepa a donde se esta metiendo... va a lucir super profesional").
   Copia self-contained (mismo texto que la version larga en Avanzado -> Mis
   Sincronizaciones -> Politica de Privacidad y Manejo de Datos) porque el gate
   corre ANTES del login, sin acceso al DOM de avanzado-extra.js todavia. */

/* =======================================================================
   BLINDAJE DE MODALES .oc-subgate  (2026-07-28)
   -----------------------------------------------------------------------
   QUE ARREGLA (4 bugs reales que dejaban al usuario tirado):
   1. Doble apertura: cada abrir*() hacia createElement sin preguntar si ese
      modal ya estaba abierto. Dos toques al mismo boton (comun en movil, el
      primer tap a veces no da feedback) apilaban DOS modales identicos.
      Cerrar el de arriba dejaba un clon fantasma que parecia no cerrarse.
   2. Timers zombis: los setTimeout(cont.remove) de "Listo, ya casi" seguian
      vivos aunque el usuario cerrara antes. Si abria OTRO modal dentro de
      esa ventana, el timer viejo se lo borraba en la cara.
   3. Sin Escape: en desktop no habia forma de salir con teclado. Si el boton
      Cancelar quedaba fuera de viewport (pantalla corta), no habia salida.
   4. Sin click-afuera: el gesto que el 100% de los usuarios prueba primero.

   COMO SE USA (obligatorio para CUALQUIER modal nuevo):
     var cont = _ocSubgate("mi-id-unico");
     if (!cont) return;              // ya estaba abierto -> no hacer nada
     cont.innerHTML = "...";
     document.body.appendChild(cont);
     boton.addEventListener("click", function(){ cont.cerrar() });
     cont.luego(function(){ cont.cerrar() }, 1500);   // en vez de setTimeout

   NO usar cont.remove() directo: salta la limpieza de timers y listeners.
   NO crear divs .oc-subgate a mano: pierden guard, Escape y click-afuera.

   opts.obligatorio = true  -> modal que NO se puede esquivar (sin Escape,
   sin click-afuera). Reservado para candados de confirmacion intencionales.
   ======================================================================= */

/* Ojito ver / no ver en inputs de password (JFC 2026-07-28, bug 9).
   Se llama despues de appendChild en cada modal que tenga password.
   Envuelve el input en un contenedor relativo y le pone un boton encima.
   Por defecto SIEMPRE arranca oculto (type=password): mostrar por defecto
   expondria la clave a quien mire la pantalla por encima del hombro, que es
   el escenario real en un mostrador.
   El boton es 44x44 (minimo tactil) y no entra en el orden de tabulacion
   (tabindex=-1) para no estorbar el llenado con teclado. */

/* Mascara de codigo de licencia (JFC 2026-07-28, punto 7: "los - guiones deben
   estar ya preincorporados... para que no les falle el intento pues").
   Formato canonico, el mismo que produce generarCodigoAMG() y que exige
   /^AMG-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/ :  AMG-XXXX-XXXX-XXXX

   El usuario escribe (o pega) solo lo significativo, en mayus o minus, con o
   sin guiones, con o sin el prefijo AMG. Esta funcion normaliza todo mientras
   teclea. Motivo real: este codigo tambien es la SALA de sincronizacion, y
   OCSyncControl.activar() solo exige 6 caracteres — un codigo mal tecleado NO
   da error, simplemente mete al usuario en una sala vacia donde nadie mas
   esta, y la desincronizacion es silenciosa. La mascara es la defensa barata
   contra eso.

   El cursor se manda al final a proposito. Es un campo que se llena de
   izquierda a derecha de una sola pasada; hacer aritmetica de caret con
   guiones que se insertan solos genera saltos raros y no vale la pena aqui. */
function _ocMascaraLicencia(inp){
  if (!inp || inp.dataset.ocMask) return;    // idempotente
  inp.dataset.ocMask = "1";
  inp.setAttribute("autocapitalize", "characters");
  inp.setAttribute("autocorrect", "off");
  inp.setAttribute("spellcheck", "false");
  inp.setAttribute("inputmode", "latin");
  inp.setAttribute("maxlength", "18");        // AMG- + 4+1 + 4+1 + 4 = 18
  function formatear(raw){
    var v = String(raw || "").toUpperCase();
    v = v.replace(/[^A-Z0-9]/g, "");          // fuera guiones y espacios
    if (v.indexOf("AMG") === 0) v = v.slice(3);
    v = v.slice(0, 12);                       // 3 grupos de 4
    var out = "AMG";
    for (var i = 0; i < v.length; i += 4) out += "-" + v.slice(i, i + 4);
    return out;
  }
  function alEscribir(){
    var antes = inp.value;
    var despues = formatear(antes);
    if (antes !== despues){
      inp.value = despues;
      try{ inp.setSelectionRange(despues.length, despues.length) }catch(_){}
    }
  }
  inp.addEventListener("input", alEscribir);
  inp.addEventListener("paste", function(){ setTimeout(alEscribir, 0) });
  // Al enfocar un campo vacio, sembrar el prefijo para que se vea la forma.
  inp.addEventListener("focus", function(){
    if (!inp.value) { inp.value = "AMG-"; try{ inp.setSelectionRange(4,4) }catch(_){} }
  });
  inp.addEventListener("blur", function(){
    if (inp.value === "AMG-" || inp.value === "AMG") inp.value = "";
  });
}
function _ocPonerOjitos(cont){
  try{
    var inputs = cont.querySelectorAll('input[type="password"]');
    for (var i = 0; i < inputs.length; i++){
      (function(inp){
        if (inp.dataset.ocOjito) return;      // idempotente
        inp.dataset.ocOjito = "1";
        var wrap = document.createElement("div");
        wrap.style.cssText = "position:relative;display:block;";
        inp.parentNode.insertBefore(wrap, inp);
        wrap.appendChild(inp);
        inp.style.paddingRight = "48px";
        var b = document.createElement("button");
        b.type = "button";
        b.tabIndex = -1;
        b.setAttribute("aria-label", "Mostrar u ocultar la password");
        // El input trae margin-bottom:10px de _ocIn(); se descuenta para que
        // el ojito quede centrado sobre la caja de texto y no sobre el hueco.
        b.style.cssText = "position:absolute;right:2px;top:50%;transform:translateY(-50%);"
          + "margin-top:-5px;width:44px;height:44px;display:flex;align-items:center;"
          + "justify-content:center;background:none;border:none;cursor:pointer;padding:0;"
          + "font-size:13px;font-weight:700;color:#2c4a68 !important;"
          + "-webkit-text-fill-color:#2c4a68 !important;";
        function pintar(){
          var oculto = inp.type === "password";
          b.textContent = oculto ? "VER" : "NO";
          b.title = oculto ? "Mostrar la password" : "Ocultar la password";
        }
        b.addEventListener("click", function(){
          inp.type = (inp.type === "password") ? "text" : "password";
          pintar();
          try{ inp.focus() }catch(_){}
        });
        pintar();
        wrap.appendChild(b);
      })(inputs[i]);
    }
  }catch(_){ /* si falla, el input sigue funcionando tal cual */ }
}
function _ocSubgate(id, opts){
  opts = opts || {};
  // Guard anti-doble-apertura. Es la linea que mas bugs previene aqui.
  if (id && document.getElementById(id)) return null;
  var cont = document.createElement("div");
  cont.className = "oc-subgate";
  if (id) cont.id = id;
  var timers = [];
  var cerrado = false;
  function cerrar(){
    if (cerrado) return;                 // idempotente: llamarlo 5 veces es seguro
    cerrado = true;
    for (var i = 0; i < timers.length; i++){ try{ clearTimeout(timers[i]) }catch(_){} }
    timers.length = 0;
    try{ document.removeEventListener("keydown", onKey, true) }catch(_){}
    try{ cont.remove() }catch(_){}
    // alCerrar: red de seguridad para modales que envuelven una Promise.
    // Garantiza que la Promise SIEMPRE se salda, se cierre por el boton,
    // por Escape, por click-afuera o por guard. Sin esto, un modal cerrado
    // por una ruta no prevista deja al llamador esperando para siempre y la
    // pantalla queda muerta sin error visible. Se llama al final y una sola
    // vez (cerrar() es idempotente).
    if (typeof opts.alCerrar === "function"){ try{ opts.alCerrar() }catch(_){} }
  }
  function onKey(e){
    if (e.key === "Escape" || e.key === "Esc"){ try{ e.stopPropagation() }catch(_){} cerrar(); }
  }
  if (!opts.obligatorio){
    document.addEventListener("keydown", onKey, true);
    // Solo el fondo cierra; un click dentro de la .caja no debe descartar
    // lo que el usuario esta escribiendo.
    cont.addEventListener("click", function(e){ if (e.target === cont) cerrar(); });
  }
  cont.cerrar = cerrar;
  // Reemplazo seguro de setTimeout: el timer muere con el modal.
  cont.luego = function(fn, ms){
    var t = setTimeout(function(){ if (!cerrado) { try{ fn() }catch(_){} } }, ms);
    timers.push(t);
    return t;
  };
  return cont;
}
function abrirPoliticaPrivacidad(){
  const cont=_ocSubgate("oc-priv-modal");
  if(!cont)return;
  cont.innerHTML=`<div class="caja" style="background:var(--blanco-calido,#fbf5e8);border:2px solid var(--brass,#9c7a35);border-radius:8px;padding:26px 22px;max-width:480px;width:100%;text-align:left;max-height:82vh;overflow-y:auto;">
    <h2 style="font-family:var(--font-display,sans-serif);color:var(--ink,#211c14);font-size:20px;margin:0 0 12px;text-align:center;">Política de Privacidad y Manejo de Datos</h2>
    <div style="font-size:14px;color:var(--ink-soft,#5d5340);line-height:1.55;">
      <p>amigable-123 es un cuaderno compartido de control de inventario, perchas y clientes, en colores. No manejamos ni almacenamos los datos de tu negocio: permanecen en tu dispositivo y en los de tu equipo. Solo registramos tus datos de contacto (correo, licencia) para poder darte soporte.</p>
      <p><strong style="color:var(--ink);">Código abierto y auditable.</strong> Sin bloatware, sin publicidad de terceros, sin venta ni arriendo de tus datos de contacto a terceros, sin código malicioso ni formas invasivas de recolección.</p>
      <p><strong style="color:var(--ink);">Estándares.</strong> Nos guiamos por los principios más exigentes disponibles en Ecuador y a nivel internacional — incluidos los del GDPR europeo (Reglamento General de Protección de Datos) en lo que aplica sin comprometer la autonomía del usuario sobre sus propios datos: minimización de datos, derecho al olvido (tus datos viven solo en tu dispositivo — borrarlos es instantáneo y total), cifrado de extremo a extremo para la sincronización entre equipos, y descentralización.</p>
      <p><strong style="color:var(--ink);">Es una PWA.</strong> Su creador la mantiene funcionando sólidamente, pero cada usuario con licencia gobierna sus propios datos y conserva una privacidad que ni una libreta de papel ni una app de pago mensual indefinido pueden ofrecer al mismo tiempo.</p>
      <p style="font-size:13px;">amigable-123 no se responsabiliza por usos extralegales o ilegales de cualquier tipo. Fue concebida para el micro y pequeño emprendedor o comerciante.</p>
    </div>
    <button id="oc-priv-cerrar" style="width:100%;min-height:44px;margin-top:14px;padding:11px;border-radius:8px;border:2px solid var(--azul-medio,#2c4a68);background:var(--azul-medio,#2c4a68);color:#fff;font-size:15px;font-weight:700;cursor:pointer;">Entendido</button>
  </div>`;
  document.body.appendChild(cont);
  cont.querySelector("#oc-priv-cerrar").addEventListener("click",()=>cont.cerrar());
}/* Banner "Actualizar app" quitado (JFC 2026-07-16): "no tiene el menor sentido — YO mantengo la app actualizada, para eso son 2 anos de soporte, y para el cache del usuario ya estan los meta tags y otros metodos de refresh". Tenia ademas un bug real: APP_VERSION vivia hardcodeada aqui y nunca se sincronizaba con version.json, asi que el banner salia SIEMPRE. NO reintroducir sin que JFC lo pida. */function abrirUnirseEquipo(){
  const cont=_ocSubgate("oc-ue-modal");
  if(!cont)return;
  cont.innerHTML=`<div class="caja" style="background:var(--blanco-calido,#fbf5e8);border:2px solid var(--brass,#9c7a35);border-radius:8px;padding:26px 22px;max-width:420px;width:100%;text-align:center;">
    <h2 style="font-family:var(--font-display,sans-serif);color:var(--ink,#211c14);font-size:22px;margin:0 0 4px;">Unirme a mi equipo</h2>
    <p style="font-size:14px;color:var(--ink-soft,#5d5340);margin:0 0 14px;">Pide el código al dueño/a de tu licencia (te lo comparte una sola vez, como la clave del wifi). Tu celular queda sincronizado con el equipo para siempre — no hace falta repetir esto.</p>
    <input id="oc-ue-codigo" type="text" placeholder="AMG-XXXX-XXXX-XXXX" style="width:100%;box-sizing:border-box;padding:11px 12px;border:2px solid var(--azul-medio,#2c4a68);border-radius:8px;font-size:16px;font-family:var(--font-mono,monospace);text-align:center;text-transform:uppercase;margin-bottom:10px;">
    <button id="oc-ue-confirmar" style="width:100%;min-height:48px;padding:14px;border-radius:9px;border:2px solid var(--rust,#b2461f);background:var(--rust,#b2461f);color:#fff;font-size:16px;font-weight:700;cursor:pointer;">Unirme</button>
    <button id="oc-ue-cancelar" style="width:100%;min-height:44px;margin-top:10px;padding:11px;border-radius:9px;border:2px solid var(--azul-medio,#2c4a68);background:transparent;color:var(--azul-medio,#2c4a68);font-size:15px;font-weight:700;cursor:pointer;">Cancelar</button>
    <p id="oc-ue-msg" style="min-height:20px;font-size:14px;font-weight:700;color:var(--rojo,#a3392a);margin-top:12px;"></p>
  </div>`;
  document.body.appendChild(cont);
  _ocMascaraLicencia(cont.querySelector("#oc-ue-codigo"));
  const msgEl=cont.querySelector("#oc-ue-msg");
  cont.querySelector("#oc-ue-cancelar").addEventListener("click",()=>cont.cerrar());
  cont.querySelector("#oc-ue-confirmar").addEventListener("click",(ev)=>{
    const btn=ev.currentTarget;
    if(btn.disabled)return;
    btn.disabled=true;setTimeout(()=>{btn.disabled=false},1200);
    const codigo=cont.querySelector("#oc-ue-codigo").value.trim();
    if(!window.OCSyncControl){msgEl.textContent="Sincronización no disponible en este dispositivo.";return}
    const r=window.OCSyncControl.unirse(codigo);
    if(!r.ok){msgEl.textContent=r.error;return}
    msgEl.style.color="var(--verde-suave,#2f7a4f)";
    msgEl.textContent="¡Listo! Tu celular ya está sincronizado con el equipo.";
    cont.luego(()=>cont.cerrar(),1800);
  })
}
async function abrirFlujoReset(){await listo;if(window.OCSecure&&window.OCSecure.tieneOwnerPassword&&window.OCSecure.tieneOwnerPassword()){return abrirResetConPassword()}const email=window.OCSecure.leerCorreo();const pin=window.OCSecure.recuperarPinDueno();const msgEl=$("oc-msg");if(!email){msgEl.style.color="var(--ink-soft,#5d5340)";msgEl.textContent="No hay correo configurado. Entra como dueno y registralo en Avanzado.";return}if(!pin){msgEl.style.color="var(--ink-soft,#5d5340)";msgEl.textContent="Cambia tu clave una vez en Avanzado para activar la recuperacion.";return}msgEl.style.color="var(--ink-soft,#5d5340)";msgEl.textContent="Enviando…";var _owned;try{_owned=JSON.parse(localStorage.getItem("amigable_owned")||"null")||{}}catch(_){_owned={}}const resultado=window.OCEmailRecovery?await window.OCEmailRecovery.enviarCodigo(email,pin,_owned.instanceId||""):{enviado:false,codigo:pin};if(resultado.enviado){msgEl.style.color="var(--verde-suave,#2f7a4f)";msgEl.textContent=`Clave enviada a ${enmascarar(email)}.`}else{msgEl.style.color="var(--ink,#211c14)";msgEl.textContent=`Tu clave de dueno: ${resultado.codigo}`}}
function pedirPasswordInicial(){
  var cont=_ocSubgate("oc-pwi-modal");
  if(!cont)return;
  cont.innerHTML='<div class="caja" style="'+_ocCaja()+'">'
    +'<h2 style="font-family:var(--font-display,sans-serif);color:var(--ink,#211c14) !important;-webkit-text-fill-color:var(--ink,#211c14) !important;font-size:22px;margin:0 0 4px;">Crea tu password de recuperacion</h2>'
    +'<p style="font-size:14px;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;margin:0 0 4px;">Tu PIN es para el dia a dia. Tu <b>password</b> es tu llave para recuperar el acceso si olvidas el PIN, sin depender de nadie. Es tuya, aqui mismo, cifrada.</p>'
    +'<p style="font-size:13px;color:var(--sim-verde-dk,#1a6e3c) !important;-webkit-text-fill-color:var(--sim-verde-dk,#1a6e3c) !important;font-weight:700;margin:0 0 14px;">Todo tu negocio vive en tu licencia. Esta password la protege.</p>'
    +'<input id="oc-pwi-p1" type="password" autocomplete="new-password" placeholder="Password (minimo 6)" style="'+_ocIn()+'">'
    +'<input id="oc-pwi-p2" type="password" autocomplete="new-password" placeholder="Repite la password" style="'+_ocIn()+'">'
    +'<button id="oc-pwi-ok" style="'+_ocBtn()+'">Crear mi password</button>'
    +'<button id="oc-pwi-luego" style="background:none;border:none;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;font-size:13px;text-decoration:underline;cursor:pointer;padding:6px;">Ahora no (te lo recordare la proxima vez)</button>'
    +'<p id="oc-pwi-msg" style="min-height:18px;font-size:14px;font-weight:700;margin:8px 0 0;"></p>'
    +'</div>';
  document.body.appendChild(cont);
  _ocPonerOjitos(cont);
  var msg=cont.querySelector("#oc-pwi-msg");
  cont.querySelector("#oc-pwi-luego").addEventListener("click",function(){cont.cerrar()});
  cont.querySelector("#oc-pwi-ok").addEventListener("click",async function(ev){
    var b=ev.currentTarget;if(b.disabled)return;b.disabled=true;setTimeout(function(){b.disabled=false},1000);
    var p1=cont.querySelector("#oc-pwi-p1").value||"";
    var p2=cont.querySelector("#oc-pwi-p2").value||"";
    if(String(p1).length<6){msg.style.color="var(--rojo,#a3392a)";msg.textContent="La password debe tener al menos 6 caracteres.";return}
    if(p1!==p2){msg.style.color="var(--rojo,#a3392a)";msg.textContent="Las dos passwords no coinciden.";return}
    var ok=await window.OCSecure.fijarOwnerPassword(p1);
    if(!ok){msg.style.color="var(--rojo,#a3392a)";msg.textContent="No se pudo guardar. Intenta de nuevo.";return}
    msg.style.color="var(--verde-suave,#2f7a4f)";msg.textContent="Listo. Tu acceso ya esta protegido.";
    cont.luego(function(){cont.cerrar()},1400);
  });
}
function _ocWorkerBase(){try{var ov=(localStorage.getItem("amigable_cf_worker_url")||"").trim();if(ov)return ov.replace(/\/+$/,"")}catch(_){}return(CF_WORKER_URL_DEFAULT||"").replace(/\/+$/,"")}
function _ocOwned(){try{return JSON.parse(localStorage.getItem("amigable_owned")||"null")||{}}catch(_){return{}}}
function _ocCaja(){return "background:var(--blanco-calido,#fbf5e8);border:2px solid var(--brass,#9c7a35);border-radius:8px;padding:24px 20px;max-width:420px;width:100%;text-align:center;box-sizing:border-box;"}
function _ocIn(){return "width:100%;box-sizing:border-box;padding:11px 12px;border:2px solid var(--azul-medio,#2c4a68);border-radius:8px;font-size:16px;margin-bottom:10px;"}
function _ocBtn(){return "width:100%;min-height:48px;padding:14px;border-radius:9px;border:2px solid var(--rust,#b2461f);background:var(--rust,#b2461f);color:#fff !important;-webkit-text-fill-color:#fff !important;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:8px;"}
function abrirResetConPassword(){
  var cont=_ocSubgate("oc-rp-modal");
  if(!cont)return;
  cont.innerHTML='<div class="caja" style="'+_ocCaja()+'">'
    +'<h2 style="font-family:var(--font-display,sans-serif);color:var(--ink,#211c14) !important;-webkit-text-fill-color:var(--ink,#211c14) !important;font-size:22px;margin:0 0 4px;">Recupera tu acceso</h2>'
    +'<p style="font-size:14px;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;margin:0 0 16px;">Escribe tu password de dueno y elige un PIN nuevo. Es al instante, aqui mismo.</p>'
    +'<input id="oc-rp-pass" type="password" autocomplete="off" placeholder="Tu password de dueno" style="'+_ocIn()+'">'
    +'<input id="oc-rp-pin" type="tel" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="PIN nuevo (3 digitos)" style="'+_ocIn()+'font-family:var(--font-mono,monospace);text-align:center;letter-spacing:6px;">'
    +'<input id="oc-rp-pin2" type="tel" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="Repite el PIN nuevo" style="'+_ocIn()+'font-family:var(--font-mono,monospace);text-align:center;letter-spacing:6px;">'
    +'<button id="oc-rp-ok" style="'+_ocBtn()+'">Fijar mi PIN nuevo</button>'
    +'<button id="oc-rp-cancel" style="background:none;border:none;color:var(--azul-medio,#2c4a68) !important;-webkit-text-fill-color:var(--azul-medio,#2c4a68) !important;font-size:14px;cursor:pointer;padding:8px;">Cancelar</button>'
    +'<p id="oc-rp-msg" style="min-height:18px;font-size:14px;font-weight:700;margin:8px 0 0;"></p>'
    +'<hr style="border:none;border-top:1px solid #e5ddca;margin:14px 0 10px;">'
    +'<button id="oc-rp-liberar" style="background:none;border:none;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;font-size:13px;text-decoration:underline;cursor:pointer;padding:6px;">Tambien olvide mi password: liberar con mi licencia</button>'
    +'</div>';
  document.body.appendChild(cont);
  _ocPonerOjitos(cont);
  var msg=cont.querySelector("#oc-rp-msg");
  cont.querySelector("#oc-rp-cancel").addEventListener("click",function(){cont.cerrar()});
  cont.querySelector("#oc-rp-liberar").addEventListener("click",function(){cont.cerrar();abrirLiberarLicencia()});
  cont.querySelector("#oc-rp-ok").addEventListener("click",async function(ev){
    var b=ev.currentTarget;if(b.disabled)return;b.disabled=true;setTimeout(function(){b.disabled=false},1000);
    var pass=cont.querySelector("#oc-rp-pass").value||"";
    var pin=(cont.querySelector("#oc-rp-pin").value||"").trim();
    var pin2=(cont.querySelector("#oc-rp-pin2").value||"").trim();
    if(!pass){msg.style.color="var(--rojo,#a3392a)";msg.textContent="Escribe tu password.";return}
    var espera=window.OCSecure.segundosBloqueo?window.OCSecure.segundosBloqueo("ownerpass"):0;
    if(espera>0){msg.style.color="var(--rojo,#a3392a)";msg.textContent="Demasiados intentos. Espera "+espera+"s.";return}
    var ok=await window.OCSecure.verificarOwnerPassword(pass);
    if(!ok){msg.style.color="var(--rojo,#a3392a)";msg.textContent="Password incorrecta.";return}
    if(!/^\d{3}$/.test(pin)){msg.style.color="var(--rojo,#a3392a)";msg.textContent="El PIN nuevo debe ser 3 digitos.";return}
    if(pin!==pin2){msg.style.color="var(--rojo,#a3392a)";msg.textContent="Los dos PIN no coinciden.";return}
    await window.OCSecure.fijarOwnerPin(pin);
    msg.style.color="var(--verde-suave,#2f7a4f)";msg.textContent="Listo. Entra con tu PIN nuevo.";
    cont.luego(function(){cont.cerrar();try{$("oc-msg").textContent=""}catch(_){}},1600);
  });
}
function abrirLiberarLicencia(){
  var owned=_ocOwned();var lic=owned.licenseCode||"";var inst=owned.instanceId||"";
  var cont=_ocSubgate("oc-lib-modal");
  if(!cont)return;
  var waTxt="Hola JFC, soy dueno de la licencia "+(lic||"(no la tengo a la mano)")+", instancia "+(inst?inst.slice(0,8):"?")+". Olvide mi PIN y mi password, necesito liberar mi acceso en amigable-123.";
  cont.innerHTML='<div class="caja" style="'+_ocCaja()+'">'
    +'<h2 style="font-family:var(--font-display,sans-serif);color:var(--ink,#211c14) !important;-webkit-text-fill-color:var(--ink,#211c14) !important;font-size:21px;margin:0 0 4px;">Liberar con mi licencia</h2>'
    +'<p style="font-size:14px;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;margin:0 0 10px;">Tu negocio vive en tu licencia. Escribe a soporte, confirma que eres tu, y recibiras un codigo de un solo uso para volver a fijar tu PIN y tu password.</p>'
    +'<div style="background:#fff;border:2px dashed var(--brass,#9c7a35);border-radius:8px;padding:10px;margin-bottom:12px;"><span style="font-size:12px;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;">Tu licencia</span><br><code style="font-size:16px;font-weight:700;color:var(--ink,#211c14) !important;-webkit-text-fill-color:var(--ink,#211c14) !important;">'+(lic||"—")+'</code></div>'
    +'<a href="https://wa.me/593999905080?text='+encodeURIComponent(waTxt)+'" target="_blank" rel="noopener" style="display:block;text-decoration:none;background:#25D366;color:#fff !important;-webkit-text-fill-color:#fff !important;font-weight:700;font-size:15px;padding:12px;border-radius:9px;margin-bottom:12px;">Escribir a soporte por WhatsApp</a>'
    +'<input id="oc-lib-code" type="text" autocomplete="off" placeholder="Codigo de liberacion" style="'+_ocIn()+'font-family:var(--font-mono,monospace);text-align:center;text-transform:uppercase;">'
    +'<button id="oc-lib-ok" style="'+_ocBtn()+'">Verificar codigo</button>'
    +'<button id="oc-lib-cancel" style="background:none;border:none;color:var(--azul-medio,#2c4a68) !important;-webkit-text-fill-color:var(--azul-medio,#2c4a68) !important;font-size:14px;cursor:pointer;padding:8px;">Volver</button>'
    +'<div id="oc-lib-paso2" style="display:none;margin-top:12px;border-top:1px solid #e5ddca;padding-top:12px;">'
      +'<input id="oc-lib-pin" type="tel" inputmode="numeric" maxlength="3" placeholder="PIN nuevo (3 digitos)" style="'+_ocIn()+'font-family:var(--font-mono,monospace);text-align:center;letter-spacing:6px;">'
      +'<input id="oc-lib-pass" type="password" placeholder="Password nueva (min 6)" style="'+_ocIn()+'">'
      +'<button id="oc-lib-fijar" style="'+_ocBtn()+'background:var(--verde-suave,#2f7a4f);border-color:var(--verde-suave,#2f7a4f);">Guardar y entrar</button>'
    +'</div>'
    +'<p id="oc-lib-msg" style="min-height:18px;font-size:14px;font-weight:700;margin:8px 0 0;"></p>'
    +'</div>';
  document.body.appendChild(cont);
  _ocPonerOjitos(cont);
  _ocMascaraLicencia(cont.querySelector("#oc-lib-code"));
  var msg=cont.querySelector("#oc-lib-msg");
  cont.querySelector("#oc-lib-cancel").addEventListener("click",function(){cont.cerrar()});
  cont.querySelector("#oc-lib-ok").addEventListener("click",async function(ev){
    var b=ev.currentTarget;if(b.disabled)return;b.disabled=true;setTimeout(function(){b.disabled=false},1200);
    var code=(cont.querySelector("#oc-lib-code").value||"").trim().toUpperCase();
    if(!code){msg.style.color="var(--rojo,#a3392a)";msg.textContent="Escribe el codigo que te enviaron.";return}
    var base=_ocWorkerBase();
    if(!base){msg.style.color="var(--rojo,#a3392a)";msg.textContent="No hay conexion configurada. Contacta a soporte.";return}
    msg.style.color="var(--ink-soft,#5d5340)";msg.textContent="Verificando...";
    try{
      var resp=await fetch(base+"/verificar-liberacion",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({instanceId:inst,licenseCode:lic,code:code})});
      var r={};try{r=await resp.json()}catch(_){}
      if(resp.ok&&r&&r.ok===true){msg.style.color="var(--verde-suave,#2f7a4f)";msg.textContent="Codigo valido. Fija tu PIN y password.";cont.querySelector("#oc-lib-paso2").style.display="block"}
      else{msg.style.color="var(--rojo,#a3392a)";msg.textContent=(r&&r.error)||"Codigo invalido o expirado."}
    }catch(_){msg.style.color="var(--rojo,#a3392a)";msg.textContent="Sin conexion. Intenta de nuevo."}
  });
  cont.querySelector("#oc-lib-fijar").addEventListener("click",async function(ev){
    var b=ev.currentTarget;if(b.disabled)return;b.disabled=true;setTimeout(function(){b.disabled=false},1000);
    var pin=(cont.querySelector("#oc-lib-pin").value||"").trim();
    var pass=cont.querySelector("#oc-lib-pass").value||"";
    if(!/^\d{3}$/.test(pin)){msg.style.color="var(--rojo,#a3392a)";msg.textContent="El PIN debe ser 3 digitos.";return}
    if(String(pass).length<6){msg.style.color="var(--rojo,#a3392a)";msg.textContent="La password debe tener al menos 6 caracteres.";return}
    await window.OCSecure.fijarOwnerPin(pin);
    await window.OCSecure.fijarOwnerPassword(pass);
    msg.style.color="var(--verde-suave,#2f7a4f)";msg.textContent="Listo. Entra con tu PIN nuevo.";
    cont.luego(function(){cont.cerrar();try{$("oc-msg").textContent=""}catch(_){}},1600);
  });
}
function abrirReidentificarme(){const cont=_ocSubgate("oc-rid-modal");if(!cont)return;cont.innerHTML='<div class="caja" style="'+_ocCaja()+'">'+'<h2 style="font-family:var(--font-display,sans-serif);color:var(--ink,#211c14) !important;-webkit-text-fill-color:var(--ink,#211c14) !important;font-size:20px;margin:0 0 4px;">Reidentificarme como dueño/a</h2>'+'<p style="font-size:14px;color:var(--ink-soft,#5d5340) !important;-webkit-text-fill-color:var(--ink-soft,#5d5340) !important;margin:0 0 12px;">Si sabes tu licencia, tu cédula y tu correo registrados, no necesitas esperar a nadie: te reconocemos como dueño/a de tu negocio ahora mismo.</p>'+'<input id="oc-rid-lic" type="text" autocomplete="off" placeholder="Licencia (AMG-XXXX-XXXX-XXXX)" style="'+_ocIn()+'font-family:var(--font-mono,monospace);text-align:center;text-transform:uppercase;">'+'<input id="oc-rid-cedula" type="text" inputmode="numeric" autocomplete="off" placeholder="Cédula o pasaporte" style="'+_ocIn()+'">'+'<input id="oc-rid-email" type="email" inputmode="email" autocomplete="off" placeholder="Correo registrado" style="'+_ocIn()+'">'+'<button id="oc-rid-ok" style="'+_ocBtn()+'">Verificar mi identidad</button>'+'<button id="oc-rid-cancel" style="background:none;border:none;color:var(--azul-medio,#2c4a68) !important;-webkit-text-fill-color:var(--azul-medio,#2c4a68) !important;font-size:14px;cursor:pointer;padding:8px;">Cancelar</button>'+'<div id="oc-rid-paso2" style="display:none;margin-top:12px;border-top:1px solid #e5ddca;padding-top:12px;">'+'<p style="font-size:13px;font-weight:700;color:var(--ink,#211c14) !important;-webkit-text-fill-color:var(--ink,#211c14) !important;margin:0 0 10px;">Opcional: cambiar PIN y/o password para este dispositivo</p>'+'<input id="oc-rid-pin" type="tel" inputmode="numeric" maxlength="3" placeholder="PIN nuevo (3 digitos, opcional)" style="'+_ocIn()+'font-family:var(--font-mono,monospace);text-align:center;letter-spacing:6px;">'+'<input id="oc-rid-pass" type="password" placeholder="Password nueva (opcional, min 6)" style="'+_ocIn()+'">'+'<button id="oc-rid-fijar" style="'+_ocBtn()+'background:var(--verde-suave,#2f7a4f);border-color:var(--verde-suave,#2f7a4f);">Guardar y entrar</button>'+'</div>'+'<p id="oc-rid-msg" style="min-height:18px;font-size:14px;font-weight:700;margin:8px 0 0;"></p>'+'</div>';document.body.appendChild(cont);_ocPonerOjitos(cont);_ocMascaraLicencia(cont.querySelector("#oc-rid-lic"));const msg=cont.querySelector("#oc-rid-msg");let _licVerificada="";cont.querySelector("#oc-rid-cancel").addEventListener("click",()=>cont.cerrar());cont.querySelector("#oc-rid-ok").addEventListener("click",async(ev)=>{const b=ev.currentTarget;if(b.disabled)return;b.disabled=true;setTimeout(()=>{b.disabled=false},1200);const lic=(cont.querySelector("#oc-rid-lic").value||"").trim();const cedula=(cont.querySelector("#oc-rid-cedula").value||"").trim();const email=(cont.querySelector("#oc-rid-email").value||"").trim();if(!lic||!cedula||!email){msg.style.color="var(--rojo,#a3392a)";msg.textContent="Completa los 3 campos.";return}const base=_ocWorkerBase();if(!base){msg.style.color="var(--rojo,#a3392a)";msg.textContent="No hay conexion configurada. Intenta mas tarde.";return}msg.style.color="var(--ink-soft,#5d5340)";msg.textContent="Verificando...";try{const resp=await fetch(base+"/verificar-identidad",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({licenseCode:lic,cedula:cedula,email:email})});let r={};try{r=await resp.json()}catch(_){}if(resp.ok&&r&&r.ok===true){_licVerificada=lic.toUpperCase();msg.style.color="var(--verde-suave,#2f7a4f)";msg.textContent="Identidad confirmada. Fija tu PIN y password para este dispositivo.";cont.querySelector("#oc-rid-paso2").style.display="block"}else{msg.style.color="var(--rojo,#a3392a)";msg.textContent=(r&&r.error)||"No se pudo verificar."}}catch(_){msg.style.color="var(--rojo,#a3392a)";msg.textContent="Sin conexion. Intenta de nuevo."}});cont.querySelector("#oc-rid-fijar").addEventListener("click",async(ev)=>{const b=ev.currentTarget;if(b.disabled)return;b.disabled=true;setTimeout(()=>{b.disabled=false},1000);const pin=(cont.querySelector("#oc-rid-pin").value||"").trim();const pass=cont.querySelector("#oc-rid-pass").value||"";if(pin&&!/^\d{3}$/.test(pin)){msg.style.color="var(--rojo,#a3392a)";msg.textContent="El PIN debe ser 3 digitos, o dejalo vacio para no cambiarlo.";return}if(pass&&String(pass).length<6){msg.style.color="var(--rojo,#a3392a)";msg.textContent="La password debe tener al menos 6 caracteres, o dejala vacia para no cambiarla.";return}if(pin)await window.OCSecure.fijarOwnerPin(pin);if(pass)await window.OCSecure.fijarOwnerPassword(pass);try{let owned={};try{owned=JSON.parse(localStorage.getItem("amigable_owned")||"null")||{}}catch(_){owned={}}if(!owned.instanceId)owned.instanceId=(globalThis.crypto&&globalThis.crypto.randomUUID)?globalThis.crypto.randomUUID():Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);owned.licenseCode=_licVerificada;const licInput=(cont.querySelector("#oc-rid-lic").value||"").trim().toUpperCase();if(licInput===_licVerificada)owned.licenseCode=_licVerificada;owned.email=(cont.querySelector("#oc-rid-email").value||"").trim();owned.cedula=(cont.querySelector("#oc-rid-cedula").value||"").trim();owned.activatedAt=owned.activatedAt||Date.now();localStorage.setItem("amigable_owned",JSON.stringify(owned));if(window.OCSyncControl)window.OCSyncControl.activar(owned.licenseCode);if(typeof enviarHeartbeatLicencia==="function")enviarHeartbeatLicencia({instanceId:owned.instanceId,licenseCode:owned.licenseCode,email:owned.email,cedula:owned.cedula,activatedAt:owned.activatedAt,accion:"reidentificado"});}catch(_){}msg.style.color="var(--verde-suave,#2f7a4f)";msg.textContent=pin?"Listo. Este dispositivo ya es tuyo. Entra con tu PIN nuevo.":"Listo. Este dispositivo ya es tuyo. Entra con tu PIN de siempre.";cont.luego(()=>{cont.cerrar();try{$("oc-msg").textContent=""}catch(_){}},1800);});}function montarLogout(){if(document.getElementById("oc-logout"))return;const header=document.querySelector("header");if(!header)return;const chipPrevio=document.getElementById("oc-user-chip");if(chipPrevio)chipPrevio.remove();const rolChipPrevio=document.getElementById("oc-rol-chip");if(rolChipPrevio)rolChipPrevio.remove();const b=document.createElement("button");b.id="oc-logout";b.textContent="Salir";b.addEventListener("click",()=>cerrarSesion());if(window.OCCurrentUser&&window.OCCurrentUser.nombre){const chip=document.createElement("span");chip.id="oc-user-chip";chip.textContent=window.OCCurrentUser.nombre;chip.style.cssText="font-size:13px;font-weight:700;color:var(--ink,#211c14) !important;"+"-webkit-text-fill-color:var(--ink,#211c14) !important;margin-right:6px;"+"padding:4px 10px;background:var(--amarillo-claro,#fff3c4);border-radius:20px;";header.appendChild(chip)}const _rolTxt={dueno:"Dueño/a de la licencia",admin:"Admin",empleado:"Empleado/a",contador:"Contador/a"}[rol]||"";if(_rolTxt&&!demoSesion){const rc=document.createElement("span");rc.id="oc-rol-chip";rc.textContent=_rolTxt;rc.style.cssText="font-size:12px;font-weight:700;color:#fff !important;-webkit-text-fill-color:#fff !important;margin-right:6px;padding:4px 10px;background:var(--rust,#E86040);border-radius:20px;text-transform:uppercase;letter-spacing:.03em;";header.appendChild(rc)}header.appendChild(b)}function enmascarar(email){const[u,dom]=String(email).split("@");if(!dom)return"•••";return`${u.slice(0,1)}${"•".repeat(Math.max(2,u.length-1))}@${dom}`}window.OCAuth={mascaraLicencia:_ocMascaraLicencia,rolActual:()=>rol,esDemo:()=>demoSesion,enmascarar:enmascarar,pedirPasswordInicial:pedirPasswordInicial,tieneOwnerPassword:()=>!!(window.OCSecure&&window.OCSecure.tieneOwnerPassword&&window.OCSecure.tieneOwnerPassword()),listo:()=>listo,abrirFlujoReset:abrirFlujoReset,workerUrl:()=>(localStorage.getItem("amigable_cf_worker_url")||"").trim()||CF_WORKER_URL_DEFAULT,pedirSubclaveContable(){return new Promise(resolve=>{const cont=_ocSubgate("oc-sc-modal",{alCerrar:()=>resolve(false)});if(!cont){resolve(false);return}cont.innerHTML=`<div class="caja" style="background:var(--blanco-calido,#fbf5e8);border:2px solid var(--brass,#9c7a35);border-radius:8px;padding:26px 22px;max-width:420px;width:100%;text-align:center;">\n          <h2 style="font-family:var(--font-display,sans-serif);color:var(--ink,#211c14);font-size:22px;margin:0 0 4px;">Capa contable</h2>\n          <div class="sub" style="font-size:14px;color:var(--ink-soft,#5d5340);margin-bottom:18px;">Subclave de 3 dígitos para ver cuentas T, P&amp;G y balance</div>\n          <div class="oc-slots" id="oc-slots2"><div class="slot"></div><div class="slot"></div><div class="slot"></div></div>\n          <div class="oc-pad" id="oc-pad2"></div>\n          <div class="oc-acciones"><button id="sc-cancelar">Cancelar</button><button id="sc-borrar">Borrar</button></div>\n          <div class="oc-msg" id="oc-msg2"></div></div>`;document.body.appendChild(cont);let tec;async function alCompletar(code){if(await window.OCSecure.verificarAcct(code)){resolve(true);cont.cerrar()}else{cont.querySelector("#oc-msg2").textContent="Subclave incorrecta.";cont.classList.add("err");setTimeout(()=>cont.classList.remove("err"),400);tec=montarTeclado(cont.querySelector("#oc-pad2"),cont.querySelector("#oc-slots2"),alCompletar)}}tec=montarTeclado(cont.querySelector("#oc-pad2"),cont.querySelector("#oc-slots2"),alCompletar);cont.querySelector("#sc-borrar").addEventListener("click",()=>tec.reset());cont.querySelector("#sc-cancelar").addEventListener("click",()=>cont.cerrar())})}}})();