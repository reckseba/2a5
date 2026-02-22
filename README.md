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
Do changes now.

Run the database server (the compose override exposes the port to localhost):
```bash
docker compose --env-file ./.env up db -d --remove-orphans
```

Then switch over to the independent service READMEs:
- [API](./api/README.md)
- [APP](./app/README.md)

When you are done stop the database server:
```bash
docker compose --env-file ./.env down
```

# Deploy the entire stack with Docker
This section helps you spinning up the entire stack. Prisma, used as database orm, is locked inside a side car container which only spins up once in the beginning, while the api and frontend-app will only start if prisma quit successfully. This allows us to keep Prisma code away from our production container.

Prepare your local config (if not done already):
```bash
cp ./.env.template ./.env
```
Do changes now.

Spin up the entire stack:
```bash
docker compose --env-file ./.env up -d --build --remove-orphans
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

