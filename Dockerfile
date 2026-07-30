FROM ghcr.io/pnpm/pnpm:11 AS builder

RUN pnpm runtime set node 24 -g

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm build


FROM caddy:latest

COPY --from=builder /app/dist /usr/share/caddy
