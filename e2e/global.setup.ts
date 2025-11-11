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
  await page.waitForSelector("text=Welcome", { timeout: 10000 });

  // Save authenticated state for reuse in tests
  await page.context().storageState({ path: authFile });
});
