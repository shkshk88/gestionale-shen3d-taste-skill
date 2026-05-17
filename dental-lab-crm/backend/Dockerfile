FROM node:20-slim

# Install curl for healthcheck + OpenSSL for Prisma
RUN apt-get update && apt-get install -y curl openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (dev deps needed for nest build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Expose port
EXPOSE 3000

# Start command
CMD ["./entrypoint.sh"]
