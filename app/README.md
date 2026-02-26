# 2a5 app

## Development
You need to install on your local workstation:
- git
- nodejs
- npm
- docker

Install your environment
```bash
npm install
```

Run the nodejs development server (It supports hot reload):
```bash
npm run dev
```

Start coding and open [http://localhost:3001](http://localhost:3001) with your browser of choice to check the result. The system supports hot reload.

Stop it with CTRL+C

## Linting
Run to check for linting errors:
```bash
npx eslint .
```

## Cleanup locally

Delete all generated files
```bash
rm -rf .next/ node_modules/ next-env.d.ts
```

