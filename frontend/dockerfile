# Base image with Node
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port that React dev server uses
EXPOSE 3000

# Start the React development server
CMD ["npm", "start"]

