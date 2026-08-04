FROM node:20-bullseye

# Create app directory
WORKDIR /app

# Copy package manifests first to leverage layer caching
COPY package*.json ./
COPY order-service/package*.json order-service/

# Install dependencies (including devDeps for vitest)
RUN npm ci || npm install

# Copy the rest of the repository
COPY . .

# Default command: run the integration smoke test. Environment variables
# ORDER_SERVICE_URL and USER_SERVICE_URL should be provided at runtime.
CMD ["/bin/sh", "-c", "npx vitest run tests/integration/compose-smoke.test.ts --run --reporter=dot"]
