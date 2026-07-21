# Port desde friendly-123 → amigable-123 — 2026-07-21

> Ejecutado de madrugada mientras JFC dormía, por instrucción explícita:
> "traslada los avances y mejoras a amigable-123... con mucho cuidado, con
> muchos apuntes para evitar improvisaciones o asumir, y con muchos backups".
> Este documento es el registro de qué se hizo, qué NO se hizo, y por qué.

## Hecho esta noche (verificado en navegador, con demo PIN 456)

1. **Sistema de color Sinclair Bloom — plano, sin glow** (`index.html`,
   `manual-maestro.html`). Mismo fix exacto que en friendly-123: los 3
   niveles de intensidad (n1/n2/n3) ahora son tonos sólidos y planos
   (`-bg`/base/`-dk`), sin degradé interno ni `box-shadow` de color. El
   bloque CSS era byte-idéntico al de friendly-123 antes del fix, así que se
   aplicó el mismo parche literal. Verificado visualmente: tarjetas rojas
   n1/n3 en Inventario, simulador de "Colores" en el manual maestro.

2. **Respaldo soberano a correo/WhatsApp** — nuevo archivo
   `docs/backup-scheduler.js`. **Adaptado, no copiado literal**:
   amigable-123 NO tiene sistema bilingüe (no existe `i18n.js`/`OCI18n` aquí,
   a diferencia de friendly-123) — se reescribió 100% en español, sin ramas
   de idioma ni el listener `oc-lang-change`. Incluye desde el arranque
   todos los fixes de endurecimiento ya aplicados en friendly-123 (gate de
   demo, validación de WhatsApp ≥8 dígitos, mensaje de "estás offline",
   revalidación de rol antes de cada popup). Verificado visualmente: panel
   completo en Avanzado, con "Mensual (mínimo)" seleccionado por defecto.

3. **Panel de reporte trimestral $100 (opcional)** — insertado en
   `avanzado-extra.js`, con el gate de demo y el guard de "0 categorías
   marcadas" incluidos desde el inicio (no como parche posterior, a
   diferencia de como se hizo primero en friendly-123). Recipiente:
   `jfcarpio@gmail.com` (mismo contacto confirmado en ambos repos vía
   404.html → wa.me/593999905080). Verificado visualmente: panel renderiza
   al fondo de Avanzado.

4. **Promesas + licencia** en el modal Ayuda(?) (`help-ui.js`) y en
   `manual-maestro.html` (sección "Qué es"): "Te ahorra 50% del tiempo / Se
   aprende en 10 minutos / Dura 10 años" + texto de licencia privada.
   Verificado visualmente en el modal real.

5. **Menciones de Formato D (backup automatizado) y reporte trimestral** en
   `manual-maestro.html`, secciones "CSV/Respaldo" y "Avanzado".

## Un obstáculo técnico real que casi causa un error

`avanzado-extra.js` y `help-ui.js` en este repo están **minificados** (una
sola línea física, sin saltos), a diferencia de friendly-123 donde son
legibles con comentarios. Es así desde antes (confirmado con `git log` y
comparando contra el backup de 2026-07-18) — no es corrupción. Esto obligó a:

- Insertar código nuevo vía anclas de texto exactas dentro del blob
  minificado (los nombres de variables NO están ofuscados, solo el
  whitespace fue removido — las anclas como `vista.appendChild(gestion);`
  siguen siendo strings únicos y localizables).
- Usar **scripts Python en archivo** (no heredocs de bash) para las
  inserciones grandes: un primer intento vía heredoc de bash corrompió
  tildes y guiones largos (mojibake — "Categor�as" en vez de "Categorías").
  Se detectó ANTES de hacer commit, se revirtió desde el backup pre-port, y
  se rehizo con un archivo `.py` real (UTF-8 explícito), que sí preservó el
  encoding correctamente. Verificado con `node --check` + grep de caracteres
  acentuados tras la corrección.

## Un mixup real que casi contamina el reporte de verificación

El primer intento de levantar un servidor de prueba usó el nombre
`amigable-docs` del `launch.json` de AMIGABLE — pero la herramienta de
preview de esta sesión solo lee el `launch.json` del proyecto ACTIVO
(friendly-123), que también tiene una entrada llamada `amigable-docs`
apuntando a una carpeta equivocada (`C:\00 Projects\friendly-123\docs`, el
repo padre, no el worktree). Terminé sirviendo friendly-123 pensando que
era AMIGABLE. Se detectó por el título de pestaña ("friendly-123") y por
`i18n.js`/`welcome-ui.js` en los logs del servidor (archivos que AMIGABLE no
tiene) — nunca por confiar ciegamente en el nombre. Se corrigió agregando
una config con nombre único (`amg123-verify-unique`) y ruta absoluta
explícita al `launch.json` correcto (el del proyecto activo), apuntando a
`C:\00 Projects\AMIGABLE\docs`. Esa config temporal ya fue removida tras
verificar.

## NO se hizo esta noche (a propósito, por tiempo y riesgo)

**Homologación visual de los 7 documentos de marketing** (`manifiesto.html`,
`panel.html`, `manual.html`, `informe-ejecutivo.html`, `reporte-usuario.html`,
`roi-tienda.html`, `404.html`) — SÍ se hizo en friendly-123 esta misma noche
(commit `5951608`), y se confirmó que AMIGABLE tiene el mismo problema
(colores fuera de marca `#0B5FFF`, fuente "Instrument Serif" en
`manifiesto.html` y `roi-tienda.html` al menos). No se portó porque:

- Son 7 archivos adicionales, cada uno con su propio historial divergente en
  este repo (posible que ya tengan parches propios de AMIGABLE que friendly-123
  no tiene).
- Ya era tarde y la instrucción explícita fue "revisa 2x, no asumas, no
  cantes victoria" — prefiero dejarlo pendiente y bien marcado que apurarlo
  sin poder verificar cada uno en vivo con el mismo cuidado que el resto.

**Siguiente paso sugerido:** repetir el mismo patrón de esta noche (backup
pre-port + diff cuidadoso + verificación en navegador) para esos 7 archivos,
en una sesión donde JFC pueda revisar el resultado antes de que quede en
producción, dado que este es el repo que ven clientes reales.

## Backups

- **Pre-port** (antes de tocar nada): `docs/*_PREPORT_2026-07-21_03-15.*`
  (11 archivos, read-only).
- **Post-port** (después de todos los cambios de esta noche):
  `docs/*_POSTPORT_2026-07-21_03-31.*` (5 archivos, read-only).
- Ningún archivo fue commiteado a git todavía al momento de escribir esta
  nota — eso queda como paso siguiente explícito, no automático.
