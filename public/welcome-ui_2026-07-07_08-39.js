// welcome-ui.js — Mensaje de bienvenida para first-timers (JFC 2026-07-02).
// AMIGABLE (demo de Amigable). Aparece UNA sola vez, tras el primer login
// exitoso (escucha "oc-login"), y marca un flag en localStorage para no
// repetirse. Aquí conviven, sin chocar, el slogan informal de la línea
// ("tu negocio, a color") y el nombre formal ("Amigable: punto de venta y
// control de inventario") con su variante ("control de lo que ya es suyo").
//
// Reglas de legibilidad (CLAUDE.md): colores sólidos hex, sin opacidad en
// texto, tamaños >=13px, color + -webkit-text-fill-color con !important y
// bloque prefers-color-scheme:dark repetido para que iOS/WhatsApp no oscurezca.
(function () {
  'use strict';

  const FLAG = 'amigable_bienvenida_v2'; // subir versión = volver a mostrarla

  const css = document.createElement('style');
  css.textContent = `
  #am-welcome{position:fixed;inset:0;z-index:9997;background:#1c3049;
    display:none;align-items:center;justify-content:center;padding:20px;}
  #am-welcome.abierto{display:flex;}
  #am-welcome-card{background:#fbf5e8;width:100%;max-width:440px;border-radius:18px;
    padding:30px 24px 26px;text-align:center;box-shadow:0 12px 40px #10203a;}
  #am-welcome .marca{font-family:var(--font-display,sans-serif);font-size:15px;font-weight:700;
    letter-spacing:.14em;text-transform:uppercase;color:#5d5340 !important;-webkit-text-fill-color:#5d5340 !important;margin:0 0 6px;}
  #am-welcome h2{font-family:var(--font-display,sans-serif);font-size:27px;font-weight:700;line-height:1.15;
    color:#211c14 !important;-webkit-text-fill-color:#211c14 !important;margin:0 0 12px;}
  #am-welcome .tagline{font-family:var(--font-display,sans-serif);font-size:22px;font-weight:700;
    color:#E8A020 !important;-webkit-text-fill-color:#E8A020 !important;margin:0 0 4px;}
  #am-welcome .formal{font-family:var(--font-mono,monospace);font-size:14px;
    color:#5d5340 !important;-webkit-text-fill-color:#5d5340 !important;margin:0 0 18px;}
  #am-welcome .cuerpo{font-family:var(--font-body,sans-serif);font-size:16px;line-height:1.5;
    color:#211c14 !important;-webkit-text-fill-color:#211c14 !important;margin:0 0 22px;}
  #am-welcome button{width:100%;min-height:48px;padding:14px;border-radius:9px;border:2px solid #b2461f;
    background:#b2461f;color:#fbf5e8 !important;-webkit-text-fill-color:#fbf5e8 !important;
    font-family:var(--font-display,sans-serif);font-size:16px;font-weight:700;cursor:pointer;}
  /* "Ver la guia": secundario (outline) sobre el primario "Empezar" */
  #am-welcome button#am-welcome-guia{background:transparent;color:#b2461f !important;-webkit-text-fill-color:#b2461f !important;margin:0 0 10px;}
  @media (prefers-color-scheme: dark){
    #am-welcome-card{background:#fbf5e8;}
    #am-welcome .marca{color:#5d5340 !important;-webkit-text-fill-color:#5d5340 !important;}
    #am-welcome h2, #am-welcome .cuerpo{color:#211c14 !important;-webkit-text-fill-color:#211c14 !important;}
    #am-welcome .tagline{color:#E8A020 !important;-webkit-text-fill-color:#E8A020 !important;}
    #am-welcome .formal{color:#5d5340 !important;-webkit-text-fill-color:#5d5340 !important;}
    #am-welcome button{color:#fbf5e8 !important;-webkit-text-fill-color:#fbf5e8 !important;}
    #am-welcome button#am-welcome-guia{color:#b2461f !important;-webkit-text-fill-color:#b2461f !important;}
  }
  @media (prefers-reduced-motion: no-preference){
    #am-welcome.abierto #am-welcome-card{animation:amwin .28s ease;}
    @keyframes amwin{from{transform:translateY(14px);}to{transform:translateY(0);}}
  }`;
  document.head.appendChild(css);

  const modal = document.createElement('div');
  modal.id = 'am-welcome';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div id="am-welcome-card" role="dialog" aria-label="Bienvenida">
      <p class="marca">Amigable-123</p>
      <h2>Bienvenido</h2>
      <p class="tagline">Tu negocio, a color</p>
      <p class="formal">Punto de venta y control de inventario</p>
      <p class="cuerpo">Manejar tu negocio no tiene por qué ser aburrido ni abrumador. Aquí tus productos hablan en colores que se encienden solos cuando hay que actuar: verde si todo marcha bien, dorado si hay dinero esperándote, rojo si toca actuar ya. Funciona sin internet, tus datos son solo tuyos, y no hay suscripciones ni anuncios de nadie.</p>
      <button id="am-welcome-guia">Ver la guía</button>
      <button id="am-welcome-ok">Empezar</button>
    </div>`;
  document.body.appendChild(modal);

  function cerrar() {
    modal.classList.remove('abierto');
    try { localStorage.setItem(FLAG, '1'); } catch (_) { /* modo privado: se mostrará otra vez, aceptable */ }
  }
  document.getElementById('am-welcome-ok').addEventListener('click', cerrar);
  // "Ver la guia" cierra la bienvenida (queda marcada como vista) y abre la
  // Ayuda completa via la API de help-ui.js. La Ayuda sigue siempre
  // disponible en el boton (?) — esto es solo el atajo del primer minuto.
  document.getElementById('am-welcome-guia').addEventListener('click', () => {
    cerrar();
    if (window.OCHelp && window.OCHelp.abrir) window.OCHelp.abrir();
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

  function quizasMostrar() {
    let visto = false;
    try { visto = localStorage.getItem(FLAG) === '1'; } catch (_) {}
    if (!visto) modal.classList.add('abierto');
  }

  // Tras el primer login exitoso. Si el usuario ya entró antes de que cargara
  // este script, un chequeo diferido cubre el caso.
  window.addEventListener('oc-login', quizasMostrar);
  setTimeout(() => { if (window.OCAuth && window.OCAuth.rolActual && window.OCAuth.rolActual()) quizasMostrar(); }, 1200);
})();
