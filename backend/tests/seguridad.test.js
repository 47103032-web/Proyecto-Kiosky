/**
 * Pruebas de la seguridad de la sesion (AUD-09, AUD-10 y AUD-11).
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { validarSecretoDeSesion } from '../src/config/env.js';
import {
  limitarIntentosDeIngreso,
  registrarFallo,
  limpiarIntentos,
  reiniciarIntentos,
} from '../src/middleware/limiteIntentos.js';
import { errorSesionVencida } from '../src/utils/errors.js';

const SECRETO_FUERTE = 'a3f9c1e7b5d28046a3f9c1e7b5d28046';

describe('AUD-09 - Secreto de sesion', () => {
  test('en desarrollo se permite el valor por defecto', () => {
    assert.doesNotThrow(() =>
      validarSecretoDeSesion('kiosky-secreto-de-desarrollo', 'development')
    );
  });

  test('en produccion se rechaza el secreto de ejemplo del repositorio', () => {
    assert.throws(
      () => validarSecretoDeSesion('kiosky-secreto-de-desarrollo', 'production'),
      /corto|relleno/i
    );
  });

  test('en produccion se rechaza si falta', () => {
    assert.throws(() => validarSecretoDeSesion(undefined, 'production'), /Falta/i);
  });

  test('en produccion se rechaza uno demasiado corto', () => {
    assert.throws(() => validarSecretoDeSesion('abc123', 'production'), /corto/i);
  });

  test('un relleno largo tambien se rechaza', () => {
    assert.throws(
      () => validarSecretoDeSesion('changeme', 'production'),
      /corto|relleno/i
    );
  });

  test('en produccion se acepta un secreto fuerte', () => {
    assert.equal(SECRETO_FUERTE.length, 32);
    assert.doesNotThrow(() => validarSecretoDeSesion(SECRETO_FUERTE, 'production'));
  });
});

describe('AUD-10 - Limite de intentos de ingreso', () => {
  const EMAIL = 'propietario@kiosky.com';

  /** Ejecuta el middleware y devuelve el error con el que llamo a siguiente. */
  function intentar(email = EMAIL) {
    let recibido = null;
    limitarIntentosDeIngreso({ body: { email } }, {}, (e) => {
      recibido = e ?? null;
    });
    return recibido;
  }

  beforeEach(() => reiniciarIntentos());

  test('los primeros cinco intentos pasan', () => {
    for (let i = 0; i < 5; i += 1) {
      assert.equal(intentar(), null, `el intento ${i + 1} no deberia bloquearse`);
      registrarFallo(EMAIL);
    }
  });

  test('CP-RF01-08: el sexto intento se bloquea con 429', () => {
    for (let i = 0; i < 5; i += 1) registrarFallo(EMAIL);

    const error = intentar();
    assert.ok(error, 'el sexto intento deberia bloquearse');
    assert.equal(error.statusCode, 429);
    assert.equal(error.codigo, 'DEMASIADOS_INTENTOS');
    assert.match(error.message, /intentar en \d+ minuto/i);
  });

  test('el bloqueo es por email: otro usuario no queda afectado', () => {
    for (let i = 0; i < 5; i += 1) registrarFallo(EMAIL);

    assert.ok(intentar(EMAIL), 'el email bloqueado sigue bloqueado');
    assert.equal(intentar('empleado@kiosky.com'), null);
  });

  test('un ingreso correcto libera la cuenta', () => {
    for (let i = 0; i < 5; i += 1) registrarFallo(EMAIL);
    assert.ok(intentar());

    limpiarIntentos(EMAIL);
    assert.equal(intentar(), null);
  });

  test('sin email el middleware no bloquea', () => {
    let recibido = null;
    limitarIntentosDeIngreso({ body: {} }, {}, (e) => {
      recibido = e ?? null;
    });
    assert.equal(recibido, null);
  });
});

describe('AUD-11 - Sesion vencida distinguible', () => {
  test('la sesion vencida lleva un codigo propio', () => {
    const error = errorSesionVencida();
    assert.equal(error.statusCode, 401);
    assert.equal(error.codigo, 'SESION_VENCIDA');
  });

  test('el codigo no se confunde con el de credenciales incorrectas', () => {
    assert.notEqual(errorSesionVencida().codigo, 'NO_AUTORIZADO');
  });
});
