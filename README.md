# 2a5
Open Source URL-Shortener with combined front- &amp; back-end parts based on React, Next.js, Typescript, TailwindCSS, Prisma, PostgreSQL &amp; Docker for local testing.

## The Idea
Long URLs do not get interpreted as links very often. To keep short messages that contain links short, a url-shortener is needed.

## Reception
You should not trust any web-service out there. Therefore you should not trust 2a5.de either. There is no way I, as the administrator of 2a5.de, can assure you, as a client, that the software, that my server is running, is what is published here. Whatever leaves your browser must be considered public. If you want nobody else to know, what links you are shortening: host your own instance. This tutorial teaches you how.

## Project Design
The goal was to make use of Server-Side-Rendering (SSR) inside a React-App, which was achieved by using Next.js. Database shall be handled by PostgreSQL, seamlessly integrated by Prisma. To discover errors early, Typescript was used for type definitions. Style was handled by TailwindCSS.

# Development
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

Run the database server. This will read the `compose.yaml` and the `compose.override.yaml`. The override defines a local port binding to be able to access the database from outside the docker network. This port binding shall not exist on production. Secondly it makes sure the `init-user-db.sh` is not mounted to the database container, which circumvents creating dedicated roles for accessing the database. This is necessary because Prisma uses the concept of [shadow databases](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database) which require full access when running `prisma migrate dev`.
```bash
docker compose --env-file ./.env up db -d --remove-orphans
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
docker compose down -v
```

# Deploy the entire stack with Docker
This section helps you spinning up the entire stack. Prisma, used as database orm, is locked inside a side car container which only spins up once in the beginning, while the api and frontend-app will only start if prisma quit successfully. This allows us to keep Prisma code away from our production container.

Prepare your local config (if not done already):
```bash
cp ./.env.template ./.env
```
Do changes now and set strong secrets!

Spin up the entire stack by referencing the `compose.yaml` only (without override):
```bash
docker compose -f compose.yaml --env-file ./.env up -d --build --remove-orphans
```

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
docker compose down -v
```

# Cleanup locally

If you want to delete your docker postgres image (volume with database entries remains)
```bash
docker image rm postgres:14-alpine
```

Remove the volume
```bash
docker volume rm 2a5-db-data-development
```

DANGER! Erases all containers
```bash
docker container prune
```

DANGER! Erases all images
```bash
docker image prune -a
```

