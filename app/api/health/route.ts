import { NextResponse } from "next/server";

/**
 * Health Check Endpoint
 * Used by CI/CD and monitoring to verify the application is running
 */
export async function GET() {
  console.log("[Health Check] /api/health endpoint called");
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "trimind-nextjs",
    },
    { status: 200 }
  );
}
