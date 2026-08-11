// backup-scheduler.js — Backup soberano por correo y/o WhatsApp del propio
// dueño. NUNCA a un servidor central. Filosofía: "el backup va a ti, no a
// nosotros. Nunca sueltas control de tus datos."
//
// Portado desde friendly-123 (JFC 2026-07-21), adaptado: amigable-123 NO
// tiene sistema bilingüe (no hay OCI18n/window.t() en este repo, a
// diferencia de friendly-123) — este archivo es 100% español, sin
// ramas de idioma, igual que el resto de avanzado-extra.js aquí.
//
// ¿Por qué existe?  JFC (2026-07-21): la única forma honesta de garantizar
// que el dueño no pierda sus datos por olvido es que la app misma le esté
// generando correos/mensajes automáticos con el respaldo adjuntable, a SU
// correo/WhatsApp preferido, con la frecuencia que él elija. El mínimo
// mensual es INAMOVIBLE: si un cliente pierde 30 días de datos por descuido,
// mala experiencia; pero >30 días sería inaceptable.
//
// LIMITACIÓN HONESTA (importante — no la escondemos al usuario):
//   Los enlaces mailto: y wa.me NO pueden adjuntar archivos por sí solos
//   (limitación de los estándares). Lo que hacemos:
//     1) Descargamos automáticamente el archivo .json del respaldo (texto
//        plano, NO cifrado — ver la "Nota honesta" del panel).
//     2) Abrimos mailto: (o wa.me:) con el destinatario, asunto y cuerpo YA
//        escritos. El usuario da 1 toque más (adjuntar el archivo recién
//        descargado) y otro toque a Enviar. Es lo más automático posible
//        desde una PWA sin backend intermediario. Vale la promesa: el
//        backup viaja a TU cuenta, no a la nuestra.
//
// Depende de: window.OCAuth (rol), /api/respaldo/exportar (payload).
// No depende de EmailJS ni de ningún servicio pago.
(function () {
  const LS_PREFS = "oc_backup_prefs_v1";
  const LS_LAST  = "oc_backup_last_v1"; // { ts: number, canal: "email"|"whatsapp"|"both" }
  const LS_ASSURED = "oc_backup_assurance_last_v1";
  // Snooze: hasta cuándo NO volver a mostrar el recordatorio. Lo pone "Más
  // tarde" (24h) y el auto-config (un ciclo de gracia). Sin esto, toca() se
  // basa solo en la fecha del último backup y el nag reaparece en cada login.
  const LS_SNOOZE = "oc_backup_snooze_v1";

  function getSnooze() {
    try { return parseInt(localStorage.getItem(LS_SNOOZE) || "0", 10) || 0; } catch (_) { return 0; }
  }
  function setSnooze(ms) {
    try { localStorage.setItem(LS_SNOOZE, String(Date.now() + ms)); } catch (_) {}
  }

  // Frecuencias en días. Mensual (30) es el mínimo obligatorio: no se puede
  // elegir MÁS de 30 días. Se puede elegir menos (diario, semanal, quincenal).
  const FREQS = [
    { key: "diario",    dias: 1,  label: "Diario"    },
    { key: "semanal",   dias: 7,  label: "Semanal"   },
    { key: "quincenal", dias: 15, label: "Quincenal" },
    { key: "mensual",   dias: 30, label: "Mensual (mínimo)" },
  ];

  function defaults() {
    return {
      frecKey: "mensual",   // mínimo obligatorio como default
      email: "",            // correo preferido del dueño
      whatsapp: "",         // wa.me acepta con o sin +, ver normalizeWa()
      canalEmail: true,     // email marcado por default (es el vehículo mínimo)
      canalWhatsapp: false, // whatsapp opt-in
      configurado: false,   // false = nunca abrió la config; usamos para mostrar aviso
    };
  }

  function getPrefs() {
    try {
      const raw = localStorage.getItem(LS_PREFS);
      if (!raw) return defaults();
      const p = JSON.parse(raw);
      return Object.assign(defaults(), p);
    } catch (_) { return defaults(); }
  }

  function setPrefs(p) {
    try { localStorage.setItem(LS_PREFS, JSON.stringify(p)); } catch (_) {}
  }

  function getLast() {
    try {
      const raw = localStorage.getItem(LS_LAST);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function setLast(canal) {
    try { localStorage.setItem(LS_LAST, JSON.stringify({ ts: Date.now(), canal })); } catch (_) {}
  }

  function frecDe(key) {
    return FREQS.find((f) => f.key === key) || FREQS[3];
  }

  // ¿Es hora de recordar respaldo? true si nunca se hizo o si pasó la frecuencia elegida.
  function toca(prefs) {
    const last = getLast();
    if (!last) return true;
    const f = frecDe(prefs.frecKey);
    const msLimite = f.dias * 24 * 60 * 60 * 1000;
    return (Date.now() - last.ts) >= msLimite;
  }

  // Fecha/hora local formateada, timestamped para el nombre del archivo y el asunto.
  function stampArchivo(d) {
    const iso = d.toISOString().replace(/[:T]/g, "-").slice(0, 16); // 2026-07-21-02-15
    return iso;
  }
  function stampHumano(d) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const aa = d.getFullYear();
    const HH = String(d.getHours()).padStart(2, "0");
    const MM = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${aa} ${HH}:${MM}`;
  }

  function normalizeWa(num) {
    // wa.me acepta solo dígitos, sin +. Aceptamos que el dueño escriba +593 99 990 5080
    let d = (num || "").replace(/[^\d]/g, "");
    // Ecuador: el móvil nacional se escribe 09XXXXXXXX (10 dígitos), pero
    // wa.me EXIGE formato internacional sin +. Sin esto, un dueño que teclea
    // su número como lo marca a diario (0999905080) generaba un wa.me/0999...
    // que abre un chat vacío o inexistente. Transformación determinista
    // (no un guess): 09XXXXXXXX → 593 + los 9 dígitos sin el 0 inicial.
    if (/^09\d{8}$/.test(d)) d = "593" + d.slice(1);
    return d;
  }

  // FIX PREVENTIVO: normalizeWa() solo limpia el texto, no valida que sea un
  // número real — un número truncado ("593") generaba un link wa.me roto sin
  // ningún aviso al dueño. 8 dígitos es un mínimo laxo (cubre números
  // locales de 7-8 dígitos + variantes cortas), suficiente para atrapar el
  // caso de "se me fue el dedo" sin bloquear números válidos.
  function waEsValido(num) {
    return normalizeWa(num).length >= 8;
  }

  // Construye el paquete de respaldo (sin efectos secundarios). Reusa el flujo
  // canónico: /api/respaldo/exportar (interceptado por mock-backend, local).
  async function construirArchivoRespaldo() {
    const res = await fetch("/api/respaldo/exportar");
    // 403 = dispositivo no activado (no "backend caído"). Mensaje específico.
    if (res.status === 403) throw new Error("Este dispositivo no está activado. Entra con el PIN 789 para activarlo y luego podrás respaldar.");
    if (!res.ok) throw new Error("No se pudo leer los datos del negocio.");
    const datos = await res.json();
    const paquete = {
      app: "amigable-123",
      exportadoEn: new Date().toISOString(),
      schemaVersion: 2,
      datos,
    };
    const texto = JSON.stringify(paquete, null, 2);
    const now = new Date();
    const nombre = `respaldo-amigable-123-${stampArchivo(now)}.json`;
    return { texto, nombre, humano: stampHumano(now) };
  }

  // Descarga del archivo al dispositivo (fallback para laptop / navegadores sin
  // Web Share). FIX iOS/webview (JFC 2026-07-22) — NO simplificar a solo
  // a.click(): en iPhone/iPad el atributo download se ignora (abre pestaña) y
  // algunos webviews cerrados lanzan. try/catch + fallback a pestaña: nunca
  // dejamos al dueño sin su archivo.
  function descargarArchivo(texto, nombre) {
    const blob = new Blob([texto], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    try { a.click(); } catch (_) { try { window.open(url, "_blank"); } catch (_) {} }
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function cuerpoEmail(nombreArchivo, humano) {
    return `Respaldo de amigable-123 generado el ${humano}.\n\n`
         + `1) Adjunta el archivo "${nombreArchivo}" que se acaba de descargar en este dispositivo (en Android/PC está en Descargas; en iPhone/iPad se abre en una pestaña: usa Compartir y "Guardar en Archivos").\n`
         + `2) Envíalo a este correo (a ti mismo/a).\n\n`
         + `— El backup va a TI, no a un servidor. Nunca sueltas control de tus datos.`;
  }

  function cuerpoWa(nombreArchivo, humano) {
    return `Respaldo amigable-123 ${humano}. Adjunta el archivo ${nombreArchivo} recién descargado y envíatelo a ti mismo. El backup vive contigo, no en la nube.`;
  }

  function abrirMailto(email, nombreArchivo, humano) {
    const asunto = `Respaldo amigable-123 — ${humano}`;
    const body = cuerpoEmail(nombreArchivo, humano);
    const href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(body)}`;
    // window.location.href respeta el cliente de correo por default del sistema.
    window.location.href = href;
  }

  // FIX PREVENTIVO MÓVIL (JFC 2026-07-22) — NO BORRAR. window.open ocurre
  // DESPUÉS de un await (la descarga del respaldo), o sea fuera del gesto del
  // usuario. Safari/Chrome en teléfono/tablet bloquean ese popup y devuelven
  // null: el respaldo por WhatsApp fallaba SIN aviso. Aquí, si el open se
  // bloquea, mostramos un enlace tocable — un toque ES un gesto fresco, así
  // que el enlace siempre abre. Redundancia barata, salva la función en móvil.
  function mostrarLinkFallback(url, etiqueta) {
    try {
      const prev = document.getElementById("oc-backup-linkfallback");
      if (prev) prev.remove();
      const wrap = document.createElement("div");
      wrap.id = "oc-backup-linkfallback";
      wrap.style.cssText = "position:fixed;bottom:150px;left:50%;transform:translateX(-50%);z-index:9492;"
        + "background:#0F1923;color:#fff;border:2px solid #E8A020;border-radius:12px;padding:12px 16px;"
        + "max-width:420px;width:calc(100% - 28px);box-shadow:0 12px 28px rgba(15,25,35,.35);"
        + "font-family:Georgia,serif;font-size:14px;line-height:1.45;text-align:center;";
      const intro = document.createElement("div");
      intro.style.cssText = "margin-bottom:8px;color:#fff;";
      intro.textContent = "Tu navegador bloqueó la ventana. Toca aquí para abrirlo:";
      const a = document.createElement("a");
      a.href = url; a.target = "_blank"; a.rel = "noopener";
      a.textContent = etiqueta;
      a.style.cssText = "display:inline-block;min-height:44px;line-height:44px;padding:0 18px;"
        + "background:#25D366;color:#0a3d20;border-radius:8px;font-weight:700;text-decoration:none;";
      a.addEventListener("click", () => { try { wrap.remove(); } catch (_) {} });
      wrap.appendChild(intro); wrap.appendChild(a);
      document.body.appendChild(wrap);
      // Auto-limpieza: no dejar el enlace colgado en pantalla indefinidamente.
      setTimeout(() => { try { wrap.remove(); } catch (_) {} }, 25000);
    } catch (_) {}
  }

  function abrirWa(num, nombreArchivo, humano) {
    const texto = cuerpoWa(nombreArchivo, humano);
    const url = `https://wa.me/${normalizeWa(num)}?text=${encodeURIComponent(texto)}`;
    let w = null;
    try { w = window.open(url, "_blank", "noopener"); } catch (_) { w = null; }
    if (!w) mostrarLinkFallback(url, "Abrir WhatsApp");
  }

  // ==========================================================================
  // ENTREGA DEL ARCHIVO — extraido de correrRespaldo() (JFC 2026-07-28) para
  // que el respaldo del EMPLEADO (respaldo-empleado.js) reutilice exactamente
  // el mismo camino en vez de duplicarlo. Aqui viven varios arreglos que
  // costaron trabajo: el AbortError de Web Share, el popup bloqueado en movil,
  // el download ignorado en iOS. Duplicar este bloque significaria perder esos
  // arreglos en la copia. Un solo mecanismo de entrega, dos cargas distintas.
  //
  // Devuelve "compartido" | "fallback" | "cancelado".
  //   cancelado = el usuario cerro el menu de compartir a proposito; quien
  //   llama NO debe marcar el respaldo como hecho ni dejar de recordarlo.
  //
  // plantillaTexto admite el marcador %CANAL%, que se reemplaza por el canal
  // real elegido para no decirle "correo" a quien respalda por WhatsApp.
  // ==========================================================================
  async function entregarArchivo(info, prefs, titulo, plantillaTexto) {
    let resultado = "fallback";
    try {
      // navigator.share exige un File; comprobamos canShare con el archivo real
      // (algunos navegadores dicen tener share pero no aceptan archivos).
      const file = new File([info.texto], info.nombre, { type: "application/json" });
      // BUG REAL (JFC 2026-08-11, "whatsapp adjunta, el correo no"): cuando
      // los DOS canales estan activos, un solo navigator.share() abre UN
      // dialogo nativo — el dueno elige una sola app ahi. El otro canal
      // configurado nunca se dispara, en silencio, porque la API no dice
      // cual app se eligio (no hay forma de saberlo para completar el que
      // falta despues). Con dos canales activos NO usamos Web Share: vamos
      // directo al camino de abajo, que sí abre wa.me Y mailto por separado,
      // garantizando que los dos canales configurados de verdad ocurran.
      const soloUnCanal = (prefs.canalEmail ? 1 : 0) + (prefs.canalWhatsapp ? 1 : 0) === 1;
      if (soloUnCanal && navigator.canShare && navigator.canShare({ files: [file] })) {
        // soloUnCanal ya garantiza que es uno u otro, nunca ambos ni ninguno.
        const canalTxt = prefs.canalWhatsapp ? "WhatsApp" : "correo";
        await navigator.share({
          files: [file],
          title: titulo,
          text: String(plantillaTexto).replace("%CANAL%", canalTxt),
        });
        resultado = "compartido";
      }
    } catch (e) {
      // AbortError = cerro el menu de compartir a proposito: no insistimos con
      // el fallback ni marcamos un respaldo que no ocurrio.
      resultado = (e && e.name === "AbortError") ? "cancelado" : "fallback";
    }

    if (resultado === "fallback") {
      // Descarga + canales premade. WhatsApp primero (nueva pestana) y mailto
      // con un pequeno retraso, para que el open() de wa.me no se coma el mailto.
      descargarArchivo(info.texto, info.nombre);
      if (prefs.canalWhatsapp) abrirWa(prefs.whatsapp, info.nombre, info.humano);
      if (prefs.canalEmail)    setTimeout(() => abrirMailto(prefs.email, info.nombre, info.humano), 300);
    }
    return resultado;
  }

  // Corre la rutina completa: descarga + abre canales elegidos + marca timestamp.
  async function correrRespaldo(silencioso) {
    const prefs = getPrefs();
    if (!prefs.canalEmail && !prefs.canalWhatsapp) {
      alert("Elige al menos un canal (correo y/o WhatsApp) en Avanzado antes de respaldar.");
      return;
    }
    if (prefs.canalEmail && !prefs.email) {
      alert("Escribe tu correo preferido en Avanzado antes de respaldar.");
      return;
    }
    if (prefs.canalWhatsapp && !waEsValido(prefs.whatsapp)) {
      alert("Tu WhatsApp en Avanzado parece incompleto (con código de país). Corrígelo antes de respaldar.");
      return;
    }
    // Sin chequeo navigator.onLine: el respaldo lee de mock-backend.js (fetch
    // local, sin red). El compartir/mailto/wa.me se abren aunque no haya red.
    let info;
    try {
      info = await construirArchivoRespaldo();
    } catch (e) {
      alert("No se pudo generar el respaldo: " + e.message);
      return;
    }

    // ========================================================================
    // MÉTODO IDEAL (DECISIÓN FINAL JFC 2026-07-22) — ver memoria
    // feedback_metodo_autoenvio_html5. El respaldo se AUTOENVÍA con HTML5 puro,
    // SIN backend ni cloud: la app fuerza al dueño a mandarse su propia info a
    // sí mismo con el cliente que YA tiene configurado.
    //   1) Web Share API (navigator.share) con el archivo YA ADJUNTO: en
    //      teléfono/tablet abre el menú de compartir del sistema con el .json
    //      pegado; el dueño elige SU WhatsApp/Gmail y se lo envía a sí mismo.
    //      Un toque para elegir, uno para enviar. Sin adjuntar a mano.
    //   2) Fallback (laptop / navegador sin Web Share): descarga el archivo +
    //      abre correo/WhatsApp premade (el dueño adjunta el archivo recién
    //      descargado). Es el techo posible sin servidor en escritorio.
    // NUNCA meter un servidor en medio de estos datos. Esa regla es de JFC.
    // ========================================================================
    const resultado = await entregarArchivo(info, prefs, "Respaldo amigable-123",
      `Respaldo de tu negocio (amigable-123) ${info.humano}. Envíatelo a TI mismo/a por %CANAL% — es tuyo, no pasa por ningún servidor.`);

    if (resultado === "cancelado") return; // no marcar backup, seguir recordando

    const canal = prefs.canalEmail && prefs.canalWhatsapp ? "both" : (prefs.canalEmail ? "email" : "whatsapp");
    setLast(canal);

    if (!silencioso) {
      programarAssurance();
    }
  }

  // Popup de "assurance": SEMANAL, amigable, sin ansiedad. Verifica que
  // llegó y desea buena semana. NO es un modal bloqueante — es un toast.
  function programarAssurance() {
    try { localStorage.setItem(LS_ASSURED, String(Date.now())); } catch (_) {}
  }

  function tocaAssurance() {
    const last = getLast();
    if (!last) return false; // aún no hay respaldos
    let assured = 0;
    try { assured = parseInt(localStorage.getItem(LS_ASSURED) || "0", 10) || 0; } catch (_) {}
    const semana = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - Math.max(last.ts, assured)) >= semana;
  }

  function esDueno() {
    const rol = window.OCAuth && window.OCAuth.rolActual ? window.OCAuth.rolActual() : null;
    return rol === "dueno" || rol === "dueño" || rol === "owner";
  }

  // FIX PREVENTIVO: en demo, auth-ui.js asigna rol="dueno" igual, así que
  // esDueno() por sí solo NO excluye la sesión de prueba. Nadie que solo
  // está probando la app debería ver el panel de backup ni recibir el nag
  // de "es hora de respaldar" — mismo patrón ya usado en avanzado-extra.js
  // y en el gate del reporte trimestral.
  function esDuenoReal() {
    return esDueno() && !(window.OCAuth && window.OCAuth.esDemo && window.OCAuth.esDemo());
  }

  function mostrarAssurance() {
    if (document.getElementById("oc-backup-assurance")) return;
    if (!esDuenoReal()) return; // revalidado: pudo cambiar de rol (o ser demo) durante el delay de arranque
    const wrap = document.createElement("div");
    wrap.id = "oc-backup-assurance";
    // bottom:90px (no 16px/0) para no chocar con el toast de deshacer venta
    // ni con la barra inferior full-width que ya existen en index.html.
    wrap.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:9490;"
      + "background:#F8F9FB;color:#0F1923;border:2px solid #E8A020;border-radius:12px;padding:14px 16px;"
      + "max-width:420px;width:calc(100% - 28px);box-shadow:0 12px 28px rgba(15,25,35,.28);"
      + "font-family:Georgia,serif;font-size:15px;line-height:1.45;";
    // Texto dinámico según canal — evita decirle "correo" a quien respaldó solo por WhatsApp.
    const _last = getLast();
    const _canalAssu = _last ? _last.canal : (getPrefs().canalEmail ? "email" : "whatsapp");
    const _textoAssu = _canalAssu === "whatsapp"
      ? "¿Llegó el mensaje de respaldo a tu WhatsApp?"
      : (_canalAssu === "both" ? "¿Llegó tu respaldo — correo o WhatsApp?" : "¿Llegó tu respaldo a tu correo?");
    const _cuerpoAssu = _canalAssu === "whatsapp"
      ? "Ábrelo en tu WhatsApp y verifica que tienes el archivo. Es tuyo — nunca pasa por nosotros. ¡Buena semana!"
      : "Ábrelo en tu bandeja y verifica que sí lo tienes. Es tuyo — nunca pasa por nosotros. ¡Buena semana!";
    wrap.innerHTML = `
      <div style="font-weight:700;color:#E8A020;margin-bottom:4px;">${_textoAssu}</div>
      <div style="margin-bottom:10px;">${_cuerpoAssu}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button id="oc-backup-assured-ok" style="flex:1;min-height:44px;padding:8px 12px;border:2px solid #00C87A;background:#00C87A;color:#fff;border-radius:8px;font-weight:700;cursor:pointer;">Sí, llegó — buena semana</button>
        <button id="oc-backup-assured-resend" style="flex:1;min-height:44px;padding:8px 12px;border:2px solid #2E6278;background:#fff;color:#2E6278;border-radius:8px;font-weight:700;cursor:pointer;">Reenviar ahora</button>
      </div>`;
    document.body.appendChild(wrap);
    document.getElementById("oc-backup-assured-ok").addEventListener("click", () => {
      try { localStorage.setItem(LS_ASSURED, String(Date.now())); } catch (_) {}
      wrap.remove();
    });
    document.getElementById("oc-backup-assured-resend").addEventListener("click", () => {
      wrap.remove();
      correrRespaldo(false);
    });
  }

  // Tracker del timeout activo — evita que logins rápidos acumulen múltiples
  // timers (login → logout → login en <4s) y muestren dos toasts seguidos.
  let _chequeoTimeout = null;

  // Chequea al arrancar (con delay para no molestar en el splash) si toca
  // respaldo o assurance. Nunca es bloqueante.
  //
  // FIX PREVENTIVO: el dueño puede loguearse y ceder el dispositivo a un
  // empleado DENTRO de los 4s de este delay (pasa seguido en mostrador). Por
  // eso el rol se revalida DOS VECES: aquí al programar el timeout, y otra
  // vez justo antes de pintar cada popup — nunca confiar en una sola
  // lectura de rol tomada segundos antes de usarla.
  //
  // AUTO-CONFIG (JFC 2026-07-21): si el dueño nunca abrió Avanzado pero
  // tiene correo guardado en oc_secure, activamos el mínimo mensual
  // automáticamente. La promesa "mínimo mensual" no puede depender de que
  // el dueño recuerde abrir Avanzado.
  function chequearAlArrancar() {
    if (_chequeoTimeout) clearTimeout(_chequeoTimeout);
    _chequeoTimeout = setTimeout(() => {
      _chequeoTimeout = null;
      try {
        if (!esDuenoReal()) return; // solo el dueño real, nunca demo
        let prefs = getPrefs();
        if (!prefs.configurado) {
          // Intentar auto-configurar con el correo de oc_secure
          const emailGuardado = (window.OCSecure && window.OCSecure.leerCorreo) ? window.OCSecure.leerCorreo() : "";
          if (emailGuardado) {
            prefs = Object.assign({}, prefs, {
              email: emailGuardado,
              canalEmail: true,
              frecKey: "mensual",
              configurado: true,
            });
            setPrefs(prefs);
            // Recién auto-configurado: da un ciclo de gracia (la frecuencia
            // elegida) antes del primer aviso, para no nagear 4s después de
            // que el dueño activó el dispositivo y aún no tiene datos. NO
            // sembramos un backup falso (rompería el assurance semanal).
            setSnooze(frecDe(prefs.frecKey).dias * 24 * 60 * 60 * 1000);
          } else {
            return; // sin email y sin config, no molestar
          }
        }
        // Snooze silencia SOLO el recordatorio ("Más tarde"/gracia inicial),
        // nunca el assurance de "¿llegó tu respaldo?".
        const snoozed = getSnooze() > Date.now();
        if (toca(prefs) && !snoozed) {
          mostrarRecordatorioRespaldo();
        } else if (tocaAssurance()) {
          mostrarAssurance();
        }
      } catch (e) { console.warn("[backup-scheduler] chequeo abortado:", e); }
    }, 4000);
  }

  function mostrarRecordatorioRespaldo() {
    if (document.getElementById("oc-backup-remind")) return;
    if (!esDuenoReal()) return; // revalidado: pudo cambiar de rol (o ser demo) durante el delay de arranque
    const wrap = document.createElement("div");
    wrap.id = "oc-backup-remind";
    // bottom:90px, ver nota en mostrarAssurance() sobre el toast/barra existentes.
    wrap.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:9491;"
      + "background:#F8F9FB;color:#0F1923;border:2px solid #E8A020;border-radius:12px;padding:14px 16px;"
      + "max-width:440px;width:calc(100% - 28px);box-shadow:0 12px 28px rgba(15,25,35,.32);"
      + "font-family:Georgia,serif;font-size:15px;line-height:1.45;";
    const prefs = getPrefs();
    const f = frecDe(prefs.frecKey);
    const canales = [prefs.canalEmail && "correo", prefs.canalWhatsapp && "WhatsApp"].filter(Boolean).join(" + ");
    // Mensaje dinámico — el canal real del dueño, no "correo/WhatsApp" genérico.
    const _canalMsg = canales === "WhatsApp" ? "un mensaje de WhatsApp"
      : (canales === "correo + WhatsApp" ? "un correo y un mensaje de WhatsApp"
      : "un correo");
    const msg = `Toca "Respaldar ahora" y te preparamos el archivo + ${_canalMsg} con todo listo. Solo te queda adjuntar y enviar — <b>a ti mismo/a</b>. Frecuencia elegida: <b>${f.label.toLowerCase()}</b> por ${canales || "correo"}.`;
    wrap.innerHTML = `
      <div style="font-weight:700;color:#E8A020;margin-bottom:4px;">Es hora de tu respaldo</div>
      <div style="margin-bottom:10px;">${msg}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button id="oc-backup-remind-ok" style="flex:1;min-height:44px;padding:8px 12px;border:2px solid #E8A020;background:#E8A020;color:#fff;border-radius:8px;font-weight:700;cursor:pointer;">Respaldar ahora</button>
        <button id="oc-backup-remind-later" style="flex:1;min-height:44px;padding:8px 12px;border:2px solid #2E6278;background:#fff;color:#2E6278;border-radius:8px;font-weight:700;cursor:pointer;">Más tarde</button>
      </div>`;
    document.body.appendChild(wrap);
    document.getElementById("oc-backup-remind-ok").addEventListener("click", () => {
      wrap.remove();
      correrRespaldo(false);
    });
    document.getElementById("oc-backup-remind-later").addEventListener("click", () => {
      wrap.remove();
      // Postponer 24h de verdad. Antes esto seteaba LS_ASSURED, que toca()
      // ignora — el recordatorio reaparecía en el siguiente login. El snooze
      // sí lo respeta chequearAlArrancar().
      setSnooze(24 * 60 * 60 * 1000);
    });
  }

  // ==========================================================================
  // Render de la UI de configuración en Avanzado. Lo llama avanzado-extra.js
  // pasando el <div> destino. Mantengo la UI pequeña y adosada al card de
  // Gestión — no interrumpe el flujo del dueño.
  // ==========================================================================
  function renderPanel(mount) {
    if (!mount) return;
    // En demo: mostrar una vista previa desactivada para que el dueño sepa que existe.
    // Para usarla de verdad, activa el dispositivo con PIN 789.
    if (window.OCAuth && window.OCAuth.esDemo && window.OCAuth.esDemo()) {
      mount.innerHTML = `<div style="border:2px dashed #9E9E9E;border-radius:12px;padding:14px 16px;background:#F5F5F5;margin-top:16px;">
        <h3 style="margin:0 0 4px;color:#555;font-family:Georgia,serif;font-size:18px;">Respaldo automático a correo / WhatsApp</h3>
        <p style="margin:0;font-size:14px;color:#555;line-height:1.5;">Disponible para dueños reales. Ingresa con PIN <strong>789</strong> para configurar la frecuencia y el destino del respaldo automático — el archivo va a <em>ti</em>, nunca a nosotros.</p>
      </div>`;
      return;
    }

    // Bug fix: si el dispositivo no está activado, el export da 403. Mejor
    // avisarlo aquí que dejar que el usuario configure todo y falle al primer intento.
    try {
      const owned = JSON.parse(localStorage.getItem("amigable_owned") || "null") || {};
      if (!owned.instanceId) {
        mount.innerHTML = `<div style="border:2px solid #E86040;border-radius:12px;padding:14px 16px;background:#FFF3EE;margin-top:16px;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#C05000;">Para activar el respaldo automático primero activa este dispositivo.</p>
          <p style="margin:8px 0 0;font-size:14px;color:#2C3E50;">En la pantalla de acceso ingresa el PIN <strong>789</strong>. Una vez activado, vuelve aquí a configurar tu correo y frecuencia.</p>
        </div>`;
        return;
      }
    } catch (_) {}

    const prefs = getPrefs();
    const frecIdx = FREQS.findIndex((f) => f.key === prefs.frecKey);
    const frecIdxSafe = frecIdx >= 0 ? frecIdx : 3; // default mensual
    mount.innerHTML = `
      <div style="border:2px solid #E8A020;border-radius:12px;padding:14px 16px;background:#FFF8EC;margin-top:16px;">
        <h3 style="margin:0 0 4px;color:#C05000;font-family:Georgia,serif;font-size:19px;">
          Respaldo a tu correo y/o WhatsApp
        </h3>
        <p style="margin:0 0 12px;font-size:15px;color:#0F1923;font-weight:700;">
          El backup va a TI, no a nosotros. Nunca sueltas control de tus datos.
        </p>
        <p style="margin:0 0 12px;font-size:14px;color:#2C3E50;line-height:1.5;">
          La app te descarga el archivo y te abre el correo/WhatsApp con todo escrito. Tú adjuntas y envías — a ti mismo/a. El mínimo mensual es obligatorio: así, si algo se pierde por descuido, nunca son más de 30 días.
        </p>

        <div style="display:grid;grid-template-columns:1fr;gap:10px;">
          <div>
            <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Frecuencia de respaldo automático</div>
            <input type="range" id="oc-bk-frec" min="0" max="3" step="1" value="${frecIdxSafe}"
              style="width:100%;max-width:320px;accent-color:#E86040;height:6px;cursor:pointer;">
            <div style="display:flex;justify-content:space-between;max-width:320px;margin-top:5px;">
              ${FREQS.map((f) => `<span style="font-size:13px;color:#2C3E50;text-align:center;width:25%;">${f.label.replace(" (mínimo)","")}</span>`).join("")}
            </div>
            <p id="oc-bk-frec-label" style="margin:6px 0 0;font-size:13px;color:#E86040;font-weight:700;">
              Seleccionado: ${FREQS[frecIdxSafe].label}
            </p>
          </div>

          <label style="font-size:14px;font-weight:700;">
            <input type="checkbox" id="oc-bk-canalEmail" ${prefs.canalEmail ? "checked" : ""} style="min-width:20px;min-height:20px;vertical-align:middle;margin-right:6px;">
            Enviarme por correo
          </label>
          <input type="email" id="oc-bk-email" value="${(prefs.email || "").replace(/"/g, "&quot;")}" placeholder="tu@correo.com"
            style="padding:10px;border:2px solid #E86040;border-radius:6px;min-height:44px;max-width:340px;font-size:15px;">

          <label style="font-size:14px;font-weight:700;">
            <input type="checkbox" id="oc-bk-canalWa" ${prefs.canalWhatsapp ? "checked" : ""} style="min-width:20px;min-height:20px;vertical-align:middle;margin-right:6px;">
            Enviarme por WhatsApp
          </label>
          <input type="tel" id="oc-bk-wa" value="${(prefs.whatsapp || "").replace(/"/g, "&quot;")}" placeholder="+593 99 990 5080"
            style="padding:10px;border:2px solid #E86040;border-radius:6px;min-height:44px;max-width:340px;font-size:15px;">
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
          <button id="oc-bk-guardar" style="min-height:44px;padding:10px 16px;border:2px solid #2E6278;background:#2E6278;color:#fff;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer;">
            Guardar preferencia
          </button>
          <button id="oc-bk-correr" style="min-height:44px;padding:10px 16px;border:2px solid #E8A020;background:#E8A020;color:#fff;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer;">
            Respaldar ahora
          </button>
        </div>
        <p id="oc-bk-msg" style="margin:10px 0 0;font-size:14px;font-weight:700;color:#2E6278;"></p>
        <p style="margin:8px 0 0;font-size:13px;color:#2C3E50;">
          <b>Nota honesta:</b>
          los enlaces mailto: y wa.me no pueden adjuntar archivos automáticamente (limitación de los estándares web). Por eso descargamos el archivo primero y te abrimos el mensaje con el destinatario y el texto ya listos — tú solo adjuntas y envías. Es lo más automático posible sin que nada pase por nosotros.
        </p>
        <p style="margin:8px 0 0;font-size:13px;color:#5A6270;">
          <b>Alcance de este respaldo:</b> incluye productos, ventas, clientes, comisiones y configuración de negocio.
          El archivo no está cifrado — guárdalo en un lugar de tu confianza.
          Para un respaldo completo (incluyendo claves de seguridad y fotos de perchas) usa <b>Avanzado → Exportar respaldo</b>.
        </p>
      </div>
    `;

    function msg(txt, color) {
      const m = document.getElementById("oc-bk-msg");
      if (m) { m.textContent = txt; m.style.color = color || "#2E6278"; }
    }

    // Slider: actualiza el label de frecuencia en tiempo real al mover
    document.getElementById("oc-bk-frec").addEventListener("input", function () {
      const idx = parseInt(this.value, 10);
      const lbl = document.getElementById("oc-bk-frec-label");
      if (lbl && FREQS[idx]) lbl.textContent = "Seleccionado: " + FREQS[idx].label;
    });

    document.getElementById("oc-bk-guardar").addEventListener("click", () => {
      const frecSliderIdx = parseInt(document.getElementById("oc-bk-frec").value, 10);
      const nueva = {
        frecKey: (FREQS[frecSliderIdx] || FREQS[3]).key, // lee del slider, fallback mensual
        email: document.getElementById("oc-bk-email").value.trim(),
        whatsapp: document.getElementById("oc-bk-wa").value.trim(),
        canalEmail: document.getElementById("oc-bk-canalEmail").checked,
        canalWhatsapp: document.getElementById("oc-bk-canalWa").checked,
        configurado: true,
      };
      // Validación mínima: si eligió email, tiene que tener correo. Igual WhatsApp.
      if (nueva.canalEmail && !nueva.email) { msg("Falta tu correo.", "#E8365D"); return; }
      if (nueva.canalWhatsapp && !waEsValido(nueva.whatsapp)) { msg("Tu WhatsApp parece incompleto — inclúyelo con código de país.", "#E8365D"); return; }
      if (!nueva.canalEmail && !nueva.canalWhatsapp) { msg("Elige al menos un canal.", "#E8365D"); return; }
      setPrefs(nueva);
      msg("Listo. Guardado. Podemos respaldar cuando quieras.", "#00C87A");
    });

    document.getElementById("oc-bk-correr").addEventListener("click", () => {
      correrRespaldo(false);
    });
  }

  // API pública mínima. avanzado-extra.js llama a OCBackupScheduler.montar(...)
  // desde el card de Gestión, e index.html arranca el chequeo periódico al
  // login del dueño.
  window.OCBackupScheduler = {
    montar: renderPanel,
    correr: correrRespaldo,
    chequearAlArrancar,
    getPrefs,
    // Reutilizados por respaldo-empleado.js — mismo camino de entrega, misma
    // normalizacion de WhatsApp. NO duplicar estas funciones en otro archivo.
    entregarArchivo,
    stampArchivo,
    stampHumano,
    waEsValido,
    // Utilidades expuestas para pruebas manuales desde DevTools:
    _toca: () => toca(getPrefs()),
    _mostrarRecordatorio: mostrarRecordatorioRespaldo,
    _mostrarAssurance: mostrarAssurance,
  };

  // Auto-boot: cuando el dueño hace login, arrancamos el chequeo.
  window.addEventListener("oc-login", () => {
    chequearAlArrancar();
  });
})();
