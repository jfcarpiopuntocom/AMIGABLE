# AMIGABLE

**Tu negocio, a color.**

La mayoría del software para pequeños negocios trata al dueño como si fuera contador. Planillas, dashboards grises, tablas con decenas de columnas — el tipo de herramienta que te hace sentir que estás haciendo tarea en lugar de administrando tu tienda.

AMIGABLE es lo contrario. Cada producto en tu estante tiene un color. Verde: todo bien. Dorado: oportunidad. Naranja: actúa pronto. Rojo: actúa ya. Negro: stock muerto — hora de moverlo. Sin manual. Sin capacitación. Ves los colores y sabes qué hacer.

Eso es el sistema Simon. Es la idea central sobre la que está construido todo esto.

---

## Qué es

Una PWA sin servidor — progressive web app — que corre completamente en el navegador. Sin servidor que pagar. Sin suscripción mensual. Sin cuenta que crear. Comparte un enlace, ábrelo en cualquier teléfono, y tienes un panel de administración funcionando.

Reemplaza el cuaderno. La pizarra. El ritual de "déjame revisar en la bodega". El WhatsApp al dueño preguntando si algo está por agotarse.

---

## Qué hace

**Inventario con pulso.** Cada producto lleva un estado en vivo — calculado automáticamente desde umbrales que el dueño configura una sola vez. Los colores cambian a medida que se mueve el stock.

**Vender con un toque.** Una grilla de productos hecha para el mostrador, no para un flujo de pago. Toca el producto, confirma, listo.

**Perchas y comisiones.** Lleva el control de múltiples ubicaciones con socios, sus metas de venta y escalas de comisión. Liquida con un recibo detallado por WhatsApp que el socio puede conciliar de su lado.

**P&L del dueño.** Margen bruto, costos operativos prorrateados por los días reales del mes, valuación de inventario. Matemática honesta, no del tipo que te hace sentir mejor de lo que estás.

**Códigos de barras y etiquetas QR.** Imprime una etiqueta para cualquier producto. Escanea en el mostrador. El código QR lleva directo a la ficha completa del producto.

**Historial a prueba de manipulación.** Cada movimiento de stock está encadenado con hash. Si alguien intenta editar el log, se nota.

**Funciona sin internet.** Service worker + almacenamiento local. La app funciona sin conexión y sincroniza al reconectarse.

**Bilingüe (ES/EN).** Cambia entre español e inglés. Cada texto, cada etiqueta, cada alerta.

---

## Para quién es

Cualquier dueño que opera un negocio de retail pequeño — una tienda de souvenirs, una librería, una boutique, un puesto en una feria — que quiere ver qué pasa en su negocio sin abrir una planilla.

El punto dulce: negocios con 1-5 empleados, 50-500 SKUs, y al menos un socio con percha o arreglo de consignación.

---

## La misión

El cuaderno no es pintoresco. Es un riesgo. Se pierde, se moja, no te dice tu margen, y definitivamente no puede mandarle un WhatsApp a tu proveedor cuando te quedas bajo en stock.

Lo estamos reemplazando — no con software empresarial que requiere un consultor, sino con algo que cabe en una pestaña del navegador y se siente como si lo hubiera hecho alguien que en verdad trabajó detrás de un mostrador.

Si eres desarrollador y alguna vez viste a un dueño de negocio pequeño luchando con una herramienta que no fue hecha para él, este es el proyecto que estabas buscando.

---

## Precio

**$399 USD — pago único, precio global.** Sin suscripción. Sin cobro por usuario. Pagas una vez, usas para siempre.

**Precio regional Latinoamérica: $199 USD**, verificado por identificación (cédula o documento nacional equivalente) de un país latinoamericano. Mismo producto, mismas actualizaciones, mismo soporte — el ajuste refleja el poder adquisitivo de la región, no una versión reducida.

---

## Corre local

```bash
npm install
cp .env.example .env   # opcional: conectar cuenta de Loyverse real
npm start
```

O sirve el demo estático directamente (sin Node):

```bash
python -m http.server 8736 --directory docs
```

Luego abre `http://localhost:8736`.

---

## Arquitectura

La app es un solo archivo HTML con JS vanilla — sin frameworks, sin paso de build necesario para leerla o modificarla. El código fuente completo vive en `docs/`. El backend es un service worker + localStorage, con una capa Node/PocketBase opcional para sincronización multi-dispositivo.

El demo corre completamente offline usando `docs/mock-backend.js` como API en el navegador. La versión de producción apunta a un backend real (`server.js` / PocketBase).

```
docs/
├── index.html          — la app completa
├── i18n.js             — todos los textos, ES + EN
├── mock-backend.js     — API de demo en el navegador
├── sw.js               — service worker (soporte offline)
├── auth-ui.js          — control de acceso por PIN y roles
├── help-ui.js          — ayuda contextual
└── vista-perchas.js    — vista de perchas de socios
```

---

## Contribuir

El código es intencionalmente simple — sin framework, sin bundler requerido. Si quieres contribuir, lee `docs/index.html` desde el principio. La arquitectura es lineal y está comentada en todo su recorrido.

Abre un issue antes de abrir un PR. El roadmap es opinado.

---

## Roadmap

1. **Multi-tenant real** — hoy el sistema asume un solo negocio. Para vender a N negocios se necesita aislamiento de datos y onboarding self-service.
2. **Conteo de caja al cierre de turno** — conciliación de efectivo físico vs. sistema con historial por empleado.
3. **Lista de reposición por proveedor** — un toque genera el WhatsApp listo para enviar a cada proveedor.
4. **Reportes exportables** — flujo de caja, comparativos por período, Excel/PDF para el contador.

---

## Datos y privacidad

Ver [PRIVACY.md](./PRIVACY.md) — versión corta: tus datos de negocio nunca salen de tu dispositivo, lo único que rastreamos es tu licencia, y puedes verificarlo tú mismo/a leyendo el código.

---

## Licencia

Propietaria. Ver `LICENSE`.

**Licencia comercial de uso:** 5 años desde la activación, con soporte y actualizaciones incluidos durante todo ese período. Sin suscripción.
