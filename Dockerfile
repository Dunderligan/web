FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base as build
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM base AS run
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json drizzle ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/build ./build

EXPOSE 3000
CMD ["node", "build"]
