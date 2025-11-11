import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkIdSafe } from "@/lib/user";

/**
 * GET /api/user/check
 *
 * Lightweight endpoint to check if a user exists in the database.
 * Used for polling during account setup to handle Clerk webhook race conditions.
 *
 * Query params:
 * - clerkId: The Clerk user ID to check
 *
 * Returns:
 * - { exists: true, userId: string } if user found
 * - { exists: false, userId: null } if user not found
 * - { error: string } with 400 status if clerkId missing
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clerkId = searchParams.get("clerkId");

  if (!clerkId) {
    return NextResponse.json({ error: "Missing required parameter: clerkId" }, { status: 400 });
  }

  try {
    const userId = await getUserByClerkIdSafe(clerkId);

    return NextResponse.json({
      exists: !!userId,
      userId: userId || null,
    });
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
