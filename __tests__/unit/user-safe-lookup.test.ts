import { PrismaClient } from "@prisma/client";

// Create a mock findUnique function that we can control
const mockFindUnique = jest.fn();

// Mock the entire Prisma Client
jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: mockFindUnique,
      },
    })),
  };
});

describe("getUserByClerkIdSafe - Unit Tests", () => {
  let getUserByClerkIdSafe: (clerkId: string) => Promise<string | null>;
  let getUserByClerkId: (clerkId: string) => Promise<string>;

  beforeAll(async () => {
    // Import the functions after mock is set up
    const userModule = await import("../../lib/user");
    getUserByClerkIdSafe = userModule.getUserByClerkIdSafe;
    getUserByClerkId = userModule.getUserByClerkId;
  });

  beforeEach(() => {
    // Clear previous mock calls but keep implementation
    jest.clearAllMocks();
  });

  describe("When user exists in database", () => {
    it("should return user ID", async () => {
      const testClerkId = "clerk_test123";
      const testUserId = "user_db_456";

      // Mock successful lookup
      mockFindUnique.mockResolvedValue({
        id: testUserId,
      });

      const result = await getUserByClerkIdSafe(testClerkId);

      expect(result).toBe(testUserId);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { clerkId: testClerkId },
        select: { id: true },
      });
    });

    it("should handle different Clerk ID formats", async () => {
      const testCases = [
        { clerkId: "clerk_2abc123def", userId: "user_1" },
        { clerkId: "clerk_test_long_id_format", userId: "user_2" },
        { clerkId: "clerk_123", userId: "user_3" },
      ];

      for (const testCase of testCases) {
        mockFindUnique.mockResolvedValue({
          id: testCase.userId,
        });

        const result = await getUserByClerkIdSafe(testCase.clerkId);

        expect(result).toBe(testCase.userId);
      }
    });
  });

  describe("When user does NOT exist in database", () => {
    it("should return null (not throw error)", async () => {
      const testClerkId = "clerk_nonexistent";

      // Mock user not found
      mockFindUnique.mockResolvedValue(null);

      const result = await getUserByClerkIdSafe(testClerkId);

      expect(result).toBeNull();
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { clerkId: testClerkId },
        select: { id: true },
      });
    });

    it("should NOT throw error when user not found", async () => {
      const testClerkId = "clerk_missing";

      mockFindUnique.mockResolvedValue(null);

      // Should NOT throw
      await expect(getUserByClerkIdSafe(testClerkId)).resolves.not.toThrow();
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined user ID gracefully", async () => {
      const testClerkId = "clerk_test";

      // Mock user with undefined id (should not happen, but defensive)
      mockFindUnique.mockResolvedValue({
        id: undefined,
      });

      const result = await getUserByClerkIdSafe(testClerkId);

      expect(result).toBeNull();
    });

    it("should handle empty Clerk ID", async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await getUserByClerkIdSafe("");

      expect(result).toBeNull();
    });
  });

  describe("Database errors", () => {
    it("should propagate database errors", async () => {
      const testClerkId = "clerk_error";
      const dbError = new Error("Database connection failed");

      mockFindUnique.mockRejectedValue(dbError);

      await expect(getUserByClerkIdSafe(testClerkId)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("Comparison with getUserByClerkId (original)", () => {
    it("getUserByClerkIdSafe returns null while getUserByClerkId throws", async () => {
      const testClerkId = "clerk_compare";

      mockFindUnique.mockResolvedValue(null);

      // Safe version returns null
      const safeResult = await getUserByClerkIdSafe(testClerkId);
      expect(safeResult).toBeNull();

      // Original version throws
      await expect(getUserByClerkId(testClerkId)).rejects.toThrow(
        `User not found for Clerk ID: ${testClerkId}`,
      );
    });

    it("both functions return same result when user exists", async () => {
      const testClerkId = "clerk_exists";
      const testUserId = "user_123";

      mockFindUnique.mockResolvedValue({
        id: testUserId,
      });

      const safeResult = await getUserByClerkIdSafe(testClerkId);
      const unsafeResult = await getUserByClerkId(testClerkId);

      expect(safeResult).toBe(unsafeResult);
      expect(safeResult).toBe(testUserId);
    });
  });
});
