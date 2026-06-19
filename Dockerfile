FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV AUREN_DATA_DIR=/app/data
COPY --from=build /app/dist ./dist
COPY server.js ./server.js
RUN mkdir -p /app/data
EXPOSE 8080
CMD ["node", "server.js"]
