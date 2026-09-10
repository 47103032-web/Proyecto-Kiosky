/**
 * Pruebas unitarias de las clases de dominio (Entregable N2, punto 13).
 *
 * Cubren los calculos y las reglas que no dependen de la base de datos.
 * Cada prueba cita el caso documentado en docs/testing/ que verifica.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { Producto } from '../src/models/Producto.js';
import { DetalleVenta, redondear } from '../src/models/DetalleVenta.js';
import { Venta } from '../src/models/Venta.js';
import { BajaProducto } from '../src/models/BajaProducto.js';

/** Devuelve una fecha ISO desplazada n dias desde hoy. */
function fecha(dias) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dias);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const productoBase = (extra = {}) =>
  new Producto({
    id_producto: 99,
    nombre: 'Producto de prueba',
    precio: 1000,
    stock_actual: 20,
    stock_minimo: 5,
    ...extra,
  });

describe('Producto - alerta de bajo stock (RF-13)', () => {
  test('CP-RF13-02: stock igual al minimo SI dispara la alerta (valor limite)', () => {
    // Caso "Pan Lactal": stock 10, minimo 10. La condicion incluye la igualdad.
    const p = productoBase({ stock_actual: 10, stock_minimo: 10 });
    assert.equal(p.estaBajoStock(), true);
  });

  test('stock por encima del minimo no dispara la alerta', () => {
    assert.equal(productoBase({ stock_actual: 11, stock_minimo: 10 }).estaBajoStock(), false);
  });

  test('CP-RF13-03: stock cero dispara la alerta', () => {
    assert.equal(productoBase({ stock_actual: 0, stock_minimo: 5 }).estaBajoStock(), true);
  });
});

describe('Producto - control de vencimientos (CU-03)', () => {
  test('una fecha pasada se considera vencida', () => {
    assert.equal(productoBase({ fecha_vencimiento: fecha(-1) }).estaVencido(), true);
  });

  test('la fecha de hoy todavia no esta vencida (valor limite)', () => {
    assert.equal(productoBase({ fecha_vencimiento: fecha(0) }).estaVencido(), false);
  });

  test('un producto sin fecha nunca esta vencido', () => {
    assert.equal(productoBase({ fecha_vencimiento: null }).estaVencido(), false);
  });

  test('vence dentro de la ventana de 30 dias', () => {
    assert.equal(productoBase({ fecha_vencimiento: fecha(10) }).estaProximoAVencer(30), true);
  });

  test('el dia 30 exacto entra en la ventana (valor limite)', () => {
    assert.equal(productoBase({ fecha_vencimiento: fecha(30) }).estaProximoAVencer(30), true);
  });

  test('el dia 31 ya queda fuera de la ventana', () => {
    assert.equal(productoBase({ fecha_vencimiento: fecha(31) }).estaProximoAVencer(30), false);
  });

  test('un producto ya vencido no figura como proximo a vencer', () => {
    assert.equal(productoBase({ fecha_vencimiento: fecha(-5) }).estaProximoAVencer(30), false);
  });
});

describe('Producto - actualizacion de stock (RF-03)', () => {
  test('un delta negativo descuenta unidades', () => {
    const p = productoBase({ stock_actual: 50 });
    p.actualizarStock(-2);
    assert.equal(p.stockActual, 48);
  });

  test('permite descontar exactamente todo el stock (valor limite)', () => {
    const p = productoBase({ stock_actual: 2 });
    p.actualizarStock(-2);
    assert.equal(p.stockActual, 0);
  });

  test('no permite dejar el stock por debajo de cero', () => {
    const p = productoBase({ stock_actual: 2 });
    assert.throws(() => p.actualizarStock(-3), /stock/i);
    assert.equal(p.stockActual, 2, 'el stock no debe cambiar si la operacion falla');
  });
});

describe('DetalleVenta y Venta - calculos (regla de integridad 12)', () => {
  test('subtotal = cantidad x precio unitario', () => {
    const d = new DetalleVenta({ id_producto: 1, cantidad: 3, precio_unitario: 1200 });
    assert.equal(d.subtotal, 3600);
  });

  test('el subtotal se redondea a dos decimales', () => {
    const d = new DetalleVenta({ id_producto: 1, cantidad: 3, precio_unitario: 0.1 });
    assert.equal(d.subtotal, 0.3);
  });

  test('redondear corrige el error de coma flotante', () => {
    assert.equal(redondear(0.1 + 0.2), 0.3);
  });

  test('CP-RF02-04: el total es la suma de los subtotales', () => {
    const v = new Venta({
      id_usuario: 1,
      id_medio_pago: 1,
      detalles: [
        { id_producto: 1, cantidad: 2, precio_unitario: 1200 },
        { id_producto: 3, cantidad: 1, precio_unitario: 1800 },
      ],
    });
    assert.equal(v.total, 4200);
  });

  test('agregar un detalle recalcula el total', () => {
    const v = new Venta({ id_usuario: 1, id_medio_pago: 1, detalles: [] });
    v.agregarDetalle({ id_producto: 1, cantidad: 1, precio_unitario: 1000 });
    v.agregarDetalle({ id_producto: 2, cantidad: 2, precio_unitario: 500 });
    assert.equal(v.total, 2000);
  });

  test('una venta sin detalles no se puede confirmar', () => {
    const v = new Venta({ id_usuario: 1, id_medio_pago: 1, detalles: [] });
    assert.throws(() => v.confirmar(), /al menos un producto/i);
  });
});

describe('BajaProducto - validacion de cantidad (CU-03 FA-1)', () => {
  const baja = (cantidad) =>
    new BajaProducto({ id_producto: 9, cantidad, motivo: 'vencido', id_usuario: 1 });

  test('una cantidad menor al stock es valida', () => {
    assert.equal(baja(5).validarCantidad(12), null);
  });

  test('dar de baja todo el stock es valido (valor limite)', () => {
    assert.equal(baja(12).validarCantidad(12), null);
  });

  test('CP-CU03-05: una cantidad mayor al stock devuelve error', () => {
    assert.match(baja(999).validarCantidad(12), /supera el stock/i);
  });

  test('CP-CU03-06: la cantidad cero devuelve error', () => {
    assert.match(baja(0).validarCantidad(12), /mayor a cero/i);
  });

  test('una cantidad negativa devuelve error', () => {
    assert.match(baja(-3).validarCantidad(12), /mayor a cero/i);
  });
});
