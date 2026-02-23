# 2a5 Admin

## Development

Install your environment
```bash
npm install
```

Prepare your local config:
```bash
cp ./.env.development.sample ./.env.development.local
```
Do changes in ./.env.development.local now and make sure you share the same ADMIN_TOKEN as in [api](../api/README.md).

Check that your API is running as expected and that the Bearer token matches:
```bash
source .env.development.local && curl localhost:3000/api/token/correct -H "Accept: application/json" -H "Authorization: Bearer ${ADMIN_TOKEN}"
```
Expected response: `{"message":"success"}`

Run the nodejs development server:
```bash
npm run dev
```

Check linting:
```bash
npm run lint
```

Start coding and open [http://localhost:3002](http://localhost:3002) with your browser of choice to check the result. The system supports hot reload.

Stop it with CTRL+C

## Cleanup locally

Delete all generated files
```bash
rm -rf node_modules/ index.js
```

