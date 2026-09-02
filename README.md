# KIOSKY - Sistema Web para la Gestion Integral de Kioscos

Proyecto de la unidad curricular **Practica Profesionalizante 1** (Carrera de
Desarrollo de Software). Sistema web para administrar las ventas, el stock y
los reportes de un kiosco, reemplazando los registros manuales.

- **Docente:** Diego Servan
- **Integrantes:** Aaron Brumat, Lucas Beim, Elian Cavenatti, Leonardo Vertali
- **Documentos base:** `Kiosky - PP1` y `Entregable N2 - PP1`

---

## Stack

| Capa | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Base de datos | MySQL 8 |
| Autenticacion | JWT + bcrypt |

## Estructura del repositorio

```
Kiosky/
├── database/            Scripts SQL (schema, datos de prueba, consultas)
├── backend/             API REST en Node.js + Express
│   └── src/
│       ├── config/      Configuracion y conexion a la base de datos
│       ├── models/      Clases de dominio (punto 13 del Entregable N2)
│       ├── repositories/ Acceso a datos: MySQL y en memoria
│       ├── services/    Reglas de negocio
│       ├── controllers/ Manejo de peticiones HTTP
│       ├── routes/      Definicion de endpoints
│       └── middleware/  Autenticacion y manejo de errores
├── frontend/            Interfaz React
│   └── src/
│       ├── pages/       Pantallas de los wireframes
│       ├── components/  Componentes reutilizables
│       ├── context/     Contexto de sesion
│       └── api/         Cliente HTTP
└── docs/testing/        Plan de pruebas y documentacion de QA (KIO-08)
```

## Puesta en marcha

### 1. Base de datos (opcional)

Con MySQL instalado:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

> **Sin MySQL el sistema funciona igual.** Si el backend no logra conectar,
> arranca automaticamente con un repositorio en memoria que contiene el mismo
> juego de datos de `database/seed.sql`. Es util para ejecutar el plan de
> pruebas sin instalar nada. La contrapartida es que los cambios se pierden al
> reiniciar el proceso.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

API disponible en `http://localhost:4000/api`.
El endpoint `GET /api/salud` informa contra que motor esta corriendo.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicacion disponible en `http://localhost:5173`.

## Usuarios de prueba

| Rol | Usuario | Contrasena |
|---|---|---|
| Propietario | propietario@kiosky.com | Kiosky2026 |
| Empleado | empleado@kiosky.com | Empleado2026 |

El **empleado** puede registrar ventas y consultar productos e historial.
El **propietario** ademas administra productos, bajas y reportes, en linea con
los actores definidos para cada caso de uso.

## Cobertura de requerimientos

| RF | Descripcion | Donde se implementa |
|---|---|---|
| RF-01 | Inicio de sesion | `AuthService` / pantalla Login |
| RF-02 | Registrar ventas de uno o varios productos | `VentaService` / Registrar venta |
| RF-03 | Actualizar stock tras cada venta | `VentaRepository.registrar` |
| RF-04 | Registrar productos nuevos | `ProductoService.crear` |
| RF-05 | Modificar productos | `ProductoService.actualizar` |
| RF-06 | Eliminar productos | `ProductoService.eliminar` |
| RF-07 | Buscar por nombre o codigo de barras | `ProductoRepository.listar` |
| RF-08 | Registrar distintos medios de pago | `medios_pago` / selector de venta |
| RF-09 | Reportes por dia, semana y mes | `ReporteService.ventasPorPeriodo` |
| RF-10 | Productos mas vendidos | `ReporteService.productosMasVendidos` |
| RF-11 | Registrar productos danados o vencidos | `StockService.registrarBaja` |
| RF-12 | Descontar automaticamente del inventario | `BajaRepository.registrar` |
| RF-13 | Alertas de stock bajo | `Producto.estaBajoStock` / Dashboard |
| RF-14 | Consultar historial de ventas | `VentaService.listarVentas` |

## Documentacion de testing

El ticket **KIO-08 (Testing y documentacion)** esta documentado en
`docs/testing/`:

1. `01-plan-de-pruebas-funcionales.md`
2. `02-casos-de-prueba-manuales-rf.md`
3. `03-documentacion-tecnica-testing.md`
