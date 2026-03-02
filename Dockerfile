FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src

# Production stage
FROM base AS production

CMD ["npm", "start"]