import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/messages
 * Fetches all messages for a given session
 * Used by UI polling mechanism (useGetMessages hook with 2-second refetchInterval)
 *
 * Query params:
 *   - sessionId: string (required)
 *
 * Returns: Message[] (ordered by createdAt ascending)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user with Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get sessionId from query params
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query parameter is required" },
        { status: 400 }
      );
    }

    // 3. Get user from database (mapped from Clerk)
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Verify session belongs to user
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // 5. Fetch all messages for this session (both user and assistant messages)
    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        sessionId: true,
        userId: true,
        role: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(
      `[/api/messages] Fetched ${messages.length} messages for session ${sessionId}`
    );

    // 6. Return messages array
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error("[/api/messages] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
  // Note: Do NOT disconnect prisma - it is a global singleton from @/lib/prisma
}
