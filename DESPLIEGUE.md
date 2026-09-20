# Despliegue de la demo

Kiosky se publica como demostracion para la presentacion, con el mismo
esquema que StockARG: la API en la EC2 compartida y el frontend en
Cloudflare Workers.

```
navegador -> kiosky.aaronbrumat.com.ar      (Cloudflare Workers, archivos estaticos)
          -> api-kiosky.aaronbrumat.com.ar  (Caddy, TLS)
                -> 127.0.0.1:8003 -> contenedor kiosky-api (modo memoria)
```

## Por que en modo memoria

La EC2 tiene 1 GB compartido entre Data Center, BarberApp, StockARG y un
PostgreSQL. Un MySQL sumaria unos 400 MB y pondria en riesgo a las demas.

En modo memoria la API no necesita base de datos: carga el mismo juego de
datos que `database/seed.sql` y vuelve a el en cada reinicio. Para una demo
es lo que conviene, porque siempre arranca en un estado conocido. El codigo
sigue soportando MySQL tal cual lo define la documentacion; el modo se elige
con `DB_MODE`.

La interfaz lo avisa en pantalla: el aviso de modo demostracion aparece solo
cuando el backend informa que corre en memoria.

## 1. API en el servidor

Una sola vez, en la EC2:

```bash
git clone https://github.com/47103032-web/Proyecto-Kiosky.git ~/kiosky
cd ~/kiosky
cp deploy/.env.example deploy/.env
```

Generar el secreto y pegarlo en `deploy/.env`:

```bash
openssl rand -hex 32
```

Levantar el contenedor:

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
```

Si `JWT_SECRET` esta vacio, compose se niega a arrancar. Es a proposito.

Verificar que responde:

```bash
curl http://127.0.0.1:8003/api/salud
```

Tiene que devolver `"base_de_datos":"memory"`.

## 2. Caddy

Agregar el bloque de [deploy/Caddyfile.fragmento](deploy/Caddyfile.fragmento)
al final de `/etc/caddy/Caddyfile`, validar y recargar:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

En el DNS, `api-kiosky` apunta a la IP de la EC2, igual que `api-stockarg`.

## 3. Frontend en Cloudflare

Desde `frontend/`, compilando con la URL publica de la API:

```bash
VITE_API_URL=https://api-kiosky.aaronbrumat.com.ar/api npm run build
npx wrangler deploy
```

`wrangler.jsonc` ya declara el dominio `kiosky.aaronbrumat.com.ar` y hace que
cualquier ruta devuelva `index.html`, que es lo que necesita React Router.

## 4. Actualizar la demo

Despues de cada cambio en `main`:

```bash
cd ~/kiosky && git pull
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
```

Y volver a publicar el frontend si cambio algo en `frontend/`.

## Recursos

La API en memoria usa unos 22 MB. El contenedor tiene un limite de 160 MB
para que un error no la haga crecer y afecte a las otras aplicaciones.
