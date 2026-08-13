# Plan: 18 micromejoras al onboarding (789) y al demo (888)
2026-08-11 · amigable-123 · verificado contra código real, no supuestos

Dos fases independientes. Cada una se puede desplegar sola.

---

## FASE 0 — Lo que ya se verificó (no re-descubrir)

**Onboarding 789** vive todo en `docs/auth-ui.js`:
- `validar()` detecta `code===ACTIVATION_PIN && !dispositivoApropiado()` y llama a `iniciarActivacion()`
- `construirModalActivacion()` arma el modal con dos paneles: `#oc-act-form` y `#oc-act-exito`
- El panel de éxito hoy es literalmente: `<p class="marca">amigable-123 · listo</p>` + `<h2>Tu negocio esta activo</h2>` + `#oc-act-exito-txt` + botón `#oc-act-entrar`
- `#oc-act-exito-txt` se llena por `innerHTML` con: un aviso rojo de que 888 ya no sirve, el correo guardado, y el código de licencia
- El botón `#oc-act-entrar` hace `wrap.style.display="none"; entrar("dueno")`

**Demo 888**: `code===DEMO_PIN && !dispositivoApropiado()` → `entrar("demo")`, que setea `demoSesion=true` y `body.rol-demo`. Cae directo a la app, sin encuadre. El CSS `body.rol-demo` ya oculta cambio de claves y correo.

**Diagnóstico central:** el panel de éxito es un *recibo* (datos correctos, cero significado). Y el demo no dice en ningún momento qué está viendo el visitante ni qué hacer con eso.

---

## FASE A — Onboarding con 789 (10 mejoras)

### A1 · El título deja de ser un recibo · SOLO COPY · ALTO
**Dónde:** `construirModalActivacion()`, el `<h2>Tu negocio esta activo</h2>`
**Cambiar a:** `<h2>Ya tienes tu cuaderno digital compartido</h2>`
**Por qué:** nombra la categoría en el momento exacto en que la persona la adopta. Deja de ser "activé una app" y pasa a ser "ahora uso una herramienta que antes no existía para mí".

### A2 · Una línea de felicitación real · SOLO COPY · ALTO
**Dónde:** justo debajo del h2, antes de `#oc-act-exito-txt`
**Texto:** `Acabas de hacer algo que la mayoría de negocios pequeños todavía no hace: sacar el inventario de la cabeza y de los cuadernos, y ponerlo donde tu equipo lo pueda ver.`
**Por qué:** es el pedido explícito de JFC. Felicita por la decisión, no por el clic.

### A3 · Decir qué hace un CDC que un POS y un contable no hacen · SOLO COPY · ALTO
**Dónde:** bloque nuevo en el panel de éxito, después de A2
**Texto:** `Un punto de venta cobra. Un contable declara. Ninguno de los dos te dice, un martes cualquiera, qué producto se está muriendo en la percha ni quién movió el stock. Eso es lo que empieza hoy.`
**Por qué:** ancla la categoría por contraste con lo que la persona ya conoce. Sin esto, "cuaderno digital compartido" suena a nombre bonito y no a diferencia real.

### A4 · Los primeros 3 pasos concretos · SOLO COPY · ALTO
**Dónde:** bloque nuevo en el panel de éxito, antes del botón
**Texto:** `Los primeros 15 minutos: 1) carga 10 productos que muevas seguido, 2) registra una venta de prueba, 3) mira cómo cambia el color. Con eso ya entendiste el sistema completo.`
**Por qué:** el vacío después de activar es donde se pierde la gente. Un primer paso chico y cerrado vence a "explora la app".

### A5 · El botón nombra el destino, no la acción · SOLO COPY · MEDIO
**Dónde:** botón `#oc-act-entrar`
**Cambiar:** `Entrar a mi negocio` → `Empezar con mis primeros productos`
**Por qué:** un botón que nombra el resultado deseado convierte mejor que uno que nombra la mecánica.

### A6 · El aviso del PIN deja de ser una alarma roja · SOLO COPY · MEDIO
**Dónde:** el `<p>` rojo dentro de `#oc-act-exito-txt`
**Texto:** `Desde ahora tu PIN es 789 y el de demo (888) ya no abre este dispositivo. Cámbialo cuando quieras en Avanzado → Claves.`
**Mantener** el recuadro, pero en tono neutro (borde y texto en tinta normal, no en rojo de emergencia).
**Por qué:** hoy el primer elemento visual del momento de logro es una caja roja de alerta. Es información útil, no una emergencia, y el rojo tiene significado real en esta app (ver regla Simon).

### A7 · La licencia con instrucción de guardado · SOLO COPY · MEDIO
**Dónde:** el `<small>` que acompaña al código de licencia
**Texto:** `Guárdalo ahora: mándatelo por WhatsApp a ti mismo o sácale una foto. Con este código te reconocemos si necesitas ayuda o si cambias de teléfono.`
**Por qué:** "guárdalo" solo es una orden sin método. Decir *cómo* multiplica que ocurra.

### A8 · Recordar que el free tier no es una prueba que expira · SOLO COPY · MEDIO
**Dónde:** bloque nuevo, después de A4
**Texto:** `No hay cuenta regresiva. Mientras tengas hasta 25 productos, 100 ventas al mes y 1 empleado, sigue siendo gratis el tiempo que sea.`
**Por qué:** la objeción silenciosa después de activar cualquier cosa gratis es "¿cuándo me van a cobrar?". Responderla sin que la pregunten evita el abandono por desconfianza.

### A9 · Canal de soporte real y nominal · SOLO COPY · MEDIO
**Dónde:** pie del panel de éxito
**Texto:** `Si algo no cuadra, escribe por WhatsApp al +593 99 990 5080. Contesta la misma persona que construyó esto.`
**Por qué:** soporte concreto y humano, con número verificable. La escasez aquí es real (una sola persona), así que se puede decir sin inventar nada.

### A10 · Enlace al manual, en rol menor · SOLO COPY · BAJO
**Dónde:** pie del panel de éxito, después de A9
**Texto:** `¿Quieres el recorrido completo? Está en el manual.` con enlace a `./manual-maestro.html`
**Por qué:** salida para el perfil que lee todo antes de tocar, sin competir con el botón principal.

---

## FASE B — Sesión demo con 888 (8 mejoras)

### B1 · Una bienvenida de demo que encuadre lo que se está viendo · COPY + LÓGICA · ALTO
**Dónde:** `entrar()` en `auth-ui.js`, rama `esDemo===true`. Modal nuevo, una sola vez por sesión.
**Texto:**
- Título: `Estás viendo un negocio de ejemplo`
- Cuerpo: `Los productos, las ventas y los clientes que verás son inventados, para que puedas tocar todo sin miedo a romper nada. Vende, ajusta stock, borra lo que quieras.`
- Botón: `Entendido, quiero probar`
**Por qué:** hoy el visitante cae en una app llena de datos ajenos sin saber si son reales, si puede tocarlos, ni de quién son. Esa duda frena la exploración, que es justo lo único que el demo tiene que lograr.
**Lógica:** marcar visto en `sessionStorage` (ya aislado por `aislamiento.js`) para no repetirlo en cada navegación.

### B2 · Sugerir la primera acción concreta · SOLO COPY · ALTO
**Dónde:** dentro del modal de B1, antes del botón
**Texto:** `Empieza por Inventario: los colores te van a decir qué haría falta hacer hoy, sin que leas un solo número.`
**Por qué:** un demo sin tarea propuesta se convierte en clics al azar y salida rápida.

### B3 · Barra permanente de estado demo · COPY + LÓGICA · ALTO
**Dónde:** barra fija inferior, visible solo con `body.rol-demo`
**Texto:** `Estás en modo demo, con datos de ejemplo.` + botón `Empezar con mi negocio, gratis`
**Acción del botón:** cierra sesión demo y deja el gate listo para escribir 789
**Por qué:** es la única vía de conversión dentro del demo. Hoy alguien puede probar la app entera, quedar convencido, y no tener ningún camino hacia activarla.

### B4 · El botón de conversión explica qué pasa al tocarlo · SOLO COPY · MEDIO
**Dónde:** confirmación al tocar el botón de B3
**Título:** `Empezar a usar la app para mi negocio`
**Texto:** `Vas a empezar a usar la app para tu negocio, en blanco, en este mismo dispositivo. Los datos de ejemplo desaparecen. Toma menos de un minuto.`
**Por qué:** quita el miedo a que activar sea irreversible o largo, que es lo que frena el clic final.

### B5 · Nombrar la categoría también en el demo · SOLO COPY · MEDIO
**Dónde:** modal de B1, línea de cierre
**Texto:** `Esto no es un punto de venta ni un programa de contabilidad. Es un cuaderno digital compartido: lo que tú y tu equipo necesitan mirar todos los días.`
**Por qué:** la persona en demo está clasificando mentalmente el producto en una categoría que ya conoce. Si no le damos la categoría correcta, la mete en la equivocada y la compara con el rival equivocado.

### B6 · El límite del demo, dicho sin drama · SOLO COPY · MEDIO
**Dónde:** modal de B1, junto a B2
**Texto:** `Lo único que el demo no hace es guardar tu negocio real. Para eso está el código 789, que es gratis.`
**Por qué:** responde la duda "¿esto que estoy cargando se queda?" antes de que alguien cargue 30 productos reales en el demo y los pierda.

### B7 · Enlace a la calculadora para el perfil que decide por números · SOLO COPY · BAJO
**Dónde:** pie del modal de B1
**Texto:** `¿Prefieres ver primero cuánto tiempo recuperas? Está calculado aquí.` con enlace a `./ahorra.html#calculadora`
**Por qué:** parte de los visitantes no se convence tocando, se convence con una cifra. Darles la puerta en vez de perderlos.

### B8 · Los roles del demo, explicados donde se eligen · SOLO COPY · BAJO
**Dónde:** el recuadro de códigos demo del gate (`#oc-gate-demo-pins`, ya existe)
**Agregar:** `Cada código muestra la app como la ve esa persona. El empleado no ve las ganancias.`
**Por qué:** hoy los 3 códigos parecen 3 llaves equivalentes. Explicar la diferencia convierte una lista en una demostración del control por roles, que es un argumento de venta fuerte y hoy invisible.

---

## Requiere decisión de JFC antes de implementar

- **A9 (soporte)**: APROBADO por JFC (2026-08-13). El número va visible y se enmarca como parte del soporte de los 5 años de licencia.
- **B3 (barra permanente)**: RESUELTO (2026-08-13). Aparece a los **30 segundos**, no a los 2 minutos. La probabilidad de abandono de una sesión es máxima en los primeros 10 segundos, sigue alta entre 10 y 20, y se aplana cerca de los 30. Antes de eso la barra interrumpe a alguien que todavía está decidiendo si se queda; a los 2 minutos ya no alcanza a la mayoría. Umbral en `B3_DELAY_MS` dentro de `auth-ui.js`.
- **Descubierto al implementar**: el demo NO entra por 888. `DEMO_PIN` es `456`; el 888 pasa por `verificarOwnerOEmpleado` y entra como dueño real, sin `rol-demo` y sin encuadre de demo. Fase B quedó conectada al 456. Decisión pendiente de JFC.
- **Ninguna** de las 18 promete algo que no exista hoy. No hay garantía formal inventada, ni canal de soporte nuevo, ni cifras sin respaldo.

---

## Verificación por fase

**Fase A:**
1. Entrar con 789 en un dispositivo sin activar, completar el formulario
2. Confirmar que el panel de éxito muestra: título de categoría, felicitación, contraste POS/contable, 3 primeros pasos, aviso de PIN en tono neutro, licencia con instrucción de guardado, free tier sin cuenta regresiva, soporte, manual
3. `grep -i "opacity\|rgba(" ` sobre el bloque nuevo: cero resultados en texto
4. Ningún em dash como conector en prosa
5. Revisar en 375px que nada se corte y que el botón mantenga 44px+

**Fase B:**
1. Entrar con 888, confirmar que el modal aparece una sola vez por sesión
2. Navegar entre vistas y confirmar que no reaparece
3. Confirmar que la barra de B3 solo existe con `body.rol-demo` y desaparece al activar
4. Tocar el botón de conversión y confirmar que lleva al gate listo para 789
5. Mismos chequeos de estilo que Fase A

**Ambas fases, antes de dar por terminado:**
- `grep -in "diseñado para\|el objetivo de\|esta seccion\|framework"` sobre `auth-ui.js`: cero resultados en texto visible
- Confirmar que ningún texto nuevo usa azul como color de estado


---

## Auditoría 2026-08-13: las 18, verificadas contra el código

Las 18 están implementadas y verificadas por grep sobre `auth-ui.js`, no por memoria:
A1 a A10 y B1 a B8, todas presentes. El recuadro rojo de emergencia del aviso de PIN
(`#FDECEA`) ya no existe, que era la comprobación en negativo de A6.

Correcciones aplicadas sobre el plan original:
- **B3** dispara a los **30 segundos**, no a los 2 minutos.
- **B4** dice "Empezar a usar la app para mi negocio", no "tu propio negocio".
- **888** no abría el demo. Entraba como dueño real. Corregido.

### Lo que la Fase A NO cubre

La Fase A termina en la pantalla de éxito. El onboarding real del que empieza a usarla
sigue después, en `welcome-ui.js` (wizard con candado de confirmación) y `tutorial-ui.js`
(tour de 9 pasos por cada vista). Ese camino existía y no estaba en el plan. Auditado
hoy, tenía tres defectos en texto que ve todo usuario nuevo:

1. **El azul estaba en el semáforo del tutorial.** Decía "Rojo: reponer urgente.
   Amarillo: revisar pronto. Azul: buen margen, impúlsalo. Verde: todo en orden."
   Faltaban naranja y negro y sobraba el azul. Corregido a los cinco reales.
2. **"Una percha es un punto de venta."** Contradice el posicionamiento entero.
   Ahora dice "un lugar donde tienes producto".
3. Cinco em dashes como conectores en prosa visible.

### Pendiente de decisión

El texto de A4 promete tres pasos concretos ("carga 10 productos, registra una venta de
prueba, mira cómo cambia el color"). El tutorial recorre las nueve vistas de la app en
vez de esos tres pasos. La promesa y el recorrido no son la misma cosa.
