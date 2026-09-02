/**
 * Definicion de rutas de la API.
 *
 * Todas las rutas de negocio pasan por requiereAutenticacion, en linea
 * con la precondicion "el usuario debe haber iniciado sesion" que
 * comparten los casos de uso CU-01 a CU-05.
 */
import { Router } from 'express';

import * as AuthController from '../controllers/AuthController.js';
import * as ProductoController from '../controllers/ProductoController.js';
import * as VentaController from '../controllers/VentaController.js';
import * as StockController from '../controllers/StockController.js';
import * as ReporteController from '../controllers/ReporteController.js';
import { requiereAutenticacion, requiereRol } from '../middleware/auth.js';

export const router = Router();

// ------------------------------ RF-01 --------------------------------
router.post('/auth/login', AuthController.login);
router.get('/auth/perfil', requiereAutenticacion, AuthController.perfil);

// A partir de aqui, todo exige sesion iniciada.
router.use(requiereAutenticacion);

// ------------------- CU-02: administrar productos --------------------
router.get('/categorias', ProductoController.listarCategorias);
router.get('/productos', ProductoController.listar);
router.get('/productos/codigo/:codigo', ProductoController.obtenerPorCodigo);
router.get('/productos/:id', ProductoController.obtener);

// El actor principal de CU-02 es el propietario.
router.post('/productos', requiereRol('propietario'), ProductoController.crear);
router.put('/productos/:id', requiereRol('propietario'), ProductoController.actualizar);
router.delete('/productos/:id', requiereRol('propietario'), ProductoController.eliminar);

// --------------------- CU-01: registrar venta ------------------------
// Actores: propietario y empleado.
router.get('/medios-pago', VentaController.listarMediosPago);
router.post('/ventas', VentaController.registrar);
router.get('/ventas', VentaController.listar);
router.get('/ventas/:id', VentaController.obtener);
router.post('/ventas/:id/anular', requiereRol('propietario'), VentaController.anular);

// ------------- CU-03: productos vencidos o danados -------------------
router.get('/stock/alertas', StockController.alertas);
router.get('/stock/movimientos', StockController.listarMovimientos);
router.get('/bajas', StockController.listarBajas);
router.post('/bajas', requiereRol('propietario'), StockController.registrarBaja);

// ------------- CU-04 y CU-05: reportes y estadisticas ----------------
router.get('/reportes/ventas', requiereRol('propietario'), ReporteController.ventas);
router.get('/reportes/mas-vendidos', requiereRol('propietario'), ReporteController.masVendidos);
router.get('/dashboard', ReporteController.dashboard);
