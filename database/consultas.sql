-- =====================================================================
-- KIOSKY - Consultas de referencia
--
-- Version SQL de las consultas que ejecuta la capa de repositorios.
-- Sirven como documentacion y para verificar resultados a mano durante
-- las pruebas funcionales.
-- =====================================================================
USE kiosky;

-- ---------------------------------------------------------------------
-- RF-07: buscar productos por nombre o codigo de barras
-- ---------------------------------------------------------------------
SELECT p.*, c.nombre AS categoria
FROM productos p
LEFT JOIN categorias c ON c.id_categoria = p.id_categoria
WHERE p.activo = TRUE
  AND (p.nombre LIKE '%choco%' OR p.codigo_barra LIKE '%choco%')
ORDER BY p.nombre;

-- ---------------------------------------------------------------------
-- RF-13: productos con stock bajo (en o por debajo del minimo)
-- ---------------------------------------------------------------------
SELECT nombre, stock_actual, stock_minimo
FROM productos
WHERE activo = TRUE
  AND stock_actual <= stock_minimo
ORDER BY stock_actual ASC;

-- ---------------------------------------------------------------------
-- Productos proximos a vencer (30 dias) y ya vencidos
-- ---------------------------------------------------------------------
SELECT nombre, fecha_vencimiento,
       DATEDIFF(fecha_vencimiento, CURDATE()) AS dias_restantes
FROM productos
WHERE activo = TRUE
  AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY fecha_vencimiento;

SELECT nombre, fecha_vencimiento, stock_actual
FROM productos
WHERE activo = TRUE
  AND fecha_vencimiento < CURDATE()
ORDER BY fecha_vencimiento;

-- ---------------------------------------------------------------------
-- RF-09: reporte de ventas de un periodo
-- Solo se consideran las ventas en estado "registrada".
-- ---------------------------------------------------------------------
SELECT COALESCE(SUM(total), 0) AS total_vendido,
       COUNT(*)                AS cantidad_ventas,
       COALESCE(AVG(total), 0) AS ticket_promedio
FROM ventas
WHERE estado = 'registrada'
  AND fecha_hora BETWEEN '2026-09-01 00:00:00' AND '2026-09-01 23:59:59';

-- Desglose por medio de pago
SELECT mp.nombre AS medio_pago,
       COUNT(*)  AS cantidad,
       SUM(v.total) AS total
FROM ventas v
JOIN medios_pago mp ON mp.id_medio_pago = v.id_medio_pago
WHERE v.estado = 'registrada'
  AND v.fecha_hora BETWEEN '2026-09-01 00:00:00' AND '2026-09-01 23:59:59'
GROUP BY mp.id_medio_pago, mp.nombre
ORDER BY total DESC;

-- ---------------------------------------------------------------------
-- RF-10: ranking de productos mas vendidos en un rango de fechas
-- ---------------------------------------------------------------------
SELECT p.id_producto,
       p.nombre,
       SUM(d.cantidad) AS unidades,
       SUM(d.subtotal) AS total_facturado
FROM detalle_venta d
JOIN ventas v    ON v.id_venta = d.id_venta
JOIN productos p ON p.id_producto = d.id_producto
WHERE v.estado = 'registrada'
  AND v.fecha_hora BETWEEN '2026-08-01 00:00:00' AND '2026-09-01 23:59:59'
GROUP BY p.id_producto, p.nombre
ORDER BY unidades DESC, total_facturado DESC
LIMIT 10;

-- ---------------------------------------------------------------------
-- RF-11 y RF-12: registrar una baja y descontar el stock
-- Se ejecuta como transaccion para que ambas cosas ocurran juntas.
-- ---------------------------------------------------------------------
START TRANSACTION;

  -- El FOR UPDATE bloquea la fila hasta el commit y evita que dos
  -- operaciones simultaneas descuenten sobre el mismo stock (riesgo R-01).
  SELECT stock_actual FROM productos WHERE id_producto = 9 FOR UPDATE;

  UPDATE productos
     SET stock_actual = stock_actual - 3
   WHERE id_producto = 9
     AND stock_actual >= 3;

  INSERT INTO bajas_producto (id_producto, cantidad, motivo, fecha_hora, id_usuario)
  VALUES (9, 3, 'vencido', NOW(), 1);

  INSERT INTO movimientos_stock (id_producto, tipo, cantidad, motivo, id_usuario)
  VALUES (9, 'baja', 3, 'Baja por producto vencido', 1);

COMMIT;

-- ---------------------------------------------------------------------
-- RF-14: historial de ventas con su detalle
-- ---------------------------------------------------------------------
SELECT v.id_venta, v.fecha_hora, v.total, v.estado,
       u.nombre  AS usuario,
       mp.nombre AS medio_pago
FROM ventas v
JOIN usuarios u     ON u.id_usuario = v.id_usuario
JOIN medios_pago mp ON mp.id_medio_pago = v.id_medio_pago
ORDER BY v.fecha_hora DESC;

SELECT d.id_venta, p.nombre, d.cantidad, d.precio_unitario, d.subtotal
FROM detalle_venta d
JOIN productos p ON p.id_producto = d.id_producto
WHERE d.id_venta = 1
ORDER BY d.id_detalle;

-- ---------------------------------------------------------------------
-- Verificaciones de integridad (punto 12 del Entregable N2)
-- Ambas consultas deben devolver 0 filas.
-- ---------------------------------------------------------------------

-- El total de cada venta debe coincidir con la suma de sus subtotales.
SELECT v.id_venta, v.total, SUM(d.subtotal) AS suma_detalles
FROM ventas v
JOIN detalle_venta d ON d.id_venta = v.id_venta
GROUP BY v.id_venta, v.total
HAVING v.total <> SUM(d.subtotal);

-- Ninguna venta puede quedar sin detalle.
SELECT v.id_venta
FROM ventas v
LEFT JOIN detalle_venta d ON d.id_venta = v.id_venta
WHERE d.id_detalle IS NULL;
