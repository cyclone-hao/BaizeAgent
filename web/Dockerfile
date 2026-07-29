# base image
FROM node:22-alpine3.21 AS base
LABEL maintainer="takatost@gmail.com"

# Use Aliyun mirror for faster downloads in China
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# Use npmmirror registry for faster package downloads in China
RUN npm config set registry https://registry.npmmirror.com

RUN apk add --no-cache tzdata
RUN corepack enable
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_PUBLIC_BASE_PATH=
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com


# install packages
FROM base AS packages

WORKDIR /app/web

COPY package.json .
COPY pnpm-lock.yaml .

# Use packageManager from package.json
RUN corepack install

RUN pnpm install --frozen-lockfile

# build resources
FROM base AS builder
WORKDIR /app/web
COPY --from=packages /app/web/ .
COPY . .

# Pass API URLs as build args so Next.js bakes them into the static bundle
ARG CONSOLE_API_URL=http://localhost:5001
ARG APP_API_URL=http://localhost:5001
ARG MARKETPLACE_API_URL=https://marketplace.dify.ai
ARG MARKETPLACE_URL=https://marketplace.dify.ai
ENV CONSOLE_API_URL=${CONSOLE_API_URL}
ENV APP_API_URL=${APP_API_URL}
ENV MARKETPLACE_API_URL=${MARKETPLACE_API_URL}
ENV MARKETPLACE_URL=${MARKETPLACE_URL}

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build:docker


# production stage
FROM base AS production

ENV NODE_ENV=production
ENV EDITION=SELF_HOSTED
ENV DEPLOY_ENV=PRODUCTION
ENV CONSOLE_API_URL=http://127.0.0.1:5001
ENV APP_API_URL=http://127.0.0.1:5001
ENV MARKETPLACE_API_URL=https://marketplace.dify.ai
ENV MARKETPLACE_URL=https://marketplace.dify.ai
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV PM2_INSTANCES=2

# set timezone
ENV TZ=UTC
RUN ln -s /usr/share/zoneinfo/${TZ} /etc/localtime \
    && echo ${TZ} > /etc/timezone


WORKDIR /app/web
COPY --from=builder /app/web/public ./public
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./.next/static

COPY docker/entrypoint.sh ./entrypoint.sh


# global runtime packages
RUN pnpm add -g pm2 \
    && mkdir /.pm2 \
    && chown -R 1001:0 /.pm2 /app/web \
    && chmod -R g=u /.pm2 /app/web

ARG COMMIT_SHA
ENV COMMIT_SHA=${COMMIT_SHA}

USER 1001
EXPOSE 3000
ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
