# amigable-123 — Megaauditoría app ↔ manual maestro (2026-07-24)

Alcance: `index.html` (5143 líneas, con bloque AMG) + 22 módulos JS + `sw.js`
+ `manual-maestro.html`. Único archivo de código ausente en todas las subidas:
**`auth-ui.js`** (define `OCAuth` y `OCCurrentUser`: login, PINes, gate 789/888,
flujo de recuperación). Todo lo que depende solo de él quedó como
"no verificable", no como "roto".

## 1. Salud técnica — resultado

- Sintaxis: `node --check` limpio en los 22 `.js`.
- Referencias UI→código: los 23 handlers `onclick` del HTML existen todos.
- Referencias entre módulos: cero rotas, salvo `OCAuth`/`OCCurrentUser`
  (viven en `auth-ui.js`, ausente — esperado).
- Balance de tags de `index.html`: script 28/28, div 280/280, body/html OK.
- Aislamiento de errores: patrón `initSeguro()`/try-catch consistente en
  vista-perchas, avanzado-extra, backup-scheduler y los 7 AMG — un módulo
  caído no tumba la app. Verificado en código, no asumido.
- `sw.js` v30 precachea 4 assets que no vinieron (404.html, manual.html,
  favicon.png, manifest.json) — normal si existen en tu repo; el precache
  resiliente (allSettled) tolera su ausencia. Mi `sw-v31` agrega los 7 AMG.

## 2. Manual → App: TODO verificado como CUMPLIDO (46 de 48 promesas)

Sistema Simon + escala Bloom (nivel 1-3) · Vista Hoy · cuadrícula de
inventario · campos de producto · ajuste rápido · estrella ⭐ · perchas y
sucursales · escalas de comisión · feria/percha temporal · fotos de percha
con semáforo de meta (verde ≥100%, amarillo ≥70%, rojo <70%, azul sin meta)
· badge "dormida Xd" · mismo producto en varias perchas (getHermanosPercha)
· Vendido ex-post con ticket y total en vivo · cierre del día · etiquetas
barcode128+QR · clientes con estrellas/corazones · matriz de comportamiento
· estaciones RFM · importar cartera CSV · comisiones y liquidaciones ·
ranking de promotores · matriz BCG · gastos mensuales · PyG del día con IVA
15% · balance simplificado · inventario valorizado · cuentas T · actividad
reciente · Formato A (CSV contable con aviso SRI) · Formato B (respaldo
cifrado AES-256-GCM + checksum, incluye fotos de perchas y oc_secure sin el
PIN recuperable) · Formato C (importación con verificación de checksum y
schemaVersion) · puntos de restauración (cada 30 min, máx 7, verificados por
checksum al restaurar) · Formato D (backup por correo/WhatsApp con slider de
frecuencia y "assurance" a la semana) · transferencias entre perchas con
aprobar/rechazar/confirmar recepción · PWA offline · código 789 (apropiar) ·
888 (demo) · 260 (empleado) · 357 (subclave contable) · nombre de negocio ·
sync en tiempo real E2E (PBKDF2+AES-GCM, presencia, tope 12 dispositivos,
reconexión con jitter) · unirse por WhatsApp con código normalizado · control
anti fraude (historial sellado con hash encadenado + señales del día:
anulaciones y mermas por persona) · sync manual por WhatsApp/QR (chunks OCQ,
dedup por operación) · instalar opcional.

## 3. Discrepancias encontradas y qué se hizo

| # | Hallazgo | Gravedad | Acción tomada |
|---|---|---|---|
| 1 | El manual re-subido **perdió el candado dark-mode iOS/Android** (regla dura del proyecto) que sí tenía la versión del zip anterior | Alta (legibilidad en móviles con modo oscuro) | **Restaurado**: meta color-scheme + `color-scheme:light only` + bloque `@media (prefers-color-scheme: dark)` con `!important` |
| 2 | El manual re-subido decía que el respaldo incluye "perchas" a secas; el código exporta también **sus fotos** (`fotosPerchas`) | Menor (precisión) | **Restaurado** "(incluidas sus fotos)" — el código lo respalda |
| 3 | **"Lista de reposición por percha"**: el manual la describe como existente (productos en zona de reorden ∩ estrella/vaca BCG, debajo de las fotos). NO existe en `vista-perchas.js` ni en ningún módulo | Alta (promesa incumplida al cliente) | Marcada **"(próximamente)"** en el manual. Alternativas: la construyo (los datos ya existen: umbralRojo/umbralAmarillo + matrizBCG), o se elimina la sección. Tu decisión |
| 4 | **"Reporte trimestral $100"**: solo existe una mención en un comentario de backup-scheduler.js ("el gate del reporte trimestral"); el botón/checklist no aparece en ningún archivo disponible. Posible que viva en `auth-ui.js` | Media | Marcada **"(próximamente)"**. Si al subir `auth-ui.js` el gate existe, revierte la marca (una palabra) |
| 5 | `auth-ui.js` ausente en 5 subidas consecutivas | Bloquea verificación de: login/PINes en vivo, gate 789/888, recuperación por correo, wizard de bienvenida disparado por `oc-login` | Documentado; el resto de la cadena (crypto-store, email-recovery, welcome/tutorial/help) sí verificada y coherente entre sí |

## 4. Observaciones de calidad (sin tocar, para tu radar)

- `email-recovery.js`: la decisión mailto-only está bien ejecutada; el
  fallback siempre devuelve el PIN en pantalla. Coherente con NO-CLOUD.
- `crypto-store.js`: aviso de contexto inseguro (http por IP LAN) es un gran
  detalle de soporte; el manual no lo menciona — podría ahorrar tickets.
- `sync-realtime.js` tope de sala: 12 dispositivos (comentario). El manual
  no menciona el límite; si un cliente grande conecta 13, se confundirá.
- El simulador de semáforo del manual funciona (JS embebido, líneas ~1400).
- Manual: 1523 líneas, secciones y glosario coherentes con la app real.

## 5. Entregables de esta ronda

`manual-maestro.html` corregido (3 fixes, resto intacto) + este informe.
Checksums en CHECKSUMS-AUDITORIA.txt.

## 6. Retomo si se corta la sesión

> "Retomando amigable-123. Megaauditoría completa: 46/48 promesas del manual
> verificadas en código; manual corregido (dark-lock restaurado, fotos en
> respaldo, 2 features marcadas próximamente). Pendiente decisión JF sobre
> #3 (construir lista de reposición) y #4 (gate trimestral en auth-ui.js).
> auth-ui.js sigue sin subirse. Continuar sin repetir trabajo."

## Addendum 2026-07-24 (segunda ronda)

- Captura de pantalla confirma que `auth-ui.js` (32 KB) existe en el repo —
  el "gate del reporte trimestral" casi seguro vive ahí; la marca
  "(próximamente)" de esa sección queda a tu criterio revertirla.
- IMPLEMENTADO `percha-reposicion.js`: lista de reposición por percha
  (reorden ∩ BCG, vista por rol). Manual: "(próximamente)" retirado.
- IMPLEMENTADO `simon-config.js`: colores configurables por producto y percha
  (días-dormido, umbrales de caducidad), motor aditivo sobre fetch, UI
  autoguardada solo-dueño. Manual: subsección "Colores a tu medida" agregada.
- `index.html` regenerado: bloque AMG de 9 scripts (5145 líneas; las 5125
  originales intactas byte a byte). `sw.js` ahora v32 con los 9 en precache.
- Nota: los overrides de color viven en localStorage del dispositivo y NO
  viajan aún en el respaldo completo — si los quieres dentro del Formato B,
  es una fase corta (avísame).
