# ========================================
# Stage 1: Builder
# ========================================
FROM python:3.11-slim as builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY services/python-api/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ========================================
# Stage 2: Runtime
# ========================================
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    libatomic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Ensure PATH includes user-installed packages
ENV PATH=/root/.local/bin:$PATH

# Copy Prisma schema from project root
COPY prisma ./prisma

# Generate Prisma Client for Python
RUN prisma generate --schema=./prisma/schema.prisma

# Copy application code
COPY services/python-api/app ./app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f -X GET http://localhost:8000/health || exit 1

# Run application
# Single worker to avoid Prisma Client sync issues between processes
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
