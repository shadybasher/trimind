import { test, expect } from "@playwright/test";

test.describe("Authentication Redirect", () => {
  test("should redirect unauthenticated user to sign-in when accessing protected route", async ({
    page,
  }) => {
    // Attempt to access protected dashboard without authentication
    await page.goto("/dashboard");

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/\/sign-in/);

    // Verify sign-in form is displayed
    await expect(
      page.locator('text="Sign in"').or(page.locator('text="Sign In"')).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("should allow access to public sign-in page", async ({ page }) => {
    await page.goto("/sign-in");

    // Should stay on sign-in page (not redirect)
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("should allow access to public sign-up page", async ({ page }) => {
    await page.goto("/sign-up");

    // Should stay on sign-up page (not redirect)
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test("should allow access to home page", async ({ page }) => {
    await page.goto("/");

    // Should stay on home page
    await expect(page).toHaveURL("/");
  });
});
