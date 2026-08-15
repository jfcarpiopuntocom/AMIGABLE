# Plan: variantes por chip interno, y la tarjeta pasa a ser la foto
2026-08-14 · amigable-123 · verificado contra el código real

Nueve micromejoras. Cada una se despliega sola y ninguna toca el dinero.

---

## FASE 0 — Lo que ya existe (no re-descubrir)

Verificado leyendo el código hoy, no supuesto:

- **`mock-backend.js` ya usa prefijos de SKU para agrupar.** Hay un `sku.indexOf(pre + "-") === 0` que autonumera dentro de un prefijo. Los SKU reales de la demo ya tienen forma `CAM-PF-DSM`. El mecanismo de familia **existe y está probado**.
- **`cargarGridVender()` ya pinta tarjetas foto-first con borde Simon**: foto de 64px arriba, borde de 2px en `var(--sim-<estado>)`, nombre y precio debajo, y un respaldo con la inicial sobre fondo de color cuando no hay foto.
- **La cuadrícula de Inventario (`#gridInventario`) NO lo hace**: usa `.caja.<color>`, que es relleno sólido con el nombre encima.
- **`idb-fotos.js`** guarda fotos en IndexedDB, no en localStorage, con `OCFotos = { guardarFoto, leerFoto, leerTodas, borrarFoto, migrarSiHaceFalta, soportado }`.

### El diagnóstico

**El patrón que JFC quiere ya está implementado, en la pantalla equivocada.** Vender tiene foto con borde de color; Inventario tiene la plasta. No hay que inventar el diseño, hay que mover el que ya funciona y subirle la calidad.

### La decisión de arquitectura que ordena todo

**Las variantes no son una estructura nueva. Son productos normales que comparten un prefijo de SKU.**

De ahí se sigue todo: no hay tabla de familias, no hay producto padre, no hay stock repartido. Agrupar, buscar y heredar foto son **lentes** que se ponen encima para mirar. Ninguna lente guarda datos, ninguna puede corromperlos, y si una se rompe se rompe sola.

---

## Las nueve

### M1 · La familia es el prefijo del SKU · LÓGICA · ALTO
`ALM5-V1` y `ALM5-V2` son de la familia `ALM5`. Función pura `familiaDe(sku)` que corta en el primer guion. Cero almacenamiento nuevo.

**Por qué:** una tabla de familias es un dato que puede quedar huérfano, desincronizarse entre dispositivos o apuntar a productos borrados. El prefijo vive **dentro** del producto que describe y no puede desincronizarse de sí mismo.

**Guard:** un SKU sin guion no tiene familia. El producto sigue existiendo y vendiéndose igual.

### M2 · Cada variante es una fila de stock completa · LÓGICA · ALTO
Stock, costo, precio, estado Simon y foto propios. Ninguna variante lee ni escribe el stock de otra.

**Por qué:** compartimentar aplicado al dinero. Un padre que reparte stock entre hijos es un punto único donde un error se multiplica.

**Guard:** no puede fallar en cadena. Cada variante es una fila del mismo tipo que cualquier producto, así que hereda todos los guardas existentes sin código nuevo.

### M3 · La foto manda, el borde es el semáforo · COPY + LÓGICA · ALTO
La tarjeta de Inventario pasa a foto en proporción 4:3, nombre debajo, borde de 4px en el color Simon. Se copia el patrón de `cargarGridVender()`.

**Liquid:** `grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr))`, `aspect-ratio` en la foto, tipografía en `clamp()`. Cero anchos fijos.

**Guard:** si el estado llega vacío, el borde cae en el gris neutro. Nunca una tarjeta sin borde.

### M4 · Cadena de respaldo de imagen, tres eslabones · LÓGICA · ALTO
Foto propia; si no hay, foto de otra variante de la familia; si tampoco, bloque con iniciales sobre degradado neutro.

**Por qué:** el vendedor fotografía una caja, no cinco variantes. El segundo eslabón le da tarjeta decente a cuatro productos por el trabajo de uno.

**Guard:** `onerror` de la imagen baja al siguiente eslabón. Sin IndexedDB, los tres caen a iniciales. **Ninguna tarjeta puede quedar en blanco.**

### M5 · El chip, etiqueta corta y visible · COPY + LÓGICA · MEDIO
Campo de texto libre, máximo 12 caracteres, pintado bajo el nombre: `chip V2`, `Tuya`, `433MHz`. Vacío por defecto, opcional para siempre.

**Por qué texto libre y no lista cerrada:** los chips del mercado cambian cada temporada y una lista cerrada obliga a tocar código cada vez que aparece uno.

**Guard:** vacío significa que la etiqueta no se dibuja.

### M6 · Agrupar en la lista, jamás fusionar en el dato · LÓGICA · MEDIO
Inventario puede mostrar las variantes juntas bajo el nombre de familia, con total de unidades **siempre derivado**, calculado al pintar. No se guarda.

**Por qué:** misma regla que rige saldos y planes de pago. Un total guardado es un total que puede mentir.

**Guard:** el agrupamiento es preferencia de vista, guardada aparte del inventario. Si se corrompe, la lista vuelve a plana y no se pierde un dato.

### M7 · Alta de variante: duplicar y cambiar · COPY + LÓGICA · MEDIO
Botón *Agregar variante* en la ficha. Copia nombre, familia, precio y foto; deja stock en cero y el cursor en el campo del chip.

**Guard:** stock en cero es el valor seguro. Si el duplicado sale mal, aparece un producto vacío que se borra; nunca stock que nadie compró.

### M8 · Buscar por familia trae todas las variantes · LÓGICA · BAJO
`ALM5` devuelve las cinco; `V2` devuelve una. El buscador ya filtra por nombre y SKU: se le suma el chip.

**Guard:** la búsqueda vive entera en el cliente sobre datos ya cargados. Si se rompe, se rompe sola y la lista completa sigue ahí.

### M9 · Un producto sin variantes no se entera de nada · LÓGICA · ALTO
Sin chip, sin guion en el SKU y sin agrupar, la app se comporta igual que hoy hasta el último pixel.

**Por qué:** la mayoría de los negocios no vende variantes. La función tiene que ser invisible para ellos.

**Guard:** ésta es la prueba que decide si el plan está bien construido. Si un negocio sin variantes nota *cualquier* diferencia, algo se acopló donde no debía.

---

## Qué se toca y qué no

| Pieza | Cambio | Riesgo si falla |
|---|---|---|
| `mock-backend.js` | Dos campos opcionales: `chip` y familia derivada | Campos vacíos, comportamiento actual |
| Tarjeta de Inventario | Foto arriba, borde Simon, chip debajo | Cae al bloque de iniciales |
| Buscador | Suma `chip` a los campos que ya mira | Falla sola, la lista queda |
| Ficha de producto | Campo de chip y botón de variante | Campo opcional, botón que no aparece |
| **Stock, ventas, dinero** | **Nada** | Sin superficie nueva |

---

## Verificación

1. Un negocio sin una sola variante no ve ninguna diferencia respecto de hoy.
2. Borrar la variante V2 no mueve ni una unidad del stock de la V1.
3. Producto sin foto muestra la de su familia; sin ninguna en la familia, iniciales; nunca un hueco.
4. Con IndexedDB deshabilitado a mano, la cuadrícula se pinta completa.
5. Buscar la familia trae todas; buscar el chip trae una.
6. El total agrupado coincide con la suma después de vender una unidad.
7. A 320px la tarjeta no se rompe y el toque conserva 44px.
8. Ningún texto bajo 13px, ningún color de texto en `rgba()`, cero emojis.

---

## Orden de despliegue

M3 y M4 primero: la tarjeta con foto mejora la app **para todos**, tengan variantes o no, y no depende de nada de lo demás. Después M1, M2 y M5, que son el modelo. Al final M6, M7 y M8, que son comodidad. M9 no se implementa: se verifica en cada paso.
