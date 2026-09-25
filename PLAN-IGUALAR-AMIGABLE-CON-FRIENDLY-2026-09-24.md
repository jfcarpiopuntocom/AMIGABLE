# PLAN: amigable-123 = friendly-123 en español (2026-09-24)

Orden de JFC (2026-09-24): "amigable es friendly con otro nombre y sin switch de
idiomas, debe ser idéntica pero Spanish-first (only)". Y: amigable tiene un tier
**Robin Hood** gratis para siempre (LatAm merece ayuda); Jev evalúa qué queda gratis
sin dañar ventas ni conversiones; la decisión final es de JFC.

## Por qué no se porta pieza por pieza
Brecha medida (rutas de mock-backend): friendly tiene 15 que amigable no
(cancelar/editar/devolver venta, cuadre y meses de Comisiones, caja chica,
moneda, impuesto, lealtad x3, renombrar categorías, editar eventos, directorio,
movimientos, acceso de artista). Además la UI y archivos como el sync nuevo.
Portando a mano, amigable queda atrás para siempre. Lo correcto: amigable =
código de friendly + CAPA DE IDENTIDAD + funciones propias de amigable.

## Riesgo principal: datos reales de clientes
Si una clave de almacenamiento cambia de nombre, un aparato abre vacío. Por eso
la capa de identidad se mapea ANTES de tocar código y se prueba con un respaldo
real importado (cero pérdida).

## Fases
0. **Mapa de identidad** (solo lectura): prefijos `amigable_*` (333 usos en ~40
   archivos vivos), licencia `AMG-`, Worker y relay, sala de sync, textos, marca,
   límites del plan gratis (Robin Hood), PINs, `amigable-shell-vNN`.
1. **Funciones propias de amigable** que se conservan: tips financieros,
   compradores, umbrales por días, apodo del cliente, reservas de eventos (y lo
   que el diff de UI revele). Nada se borra.
2. **Español fijo**: el `i18n.js` de friendly con idioma forzado a ES y sin
   selector; los textos ES ya existen para toda la UI.
3. **Construcción**: script reproducible que toma friendly `docs/` y aplica la
   capa de identidad + injerta lo propio. Mismo script para cada avance futuro.
4. **Migración y prueba**: respaldo exportado de un aparato amigable real se
   importa en la versión nueva; todo debe aparecer. Corrida Hugo/Paco/Luis
   (test/cuadre-hugo-paco-luis.test.js: C1-C4 están en `todo` esperando esto).
5. **Robin Hood**: Jev puntúa candidatos a gratis-para-siempre con criterios
   explícitos (ayuda real al emprendedor vs impacto en conversión); JFC decide.
6. **Publicación** con shell nuevo, verificación en la URL viva y dos aparatos.

## Hecho hoy (amigable-shell-v119)
- B4: una venta ya pagada al asociado/a ya no se puede anular, ni forzada
  (antes la anulación supervisada la BORRABA del registro con la plata ya pagada).
- B5: pagar una percha solo sella ventas con comisión (guarda a futuro).
- Arnés de cuadre copiado de friendly (test/helpers/cuadre.cjs, adaptado: IVA
  incluido en el precio, sin campo `mes`).

## Fuera de este plan
- consultorio-123: app distinta (sin perchas ni comisiones). Solo recibe los
  arreglos de dinero/stock/balance que le apliquen.

## Fase 0 — mapa medido (2026-09-24, archivos vivos de docs/)
- Solo en friendly (codigo): artista.js, cargador.js, dashboard.html, estado.html,
  estado-cifrado.js, ganchos-demo.js, i18n.js, inspector*.js, licencia-prueba.js,
  panel-licencias.js, save.html, soporte-visual.js, sync-watchdog.js,
  workshop-brand.js, robots.txt, sitemap.xml, _headers, demo/.
- Solo en amigable: ahorra.html, licencias.json, integrar-amg.mjs (+ notas).
- Comunes con mayor brecha (friendly/amigable, bytes): mock-backend 399K/149K,
  avanzado-extra 226K/156K, auth-ui 128K/101K, sync-realtime 84K/42K,
  crypto-store 46K/15K, manual.html 191K/21K. Amigable MAS grande en:
  manual-maestro.html (908K vs 1K), tablero.html (894K vs 1K), checklist.html,
  manifiesto.html: son contenido propio de amigable y se conservan.
- CHOQUE DE TIER: licencia-prueba.js (friendly: 30 dias y luego solo lectura)
  contra Robin Hood (amigable: gratis para siempre con limites). Fase 5 decide
  (Jev evalua, JFC decide) antes de traer ese archivo.
- Rutas de mock-backend solo en amigable (se conservan): /api/reportes/tips-financieros,
  /api/compradores, /api/configuracion/umbrales-dias, /api/clientes/:id/apodo,
  /api/reservas-eventos.
