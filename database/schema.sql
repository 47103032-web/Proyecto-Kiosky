-- =====================================================================
-- KIOSKY - Sistema Web para la Gestion Integral de Kioscos
-- Script de creacion de base de datos (MySQL 8.0)
--
-- Fuente: Entregable N2 - PP1, punto 8 (Modelo de datos), punto 10
--         (Relaciones principales) y punto 11 (Diccionario de datos).
-- =====================================================================

DROP DATABASE IF EXISTS kiosky;
CREATE DATABASE kiosky
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE kiosky;

-- ---------------------------------------------------------------------
-- 11.1 usuarios
-- Registra propietarios y empleados autorizados para usar el sistema.
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id_usuario    INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('propietario','empleado') NOT NULL DEFAULT 'empleado',
  activo        BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11.2 categorias
-- Agrupa productos por rubro o tipo de mercaderia.
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(80) NOT NULL UNIQUE,
  descripcion  VARCHAR(255) NULL,
  activo       BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11.3 productos
-- Almacena datos comerciales y de inventario de cada articulo.
-- codigo_barra es UNIQUE "cuando se informe" (regla de integridad 12):
-- MySQL admite multiples NULL en un indice UNIQUE, por lo que un producto
-- sin codigo de barras no colisiona con otro en la misma condicion.
-- ---------------------------------------------------------------------
CREATE TABLE productos (
  id_producto       INT AUTO_INCREMENT PRIMARY KEY,
  codigo_barra      VARCHAR(50) NULL UNIQUE,
  nombre            VARCHAR(120) NOT NULL,
  descripcion       VARCHAR(255) NULL,
  precio            DECIMAL(10,2) NOT NULL,
  stock_actual      INT NOT NULL DEFAULT 0,
  stock_minimo      INT NOT NULL DEFAULT 0,
  fecha_vencimiento DATE NULL,
  id_categoria      INT NULL,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_producto_categoria
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
    ON DELETE SET NULL,
  CONSTRAINT chk_producto_precio      CHECK (precio >= 0),
  CONSTRAINT chk_producto_stock       CHECK (stock_actual >= 0),
  CONSTRAINT chk_producto_stock_min   CHECK (stock_minimo >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11.4 medios_pago
-- Define formas de cobro: efectivo, tarjeta, transferencia u otras.
-- ---------------------------------------------------------------------
CREATE TABLE medios_pago (
  id_medio_pago INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(50) NOT NULL UNIQUE,
  activo        BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11.5 ventas
-- Registra la cabecera de cada operacion de venta.
-- ---------------------------------------------------------------------
CREATE TABLE ventas (
  id_venta      INT AUTO_INCREMENT PRIMARY KEY,
  fecha_hora    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  id_usuario    INT NOT NULL,
  id_medio_pago INT NOT NULL,
  estado        ENUM('registrada','anulada') NOT NULL DEFAULT 'registrada',
  CONSTRAINT fk_venta_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_venta_medio_pago
    FOREIGN KEY (id_medio_pago) REFERENCES medios_pago(id_medio_pago),
  CONSTRAINT chk_venta_total CHECK (total >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11.6 detalle_venta
-- Registra los productos, cantidades y subtotales de cada venta.
-- ---------------------------------------------------------------------
CREATE TABLE detalle_venta (
  id_detalle      INT AUTO_INCREMENT PRIMARY KEY,
  id_venta        INT NOT NULL,
  id_producto     INT NOT NULL,
  cantidad        INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_detalle_venta
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11.7 movimientos_stock
-- Mantiene trazabilidad de entradas, salidas y ajustes de stock.
-- ---------------------------------------------------------------------
CREATE TABLE movimientos_stock (
  id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
  id_producto   INT NOT NULL,
  tipo          ENUM('entrada','salida','ajuste','venta','baja') NOT NULL,
  cantidad      INT NOT NULL,
  motivo        VARCHAR(255) NULL,
  fecha_hora    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_usuario    INT NOT NULL,
  CONSTRAINT fk_movimiento_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
  CONSTRAINT fk_movimiento_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11.8 bajas_producto
-- Registra productos vencidos o danados descontados del inventario.
-- ---------------------------------------------------------------------
CREATE TABLE bajas_producto (
  id_baja     INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  cantidad    INT NOT NULL,
  motivo      ENUM('vencido','danado','otro') NOT NULL,
  fecha_hora  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_usuario  INT NOT NULL,
  CONSTRAINT fk_baja_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
  CONSTRAINT fk_baja_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  CONSTRAINT chk_baja_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Indices de apoyo
-- Mitigacion del riesgo R-02 (consultas de reportes lentas):
-- se indexan fecha de venta, producto en detalle y vencimientos.
-- ---------------------------------------------------------------------
CREATE INDEX idx_ventas_fecha           ON ventas (fecha_hora);
CREATE INDEX idx_ventas_estado_fecha    ON ventas (estado, fecha_hora);
CREATE INDEX idx_detalle_producto       ON detalle_venta (id_producto);
CREATE INDEX idx_productos_nombre       ON productos (nombre);
CREATE INDEX idx_productos_vencimiento  ON productos (fecha_vencimiento);
CREATE INDEX idx_movimientos_producto   ON movimientos_stock (id_producto, fecha_hora);
