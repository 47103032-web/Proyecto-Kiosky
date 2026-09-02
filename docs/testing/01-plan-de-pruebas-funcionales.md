# Plan de Pruebas Funcionales - KIOSKY

| Dato | Valor |
|---|---|
| Proyecto | Kiosky - Sistema Web para la Gestion Integral de Kioscos |
| Ticket | KIO-08 - Testing y documentacion |
| Responsable | Aaron Brumat (Testing - Documentacion - QA) |
| Colaboradores | Todo el equipo |
| Unidad curricular | Practica Profesionalizante 1 |
| Documentos base | `Kiosky - PP1`, `Entregable N2 - PP1` |

---

## 1. Objetivo

Verificar que los casos de uso definidos para Kiosky se comporten segun lo
especificado, tanto en su flujo principal como en sus flujos alternativos,
antes de la entrega al cliente.

Este plan cubre los cinco casos de uso del documento base:

| Caso de uso | Descripcion | Actor principal |
|---|---|---|
| CU-01 | Registrar venta | Propietario / Empleado |
| CU-02 | Administrar productos | Propietario |
| CU-03 | Registrar producto vencido o danado | Propietario |
| CU-04 | Consultar reportes de ventas | Propietario |
| CU-05 | Consultar productos mas vendidos | Propietario |

## 2. Alcance

**Incluido:** pruebas funcionales manuales de caja negra sobre la interfaz
web y la API, validando entradas validas e invalidas, calculos, actualizacion
de stock, mensajes al usuario y permisos por rol.

**Excluido:** pruebas de carga y estres, pruebas de seguridad ofensiva,
pruebas de compatibilidad con navegadores fuera de los indicados en RNF-03 y
pruebas automatizadas de regresion. Estas quedan fuera del alcance de la
materia y no se agregan funcionalidades para cubrirlas.

## 3. Estrategia

- **Tecnica:** caja negra, con particiones de equivalencia y analisis de
  valores limite (por ejemplo, stock exactamente igual al minimo, o cantidad
  igual al stock disponible).
- **Tipo de ejecucion:** manual, siguiendo los pasos documentados.
- **Criterio de entrada:** el modulo esta desplegado y el juego de datos de
  `database/seed.sql` esta cargado.
- **Criterio de salida:** el 100% de los casos criticos (severidad alta)
  finaliza en estado Aprobado y no quedan defectos abiertos de severidad alta.

## 4. Nomenclatura

Los casos se identifican como `CP-<caso de uso>-<numero>`.
Cada caso indica si es **positivo** (camino esperado) o **negativo**
(el sistema debe rechazar la operacion con un mensaje claro).

## 5. Ambiente de pruebas

| Componente | Valor |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:4000/api |
| Base de datos | MySQL 8 (o repositorio en memoria equivalente) |
| Navegador | Google Chrome |
| Usuario propietario | propietario@kiosky.com / Kiosky2026 |
| Usuario empleado | empleado@kiosky.com / Empleado2026 |

---

## 6. CU-01 - Registrar venta

### Criterios de aceptacion (HU-01)

| # | Criterio |
|---|---|
| CA-1 | Se deben poder buscar productos por nombre y por codigo de barras. |
| CA-2 | El total debe calcularse automaticamente al agregar o modificar items. |
| CA-3 | El stock debe actualizarse luego de confirmar cada venta. |
| CA-4 | La venta debe registrar el medio de pago seleccionado. |
| CA-5 | La operacion debe quedar en el historial de ventas. |

### Casos de prueba

| ID | Tipo | Descripcion | Pasos | Resultado esperado |
|---|---|---|---|---|
| CP-CU01-01 | Positivo | Venta de un solo producto | 1. Ir a Registrar venta. 2. Buscar "Chocolate". 3. Agregar 2 unidades. 4. Medio de pago Efectivo. 5. Confirmar. | Mensaje de confirmacion con numero de venta. Total = $2.400,00. Stock de Chocolate baja de 50 a 48. |
| CP-CU01-02 | Positivo | Venta de varios productos | Agregar 2 Chocolate + 1 Gaseosa + 1 Agua Mineral y confirmar. | Total = $5.300,00 (suma de subtotales). Se descuenta el stock de los tres productos. |
| CP-CU01-03 | Positivo | Busqueda por codigo de barras | Escribir `7790001001` en el campo de codigo y presionar Enter. | Se agrega "Chocolate Barra 30g" al detalle y el campo queda vacio para la siguiente lectura. |
| CP-CU01-04 | Positivo | Recalculo del total | Con un item cargado, cambiar la cantidad de 1 a 3. | El subtotal y el total se actualizan de inmediato, sin recargar la pagina. |
| CP-CU01-05 | Positivo | Medios de pago | Registrar una venta con cada medio activo (Efectivo, Debito, Credito, Transferencia). | Cada venta queda registrada con su medio de pago y se refleja en el reporte. |
| CP-CU01-06 | Positivo | Valor limite: vender todo el stock | Vender 2 unidades de "Galletitas Dulces" (stock = 2). | La venta se registra. El stock queda en 0. |
| CP-CU01-07 | Negativo | Stock insuficiente (FA-1) | Intentar vender 10 unidades de "Galletitas Dulces" (stock = 2). | La venta se rechaza. Mensaje: stock insuficiente, indicando lo solicitado y lo disponible. El stock no cambia. |
| CP-CU01-08 | Negativo | Producto sin stock | Intentar agregar "Cigarrillos Box 20" (stock = 0). | El boton Agregar esta deshabilitado. El producto no puede sumarse al detalle. |
| CP-CU01-09 | Negativo | Producto inexistente (FA-2) | Buscar el codigo de barras `0000000000`. | Mensaje informando que no hay ningun producto registrado con ese codigo. No se agrega nada. |
| CP-CU01-10 | Negativo | Venta sin productos | Con el detalle vacio, intentar confirmar. | El boton Confirmar venta esta deshabilitado. No se genera ninguna venta. |
| CP-CU01-11 | Negativo | Cantidad invalida | Ingresar cantidad 0 o un valor negativo en un item. | La cantidad se corrige al minimo permitido (1). No se registra una venta con cantidad invalida. |
| CP-CU01-12 | Negativo | Sesion no iniciada | Llamar al alta de venta sin haber iniciado sesion. | La operacion se rechaza indicando que debe iniciar sesion. |

---

## 7. CU-02 - Administrar productos

### Criterios de aceptacion (HU-02)

| # | Criterio |
|---|---|
| CA-1 | Se deben poder agregar productos. |
| CA-2 | Se deben poder modificar productos existentes. |
| CA-3 | Se deben poder eliminar productos. |
| CA-4 | La busqueda debe funcionar por nombre y por codigo de barras. |

### Casos de prueba

| ID | Tipo | Descripcion | Pasos | Resultado esperado |
|---|---|---|---|---|
| CP-CU02-01 | Positivo | Alta de producto | Agregar producto: nombre "Turron", precio 900, stock 30, minimo 5. | Mensaje de alta correcta. El producto aparece en el listado con sus datos. |
| CP-CU02-02 | Positivo | Alta sin codigo de barras | Dar de alta un producto dejando vacio el codigo de barras. | El producto se registra y se muestra con la marca "sin codigo". |
| CP-CU02-03 | Positivo | Modificacion (FA-1) | Editar "Chicle Menta" y cambiar el precio a 800. | Mensaje de cambios guardados. El listado muestra el precio actualizado. |
| CP-CU02-04 | Positivo | Eliminacion (FA-2) | Eliminar un producto sin ventas asociadas y confirmar. | El sistema solicita confirmacion y luego lo quita del inventario. |
| CP-CU02-05 | Positivo | Baja de producto con ventas | Eliminar "Chocolate Barra 30g" (tiene ventas). | El producto se desactiva en lugar de borrarse, para conservar el historial. El sistema lo informa. |
| CP-CU02-06 | Positivo | Busqueda por nombre | Escribir "gaseosa" en el buscador. | Se listan unicamente los productos cuyo nombre coincide. |
| CP-CU02-07 | Negativo | Cancelar eliminacion | Pulsar Eliminar y luego cancelar en el dialogo. | El producto permanece sin cambios en el inventario. |
| CP-CU02-08 | Negativo | Nombre vacio | Guardar un producto sin nombre. | Se muestra el error en el campo Nombre. No se registra el producto. |
| CP-CU02-09 | Negativo | Precio negativo | Guardar un producto con precio -100. | Se muestra el error en el campo Precio. No se registra el producto. |
| CP-CU02-10 | Negativo | Codigo de barras duplicado | Dar de alta un producto con el codigo `7790001001`, ya existente. | La operacion se rechaza informando que el codigo ya esta en uso. |
| CP-CU02-11 | Negativo | Stock negativo | Guardar un producto con stock -5. | Se muestra el error en el campo Stock. No se registra el producto. |
| CP-CU02-12 | Negativo | Empleado sin permisos | Iniciar sesion como empleado e intentar dar de alta un producto. | La opcion no esta disponible y la operacion se rechaza por falta de permisos. |

---

## 8. CU-03 - Registrar producto vencido o danado

### Criterios de aceptacion (HU-06)

| # | Criterio |
|---|---|
| CA-1 | El sistema debe descontar automaticamente el stock. |
| CA-2 | La operacion debe quedar registrada con su motivo. |
| CA-3 | No debe permitirse dar de baja mas unidades de las disponibles. |

### Casos de prueba

| ID | Tipo | Descripcion | Pasos | Resultado esperado |
|---|---|---|---|---|
| CP-CU03-01 | Positivo | Baja por vencimiento | Seleccionar "Yogur Bebible 200ml" (stock 12), motivo Vencido, cantidad 5. | Mensaje de confirmacion. El stock pasa de 12 a 7. La baja figura en el historial. |
| CP-CU03-02 | Positivo | Baja por dano | Registrar 2 unidades de "Papas Fritas 100g" con motivo Danado. | El stock se descuenta y la baja queda registrada con motivo "danado". |
| CP-CU03-03 | Positivo | Valor limite: baja total | Dar de baja exactamente el stock disponible de un producto. | La baja se registra y el stock queda en 0. |
| CP-CU03-04 | Positivo | Listado de vencidos | Ingresar al modulo Productos vencidos. | Se listan los productos cuya fecha de vencimiento ya paso, y por separado los proximos a vencer. |
| CP-CU03-05 | Negativo | Cantidad mayor al stock (FA-1) | Intentar dar de baja 999 unidades de un producto con stock 7. | La operacion se rechaza informando el error y el stock disponible. El stock no cambia. |
| CP-CU03-06 | Negativo | Cantidad cero o negativa | Ingresar cantidad 0 o -3. | Se informa que la cantidad debe ser un entero mayor a cero. |
| CP-CU03-07 | Negativo | Sin producto seleccionado | Pulsar Registrar baja sin elegir un producto. | Se informa que debe seleccionar un producto. |
| CP-CU03-08 | Negativo | Empleado sin permisos | Como empleado, intentar registrar una baja. | La opcion no esta disponible y la operacion se rechaza. |

---

## 9. CU-04 - Consultar reportes de ventas

### Criterios de aceptacion (HU-04)

| # | Criterio |
|---|---|
| CA-1 | Se deben poder consultar ventas por dia, semana y mes. |
| CA-2 | El reporte debe mostrar el total vendido. |
| CA-3 | Debe mostrar la cantidad de ventas y los medios de pago utilizados. |
| CA-4 | Debe permitir exportar el resultado. |

### Casos de prueba

| ID | Tipo | Descripcion | Pasos | Resultado esperado |
|---|---|---|---|---|
| CP-CU04-01 | Positivo | Reporte del dia | Seleccionar el periodo "Hoy" y consultar. | Se muestran total vendido, cantidad de ventas, ticket promedio, medios de pago y productos vendidos del dia. |
| CP-CU04-02 | Positivo | Reporte semanal | Seleccionar "Ultimos 7 dias". | El total incluye las ventas de los ultimos 7 dias y es mayor o igual al del dia. |
| CP-CU04-03 | Positivo | Reporte mensual | Seleccionar "Ultimos 30 dias". | El total incluye todas las ventas del periodo. |
| CP-CU04-04 | Positivo | Rango personalizado | Indicar Desde y Hasta manualmente. | El reporte se limita al rango indicado, ignorando el periodo predefinido. |
| CP-CU04-05 | Positivo | Consistencia del total | Comparar el total del reporte con la suma de los totales del historial del mismo periodo. | Ambos valores coinciden. |
| CP-CU04-06 | Positivo | Exportacion | Pulsar Exportar CSV. | Se descarga un archivo con el resumen, los medios de pago y los productos vendidos. |
| CP-CU04-07 | Positivo | Ventas anuladas | Anular una venta y volver a consultar el reporte del dia. | El total disminuye en el importe de la venta anulada, que deja de contabilizarse. |
| CP-CU04-08 | Negativo | Periodo sin ventas (FA) | Consultar el rango 01/01/2020 a 31/01/2020. | Mensaje informando que no hay ventas registradas en el periodo. Los totales se muestran en cero. |
| CP-CU04-09 | Negativo | Rango invertido | Indicar Desde posterior a Hasta. | Se informa que la fecha "desde" no puede ser posterior a la fecha "hasta". |
| CP-CU04-10 | Negativo | Empleado sin permisos | Como empleado, intentar acceder a Reportes. | La opcion no figura en el menu y el acceso directo es rechazado. |

---

## 10. CU-05 - Consultar productos mas vendidos

### Criterios de aceptacion (HU-05)

| # | Criterio |
|---|---|
| CA-1 | El sistema debe mostrar un ranking de productos. |
| CA-2 | La consulta debe poder filtrarse por fechas. |
| CA-3 | El ranking debe ordenarse por cantidad de unidades vendidas. |

### Casos de prueba

| ID | Tipo | Descripcion | Pasos | Resultado esperado |
|---|---|---|---|---|
| CP-CU05-01 | Positivo | Ranking del mes | Ingresar al modulo Mas vendidos con el periodo "Ultimos 30 dias". | Se muestra el ranking ordenado de mayor a menor por unidades, con su posicion. |
| CP-CU05-02 | Positivo | Orden correcto | Verificar que cada fila tenga una cantidad menor o igual a la anterior. | El orden descendente se respeta en toda la tabla. |
| CP-CU05-03 | Positivo | Filtro por fechas | Indicar un rango que excluya las ventas mas antiguas. | El ranking se recalcula solo con las ventas del rango. |
| CP-CU05-04 | Positivo | Coherencia con el reporte | Comparar el primer puesto con el producto de mayor cantidad del reporte de ventas del mismo periodo. | Coinciden. |
| CP-CU05-05 | Negativo | Periodo sin ventas (FA) | Consultar un rango sin ventas. | Mensaje informando que no se pueden generar estadisticas. La tabla no se muestra. |
| CP-CU05-06 | Negativo | Empleado sin permisos | Como empleado, intentar acceder a Mas vendidos. | La opcion no figura en el menu y el acceso directo es rechazado. |

---

## 11. Resumen de cobertura

| Caso de uso | Positivos | Negativos | Total |
|---|---|---|---|
| CU-01 Registrar venta | 6 | 6 | 12 |
| CU-02 Administrar productos | 6 | 6 | 12 |
| CU-03 Productos vencidos | 4 | 4 | 8 |
| CU-04 Reportes de ventas | 7 | 3 | 10 |
| CU-05 Mas vendidos | 4 | 2 | 6 |
| **Total** | **27** | **21** | **48** |

## 12. Riesgos considerados

Tomados de la gestion de riesgos del Entregable N2:

| ID | Riesgo | Como lo cubre este plan |
|---|---|---|
| R-01 | Errores de stock por ventas concurrentes o validaciones incompletas | CP-CU01-06, CP-CU01-07 y CP-CU03-03 verifican los valores limite de stock. |
| R-04 | Falta de pruebas antes de la entrega | Este plan se ejecuta como checklist obligatorio previo a la presentacion. |
