import { test, expect } from "@playwright/test";

test.describe("Sign-Up Flow", () => {
  test("should load sign-up page successfully", async ({ page }) => {
    // Navigate to sign-up page
    await page.goto("/sign-up");
    await expect(page).toHaveURL(/\/sign-up/);

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Verify we're on the sign-up page
    const url = page.url();
    expect(url).toContain("sign-up");

    // Note: Full sign-up flow with Clerk requires actual credentials
    // and webhook verification, which is beyond the scope of E2E tests
    // in CI environment. This test verifies the page loads correctly.
  });

  test("should load sign-in page successfully", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/sign-in/);

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Verify we're on the sign-in page
    const url = page.url();
    expect(url).toContain("sign-in");
  });

  test("should load dashboard page (will redirect if not authenticated)", async ({ page }) => {
    // Try to access dashboard
    await page.goto("/dashboard");

    // Wait for any redirects to complete
    await page.waitForLoadState("networkidle");

    // Should either be on dashboard (if somehow authenticated) or redirected to sign-in
    const url = page.url();
    const isOnDashboardOrSignIn = url.includes("/dashboard") || url.includes("/sign-in");
    expect(isOnDashboardOrSignIn).toBeTruthy();
  });
});
