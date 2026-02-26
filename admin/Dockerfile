FROM node:22-slim AS base

# Install curl for healthcheck
RUN apt-get update -y && apt-get install -y curl

######################################################################################
FROM base AS proddeps

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

######################################################################################
FROM base AS devdeps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

######################################################################################
FROM base AS builder
WORKDIR /app

COPY --from=devdeps /app/node_modules ./node_modules
COPY index.ts package-lock.json package.json tsconfig.json ./
RUN npm run build

######################################################################################
FROM base AS runner

RUN groupadd -g 1001 nodejs
RUN useradd -u 1001 -g nodejs -m -d /home/nodejs nodejs

WORKDIR /home/nextjs/2a5-admin

COPY --from=proddeps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY public ./public
COPY views ./views
COPY --from=builder --chown=nodejs:nodejs /app/index.js ./

USER nodejs

EXPOSE 3002
ENV ADMIN_PORT 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD curl --fail http://localhost:3002/api/health || exit 1

CMD ["node", "index.js"]
