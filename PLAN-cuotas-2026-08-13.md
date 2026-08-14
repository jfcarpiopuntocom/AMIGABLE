# Plan: cuotas y abonos irregulares
2026-08-13 · amigable-123 · friendly-123 · consultorio-123
Verificado contra el código real, no contra supuestos.

---

## FASE 0 — Lo que ya existe (no re-descubrir)

**`cartera.js`** vive en los tres repos. API pública verificada:

```
AMG.Cartera = {
  VERSION, registrarMovimiento, saldoDeCliente,
  vistaCarteraSegunRol, alertaActiva, fijarAlerta
}
```

- `registrarMovimiento(clienteId, tipo, monto, motivo)` con `tipo` = `"cargo"` o `"abono"`. Es el **único** punto de escritura. El monto siempre es positivo: el signo lo decide el tipo, así nadie puede abonar en negativo para simular un cargo.
- Emite hechos `cartera_cargo` y `cartera_abono` por `AMG.EventBus`, que `hechos.js` persiste con reloj vectorial y cadena de hash.
- El saldo **nunca** se guarda. Se deriva sumando los hechos. Saldo negativo = debe. Saldo positivo = tiene crédito a favor.
- `vistaCarteraSegunRol()` es el guard de privacidad: al rol empleado le entrega `historial: []` y `puedeExportar: false`.
- La alerta por cliente vive en `localStorage`, no en los hechos: es preferencia de UI, no dinero.

**`AMG.Hechos.registrar(tipo, datos)`** acepta cualquier tipo nuevo. No hay que tocar `hechos.js` para agregar uno.

**`nucleo-cxc.js`** en consultorio-123 es el mismo patrón con `cxc_cargo` / `cxc_abono`, paciente en vez de cliente.

**Lo que NO existe en ninguna de las tres:** cualquier noción de *cuándo* debería llegar el dinero.

### El diagnóstico

Los abonos irregulares **ya funcionan completos**. Alguien debe $200, abona $30 hoy, $50 el jueves y $12 el mes que viene: el saldo se deriva bien sin que nadie haya escrito una línea de código de cuotas.

Lo que falta no es registrar pagos. Es registrar una **expectativa**: qué se acordó, para cuándo, y por lo tanto quién está atrasado hoy. Hoy el dueño ve "Rosa debe $170" y no tiene forma de saber si eso está bien o mal.

### La decisión de arquitectura que ordena todo el plan

**Un plan de pagos no es dinero. Es una expectativa.**

De ahí se sigue todo:

- El plan **nunca** mueve el saldo. Si moviera el saldo, crear un plan haría aparecer deuda que nadie contrajo.
- El plan **no** genera cargos automáticos al vencer una cuota. La deuda ya se contrajo entera el día del `cartera_cargo`.
- "Al día" o "atrasado" es un valor **derivado**, igual que el saldo: se compara lo abonado desde que existe el plan contra lo que debería haber llegado a la fecha de hoy.
- Un abono es un abono, venga del monto exacto de la cuota o no. **Las cuotas fijas y los abonos irregulares no son dos sistemas.** Son el mismo sistema con y sin expectativa encima.

Esto último es lo que hace el plan barato: no hay que construir dos motores.

---

## FASE A — El motor (`plan-pagos.js`)

Archivo nuevo, un solo módulo, mismo patrón que `cartera.js`. Se despliega solo y no cambia nada de lo que ya funciona.

### A1 · El hecho nuevo · LÓGICA · ALTO

Tipo `plan_pago_creado`, con esta forma:

```
{
  clienteId, montoTotal, numCuotas, montoCuota,
  primerVencimiento,   // fecha ISO
  frecuencia,          // "mensual" | "quincenal" | "semanal"
  diaAncla,            // dia del mes acordado (solo mensual), con clamp de fin de mes
  avisarDesdeDias,     // 0 por defecto. Unico lugar donde vive la idea de gracia
  motivo, quien
}
```

Inmutable, como todo hecho. **No hay `plan_pago_modificado`.** Si el acuerdo cambia, se emite `plan_pago_anulado` y se crea uno nuevo. Así el historial muestra que hubo una renegociación, en vez de borrarla.

**Por qué:** un plan que se puede editar en silencio es un plan que no sirve para resolver una discusión con el cliente seis meses después.

### A2 · `planActivo(clienteId)` · LÓGICA · ALTO

Reproduce los hechos del cliente y devuelve el último `plan_pago_creado` que no tenga un `plan_pago_anulado` posterior. Devuelve `null` si no hay ninguno, que es el caso normal: **la mayoría de los fiados no tienen plan y así debe seguir siendo.**

### A3 · `estadoDelPlan(clienteId)` · LÓGICA · ALTO

El corazón. Devuelve, todo derivado, nada guardado:

```
{
  hayPlan, montoCuota, numCuotas,
  cuotasVencidas,        // cuántas debían haber llegado a hoy
  esperadoAHoy,          // cuotasVencidas * montoCuota
  abonadoDesdeElPlan,    // suma de cartera_abono con fecha >= plan
  diferencia,            // abonadoDesdeElPlan - esperadoAHoy
  estado,                // "al_dia" | "adelantado" | "atrasado"
  proximoVencimiento,    // fecha ISO
  saldoPendiente         // el de cartera.js, sin tocar
}
```

**`diferencia` es la cifra que importa** y es la que resuelve el caso de los abonos irregulares. Alguien que debía pagar $50 por mes y en tres meses puso $30, $80 y $45 sale adelantado por $5: puso $155 contra $150 esperados. Nadie tuvo que abonar el monto exacto de una cuota jamás.

### A4 · `anularPlan(clienteId, motivo)` · LÓGICA · MEDIO

Emite `plan_pago_anulado`. Deja el saldo intacto: anular un acuerdo no perdona una deuda. Son dos cosas distintas y confundirlas sería un bug de dinero.

### A5 · Sin penalidad, y que quede escrito · LÓGICA · ALTO

`plan-pagos.js` no tiene, y no debe tener nunca, ningún campo de interés, mora o recargo. Va un comentario en cabecera diciéndolo, igual que en `cartera.js`.

**Por qué:** la regla ya está tomada. Lo que hace falta es que sobreviva a la próxima persona que edite el archivo, incluido yo dentro de tres meses.

---

## FASE B — La interfaz

### B1 · El chip de cartera pasa a decir dos cosas · COPY + LÓGICA · ALTO

Hoy el chip dice `Debe $170.00`. Con plan activo pasa a decir el estado, que es lo accionable:

- Al día: `Debe $170.00 · al día`, en verde.
- Adelantado: `Debe $170.00 · adelantado $40`, en verde.
- Atrasado: `Debe $170.00 · atrasado $50`, en naranja.

**Naranja, no rojo.** El rojo tiene significado en el semáforo Simon: emergencia de stock. Un cliente atrasado es "urgente, pronto", que es exactamente naranja.

### B2 · Crear el plan desde donde ya se fía · COPY + LÓGICA · ALTO

En el modal de Fiar, una casilla: *"acordar un plan de pagos"*. Al marcarla aparecen tres campos: cuántas cuotas, cada cuánto, desde cuándo. El monto de la cuota se calcula solo y se muestra antes de confirmar.

**Por qué ahí:** el plan se acuerda en el mismo momento en que se fía, en la vida real. Ponerlo en otra pantalla garantiza que nadie lo use.

### B3 · La lista de atrasados · LÓGICA · ALTO

Una sección en Clientes con quienes tienen `estado === "atrasado"`, ordenados por cuánto llevan atrasados. Solo para el dueño: es exactamente el tipo de lista global que `vistaCarteraSegunRol()` le niega al empleado.

**Por qué:** es la única pantalla del sistema que le dice al dueño a quién llamar hoy. Sin esto, el plan de pagos es decoración.

### B4 · El próximo vencimiento, dicho en cristiano · SOLO COPY · MEDIO

En la ficha del cliente: `Próxima cuota: $50 el 15 de septiembre`. Fecha con mes en palabras, nunca `2026-09-15`.

### B5 · Respetar la casilla de avisarme · LÓGICA · MEDIO

`alertaActiva(clienteId)` ya existe y ya se puede apagar por cliente. Si está apagada, el cliente **no** aparece en la lista de atrasados ni muestra el chip naranja. El saldo se sigue viendo.

**Por qué:** hay clientes a los que uno le fía sin fecha y sin ganas de que la app le recuerde nada. Esa decisión ya se tomó y este módulo tiene que obedecerla, no sortearla.

---

## FASE C — Los tres repos

### C1 · amigable-123 primero
Es donde `cartera.js` acaba de llegar y donde está el uso real más cercano.

### C2 · friendly-123
Portar el módulo tal cual. Solo cambia el copy al inglés: `on track`, `ahead`, `behind`.

### C3 · consultorio-123
Aquí hay una diferencia de fondo, no de traducción. El módulo se apoya en `nucleo-cxc.js` (`cxc_cargo` / `cxc_abono`) en vez de `cartera.js`, y el vocabulario cambia: paciente, tratamiento, no cliente ni venta.

Un plan de pagos en un consultorio es un caso más común que en una tienda: un tratamiento de $600 en seis cuotas es la norma, no la excepción. Vale la pena que ahí el plan esté más a la vista que en las otras dos.

---

## Decisiones tomadas (JFC, 2026-08-13) y lo que salió del research

### 1. Pagar de más abona a favor

Si debía $50 este mes y pone $200, el calendario **no se toca**: quedan las mismas cuotas en las mismas fechas y el excedente queda como saldo a favor. Es lo que `cartera.js` ya sabe representar (saldo positivo = crédito) y no inventa una segunda forma de tener plata a favor.

Consecuencia en el motor: `proximoVencimiento` nunca depende de cuánto se abonó. Solo del calendario.

### 2. Sin días de gracia, pero todo editable

Un día de atraso es un día de atraso. Lo que sí se puede configurar, por cliente:

- **`avisarDesdeDias`**, por defecto `0`. Es el único lugar donde vive la idea de gracia, y se cambia sin tocar código.
- La casilla de avisarme que ya existe, que apaga el aviso entero para ese cliente.

Esto sigue la práctica que usa la industria de suscripciones, donde los ciclos de cobranza corren entre 7 y 30 días y el período de gracia se ajusta por segmento de cliente, no se fija para todos. La diferencia acá es que el default es cero y quien lo estira es el dueño, cliente por cliente.

Del mismo research, dos cosas que sí adopto en el copy: **encuadrar el aviso como un olvido, no como una falta** ("no ha llegado la cuota de septiembre", nunca "usted no pagó"), y **espaciar los recordatorios** en vez de repetirlos a diario.

### 3. Nada de "cada 30 días": fechas de calendario reales

Esto salió del research y **corrige el diseño original de este plan**. `cadaDias: 30` produce deriva: 5 de enero, 4 de febrero, 6 de marzo. La gente no acuerda "cada 30 días", acuerda "el 5 de cada mes", y ve la deriva como un error.

Los sistemas de facturación resuelven esto con fecha de aniversario más *clamp* de fin de mes: si el acuerdo cae el 31 y el mes tiene 30, la cuota vence el último día de ese mes, y al mes siguiente **vuelve al 31**. El clamp no es permanente.

El motor guarda entonces:

```
frecuencia: "mensual" | "quincenal" | "semanal"
diaAncla: 5        // solo para mensual
```

y calcula las fechas con aritmética de calendario, no sumando días.

### 4. Librerías: busqué y la respuesta es no

- **rrule.js** (RFC 5545) es la librería correcta para reglas de recurrencia y la usaría sin dudar si necesitáramos "el tercer martes de cada mes". Para mensual con ancla y clamp de fin de mes son cinco líneas, y rrule pesa más que todo `cartera.js` junto. Estas apps corren sin conexión, sin build, y con todo embebido: no hay CDN permitido y el piso de hardware es un teléfono de 2016.
- **dinero.js** para el dinero: el código ya usa `+n.toFixed(2)` de forma consistente en `cartera.js`, `caja-chica.js` y `nucleo-ingresos.js`. Meter una librería de dinero ahora dejaría dos convenciones conviviendo, que es peor que la que hay.

La regla que aplico: una librería entra cuando resuelve un problema que no sabemos resolver bien, no cuando reemplaza cinco líneas que ya entendemos.

### 5. Dónde va el botón

Esta la pensé contra el principio y no contra el gusto.

La regla de NN/g sobre progressive disclosure es que se difieren las funciones **avanzadas o poco usadas**, y que el modo de fallar más común es "el split equivocado": esconder algo que la gente necesita seguido. La otra regla, del mismo cuerpo de trabajo, es limitar los enlaces de navegación en cada punto a los que de verdad hacen falta ahí.

Las dos apuntan en direcciones opuestas acá:

- Un tratamiento de $600 en seis cuotas es la norma en un consultorio, no la excepción. Frecuente ⇒ **no se esconde**.
- El menú de consultorio-123 ya tiene 11 botones. Un botón 12 empeora cada decisión de navegación, incluidas las de los otros 11.

La salida no es elegir uno de los dos. Es separar **la alerta** de **la gestión**, que son dos trabajos distintos con dos frecuencias distintas:

**La alerta va en Hoy.** Un contador de `Cuotas atrasadas (3)` en el tablero que el médico abre cada mañana. Responde el trabajo diario, que es "¿tengo que llamar a alguien hoy?", sin costar un botón de menú. Esto es lo que el research de cobranza llama recordatorio dentro de la app, que es el que más recupera.

**La gestión va dentro de Cuentas por Cobrar**, la pestaña que ya existe en Contabilidad. Un plan de pagos **es** una cuenta por cobrar con calendario. Darle pestaña propia parte un concepto en dos y obliga al médico a saber en cuál de las dos buscar.

Dentro de esa pestaña, un filtro de tres estados: `Todos · Con plan · Atrasados`.

**Cero botones nuevos en el menú, y la información aparece antes que hoy**, porque salta sola en Hoy en vez de esperar ocho clics. En amigable-123 y friendly-123 el mismo criterio: alerta en Hoy, gestión dentro de Clientes.

---

## Verificación por fase

**Fase A** (sin UI, todo desde consola):
1. Crear un cargo de $300 y un plan de 6 cuotas de $50 cada 30 días.
2. Sin abonos: `estadoDelPlan` debe dar `atrasado` en cuanto pase el primer vencimiento, y `al_dia` antes.
3. Abonar $30, $80 y $45 en tres meses: contra $150 esperados debe dar `adelantado` con `diferencia: 5`.
4. Anular el plan: el saldo debe seguir en $155 pendientes, sin moverse ni un centavo.
5. Confirmar por grep que no existe ninguna palabra tipo `interes`, `mora` o `recargo` en el módulo.
6. Plan mensual anclado al 31 arrancando en enero: las cuotas deben caer 31 ene, 28 feb, 31 mar. Si marzo cae 28, el clamp quedó pegado y es un bug.
7. Pagar de más no debe mover `proximoVencimiento` ni un día.

**Fase B:**
1. El chip naranja aparece solo con plan activo y estado atrasado.
2. Con la casilla de avisarme apagada, el cliente desaparece de la lista de atrasados pero conserva su saldo visible.
3. Un empleado no ve la lista de atrasados por ninguna ruta.
4. Nada de texto bajo 13px, cero opacidad en texto, cero rgba como color.
5. En 375px el modal de fiar con los tres campos del plan no se corta y los toques mantienen 44px.

**Antes de dar por terminado, en las tres:**
- El saldo derivado antes y después de crear un plan tiene que ser idéntico. Si cambia, el plan está tocando dinero y eso es un bug de los graves.
