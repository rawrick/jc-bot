FROM node:20-alpine AS base

COPY package*.json ./
RUN npm install

COPY src ./src

# Production stage
FROM base AS production

# CMD ["npm", "start"]
CMD ["node", "src/JohnnyCash.js"]