FROM node:24-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build

ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

COPY package.json package-lock.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN DATABASE_URL="postgresql://user:password@localhost:5432/support_rag_build?schema=public" npx prisma generate
RUN npm run build

FROM build AS migrate

ENV NODE_ENV=production

CMD ["npm", "run", "prisma:migrate:deploy"]

FROM build AS production-deps

RUN npm prune --omit=dev && npm cache clean --force

FROM base AS runtime

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

USER node

EXPOSE 3001

CMD ["node", "dist/main.js"]
