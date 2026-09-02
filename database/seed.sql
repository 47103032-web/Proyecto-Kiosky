-- =====================================================================
-- KIOSKY - Datos de prueba (juego de datos base para testing)
--
-- Requiere una base recien creada por schema.sql. Para reiniciar el
-- juego de datos se ejecutan ambos scripts en orden:
--     mysql -u root -p < schema.sql
--     mysql -u root -p < seed.sql
--
-- Las fechas de vencimiento se calculan con CURDATE() + INTERVAL para que
-- el juego de datos siga siendo valido cualquier dia que se ejecute:
-- siempre habra productos vencidos, proximos a vencer y vigentes.
--
-- Credenciales de acceso:
--   propietario@kiosky.com / Kiosky2026    (rol propietario)
--   empleado@kiosky.com    / Empleado2026  (rol empleado)
-- =====================================================================
USE kiosky;

-- --------------------------- usuarios --------------------------------
INSERT INTO usuarios (id_usuario, nombre, email, password_hash, rol, activo) VALUES
  (1, 'Aaron Brumat',       'propietario@kiosky.com', '$2a$10$YG0RVb0sv9vuOSzvaw1tZeWezqZm3h7I9Tc1y0MIFPTCDPoHvP5LC', 'propietario', TRUE),
  (2, 'Empleado Mostrador', 'empleado@kiosky.com',    '$2a$10$oLGzy7hDl2YTAeVosUdJle8MwVqHTVS8pxXFeQEEZCTYxPyzRF5fC', 'empleado',    TRUE),
  (3, 'Usuario Inactivo',   'inactivo@kiosky.com',    '$2a$10$oLGzy7hDl2YTAeVosUdJle8MwVqHTVS8pxXFeQEEZCTYxPyzRF5fC', 'empleado',    FALSE);

-- -------------------------- categorias -------------------------------
INSERT INTO categorias (id_categoria, nombre, descripcion, activo) VALUES
  (1, 'Golosinas',   'Caramelos, chocolates y chicles',  TRUE),
  (2, 'Bebidas',     'Gaseosas, aguas y jugos',          TRUE),
  (3, 'Snacks',      'Papas fritas, palitos y galletas', TRUE),
  (4, 'Cigarrillos', 'Productos de tabaco',              TRUE),
  (5, 'Almacen',     'Articulos varios de almacen',      TRUE);

-- ------------------------- medios_pago -------------------------------
INSERT INTO medios_pago (id_medio_pago, nombre, activo) VALUES
  (1, 'Efectivo',      TRUE),
  (2, 'Debito',        TRUE),
  (3, 'Credito',       TRUE),
  (4, 'Transferencia', TRUE),
  (5, 'Cheque',        FALSE);

-- --------------------------- productos -------------------------------
-- Cobertura intencional para las pruebas:
--   * id 1..4  -> stock normal, vencimiento lejano
--   * id 5, 6  -> stock por debajo del minimo (alerta de bajo stock)
--   * id 7, 8  -> proximos a vencer (dentro de 30 dias)
--   * id 9     -> ya vencido
--   * id 10    -> stock 0 (caso negativo de venta)
--   * id 11    -> sin codigo de barras (codigo_barra NULL)
--   * id 12    -> stock exactamente igual al minimo (valor limite)
INSERT INTO productos
  (id_producto, codigo_barra, nombre, descripcion, precio, stock_actual, stock_minimo, fecha_vencimiento, id_categoria, activo) VALUES
  (1,  '7790001001', 'Chocolate Barra 30g', 'Chocolate con leche',           1200.00,  50, 10, DATE_ADD(CURDATE(), INTERVAL 180 DAY), 1, TRUE),
  (2,  '7790001002', 'Chicle Menta',        'Blister x10 unidades',           700.00,  80, 15, DATE_ADD(CURDATE(), INTERVAL 240 DAY), 1, TRUE),
  (3,  '7790002001', 'Gaseosa Cola 500ml',  'Botella descartable',           1800.00,  40, 12, DATE_ADD(CURDATE(), INTERVAL 120 DAY), 2, TRUE),
  (4,  '7790002002', 'Agua Mineral 500ml',  'Sin gas',                       1100.00,  60, 12, DATE_ADD(CURDATE(), INTERVAL 300 DAY), 2, TRUE),
  (5,  '7790003001', 'Papas Fritas 100g',   'Bolsa clasica',                 2500.00,   4, 10, DATE_ADD(CURDATE(), INTERVAL  90 DAY), 3, TRUE),
  (6,  '7790003002', 'Galletitas Dulces',   'Paquete x 3',                   1900.00,   2,  8, DATE_ADD(CURDATE(), INTERVAL  60 DAY), 3, TRUE),
  (7,  '7790001003', 'Alfajor Triple',      'Alfajor de dulce de leche',     1500.00,  25,  5, DATE_ADD(CURDATE(), INTERVAL  10 DAY), 1, TRUE),
  (8,  '7790002003', 'Jugo Naranja 1L',     'Jugo exprimido',                2200.00,  18,  6, DATE_ADD(CURDATE(), INTERVAL  20 DAY), 2, TRUE),
  (9,  '7790005001', 'Yogur Bebible 200ml', 'Producto refrigerado',          1600.00,  12,  5, DATE_SUB(CURDATE(), INTERVAL   5 DAY), 5, TRUE),
  (10, '7790004001', 'Cigarrillos Box 20',  'Paquete x 20',                  4500.00,   0,  5, DATE_ADD(CURDATE(), INTERVAL 400 DAY), 4, TRUE),
  (11, NULL,         'Caramelo Suelto',     'Venta por unidad, sin codigo',   150.00, 200, 50, DATE_ADD(CURDATE(), INTERVAL 365 DAY), 1, TRUE),
  (12, '7790005002', 'Pan Lactal',          'Paquete grande',                3200.00,  10, 10, DATE_ADD(CURDATE(), INTERVAL  15 DAY), 5, TRUE);

-- ----------------------------- ventas --------------------------------
-- Ventas distribuidas en el tiempo para validar reportes por dia, semana
-- y mes (RF-09) y el ranking de productos mas vendidos (RF-10).
-- El total de cada venta coincide con la suma de sus subtotales.
INSERT INTO ventas (id_venta, fecha_hora, total, id_usuario, id_medio_pago, estado) VALUES
  (1, DATE_ADD(CURDATE(), INTERVAL 9  HOUR),                            6400.00, 1, 1, 'registrada'),
  (2, DATE_ADD(CURDATE(), INTERVAL 11 HOUR),                            3600.00, 2, 2, 'registrada'),
  (3, DATE_ADD(CURDATE(), INTERVAL 15 HOUR),                            4500.00, 2, 1, 'registrada'),
  (4, DATE_ADD(DATE_SUB(CURDATE(), INTERVAL  3 DAY), INTERVAL 10 HOUR),  9100.00, 1, 3, 'registrada'),
  (5, DATE_ADD(DATE_SUB(CURDATE(), INTERVAL  6 DAY), INTERVAL 17 HOUR),  5900.00, 1, 4, 'registrada'),
  (6, DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 20 DAY), INTERVAL 12 HOUR),  7400.00, 1, 1, 'registrada'),
  (7, DATE_ADD(DATE_SUB(CURDATE(), INTERVAL  2 DAY), INTERVAL 13 HOUR),  2400.00, 2, 1, 'anulada');

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES
  (1,  1, 3, 1200.00, 3600.00),
  (1,  3, 1, 1800.00, 1800.00),
  (1,  2, 1,  700.00,  700.00),
  (1, 11, 2,  150.00,  300.00),
  (2,  3, 2, 1800.00, 3600.00),
  (3,  1, 1, 1200.00, 1200.00),
  (3,  4, 1, 1100.00, 1100.00),
  (3,  8, 1, 2200.00, 2200.00),
  (4,  1, 5, 1200.00, 6000.00),
  (4,  3, 1, 1800.00, 1800.00),
  (4,  2, 1,  700.00,  700.00),
  (4, 11, 4,  150.00,  600.00),
  (5,  4, 2, 1100.00, 2200.00),
  (5,  7, 1, 1500.00, 1500.00),
  (5,  8, 1, 2200.00, 2200.00),
  (6,  1, 2, 1200.00, 2400.00),
  (6,  5, 2, 2500.00, 5000.00),
  (7,  1, 2, 1200.00, 2400.00);

-- ---------------------- movimientos de stock -------------------------
INSERT INTO movimientos_stock (id_producto, tipo, cantidad, motivo, fecha_hora, id_usuario) VALUES
  (1, 'entrada', 60, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 30 DAY), 1),
  (3, 'entrada', 50, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 30 DAY), 1),
  (5, 'entrada', 20, 'Carga inicial de inventario', DATE_SUB(NOW(), INTERVAL 30 DAY), 1),
  (1, 'venta',    3, 'Venta #1',                    DATE_ADD(CURDATE(), INTERVAL 9 HOUR), 1),
  (5, 'baja',     6, 'Baja por producto danado',    DATE_SUB(NOW(), INTERVAL 2 DAY), 1);

-- ----------------------- bajas de producto ---------------------------
INSERT INTO bajas_producto (id_producto, cantidad, motivo, fecha_hora, id_usuario) VALUES
  (5, 6, 'danado',  DATE_SUB(NOW(), INTERVAL 2 DAY), 1),
  (9, 3, 'vencido', DATE_SUB(NOW(), INTERVAL 1 DAY), 1);
