/**
 * Selector de repositorios.
 *
 * Devuelve la implementacion MySQL o la implementacion en memoria segun
 * el modo con el que arranco la aplicacion. La capa de servicios consume
 * siempre esta funcion y desconoce el motor subyacente.
 */
import { getEstadoBaseDeDatos } from '../config/db.js';
import { crearRepositoriosMySQL } from './mysqlRepositories.js';
import { crearRepositoriosEnMemoria } from './memoryRepositories.js';

let repositorios = null;

export function inicializarRepositorios() {
  const { mode } = getEstadoBaseDeDatos();
  repositorios = mode === 'mysql' ? crearRepositoriosMySQL() : crearRepositoriosEnMemoria();
  return repositorios;
}

export function getRepositorios() {
  if (!repositorios) return inicializarRepositorios();
  return repositorios;
}
