-- Vistas Analíticas e Índices de Optimización
-- Autor: Leonardo Vertali (Ticket KIO-05)

-- Índices de rendimiento
CREATE INDEX idx_ventas_fecha ON ventas(fecha_hora);
CREATE INDEX idx_detalle_producto ON detalle_venta(id_producto);
CREATE INDEX idx_productos_codigo ON productos(codigo_barra);

-- Vista: Reporte diario/mensual de ventas
CREATE OR REPLACE VIEW vw_reporte_ventas AS
SELECT 
    DATE(v.fecha_hora) AS fecha,
    COUNT(DISTINCT v.id_venta) AS total_operaciones,
    SUM(v.total) AS recaudacion_total,
    mp.nombre AS medio_pago
FROM ventas v
INNER JOIN medios_pago mp ON v.id_medio_pago = mp.id_medio_pago
WHERE v.estado = 'registrada'
GROUP BY DATE(v.fecha_hora), mp.nombre;

-- Vista: Ranking de productos más vendidos
CREATE OR REPLACE VIEW vw_productos_mas_vendidos AS
SELECT 
    p.id_producto,
    p.nombre AS producto,
    c.nombre AS categoria,
    SUM(dv.cantidad) AS total_unidades_vendidas,
    SUM(dv.subtotal) AS total_recaudado
FROM detalle_venta dv
INNER JOIN productos p ON dv.id_producto = p.id_producto
INNER JOIN categorias c ON p.id_categoria = c.id_categoria
INNER JOIN ventas v ON dv.id_venta = v.id_venta
WHERE v.estado = 'registrada'
GROUP BY p.id_producto, p.nombre, c.nombre
ORDER BY total_unidades_vendidas DESC;