FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM node:22-alpine
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/.output ./.output

USER nodejs

EXPOSE 3000
ENV NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
