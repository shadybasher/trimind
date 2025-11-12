# Dockerfile for BullMQ Proxy Worker

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY index.js ./

# Create non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

# Health check (worker doesn't expose HTTP, so check process)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD pgrep -f "node index.js" || exit 1

# Run worker
CMD ["node", "index.js"]
