import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get the user's active session or create a new one
 * For Epic 4, we'll use a single session per user
 * In future epics, this can be extended to support multiple sessions
 */
export async function getOrCreateSession(userId: string): Promise<string> {
  // Find the user's most recent session
  const existingSession = await prisma.session.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (existingSession) {
    return existingSession.id;
  }

  // Create a new session if none exists
  const newSession = await prisma.session.create({
    data: {
      userId,
      title: "Main Conversation",
    },
  });

  return newSession.id;
}
