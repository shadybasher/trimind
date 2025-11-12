/**
 * BullMQ Queue Configuration
 * Manages async job queue for AI processing tasks
 */

import { Queue } from "bullmq";
import Redis from "ioredis";

// Create Redis connection for BullMQ
const connection = new Redis(process.env.BULLMQ_REDIS_URL || process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  family: 0, // Use IPv4 and IPv6
});

/**
 * Job data structure for AI processing tasks
 */
export interface AITaskJob {
  sessionId: string;
  userId: string;
  messageId: string;
  message: string;
  timestamp: string;
}

// Create AI tasks queue (renamed from llm-tasks for consistency with Python service)
export const aiTasksQueue = new Queue<AITaskJob>("ai-tasks", {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: "exponential",
      delay: 2000, // Start with 2s delay, then 4s, 8s
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
      count: 5000, // Keep max 5000 failed jobs
    },
  },
});

// Legacy queue name alias for backward compatibility
export const llmTasksQueue = aiTasksQueue;

// Export connection for use in workers
export { connection };
