# Casos de Prueba Manuales por Requerimiento Funcional - KIOSKY

| Dato | Valor |
|---|---|
| Proyecto | Kiosky - Sistema Web para la Gestion Integral de Kioscos |
| Ticket | KIO-08 - Testing y documentacion |
| Responsable | Aaron Brumat |
| Referencia | `Kiosky - PP1`, punto 13.2 (Requerimientos Funcionales) |
| Documento relacionado | `01-plan-de-pruebas-funcionales.md` |

---

## Proposito

Mientras el plan de pruebas se organiza por **caso de uso**, este documento
recorre la lista de **requerimientos funcionales** uno por uno y define como
validar cada uno de forma manual.

> **Nota de alcance:** los casos validan unicamente lo que los RF ya
> especifican. No se proponen funcionalidades nuevas ni comportamientos que
> no esten en el documento base. Cuando un RF no precisa un detalle, el caso
> lo indica como observacion en lugar de inventar el requisito.

## Estado posible de cada caso

`Aprobado` / `Fallido` / `Bloqueado` / `No ejecutado`

## Precondicion general

El juego de datos de `database/seed.sql` esta cargado y el usuario indicado
en cada caso inicio sesion, salvo que el propio caso diga lo contrario.

---

## RF-01. Iniciar sesion mediante usuario y contrasena

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF01-01 | Positivo | Ingresar `propietario@kiosky.com` / `Kiosky2026` y pulsar Iniciar sesion. | Se accede al sistema y se muestra el Dashboard con el nombre del usuario. | |
| CP-RF01-02 | Positivo | Ingresar `empleado@kiosky.com` / `Empleado2026`. | Se accede al sistema con el menu reducido correspondiente al rol empleado. | |
| CP-RF01-03 | Negativo | Ingresar un usuario valido con contrasena incorrecta. | Mensaje "Usuario o contrasena incorrectos". No se accede. | |
| CP-RF01-04 | Negativo | Ingresar un email no registrado. | El mismo mensaje generico, sin revelar si el usuario existe. | |
| CP-RF01-05 | Negativo | Dejar ambos campos vacios y enviar. | Mensaje indicando que debe completar usuario y contrasena. | |
| CP-RF01-06 | Negativo | Ingresar con el usuario `inactivo@kiosky.com`. | Mensaje indicando que el usuario esta deshabilitado. | |
| CP-RF01-07 | Negativo | Intentar abrir `/productos` sin haber iniciado sesion. | El sistema redirige a la pantalla de inicio de sesion. | |

---

## RF-02. Registrar ventas de uno o varios productos

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF02-01 | Positivo | Registrar una venta con un unico producto y cantidad 1. | La venta se registra y se informa su numero. | |
| CP-RF02-02 | Positivo | Registrar una venta con tres productos distintos. | Todos los items quedan en el detalle de la venta. | |
| CP-RF02-03 | Positivo | Agregar el mismo producto dos veces desde el listado. | Se acumula la cantidad en un unico item, sin duplicar la fila. | |
| CP-RF02-04 | Positivo | Verificar el total contra el calculo manual (cantidad x precio). | El total coincide con la suma de los subtotales. | |
| CP-RF02-05 | Negativo | Intentar confirmar sin items. | El boton Confirmar venta permanece deshabilitado. | |
| CP-RF02-06 | Negativo | Quitar todos los items de una venta ya armada. | El total vuelve a $0,00 y no se puede confirmar. | |

---

## RF-03. Actualizar automaticamente el stock despues de cada venta

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF03-01 | Positivo | Anotar el stock de un producto, venderlo y volver a consultarlo. | El stock disminuye exactamente en la cantidad vendida. | |
| CP-RF03-02 | Positivo | Vender varios productos en una misma operacion. | El stock de cada uno se descuenta de forma independiente y correcta. | |
| CP-RF03-03 | Positivo | Consultar los movimientos de stock luego de una venta. | Existe un movimiento de tipo "venta" por cada producto vendido. | |
| CP-RF03-04 | Negativo | Provocar el rechazo de una venta por stock insuficiente. | Ningun producto de esa venta modifica su stock: la operacion es todo o nada. | |
| CP-RF03-05 | Positivo | Anular una venta registrada. | El stock de cada producto vuelve a su valor anterior. | |

---

## RF-04. Registrar productos nuevos

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF04-01 | Positivo | Alta con todos los campos completos. | El producto se registra y aparece en el listado. | |
| CP-RF04-02 | Positivo | Alta solo con los campos obligatorios (nombre y precio). | El producto se registra con los valores por defecto en el resto. | |
| CP-RF04-03 | Positivo | Alta con stock inicial mayor a cero. | Se genera un movimiento de tipo "entrada" por el stock inicial. | |
| CP-RF04-04 | Negativo | Alta con el nombre vacio. | Error en el campo Nombre. No se registra. | |
| CP-RF04-05 | Negativo | Alta con precio negativo. | Error en el campo Precio. No se registra. | |
| CP-RF04-06 | Negativo | Alta con un codigo de barras ya existente. | Se informa que el codigo esta en uso. No se registra. | |
| CP-RF04-07 | Negativo | Alta con fecha de vencimiento en formato invalido. | Se informa el formato esperado (AAAA-MM-DD). | |

---

## RF-05. Modificar los datos de un producto existente

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF05-01 | Positivo | Editar el precio de un producto y guardar. | El listado refleja el precio nuevo. | |
| CP-RF05-02 | Positivo | Editar el stock minimo de un producto por debajo de su stock actual. | El producto deja de aparecer en la alerta de bajo stock. | |
| CP-RF05-03 | Positivo | Editar el stock actual manualmente. | Se registra un movimiento de tipo "ajuste" con el valor anterior y el nuevo. | |
| CP-RF05-04 | Positivo | Cambiar la categoria de un producto. | El listado muestra la categoria nueva. | |
| CP-RF05-05 | Negativo | Guardar dejando el nombre vacio. | Error en el campo Nombre. No se guardan los cambios. | |
| CP-RF05-06 | Negativo | Asignar un codigo de barras que ya tiene otro producto. | Se informa el conflicto. No se guardan los cambios. | |
| CP-RF05-07 | Positivo | Cancelar la edicion sin guardar. | El producto conserva sus datos originales. | |

---

## RF-06. Eliminar productos del inventario

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF06-01 | Positivo | Eliminar un producto recien creado, sin ventas. | Se pide confirmacion y el producto desaparece del inventario. | |
| CP-RF06-02 | Positivo | Eliminar un producto que participa en ventas. | El producto se desactiva en vez de borrarse y el sistema lo informa, para no romper el historial. | |
| CP-RF06-03 | Negativo | Pulsar Eliminar y cancelar la confirmacion. | El producto permanece sin cambios. | |
| CP-RF06-04 | Positivo | Verificar el historial tras desactivar un producto vendido. | Las ventas anteriores siguen mostrando el producto correctamente. | |

> **Observacion de alcance:** el RF-06 no define que hacer con los productos
> que ya fueron vendidos. La solucion adoptada (desactivar en lugar de
> borrar) se documenta aqui porque es la unica forma de cumplir a la vez el
> RF-06 y el RF-14, que exige conservar el historial de ventas.

---

## RF-07. Buscar productos por nombre o codigo de barras

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF07-01 | Positivo | Buscar "chocolate". | Se listan solo los productos cuyo nombre contiene el texto. | |
| CP-RF07-02 | Positivo | Buscar por una parte del nombre ("gase"). | La busqueda encuentra "Gaseosa Cola 500ml". | |
| CP-RF07-03 | Positivo | Buscar el codigo `7790002001`. | Se muestra el producto correspondiente. | |
| CP-RF07-04 | Positivo | Buscar en mayusculas ("CHOCOLATE"). | El resultado es el mismo que en minusculas. | |
| CP-RF07-05 | Positivo | Vaciar el buscador. | Se vuelve a listar el inventario completo. | |
| CP-RF07-06 | Negativo | Buscar un texto inexistente ("zzzzz"). | Mensaje indicando que no se encontraron productos. | |
| CP-RF07-07 | Positivo | Buscar un producto sin codigo de barras por su nombre. | Se encuentra igual y se muestra la marca "sin codigo". | |

---

## RF-08. Registrar distintos medios de pago

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF08-01 | Positivo | Abrir el selector de medio de pago en una venta. | Se listan los medios activos: Efectivo, Debito, Credito y Transferencia. | |
| CP-RF08-02 | Positivo | Registrar una venta con cada medio activo. | Cada venta queda asociada a su medio de pago. | |
| CP-RF08-03 | Positivo | Verificar el medio de pago en el historial. | Coincide con el seleccionado al confirmar. | |
| CP-RF08-04 | Negativo | Verificar que no aparezca un medio inactivo (Cheque). | El medio deshabilitado no figura entre las opciones. | |
| CP-RF08-05 | Positivo | Consultar el reporte de ventas del dia. | Los medios de pago aparecen agrupados con su cantidad y su total. | |

---

## RF-09. Generar reportes de ventas por dia, semana y mes

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF09-01 | Positivo | Consultar el reporte con periodo "Hoy". | Se muestran total vendido, cantidad de ventas y ticket promedio del dia. | |
| CP-RF09-02 | Positivo | Consultar con periodo "Ultimos 7 dias". | El total es mayor o igual al del dia. | |
| CP-RF09-03 | Positivo | Consultar con periodo "Ultimos 30 dias". | El total es mayor o igual al de la semana. | |
| CP-RF09-04 | Positivo | Verificar el total contra el historial del mismo periodo. | Ambos valores coinciden. | |
| CP-RF09-05 | Positivo | Usar un rango de fechas personalizado. | El reporte se limita al rango indicado. | |
| CP-RF09-06 | Negativo | Consultar un periodo sin ventas. | Mensaje de "sin datos" y totales en cero. | |
| CP-RF09-07 | Negativo | Indicar una fecha "desde" posterior a la fecha "hasta". | Se informa que el rango es invalido. | |
| CP-RF09-08 | Positivo | Comprobar que las ventas anuladas no se sumen. | El total excluye las ventas en estado "anulada". | |

> **Observacion de alcance:** el RF-09 nombra los periodos dia, semana y mes
> pero no define si son calendario o ventanas moviles. Se implementaron como
> ventanas moviles terminadas en el dia de hoy (1, 7 y 30 dias) y asi se
> prueban, para que el resultado no dependa del dia de la semana en que se
> ejecuten las pruebas.

---

## RF-10. Mostrar los productos mas vendidos

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF10-01 | Positivo | Abrir el modulo Mas vendidos. | Se muestra el ranking con posicion, producto, unidades y total. | |
| CP-RF10-02 | Positivo | Verificar el orden de la tabla. | Las unidades van de mayor a menor. | |
| CP-RF10-03 | Positivo | Filtrar por un rango de fechas. | El ranking se recalcula con las ventas del rango. | |
| CP-RF10-04 | Positivo | Contrastar el primer puesto con el reporte de ventas. | Coincide con el producto de mayor cantidad. | |
| CP-RF10-05 | Negativo | Consultar un rango sin ventas. | Mensaje indicando que no se pueden generar estadisticas. | |

---

## RF-11. Registrar productos danados o vencidos

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF11-01 | Positivo | Registrar una baja con motivo Vencido. | La baja queda registrada con su motivo, fecha y cantidad. | |
| CP-RF11-02 | Positivo | Registrar una baja con motivo Danado. | Idem, con motivo "danado". | |
| CP-RF11-03 | Positivo | Consultar el historial de bajas. | Aparecen las bajas ordenadas de la mas reciente a la mas antigua. | |
| CP-RF11-04 | Negativo | Registrar sin seleccionar producto. | Se informa que debe seleccionar un producto. | |
| CP-RF11-05 | Negativo | Registrar con cantidad 0. | Se informa que la cantidad debe ser mayor a cero. | |

---

## RF-12. Descontar automaticamente dichos productos del inventario

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF12-01 | Positivo | Anotar el stock, registrar una baja de 5 unidades y volver a consultarlo. | El stock disminuye exactamente en 5. | |
| CP-RF12-02 | Positivo | Consultar los movimientos de stock del producto. | Existe un movimiento de tipo "baja" por la cantidad registrada. | |
| CP-RF12-03 | Negativo | Intentar una baja mayor al stock disponible. | La operacion se rechaza y el stock no se modifica. | |
| CP-RF12-04 | Positivo | Dar de baja todo el stock de un producto. | El stock queda en 0 y el producto aparece en la alerta de bajo stock. | |

---

## RF-13. Mostrar alertas cuando el stock sea bajo

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF13-01 | Positivo | Abrir el Dashboard. | El panel "Productos con stock bajo" lista los productos en o por debajo del minimo. | |
| CP-RF13-02 | Positivo | Verificar el valor limite con "Pan Lactal" (stock 10, minimo 10). | El producto aparece en la alerta: la condicion incluye la igualdad. | |
| CP-RF13-03 | Positivo | Verificar un producto con stock 0. | Aparece destacado como caso critico. | |
| CP-RF13-04 | Positivo | Vender unidades hasta cruzar el minimo. | El producto pasa a figurar en la alerta al recargar el Dashboard. | |
| CP-RF13-05 | Positivo | Subir el stock de un producto por encima del minimo. | El producto desaparece de la alerta. | |

---

## RF-14. Consultar el historial de ventas

| ID | Tipo | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-RF14-01 | Positivo | Abrir el Historial de ventas. | Se listan las ventas de la mas reciente a la mas antigua. | |
| CP-RF14-02 | Positivo | Desplegar el detalle de una venta. | Se muestran productos, cantidades, precios unitarios y subtotales. | |
| CP-RF14-03 | Positivo | Verificar que el total coincide con la suma de los subtotales. | Ambos valores coinciden. | |
| CP-RF14-04 | Positivo | Filtrar por un rango de fechas. | Solo se listan las ventas del rango. | |
| CP-RF14-05 | Positivo | Verificar una venta anulada. | Figura con el estado "anulada" y sin la opcion de volver a anularla. | |
| CP-RF14-06 | Negativo | Filtrar por un rango sin ventas. | Mensaje indicando que no hay ventas en el periodo. | |

---

## Resumen de cobertura por requerimiento

| RF | Descripcion | Casos |
|---|---|---|
| RF-01 | Iniciar sesion | 7 |
| RF-02 | Registrar ventas | 6 |
| RF-03 | Actualizar stock tras la venta | 5 |
| RF-04 | Registrar productos nuevos | 7 |
| RF-05 | Modificar productos | 7 |
| RF-06 | Eliminar productos | 4 |
| RF-07 | Buscar productos | 7 |
| RF-08 | Medios de pago | 5 |
| RF-09 | Reportes por periodo | 8 |
| RF-10 | Productos mas vendidos | 5 |
| RF-11 | Registrar danados o vencidos | 5 |
| RF-12 | Descontar del inventario | 4 |
| RF-13 | Alertas de stock bajo | 5 |
| RF-14 | Historial de ventas | 6 |
| **Total** | **14 de 14 requerimientos cubiertos** | **81** |
