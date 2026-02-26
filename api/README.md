# 2a5 API

## Development
You need to install on your local workstation:
- git
- nodejs
- npm
- docker

Prepare your local config:
```bash
cp ./.env.development.template ./.env.development.local
```
Do changes in ./.env.development.local now.

Install your environment
```bash
npm install
```

Generate the typescript prisma client:
```bash
npm run prismagenerate
```

Push all migrations to the postgresql database. This is only needed on first start when docker volume is initially created.
```bash
npm run prismadbpush
```

### Run the nodejs development server:
```bash
npm run dev
```

Happy coding. API is available at [http://localhost:3000/api](http://localhost:3000/api)
Check your API via curl:
```bash
source ./.env.development.local && curl localhost:3000/api/token/correct -H "Accept: application/json" -H "Authorization: Bearer ${ADMIN_TOKEN}"
```
Expected response: `{"message":"success"}`

If you do changes to the database schema run (while db is up)
```bash
npm run prismamigratedev
```

Stop it with CTRL+C

### Dry Run App Building
```bash
npm run build
npm run start
```

## Testing
Run Cypress tests (make sure db docker and local node server are running)

__Warning__: This command truncates your table content!
```bash
npm run test
```

## Linting
Run to check for linting errors:
```bash
npx eslint .
```

## Cleanup locally

Delete all generated files
```bash
rm -rf .next/ node_modules/ next-env.d.ts cypress/screenshots/ cypress/videos/ generated/
```

