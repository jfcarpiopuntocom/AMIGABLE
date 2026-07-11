// mock-backend.js — Backend simulado dentro del navegador, para la demo
// pública en GitHub Pages (que no puede correr Node). Intercepta fetch a
// /api/* y responde con la misma lógica que server.js, usando datos de
// ejemplo en memoria. En el servidor real este archivo NO se carga.
(function () {
  // Local-first: si pocketbase-client.js ya activó una conexión remota
  // (OC_PB_URL guardado en Avanzado), el mock NO debe pisar ese fetch.
  // Por defecto (sin URL guardada) todo corre local con este mock/servidor.
  if (window.OC_PB_CONNECTED) return;
  // Marca global para que index.html sepa que corre sin backend real y NUNCA
  // muestre un mensaje de "el servidor no responde" en la demo pública.
  window.OC_DEMO = true;
  const ZONA = "America/Guayaquil";
  function hoyISO() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }
  // Días reales del mes actual (28/29/30/31) — espejo de diasEnMesActual() en server.js.
  function diasEnMesActual() {
    const [anio, mes] = hoyISO().split("-").map(Number);
    return new Date(anio, mes, 0).getDate();
  }

  // Perchas (unidades operativas). sucursalId -> agrupador backend.
  const ubicaciones = [
      {
          "id": "centro",
          "nombre": "Local Centro Histórico",
          "activa": true,
          "tipo": "propio",
          "sucursalId": "suc01"
      },
      {
          "id": "mercado",
          "nombre": "Stand Mercado 10 de Agosto",
          "activa": true,
          "tipo": "socio",
          "sucursalId": "suc02",
          "promotoraId": "pr01",
          "comisionSocio": 25,
          "metaMensual": 300,
          "escalasComision": [
              {
                  "hasta": 80,
                  "comision": 25
              },
              {
                  "hasta": 100,
                  "comision": 30
              },
              {
                  "hasta": 120,
                  "comision": 35
              },
              {
                  "hasta": 999,
                  "comision": 40
              }
          ]
      },
      {
          "id": "feria",
          "nombre": "Feria Artesanal El Otorongo",
          "activa": true,
          "tipo": "consignacion",
          "sucursalId": "suc03",
          "promotoraId": "pr02",
          "comisionSocio": 30,
          "metaMensual": 200,
          "escalasComision": []
      }
  ];
  // Sucursales: agrupadores backend de perchas. En la UI el usuario ve PERCHAS;
  // la sucursal es el encabezado de sección en el gestor de perchas (Inventario).
  // Promotores/as: personas que traen gente (turistas, recomendados,
  // familiares) y llevan comision. Se asignan por percha (promotoraId).
  const promotoras = [
    { id: "pr01", nombre: "Maria Auquilla", comision: 10 },
    { id: "pr02", nombre: "Carlos Once", comision: 8 },
  ];
  const sucursales = [
    { id: "suc01", nombre: "Centro Histórico",          activa: true },
    { id: "suc02", nombre: "Mercado 10 de Agosto",      activa: true },
    { id: "suc03", nombre: "El Otorongo",               activa: true },
  ];

  const productos = [
    {"id":"p01","nombre":"Camiseta Pink Floyd - The Dark Side","categoria":"Camisetas","sku":"CAM-PF-DSM","barcode":"7861000030019","ubicacionId":"centro","precio":22,"costo":9,"stockActual":30,"umbralRojo":8,"umbralAmarillo":16,"proveedor":"Rock Import EC"},
    {"id":"p02","nombre":"Camiseta Metallica - Master of Puppets","categoria":"Camisetas","sku":"CAM-MET-MOP","estrella":true,"barcode":"7861000030026","ubicacionId":"centro","precio":22,"costo":9,"stockActual":8,"umbralRojo":10,"umbralAmarillo":18,"proveedor":"Rock Import EC"},
    {"id":"p03","nombre":"Camiseta AC/DC - Back in Black","categoria":"Camisetas","sku":"CAM-ACDC-BIB","estrella":true,"barcode":"7861000030033","ubicacionId":"mercado","precio":20,"costo":8.5,"stockActual":25,"umbralRojo":8,"umbralAmarillo":16,"proveedor":"Rock Import EC"},
    {"id":"p04","nombre":"Camiseta Nirvana - Nevermind","categoria":"Camisetas","sku":"CAM-NIR-NVM","barcode":"7861000030040","ubicacionId":"centro","precio":21,"costo":9,"stockActual":15,"umbralRojo":6,"umbralAmarillo":12,"proveedor":"Rock Import EC"},
    {"id":"p05","nombre":"Camiseta Iron Maiden - The Trooper","categoria":"Camisetas","sku":"CAM-IM-TRP","barcode":"7861000030057","ubicacionId":"feria","precio":23,"costo":10,"stockActual":4,"umbralRojo":6,"umbralAmarillo":12,"proveedor":"Rock Import EC"},
    {"id":"p06","nombre":"Camiseta The Rolling Stones - Lengua","categoria":"Camisetas","sku":"CAM-RS-TON","barcode":"7861000030064","ubicacionId":"mercado","precio":20,"costo":8.5,"stockActual":18,"umbralRojo":6,"umbralAmarillo":12,"proveedor":"Rock Import EC"},
    {"id":"p07","nombre":"Camiseta Led Zeppelin - Icarus","categoria":"Camisetas","sku":"CAM-LZ-ICA","barcode":"7861000030071","ubicacionId":"centro","precio":22,"costo":9,"stockActual":12,"umbralRojo":5,"umbralAmarillo":13,"proveedor":"Rock Import EC"},
    {"id":"p08","nombre":"Camiseta Ramones - Presidential Seal","categoria":"Camisetas","sku":"CAM-RAM-PRS","barcode":"7861000030088","ubicacionId":"feria","precio":19,"costo":8,"stockActual":9,"umbralRojo":5,"umbralAmarillo":11,"proveedor":"Rock Import EC"},
    {"id":"p09","nombre":"Camiseta Guns N' Roses - Appetite","categoria":"Camisetas","sku":"CAM-GNR-APP","barcode":"7861000030095","ubicacionId":"centro","precio":22,"costo":9,"stockActual":20,"umbralRojo":6,"umbralAmarillo":12,"proveedor":"Rock Import EC"},
    {"id":"p10","nombre":"Camiseta Queen - Crest","categoria":"Camisetas","sku":"CAM-QUE-CRS","barcode":"7861000030101","ubicacionId":"mercado","precio":21,"costo":9,"stockActual":3,"umbralRojo":6,"umbralAmarillo":12,"proveedor":"Rock Import EC"},
    {"id":"p11","nombre":"Taza Ceramica Rock Cuenca","categoria":"Souvenirs","sku":"SOU-TAZ-001","estrella":true,"barcode":"7861000030118","ubicacionId":"feria","precio":8,"costo":3,"stockActual":40,"umbralRojo":10,"umbralAmarillo":20,"proveedor":"Souvenirs del Tomebamba"},
    {"id":"p12","nombre":"Llavero Guitarra Metalico","categoria":"Souvenirs","sku":"SOU-LLA-001","barcode":"7861000030125","ubicacionId":"mercado","precio":3.5,"costo":1.2,"stockActual":60,"umbralRojo":15,"umbralAmarillo":30,"proveedor":"Souvenirs del Tomebamba"},
    {"id":"p13","nombre":"Pin Esmaltado de Banda","categoria":"Accesorios","sku":"ACC-PIN-001","barcode":"7861000030132","ubicacionId":"centro","precio":4,"costo":1.5,"stockActual":50,"umbralRojo":12,"umbralAmarillo":25,"proveedor":"Rock Import EC"},
    {"id":"p14","nombre":"Parche Bordado Rock","categoria":"Accesorios","sku":"ACC-PAR-001","barcode":"7861000030149","ubicacionId":"feria","precio":5,"costo":2,"stockActual":35,"umbralRojo":10,"umbralAmarillo":20,"proveedor":"Rock Import EC"},
    {"id":"p15","nombre":"Gorra Snapback Rock","categoria":"Souvenirs","sku":"SOU-GOR-001","barcode":"7861000030156","ubicacionId":"centro","precio":15,"costo":6.5,"stockActual":6,"umbralRojo":5,"umbralAmarillo":9,"proveedor":"Rock Import EC"},
    {"id":"p16","nombre":"Puas de Guitarra Pack x6","categoria":"Accesorios","sku":"ACC-PUA-006","barcode":"7861000030163","ubicacionId":"mercado","precio":6,"costo":2.2,"stockActual":22,"umbralRojo":8,"umbralAmarillo":16,"proveedor":"Rock Import EC"},
    /* Novela latinoamericana contemporánea — 8 títulos cultos, selección JFC 2026-07-03 */
    {"id":"p17","nombre":"Nuestra parte de noche — Mariana Enriquez","categoria":"Libros","sku":"LIB-ENR-NPN","barcode":"9789584293152","ubicacionId":"centro","precio":22,"costo":9.5,"stockActual":3,"umbralRojo":4,"umbralAmarillo":8,"proveedor":"Planeta Ecuador"},
    {"id":"p18","nombre":"Temporada de huracanes — Fernanda Melchor","categoria":"Libros","sku":"LIB-MEL-TDH","barcode":"9786071653697","ubicacionId":"mercado","precio":20,"costo":8.5,"stockActual":6,"umbralRojo":3,"umbralAmarillo":7,"proveedor":"Literatura Random House"},
    {"id":"p19","nombre":"Kentukis — Samanta Schweblin","categoria":"Libros","sku":"LIB-SCH-KEN","barcode":"9788439735564","ubicacionId":"centro","precio":19,"costo":7.5,"stockActual":11,"umbralRojo":3,"umbralAmarillo":6,"proveedor":"Literatura Random House"},
    {"id":"p20","nombre":"Cometierra — Dolores Reyes","categoria":"Libros","sku":"LIB-REY-COM","barcode":"9789878358154","ubicacionId":"feria","precio":21,"costo":6,"stockActual":14,"umbralRojo":3,"umbralAmarillo":6,"proveedor":"Sigilo"},
    {"id":"p21","nombre":"Mugre rosa — Fernanda Trías","categoria":"Libros","sku":"LIB-TRI-MGR","barcode":"9789974723146","ubicacionId":"feria","precio":18,"costo":8,"stockActual":2,"umbralRojo":3,"umbralAmarillo":6,"proveedor":"Literatura Random House"},
    {"id":"p22","nombre":"Pelea de gallos — María Fernanda Ampuero","categoria":"Libros","sku":"LIB-AMP-PDG","estrella":true,"barcode":"9788417125400","ubicacionId":"centro","precio":18,"costo":7.5,"stockActual":9,"umbralRojo":3,"umbralAmarillo":6,"proveedor":"Páginas de Espuma"},
    {"id":"p23","nombre":"Paradais — Fernanda Melchor","categoria":"Libros","sku":"LIB-MEL-PAR","barcode":"9786071677129","ubicacionId":"mercado","precio":17,"costo":7,"stockActual":5,"umbralRojo":3,"umbralAmarillo":6,"proveedor":"Literatura Random House"},
    {"id":"p24","nombre":"Las aventuras de la China Iron — Cabezón Cámara","categoria":"Libros","sku":"LIB-CAB-CIA","estrella":true,"barcode":"9789877383652","ubicacionId":"centro","precio":20,"costo":7.5,"stockActual":8,"umbralRojo":3,"umbralAmarillo":6,"proveedor":"Literatura Random House"},
    /* ---- VITRINAS SIMON: productos diseñados para exhibir los 6 estados del semáforo ---- */
    /* ROJO intensidad 1 — sin stock (inventario muerto, cero unidades) */
    {"id":"p25","nombre":"Vinilo Led Zeppelin - Physical Graffiti","categoria":"Vinilos","sku":"VIN-LZ-PGR","barcode":"7861000030170","ubicacionId":"centro","precio":45,"costo":28,"stockActual":0,"umbralRojo":3,"umbralAmarillo":6,"proveedor":"Rock Import EC"},
    /* ROJO intensidad 2 — quedan 1 (critico, reponer urgente) */
    {"id":"p26","nombre":"Vinilo Pink Floyd - Animals","categoria":"Vinilos","sku":"VIN-PF-ANM","barcode":"7861000030187","ubicacionId":"mercado","precio":42,"costo":25,"stockActual":1,"umbralRojo":3,"umbralAmarillo":6,"proveedor":"Rock Import EC"},
    /* ROJO intensidad 3 — exactamente en el umbral rojo (limite de emergencia) */
    {"id":"p27","nombre":"Camiseta David Bowie - Ziggy Stardust","categoria":"Camisetas","sku":"CAM-BOW-ZIG","barcode":"7861000030194","ubicacionId":"feria","precio":24,"costo":10,"stockActual":5,"umbralRojo":5,"umbralAmarillo":10,"proveedor":"Rock Import EC"},
    /* AMARILLO intensidad 1 — justo arriba del rojo (revisar hoy) */
    {"id":"p28","nombre":"Poster Metalico AC/DC High Voltage","categoria":"Accesorios","sku":"ACC-POS-001","barcode":"7861000030200","ubicacionId":"centro","precio":12,"costo":7,"stockActual":6,"umbralRojo":5,"umbralAmarillo":12,"proveedor":"Rock Import EC"},
    /* AMARILLO intensidad 2 — punto medio del rango (revisar pronto) */
    {"id":"p29","nombre":"Camiseta The Cure - Disintegration","categoria":"Camisetas","sku":"CAM-CUR-DIS","barcode":"7861000030217","ubicacionId":"mercado","precio":22,"costo":13,"stockActual":9,"umbralRojo":4,"umbralAmarillo":14,"proveedor":"Rock Import EC"},
    /* AMARILLO intensidad 3 — justo debajo del umbral verde (tope del amarillo) */
    {"id":"p30","nombre":"Taza Batman Rock Ceramica","categoria":"Souvenirs","sku":"SOU-TAZ-002","barcode":"7861000030224","ubicacionId":"feria","precio":9,"costo":5.5,"stockActual":13,"umbralRojo":4,"umbralAmarillo":14,"proveedor":"Souvenirs del Tomebamba"},
    /* VERDE — stock saludable, margen moderado (< 0.50, no es azul) */
    {"id":"p31","nombre":"Agenda Rock 2026 Tapa Dura","categoria":"Papeleria","sku":"PAP-AGE-001","barcode":"7861000030231","ubicacionId":"centro","precio":15,"costo":9,"stockActual":25,"umbralRojo":5,"umbralAmarillo":12,"proveedor":"Distribuidora Cuenca"},
    /* VERDE — margen bajo, volumen alto (artículo de bajo costo) */
    {"id":"p32","nombre":"Bolsa de Tela Rock Estampada","categoria":"Accesorios","sku":"ACC-BOL-001","barcode":"7861000030248","ubicacionId":"mercado","precio":8,"costo":5,"stockActual":40,"umbralRojo":10,"umbralAmarillo":20,"proveedor":"Rock Import EC"},
    /* VERDE — producto de volumen, margen ajustado */
    {"id":"p33","nombre":"Libreta Tapa Dura Rock 80 hojas","categoria":"Papeleria","sku":"PAP-LIB-001","barcode":"7861000030255","ubicacionId":"feria","precio":11,"costo":7,"stockActual":18,"umbralRojo":5,"umbralAmarillo":10,"proveedor":"Distribuidora Cuenca"},
    /* AZUL — alto margen (>50%), buen stock: impulsar esta semana */
    {"id":"p34","nombre":"Vinilo The Clash - London Calling","categoria":"Vinilos","sku":"VIN-CLA-LON","barcode":"7861000030262","ubicacionId":"centro","precio":48,"costo":18,"stockActual":12,"umbralRojo":3,"umbralAmarillo":6,"proveedor":"Rock Import EC"},
    /* AZUL — margen premium, oportunidad de vitrina */
    {"id":"p35","nombre":"Vinilo Radiohead - OK Computer","categoria":"Vinilos","sku":"VIN-RAD-OKC","barcode":"7861000030279","ubicacionId":"mercado","precio":50,"costo":18,"stockActual":8,"umbralRojo":2,"umbralAmarillo":5,"proveedor":"Rock Import EC"},
    /* AZUL estrella — margen maximo, pieza de coleccion, impulso prioritario */
    {"id":"p36","nombre":"Figura Coleccionable Iron Maiden Eddie","categoria":"Coleccionables","sku":"COL-IM-EDI","estrella":true,"barcode":"7861000030286","ubicacionId":"feria","precio":65,"costo":22,"stockActual":5,"umbralRojo":2,"umbralAmarillo":4,"proveedor":"Rock Import EC"},
    /* PERECIBLES — 3 grados de urgencia por vencimiento */
    /* Rojo por vencimiento: vence en 2 dias (retiralo ya aunque el stock sea bueno) */
    {"id":"p37","nombre":"Cafe Molido Artesanal Cuenca 250g","categoria":"Alimentos","sku":"ALI-CAF-001","barcode":"7861000030293","ubicacionId":"centro","precio":7,"costo":3,"stockActual":15,"umbralRojo":5,"umbralAmarillo":10,"perecible":true,"fechaCaducidad":"2026-07-05","proveedor":"Cafe del Austro"},
    /* Amarillo por vencimiento: vence en 5 dias (vendelo primero) */
    {"id":"p38","nombre":"Chocolate 70pct Cacao x10 unidades","categoria":"Alimentos","sku":"ALI-CHO-001","barcode":"7861000030309","ubicacionId":"mercado","precio":4,"costo":1.8,"stockActual":20,"umbralRojo":5,"umbralAmarillo":10,"perecible":true,"fechaCaducidad":"2026-07-08","proveedor":"Pacari Ecuador"},
    /* Rojo extremo: ya vencio hace 3 dias (retirar inmediatamente) */
    {"id":"p39","nombre":"Granola Organica Sierra 500g","categoria":"Alimentos","sku":"ALI-GRA-001","barcode":"7861000030316","ubicacionId":"feria","precio":9,"costo":4.5,"stockActual":8,"umbralRojo":3,"umbralAmarillo":6,"perecible":true,"fechaCaducidad":"2026-06-30","proveedor":"Bio Market Cuenca"}
  ];

  const ventas = [];
  const movimientos = [];
  const transferencias = [];
  const gastosMensuales = {"centro":0,"mercado":0,"feria":0};
  const ORDEN = { rojo: 0, amarillo: 1, azul: 2, verde: 3 };

  function nombreUbic(id) { const u = ubicaciones.find((x) => x.id === id); return u ? u.nombre : "Ubicación desconocida"; }

  // ---- Reparto de comisiones (espejo de data.js) ----
  function mesActualISO() { return hoyISO().slice(0, 7); }
  function esDelMesActual(fechaISO) { return fechaISO && fechaISO.slice(0, 7) === mesActualISO(); }
  function ventasMesAcumuladas(ubicacionId) {
    return ventas.filter((v) => v.ubicacionId === ubicacionId && esDelMesActual(v.fecha)).reduce((a, v) => a + v.precioUnit * v.cantidad, 0);
  }
  function comisionVigente(u, acumuladoConEsta) {
    const escalas = Array.isArray(u.escalasComision) ? u.escalasComision : [];
    if (!u.metaMensual || escalas.length === 0) return Number(u.comisionSocio) || 0;
    const pctMeta = (acumuladoConEsta / u.metaMensual) * 100;
    const ordenadas = [...escalas].sort((a, b) => a.hasta - b.hasta);
    const tier = ordenadas.find((e) => pctMeta <= e.hasta) || ordenadas[ordenadas.length - 1];
    return Number(tier.comision) || 0;
  }
  function calcularSplitVenta(u, montoBruto, acumuladoPrevio) {
    if (!u || u.tipo === "propio" || !u.tipo) return null;
    const comisionPct = comisionVigente(u, acumuladoPrevio + montoBruto);
    const montoComisionSocio = +(montoBruto * (comisionPct / 100)).toFixed(2);
    return { comisionPct, montoBruto: +montoBruto.toFixed(2), montoComisionSocio, montoNetoDueno: +(montoBruto - montoComisionSocio).toFixed(2) };
  }
  function getLiquidaciones() {
    return ubicaciones.filter((u) => u.tipo && u.tipo !== "propio").map((u) => {
      const ventasMes = ventas.filter((v) => v.ubicacionId === u.id && esDelMesActual(v.fecha) && v.split);
      const ventasBrutas = ventasMes.reduce((a, v) => a + v.split.montoBruto, 0);
      const comisionSocio = ventasMes.reduce((a, v) => a + v.split.montoComisionSocio, 0);
      const netoDueno = ventasMes.reduce((a, v) => a + v.split.montoNetoDueno, 0);
      const pendientes = ventasMes.filter((v) => !v.liquidada);
      // Dias desde la ultima venta de esta percha (rec 05: promotor/a dormida).
      const ultima = ventas.filter((v) => v.ubicacionId === u.id).reduce((mx, v) => (v.fecha > mx ? v.fecha : mx), "");
      const diasSinVenta = ultima ? Math.floor((Date.now() - new Date(ultima).getTime()) / 86400000) : null;
      const prom = u.promotoraId ? promotoras.find((x) => x.id === u.promotoraId) : null;
      return {
        ubicacionId: u.id, ubicacion: u.nombre, tipo: u.tipo, metaMensual: u.metaMensual || 0,
        cumplimientoMeta: u.metaMensual ? +((ventasBrutas / u.metaMensual) * 100).toFixed(1) : null,
        ventasBrutas: +ventasBrutas.toFixed(2), comisionSocio: +comisionSocio.toFixed(2), netoDueno: +netoDueno.toFixed(2),
        estado: ventasMes.length === 0 ? "sin ventas" : pendientes.length === 0 ? "pagado" : "pendiente",
        ventasPendientes: pendientes.length,
        diasSinVenta, promotorNombre: prom ? prom.nombre : null,
      };
    });
  }
  // ---- Inventario compartido (espejo de data.js) ----
  function estadoSimple(p) { if (p.stockActual <= 0) return "rojo"; if (p.stockActual <= p.umbralRojo) return "rojo"; if (p.stockActual <= p.umbralAmarillo) return "amarillo"; return "verde"; }
  function getSugerenciasTransferencia(productoId) {
    const p = productos.find((x) => x.id === productoId);
    // BUG FIX (2026-07-03): estadoSimple() ignoraba perecibles; un producto a
    // punto de vencer (rojo por vencimiento) se sugeria como origen de
    // transferencia aunque su stock fuera alto. Reemplazado por estadoDe().
    if (!p || estadoDe(p).estado === "verde" || estadoDe(p).estado === "azul") return [];
    const activasIds = new Set(ubicaciones.filter((u) => u.activa !== false).map((u) => u.id));
    return productos.filter((x) => x.sku === p.sku && x.id !== p.id && activasIds.has(x.ubicacionId) && estadoDe(x).estado !== "rojo" && x.stockActual > x.umbralAmarillo)
      .map((x) => ({ productoDestinoId: p.id, productoOrigenId: x.id, sku: p.sku, nombre: p.nombre, desde: x.ubicacionId, desdeNombre: nombreUbic(x.ubicacionId), hacia: p.ubicacionId, haciaNombre: nombreUbic(p.ubicacionId), stockOrigen: x.stockActual, cantidadSugerida: Math.min(Math.floor(x.stockActual / 2), x.stockActual - x.umbralAmarillo) }))
      .filter((s) => s.cantidadSugerida > 0);
  }
  // Días para vencer (negativo = ya venció). Espejo de diasParaVencer() en server.js.
  function diasParaVencer(fecha) {
    if (!fecha) return null;
    const hoy = new Date(hoyISO() + "T00:00:00");
    const venc = new Date(fecha + "T00:00:00");
    return Math.round((venc - hoy) / 86400000);
  }
  // Espejo de calcularEstado() en server.js: combina stock + vencimiento,
  // se queda con la señal más grave de las dos.
  function estadoDe(p) {
    const margen = p.precio > 0 ? (p.precio - p.costo) / p.precio : 0;
    const dias = p.perecible ? diasParaVencer(p.fechaCaducidad) : null;
    let porStock;
    if (p.stockActual <= 0) porStock = { estado: "rojo", mensaje: "Sin stock — repón cuanto antes" };
    else if (p.stockActual <= p.umbralRojo) porStock = { estado: "rojo", mensaje: `Quedan ${p.stockActual} — reponer urgente` };
    else if (p.stockActual <= p.umbralAmarillo) porStock = { estado: "amarillo", mensaje: `Quedan ${p.stockActual} — revisar pronto` };
    else if (margen >= 0.5) porStock = { estado: "azul", mensaje: "Buen margen — impúlsalo esta semana" };
    else porStock = { estado: "verde", mensaje: "Stock saludable" };
    if (dias == null) return { ...porStock, dias };
    let porVenc = null;
    if (dias < 0) porVenc = { estado: "rojo", mensaje: `Venció hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"} — retíralo` };
    else if (dias <= 3) porVenc = { estado: "rojo", mensaje: `Vence en ${dias} día${dias === 1 ? "" : "s"} — véndelo ya` };
    else if (dias <= 7) porVenc = { estado: "amarillo", mensaje: `Vence en ${dias} días — véndelo primero` };
    if (!porVenc) return { ...porStock, dias };
    const masGrave = ORDEN[porVenc.estado] <= ORDEN[porStock.estado] ? porVenc : porStock;
    return { ...masGrave, dias };
  }
  function ficha(p) {
    const e = estadoDe(p);
    return { id: p.id, nombre: p.nombre, precio: p.precio, sku: p.sku, barcode: p.barcode, proveedor: p.proveedor, stockActual: p.stockActual, estado: e.estado, mensaje: e.mensaje, categoria: p.categoria, ubicacionId: p.ubicacionId, ubicacionNombre: nombreUbic(p.ubicacionId), perecible: !!p.perecible, fechaCaducidad: p.fechaCaducidad || null, diasParaVencer: e.dias, metodoCosteo: p.metodoCosteo || "FIFO", foto: p.foto || null };
  }
  function filtrar(uid) { return !uid || uid === "todas" ? productos : productos.filter((p) => p.ubicacionId === uid); }
  function ventasHoyDe(uid) { return ventas.filter((v) => (!uid || uid === "todas" || v.ubicacionId === uid)); }
  function mov(tipo, detalle) { movimientos.push({ id: String(Date.now() + Math.random()), tipo, detalle, fecha: new Date().toISOString() }); }
  const J = (obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });

  // Genera un QR como data URL sin dependencias: usa una API pública de imagen.
  // Para una demo es suficiente; el backend real lo genera localmente con qrcode.
  function qrDataUrl(payload) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=4&data=" + encodeURIComponent(payload);
  }

  const realFetch = window.fetch.bind(window);

  window.fetch = async function (url, opts) {
    try {
      const u = new URL(url, window.location.origin);
      if (!u.pathname.startsWith("/api")) return realFetch(url, opts);
      const path = u.pathname;
      const q = u.searchParams;
      const body = opts && opts.body ? JSON.parse(opts.body) : {};
      const uid = q.get("ubicacionId");

      let m;
      // Edicion libre de la ficha (nombre, foto, precios, codigo interno).
      // El gating por rol (empleado NO edita) vive en la UI; aca solo se aplica.
      if ((m = path.match(/^\/api\/productos\/([^/]+)$/)) && opts && opts.method === "PATCH") {
        const p = productos.find((x) => x.id === m[1]); if (!p) return J({ error: "Producto no encontrado." }, 404);
        const CAMPOS = ["nombre", "categoria", "precio", "costo", "proveedor", "foto", "barcode", "sku", "perecible", "fechaCaducidad", "metodoCosteo"];
        CAMPOS.forEach((k) => { if (body[k] !== undefined) p[k] = (k === "precio" || k === "costo") ? Number(body[k]) || 0 : body[k]; });
        mov("edicion", { producto: p.nombre, sku: p.sku, ubicacion: nombreUbic(p.ubicacionId) });
        return J(ficha(p));
      }
      // Borrado definitivo (dueno, doble confirmacion en la UI).
      if ((m = path.match(/^\/api\/productos\/([^/]+)$/)) && opts && opts.method === "DELETE") {
        const i = productos.findIndex((x) => x.id === m[1]); if (i === -1) return J({ error: "Producto no encontrado." }, 404);
        // BUG FIJADO 2026-07-03: una transferencia "en_transito" ya restó el
        // stock del origen esperando que el destino lo reciba. Borrar el
        // producto origen o destino en ese estado perdía esas unidades para
        // siempre, sin rastro. Bloquear hasta que se confirme o resuelva.
        const enTransito = transferencias.find((t) => t.estado === "en_transito" && (t.productoOrigenId === m[1] || t.productoDestinoId === m[1]));
        if (enTransito) return J({ error: `"${productos[i].nombre}" tiene una transferencia en tránsito (${enTransito.cantidad} unidades). Espera a que se confirme o se resuelva antes de borrarlo.` }, 400);
        const borrado = productos.splice(i, 1)[0];
        mov("baja", { producto: borrado.nombre, sku: borrado.sku, ubicacion: nombreUbic(borrado.ubicacionId) });
        return J({ ok: true });
      }
      if (path === "/api/modo") return J({ modo: "demo-estatico" });
      if (path === "/api/ubicaciones" && (!opts || opts.method !== "POST")) {
        const soloActivas = q.get("todas") !== "1";
        return J(soloActivas ? ubicaciones.filter((u) => u.activa !== false) : ubicaciones);
      }
      if (path === "/api/ubicaciones" && opts && opts.method === "POST") {
        if (!body.nombre || !body.nombre.trim()) return J({ error: "El nombre de la ubicación es obligatorio." }, 400);
        const nueva = { id: "u" + Math.random().toString(36).slice(2, 9), nombre: body.nombre.trim(), tipo: body.tipo || "propio", activa: true, comisionSocio: Number(body.comisionSocio) || 0, metaMensual: Number(body.metaMensual) || 0, escalasComision: Array.isArray(body.escalasComision) ? body.escalasComision : [], sucursalId: body.sucursalId || null, esFeria: !!body.esFeria };
        ubicaciones.push(nueva);
        // BUG FIX (2026-07-03): las perchas creadas en runtime no existian en
        // gastosMensuales, por lo que la suma "todas" las excluia hasta que se
        // guardara algun gasto para ellas. Se inicializa en 0 al crearlas.
        gastosMensuales[nueva.id] = 0;
        mov("ubicacion-alta", { ubicacion: nueva.nombre });
        return J(nueva);
      }
      if ((m = path.match(/^\/api\/ubicaciones\/([^/]+)$/)) && opts && opts.method === "PUT") {
        const u = ubicaciones.find((x) => x.id === m[1]); if (!u) return J({ error: "Ubicación no encontrada." }, 404);
        if (body.nombre && body.nombre.trim()) u.nombre = body.nombre.trim();
        if (body.tipo) u.tipo = body.tipo;
        if ("sucursalId" in body) u.sucursalId = body.sucursalId || null;
        if ("promotoraId" in body) u.promotoraId = body.promotoraId || null;
        return J(u);
      }
      if ((m = path.match(/^\/api\/ubicaciones\/([^/]+)\/(activar|desactivar)$/))) {
        const u = ubicaciones.find((x) => x.id === m[1]); if (!u) return J({ error: "Ubicación no encontrada." }, 404);
        u.activa = m[2] === "activar";
        mov(u.activa ? "ubicacion-reactivada" : "ubicacion-desactivada", { ubicacion: u.nombre });
        return J(u);
      }
      if ((m = path.match(/^\/api\/ubicaciones\/([^/]+)$/)) && opts && opts.method === "DELETE") {
        const idx = ubicaciones.findIndex((x) => x.id === m[1]); if (idx < 0) return J({ error: "Percha no encontrada." }, 404);
        if (ubicaciones.length <= 1) return J({ error: "Debe quedar al menos una percha." }, 400);
        const u = ubicaciones[idx];
        // Borrado en cascada: la percha y TODOS sus productos. La UI ya lo advirtio.
        const productosBorrados = productos.filter((p) => p.ubicacionId === u.id).length;
        for (let i = productos.length - 1; i >= 0; i--) if (productos[i].ubicacionId === u.id) productos.splice(i, 1);
        ubicaciones.splice(idx, 1);
        delete gastosMensuales[u.id];
        mov("ubicacion-borrada", { ubicacion: u.nombre, productosBorrados });
        return J({ ok: true, productosBorrados });
      }
      // ---- Promotores/as (comision por traer gente) ----
      if (path === "/api/promotoras" && (!opts || opts.method !== "POST")) return J(promotoras);
      if (path === "/api/promotoras" && opts && opts.method === "POST") {
        if (!body.nombre || !body.nombre.trim()) return J({ error: "El nombre es obligatorio." }, 400);
        const nuevaProm = { id: "pr" + Math.random().toString(36).slice(2, 9), nombre: body.nombre.trim(), comision: Number(body.comision) || 0 };
        promotoras.push(nuevaProm);
        mov("promotora-alta", { promotora: nuevaProm.nombre });
        return J(nuevaProm);
      }
      const mProm = path.match(/^\/api\/promotoras\/([^/]+)$/);
      if (mProm && opts && opts.method === "DELETE") {
        const idxP = promotoras.findIndex((x) => x.id === mProm[1]);
        if (idxP < 0) return J({ error: "Promotor/a no encontrada." }, 404);
        const prb = promotoras.splice(idxP, 1)[0];
        // Desasignar de las perchas que lo tenian
        ubicaciones.forEach((u) => { if (u.promotoraId === prb.id) u.promotoraId = null; });
        mov("promotora-baja", { promotora: prb.nombre });
        return J({ ok: true });
      }
      // ---- Sucursales (agrupadores backend de perchas) ----
      if (path === "/api/sucursales" && (!opts || opts.method !== "POST")) return J(sucursales);
      if (path === "/api/sucursales" && opts && opts.method === "POST") {
        if (!body.nombre || !body.nombre.trim()) return J({ error: "El nombre de la sucursal es obligatorio." }, 400);
        const nuevaSuc = { id: "suc" + Math.random().toString(36).slice(2, 9), nombre: body.nombre.trim(), activa: true };
        sucursales.push(nuevaSuc);
        mov("sucursal-alta", { sucursal: nuevaSuc.nombre });
        return J(nuevaSuc);
      }
      const mSuc = path.match(/^\/api\/sucursales\/([^/]+)$/);
      if (mSuc && opts && opts.method === "PUT") {
        const s = sucursales.find((x) => x.id === mSuc[1]); if (!s) return J({ error: "Sucursal no encontrada." }, 404);
        if (body.nombre && body.nombre.trim()) s.nombre = body.nombre.trim();
        return J(s);
      }
      if (mSuc && opts && opts.method === "DELETE") {
        const tienePerchas = ubicaciones.some((u) => u.sucursalId === mSuc[1]);
        if (tienePerchas) return J({ error: "Mueve las perchas a otra sucursal antes de borrar esta." }, 400);
        const idxS = sucursales.findIndex((x) => x.id === mSuc[1]);
        if (idxS < 0) return J({ error: "Sucursal no encontrada." }, 404);
        const s = sucursales.splice(idxS, 1)[0];
        mov("sucursal-baja", { sucursal: s.nombre });
        return J({ ok: true });
      }

      // Desempeno por promotor/a: agrega las perchas que tiene asignadas,
      // suma comision y ventas del mes, y saca su mejor SKU (rec 04 + 09).
      if (path === "/api/promotores/desempeno") {
        const byId = {};
        ubicaciones.filter((u) => u.promotoraId).forEach((u) => {
          const pr = promotoras.find((x) => x.id === u.promotoraId); if (!pr) return;
          const g = byId[pr.id] || (byId[pr.id] = { id: pr.id, nombre: pr.nombre, ventasBrutas: 0, ventasCount: 0, comision: 0, ultima: "", porSku: {} });
          ventas.filter((v) => v.ubicacionId === u.id && esDelMesActual(v.fecha) && v.split).forEach((v) => {
            g.ventasBrutas += v.split.montoBruto;
            g.comision += v.split.montoComisionSocio;
            g.ventasCount += v.cantidad;
            if (v.fecha > g.ultima) g.ultima = v.fecha;
            const prod = productos.find((x) => x.id === v.productoId);
            const sku = prod ? prod.sku : v.productoId;
            g.porSku[sku] = (g.porSku[sku] || 0) + v.cantidad;
          });
        });
        const arr = Object.values(byId).map((g) => {
          const top = Object.entries(g.porSku).sort((a, b) => b[1] - a[1])[0];
          return { id: g.id, nombre: g.nombre, ventasBrutas: +g.ventasBrutas.toFixed(2), ventasCount: g.ventasCount, comision: +g.comision.toFixed(2), diasSinVenta: g.ultima ? Math.floor((Date.now() - new Date(g.ultima).getTime()) / 86400000) : null, topSku: top ? { sku: top[0], unidades: top[1] } : null };
        }).sort((a, b) => b.ventasBrutas - a.ventasBrutas);
        return J(arr);
      }
      if (path === "/api/dashboard") {
        const ps = filtrar(uid), vh = ventasHoyDe(uid);
        const entra = vh.reduce((a, v) => a + v.precioUnit * v.cantidad, 0);
        const sale = vh.reduce((a, v) => a + v.costoUnit * v.cantidad, 0);
        const inv = ps.reduce((a, p) => a + p.precio * p.stockActual, 0);
        const alertas = ps.map((p) => ({ p, ...estadoDe(p) })).filter((e) => e.estado === "rojo" || e.estado === "amarillo").sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado]).map((e) => ({ estado: e.estado, mensaje: `${e.p.nombre}: ${e.mensaje}` }));
        let sem = "verde";
        if (alertas.some((a) => a.estado === "rojo")) sem = "rojo"; else if (alertas.some((a) => a.estado === "amarillo")) sem = "amarillo";
        return J({ semaforoGeneral: sem, resumenDia: { entra: +entra.toFixed(2), sale: +sale.toFixed(2), gananciaHoy: +(entra - sale).toFixed(2), inventarioValorizado: +inv.toFixed(2), ventasCount: vh.length }, alertas });
      }

      if (path === "/api/productos" && (!opts || opts.method !== "POST")) {
        let lista = filtrar(uid).map((p) => { const e = estadoDe(p); return { id: p.id, nombre: p.nombre, categoria: p.categoria, sku: p.sku, stockActual: p.stockActual, estado: e.estado, mensaje: e.mensaje, precio: p.precio, perecible: !!p.perecible, fechaCaducidad: p.fechaCaducidad || null, diasParaVencer: e.dias, estrella: !!p.estrella }; });
        const est = q.get("estado");
        if (est) lista = lista.filter((x) => x.estado === est);
        lista.sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || a.nombre.localeCompare(b.nombre, "es"));
        return J(lista);
      }

      if (path === "/api/productos" && opts && opts.method === "POST") {
        if (!body.nombre || !body.barcode) return J({ error: "Falta el nombre o el código de barras." }, 400);
        // BUG FIX (2026-07-03): sin esta guarda, umbralRojo >= umbralAmarillo hace
        // el estado "amarillo" inalcanzable: el producto salta directo de verde a rojo.
        if (Number(body.umbralRojo) >= Number(body.umbralAmarillo)) return J({ error: "El umbral rojo debe ser menor que el umbral amarillo." }, 400);
        if (body.perecible && !body.fechaCaducidad) return J({ error: "Si el producto expira, indica su fecha de caducidad." }, 400);
        const ubicNueva = body.ubicacionId && body.ubicacionId !== "todas" ? ubicaciones.find((x) => x.id === body.ubicacionId) : null;
        if (ubicNueva && ubicNueva.activa === false) return J({ error: `"${ubicNueva.nombre}" está desactivada — reactívala en Avanzado antes de agregar productos ahí.` }, 400);
        const nuevo = {
          id: "p" + Math.random().toString(36).slice(2, 9), nombre: body.nombre, categoria: body.categoria || "General",
          sku: body.sku || body.barcode, barcode: body.barcode, ubicacionId: body.ubicacionId || "todas",
          // BUG FIJADO 2026-07-03: sin piso en 0, un stockInicial negativo
          // corrompía la valorización de inventario desde la creación.
          precio: Number(body.precio) || 0, costo: Number(body.costo) || 0, stockActual: Math.max(0, Number(body.stockInicial) || 0),
          umbralRojo: Number(body.umbralRojo) || 5, umbralAmarillo: Number(body.umbralAmarillo) || 10, proveedor: body.proveedor || "",
          perecible: !!body.perecible, fechaCaducidad: body.perecible ? (body.fechaCaducidad || null) : null,
          metodoCosteo: body.metodoCosteo === "LIFO" ? "LIFO" : "FIFO",
        };
        productos.push(nuevo);
        mov("alta", { producto: nuevo.nombre, sku: nuevo.sku, ubicacion: nombreUbic(nuevo.ubicacionId) });
        return J(ficha(nuevo));
      }

      if ((m = path.match(/^\/api\/productos\/([^/]+)\/venta$/))) {
        const p = productos.find((x) => x.id === m[1]); if (!p) return J({ error: "Producto no encontrado." }, 404);
        const ubicP = ubicaciones.find((x) => x.id === p.ubicacionId);
        if (ubicP && ubicP.activa === false) return J({ error: `"${ubicP.nombre}" está desactivada — no admite ventas nuevas.` }, 400);
        const cant = Number.isInteger(body.cantidad) && body.cantidad > 0 ? body.cantidad : 1;
        if (p.stockActual < cant) return J({ error: `No hay suficiente stock disponible (quedan ${p.stockActual}).` }, 400);
        const montoBruto = p.precio * cant;
        const acumuladoPrevio = ubicP ? ventasMesAcumuladas(ubicP.id) : 0;
        const split = ubicP ? calcularSplitVenta(ubicP, montoBruto, acumuladoPrevio) : null;
        p.stockActual -= cant;
        const ventaId = String(Date.now() + Math.random());
        ventas.push({ id: ventaId, productoId: p.id, ubicacionId: p.ubicacionId, cantidad: cant, precioUnit: p.precio, costoUnit: p.costo, fecha: new Date().toISOString(), split, liquidada: false });
        mov("venta", { producto: p.nombre, cantidad: cant, total: +(p.precio * cant).toFixed(2), ubicacion: nombreUbic(p.ubicacionId) });
        return J({ producto: ficha(p), ventaId });
      }
      if ((m = path.match(/^\/api\/ventas\/([^/]+)\/anular$/))) {
        const idx = ventas.findIndex((v) => v.id === m[1]);
        if (idx === -1) return J({ error: "Esta venta ya no se puede anular (pasó el tiempo o ya se anuló)." }, 400);
        const venta = ventas[idx];
        // BUG FIJADO 2026-07-03: la UI muestra 5s de cuenta regresiva para
        // anular y luego oculta el botón, pero este endpoint aceptaba anular
        // cualquier venta pasada sin límite de tiempo (podía borrar ventas
        // ya liquidadas a un socio). Margen generoso sobre esos 5s.
        const VENTANA_ANULACION_MS = 30 * 1000;
        // FIX (code-review 2026-07-03): fecha ausente/invalida -> NaN -> "NaN >
        // 30000" es false -> anulable para siempre. Number.isFinite() falla
        // CERRADO (rechaza) en vez de abierto.
        const antiguedadMs = Date.now() - new Date(venta.fecha).getTime();
        if (!Number.isFinite(antiguedadMs) || antiguedadMs > VENTANA_ANULACION_MS) {
          return J({ error: "Esta venta ya no se puede anular (pasó el tiempo o ya se anuló)." }, 400);
        }
        const p = productos.find((x) => x.id === venta.productoId);
        if (!p) return J({ error: "Producto no encontrado." }, 404);
        p.stockActual += venta.cantidad;
        ventas.splice(idx, 1);
        mov("anulacion", { producto: p.nombre, cantidad: venta.cantidad, ubicacion: nombreUbic(p.ubicacionId) });
        return J({ producto: ficha(p) });
      }
      if ((m = path.match(/^\/api\/productos\/([^/]+)\/ajustar$/))) {
        const p = productos.find((x) => x.id === m[1]); if (!p) return J({ error: "Producto no encontrado." }, 404);
        const d = Number.isInteger(body.delta) ? body.delta : 0;
        // BUG FIX (2026-07-03): delta=0 es un entero valido, pasa la guarda de
        // arriba, no cambia el stock pero registra un movimiento en el log. Silencioso
        // y contaminante. Se rechaza explicitamente.
        if (d === 0) return J({ error: "El ajuste debe ser distinto de cero." }, 400);
        if (p.stockActual + d < 0) return J({ error: `Ese ajuste dejaría el stock en negativo (actual: ${p.stockActual}).` }, 400);
        p.stockActual += d;
        mov("ajuste", { producto: p.nombre, delta: d, motivo: body.motivo || "Ajuste manual", stockResultante: p.stockActual, ubicacion: nombreUbic(p.ubicacionId) });
        return J(ficha(p));
      }
      if ((m = path.match(/^\/api\/productos\/([^/]+)\/etiqueta$/))) {
        const p = productos.find((x) => x.id === m[1]); if (!p) return J({ error: "Producto no encontrado." }, 404);
        // Barcode: generado local con window.OCBarcode (barcode128.js), cero llamadas
        // externas. QR: sigue usando la API pública qrserver.com solo en esta demo
        // estática (el backend real lo genera 100% local con la librería "qrcode").
        const barcodeSvg = window.OCBarcode ? window.OCBarcode.code128SVG(p.barcode, { width: 300, height: 80 }) : "";
        return J({ producto: ficha(p), qrDataUrl: qrDataUrl(JSON.stringify({ id: p.id, sku: p.sku, barcode: p.barcode })), barcodeSvg });
      }
      if ((m = path.match(/^\/api\/productos\/([^/]+)$/))) {
        const p = productos.find((x) => x.id === m[1]); if (!p) return J({ error: "Producto no encontrado." }, 404);
        return J(ficha(p));
      }

      if (path === "/api/escanear") {
        const c = String(body.codigo || "").trim().toLowerCase();
        if (!c) return J({ error: "Código vacío." }, 400);
        const p = productos.find((x) => String(x.barcode).toLowerCase() === c || String(x.sku).toLowerCase() === c);
        if (!p) return J({ error: "No se encontró ningún producto con ese código." }, 404);
        return J(ficha(p));
      }

      if (path === "/api/actividad") return J(movimientos.slice().reverse().slice(0, 100));

      // Estrella: dueño marca/desmarca productos para que el empleado promueva
      if ((m = path.match(/^\/api\/productos\/([^/]+)\/estrella$/))) {
        const p = productos.find((x) => x.id === m[1]); if (!p) return J({ error: "Producto no encontrado." }, 404);
        p.estrella = !p.estrella;
        mov("estrella", { producto: p.nombre, accion: p.estrella ? "marcado" : "desmarcado" });
        return J({ estrella: p.estrella });
      }

      if (path === "/api/respaldo/exportar") {
        return J({ modo: "demo-estatico", ubicaciones, productos, ventas, movimientos, configuracion: { gastosMensuales } });
      }
      if (path === "/api/respaldo/importar") {
        try {
          // BUG FIJADO 2026-07-03: solo se comprobaba "truthy", no que fueran
          // arrays reales. Un respaldo corrupto (ej. productos como string)
          // rompía la demo entera: push(...string) reparte cada CARÁCTER
          // como si fuera un producto, y toda la app queda inservible hasta
          // recargar la página, perdiendo la sesión en curso.
          if (!Array.isArray(body.productos) || !Array.isArray(body.ubicaciones)) {
            return J({ error: "El archivo no parece un respaldo válido." }, 400);
          }
          productos.length = 0; productos.push(...body.productos);
          ubicaciones.length = 0; ubicaciones.push(...body.ubicaciones);
          ventas.length = 0; ventas.push(...(Array.isArray(body.ventas) ? body.ventas : []));
          movimientos.length = 0; movimientos.push(...(Array.isArray(body.movimientos) ? body.movimientos : []));
          if (body.configuracion && body.configuracion.gastosMensuales) {
            Object.keys(gastosMensuales).forEach((k) => delete gastosMensuales[k]);
            Object.assign(gastosMensuales, body.configuracion.gastosMensuales);
          }
          return J({ ok: true });
        } catch (e) { return J({ error: "No se pudo importar: " + String(e) }, 400); }
      }

      if (path === "/api/liquidaciones") return J(getLiquidaciones());
      if ((m = path.match(/^\/api\/liquidaciones\/([^/]+)\/marcar-pagado$/))) {
        const u = ubicaciones.find((x) => x.id === m[1]); if (!u) return J({ error: "Ubicación no encontrada." }, 404);
        const pend = ventas.filter((v) => v.ubicacionId === m[1] && esDelMesActual(v.fecha) && !v.liquidada);
        pend.forEach((v) => { v.liquidada = true; });
        mov("liquidacion", { ubicacion: u.nombre, ventasLiquidadas: pend.length });
        return J({ ok: true, ventasLiquidadas: pend.length });
      }

      if ((m = path.match(/^\/api\/productos\/([^/]+)\/sugerencias-transferencia$/))) {
        return J(getSugerenciasTransferencia(m[1]));
      }
      if (path === "/api/transferencias" && (!opts || opts.method !== "POST")) {
        return J(transferencias.slice().reverse());
      }
      if (path === "/api/transferencias" && opts && opts.method === "POST") {
        const origen = productos.find((x) => x.id === body.productoOrigenId);
        const destino = productos.find((x) => x.id === body.productoDestinoId);
        if (!origen || !destino) return J({ error: "Producto no encontrado." }, 404);
        if (origen.sku !== destino.sku) return J({ error: "Los productos de origen y destino no son el mismo artículo (SKU distinto)." }, 400);
        const cant = Number(body.cantidad);
        if (!Number.isInteger(cant) || cant <= 0) return J({ error: "La cantidad debe ser un entero mayor a 0." }, 400);
        if (origen.stockActual < cant) return J({ error: `"${origen.nombre}" solo tiene ${origen.stockActual} unidades en origen.` }, 400);
        const t = { id: "t" + Math.random().toString(36).slice(2, 9), productoOrigenId: origen.id, productoDestinoId: destino.id, sku: origen.sku, nombre: origen.nombre, desde: origen.ubicacionId, desdeNombre: nombreUbic(origen.ubicacionId), hacia: destino.ubicacionId, haciaNombre: nombreUbic(destino.ubicacionId), cantidad: cant, estado: "solicitada", fecha: new Date().toISOString() };
        transferencias.push(t);
        mov("transferencia-solicitada", { producto: t.nombre, cantidad: cant, desde: t.desdeNombre, hacia: t.haciaNombre });
        return J(t);
      }
      if ((m = path.match(/^\/api\/transferencias\/([^/]+)\/aprobar$/))) {
        const t = transferencias.find((x) => x.id === m[1]); if (!t) return J({ error: "Transferencia no encontrada." }, 404);
        if (t.estado !== "solicitada") return J({ error: `Esta transferencia ya está en estado "${t.estado}".` }, 400);
        const origen = productos.find((x) => x.id === t.productoOrigenId);
        if (!origen || origen.stockActual < t.cantidad) return J({ error: "Ya no hay suficiente stock en origen para aprobar esta transferencia." }, 400);
        origen.stockActual -= t.cantidad;
        t.estado = "en_transito";
        mov("transferencia-aprobada", { producto: t.nombre, cantidad: t.cantidad, desde: t.desdeNombre, hacia: t.haciaNombre });
        return J(t);
      }
      if ((m = path.match(/^\/api\/transferencias\/([^/]+)\/confirmar-recepcion$/))) {
        const t = transferencias.find((x) => x.id === m[1]); if (!t) return J({ error: "Transferencia no encontrada." }, 404);
        if (t.estado !== "en_transito") return J({ error: `Esta transferencia está "${t.estado}", no se puede confirmar recepción.` }, 400);
        const destino = productos.find((x) => x.id === t.productoDestinoId);
        if (!destino) return J({ error: "Producto destino no encontrado." }, 404);
        destino.stockActual += t.cantidad;
        t.estado = "recibida";
        mov("transferencia-recibida", { producto: t.nombre, cantidad: t.cantidad, desde: t.desdeNombre, hacia: t.haciaNombre });
        return J(t);
      }
      if ((m = path.match(/^\/api\/transferencias\/([^/]+)\/rechazar$/))) {
        const t = transferencias.find((x) => x.id === m[1]); if (!t) return J({ error: "Transferencia no encontrada." }, 404);
        if (t.estado !== "solicitada") return J({ error: `Esta transferencia ya está en estado "${t.estado}".` }, 400);
        t.estado = "rechazada";
        return J(t);
      }

      if (path === "/api/configuracion/gastos" && (!opts || opts.method !== "POST")) {
        if (!uid || uid === "todas") return J({ ubicacionId: "todas", gastosMensuales: +Object.values(gastosMensuales).reduce((a, v) => a + v, 0).toFixed(2), porUbicacion: gastosMensuales });
        return J({ ubicacionId: uid, gastosMensuales: gastosMensuales[uid] || 0 });
      }
      if (path === "/api/configuracion/gastos") {
        const { ubicacionId, gastosMensuales: g } = body; const monto = Number(g);
        // BUG FIJADO (JFC, 2026-07-01): esta excepción de "todas" es correcta
        // en Olimpo (ubicaciones DORMANT ahí, una sola tienda virtual), pero
        // se copió sin adaptar a AMIGABLE, donde ubicaciones SÍ está activo.
        // Guardar bajo "todas" aquí crearía una clave fantasma que se suma
        // aparte de los locales reales, inflando el total. AMIGABLE exige
        // una ubicación específica, como siempre debió ser.
        if (!ubicacionId || ubicacionId === "todas") return J({ error: "Elige una ubicación específica para guardar sus gastos mensuales." }, 400);
        if (!isFinite(monto) || monto < 0) return J({ error: "El monto debe ser un número igual o mayor a 0." }, 400);
        gastosMensuales[ubicacionId] = +monto.toFixed(2);
        return J({ ubicacionId, gastosMensuales: gastosMensuales[ubicacionId] });
      }

      if (path === "/api/reportes/pl") {
        const IVA = 0.15; // espejo de IVA_ECUADOR en server.js
        const vh = ventasHoyDe(uid);
        const ingConIva = vh.reduce((a, v) => a + v.precioUnit * v.cantidad, 0);
        const ing = ingConIva / (1 + IVA);
        const ivaCobrado = ingConIva - ing;
        const cv = vh.reduce((a, v) => a + v.costoUnit * v.cantidad, 0);
        const ub = ing - cv;
        const gm = (!uid || uid === "todas") ? Object.values(gastosMensuales).reduce((a, v) => a + v, 0) : (gastosMensuales[uid] || 0);
        const go = +(gm / diasEnMesActual()).toFixed(2);
        return J({ ingresosConIva: +ingConIva.toFixed(2), ingresos: +ing.toFixed(2), ivaCobrado: +ivaCobrado.toFixed(2), costoVentas: +cv.toFixed(2), utilidadBruta: +ub.toFixed(2), gastosOperativos: go, utilidadNeta: +(ub - go).toFixed(2) });
      }
      if (path === "/api/reportes/balance") {
        const ps = filtrar(uid), vh = ventasHoyDe(uid);
        const ef = vh.reduce((a, v) => a + v.precioUnit * v.cantidad, 0);
        const inv = ps.reduce((a, p) => a + p.precio * p.stockActual, 0);
        return J({ activos: { efectivoEstimado: +ef.toFixed(2), inventarioValorizado: +inv.toFixed(2), total: +(ef + inv).toFixed(2) } });
      }
      if (path === "/api/reportes/valorizado") {
        const filas = filtrar(uid).map((p) => ({ nombre: p.nombre, stockActual: p.stockActual, valorCosto: +(p.costo * p.stockActual).toFixed(2), valorVenta: +(p.precio * p.stockActual).toFixed(2), utilidadPotencial: +((p.precio - p.costo) * p.stockActual).toFixed(2) }));
        const t = filas.reduce((a, f) => ({ valorCosto: a.valorCosto + f.valorCosto, valorVenta: a.valorVenta + f.valorVenta, utilidadPotencial: a.utilidadPotencial + f.utilidadPotencial }), { valorCosto: 0, valorVenta: 0, utilidadPotencial: 0 });
        return J({ productos: filas, totales: { valorCosto: +t.valorCosto.toFixed(2), valorVenta: +t.valorVenta.toFixed(2), utilidadPotencial: +t.utilidadPotencial.toFixed(2) } });
      }

      return J({ error: "Ruta no encontrada en la demo." }, 404);
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  };
})();
