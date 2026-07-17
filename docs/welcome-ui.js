(function(){"use strict";
const FLAG="amigable_bienvenida_v3"; // subir version = volver a mostrarla
// v3 (2026-07-16): bug corregido — auth-ui.js marcaba esta flag como "vista"
// en el momento de activar (antes de que el wizard se mostrara ni una vez).
// Subir la version fuerza a que TODOS los dispositivos ya activados (incluidos
// clientes reales de JFC) vean el wizard de verdad al menos una vez.
const FLAG_CONFIRMADO="amigable_bienvenida_confirmada"; // 2do login: exige confirmar, no solo cerrar
const css=document.createElement("style");
css.textContent=`
  .am-welcome-overlay{position:fixed;inset:0;z-index:9997;background:var(--azul-oscuro,#0F1923);
    display:none;align-items:center;justify-content:center;padding:20px;}
  .am-welcome-overlay.abierto{display:flex;}
  .am-welcome-card{background:var(--blanco-calido,#F8F9FB);width:100%;max-width:440px;border-radius:14px;
    border:2px solid var(--sim-plata,#C4CDD8);border-top:4px solid var(--brass,#5294AC);
    padding:30px 24px 26px;text-align:center;box-shadow:0 12px 40px #060d14;}
  .am-welcome-overlay .marca{font-family:var(--font-mono,monospace);font-size:14px;font-weight:700;
    letter-spacing:.14em;text-transform:uppercase;color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;margin:0 0 6px;}
  .am-welcome-overlay h2{font-family:var(--font-display,sans-serif);font-size:27px;font-weight:700;line-height:1.15;
    color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:0 0 12px;}
  .am-welcome-overlay .tagline{font-family:var(--font-display,sans-serif);font-size:22px;font-weight:700;
    color:#E86040 !important;-webkit-text-fill-color:#E86040 !important;margin:0 0 4px;}
  .am-welcome-overlay .formal{font-family:var(--font-mono,monospace);font-size:14px;
    color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;margin:0 0 18px;}
  .am-welcome-overlay .cuerpo{font-family:var(--font-body,sans-serif);font-size:16px;line-height:1.5;
    color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:0 0 22px;}
  .am-welcome-overlay button{width:100%;min-height:48px;padding:14px;border-radius:9px;border:2px solid var(--brass,#5294AC);
    background:var(--azul-oscuro,#0F1923);color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;
    font-family:var(--font-display,sans-serif);font-size:16px;font-weight:700;cursor:pointer;}
  /* "Ver la guia": secundario (outline plata/azul) sobre el primario "Empezar" */
  .am-welcome-overlay button#am-welcome-guia{background:transparent;border-color:var(--azul-medio,#2E6278);
    color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;margin:0 0 10px;}
  @media (prefers-color-scheme: dark){
    .am-welcome-overlay{background:#0F1923;}
    .am-welcome-card{background:#F8F9FB;}
    .am-welcome-overlay .marca, .am-welcome-overlay .formal{color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;}
    .am-welcome-overlay .marca{color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;}
    .am-welcome-overlay h2, .am-welcome-overlay .cuerpo{color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;}
    .am-welcome-overlay .tagline{color:#E86040 !important;-webkit-text-fill-color:#E86040 !important;}
    .am-welcome-overlay button{color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;}
    .am-welcome-overlay button#am-welcome-guia{color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;}
  }
  @media (prefers-reduced-motion: no-preference){
    .am-welcome-overlay.abierto .am-welcome-card{animation:amwin .28s ease;}
    @keyframes amwin{from{transform:translateY(14px);}to{transform:translateY(0);}}
  }
  #am-rec-card label{display:flex;align-items:flex-start;gap:10px;text-align:left;font-family:var(--font-body,sans-serif);
    font-size:15px;line-height:1.4;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:0 0 20px;cursor:pointer;}
  #am-rec-card input[type=checkbox]{width:22px;height:22px;min-width:22px;margin-top:1px;accent-color:var(--brass,#5294AC);}
  .am-welcome-overlay button:disabled{background:#8B95A1;border-color:#8B95A1;color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;cursor:not-allowed;}
  @media (prefers-color-scheme: dark){
    #am-rec-card label{color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;}
  }`;
document.head.appendChild(css);

const modal=document.createElement("div");
modal.id="am-welcome";
modal.className="am-welcome-overlay";
modal.setAttribute("aria-hidden","true");
modal.innerHTML=`
    <div id="am-welcome-card" class="am-welcome-card" role="dialog" aria-label="Bienvenida">
      <p class="marca">Amigable-123</p>
      <h2>Bienvenido</h2>
      <p class="tagline">Administra tu negocio, a color</p>
      <p class="formal">Control de inventario, clientes y perchas</p>
      <p class="cuerpo">Manejar tu negocio no tiene por qué ser aburrido ni abrumador. Aquí tus productos hablan en colores que se encienden solos cuando hay que actuar: verde si todo marcha bien, dorado si hay dinero esperándote, rojo si toca actuar ya. Funciona sin internet, tus datos son solo tuyos, y no hay suscripciones ni anuncios de nadie.</p>
      <button id="am-welcome-guia">Ver la guía</button>
      <button id="am-welcome-ok">Empezar</button>
    </div>`;
document.body.appendChild(modal);

// Recordatorio (2do login sin confirmar): a diferencia del modal de arriba,
// este NO se puede cerrar clickeando afuera ni con un boton neutro — exige
// tildar el checkbox para habilitar "Continuar". Intencional (JFC 2026-07-16):
// "es mejor cargosearles" que dejar que alguien distraido se lo salte.
const reminder=document.createElement("div");
reminder.id="am-welcome-reminder";
reminder.className="am-welcome-overlay";
reminder.setAttribute("aria-hidden","true");
reminder.innerHTML=`
    <div id="am-rec-card" class="am-welcome-card" role="dialog" aria-label="Confirma que viste el tutorial de bienvenida">
      <p class="marca">Amigable-123</p>
      <h2>Un momento</h2>
      <p class="cuerpo" style="margin-bottom:16px;">Antes de continuar, confirma que ya viste el tutorial de bienvenida. Toma un minuto y es lo que hace que todo lo demás tenga sentido.</p>
      <label><input type="checkbox" id="am-rec-check"> Sí, ya utilicé el tutorial de bienvenida</label>
      <button id="am-rec-continuar" disabled>Continuar</button>
    </div>`;
document.body.appendChild(reminder);

function cerrar(){
  modal.classList.remove("abierto");
  try{localStorage.setItem(FLAG,"1")}catch(_){}
}
document.getElementById("am-welcome-ok").addEventListener("click",cerrar);
document.getElementById("am-welcome-guia").addEventListener("click",()=>{
  cerrar();
  if(window.OCHelp&&window.OCHelp.abrir)window.OCHelp.abrir();
});
modal.addEventListener("click",e=>{if(e.target===modal)cerrar()});

const recCheck=document.getElementById("am-rec-check");
const recBtn=document.getElementById("am-rec-continuar");
recCheck.addEventListener("change",()=>{recBtn.disabled=!recCheck.checked});
recBtn.addEventListener("click",()=>{
  if(recCheck.checked){
    try{localStorage.setItem(FLAG_CONFIRMADO,"1")}catch(_){}
    reminder.classList.remove("abierto");
  }
});
// Sin click-outside-to-close ni tecla Escape aqui a proposito: el candado
// de confirmacion es el punto entero de este modal.

function quizasMostrar(){
  let visto=false,confirmado=false;
  try{visto=localStorage.getItem(FLAG)==="1"}catch(_){}
  try{confirmado=localStorage.getItem(FLAG_CONFIRMADO)==="1"}catch(_){}
  if(!visto){modal.classList.add("abierto");return}
  if(!confirmado)reminder.classList.add("abierto");
}

// API para "Ver el tutorial de bienvenida nuevamente" en Ayuda (help-ui.js).
// Reabre el wizard completo sin tocar ninguna flag — es solo un replay.
window.OCWelcome={abrir:()=>modal.classList.add("abierto")};

window.addEventListener("oc-login",()=>{
  const gate=document.getElementById("oc-gate");
  if(gate&&gate.style.display!=="none")return;
  quizasMostrar();
});
})();
