/**
 * BullMQ Proxy Worker
 *
 * Architecture:
 * 1. Polls Redis queue for AI processing jobs
 * 2. Forwards jobs to Python API via HTTP POST
 * 3. Handles retries and dead-letter queue
 */

// Load .env file for local development (Docker Compose injects env vars directly)
const fs = require("fs");
const envPath = "../../.env";
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}
const { Worker } = require("bullmq");
const Redis = require("ioredis");

// Configuration from environment variables
const REDIS_URL = process.env.BULLMQ_REDIS_URL || process.env.REDIS_URL;
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";
const SHARED_SECRET = process.env.SHARED_SECRET;

if (!REDIS_URL) {
  console.error("❌ REDIS_URL or BULLMQ_REDIS_URL environment variable is required");
  process.exit(1);
}

if (!SHARED_SECRET) {
  console.error("❌ SHARED_SECRET environment variable is required");
  process.exit(1);
}

// Redis connection for BullMQ
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  family: 0, // Use IPv4 and IPv6
});

/**
 * Job processor function
 * Forwards AI tasks to Python API for processing
 */
async function processAITask(job) {
  const { sessionId, userId, messageId, message, timestamp } = job.data;

  console.log(
    `[BullMQ Proxy] Processing job ${job.id} - messageId: ${messageId}, sessionId: ${sessionId}`
  );

  try {
    // Forward job to Python API
    const response = await fetch(`${PYTHON_API_URL}/api/v1/jobs/process-ai-job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SHARED_SECRET}`,
      },
      body: JSON.stringify({
        sessionId,
        userId,
        messageId,
        message,
        timestamp,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`[BullMQ Proxy] Job ${job.id} completed successfully`);

    return result;
  } catch (error) {
    console.error(`[BullMQ Proxy] Job ${job.id} failed:`, error.message);
    throw error; // Re-throw to trigger BullMQ retry mechanism
  }
}

// Create BullMQ Worker
const worker = new Worker("ai-tasks", processAITask, {
  connection,
  concurrency: 5, // Process up to 5 jobs concurrently
  limiter: {
    max: 10, // Maximum 10 jobs
    duration: 1000, // Per 1 second
  },
});

// Event listeners
worker.on("ready", () => {
  console.log("✅ [BullMQ Proxy] Worker is ready and polling for jobs...");
});

worker.on("completed", (job) => {
  console.log(`✅ [BullMQ Proxy] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ [BullMQ Proxy] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("❌ [BullMQ Proxy] Worker error:", err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[BullMQ Proxy] SIGTERM received, closing worker...");
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[BullMQ Proxy] SIGINT received, closing worker...");
  await worker.close();
  await connection.quit();
  process.exit(0);
});

console.log(`
┌─────────────────────────────────────────┐
│  BullMQ Proxy Worker Started            │
├─────────────────────────────────────────┤
│  Redis URL: ${REDIS_URL.substring(0, 30)}...│
│  Python API: ${PYTHON_API_URL}     │
│  Concurrency: 5 workers                 │
│  Rate Limit: 10 jobs/second             │
└─────────────────────────────────────────┘
`);
