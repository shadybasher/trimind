import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import path from "path";
import { PrismaClient } from "@prisma/client";

setup.describe.configure({ mode: "serial" });

setup("global setup - initialize Clerk testing", async ({}) => {
  await clerkSetup();
});

const authFile = path.join(__dirname, "../playwright/.clerk/user.json");

setup("authenticate test user and save state", async ({ page }) => {
  // Navigate to home page
  await page.goto("/");

  // Sign in using Clerk helper with test credentials
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  // E2E-specific: Ensure user exists in DB (bypassing webhook delay)
  // In production, the Clerk webhook handles this. For E2E, we create it manually.
  const prisma = new PrismaClient();
  try {
    // Get Clerk user ID from the page context
    const clerkUserId = await page.evaluate(() => {
      // Access Clerk's client-side state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).Clerk?.user?.id;
    });

    if (clerkUserId) {
      // Create or update user in database (idempotent)
      await prisma.user.upsert({
        where: { clerkId: clerkUserId },
        update: {}, // No updates needed if exists
        create: {
          clerkId: clerkUserId,
          email: process.env.E2E_CLERK_USER_USERNAME!,
          name: "E2E Test User",
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }

  // Verify authentication by navigating to protected route
  await page.goto("/dashboard");

  // Now wait for the dashboard to be fully loaded
  // With the DB user created above, there should be no loading state
  await page.waitForSelector("text=Trimind V-Next", { timeout: 10000 });

  // Save authenticated state for reuse in tests
  await page.context().storageState({ path: authFile });
});
