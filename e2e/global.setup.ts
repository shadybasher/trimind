import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import path from "path";

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

  // Verify authentication by navigating to protected route
  await page.goto("/dashboard");

  // Handle race condition: wait for either loading state OR dashboard
  // If we see "Preparing Your Account", wait for it to resolve
  const loadingVisible = await page
    .locator("text=Preparing Your Account")
    .isVisible()
    .catch(() => false);

  if (loadingVisible) {
    // Race condition detected - wait for loading to finish (max 30s as per useUserSetup)
    await page.waitForSelector("text=Preparing Your Account", { state: "hidden", timeout: 35000 });
  }

  // Now wait for the dashboard to be fully loaded
  await page.waitForSelector("text=Trimind V-Next", { timeout: 10000 });

  // Save authenticated state for reuse in tests
  await page.context().storageState({ path: authFile });
});
