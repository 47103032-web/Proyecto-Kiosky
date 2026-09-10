/**
 * Pruebas de integracion del CU-04 (Reportes de ventas) y del CU-05
 * (Productos mas vendidos).
 *
 * Verifican los valores de referencia documentados en la seccion 4.1 de
 * docs/testing/03-documentacion-tecnica-testing.md.
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { reiniciarDatosEnMemoria } from '../src/repositories/memoryRepositories.js';
import * as ReporteService from '../src/services/ReporteService.js';
import * as VentaService from '../src/services/VentaService.js';

const CHOCOLATE = 1;
const EFECTIVO = 1;
const PROPIETARIO = 1;

beforeEach(() => reiniciarDatosEnMemoria());

describe('CU-04 - Reportes por periodo (RF-09)', () => {
  test('CP-RF09-01: el reporte del dia coincide con el valor documentado', async () => {
    const r = await ReporteService.ventasPorPeriodo({ periodo: 'dia' });
    assert.equal(r.total_vendido, 14500);
    assert.equal(r.cantidad_ventas, 3);
    assert.equal(r.ticket_promedio, 4833.33);
  });

  test('CP-RF09-02: el reporte semanal coincide con el valor documentado', async () => {
    const r = await ReporteService.ventasPorPeriodo({ periodo: 'semana' });
    assert.equal(r.total_vendido, 29500);
    assert.equal(r.cantidad_ventas, 5);
  });

  test('CP-RF09-03: el reporte mensual coincide con el valor documentado', async () => {
    const r = await ReporteService.ventasPorPeriodo({ periodo: 'mes' });
    assert.equal(r.total_vendido, 36900);
    assert.equal(r.cantidad_ventas, 6);
  });

  test('los periodos son acumulativos: dia <= semana <= mes', async () => {
    const dia = await ReporteService.ventasPorPeriodo({ periodo: 'dia' });
    const semana = await ReporteService.ventasPorPeriodo({ periodo: 'semana' });
    const mes = await ReporteService.ventasPorPeriodo({ periodo: 'mes' });

    assert.ok(dia.total_vendido <= semana.total_vendido);
    assert.ok(semana.total_vendido <= mes.total_vendido);
  });

  test('CP-RF09-08: las ventas anuladas no suman al total', async () => {
    const antes = await ReporteService.ventasPorPeriodo({ periodo: 'dia' });

    const venta = await VentaService.registrarVenta({
      items: [{ id_producto: CHOCOLATE, cantidad: 1 }],
      id_medio_pago: EFECTIVO,
      id_usuario: PROPIETARIO,
    });
    const conVenta = await ReporteService.ventasPorPeriodo({ periodo: 'dia' });
    assert.equal(conVenta.total_vendido, antes.total_vendido + 1200);

    await VentaService.anularVenta(venta.id, PROPIETARIO);
    const anulada = await ReporteService.ventasPorPeriodo({ periodo: 'dia' });

    assert.equal(anulada.total_vendido, antes.total_vendido);
    assert.equal(anulada.cantidad_ventas, antes.cantidad_ventas);
  });

  test('el total del reporte es la suma de los subtotales por producto', async () => {
    const r = await ReporteService.ventasPorPeriodo({ periodo: 'mes' });
    const suma = r.productos.reduce((acc, p) => acc + p.total, 0);
    assert.equal(Math.round(suma * 100) / 100, r.total_vendido);
  });

  test('CP-CU04-08: un periodo sin ventas devuelve el resumen en cero', async () => {
    const r = await ReporteService.ventasPorPeriodo({ desde: '2020-01-01', hasta: '2020-01-31' });
    assert.equal(r.sin_datos, true);
    assert.equal(r.total_vendido, 0);
    assert.equal(r.cantidad_ventas, 0);
  });

  test('CP-RF09-07: un rango invertido se rechaza', async () => {
    await assert.rejects(
      ReporteService.ventasPorPeriodo({ desde: '2026-12-31', hasta: '2026-01-01' }),
      (error) => error.codigo === 'VALIDACION'
    );
  });

  test('una fecha con formato invalido se rechaza', async () => {
    await assert.rejects(
      ReporteService.ventasPorPeriodo({ desde: '31/12/2026' }),
      (error) => error.codigo === 'VALIDACION'
    );
  });

  test('un periodo inexistente se rechaza', async () => {
    await assert.rejects(
      ReporteService.ventasPorPeriodo({ periodo: 'trimestre' }),
      (error) => error.codigo === 'VALIDACION'
    );
  });
});

describe('CU-05 - Productos mas vendidos (RF-10)', () => {
  test('CP-RF10-01: el primer puesto del mes es el documentado', async () => {
    const r = await ReporteService.productosMasVendidos({ periodo: 'mes' });
    assert.equal(r.ranking[0].nombre, 'Chocolate Barra 30g');
    assert.equal(r.ranking[0].cantidad, 11);
    assert.equal(r.ranking[0].posicion, 1);
  });

  test('CP-RF10-02: el ranking esta ordenado de mayor a menor', async () => {
    const { ranking } = await ReporteService.productosMasVendidos({ periodo: 'mes' });
    for (let i = 1; i < ranking.length; i += 1) {
      assert.ok(
        ranking[i - 1].cantidad >= ranking[i].cantidad,
        `la posicion ${i + 1} tiene mas unidades que la ${i}`
      );
    }
  });

  test('el limite recorta la cantidad de filas', async () => {
    const r = await ReporteService.productosMasVendidos({ periodo: 'mes', limite: 3 });
    assert.equal(r.ranking.length, 3);
  });

  test('CP-RF10-04: el primer puesto coincide con el reporte de ventas', async () => {
    const reporte = await ReporteService.ventasPorPeriodo({ periodo: 'mes' });
    const ranking = await ReporteService.productosMasVendidos({ periodo: 'mes' });
    assert.equal(ranking.ranking[0].nombre, reporte.productos[0].nombre);
  });

  test('CP-RF10-05: un periodo sin ventas no genera estadisticas', async () => {
    const r = await ReporteService.productosMasVendidos({ desde: '2020-01-01', hasta: '2020-01-31' });
    assert.equal(r.sin_datos, true);
    assert.equal(r.ranking.length, 0);
  });
});
