# AMIGABLE

Capa visual y contable sobre Loyverse, pensada para vender a negocios de
retail en Cuenca, Ecuador. Producto propio multi-cliente, sin marca de
ningún negocio individual.

## Estado actual

- Backend Express, capa única de datos en `data.js` que usa Loyverse real
  (`LOYVERSE_TOKEN` configurado) o datos de demo locales si no hay token.
- Dashboard semáforo, inventario, escaneo, ajustes de stock, etiquetas con
  QR, P&L y balance simplificado leyendo recibos reales de Loyverse.
- Ver `.env.example` para conectar una cuenta de Loyverse.

## Correr local

```bash
npm install
cp .env.example .env
npm start
```

## Roadmap — lo que diferencia a AMIGABLE de Olimpo Control

Esto es lo que se construye después, específicamente para venderlo a
múltiples negocios en Cuenca (no para un solo cliente):

1. **Multi-tenant real** — hoy el sistema asume un solo negocio/token. Para
   vender a N negocios se necesita: una cuenta AMIGABLE por cliente, su
   propio `LOYVERSE_TOKEN`, y aislamiento de datos entre clientes.
2. **Contabilidad por partida doble** — un libro diario (`journal entries`)
   con cuentas (`chart of accounts`) donde cada venta/ajuste/gasto genera un
   asiento balanceado (debe = haber), en vez de los cálculos directos de
   P&L/balance que hay ahora. Esto es lo que permite generar estados
   financieros que un contador pueda auditar.
3. **Cumplimiento tributario SRI Ecuador** — IVA, retenciones en la fuente,
   comprobantes electrónicos, RUC/RISE/RIMPE según el régimen del negocio.
   **Esto requiere verificación contra la normativa vigente del SRI antes de
   implementarse** — las tasas y reglas cambian, y un error aquí tiene
   consecuencias legales/fiscales reales para el negocio que lo use. No se
   construye a ciegas con conocimiento general; se verifica cada regla contra
   la fuente oficial (sri.gob.ec) antes de codificarla, y se recomienda
   revisión de un contador ecuatoriano antes de usarlo para declaraciones
   reales.
4. **Reportes más fuertes** — flujo de caja, comparativos por período,
   exportación a Excel/PDF para el contador, reportes por empleado/turno.
5. **Onboarding self-service** — hoy alguien (JFC) configura el token a
   mano por cliente; para vender en serio hace falta un flujo donde el
   dueño del negocio se registra, conecta su Loyverse y empieza a usar el
   sistema sin intervención manual.

Cada uno de estos puntos se construye y se prueba por separado — no se
declaran "hechos" hasta tener algo verificado, especialmente el punto 3.
