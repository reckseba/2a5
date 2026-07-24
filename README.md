# 2a5
Open Source URL-Shortener with separated front-end &amp; back-end parts based on React, Next.js, Typescript, TailwindCSS, Prisma, PostgreSQL &amp; Docker.

## The Idea
Long URLs are ugly and get misinterpreted very often because of there complicated query parameters. To keep short messages short, a url-shortener is here to save the day.

## Features

### URL Shortening
- Turn long URLs into short links with automatically generated short codes (3–5 alphanumeric characters).
- A QR-code is generated for every short link.
- Result view with a one-click copy-to-clipboard button.
- URL validation rejects malformed URLs and non-ICANN / invalid top-level domains.
- Recursive-shortening protection prevents shortening links that point back at the shortener itself.
- Duplicate detection returns the existing short link instead of creating a new one for an already known long URL.
- Redirect handling with a permanent redirect for active links, a dedicated "gone" page with an abuse warning for deleted links, and a not-found page for unknown codes.

### Abuse Prevention & Moderation
- Hostname blacklist and whitelist to ban or explicitly allow specific host names; blacklisted hosts are refused at creation time.
- IP-based ban list using hashed, time-limited entries to block abusive submitters — raw IP addresses are never stored.
- Moderation review workflow: links are tracked as checked or unchecked and can be reviewed, whitelisted, blacklisted, or deleted by an administrator.
- Soft-delete of abusive links, which stay flagged as deleted rather than being removed.

### Admin Panel
- A separate, server-side-rendered admin application (Express + Pug).
- Dashboards listing unchecked links, checked links, deleted links, and blacklisted / whitelisted hostnames.
- Actions to check, delete, whitelist, and blacklist individual links.
- Communicates with the backend over HTTP and never accesses the database directly.

### Privacy
- No trackers, no ads and no log files.
- IP addresses are only ever stored as hashes.

### Split / Multi-Service Architecture
- Three independent services: a public frontend, a backend API, and an admin panel, each running on its own port.
- The frontend never touches the database — it talks to the API over HTTP, including for server-side redirects.
- Prisma runs isolated in a one-shot sidecar container so ORM and migration code stays out of the runtime API container; the API and frontend only start after it exits successfully.

### Security & Authentication
- Bearer-token authentication protects the backend; only the public redirect lookup, new-link creation, and health check are unauthenticated, while all management routes require the token.

### Hardened Database Access Model
- Least-privilege PostgreSQL roles: a dedicated schema owner owns the schema instead of the superuser.
- A restricted application role that can only read, insert and update — it cannot delete rows and cannot create or drop tables.
- A separate ORM / migration role that owns and creates tables with full access, used only for schema evolution via Prisma.
- Default `PUBLIC` privileges are revoked, with explicit grants wiring the application role's access to ORM-created objects.

### Tech Stack
- React and Next.js (Pages Router with SSR), TypeScript, TailwindCSS, Prisma ORM, PostgreSQL, Docker Compose, Dokploy for production deployment, Cypress for API end-to-end tests and ESLint.

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

Run the database server with the following command. It will read the `compose.yaml`, the `compose.override.yaml` and the `compose.override.db.yaml`. The `compose.override.yaml` defines a local port binding for you to be able to access the database from outside the docker network. This port binding shall not exist on a production deployment and is therefore missing in the `compose.yaml`. The `compose.override.db.yaml` makes sure the `init-user-db.sh` is not mounted to the database container, which circumvents creating dedicated roles for accessing the database. This is necessary because Prisma uses the concept of [shadow databases](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database) which requires full access when running `prisma migrate dev`.
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
Create the dokploy network (only necessary locally):
```bash
docker network create dokploy-network
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

You may remove the network:
```bash
docker network rm dokploy-network
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

## Connect to the database

```bash
# make sure you have setup a docker context
docker context use dokploy

# get the name of the internal network
docker network ls

# get the real name
docker ps

# run the sidecar
docker run -d \
  --name db-tunnel \
  --network dokploy-network --network urlshortener-prod-h8qr8e_internal \
  --rm -p 5430:5430 \
  alpine/socat \
  tcp-listen:5430,fork,reuseaddr tcp-connect:urlshortener-prod-h8qr8e-db-1:5432
```

Now you can use DBeaver to connect via SSH to your VPC, where TCP Port 5430 is listening.

Don't forget to stop it when done:
```bash
docker container stop db-tunnel
```
