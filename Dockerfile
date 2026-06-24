# Use the official Microsoft Playwright image
# This contains all the necessary dependencies for Chromium
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Ensure the browser runs in headless mode
ENV HEADLESS=true

# Command to run the agent
CMD ["node", "index.js"]
