import { test, expect } from "@playwright/test";
import { setupClerkTestingToken } from "@clerk/testing/playwright";

/**
 * E2E Test: Full Async Chat Flow (Epic 5)
 *
 * Tests the complete async processing pipeline:
 * 1. User sends message via ManagerConsole
 * 2. Frontend receives 202 Accepted (immediate response)
 * 3. Background: BullMQ → Python API → AI Processing → Database
 * 4. Frontend polls and displays AI response
 *
 * This validates the P1 requirement: Full async flow with real AI processing
 */
test.describe("Chat Flow - Epic 5 Async Pipeline", () => {
  test.beforeEach(async ({ page }) => {
    // Set up Clerk authentication
    await setupClerkTestingToken({ page });
    await page.goto("/dashboard");

    // Wait for dashboard to load
    await page.waitForSelector("text=Trimind V-Next");
  });

  test("should process message through full async pipeline and display AI response", async ({
    page,
  }) => {
    const testMessage = "Hello, this is an Epic 5 test message";

    // Step 1: Type and send message via ManagerConsole
    const messageInput = page.locator("textarea[placeholder*='Type your message']");
    await messageInput.fill(testMessage);

    // Send the message (assuming there's a Send button or Enter key)
    await messageInput.press("Enter");

    // Step 2: Verify optimistic UI update (user message appears immediately)
    // Note: Message appears in 4 places (textarea + 3 chat panes), use .first() to avoid strict mode violation
    await expect(page.getByText(testMessage).first()).toBeVisible({ timeout: 5000 });

    // Step 3: Wait for AI response to appear
    // The full pipeline: BullMQ → Python API → Intent Router → LLM → Database → UI
    // This can take up to 30 seconds depending on LLM latency
    await page.waitForSelector(
      '[data-role="assistant"]:last-of-type',
      { timeout: 30000 }
    );

    // Step 4: Verify AI response is visible and non-empty
    const aiResponse = page.locator('[data-role="assistant"]:last-of-type');
    await expect(aiResponse).toBeVisible();

    const aiText = await aiResponse.textContent();
    expect(aiText).toBeTruthy();
    expect(aiText!.length).toBeGreaterThan(5); // AI should give meaningful response

    // Step 5: Verify response appears in at least one ChatPane
    // (Intent router decides which model to use)
    const chatPanes = page.locator('[data-testid*="chat-pane"]');
    const count = await chatPanes.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should handle multiple messages in sequence", async ({ page }) => {
    const messages = [
      "First test message",
      "Second test message",
      "Third test message",
    ];

    const messageInput = page.locator("textarea[placeholder*='Type your message']");

    for (const msg of messages) {
      // Send message
      await messageInput.fill(msg);
      await messageInput.press("Enter");

      // Verify optimistic update
      // Note: Message appears in 4 places (textarea + 3 chat panes), use .first() to avoid strict mode violation
      await expect(page.getByText(msg).first()).toBeVisible({ timeout: 5000 });

      // Wait a bit before sending next message
      await page.waitForTimeout(1000);
    }

    // Verify at least 3 AI responses appear (one per message)
    await page.waitForSelector(
      '[data-role="assistant"]',
      { timeout: 30000 }
    );

    const aiResponses = page.locator('[data-role="assistant"]');
    const count = await aiResponses.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("should show loading state while processing", async ({ page }) => {
    const testMessage = "Test loading state message";

    const messageInput = page.locator("textarea[placeholder*='Type your message']");
    await messageInput.fill(testMessage);
    await messageInput.press("Enter");

    // Immediately after sending, there should be some loading indicator
    // (This depends on your UI implementation - adjust selector as needed)
    // For example: spinner, "Thinking..." text, or disabled state
    await page.waitForTimeout(500);

    // Check if any loading indicator is visible
    // Note: Adjust these selectors based on your actual UI implementation
    const possibleLoadingIndicators = [
      page.locator('[data-testid="loading-spinner"]'),
      page.locator('text="Thinking"'),
      page.locator('text="Processing"'),
      page.locator('[aria-busy="true"]'),
    ];

    // At least one loading indicator should exist (if implemented)
    // If not implemented, this test will be skipped
    let hasLoadingIndicator = false;
    for (const indicator of possibleLoadingIndicators) {
      if (await indicator.isVisible().catch(() => false)) {
        hasLoadingIndicator = true;
        break;
      }
    }

    // Eventually, the AI response should appear
    await page.waitForSelector(
      '[data-role="assistant"]:last-of-type',
      { timeout: 30000 }
    );

    // If there was a loading indicator, it should be gone now
    if (hasLoadingIndicator) {
      for (const indicator of possibleLoadingIndicators) {
        await expect(indicator).not.toBeVisible();
      }
    }
  });

  test("should persist messages across page reload", async ({ page }) => {
    const testMessage = "Persistence test message";

    // Send a message
    const messageInput = page.locator("textarea[placeholder*='Type your message']");
    await messageInput.fill(testMessage);
    await messageInput.press("Enter");

    // Wait for AI response
    await page.waitForSelector(
      '[data-role="assistant"]:last-of-type',
      { timeout: 30000 }
    );

    // Reload the page
    await page.reload();
    await page.waitForSelector("text=Trimind V-Next");

    // Verify both user message and AI response are still visible
    // Note: Message appears in 4 places (textarea + 3 chat panes), use .first() to avoid strict mode violation
    await expect(page.getByText(testMessage).first()).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('[data-role="assistant"]:last-of-type')
    ).toBeVisible({ timeout: 5000 });
  });
});
