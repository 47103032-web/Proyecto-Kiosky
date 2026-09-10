/**
 * Pruebas de integracion del CU-03 (Productos vencidos o danados)
 * y de las alertas de inventario del RF-13.
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { reiniciarDatosEnMemoria } from '../src/repositories/memoryRepositories.js';
import { getRepositorios } from '../src/repositories/index.js';
import * as StockService from '../src/services/StockService.js';

const YOGUR = 9;      // stock 12, vencido
const PAN_LACTAL = 12; // stock 10, minimo 10 -> valor limite
const PROPIETARIO = 1;

const stockDe = async (id) => (await getRepositorios().productos.buscarPorId(id)).stockActual;

beforeEach(() => reiniciarDatosEnMemoria());

describe('CU-03 - Registrar baja por vencimiento o dano', () => {
  test('CP-CU03-01: la baja descuenta el stock (RF-11, RF-12)', async () => {
    assert.equal(await stockDe(YOGUR), 12);

    const baja = await StockService.registrarBaja({
      id_producto: YOGUR,
      cantidad: 5,
      motivo: 'vencido',
      id_usuario: PROPIETARIO,
    });

    assert.equal(baja.cantidad, 5);
    assert.equal(await stockDe(YOGUR), 7);
  });

  test('CP-CU03-03: se puede dar de baja todo el stock (valor limite)', async () => {
    await StockService.registrarBaja({
      id_producto: YOGUR,
      cantidad: 12,
      motivo: 'danado',
      id_usuario: PROPIETARIO,
    });
    assert.equal(await stockDe(YOGUR), 0);
  });

  test('CP-RF12-02: la baja deja un movimiento de stock de tipo baja', async () => {
    await StockService.registrarBaja({
      id_producto: YOGUR,
      cantidad: 2,
      motivo: 'vencido',
      id_usuario: PROPIETARIO,
    });

    const movimientos = await StockService.listarMovimientos({ idProducto: YOGUR });
    assert.ok(movimientos.some((m) => m.tipo === 'baja'));
  });

  test('CP-CU03-05 (FA-1): una cantidad mayor al stock no modifica el inventario', async () => {
    await assert.rejects(
      StockService.registrarBaja({
        id_producto: YOGUR,
        cantidad: 999,
        motivo: 'vencido',
        id_usuario: PROPIETARIO,
      }),
      (error) => {
        assert.equal(error.codigo, 'STOCK_INSUFICIENTE');
        assert.equal(error.detalles.disponible, 12);
        return true;
      }
    );

    assert.equal(await stockDe(YOGUR), 12, 'el stock no debe cambiar');
  });

  test('CP-CU03-06: la cantidad cero se rechaza', async () => {
    await assert.rejects(
      StockService.registrarBaja({
        id_producto: YOGUR,
        cantidad: 0,
        motivo: 'vencido',
        id_usuario: PROPIETARIO,
      }),
      (error) => error.codigo === 'VALIDACION'
    );
  });

  test('CP-CU03-07: sin producto seleccionado se rechaza', async () => {
    await assert.rejects(
      StockService.registrarBaja({
        id_producto: null,
        cantidad: 1,
        motivo: 'vencido',
        id_usuario: PROPIETARIO,
      }),
      (error) => error.codigo === 'VALIDACION'
    );
  });

  test('un motivo fuera de los admitidos se rechaza', async () => {
    await assert.rejects(
      StockService.registrarBaja({
        id_producto: YOGUR,
        cantidad: 1,
        motivo: 'porque si',
        id_usuario: PROPIETARIO,
      }),
      (error) => error.codigo === 'VALIDACION'
    );
  });
});

describe('RF-13 - Alertas de inventario', () => {
  test('CP-RF13-01: el juego de datos tiene 4 productos con stock bajo', async () => {
    const bajos = await StockService.productosBajoStock();
    assert.equal(bajos.length, 4);
  });

  test('CP-RF13-02: Pan Lactal aparece con stock igual al minimo (valor limite)', async () => {
    const bajos = await StockService.productosBajoStock();
    const pan = bajos.find((p) => p.id === PAN_LACTAL);
    assert.ok(pan, 'Pan Lactal deberia figurar en la alerta');
    assert.equal(pan.stockActual, pan.stockMinimo);
  });

  test('el juego de datos tiene 3 productos proximos a vencer', async () => {
    const proximos = await StockService.productosProximosAVencer(30);
    assert.equal(proximos.length, 3);
  });

  test('el juego de datos tiene 1 producto vencido', async () => {
    const vencidos = await StockService.productosVencidos();
    assert.equal(vencidos.length, 1);
    assert.equal(vencidos[0].id, YOGUR);
  });

  test('un producto no puede estar vencido y proximo a vencer a la vez', async () => {
    const proximos = await StockService.productosProximosAVencer(30);
    const vencidos = await StockService.productosVencidos();
    const idsVencidos = new Set(vencidos.map((p) => p.id));
    assert.ok(proximos.every((p) => !idsVencidos.has(p.id)));
  });

  test('CP-RF13-04: al dar de baja unidades el producto entra en la alerta', async () => {
    const antes = (await StockService.productosBajoStock()).length;

    // El yogur tiene stock 12 y minimo 5: se lo baja hasta cruzar el minimo.
    await StockService.registrarBaja({
      id_producto: YOGUR,
      cantidad: 8,
      motivo: 'vencido',
      id_usuario: PROPIETARIO,
    });

    const despues = await StockService.productosBajoStock();
    assert.equal(despues.length, antes + 1);
    assert.ok(despues.some((p) => p.id === YOGUR));
  });
});
