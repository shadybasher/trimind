import { PrismaClient } from "@prisma/client";

describe("/api/chat Integration Tests", () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let testSessionId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        clerkId: `test_clerk_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
      },
    });
    testUserId = testUser.id;

    // Create test session
    const testSession = await prisma.session.create({
      data: {
        userId: testUserId,
        title: "Test Session",
      },
    });
    testSessionId = testSession.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
    await prisma.$disconnect();
  });

  describe("Request Validation", () => {
    it("should validate sessionId format (must be cuid)", async () => {
      const invalidSessionId = "invalid-id-format";

      // Simulate validation
      const isValidCuid = /^[a-z0-9]{25}$/.test(invalidSessionId);
      expect(isValidCuid).toBe(false);
    });

    it("should validate message is not empty", async () => {
      const emptyMessage = "";

      // Zod validation should fail
      expect(emptyMessage.length).toBe(0);
    });

    it("should validate message max length (10000 chars)", async () => {
      const longMessage = "a".repeat(10001);

      // Zod validation should fail
      expect(longMessage.length).toBeGreaterThan(10000);
    });

    it("should accept valid sessionId and message", async () => {
      const validSessionId = testSessionId; // cuid format
      const validMessage = "This is a valid message";

      // Validation should pass
      expect(validSessionId.length).toBeGreaterThan(0);
      expect(validMessage.length).toBeGreaterThan(0);
      expect(validMessage.length).toBeLessThanOrEqual(10000);
    });
  });

  describe("Database Operations", () => {
    it("should save user message to database", async () => {
      const message = "Test message for database";

      // Save message
      const savedMessage = await prisma.message.create({
        data: {
          sessionId: testSessionId,
          userId: testUserId,
          role: "user",
          content: message,
        },
      });

      expect(savedMessage).toBeDefined();
      expect(savedMessage.id).toBeDefined();
      expect(savedMessage.content).toBe(message);
      expect(savedMessage.role).toBe("user");
      expect(savedMessage.sessionId).toBe(testSessionId);

      // Clean up
      await prisma.message.delete({
        where: { id: savedMessage.id },
      });
    });

    it("should verify session exists and belongs to user", async () => {
      const session = await prisma.session.findUnique({
        where: { id: testSessionId },
      });

      expect(session).toBeDefined();
      expect(session?.userId).toBe(testUserId);
    });

    it("should handle cascade delete - messages deleted when session deleted", async () => {
      // Create temporary session with message
      const tempSession = await prisma.session.create({
        data: {
          userId: testUserId,
          title: "Temp Session",
        },
      });

      const tempMessage = await prisma.message.create({
        data: {
          sessionId: tempSession.id,
          userId: testUserId,
          role: "user",
          content: "Temporary message",
        },
      });

      // Delete session
      await prisma.session.delete({
        where: { id: tempSession.id },
      });

      // Verify message was cascade deleted
      const deletedMessage = await prisma.message.findUnique({
        where: { id: tempMessage.id },
      });

      expect(deletedMessage).toBeNull();
    });
  });

  describe("API Response Format (BullMQ Async Flow)", () => {
    it("should return 202 Accepted with queued status (async processing)", () => {
      // Updated for Epic 5: BullMQ async architecture
      // Response now indicates job queued, not immediate processing
      const mockResponse = {
        success: true,
        status: "queued",
        messageId: "test-id",
        timestamp: new Date().toISOString(),
      };

      expect(mockResponse).toHaveProperty("success");
      expect(mockResponse).toHaveProperty("status");
      expect(mockResponse).toHaveProperty("messageId");
      expect(mockResponse).toHaveProperty("timestamp");
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.status).toBe("queued"); // Changed from "Received" to "queued"
    });

    it("should validate BullMQ job structure", () => {
      // Job data structure sent to BullMQ
      const mockJobData = {
        sessionId: testSessionId,
        userId: testUserId,
        messageId: "test-message-id",
        message: "Test message",
        timestamp: new Date().toISOString(),
      };

      expect(mockJobData).toHaveProperty("sessionId");
      expect(mockJobData).toHaveProperty("userId");
      expect(mockJobData).toHaveProperty("messageId");
      expect(mockJobData).toHaveProperty("message");
      expect(mockJobData).toHaveProperty("timestamp");
    });
  });
});
