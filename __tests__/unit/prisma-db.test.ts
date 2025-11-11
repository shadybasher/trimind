import { PrismaClient } from "@prisma/client";

describe("Prisma Database Integration Tests", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Database Connection", () => {
    it("should connect to PostgreSQL database successfully", async () => {
      // Test actual database connection by running a simple query
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
    });
  });

  describe("User Model Validation", () => {
    it("should create user with all required fields", async () => {
      const testClerkId = `test_${Date.now()}`;
      const testEmail = `test_${Date.now()}@example.com`;

      const user = await prisma.user.create({
        data: {
          clerkId: testClerkId,
          email: testEmail,
          firstName: "Test",
          lastName: "User",
        },
      });

      expect(user).toBeDefined();
      expect(user.clerkId).toBe(testClerkId);
      expect(user.email).toBe(testEmail);
      expect(user.firstName).toBe("Test");
      expect(user.lastName).toBe("User");

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it("should enforce unique clerkId constraint", async () => {
      const testClerkId = `unique_test_${Date.now()}`;
      const testEmail1 = `email1_${Date.now()}@example.com`;
      const testEmail2 = `email2_${Date.now()}@example.com`;

      // Create first user
      const user1 = await prisma.user.create({
        data: { clerkId: testClerkId, email: testEmail1 },
      });

      // Attempt to create second user with same clerkId should fail
      await expect(
        prisma.user.create({
          data: { clerkId: testClerkId, email: testEmail2 },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.user.delete({ where: { id: user1.id } });
    });

    it("should enforce unique email constraint", async () => {
      const testEmail = `unique_email_${Date.now()}@example.com`;
      const testClerkId1 = `clerk1_${Date.now()}`;
      const testClerkId2 = `clerk2_${Date.now()}`;

      // Create first user
      const user1 = await prisma.user.create({
        data: { clerkId: testClerkId1, email: testEmail },
      });

      // Attempt to create second user with same email should fail
      await expect(
        prisma.user.create({
          data: { clerkId: testClerkId2, email: testEmail },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.user.delete({ where: { id: user1.id } });
    });
  });

  describe("Session Model Relations", () => {
    it("should create session linked to user", async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          clerkId: `session_test_${Date.now()}`,
          email: `session_${Date.now()}@example.com`,
        },
      });

      // Create session for user
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          title: "Test Session",
        },
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(user.id);

      // Cleanup
      await prisma.session.delete({ where: { id: session.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it("should cascade delete sessions when user is deleted", async () => {
      // Create user with session
      const user = await prisma.user.create({
        data: {
          clerkId: `cascade_test_${Date.now()}`,
          email: `cascade_${Date.now()}@example.com`,
          sessions: {
            create: { title: "Test Session" },
          },
        },
        include: { sessions: true },
      });

      const sessionId = user.sessions[0].id;

      // Delete user (should cascade)
      await prisma.user.delete({ where: { id: user.id } });

      // Verify session was also deleted
      const deletedSession = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      expect(deletedSession).toBeNull();
    });
  });
});
