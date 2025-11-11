import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get user's database ID from Clerk ID (throws if not found)
 *
 * Use this when you're certain the user exists (e.g., webhook handlers, admin operations).
 * For race-condition-tolerant lookups (e.g., during signup), use getUserByClerkIdSafe().
 *
 * @throws {Error} If user not found in database
 */
export async function getUserByClerkId(clerkId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`User not found for Clerk ID: ${clerkId}`);
  }

  return user.id;
}

/**
 * Get user's database ID from Clerk ID (returns null if not found)
 *
 * Use this for race-condition-tolerant lookups where the user might not exist yet
 * (e.g., immediately after Clerk authentication but before webhook completes).
 *
 * @returns {Promise<string | null>} User's database ID or null if not found
 */
export async function getUserByClerkIdSafe(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  return user?.id ?? null;
}
