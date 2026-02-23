FROM node:22-slim AS base

# Install curl for healthcheck
RUN apt-get update -y && apt-get install -y curl

######################################################################################
FROM base AS proddeps

# No Dev-Dependencies: not calling this because only standalone will be deployed
# ENV NODE_ENV=production

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

######################################################################################
FROM base AS builder
WORKDIR /app
COPY components ./components
COPY lib ./lib
COPY --from=proddeps /app/node_modules ./node_modules
COPY pages ./pages
COPY public ./public
COPY styles ./styles
COPY .eslintrc.json next.config.js package-lock.json package.json postcss.config.js tailwind.config.js tsconfig.json ./
RUN npm run build

######################################################################################
FROM base AS runner

ENV NODE_ENV=production

RUN groupadd -g 1001 nodejs
RUN useradd -u 1001 -g nodejs -m -d /home/nextjs nextjs

WORKDIR /home/nextjs/2a5-app

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001
ENV PORT 3001

# needed for the healthcheck to work
ENV HOSTNAME 0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD curl --fail http://localhost:3001/api/health || exit 1

CMD ["node", "server.js"]
