/**
 * Juego de datos en memoria.
 *
 * Replica fila por fila database/seed.sql para que el sistema pueda
 * levantarse y ejecutarse el plan de pruebas sin un servidor MySQL.
 * Las fechas se calculan relativas al dia de ejecucion, igual que el
 * script SQL (CURDATE() + INTERVAL), de modo que siempre existan
 * productos vencidos, proximos a vencer y vigentes.
 */

/** Devuelve una fecha ISO (YYYY-MM-DD) desplazada n dias desde hoy. */
export function fechaRelativa(dias) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dias);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Devuelve un DATETIME 'YYYY-MM-DD HH:MM:SS' desplazado n dias y h horas. */
export function fechaHoraRelativa(dias, horas = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dias);
  d.setHours(horas);
  return formatearFechaHora(d);
}

export function formatearFechaHora(fecha) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())} ` +
    `${p(fecha.getHours())}:${p(fecha.getMinutes())}:${p(fecha.getSeconds())}`
  );
}

/**
 * Construye el dataset inicial. Se llama una vez por arranque y tambien
 * desde las pruebas para reiniciar el estado entre casos.
 */
export function crearDatasetInicial() {
  return {
    usuarios: [
      {
        id_usuario: 1,
        nombre: 'Aaron Brumat',
        email: 'propietario@kiosky.com',
        password_hash: '$2a$10$YG0RVb0sv9vuOSzvaw1tZeWezqZm3h7I9Tc1y0MIFPTCDPoHvP5LC',
        rol: 'propietario',
        activo: true,
      },
      {
        id_usuario: 2,
        nombre: 'Empleado Mostrador',
        email: 'empleado@kiosky.com',
        password_hash: '$2a$10$oLGzy7hDl2YTAeVosUdJle8MwVqHTVS8pxXFeQEEZCTYxPyzRF5fC',
        rol: 'empleado',
        activo: true,
      },
      {
        id_usuario: 3,
        nombre: 'Usuario Inactivo',
        email: 'inactivo@kiosky.com',
        password_hash: '$2a$10$oLGzy7hDl2YTAeVosUdJle8MwVqHTVS8pxXFeQEEZCTYxPyzRF5fC',
        rol: 'empleado',
        activo: false,
      },
    ],

    categorias: [
      { id_categoria: 1, nombre: 'Golosinas',   descripcion: 'Caramelos, chocolates y chicles',  activo: true },
      { id_categoria: 2, nombre: 'Bebidas',     descripcion: 'Gaseosas, aguas y jugos',          activo: true },
      { id_categoria: 3, nombre: 'Snacks',      descripcion: 'Papas fritas, palitos y galletas', activo: true },
      { id_categoria: 4, nombre: 'Cigarrillos', descripcion: 'Productos de tabaco',              activo: true },
      { id_categoria: 5, nombre: 'Almacen',     descripcion: 'Articulos varios de almacen',      activo: true },
    ],

    medios_pago: [
      { id_medio_pago: 1, nombre: 'Efectivo',      activo: true },
      { id_medio_pago: 2, nombre: 'Debito',        activo: true },
      { id_medio_pago: 3, nombre: 'Credito',       activo: true },
      { id_medio_pago: 4, nombre: 'Transferencia', activo: true },
      { id_medio_pago: 5, nombre: 'Cheque',        activo: false },
    ],

    // Misma cobertura de casos que el seed SQL:
    //   1..4 normales | 5,6 bajo stock | 7,8 proximos a vencer
    //   9 vencido | 10 stock 0 | 11 sin codigo de barras | 12 stock = minimo
    productos: [
      { id_producto: 1,  codigo_barra: '7790001001', nombre: 'Chocolate Barra 30g', descripcion: 'Chocolate con leche',      precio: 1200, stock_actual: 50,  stock_minimo: 10, fecha_vencimiento: fechaRelativa(180), id_categoria: 1, activo: true },
      { id_producto: 2,  codigo_barra: '7790001002', nombre: 'Chicle Menta',        descripcion: 'Blister x10 unidades',     precio: 700,  stock_actual: 80,  stock_minimo: 15, fecha_vencimiento: fechaRelativa(240), id_categoria: 1, activo: true },
      { id_producto: 3,  codigo_barra: '7790002001', nombre: 'Gaseosa Cola 500ml',  descripcion: 'Botella descartable',      precio: 1800, stock_actual: 40,  stock_minimo: 12, fecha_vencimiento: fechaRelativa(120), id_categoria: 2, activo: true },
      { id_producto: 4,  codigo_barra: '7790002002', nombre: 'Agua Mineral 500ml',  descripcion: 'Sin gas',                  precio: 1100, stock_actual: 60,  stock_minimo: 12, fecha_vencimiento: fechaRelativa(300), id_categoria: 2, activo: true },
      { id_producto: 5,  codigo_barra: '7790003001', nombre: 'Papas Fritas 100g',   descripcion: 'Bolsa clasica',            precio: 2500, stock_actual: 4,   stock_minimo: 10, fecha_vencimiento: fechaRelativa(90),  id_categoria: 3, activo: true },
      { id_producto: 6,  codigo_barra: '7790003002', nombre: 'Galletitas Dulces',   descripcion: 'Paquete x 3',              precio: 1900, stock_actual: 2,   stock_minimo: 8,  fecha_vencimiento: fechaRelativa(60),  id_categoria: 3, activo: true },
      { id_producto: 7,  codigo_barra: '7790001003', nombre: 'Alfajor Triple',      descripcion: 'Alfajor de dulce de leche',precio: 1500, stock_actual: 25,  stock_minimo: 5,  fecha_vencimiento: fechaRelativa(10),  id_categoria: 1, activo: true },
      { id_producto: 8,  codigo_barra: '7790002003', nombre: 'Jugo Naranja 1L',     descripcion: 'Jugo exprimido',           precio: 2200, stock_actual: 18,  stock_minimo: 6,  fecha_vencimiento: fechaRelativa(20),  id_categoria: 2, activo: true },
      { id_producto: 9,  codigo_barra: '7790005001', nombre: 'Yogur Bebible 200ml', descripcion: 'Producto refrigerado',     precio: 1600, stock_actual: 12,  stock_minimo: 5,  fecha_vencimiento: fechaRelativa(-5),  id_categoria: 5, activo: true },
      { id_producto: 10, codigo_barra: '7790004001', nombre: 'Cigarrillos Box 20',  descripcion: 'Paquete x 20',             precio: 4500, stock_actual: 0,   stock_minimo: 5,  fecha_vencimiento: fechaRelativa(400), id_categoria: 4, activo: true },
      { id_producto: 11, codigo_barra: null,         nombre: 'Caramelo Suelto',     descripcion: 'Venta por unidad',         precio: 150,  stock_actual: 200, stock_minimo: 50, fecha_vencimiento: fechaRelativa(365), id_categoria: 1, activo: true },
      { id_producto: 12, codigo_barra: '7790005002', nombre: 'Pan Lactal',          descripcion: 'Paquete grande',           precio: 3200, stock_actual: 10,  stock_minimo: 10, fecha_vencimiento: fechaRelativa(15),  id_categoria: 5, activo: true },
    ],

    // Ventas distribuidas en el tiempo para validar reportes por dia,
    // semana y mes (RF-09) y el ranking de mas vendidos (RF-10).
    ventas: [
      { id_venta: 1, fecha_hora: fechaHoraRelativa(0, 9),    total: 6400, id_usuario: 1, id_medio_pago: 1, estado: 'registrada' },
      { id_venta: 2, fecha_hora: fechaHoraRelativa(0, 11),   total: 3600, id_usuario: 2, id_medio_pago: 2, estado: 'registrada' },
      { id_venta: 3, fecha_hora: fechaHoraRelativa(0, 15),   total: 4500, id_usuario: 2, id_medio_pago: 1, estado: 'registrada' },
      { id_venta: 4, fecha_hora: fechaHoraRelativa(-3, 10),  total: 9100, id_usuario: 1, id_medio_pago: 3, estado: 'registrada' },
      { id_venta: 5, fecha_hora: fechaHoraRelativa(-6, 17),  total: 5900, id_usuario: 1, id_medio_pago: 4, estado: 'registrada' },
      { id_venta: 6, fecha_hora: fechaHoraRelativa(-20, 12), total: 7400, id_usuario: 1, id_medio_pago: 1, estado: 'registrada' },
      { id_venta: 7, fecha_hora: fechaHoraRelativa(-2, 13),  total: 2400, id_usuario: 2, id_medio_pago: 1, estado: 'anulada' },
    ],

    detalle_venta: [
      { id_detalle: 1,  id_venta: 1, id_producto: 1,  cantidad: 3, precio_unitario: 1200, subtotal: 3600 },
      { id_detalle: 2,  id_venta: 1, id_producto: 3,  cantidad: 1, precio_unitario: 1800, subtotal: 1800 },
      { id_detalle: 3,  id_venta: 1, id_producto: 2,  cantidad: 1, precio_unitario: 700,  subtotal: 700 },
      { id_detalle: 4,  id_venta: 1, id_producto: 11, cantidad: 2, precio_unitario: 150,  subtotal: 300 },
      { id_detalle: 5,  id_venta: 2, id_producto: 3,  cantidad: 2, precio_unitario: 1800, subtotal: 3600 },
      { id_detalle: 6,  id_venta: 3, id_producto: 1,  cantidad: 1, precio_unitario: 1200, subtotal: 1200 },
      { id_detalle: 7,  id_venta: 3, id_producto: 4,  cantidad: 1, precio_unitario: 1100, subtotal: 1100 },
      { id_detalle: 8,  id_venta: 3, id_producto: 8,  cantidad: 1, precio_unitario: 2200, subtotal: 2200 },
      { id_detalle: 9,  id_venta: 4, id_producto: 1,  cantidad: 5, precio_unitario: 1200, subtotal: 6000 },
      { id_detalle: 10, id_venta: 4, id_producto: 3,  cantidad: 1, precio_unitario: 1800, subtotal: 1800 },
      { id_detalle: 11, id_venta: 4, id_producto: 2,  cantidad: 1, precio_unitario: 700,  subtotal: 700 },
      { id_detalle: 12, id_venta: 4, id_producto: 11, cantidad: 4, precio_unitario: 150,  subtotal: 600 },
      { id_detalle: 13, id_venta: 5, id_producto: 4,  cantidad: 2, precio_unitario: 1100, subtotal: 2200 },
      { id_detalle: 14, id_venta: 5, id_producto: 7,  cantidad: 1, precio_unitario: 1500, subtotal: 1500 },
      { id_detalle: 15, id_venta: 5, id_producto: 8,  cantidad: 1, precio_unitario: 2200, subtotal: 2200 },
      { id_detalle: 16, id_venta: 6, id_producto: 1,  cantidad: 2, precio_unitario: 1200, subtotal: 2400 },
      { id_detalle: 17, id_venta: 6, id_producto: 5,  cantidad: 2, precio_unitario: 2500, subtotal: 5000 },
      { id_detalle: 18, id_venta: 7, id_producto: 1,  cantidad: 2, precio_unitario: 1200, subtotal: 2400 },
    ],

    movimientos_stock: [
      { id_movimiento: 1, id_producto: 1, tipo: 'entrada', cantidad: 60, motivo: 'Carga inicial de inventario', fecha_hora: fechaHoraRelativa(-30, 9), id_usuario: 1 },
      { id_movimiento: 2, id_producto: 3, tipo: 'entrada', cantidad: 50, motivo: 'Carga inicial de inventario', fecha_hora: fechaHoraRelativa(-30, 9), id_usuario: 1 },
      { id_movimiento: 3, id_producto: 5, tipo: 'entrada', cantidad: 20, motivo: 'Carga inicial de inventario', fecha_hora: fechaHoraRelativa(-30, 9), id_usuario: 1 },
      { id_movimiento: 4, id_producto: 1, tipo: 'venta',   cantidad: 3,  motivo: 'Venta #1',                    fecha_hora: fechaHoraRelativa(0, 9),   id_usuario: 1 },
      { id_movimiento: 5, id_producto: 5, tipo: 'baja',    cantidad: 6,  motivo: 'Baja por producto danado',    fecha_hora: fechaHoraRelativa(-2, 10), id_usuario: 1 },
    ],

    bajas_producto: [
      { id_baja: 1, id_producto: 5, cantidad: 6, motivo: 'danado',  fecha_hora: fechaHoraRelativa(-2, 10), id_usuario: 1 },
      { id_baja: 2, id_producto: 9, cantidad: 3, motivo: 'vencido', fecha_hora: fechaHoraRelativa(-1, 10), id_usuario: 1 },
    ],
  };
}
