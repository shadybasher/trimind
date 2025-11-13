import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { aiTasksQueue, AITaskJob } from "@/lib/queue";

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

    // 6. Add AI processing job to BullMQ queue
    const jobData: AITaskJob = {
      sessionId,
      userId: user.id,
      messageId: savedMessage.id,
      message: message,
      timestamp: savedMessage.createdAt.toISOString(),
    };

    await aiTasksQueue.add("process-ai-task", jobData, {
      jobId: `${savedMessage.id}-${Date.now()}`, // Unique job ID
    });

    // 7. Return 202 Accepted (job queued for async processing)
    return NextResponse.json(
      {
        success: true,
        status: "queued",
        messageId: savedMessage.id,
        timestamp: savedMessage.createdAt,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[/api/chat] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  // Note: Do NOT disconnect prisma - it is a global singleton from @/lib/prisma
  // Disconnecting after every request causes "Response from the Engine was empty" errors
}
