# 2a5 Admin

## Development

Install your environment
```bash
npm install
```

Prepare your local config:
```bash
cp ./.env.development.template ./.env.development.local
```
You may change environment variable values now, which is purely optional at this point. Values contain meaningful defaults for local development. Make sure you have matching values to the [api](../api/README.md).

Check that your API is running as expected and that the Bearer token matches:
```bash
source .env.development.local && curl localhost:3000/api/token/correct -H "Accept: application/json" -H "Authorization: Bearer ${API_BEARER_TOKEN}"
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

Start coding and open [http://localhost:3002](http://localhost:3002) and check the result. The system supports hot reload.

Stop it with CTRL+C

## Cleanup locally

Delete all generated files
```bash
rm -rf node_modules/ index.js
```

