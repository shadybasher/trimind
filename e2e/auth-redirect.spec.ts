import { test, expect } from "@playwright/test";

test.describe("Authentication Redirect", () => {
  test("should redirect unauthenticated user to sign-in when accessing protected route", async ({
    page,
  }) => {
    // Attempt to access protected dashboard without authentication
    await page.goto("/dashboard");

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/\/sign-in/);

    // Verify Clerk iframe or sign-in component loaded
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toContain("sign-in");
  });

  test("should allow access to public sign-in page", async ({ page }) => {
    await page.goto("/sign-in");

    // Should stay on sign-in page (not redirect)
    await expect(page).toHaveURL(/\/sign-in/);
    await page.waitForLoadState("networkidle");
  });

  test("should allow access to public sign-up page", async ({ page }) => {
    await page.goto("/sign-up");

    // Should stay on sign-up page (not redirect)
    await expect(page).toHaveURL(/\/sign-up/);
    await page.waitForLoadState("networkidle");
  });
});
