FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src

FROM base AS production

CMD ["node", "src/JohnnyCash.js"]