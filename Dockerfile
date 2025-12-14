FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS prod

COPY pnpm-lock.yaml /app
WORKDIR /app
RUN pnpm fetch --prod

COPY . /app
RUN pnpm run build

FROM base AS run
COPY --from=prod /app/node_modules /app/node_modules
COPY --from=prod /app/build /app/build
EXPOSE 3000
CMD [ "pnpm", "start" ]
