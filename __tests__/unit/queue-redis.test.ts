import { Queue } from "bullmq";
import Redis from "ioredis";

describe("BullMQ Redis Integration Tests", () => {
  let testQueue: Queue;
  let connection: Redis;

  beforeAll(() => {
    connection = new Redis(process.env.BULLMQ_REDIS_URL || process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      family: 0,
    });

    testQueue = new Queue("test-queue", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    });
  });

  afterAll(async () => {
    await testQueue.close();
    connection.disconnect();
  });

  describe("Redis Connection", () => {
    it("should connect to Redis successfully", async () => {
      const pong = await connection.ping();
      expect(pong).toBe("PONG");
    });

    it("should be able to set and get values from Redis", async () => {
      const testKey = `test_${Date.now()}`;
      const testValue = "test_value";

      await connection.set(testKey, testValue);
      const result = await connection.get(testKey);

      expect(result).toBe(testValue);

      // Cleanup
      await connection.del(testKey);
    });
  });

  describe("BullMQ Queue Operations", () => {
    it("should create queue instance", () => {
      expect(testQueue).toBeDefined();
      expect(testQueue.name).toBe("test-queue");
    });

    it("should add job to queue successfully", async () => {
      const testData = {
        task: "test_task",
        timestamp: Date.now(),
      };

      const job = await testQueue.add("test-job", testData);

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.data).toMatchObject(testData);

      // Cleanup
      await job.remove();
    });

    it("should retrieve job from queue", async () => {
      const testData = {
        action: "process_data",
        value: 123,
      };

      const addedJob = await testQueue.add("retrieve-job", testData);
      const retrievedJob = await testQueue.getJob(addedJob.id!);

      expect(retrievedJob).toBeDefined();
      expect(retrievedJob?.id).toBe(addedJob.id);
      expect(retrievedJob?.data).toMatchObject(testData);

      // Cleanup
      await addedJob.remove();
    });

    it("should respect retry configuration", async () => {
      const job = await testQueue.add("retry-job", { test: true });

      expect(job.opts.attempts).toBe(3);
      expect(job.opts.backoff).toEqual({
        type: "exponential",
        delay: 1000,
      });

      // Cleanup
      await job.remove();
    });
  });
});
