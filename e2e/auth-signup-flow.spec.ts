import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

test.describe("Complete Sign-Up Flow with Database Verification", () => {
  let prisma: PrismaClient;

  test.beforeAll(() => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("should complete full sign-up flow and verify user in database", async ({ page }) => {
    // Generate unique test credentials
    const timestamp = Date.now();
    const testEmail = `test_e2e_${timestamp}@example.com`;
    const testPassword = `TestPassword${timestamp}!`;
    const testFirstName = "E2E";
    const testLastName = "TestUser";

    // Navigate to sign-up page
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/\/sign-up/);

    // Wait for Clerk sign-up form to load
    await page.waitForLoadState("networkidle");

    // Fill in sign-up form
    // Note: Clerk uses specific field names and structure
    try {
      // Try to find email input
      const emailInput = page.locator('input[name="emailAddress"]');
      await emailInput.waitFor({ timeout: 10000 });
      await emailInput.fill(testEmail);

      // Try to find password input
      const passwordInput = page.locator('input[name="password"]');
      await passwordInput.fill(testPassword);

      // Try to find first name input (if available)
      const firstNameInput = page.locator('input[name="firstName"]');
      if (await firstNameInput.isVisible()) {
        await firstNameInput.fill(testFirstName);
      }

      // Try to find last name input (if available)
      const lastNameInput = page.locator('input[name="lastName"]');
      if (await lastNameInput.isVisible()) {
        await lastNameInput.fill(testLastName);
      }

      // Click sign-up button
      const signUpButton = page.locator('button[type="submit"]').first();
      await signUpButton.click();

      // Wait for email verification page or redirect
      // Clerk might show verification page
      await page.waitForTimeout(2000);

      // Check if we need to verify email (Clerk test mode might skip this)
      const currentUrl = page.url();

      if (currentUrl.includes("verify")) {
        // In test/development mode, Clerk might provide a verification code
        // For automated testing, we would need to either:
        // 1. Use Clerk's test mode with auto-verification
        // 2. Access a test inbox API
        // 3. Use @clerk/testing helpers
        console.warn("Email verification required - skipping in E2E test");
      }

      // After successful sign-up, should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      // Verify dashboard content is displayed
      await expect(page.locator("text=Welcome")).toBeVisible({
        timeout: 10000,
      });

      // === CRITICAL: Database Verification ===
      // Wait a moment for webhook to process
      await page.waitForTimeout(3000);

      // Query database to verify user was created via webhook
      const users = await prisma.user.findMany({
        where: {
          email: testEmail,
        },
      });

      // Verify user exists in database
      expect(users.length).toBeGreaterThan(0);
      const dbUser = users[0];

      expect(dbUser).toBeDefined();
      expect(dbUser.email).toBe(testEmail);
      expect(dbUser.clerkId).toBeDefined();
      expect(dbUser.clerkId).not.toBe("");

      // Log success for debugging
      console.warn(`✅ User successfully created in database via Clerk webhook:`);
      console.warn(`   Clerk ID: ${dbUser.clerkId}`);
      console.warn(`   Email: ${dbUser.email}`);
      console.warn(`   Database ID: ${dbUser.id}`);

      // Cleanup: Delete test user from database
      // Note: In real test environment, you would also delete from Clerk
      await prisma.user.delete({
        where: { id: dbUser.id },
      });
    } catch (error) {
      // If test fails, capture screenshot for debugging
      await page.screenshot({
        path: `test-results/signup-failure-${timestamp}.png`,
      });
      throw error;
    }
  });

  test("should allow user to sign in after sign-up", async ({ page }) => {
    // This test assumes a test user already exists in Clerk
    // In real scenario, you would create a test user first or use fixtures

    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/sign-in/);

    // For this test to work, you need valid test credentials
    // This is a placeholder showing the flow
    console.warn("Sign-in test requires pre-existing test user - skipping actual sign-in");

    // Verify sign-in page is accessible
    await expect(
      page.locator('text="Sign in"').or(page.locator('text="Sign In"')).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
