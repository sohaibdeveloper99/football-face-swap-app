FROM node:18-alpine

# Create app directory
WORKDIR /app/backend

# Install backend dependencies first (leverages Docker layer caching)
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy only the backend source code
COPY backend/ ./

# Environment
ENV NODE_ENV=production

# Expose backend port
EXPOSE 5000

# Start the backend server
CMD ["npm", "start"]
