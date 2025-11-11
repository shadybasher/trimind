import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get user's database ID from Clerk ID
 * Throws error if user not found (should not happen if webhook is working)
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
