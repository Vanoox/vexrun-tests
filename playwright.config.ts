import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

// no .env on CI, vars come from secrets
if (existsSync(".env")) process.loadEnvFile();

// no traces for API - they store request headers with the api key,
// and the report is uploaded as a CI artifact
const apiUse = {
  baseURL: "https://forms.dev.vexrun.com",
  trace: "off" as const,
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    trace: "retain-on-failure",
  },

  projects: [
    // API - one worker, cleanup and tests share the same team
    {
      name: "api-cleanup",
      testDir: "./tests/api",
      testMatch: /.*\.setup\.ts/,
      use: apiUse,
    },
    {
      name: "api",
      testDir: "./tests/api",
      testIgnore: /(auth|rate-limit)\.spec\.ts/,
      dependencies: ["api-cleanup"],
      fullyParallel: false,
      workers: 1,
      // room for the 60 s rate limit wait
      timeout: 120_000,
      use: apiUse,
    },
    // runs last - these can block our IP (auth for 15 min, submissions for 1 min)
    {
      name: "api-limits",
      testDir: "./tests/api",
      testMatch: /(auth|rate-limit)\.spec\.ts/,
      dependencies: ["api"],
      workers: 1,
      use: apiUse,
    },
  ],
});
