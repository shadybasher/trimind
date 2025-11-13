import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "global setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "unauthenticated tests",
      testMatch: /.*auth-redirect\.spec\.ts/,
      dependencies: ["global setup"],
    },
    {
      name: "authenticated tests",
      testMatch: /.*auth-signup-flow\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["global setup"],
    },
    {
      name: "chat flow tests",
      testMatch: /.*chat-flow.spec.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/user.json",
      },
      dependencies: ["global setup"],
    },
  ],

  // WebServer configuration removed - tests expect server to be running manually
  // Local: Use 'npm run test:e2e:local' which builds and starts production server
  // CI: Server is started manually in workflow (npm start &)
  // This ensures both local and CI test against production build
});
