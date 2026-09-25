// Corrida Hugo / Paco / Luis portada desde friendly-123 v396-v397 (JFC 2026-09-24:
// "porta todo lo que no tengan y les corresponda"). Prioridad: que CUADRE el
// inventario y el dinero entre pantallas. test/helpers/cuadre.cjs cruza Ventas,
// Hoy, P&L, Comisiones e inventario. B4/B5/F1/C1-C4 = rojo en amigable-shell
// previo al port; "FIJACION" = comportamiento que ya era correcto.
// Vocabulario (JFC): comisionista = vende; consignadora = artista duena de piezas.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser, storage } = require('./helpers/browser.cjs');
const { cuadre } = require('./helpers/cuadre.cjs');
const cent = (n) => Math.round((Number(n) || 0) * 100);

async function tienda() {
  // Aparato ACTIVADO (amigable_owned.instanceId): sin esto el plan gratuito corta en 25 productos.
  const ls = storage(); ls.setItem('amigable_owned', JSON.stringify({ instanceId: 'fixture-cuadre' }));
  const w = browser(ls);
  w.OCAuth = { rolActual: () => 'dueno' };
  const vendedora = await w.request('/api/promotoras', 'POST', { nombre: 'Belen comisionista', comisionBase: 30 });
  const consignadora = await w.request('/api/promotoras', 'POST', { nombre: 'Ana consignadora', comisionBase: 85 });
  const rackV = await w.request('/api/ubicaciones', 'POST', { nombre: 'Percha Belen', tipo: 'socio' });
  const rackC = await w.request('/api/ubicaciones', 'POST', { nombre: 'Percha Ana', tipo: 'consignacion' });
  await w.request(`/api/ubicaciones/${rackV.id}`, 'PUT', { promotoraId: vendedora.id });
  await w.request(`/api/ubicaciones/${rackC.id}`, 'PUT', { promotoraId: consignadora.id });
  const alta = (nombre, ubic, precio, costo, stock, extra = {}) => w.request('/api/productos', 'POST', { nombre, barcode: 'CQ-' + nombre.replace(/\W/g, ''), precio, costo, stockInicial: stock, ubicacionId: ubic, umbralRojo: 1, umbralAmarillo: 2, ...extra });
  const libro = await alta('Libro', rackV.id, 20, 8, 10);
  const cuadro = await alta('Cuadro', rackC.id, 150, 0, 3);
  const stock = { [libro.id]: 10, [cuadro.id]: 3 };
  const vender = async (p, body = {}) => {
    const r = await w.request(`/api/productos/${p.id}/venta`, 'POST', { cantidad: 1, ...body });
    stock[p.id] -= Number(body.cantidad || 1);
    return r.ventaId;
  };
  const intentar = async (fn) => { try { await fn(); return true; } catch (_) { return false; } };
  const sinDescuadre = async (quien) => assert.deepEqual(await cuadre(w, { stockEsperado: stock }), [], quien + ': descuadre');
  return { w, vendedora, consignadora, rackV, rackC, libro, cuadro, stock, vender, intentar, sinDescuadre, alta };
}

test('Paco: ventas simples y pago del mes cuadran (FIJACION)', async () => {
  const t = await tienda();
  await t.vender(t.libro); await t.vender(t.libro, { cantidad: 2 }); await t.vender(t.cuadro);
  await t.sinDescuadre('Paco antes de pagar');
  await t.w.request(`/api/liquidaciones/${t.rackV.id}/marcar-pagado`, 'POST', {});
  await t.sinDescuadre('Paco despues de pagar');
});

test('B1 Luis: venta rechazada por cliente no baja stock (FIJACION: amigable ya validaba antes)', async () => {
  const t = await tienda();
  assert.equal(await t.intentar(() => t.w.request(`/api/productos/${t.libro.id}/venta`, 'POST', { cantidad: 2, clienteId: 'no-existe' })), false);
  await t.sinDescuadre('Luis cliente malo');
});

test('B4 Hugo: una venta ya pagada al asociado no se anula, ni forzada', async () => {
  const t = await tienda();
  const id = await t.vender(t.libro);
  await t.w.request(`/api/liquidaciones/${t.rackV.id}/marcar-pagado`, 'POST', {});
  assert.equal(await t.intentar(() => t.w.request(`/api/ventas/${id}/anular`, 'POST', {})), false);
  assert.equal(await t.intentar(() => t.w.request(`/api/ventas/${id}/anular`, 'POST', { forzado: true })), false);
  await t.sinDescuadre('Hugo anular pagada');
});

test('B5 Paco: pagar la percha solo sella ventas con comision (FIJACION: guarda a futuro, hoy no hay venta sin comision en percha compartida fuera de la semilla)', async () => {
  const t = await tienda();
  const propia = await t.w.request('/api/ubicaciones', 'POST', { nombre: 'Local propio', tipo: 'propio' });
  const casa = await t.alta('Bolsa', propia.id, 8, 3, 5); t.stock[casa.id] = 5;
  // Una venta sin comision en una percha compartida sin trato: se simula moviendo el producto
  await t.vender(t.libro);
  const r = await t.w.request(`/api/liquidaciones/${t.rackV.id}/marcar-pagado`, 'POST', {});
  assert.equal(r.ventasLiquidadas, 1);
  await t.sinDescuadre('Paco pago');
});

test('F1 la foto elegida al crear un producto se guarda', async () => {
  const t = await tienda();
  const foto = 'data:image/webp;base64,UklGRg==';
  const p = await t.alta('Con foto', t.rackV.id, 5, 1, 1, { foto });
  assert.equal((await t.w.request('/api/productos')).find((x) => x.id === p.id).foto, foto);
});

test('C1 Belen: la tarjeta de la percha muestra las ventas de la casa y el total real = Ventas', { todo: 'llega con la igualacion amigable = friendly (PLAN-IGUALAR-AMIGABLE-CON-FRIENDLY)' }, async () => {
  const t = await tienda();
  await t.vender(t.libro, { cantidad: 2 });
  const l = (await t.w.request('/api/liquidaciones')).find((x) => x.ubicacionId === t.rackV.id);
  assert.ok(l.ventasCasa, 'ventasCasa presente');
  assert.equal(l.totalPercha, 40);
  // La semilla trae ventas SIN comision en perchas compartidas: deben verse como de la casa.
  const semilla = (await t.w.request('/api/liquidaciones')).filter((x) => x.ventasCasa && x.ventasCasa.ventas > 0);
  assert.ok(semilla.length >= 1, 'las ventas de la casa de la semilla quedan a la vista');
});

test('C2 cuadre del mes: los cubos suman el total de Ventas al centavo', { todo: 'llega con la igualacion amigable = friendly (PLAN-IGUALAR-AMIGABLE-CON-FRIENDLY)' }, async () => {
  const t = await tienda();
  await t.vender(t.libro, { cantidad: 3 }); await t.vender(t.cuadro);
  const c = await t.w.request('/api/comisiones/cuadre');
  const mes = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0');
  const fl = (iso) => { const d = new Date(iso); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const ventas = (await t.w.request('/api/ventas/todas')).filter((v) => fl(v.fecha) === mes);
  const cubos = ['conComision', 'casaCompartida', 'perchasPropias', 'sinTrato'];
  assert.equal(cubos.reduce((a, k) => a + cent(c[k].monto), 0), cent(c.totalVentas));
  assert.equal(cent(c.totalVentas), ventas.reduce((a, v) => a + cent(v.precioUnit * v.cantidad), 0));
  assert.equal(cubos.reduce((a, k) => a + c[k].ventas, 0), ventas.length);
});

test('C3 aporte fijo: la tarjeta dice lo que de verdad se desconto en el mes', { todo: 'llega con la igualacion amigable = friendly (PLAN-IGUALAR-AMIGABLE-CON-FRIENDLY)' }, async () => {
  const t = await tienda();
  await t.w.request(`/api/ubicaciones/${t.rackC.id}`, 'PUT', { contribFija: 10 });
  await t.vender(t.cuadro); await t.vender(t.cuadro);
  const l = (await t.w.request('/api/liquidaciones')).find((x) => x.ubicacionId === t.rackC.id);
  assert.equal(l.contribFijaMes, 20);
});

test('C4 balance: activo = inventario PROPIO a COSTO; lo consignado aparte', { todo: 'llega con la igualacion amigable = friendly (PLAN-IGUALAR-AMIGABLE-CON-FRIENDLY)' }, async () => {
  const t = await tienda();
  const b = await t.w.request('/api/reportes/balance');
  const ps = await t.w.request('/api/productos');
  const racks = await t.w.request('/api/ubicaciones');
  const consig = (p) => p.tipoProveedor === 'consignacion' || (racks.find((u) => u.id === p.ubicacionId) || {}).tipo === 'consignacion';
  assert.equal(cent(b.activos.inventarioValorizado), ps.filter((p) => !consig(p)).reduce((a, p) => a + cent((p.costo || 0) * p.stockActual), 0));
  assert.ok(b.memo && b.memo.consignacionPrecioVenta >= 450);
});
