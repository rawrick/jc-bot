FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM base AS test
COPY . .
RUN npm test

FROM base AS production
COPY . .
CMD ["npm","start"]