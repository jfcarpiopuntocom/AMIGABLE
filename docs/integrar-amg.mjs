// integrar-amg.mjs — Amigable-123
// Inserta (o actualiza) el bloque AMG al final de TU index.html local.
// USO:  node integrar-amg.mjs index.html
// - Hace backup automático: index.html.bak-<timestamp>
// - Idempotente: si el bloque AMG ya existe (de Fase 4 o de una corrida
//   anterior), lo REEMPLAZA por el bloque completo de 7 scripts. Nunca duplica.
// - No toca ni una línea del resto del archivo.
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const archivo = process.argv[2] || "index.html";
const MARCA_INI = "<!-- AMG-BLOQUE-INICIO";
const MARCA_FIN = "AMG-BLOQUE-FIN -->";

const BLOQUE = `<!-- AMG-BLOQUE-INICIO ==============================================
  amigable-123 — Infraestructura de estabilidad (Fases 1+2+4 + identidad + reposicion + colores)
  Bloque APARTE y fail-safe: si alguno de estos .js falta o falla, la app
  sigue funcionando EXACTAMENTE igual (cada módulo se auto-desactiva solo).
  ORDEN OBLIGATORIO: bus -> logger -> telemetry -> identity -> audit ->
  sync-queue -> ui-actions (ui-actions SIEMPRE al final: envuelve funciones
  que ya deben existir en window). Namespace window.AMG — no toca window.OC*.
  Rollback: borrar este bloque completo. Nada más del archivo fue modificado.
  Regenerable con: node integrar-amg.mjs index.html
  AMG-BLOQUE-FIN -->
<script src="./event-bus.js"></script>
<script src="./logger.js"></script>
<script src="./telemetry.js"></script>
<script src="./identity-context.js"></script>
<script src="./audit-store.js"></script>
<script src="./sync-queue.js"></script>
<script src="./simon-config.js"></script>
<script src="./percha-reposicion.js"></script>
<script src="./ui-actions.js"></script>
`;

let html = readFileSync(archivo, "utf8");
const backup = archivo + ".bak-" + Date.now();
copyFileSync(archivo, backup);

// 1) Quitar bloque AMG previo si existe (idempotencia).
const ini = html.indexOf(MARCA_INI);
if (ini !== -1) {
  // Borrar desde la marca hasta el último </script> del bloque viejo.
  const finMarca = html.indexOf(MARCA_FIN, ini);
  if (finMarca === -1) { console.error("ERROR: bloque AMG corrupto (marca de cierre ausente). Nada modificado."); process.exit(1); }
  let fin = finMarca + MARCA_FIN.length;
  // Consumir los <script src="./..."></script> contiguos que le siguen.
  const resto = html.slice(fin);
  const m = resto.match(/^(\s*<script src="\.\/[a-z-]+\.js"><\/script>)+\s*/);
  if (m) fin += m[0].length;
  html = html.slice(0, ini) + html.slice(fin);
}
// 1b) Quitar también el bloque de Fase 4 (comentario "FASE 1 + FASE 4") si existe.
const f4 = html.indexOf("FASE 1 + FASE 4");
if (f4 !== -1) {
  const iniC = html.lastIndexOf("<!--", f4);
  const finC = html.indexOf("-->", f4);
  if (iniC !== -1 && finC !== -1) {
    let fin = finC + 3;
    const resto = html.slice(fin);
    const m = resto.match(/^(\s*<script src="\.\/[a-z-]+\.js"><\/script>)+\s*/);
    if (m) fin += m[0].length;
    html = html.slice(0, iniC) + html.slice(fin);
  }
}

// 2) Insertar el bloque nuevo justo antes de </body></html> (última ocurrencia real).
const idxBody = html.lastIndexOf("</body>");
if (idxBody === -1) { console.error("ERROR: no se encontró </body>. Nada modificado (restaura desde " + backup + " si hace falta)."); process.exit(1); }
html = html.slice(0, idxBody) + BLOQUE + html.slice(idxBody);

writeFileSync(archivo, html);
console.log("OK: bloque AMG (9 scripts) integrado en " + archivo);
console.log("Backup del original: " + backup);
console.log("Verifica en el navegador: consola debe mostrar [AMG.EventBus] listo ... [AMG.UiActions] N funciones envueltas.");
