# Step 1: Build the app
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Step 2: Serve the built files with a simple static server
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from previous stage
COPY --from=build /app/dist ./dist

# Expose port 8080
EXPOSE 8080

# Serve the static files on port 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
