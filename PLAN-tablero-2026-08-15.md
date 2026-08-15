# Plan: tablero.html, el tablero de control en vivo
2026-08-15 · amigable-123 · 16 micromejoras · verificado contra el código real

---

## FASE 0 — Lo que ya existe (esto cambia el plan entero)

Leído hoy en `docs/sync-realtime.js`, no supuesto:

- **El relay ya existe**: `wss://amigable-sync-relay.jfcarpio.workers.dev/sala/`
- Su propio comentario lo describe como **"tonto y desmemoriado a propósito: solo rebota blobs cifrados, nunca los guarda ni los lee en claro"**.
- **El cifrado de punta a punta ya está implementado**: `PBKDF2(código de licencia, 100.000 iteraciones, SHA-256)` → `AES-GCM 256`. La clave se deriva en el dispositivo y **nunca viaja al relay**.
- **Alcance actual: solo cambios de stock.** No viaja el resto del negocio.

### La conversación que pediste sobre fly.io

**No necesitas un servidor de terceros, y ponerlo sería peor.**

Tu preocupación es real: "que yo nunca maneje sus datos". Pero eso ya está resuelto, y no por promesa sino por matemática. Tu relay **no puede** leer los datos, aunque quisieras: recibe bytes cifrados con una clave derivada del código de licencia, que nunca sale del teléfono del cliente. Mover eso a fly.io o a cualquier tercero no cambia quién puede descifrar (nadie, salvo ellos) y **agrega una entidad más a la cadena de confianza**, un contrato más que leer, una factura más y un punto más de caída.

Dicho de otro modo: hoy la garantía es *"no puedo verlo"*. Con un tercero seguiría siendo *"no puedo verlo"*, más *"y tampoco controlo dónde está"*. Es un cambio a peor.

Lo que sí falta no es un servidor. Son dos cosas concretas:

1. **El alcance.** Hoy solo viaja el stock. El tablero necesita ver ventas, clientes, cartera y cierres.
2. **El arranque en frío.** El relay no guarda nada, así que un tablero recién abierto no tiene qué mostrar hasta que algún dispositivo hable.

El punto 2 es la única decisión de fondo, y está en M3.

### Sobre las librerías

El tablero es un artefacto **distinto de la app**. La app arranca sin internet y por eso no admite CDN. El tablero, por definición, **necesita conexión** para mostrar datos en vivo. Ahí el CDN sí corresponde, y conviene: es carga que no mantenemos.

Verificado hoy:

| Librería | Para qué | Licencia | Por qué esta |
|---|---|---|---|
| **Tabulator** | Tabla, búsqueda, agrupación, orden | MIT | Vanilla JS, cero jQuery, y trae **los exports incorporados**: CSV, XLSX, PDF, JSON, HTML. Colapsa cuatro librerías en una. |
| **SheetJS** (`xlsx.full.min.js`) | Excel real | Apache 2.0 | Es la que Tabulator usa por debajo para XLSX. |
| **jsPDF + AutoTable** | PDF | MIT | Es la que Tabulator usa por debajo para PDF. |

La alternativa headless (TanStack) da control total del markup pero obliga a construir el render, la búsqueda y cada export a mano. Para un tablero de visualización eso es trabajo sin retorno.

---

## FASE A — El canal (M1 a M5)

### M1 · El tablero es un participante más de la sala, de solo lectura · LÓGICA · ALTO
`tablero.html` pide el código de licencia, deriva la misma clave con el mismo PBKDF2, y se conecta a la misma sala. No hay servidor nuevo, no hay endpoint nuevo, no hay cuenta nueva.

**Por qué:** cada pieza de infraestructura que no se agrega es una que no se puede caer ni facturar.

**Guard:** el tablero **jamás emite** un mensaje de escritura. Es un oyente. Aunque alguien manipule su código en el navegador, el peor daño posible es ver, nunca alterar.

### M2 · El alcance del sync sube de "stock" a "negocio" · LÓGICA · ALTO
Se agregan al canal: ventas del día, clientes con saldo, movimientos de cartera, caja chica y cierres. Todo cifrado con la clave que ya existe.

**Guard:** cada tipo va con su nombre propio. El tablero ignora en silencio lo que no reconoce, así que una app vieja y un tablero nuevo conviven sin romperse.

### M3 · El arranque en frío: **lo resuelve el teléfono, no un servidor** · LÓGICA · ALTO
Al abrir, el tablero manda `dame-todo` a la sala. Un dispositivo del dueño que esté conectado responde con una foto completa, cifrada. Si no hay ninguno conectado, el tablero lo dice con todas las letras: *"Abre la app en tu teléfono para ver los datos aquí."*

**Por qué así y no guardando una foto en el relay:** guardar, aunque fuera cifrado, convierte al relay en depositario y rompe la promesa que hoy se cumple por diseño. Ya se rechazó una vez esta misma idea, el 2026-08-04.

**El costo, dicho sin adornos:** el dueño necesita un dispositivo encendido para ver el tablero. Es una molestia real. La alternativa es guardar la foto cifrada en el relay, que funcionaría sin el teléfono pero cambiaría la naturaleza de la promesa. **Esta es la decisión que hay que tomar antes de escribir M3.**

### M4 · Foto por partes, no un bloque · LÓGICA · MEDIO
La foto viaja en trozos numerados. El tablero pinta lo que le va llegando y muestra el progreso.

**Guard:** si falta un trozo, se pide solo ése. Un negocio con 3.000 ventas no puede depender de que un único mensaje gigante llegue entero.

### M5 · Detección temprana, no confianza · LÓGICA · ALTO
El tablero muestra siempre **la hora del último dato recibido**, no un "conectado" genérico. Si pasan más de dos minutos sin novedades, lo dice.

**Por qué:** el motivo por el que existe este tablero es que el dueño no quiere *confiar* en que la sincronización funciona. Un indicador verde que miente sería peor que no tener tablero.

---

## FASE B — El tablero (M6 a M12)

### M6 · `tablero.html`, con tu estética · COPY + LÓGICA · ALTO
Homologado a `ahorra.html`: Space Grotesk y JetBrains Mono, la paleta del producto, logo en base64, iOS y WhatsApp a prueba de modo oscuro, mobile-first, piso de 13px, cero emojis fuera de estrellas y corazones.

**Guard:** autocontenido salvo los tres CDN. Se puede mandar por WhatsApp y abre igual, apuntando al mismo relay.

### M7 · La tabla, con Tabulator · LÓGICA · ALTO
Una tabla por vista: Productos, Ventas, Clientes, Cartera, Caja. Columnas ordenables, agrupación por categoría o percha, y scroll virtual para que 5.000 filas no maten un teléfono de 2016.

### M8 · La búsqueda que hace la diferencia · LÓGICA · ALTO
Un solo campo que busca en **todas** las columnas a la vez, tolerante a acentos y a errores de tipeo, con los resultados resaltados.

**Por qué un solo campo:** el dueño no piensa en columnas, piensa *"la camiseta de Metallica"* o *"lo que le fié a Rosa"*.

### M9 · Exportar de verdad · LÓGICA · ALTO
CSV, Excel, PDF, JSON y copiar al portapapeles. Nativo de Tabulator, sin código propio de formato.

**Guard:** el PDF y el Excel llevan el nombre del negocio, la fecha y el rango exportado en el encabezado. Un archivo sin contexto es basura dentro de una semana.

### M10 · Reportes con sentido, no volcados · COPY + LÓGICA · MEDIO
Tres botones que arman un PDF listo para el contador o el banco: **Mes cerrado**, **Inventario valorizado** y **Cartera al día**.

**Por qué:** un CSV de 4.000 filas no le sirve a un contador. Un reporte de una página sí.

### M11 · Lo que la app comprime, aquí se abre · LÓGICA · ALTO
La app del día a día tiene que caber en un teléfono y decide por el usuario. El tablero muestra lo que allá se resume: el margen producto por producto, la venta hora por hora, el saldo cliente por cliente con su historial completo.

### M12 · Cada vista termina en una acción de la app · COPY · MEDIO
Al pie de cada tabla, una línea que nombra la herramienta que resuelve lo que la tabla acaba de mostrar. Si hay capital dormido, la reposición por percha. Si hay cartera atrasada, los planes de pago.

**Por qué:** buena parte de lo que ya está construido no se usa porque nadie sabe que existe. Ver el problema y tener el nombre de la herramienta al lado es lo que convierte una tabla en una decisión.

**Guard de copy:** se nombra la herramienta y lo que hace. **Nunca** se explica la estrategia detrás de la pantalla.

---

## FASE C — Acceso y seguridad (M13 a M16)

### M13 · Dos puertas hacia el tablero · COPY + LÓGICA · MEDIO
Un botón en **Avanzado** y una entrada en **Ayuda (?)**. Ambas abren `tablero.html` con el código ya puesto, para no teclearlo en el teléfono.

### M14 · Solo dueño y admin · LÓGICA · ALTO
El botón no existe para el rol empleado ni contador. Y el tablero exige el código de licencia, que un empleado no tiene.

**Guard:** dos capas independientes, como el resto de la app. Que el botón esté oculto no es la seguridad; la seguridad es el código.

### M15 · El aviso, en el momento correcto · COPY · ALTO
Al copiar el enlace del tablero: *"Este enlace lleva tu código. Mándalo solo a quien ya tiene acceso al negocio."*

**Por qué:** un tablero que se comparte por WhatsApp es un código de licencia que se comparte por WhatsApp. El aviso va donde ocurre el riesgo, no enterrado en el manual.

### M16 · El tablero se reporta solo · LÓGICA · MEDIO
`salud-app.js` también en `tablero.html`. Si un CDN se cae o una librería cambia, se sabe por el panel antes de que alguien escriba.

**Guard:** si un CDN no carga, el tablero **igual muestra la tabla** en HTML plano, sin ordenar ni exportar, y lo dice. Degradar no es fallar.

---

## Verificación

1. Con el teléfono apagado, el tablero dice qué hacer y **no** muestra una tabla vacía sin explicación.
2. Una venta hecha en el teléfono aparece en el tablero en menos de cinco segundos.
3. Un código equivocado no muestra nada: el mensaje cifrado con otra clave es ruido, no un error.
4. Con el rol empleado, el botón de Avanzado no existe.
5. Los cinco exports abren sin quejas en Excel, en Sheets y en un lector de PDF.
6. Con los tres CDN bloqueados a mano, la tabla se sigue viendo.
7. A 320px de ancho no hay scroll horizontal y el toque conserva 44px.
8. Cero texto bajo 13px, cero `rgba()` como color de texto, cero emojis.
9. Ningún texto visible explica por qué existe una sección ni qué se buscaba con ella.

---

## Lo que hay que decidir antes de empezar

**M3, el arranque en frío.** Es la única bifurcación real:

- **El teléfono responde** (recomendado). Cero almacenamiento, la promesa intacta. Cuesta que el dueño necesite un dispositivo encendido.
- **Foto cifrada en el relay.** Funciona sin el teléfono. Cuesta que el relay pase de mensajero a depositario, aunque no pueda leer nada.

Todo lo demás se puede construir sin resolver esto, porque M3 está aislado a propósito. Pero conviene decidirlo ahora: cambia la primera frase que el dueño lee al abrir su tablero.
