import { PrismaClient } from "@prisma/client";

describe("Clerk Webhook Integration Tests", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Webhook Database Operations", () => {
    it("should simulate user.created webhook - create user in database", async () => {
      const mockClerkId = `webhook_test_${Date.now()}`;
      const mockEmail = `webhook_${Date.now()}@example.com`;

      // Simulate what the webhook endpoint does: Create user in database
      const user = await prisma.user.create({
        data: {
          clerkId: mockClerkId,
          email: mockEmail,
          firstName: "Webhook",
          lastName: "Test",
        },
      });

      // Verify user was created successfully
      expect(user).toBeDefined();
      expect(user.clerkId).toBe(mockClerkId);
      expect(user.email).toBe(mockEmail);

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it("should simulate user.updated webhook - update existing user", async () => {
      const mockClerkId = `update_test_${Date.now()}`;
      const originalEmail = `original_${Date.now()}@example.com`;
      const updatedEmail = `updated_${Date.now()}@example.com`;

      // Create initial user
      const user = await prisma.user.create({
        data: {
          clerkId: mockClerkId,
          email: originalEmail,
          firstName: "Original",
        },
      });

      // Simulate webhook update
      const updatedUser = await prisma.user.update({
        where: { clerkId: mockClerkId },
        data: {
          email: updatedEmail,
          firstName: "Updated",
        },
      });

      expect(updatedUser.email).toBe(updatedEmail);
      expect(updatedUser.firstName).toBe("Updated");

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it("should simulate user.deleted webhook - delete user from database", async () => {
      const mockClerkId = `delete_test_${Date.now()}`;
      const mockEmail = `delete_${Date.now()}@example.com`;

      // Create user to delete
      await prisma.user.create({
        data: {
          clerkId: mockClerkId,
          email: mockEmail,
        },
      });

      // Simulate webhook delete
      await prisma.user.delete({
        where: { clerkId: mockClerkId },
      });

      // Verify user was deleted
      const deletedUser = await prisma.user.findUnique({
        where: { clerkId: mockClerkId },
      });

      expect(deletedUser).toBeNull();
    });

    it("should handle cascade delete for user sessions", async () => {
      const mockClerkId = `cascade_test_${Date.now()}`;
      const mockEmail = `cascade_${Date.now()}@example.com`;

      // Create user with session
      const user = await prisma.user.create({
        data: {
          clerkId: mockClerkId,
          email: mockEmail,
          sessions: {
            create: {
              title: "Test Session",
            },
          },
        },
        include: { sessions: true },
      });

      const sessionId = user.sessions[0].id;

      // Delete user (should cascade to sessions)
      await prisma.user.delete({
        where: { id: user.id },
      });

      // Verify session was also deleted
      const deletedSession = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      expect(deletedSession).toBeNull();
    });
  });

  describe("Webhook Data Validation", () => {
    it("should validate required fields for user creation", async () => {
      const mockClerkId = `validation_test_${Date.now()}`;
      const mockEmail = `validation_${Date.now()}@example.com`;

      const user = await prisma.user.create({
        data: {
          clerkId: mockClerkId,
          email: mockEmail,
        },
      });

      // Verify required fields are present
      expect(user.clerkId).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it("should allow null values for optional fields", async () => {
      const mockClerkId = `null_fields_test_${Date.now()}`;
      const mockEmail = `null_${Date.now()}@example.com`;

      const user = await prisma.user.create({
        data: {
          clerkId: mockClerkId,
          email: mockEmail,
          firstName: null,
          lastName: null,
          imageUrl: null,
        },
      });

      expect(user.firstName).toBeNull();
      expect(user.lastName).toBeNull();
      expect(user.imageUrl).toBeNull();

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
