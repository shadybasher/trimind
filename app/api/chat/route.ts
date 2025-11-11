import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Zod validation schema for incoming chat messages
const ChatMessageSchema = z.object({
  sessionId: z.string().cuid(),
  message: z.string().min(1).max(10000),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user with Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validation = ChatMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { sessionId, message } = validation.data;

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
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    // 5. Save user message to database
    const savedMessage = await prisma.message.create({
      data: {
        sessionId,
        userId: user.id,
        role: "user",
        content: message,
      },
    });

    // 6. Return stub response (AI integration will be added later)
    return NextResponse.json(
      {
        success: true,
        message: "Received",
        messageId: savedMessage.id,
        timestamp: savedMessage.createdAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/chat] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
