// playwright.config.js
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests/e2e", // Path to your test files (UPDATED)
  timeout: 30 * 1000, // Increased timeout
  use: {
    headless: true, // Run tests in headless mode (UPDATED for better stability)
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  /*
    webServer: {
      command: "npm run dev",
      port: 3000,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  */
});
