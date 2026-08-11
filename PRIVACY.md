# Datos y privacidad

**Versión corta: los datos de tu negocio nunca salen de tu dispositivo. Lo único que rastreamos es tu licencia.**

amigable-123 es local-first por diseño. Productos, ventas, clientes, inventario, fotos de perchas, comisiones — todo lo relacionado con tu negocio vive en el almacenamiento local de tu navegador, en tu dispositivo, y en ningún otro lugar. No hay un servidor que lo guarde, no hay sincronización en la nube, no hay analítica, no hay telemetría.

## La única excepción: la activación de la licencia

Para vender licencias y desbloquear la app completa a quienes ya pagaron, operamos un pequeño Worker de Cloudflare que rastrea *instancias*, no *negocios*. La licencia comercial es válida por **5 años** desde la activación. Cuando activas (PIN 789) o entras, tu dispositivo envía:

- `instanceId` — un ID aleatorio generado en tu dispositivo, no ligado a nada más
- Tu nombre, correo y código de licencia — solo si decidiste ingresarlos durante la activación, para recuperar tu acceso
- Tu número de WhatsApp — solo si decidiste agregarlo, para que podamos contactarte directamente además de por correo
- Estado de activación (full / mínima / bloqueada)

Esa es la lista completa. Nada sobre tus productos, ventas, clientes o inventario va incluido en este registro, en ningún momento, bajo ninguna funcionalidad.

## Verifícalo tú mismo/a

Esto no es algo que tengas que creernos — puedes comprobarlo:

- **Abre DevTools → pestaña Network** mientras usas la app. Cada solicitud que hace la app es visible. Verás llamadas a `/api/*` (tu propio navegador, interceptadas localmente por `mock-backend.js` — nada sale de tu dispositivo) y llamadas ocasionales al endpoint `/checkin` del Worker de Cloudflare al activar o entrar. Nada más.
- **Lee el código del worker directamente**: [`cloudflare-worker/worker.js`](./cloudflare-worker/worker.js) en este repositorio es exactamente el código desplegado — sin paso de build, sin minificación que oculte nada.
- **Lee el código del cliente**: `docs/*.js` es JavaScript plano. No hay un bundler entre lo que está en este repositorio y lo que corre en tu navegador.

## Por qué esto nos importa

Esto no es un descargo de responsabilidad legal — es el diseño real del producto. Si estás evaluando amigable-123 para un negocio donde "a dónde van mis datos" es una pregunta real (y debería serlo), la respuesta es: a ningún lado, por construcción, y no tienes que creernos bajo palabra.
