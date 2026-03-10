# 2a5
Open Source URL-Shortener with separated front-end &amp; back-end parts based on React, Next.js, Typescript, TailwindCSS, Prisma, PostgreSQL &amp; Docker.

## The Idea
Long URLs are ugly and get misinterpreted very often because of there complicated query parameters. To keep short messages short, a url-shortener is here to save the day.

## Reception
You should not trust any web-service out there. Therefore you should not trust 2a5.de either. There is no way I, as the administrator of 2a5.de, can assure you, as a client, that the software, that my server is running, is what is published here in this very repository. Whatever leaves your browser must be considered public. If you want nobody else to know, what links you are shortening: host your own instance. This tutorial teaches you how.

## Project Design
The goal was to make use of Server-Side-Rendering (SSR) inside a React-App, which was achieved by using Next.js. Database shall be handled by PostgreSQL, seamlessly integrated by Prisma as ORM. To discover errors early, Typescript was used for type definitions. Style was handled by TailwindCSS.

## Development
You need to install on your local workstation:
- git
- nodejs
- npm
- docker

Clone the repository:
```bash
git clone https://github.com/reckseba/2a5.git
```

Prepare your local config:
```bash
cp ./.env.template ./.env
```
You may change environment variable values now, which is purely optional at this point. Values contain meaningful defaults for local development. Deploying to production is described in the next section.

Run the database server: This will read the `compose.yaml` and the `compose.override.yaml`. The override defines a local port binding to be able to access the database from outside the docker network. This port binding shall not exist on production and is therefore missing in the `compose.yaml` in the first place. The `compose.override.db.yaml` makes sure the `init-user-db.sh` is not mounted to the database container, which circumvents creating dedicated roles for accessing the database. This is necessary because Prisma uses the concept of [shadow databases](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database) which require full access when running `prisma migrate dev`.
```bash
docker compose -f compose.yaml -f compose.override.yaml -f compose.override.db.yaml --env-file ./.env up db -d --remove-orphans
```

Then switch over to the independent service READMEs:
- [API](./api/README.md)
- [APP](./app/README.md)
- [Admin](./admin/README.md)

When you are done stop the database server:
```bash
docker compose --env-file ./.env down
```

You may run the down command with `-v` to remove volumes:
```bash
docker compose --env-file ./.env down -v
```

## Spin up the entire stack using Docker locally
This section helps you spinning up the entire stack locally. Prisma, used as database orm, is locked inside a side car container which only spins up once in the beginning, while the api and frontend-app will only start if prisma exits successfully. This allows to keep Prisma code away from our api container.

Prepare your local config (if not done already):
```bash
cp ./.env.template ./.env
```

Spin up the entire stack by referencing the `compose.yaml` and `compose.override.yaml` without `compose.override.db.yaml`. This way the `init-db-user.sh` is loaded and roles get created, while ports are exposed locally depending on `DOCKER_APP_PORT` and `DOCKER_ADMIN_PORT`:
```bash
docker compose -f compose.yaml -f compose.override.yaml --env-file ./.env up -d --build --remove-orphans
```

Open [http://localhost:3001](http://localhost:3001) check the result.

Check stack logs with:
```bash
docker compose logs -f
```

All containers shall say `healthy`:
```bash
docker compose ps
```

Stop all containers:
```bash
docker compose --env-file ./.env down
```

You may run the down command with `-v` to remove volumes:
```bash
docker compose --env-file ./.env down -v
```

## Deploy the entire stack to production using Dokploy

Prepare your local config (if not done already):
```bash
cp ./.env.template ./.env.prod
```
Do changes now and set strong secrets!

- Create a project
- Add this repo
- Set compose path: `./compose.yaml`
  - No service es exposing a port. All traffic will be routed through the proxy.
- Copy the content of your `.env.prod` file to the environment variables settings
- Hit Deploy
- Goto your domain and check if the login works



Migration Steps
```bash
docker exec -t 2a5-db-prod pg_dump -U 2a5-prod 2a5-prod --data-only --column-inserts > dump.sql
sed -i.bak -E 's/^INSERT INTO public\./INSERT INTO appschema./' dump.sql
# remove the migrations entry
# rename the last three alter statements
cat dump.sql | docker exec -i urlshortener-test-etuzuk-db-1 psql -U user_app -d shortener
```


