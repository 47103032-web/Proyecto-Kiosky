/**
 * Aviso de modo demostracion.
 *
 * Solo aparece cuando el backend corre sin base de datos (modo memoria).
 * En ese modo los cambios se pierden al reiniciar el servidor, y quien
 * prueba la demo tiene que saberlo antes de cargar nada.
 *
 * Lo decide el backend a traves de /api/salud: la interfaz no asume el
 * modo, lo consulta. Si el backend corre contra MySQL, el aviso no se ve.
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function AvisoDemo() {
  const [enMemoria, setEnMemoria] = useState(false);

  useEffect(() => {
    api
      .get('/salud')
      .then((r) => setEnMemoria(r.base_de_datos === 'memory'))
      .catch(() => setEnMemoria(false));
  }, []);

  if (!enMemoria) return null;

  return (
    <div className="aviso-demo" role="status">
      <strong>Modo demostración.</strong> Los datos son de prueba y vuelven al
      estado inicial cada vez que se reinicia el servidor.
    </div>
  );
}
