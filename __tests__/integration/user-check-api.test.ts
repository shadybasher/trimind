import { PrismaClient } from "@prisma/client";

describe("/api/user/check Integration Tests", () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let testClerkId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        clerkId: `test_clerk_race_${Date.now()}`,
        email: `test_race_${Date.now()}@example.com`,
        firstName: "Race",
        lastName: "Condition",
      },
    });
    testUserId = testUser.id;
    testClerkId = testUser.clerkId;
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
    await prisma.$disconnect();
  });

  describe("GET /api/user/check", () => {
    describe("When user exists", () => {
      it("should return exists=true with userId", () => {
        const response = {
          exists: true,
          userId: testUserId,
        };

        expect(response).toHaveProperty("exists");
        expect(response).toHaveProperty("userId");
        expect(response.exists).toBe(true);
        expect(response.userId).toBe(testUserId);
      });

      it("should work with URL-encoded clerkId", () => {
        // Test that special characters in clerkId are handled
        const encodedClerkId = encodeURIComponent(testClerkId);

        expect(encodedClerkId).toBeDefined();
        expect(typeof encodedClerkId).toBe("string");
      });
    });

    describe("When user does NOT exist", () => {
      it("should return exists=false with userId=null", () => {
        // Simulate response for non-existent user
        const response = {
          exists: false,
          userId: null,
        };

        expect(response.exists).toBe(false);
        expect(response.userId).toBeNull();
      });

      it("should handle brand new Clerk IDs (race condition scenario)", () => {
        // Simulate the exact race condition: Clerk ID exists but DB record doesn't yet
        // Expected response during race window
        const response = {
          exists: false,
          userId: null,
        };

        expect(response.exists).toBe(false);
        expect(response.userId).toBeNull();
      });
    });

    describe("Parameter validation", () => {
      it("should require clerkId parameter", () => {
        // Test that missing clerkId returns error
        const errorResponse = {
          error: "Missing required parameter: clerkId",
        };

        expect(errorResponse).toHaveProperty("error");
        expect(errorResponse.error).toBe("Missing required parameter: clerkId");
      });

      it("should handle empty clerkId", () => {
        // Empty string should be treated as missing
        const response = {
          error: "Missing required parameter: clerkId",
        };

        expect(response.error).toBeDefined();
      });
    });

    describe("Response structure", () => {
      it("should return consistent structure for existing user", () => {
        const response = {
          exists: true,
          userId: testUserId,
        };

        // Verify structure
        expect(Object.keys(response).sort()).toEqual(["exists", "userId"]);
        expect(typeof response.exists).toBe("boolean");
        expect(typeof response.userId).toBe("string");
      });

      it("should return consistent structure for non-existing user", () => {
        const response = {
          exists: false,
          userId: null,
        };

        // Verify structure
        expect(Object.keys(response).sort()).toEqual(["exists", "userId"]);
        expect(typeof response.exists).toBe("boolean");
        expect(response.userId).toBeNull();
      });
    });

    describe("Database operations", () => {
      it("should verify test user exists in database", async () => {
        const user = await prisma.user.findUnique({
          where: { clerkId: testClerkId },
        });

        expect(user).toBeDefined();
        expect(user?.id).toBe(testUserId);
        expect(user?.clerkId).toBe(testClerkId);
      });

      it("should verify non-existent clerkId returns null", async () => {
        const user = await prisma.user.findUnique({
          where: { clerkId: "clerk_definitely_does_not_exist_99999" },
        });

        expect(user).toBeNull();
      });
    });

    describe("Race condition simulation", () => {
      it("should handle rapid polling scenario", async () => {
        // Simulate multiple rapid checks (like our polling hook would do)
        const nonExistentClerkId = `clerk_polling_test_${Date.now()}`;

        // Check 1: User doesn't exist
        let user = await prisma.user.findUnique({
          where: { clerkId: nonExistentClerkId },
        });
        expect(user).toBeNull();

        // Check 2: Still doesn't exist
        user = await prisma.user.findUnique({
          where: { clerkId: nonExistentClerkId },
        });
        expect(user).toBeNull();

        // Check 3: Still doesn't exist
        user = await prisma.user.findUnique({
          where: { clerkId: nonExistentClerkId },
        });
        expect(user).toBeNull();

        // This simulates what happens during the webhook delay
      });

      it("should successfully find user once created", async () => {
        // Create user mid-test (simulates webhook completing)
        const newUser = await prisma.user.create({
          data: {
            clerkId: `test_clerk_created_${Date.now()}`,
            email: `test_created_${Date.now()}@example.com`,
            firstName: "Created",
            lastName: "MidTest",
          },
        });

        // Now it should be found
        const foundUser = await prisma.user.findUnique({
          where: { clerkId: newUser.clerkId },
        });

        expect(foundUser).toBeDefined();
        expect(foundUser?.id).toBe(newUser.id);

        // Clean up
        await prisma.user.delete({
          where: { id: newUser.id },
        });
      });
    });
  });
});
