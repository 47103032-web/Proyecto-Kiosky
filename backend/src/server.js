/**
 * Punto de entrada del backend Kiosky.
 *
 * Resuelve primero el modo de base de datos (MySQL o memoria) y recien
 * despues levanta el servidor HTTP, de modo que los repositorios queden
 * inicializados antes de atender la primera peticion.
 */
import { config } from './config/env.js';
import { inicializarBaseDeDatos } from './config/db.js';
import { inicializarRepositorios } from './repositories/index.js';
import { crearApp } from './app.js';

async function iniciar() {
  const { mode } = await inicializarBaseDeDatos();
  inicializarRepositorios();

  const app = crearApp();

  app.listen(config.port, () => {
    console.log('');
    console.log('  KIOSKY - Sistema Web para la Gestion Integral de Kioscos');
    console.log(`  API escuchando en http://localhost:${config.port}/api`);
    console.log(`  Persistencia: ${mode === 'mysql' ? 'MySQL' : 'memoria (sin MySQL)'}`);
    if (mode === 'memory') {
      console.log('  Los cambios no se conservan al reiniciar el proceso.');
    }
    console.log('');
  });
}

iniciar().catch((error) => {
  console.error('[kiosky] No se pudo iniciar el backend:', error.message);
  process.exit(1);
});
