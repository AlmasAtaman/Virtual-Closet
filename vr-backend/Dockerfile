# Use Node.js 18 Alpine for smaller size
   FROM node:18-alpine

   # Install system dependencies needed for Playwright
   RUN apk add --no-cache \
       chromium \
       nss \
       freetype \
       freetype-dev \
       harfbuzz \
       ca-certificates \
       ttf-freefont

   # Tell Playwright to use the installed Chromium
   ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
       PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

   # Set working directory
   WORKDIR /app

   # Copy package files
   COPY package*.json ./

   # Install dependencies
   RUN npm ci --only=production

   # Copy source code
   COPY . .

   # Generate Prisma client
   RUN npx prisma generate

   # Expose port
   EXPOSE 3001

   # Start the application
   CMD ["npm", "start"]