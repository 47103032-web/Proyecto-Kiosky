/**
 * Pruebas de integracion del CU-01 (Registrar venta).
 *
 * Ejercitan VentaService contra el repositorio en memoria, que carga el
 * mismo juego de datos que database/seed.sql. Cada prueba cita el caso
 * documentado en docs/testing/ que verifica.
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { reiniciarDatosEnMemoria } from '../src/repositories/memoryRepositories.js';
import { getRepositorios } from '../src/repositories/index.js';
import * as VentaService from '../src/services/VentaService.js';

// Referencias del juego de datos (ver seccion 3 de la documentacion tecnica).
const CHOCOLATE = 1;   // precio 1200, stock 50
const GASEOSA   = 3;   // precio 1800, stock 40
const GALLETITAS = 6;  // precio 1900, stock 2  -> bajo stock
const CIGARRILLOS = 10; // stock 0
const EFECTIVO = 1;
const CHEQUE   = 5;    // medio de pago inactivo
const PROPIETARIO = 1;

const stockDe = async (id) => (await getRepositorios().productos.buscarPorId(id)).stockActual;

beforeEach(() => reiniciarDatosEnMemoria());

describe('CU-01 - Flujo principal', () => {
  test('CP-CU01-01: venta de un producto descuenta el stock (RF-02, RF-03)', async () => {
    assert.equal(await stockDe(CHOCOLATE), 50);

    const venta = await VentaService.registrarVenta({
      items: [{ id_producto: CHOCOLATE, cantidad: 2 }],
      id_medio_pago: EFECTIVO,
      id_usuario: PROPIETARIO,
    });

    assert.equal(venta.total, 2400);
    assert.equal(await stockDe(CHOCOLATE), 48);
  });

  test('CP-CU01-02: venta de varios productos suma los subtotales', async () => {
    const venta = await VentaService.registrarVenta({
      items: [
        { id_producto: CHOCOLATE, cantidad: 2 },
        { id_producto: GASEOSA, cantidad: 1 },
      ],
      id_medio_pago: EFECTIVO,
      id_usuario: PROPIETARIO,
    });

    assert.equal(venta.total, 4200);
    assert.equal(venta.detalles.length, 2);
    assert.equal(await stockDe(GASEOSA), 39);
  });

  test('CP-CU01-06: se puede vender exactamente todo el stock (valor limite)', async () => {
    await VentaService.registrarVenta({
      items: [{ id_producto: GALLETITAS, cantidad: 2 }],
      id_medio_pago: EFECTIVO,
      id_usuario: PROPIETARIO,
    });
    assert.equal(await stockDe(GALLETITAS), 0);
  });

  test('RF-03: la venta deja un movimiento de stock de tipo venta', async () => {
    await VentaService.registrarVenta({
      items: [{ id_producto: CHOCOLATE, cantidad: 1 }],
      id_medio_pago: EFECTIVO,
      id_usuario: PROPIETARIO,
    });

    const movimientos = await getRepositorios().movimientos.listar({ idProducto: CHOCOLATE });
    assert.ok(movimientos.some((m) => m.tipo === 'venta'));
  });
});

describe('CU-01 - Flujos alternativos', () => {
  test('CP-CU01-07 (FA-1): stock insuficiente rechaza la venta sin tocar el inventario', async () => {
    await assert.rejects(
      VentaService.registrarVenta({
        items: [{ id_producto: GALLETITAS, cantidad: 10 }],
        id_medio_pago: EFECTIVO,
        id_usuario: PROPIETARIO,
      }),
      (error) => {
        assert.equal(error.codigo, 'VALIDACION');
        assert.equal(error.detalles.stock[0].motivo, 'STOCK_INSUFICIENTE');
        assert.equal(error.detalles.stock[0].disponible, 2);
        return true;
      }
    );

    assert.equal(await stockDe(GALLETITAS), 2, 'el stock no debe cambiar');
  });

  test('CP-CU01-08: no se puede vender un producto con stock cero', async () => {
    await assert.rejects(
      VentaService.registrarVenta({
        items: [{ id_producto: CIGARRILLOS, cantidad: 1 }],
        id_medio_pago: EFECTIVO,
        id_usuario: PROPIETARIO,
      }),
      (error) => error.codigo === 'VALIDACION'
    );
  });

  test('CP-CU01-09 (FA-2): un producto inexistente rechaza la venta', async () => {
    await assert.rejects(
      VentaService.registrarVenta({
        items: [{ id_producto: 9999, cantidad: 1 }],
        id_medio_pago: EFECTIVO,
        id_usuario: PROPIETARIO,
      }),
      (error) => error.detalles.stock[0].motivo === 'PRODUCTO_INEXISTENTE'
    );
  });

  test('CP-CU01-10: una venta sin productos se rechaza (regla de integridad 12)', async () => {
    await assert.rejects(
      VentaService.registrarVenta({ items: [], id_medio_pago: EFECTIVO, id_usuario: PROPIETARIO }),
      (error) => error.codigo === 'VALIDACION'
    );
  });

  test('CP-CU01-11: la cantidad cero se rechaza', async () => {
    await assert.rejects(
      VentaService.registrarVenta({
        items: [{ id_producto: CHOCOLATE, cantidad: 0 }],
        id_medio_pago: EFECTIVO,
        id_usuario: PROPIETARIO,
      }),
      (error) => error.codigo === 'VALIDACION'
    );
  });

  test('CP-RF08-04: no se puede usar un medio de pago inactivo', async () => {
    await assert.rejects(
      VentaService.registrarVenta({
        items: [{ id_producto: CHOCOLATE, cantidad: 1 }],
        id_medio_pago: CHEQUE,
        id_usuario: PROPIETARIO,
      }),
      (error) => /no esta habilitado/i.test(error.message)
    );
  });

  test('un producto repetido en dos items se rechaza', async () => {
    await assert.rejects(
      VentaService.registrarVenta({
        items: [
          { id_producto: CHOCOLATE, cantidad: 1 },
          { id_producto: CHOCOLATE, cantidad: 2 },
        ],
        id_medio_pago: EFECTIVO,
        id_usuario: PROPIETARIO,
      }),
      (error) => error.codigo === 'VALIDACION'
    );
  });
});

describe('RF-14 - Historial y anulacion', () => {
  test('CP-RF03-05: anular una venta repone el stock', async () => {
    const venta = await VentaService.registrarVenta({
      items: [{ id_producto: CHOCOLATE, cantidad: 5 }],
      id_medio_pago: EFECTIVO,
      id_usuario: PROPIETARIO,
    });
    assert.equal(await stockDe(CHOCOLATE), 45);

    await VentaService.anularVenta(venta.id, PROPIETARIO);

    assert.equal(await stockDe(CHOCOLATE), 50, 'el stock debe volver al valor original');
    const anulada = await VentaService.obtenerVenta(venta.id);
    assert.equal(anulada.estado, 'anulada');
  });

  test('CP-RF14-05: una venta ya anulada no se puede anular de nuevo', async () => {
    const venta = await VentaService.registrarVenta({
      items: [{ id_producto: CHOCOLATE, cantidad: 1 }],
      id_medio_pago: EFECTIVO,
      id_usuario: PROPIETARIO,
    });
    await VentaService.anularVenta(venta.id, PROPIETARIO);

    await assert.rejects(
      VentaService.anularVenta(venta.id, PROPIETARIO),
      (error) => error.codigo === 'CONFLICTO'
    );
  });
});
