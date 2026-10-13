# Despliegue de la demo privada

Kiosky se publica como demostracion para la defensa del proyecto. **No es un
sitio publico**: todo el dominio esta detras de usuario y contrasena, y lleva
`X-Robots-Tag: noindex` para que no lo indexen los buscadores.

```
navegador -> kiosky.aaronbrumat.com.ar  (Caddy, TLS + usuario y contrasena)
                |
                +-- /api/*  -> 127.0.0.1:8003 -> contenedor kiosky-api
                +-- resto   -> /var/www/kiosky (frontend compilado)
```

El frontend y la API comparten dominio. Eso evita el problema de pedir
credenciales en peticiones entre origenes distintos, y de paso elimina CORS.

## Por que corre en modo memoria

La EC2 tiene 1 GB compartido entre Data Center, BarberApp, StockARG y un
PostgreSQL. Un MySQL sumaria unos 400 MB y pondria en riesgo a las demas.

En modo memoria la API no necesita base de datos: carga el mismo juego de
datos que `database/seed.sql` y vuelve a el en cada reinicio, asi que la demo
siempre arranca en un estado conocido. El codigo sigue soportando MySQL tal
cual lo define la documentacion; el modo se elige con `DB_MODE`.

La interfaz lo avisa en pantalla: el aviso de modo demostracion aparece solo
cuando el backend informa que corre en memoria.

## 1. API en el servidor

Una sola vez, en la EC2:

```bash
git clone https://github.com/47103032-web/Proyecto-Kiosky.git ~/kiosky
cd ~/kiosky
cp deploy/.env.example deploy/.env
openssl rand -hex 32      # pegar el resultado en deploy/.env
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
curl http://127.0.0.1:8003/api/salud      # debe decir "base_de_datos":"memory"
```

Si `JWT_SECRET` esta vacio, compose se niega a arrancar. Es a proposito: el
backend tambien rechaza arrancar en produccion con un secreto debil.

## 2. Frontend

Se compila en la maquina de desarrollo y se copia al servidor. Como el
frontend y la API comparten dominio, no hace falta configurar ninguna URL:

```bash
cd frontend
npm run build
scp -r dist/* usuario@servidor:/var/www/kiosky/
```

## 3. Caddy

Generar el hash de la contrasena **en el servidor**:

```bash
caddy hash-password
```

Pegar ese hash en [deploy/Caddyfile.fragmento](deploy/Caddyfile.fragmento),
agregar el bloque al final de `/etc/caddy/Caddyfile`, validar y recargar:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

En el DNS, `kiosky` apunta a la IP de la EC2, igual que `api-stockarg`.

## 4. Comprobar que quedo privada

```bash
curl -I https://kiosky.aaronbrumat.com.ar                        # 401
curl -I -u profesor:LACLAVE https://kiosky.aaronbrumat.com.ar    # 200
```

Si la primera responde 200, el bloque de `basic_auth` no se aplico.

## 5. Actualizar la demo

```bash
cd ~/kiosky && git pull
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build
```

Y volver a copiar `frontend/dist` si cambio algo del frontend.

## Recursos

La API en memoria usa unos 22 MB. El contenedor tiene un limite de 160 MB
para que un error no la haga crecer y afecte a las otras aplicaciones.

## Si alguna vez se publica

`frontend/wrangler.jsonc` quedo preparado para servir el frontend desde
Cloudflare Workers, como hace StockARG. En ese caso el frontend y la API
pasan a vivir en dominios distintos: hay que compilar con `VITE_API_URL`
apuntando a la API y quitar el `basic_auth`, porque no funciona bien con
peticiones entre origenes.
