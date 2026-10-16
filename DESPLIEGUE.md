# Puesta en marcha de Kiosky

El sistema se ejecuta en una computadora, abriendo el proyecto en Visual Studio
Code. Son dos procesos que corren a la vez:

```
navegador  ->  frontend (Vite, puerto 5173)
                   |
                   +--  /api/*  ->  backend (Express, puerto 4000)
                                        |
                                        +--  MySQL 8, o juego de datos en memoria
```

El servidor de desarrollo del frontend redirige al backend todas las peticiones
cuya direccion empieza con `/api`, de modo que para el navegador ambos conviven
en el mismo origen y no hay que configurar nada.

## Requisitos

- Node.js 20 o superior.
- Un navegador con soporte vigente.
- MySQL 8 **solo si** se quiere trabajar con persistencia. El sistema funciona
  sin el.

## 1. Backend

```bash
cd backend
npm install
npm run dev
```

Queda escuchando en `http://localhost:4000`. Para comprobar contra que motor
arranco:

```bash
curl http://localhost:4000/api/salud
```

Si no encuentra una base de datos disponible, continua con el juego de datos de
`database/seed.sql` cargado en memoria y lo avisa por consola. Eso es
intencional: el sistema arranca sin configuracion previa.

## 2. Frontend

En una **segunda** terminal:

```bash
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173` e ingresar con uno de los dos usuarios del juego
de datos de prueba. La interfaz muestra un aviso en pantalla cuando el backend
corre en modo memoria, de manera que la condicion nunca queda oculta.

## 3. Las pruebas

```bash
cd backend
npm test
```

Tienen que pasar **65 pruebas, 0 fallos**. Es lo mismo que ejecuta la
integracion continua en cada cambio enviado al repositorio.

## Modo memoria y modo MySQL

El modo se elige con la variable `DB_MODE`:

| Valor | Comportamiento |
|---|---|
| `auto` | Intenta conectar a MySQL y, si no puede, sigue en memoria. Es el valor por defecto. |
| `mysql` | Exige la conexion. Si falla, el servidor no arranca. |
| `memory` | No intenta conectar. Carga el juego de datos de prueba. |

Para trabajar contra MySQL, crear la base y cargar los datos:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p kiosky < database/seed.sql
```

Y copiar `backend/.env.example` a `backend/.env` con las credenciales.

## Por que la demostracion corre en memoria

Dos motivos, y el segundo es el que importa para la presentacion:

1. No hace falta tener un servidor MySQL instalado y en funcionamiento, asi que
   el sistema arranca en cualquier computadora con Node.js y en pocos segundos.
2. El sistema vuelve al juego de datos inicial en cada reinicio. Eso significa
   que los valores de referencia documentados en
   [docs/testing](docs/testing/03-documentacion-tecnica-testing.md) son
   verificables en cualquier momento: el reporte del dia tiene que dar $14.500
   con 3 ventas, y el ranking tiene que encabezarlo Chocolate Barra 30g con 11
   unidades. Un reporte que devuelve algun numero no prueba nada; uno que
   devuelve el numero esperado, si.

El soporte de MySQL permanece intacto, y el trabajo de base de datos de la
integracion continua lo verifica en cada cambio: levanta un MySQL 8 de cero,
aplica `schema.sql` y `seed.sql`, arranca la API contra esa base real y
comprueba que responda y que el catalogo devuelva los 12 productos esperados.

## Empaquetado en contenedor

La carpeta [deploy/](deploy/) conserva la configuracion para ejecutar el backend
en un contenedor, con su archivo de composicion y su ejemplo de variables de
entorno. No es necesaria para la demostracion, y se mantiene en el repositorio
como alternativa de ejecucion.
