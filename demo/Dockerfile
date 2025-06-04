# Use Node.js LTS version as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock (if available)
COPY package.json ./
COPY yarn.lock* ./

# Install dependencies
RUN yarn

# Copy the rest of the application code
COPY . .

# Build the application
RUN yarn build

# Expose the port the app runs on
EXPOSE 8080

# Start the application in development mode with host binding for Docker
CMD ["yarn", "start-dev", "--host", "0.0.0.0", "--port", "8080"]
