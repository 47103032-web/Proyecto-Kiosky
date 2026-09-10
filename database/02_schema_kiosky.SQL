-- Stored Procedure y Transacción para Bajas de Productos
-- Autor: Leonardo Vertali (Ticket KIO-04)

DELIMITER //

CREATE PROCEDURE sp_registrar_baja_producto(
    IN p_id_producto INT,
    IN p_cantidad INT,
    IN p_motivo VARCHAR(20),
    IN p_id_usuario INT
)
BEGIN
    DECLARE v_stock_actual INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error al registrar la baja de producto.';
    END;

    START TRANSACTION;

    SELECT stock_actual INTO v_stock_actual
    FROM productos
    WHERE id_producto = p_id_producto
    FOR UPDATE;

    IF v_stock_actual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no existe.';
    ELSEIF v_stock_actual < p_cantidad THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para dar de baja la cantidad solicitada.';
    ELSE
        UPDATE productos
        SET stock_actual = stock_actual - p_cantidad
        WHERE id_producto = p_id_producto;

        INSERT INTO bajas_producto (id_producto, cantidad, motivo, fecha_hora, id_usuario)
        VALUES (p_id_producto, p_cantidad, p_motivo, NOW(), p_id_usuario);

        INSERT INTO movimientos_stock (id_producto, tipo, cantidad, motivo, fecha_hora, id_usuario)
        VALUES (p_id_producto, 'baja', p_cantidad, CONCAT('Baja por: ', p_motivo), NOW(), p_id_usuario);

        COMMIT;
    END IF;
END //

DELIMITER ;