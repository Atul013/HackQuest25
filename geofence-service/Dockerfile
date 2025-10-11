FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production --silent

# Copy source
COPY . .

EXPOSE 8080
CMD ["node", "index.js"]
