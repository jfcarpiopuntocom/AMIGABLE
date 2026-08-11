/* ═══════════════════════════════════════════════════════════════════════════
   help-ui.js — DISEÑO APROBADO POR JFC (2026-07-12). LEER ANTES DE TOCAR.
   ═══════════════════════════════════════════════════════════════════════════
   PROPÓSITO: Renderiza el modal de Ayuda + el bloque "brandWrap" (#oc-brand-help)
   que contiene EL LOGO PRINCIPAL de AMIGABLE y el botón "Ayuda (?)".

   ESTRUCTURA DEL #oc-brand-help (NO CAMBIAR):
     <div id="oc-brand-help">          ← flex-direction:column, align-items:flex-end
       <img src="./logo.png">          ← logo amigable-123, height:22px, clickeable (va a Hoy)
       <button id="oc-help-btn">       ← "Ayuda (?)", font-size:13px, underlined
     </div>

   DÓNDE APARECE EN LA UI:
     - Se inserta en el DOM DESPUÉS del botón #oc-logout (SALIR) en el header,
       vía logout.insertAdjacentElement("afterend", brandWrap) en el listener oc-login.
     - En mobile queda como 3ra fila del header flex-wrap — eso es INTENCIONAL.
       El logo real (grande) vive AQUÍ, no en el .sello del header principal.
     - El .sello del header tiene un watermark pequeño (104×26px) que es casi
       invisible — el brandWrap es la identidad visual prominente.

   LO QUE NO DEBES CAMBIAR NUNCA:
     ❌ NO ocultar el <img> dentro de brandWrap — ese es EL logo real de AMIGABLE.
     ❌ NO cambiar flex-direction a "row" — rompe el diseño (logo arriba, ayuda abajo).
     ❌ NO mover la inserción a otro elemento que no sea afterend de #oc-logout.
     ❌ NO agregar CSS en index.html que oculte #oc-brand-help img o cambie su layout.
     ❌ NO copiar el brandWrap a otro lugar — solo existe uno.

   INCIDENTE 2026-07-15: Un agente ocultó el img de brandWrap y cambió el .sello
     del header a background:#ffffff — resultado: logo duplicado, pastilla blanca fea,
     interfaz apachurrada en mobile. JFC se enojó mucho. Revertido en commit 95735f1.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){const AYUDA_HABILITADA=true;if(!AYUDA_HABILITADA)return;const css=document.createElement("style");css.textContent=`\n  #oc-help-btn{display:none;margin-top:6px;background:none;border:none;\n    font-family:var(--font-display,sans-serif);font-size:13px;color:var(--blanco-calido,#F8F9FB);\n    text-decoration:underline;cursor:pointer;padding:4px;}\n  #oc-help-modal{position:fixed;inset:0;z-index:9998;background:rgba(28,48,73,.85);\n    display:none;align-items:flex-end;justify-content:center;padding:0;}\n  #oc-help-modal.abierto{display:flex;}\n  #oc-help-sheet{background:var(--blanco-calido,#F8F9FB);width:100%;max-width:520px;max-height:82vh;\n    overflow-y:auto;border-radius:16px 16px 0 0;padding:22px 20px 28px;}\n  #oc-help-sheet h2{font-family:var(--font-display,sans-serif);color:var(--ink,#0F1923);margin:0 0 4px;font-size:22px;}\n  #oc-help-sheet .rolTag{display:inline-block;font-size:13px;font-weight:700;padding:3px 10px;border-radius:12px;\n    margin-bottom:14px;background:var(--azul-medio,#2E6278);color:var(--blanco-calido,#F8F9FB);}\n  #oc-help-sheet h3{font-family:var(--font-display,sans-serif);color:var(--ink,#0F1923);font-size:16px;margin:18px 0 6px;}\n  #oc-help-sheet p, #oc-help-sheet li{font-size:15px;color:var(--ink-soft,#2C3E50);line-height:1.5;}\n  #oc-help-sheet ul{margin:0 0 4px;padding-left:20px;}\n  
  #oc-help-sheet{position:relative;}
  #oc-help-x{position:sticky; top:0; float:right; margin:-6px -4px 0 0;
    width:44px; height:44px; min-width:44px; border-radius:50%; z-index:5;
    border:2px solid var(--azul-medio,#2E6278); background:var(--blanco-calido,#F8F9FB);
    color:var(--ink,#0F1923); font-size:22px; font-weight:800; line-height:1;
    cursor:pointer; display:flex; align-items:center; justify-content:center;}
  #oc-help-x:active{background:var(--azul-medio,#2E6278); color:#FFFFFF;}
  #oc-help-credito{margin-top:22px; padding-top:14px; border-top:1px solid var(--azul-suave,#dde5ec);
    font-size:14px; line-height:1.5; text-align:center; color:var(--ink-soft,#2C3E50);}
  #oc-help-cerrar{margin-top:18px;width:100%;padding:12px;border-radius:8px;border:2px solid var(--azul-medio,#2E6278);\n    background:var(--azul-medio,#2E6278);color:var(--blanco-calido,#F8F9FB);font-family:var(--font-display,sans-serif);\n    font-size:15px;cursor:pointer;min-height:44px;}\n  `;document.head.appendChild(css);const AYUDA_DUENO=`
    <span class="rolTag">Guía del dueño</span>
    <h3>Qué es amigable-123</h3>
    <p style="font-size:14px;line-height:1.6;margin:0 0 10px;">
      No es una caja registradora. Es un sistema de gestión de inventario para vendedores,
      promotores y comisiones — organizado en torno a <b>perchas</b> (tus espacios, perchas
      físicas o ubicaciones) como unidad esencial. Los colores reemplazan las hojas de
      cálculo. Tus datos viven en este dispositivo: sin nube obligatoria, sin riesgo de
      perder acceso por una suscripción.
    </p>
    <h3>El lenguaje de colores (sistema Simon)</h3>
    <ul>
      <li><b style="color:#00C87A;">Verde</b>: saludable — sigue así.</li>
      <li><b style="color:#E8A020;">Dorado</b>: hay dinero esperándote — actúa.</li>
      <li><b style="color:#F97316;">Naranja</b>: se acaba — reabastece antes de que sea emergencia.</li>
      <li><b style="color:#E8365D;">Rojo</b>: emergencia — actúa ya.</li>
      <li><b style="color:#0A0A0F;">Negro</b>: inventario muerto — tu dinero no se mueve. Cámbialo.</li>
    </ul>
    <p style="font-size:14px;color:var(--ink-soft);">El <b style="color:#5294AC;">azul</b> es distinto a propósito: nunca es una señal de stock. Solo aparece en secciones serenas — notas contables y reflexiones financieras breves.</p>
    <h3>Hoy: tu señal diaria</h3>
    <ul>
      <li>Un vistazo a Hoy te dice qué atender antes de abrir.</li>
      <li>El color del encabezado refleja el estado general del día.</li>
      <li>¿No registraste en vivo? Usa el Cierre del día para aplicar todo junto.</li>
    </ul>
    <h3>Vendido (registro, no venta)</h3>
    <ul>
      <li>Toca un producto en la cuadrícula — una unidad registrada como vendida. Deshacer en 5 segundos.</li>
      <li>Cada movimiento queda registrado con motivo y quién lo hizo.</li>
      <li>Las comisiones se calculan automáticamente por percha y por vendedor.</li>
    </ul>
    <h3>Avanzado (tu candado, tus reglas)</h3>
    <ul>
      <li><b>Gastos fijos</b>: arriendo, servicios, sueldos — divididos en 30 días para saber el costo real de abrir mañana.</li>
      <li><b>Capa contable</b>: cuentas T, pérdidas y ganancias, balance. PIN aparte — tu contador o socio puede entrar directo sin ver el sistema completo.</li>
      <li><b>Claves y recuperación</b>: guarda tu correo antes de cambiar cualquier clave. Sin correo registrado no hay recuperación posible.</li>
    </ul>
    <h3>¿Qué datos salen de este dispositivo?</h3>
    <p style="font-size:14px;line-height:1.6;margin:0 0 10px;">
      Respuesta corta: los datos de tu negocio, nunca. Productos, ventas, clientes,
      inventario, fotos — todo se queda en este navegador, en este dispositivo, siempre.
      Lo único que se envía a algún lado es tu <b>licencia</b>: un ID aleatorio del
      dispositivo, y (solo si decidiste ingresarlos) tu nombre, correo, código de licencia
      y número de WhatsApp — para poder recuperar tu acceso o contactarte si hace falta.
      Nada más, nunca, bajo ninguna funcionalidad. Ver
      <a href="https://github.com/jfcarpiopuntocom/AMIGABLE/blob/main/PRIVACY.md" target="_blank" rel="noopener" style="color:#5294AC;">PRIVACY.md</a>
      para el detalle completo, o abre DevTools → Network y compruébalo tú mismo/a.
    </p>
    <h3>Propiedad y actualizaciones</h3>
    <p style="font-size:14px;line-height:1.6;margin:0 0 14px;">
      Tus datos viven en este dispositivo — ningún servidor los tiene, ninguna suscripción
      te los puede quitar. La activación desbloquea productos y exportaciones ilimitadas,
      con parches y actualizaciones incluidos durante toda la <b>licencia de 5 años</b>.
    </p>
    <h3>La promesa</h3>
    <ul style="font-size:14px;line-height:1.6;">
      <li>Te ahorra <b>50% de tu tiempo</b> comparado con hacerlo a mano.</li>
      <li>Se aprende <b>en 10 minutos</b> — sin manual necesario.</li>
      <li><b>Licencia de 5 años</b>, con soporte directo incluido todo ese tiempo.</li>
    </ul>
    <h3>Tu licencia</h3>
    <p style="font-size:14px;line-height:1.6;margin:0 0 14px;">
      Licencia privada de 5 años, con cumplimiento consensuado
      y sin invocar propiedad intelectual en tu contra. La app en sí vive en
      nuestro sitio web — pero todo lo que tú ingresas se mantiene solamente
      en tus dispositivos. Nunca sube a ninguna "nube" ni servidor central.
    </p>
    <button id="oc-help-ver-bienvenida" style="width:100%;min-height:44px;padding:10px;border-radius:8px;
      border:2px solid var(--azul-medio,#2E6278);background:transparent;color:var(--azul-medio,#2E6278);
      font-family:var(--font-display,sans-serif);font-size:14px;font-weight:700;cursor:pointer;">
      Hacer el tutorial guiado
    </button>
  `;const AYUDA_EMPLEADO=`
    <span class="rolTag">Guía del empleado/a</span>
    <h3>Los colores te dicen qué pasa</h3>
    <ul>
      <li><b style="color:#00C87A;">Verde</b>: bien. <b style="color:#E8A020;">Dorado</b>: hay dinero ahí. <b style="color:#F97316;">Naranja</b>: avisa al dueño pronto. <b style="color:#E8365D;">Rojo</b>: avisa ya.</li>
      <li><b style="color:#0A0A0F;">Negro</b>: no se mueve — avísale al dueño.</li>
      <li>No necesitas interpretar nada — el color hace el trabajo.</li>
    </ul>
    <h3>Tu turno en 3 pasos</h3>
    <ul>
      <li><b>Hoy</b>: revisa el resumen al entrar. Si hay rojo, avisa de inmediato.</li>
      <li><b>Vendido</b>: toca el producto en la cuadrícula — una unidad registrada. Deshacer en 5 segundos. También puedes escanear o escribir el código.</li>
      <li><b>Ajustar</b>: algo se rompió, venció o el conteo estaba mal — usa Ajustar y escribe el motivo. Queda registrado.</li>
    </ul>
    <h3>Etiquetas</h3>
    <p>¿Necesitas reimprimir una etiqueta perdida o dañada? Búscala por nombre o código en la pestaña Etiquetas.</p>
  `;const modal=document.createElement("div");modal.id="oc-help-modal";modal.innerHTML=`<div id="oc-help-sheet">
    <button id="oc-help-x" aria-label="Cerrar" title="Cerrar">&times;</button>\n    \x3c!-- Branding amigable-123 dentro de Ayuda: buen lugar para presentarse (JFC 2026-07-10).\n         onerror oculta la imagen si logo.png no está, sin romper el modal. --\x3e\n    <img src="./logo.png" alt="amigable-123" style="height:38px;width:auto;object-fit:contain;display:block;margin:0 auto 12px;"\n         onerror="this.style.display='none';">\n    <h2>¿Cómo funciona amigable-123?</h2>\n    \x3c!-- Slogan de Amigable (JFC 2026-07-02): "administra tu negocio, a color".\n         Va aquí y en la bienvenida (welcome-ui.js). El formal "Amigable: punto\n         de venta y control de inventario" vive en el footer y la bienvenida. --\x3e\n    <p style="font-family:var(--font-display,sans-serif);color:#E86040;font-size:17px;font-weight:700;margin:0 0 4px;">Deja de adivinar. Empieza a ver.</p><p style="font-family:var(--font-display,sans-serif);color:#E8A020;font-size:14px;font-weight:700;margin:0 0 14px;">Administra tu negocio, a color</p>\n    <div id="oc-help-body"></div>
    <div id="oc-help-credito">Made in Cuenca :apps y herramientas: &mdash; powered by <a href="https://jfcarpio.com" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">jfcarpio.com</a> y <a href="https://avatiun.com" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">avatiun.com</a></div>\n    <button id="oc-help-cerrar">Entendido</button>\n  </div>`;document.body.appendChild(modal);const btn=document.createElement("button");btn.id="oc-help-btn";btn.textContent="Ayuda (?)";const brandWrap=document.createElement("div");brandWrap.id="oc-brand-help";brandWrap.style.cssText="display:none;flex-direction:column;align-items:flex-end;gap:2px;margin-left:10px;";const brandLogo=document.createElement("img");brandLogo.src="./logo.png";brandLogo.alt="amigable-123";brandLogo.title="Ir a Hoy";brandLogo.style.cssText="height:22px;width:auto;object-fit:contain;display:block;cursor:pointer;";brandLogo.onerror=function(){this.style.display="none"};brandLogo.addEventListener("click",()=>{const hoy=document.querySelector('nav button[data-vista="hoy"]');if(hoy)hoy.click()});brandWrap.appendChild(brandLogo);btn.style.marginTop="0";brandWrap.appendChild(btn);function abrir(){const rol=window.OCAuth?window.OCAuth.rolActual():null;document.getElementById("oc-help-body").innerHTML=rol==="empleado"?AYUDA_EMPLEADO:AYUDA_DUENO;if(rol!=="empleado"){try{const owned=JSON.parse(localStorage.getItem("amigable_owned")||"null");const bloqLic=document.getElementById("oc-help-licencia");const codeEl=document.getElementById("oc-help-amg-code");if(bloqLic&&codeEl&&owned&&owned.licenseCode){codeEl.textContent=owned.licenseCode;bloqLic.style.display="block"}}catch(_){}}modal.classList.add("abierto")}btn.addEventListener("click",abrir);window.OCHelp={abrir:abrir};document.getElementById("oc-help-cerrar").addEventListener("click",()=>modal.classList.remove("abierto"));
  try{const _x=document.getElementById("oc-help-x"); if(_x) _x.onclick=()=>document.getElementById("oc-help-modal").classList.remove("abierto");}catch(e){}modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("abierto")});document.getElementById("oc-help-body").addEventListener("click",e=>{if(e.target&&e.target.id==="oc-help-ver-bienvenida"){modal.classList.remove("abierto");if(window.OCTutorial&&window.OCTutorial.iniciar)window.OCTutorial.iniciar();else if(window.OCWelcome&&window.OCWelcome.abrir)window.OCWelcome.abrir()}});window.addEventListener("oc-login",()=>{const logout=document.getElementById("oc-logout");if(logout&&logout.parentNode&&!document.body.contains(brandWrap)){logout.insertAdjacentElement("afterend",brandWrap)}brandWrap.style.display="flex";btn.style.display="block"});window.addEventListener("oc-logout",()=>{brandWrap.remove();modal.classList.remove("abierto")})})();
