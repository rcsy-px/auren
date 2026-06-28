FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ARG VERSION=dev
ENV NODE_ENV=production
ENV PORT=8080
ENV AUREN_DATA_DIR=/app/data
ENV AUREN_VERSION=$VERSION
LABEL org.opencontainers.image.title="Auren Dashboard"
LABEL org.opencontainers.image.description="Self-hosted browser start page and home lab dashboard"
LABEL org.opencontainers.image.version=$VERSION
RUN apk add --no-cache su-exec
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server.js ./server.js
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN mkdir -p /app/data && chown -R node:node /app
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8080/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
