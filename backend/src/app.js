/**
 * Construccion de la aplicacion Express.
 * Se exporta separada del arranque del servidor para que las pruebas
 * puedan montarla sin abrir un puerto.
 */
import express from 'express';
import cors from 'cors';

import { config } from './config/env.js';
import { getEstadoBaseDeDatos } from './config/db.js';
import { router } from './routes/index.js';
import { manejadorDeErrores, rutaNoEncontrada } from './middleware/errorHandler.js';

export function crearApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  /** Verificacion de estado: util para comprobar contra que motor corre. */
  app.get('/api/salud', (_req, res) => {
    res.json({
      ok: true,
      sistema: 'Kiosky',
      version: '1.0.0',
      base_de_datos: getEstadoBaseDeDatos().mode,
    });
  });

  app.use('/api', router);

  app.use(rutaNoEncontrada);
  app.use(manejadorDeErrores);

  return app;
}
