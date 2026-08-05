# Sincronización de Especificación Visual — DESIGN.md
*Actualización:* Integración del diseño maestro Sinclair Bloom / Estética de Mostrador (exclusión formal del azul en tableros de inventario, reservado únicamente para reflexiones contables y financieras breves).

---

## 1. Validación de Cambios en `DESIGN.md`
El archivo `DESIGN.md` en la raíz del proyecto (`C:\00 Projects\AMIGABLE\DESIGN.md`) ha sido actualizado exactamente con los estándares del archivo maestro suministrado:
* **Paleta Sinclair Bloom / Status System:**
  - 🟢 `status-verde` / `status-verde-bg` / `status-verde-dk`
  - 🟡 `status-amarillo` / `status-amarillo-bg` / `status-amarillo-dk`
  - 🟠 `status-naranja` / `status-naranja-bg` / `status-naranja-dk`
  - 🔴 `status-rojo` / `status-rojo-bg` / `status-rojo-dk`
  - ⚫ `status-negro` / `status-negro-bg`
* **Exclusión de Azul en Tableros:** 
  - El color azul **NO** forma parte de los tableros de inventario ni de las alertas de stock operacional.
  - Se define estrictamente como **`accounting-azul`** (`#5294AC`), reservado exclusivamente para pequeñas y breves reflexiones contables o financieras.
* **Tipografía Funcional:**
  - `Space Grotesk` para títulos y displays.
  - `Source Sans 3` para texto general y cuerpo.
  - `JetBrains Mono` para códigos, cantidades, precios y etiquetas técnicas.

---

## 2. Coherencia Absoluta con el Ecosistema
Con esta actualización, cualquier agente de IA (Claude Code, Cursor, Windsurf) que lea `DESIGN.md` antes de renderizar componentes de interfaz sabrá sin dudar que:
1. No debe usar azul en tarjetas de inventario.
2. Las tarjetas se separan con bordes de 1px (`hairline`) y nunca con sombras difusas.
3. El diseño responde a la realidad táctil de un mostrador, quiosco o feria bajo luz de mercado.
