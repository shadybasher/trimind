import { Queue } from "bullmq";
import Redis from "ioredis";

// Create Redis connection for BullMQ
const connection = new Redis(process.env.BULLMQ_REDIS_URL || process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  family: 0, // Use IPv4 and IPv6
});

// Create LLM tasks queue
export const llmTasksQueue = new Queue("llm-tasks", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

// Export connection for use in workers
export { connection };
