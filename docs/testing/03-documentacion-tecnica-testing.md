# Documentacion Tecnica de Testing - KIOSKY

| Dato | Valor |
|---|---|
| Proyecto | Kiosky - Sistema Web para la Gestion Integral de Kioscos |
| Ticket | KIO-08 - Testing y documentacion |
| Responsable | Aaron Brumat (Testing - Documentacion - QA) |
| Colaboradores | Todo el equipo |
| Documentos relacionados | `01-plan-de-pruebas-funcionales.md`, `02-casos-de-prueba-manuales-rf.md` |

---

## 1. Alcance del testing

### 1.1 Incluido

- Pruebas funcionales manuales de caja negra sobre los casos de uso CU-01 a
  CU-05 y los requerimientos funcionales RF-01 a RF-14.
- Validacion de entradas validas e invalidas en todos los formularios.
- Verificacion de los calculos de totales y subtotales.
- Verificacion de la actualizacion automatica de stock por ventas y bajas.
- Verificacion de permisos segun el rol (propietario / empleado).
- Verificacion de los mensajes que el sistema devuelve al usuario.
- Comprobacion de las reglas de integridad del punto 12 del Entregable N2.

### 1.2 Excluido

| Fuera de alcance | Motivo |
|---|---|
| Pruebas de carga y estres | Exceden el alcance de la materia; el sistema apunta a un unico comercio. |
| Pruebas de seguridad ofensiva (penetration testing) | No forman parte de los requerimientos del proyecto. |
| Pruebas automatizadas de regresion | No estan contempladas en la planificacion del Entregable N2. |
| Compatibilidad con navegadores fuera del RNF-03 | El RNF-03 limita el soporte a Chrome, Edge y Firefox. |
| Pruebas de usabilidad con usuarios finales | Requieren la participacion del cliente, prevista para la etapa de entrega. |

### 1.3 Requerimientos no funcionales verificados

| RNF | Como se verifica |
|---|---|
| RNF-01 Interfaz intuitiva | Revision de las pantallas contra los wireframes del documento base. |
| RNF-02 Respuesta menor a 3 segundos | Observacion del tiempo de respuesta en las operaciones habituales. |
| RNF-03 Compatibilidad de navegadores | Ejecucion del plan en Google Chrome; verificacion puntual en Edge y Firefox. |
| RNF-04 Acceso protegido | Casos CP-RF01-07 y los casos de permisos por rol. |
| RNF-05 Integridad de la informacion | Consultas de verificacion de `database/consultas.sql`. |

---

## 2. Ambiente de pruebas

| Componente | Detalle |
|---|---|
| Sistema operativo | Windows 11 |
| Navegador | Google Chrome |
| Frontend | React 18 + Vite, en `http://localhost:5173` |
| Backend | Node.js + Express, en `http://localhost:4000/api` |
| Base de datos | MySQL 8, o repositorio en memoria con el mismo juego de datos |
| Herramienta de API | Postman o `curl` |

El endpoint `GET /api/salud` informa contra que motor de persistencia se esta
ejecutando. Conviene registrarlo al iniciar una sesion de pruebas, porque el
modo memoria no conserva los cambios entre reinicios del proceso.

---

## 3. Datos de prueba

Los datos se cargan con `database/schema.sql` seguido de `database/seed.sql`.
Las fechas de vencimiento son relativas al dia de ejecucion, de modo que el
juego de datos siempre contenga productos vencidos, proximos a vencer y
vigentes, sin importar cuando se ejecuten las pruebas.

### 3.1 Usuarios

| ID | Nombre | Email | Contrasena | Rol | Activo |
|---|---|---|---|---|---|
| 1 | Aaron Brumat | propietario@kiosky.com | Kiosky2026 | propietario | Si |
| 2 | Empleado Mostrador | empleado@kiosky.com | Empleado2026 | empleado | Si |
| 3 | Usuario Inactivo | inactivo@kiosky.com | Empleado2026 | empleado | No |

### 3.2 Medios de pago

| ID | Nombre | Activo | Proposito en las pruebas |
|---|---|---|---|
| 1 | Efectivo | Si | Medio habitual |
| 2 | Debito | Si | Verificar el desglose del reporte |
| 3 | Credito | Si | Verificar el desglose del reporte |
| 4 | Transferencia | Si | Verificar el desglose del reporte |
| 5 | Cheque | No | Verificar que un medio inactivo no se ofrezca |

### 3.3 Productos

Cada producto cubre intencionalmente una condicion de prueba distinta.

| ID | Producto | Precio | Stock | Minimo | Vencimiento | Condicion que cubre |
|---|---|---|---|---|---|---|
| 1 | Chocolate Barra 30g | 1200 | 50 | 10 | +180 dias | Caso normal, producto mas vendido |
| 2 | Chicle Menta | 700 | 80 | 15 | +240 dias | Caso normal |
| 3 | Gaseosa Cola 500ml | 1800 | 40 | 12 | +120 dias | Caso normal |
| 4 | Agua Mineral 500ml | 1100 | 60 | 12 | +300 dias | Caso normal |
| 5 | Papas Fritas 100g | 2500 | 4 | 10 | +90 dias | **Bajo stock** |
| 6 | Galletitas Dulces | 1900 | 2 | 8 | +60 dias | **Bajo stock**, venta del stock completo |
| 7 | Alfajor Triple | 1500 | 25 | 5 | +10 dias | **Proximo a vencer** |
| 8 | Jugo Naranja 1L | 2200 | 18 | 6 | +20 dias | **Proximo a vencer** |
| 9 | Yogur Bebible 200ml | 1600 | 12 | 5 | -5 dias | **Vencido**, pruebas de baja |
| 10 | Cigarrillos Box 20 | 4500 | 0 | 5 | +400 dias | **Stock cero** |
| 11 | Caramelo Suelto | 150 | 200 | 50 | +365 dias | **Sin codigo de barras** |
| 12 | Pan Lactal | 3200 | 10 | 10 | +15 dias | **Valor limite: stock = minimo** |

### 3.4 Ventas precargadas

| ID | Momento | Total | Medio de pago | Estado |
|---|---|---|---|---|
| 1 | Hoy 09:00 | 6.400 | Efectivo | registrada |
| 2 | Hoy 11:00 | 3.600 | Debito | registrada |
| 3 | Hoy 15:00 | 4.500 | Efectivo | registrada |
| 4 | Hace 3 dias | 9.100 | Credito | registrada |
| 5 | Hace 6 dias | 5.900 | Transferencia | registrada |
| 6 | Hace 20 dias | 7.400 | Efectivo | registrada |
| 7 | Hace 2 dias | 2.400 | Efectivo | **anulada** |

La venta 7 esta anulada a proposito, para verificar que no se sume a los
reportes ni al ranking de mas vendidos.

---

## 4. Resultados esperados

### 4.1 Valores de referencia con el juego de datos inicial

Estos valores permiten verificar los reportes sin recalcular a mano. Se
obtienen inmediatamente despues de cargar `seed.sql`, antes de registrar
operaciones nuevas.

| Consulta | Resultado esperado |
|---|---|
| Reporte del dia: total vendido | $14.500,00 (ventas 1, 2 y 3) |
| Reporte del dia: cantidad de ventas | 3 |
| Reporte del dia: ticket promedio | $4.833,33 |
| Reporte de los ultimos 7 dias: total | $29.500,00 (ventas 1 a 5) |
| Reporte de los ultimos 30 dias: total | $36.900,00 (ventas 1 a 6) |
| Productos con stock bajo | 4: Cigarrillos (0), Galletitas (2), Papas Fritas (4) y Pan Lactal (10) |
| Productos proximos a vencer (30 dias) | 3: Alfajor Triple, Pan Lactal y Jugo Naranja 1L |
| Productos vencidos | 1: Yogur Bebible 200ml |
| Primer puesto del ranking mensual | Chocolate Barra 30g |

> La venta 7 esta anulada y por eso no participa de ninguno de estos totales.

### 4.2 Reglas de integridad a verificar

Del punto 12 del Entregable N2. Las dos ultimas consultas de
`database/consultas.sql` deben devolver cero filas.

| # | Regla | Como se comprueba |
|---|---|---|
| 1 | No se permite vender si el stock es menor a la cantidad solicitada | CP-CU01-07 |
| 2 | Cada venta tiene al menos un registro en `detalle_venta` | Consulta de verificacion |
| 3 | `subtotal` = `cantidad` x `precio_unitario` | Revision del detalle de venta |
| 4 | El total de la venta es la suma de los subtotales | Consulta de verificacion |
| 5 | Cada venta confirmada descuenta stock y registra un movimiento "venta" | CP-RF03-03 |
| 6 | Cada baja descuenta stock y deja trazabilidad | CP-RF12-02 |
| 7 | El codigo de barras es unico cuando se informa | CP-RF04-06 |
| 8 | El email de usuario es unico | Restriccion UNIQUE en `usuarios` |

### 4.3 Mensajes esperados ante entradas invalidas

| Situacion | Mensaje esperado |
|---|---|
| Credenciales incorrectas | "Usuario o contrasena incorrectos." |
| Usuario deshabilitado | "El usuario se encuentra deshabilitado." |
| Operacion sin sesion | "Debe iniciar sesion para realizar esta operacion." |
| Rol sin permisos | "Esta operacion requiere el rol: propietario." |
| Stock insuficiente en venta | "Stock insuficiente para <producto>. Solicitado: X, disponible: Y." |
| Producto inexistente por codigo | "No hay ningun producto registrado con el codigo <codigo>." |
| Codigo de barras duplicado | "Ya existe un producto con el codigo de barras <codigo>." |
| Baja mayor al stock | "Stock insuficiente para <producto>. Solicitado: X, disponible: Y." |
| Periodo de reporte sin ventas | "No hay ventas registradas en el periodo seleccionado." |
| Rango de fechas invertido | "La fecha 'desde' no puede ser posterior a la fecha 'hasta'." |

---

## 5. Procedimiento de ejecucion

1. Cargar `database/schema.sql` y `database/seed.sql` (o reiniciar el backend
   en modo memoria, que carga el mismo juego de datos).
2. Iniciar el backend y comprobar `GET /api/salud`.
3. Iniciar el frontend.
4. Ejecutar los casos de `02-casos-de-prueba-manuales-rf.md` en orden,
   registrando el estado de cada uno.
5. Ejecutar los casos por caso de uso de `01-plan-de-pruebas-funcionales.md`.
6. Ejecutar las consultas de verificacion de integridad.
7. Registrar en la seccion 6 todo desvio detectado.
8. Reiniciar el juego de datos antes de una nueva ronda completa, para que
   los valores de referencia de la seccion 4.1 vuelvan a ser validos.

### 5.1 Criterio de aceptacion de la entrega

- El 100% de los casos de severidad alta finaliza en estado **Aprobado**.
- No quedan defectos abiertos de severidad **Alta** o **Critica**.
- Las consultas de verificacion de integridad devuelven cero filas.

---

## 6. Registro de errores

### 6.1 Clasificacion

| Severidad | Definicion |
|---|---|
| Critica | El sistema no puede utilizarse o se pierden datos. |
| Alta | Un requerimiento funcional no se cumple. No hay alternativa. |
| Media | El requerimiento se cumple parcialmente o existe una alternativa. |
| Baja | Defecto cosmetico, de redaccion o de comodidad de uso. |

**Estados:** Abierto / En correccion / Corregido / Cerrado / No es defecto.

### 6.2 Plantilla de registro

```
ID           : DEF-000
Fecha        : DD/MM/AAAA
Caso         : CP-XXXX-00
RF / CU      : RF-00 / CU-00
Severidad    : Critica | Alta | Media | Baja
Descripcion  : Que ocurre.
Pasos        : Como reproducirlo.
Esperado     : Que deberia ocurrir.
Obtenido     : Que ocurrio realmente.
Estado       : Abierto | En correccion | Corregido | Cerrado
Responsable  : Integrante asignado.
```

### 6.3 Defectos registrados

| ID | Fecha | Caso | Severidad | Descripcion | Estado | Responsable |
|---|---|---|---|---|---|---|
| DEF-001 | 01/09/2026 | CP-CU01-03 | Baja | La confirmacion por codigo de barras dependia unicamente del envio implicito del formulario al presionar Enter. Funciona en un navegador real, pero deja el comportamiento sujeto a una conducta implicita del navegador y dificulta verificarlo de forma automatizada. | Corregido | Aaron Brumat |

**Detalle de DEF-001**

```
ID           : DEF-001
Fecha        : 01/09/2026
Caso         : CP-CU01-03
RF / CU      : RF-07 / CU-01 paso 3
Severidad    : Baja
Descripcion  : El campo de codigo de barras no tenia un manejador propio para
               la tecla Enter; se apoyaba en el envio implicito del formulario.
Pasos        : 1. Ir a Registrar venta.
               2. Escribir un codigo de barras valido.
               3. Presionar Enter.
Esperado     : El producto se agrega al detalle y el campo queda vacio.
Obtenido     : Correcto en el navegador. El comportamiento no se podia
               verificar de forma reproducible fuera de la interaccion manual.
Correccion   : Se agrego un manejador explicito de la tecla Enter sobre el
               campo, manteniendo tambien el envio del formulario.
Archivo      : frontend/src/pages/RegistrarVenta.jsx
Estado       : Corregido
Responsable  : Aaron Brumat
```

> No se registraron defectos de severidad Media, Alta ni Critica en la ronda
> de verificacion documentada en la seccion 7.

---

## 7. Registro de la ronda de verificacion inicial

Ronda de humo ejecutada sobre la API y la interfaz para dejar constancia del
estado del sistema al momento de escribir esta documentacion.

| # | Verificacion | Resultado obtenido | Estado |
|---|---|---|---|
| 1 | Login del propietario con credenciales validas | Acceso concedido, token emitido | Aprobado |
| 2 | Login con contrasena incorrecta | "Usuario o contrasena incorrectos" | Aprobado |
| 3 | Login de usuario inactivo | "El usuario se encuentra deshabilitado" | Aprobado |
| 4 | Acceso a productos sin token | "Debe iniciar sesion para realizar esta operacion" | Aprobado |
| 5 | Busqueda por nombre "choco" | 1 resultado: Chocolate Barra 30g | Aprobado |
| 6 | Alerta de bajo stock | 4 productos: Cigarrillos (0/5), Galletitas (2/8), Papas Fritas (4/10), Pan Lactal (10/10) | Aprobado |
| 7 | Valor limite stock = minimo (Pan Lactal) | Aparece en la alerta | Aprobado |
| 8 | Alerta de proximos a vencer | 3 productos: Alfajor Triple, Pan Lactal, Jugo Naranja 1L | Aprobado |
| 9 | Alerta de vencidos | 1 producto: Yogur Bebible 200ml | Aprobado |
| 10 | Venta de 2 Chocolate + 1 Gaseosa | Total $4.200,00, coincide con la suma de subtotales | Aprobado |
| 11 | Descuento de stock tras la venta | Chocolate: 50 -> 48 | Aprobado |
| 12 | Venta con stock insuficiente (10 de un stock de 2) | Rechazada, indicando solicitado y disponible | Aprobado |
| 13 | Venta con producto inexistente | Rechazada, "No existe el producto con id 999" | Aprobado |
| 14 | Reporte del dia | Total y cantidad de ventas coherentes con el historial | Aprobado |
| 15 | Ranking de mas vendidos del mes | Chocolate Barra 30g en primer puesto | Aprobado |
| 16 | Reporte de un periodo sin ventas | Mensaje de "sin datos" y totales en cero | Aprobado |
| 17 | Baja de 5 unidades por vencimiento | Yogur: 12 -> 7, baja registrada | Aprobado |
| 18 | Baja mayor al stock disponible | Rechazada, indicando el stock real | Aprobado |
| 19 | Empleado intenta dar de alta un producto | Rechazado por falta de permisos | Aprobado |
| 20 | Empleado intenta consultar reportes | Rechazado por falta de permisos | Aprobado |
| 21 | Empleado registra una venta | Permitido, segun los actores de CU-01 | Aprobado |
| 22 | Alta de venta desde la interfaz web | Venta registrada, mensaje de confirmacion y detalle vaciado | Aprobado |
| 23 | Busqueda por codigo de barras desde la interfaz | Producto agregado al detalle y campo limpiado | Aprobado |
| 24 | Visualizacion en resolucion movil (375x812) | Menu y tablas se adaptan correctamente | Aprobado |

**Resultado de la ronda:** 24 verificaciones ejecutadas, 24 aprobadas, 0 fallidas.

> Esta ronda es una verificacion de humo, no reemplaza la ejecucion completa
> de los 81 casos de `02-casos-de-prueba-manuales-rf.md` ni de los 48 casos
> de `01-plan-de-pruebas-funcionales.md`, que quedan pendientes de ejecucion
> formal por el equipo antes de la entrega final.

---

## 8. Trazabilidad

| Caso de uso | Requerimientos que cubre | Historia de usuario |
|---|---|---|
| CU-01 Registrar venta | RF-02, RF-03, RF-07, RF-08 | HU-01 |
| CU-02 Administrar productos | RF-04, RF-05, RF-06, RF-07 | HU-02 |
| CU-03 Productos vencidos o danados | RF-11, RF-12 | HU-06 |
| CU-04 Reportes de ventas | RF-09, RF-14 | HU-04 |
| CU-05 Productos mas vendidos | RF-10 | HU-05 |
| (transversal) Acceso al sistema | RF-01 | - |
| (transversal) Control de inventario | RF-13 | HU-03 |
