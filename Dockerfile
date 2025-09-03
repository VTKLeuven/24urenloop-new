# Simple dev Dockerfile for Next.js + Prisma CLI usage
FROM node:20-alpine

WORKDIR /app

# Install Node deps first for better caching
COPY package*.json ./
RUN npm ci

# Copy the rest
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

# Default dev command; overridden in compose if needed
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
