FROM node:24-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build

ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci

COPY apps/api/nest-cli.json apps/api/tsconfig.json apps/api/tsconfig.build.json ./
COPY apps/api/prisma.config.ts ./
COPY apps/api/prisma ./prisma
COPY apps/api/src ./src

RUN DATABASE_URL="postgresql://user:password@localhost:5432/support_rag_build?schema=public" npx prisma generate
RUN npm run build

FROM build AS migrate

ENV NODE_ENV=production

CMD ["npm", "run", "prisma:migrate:deploy"]

FROM build AS production-deps

RUN npm prune --omit=dev && npm cache clean --force

FROM base AS runtime

ENV NODE_ENV=production

COPY apps/api/package.json apps/api/package-lock.json ./
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY datasets ./datasets

USER node

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
