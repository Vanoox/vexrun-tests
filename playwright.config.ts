import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

// no .env on CI, vars come from secrets
if (existsSync(".env")) process.loadEnvFile();

// no traces for API - they store request headers with the api key,
// and the report is uploaded as a CI artifact
const apiUse = {
  baseURL: process.env.BASE_URL ?? "https://forms.dev.vexrun.com",
  trace: "off" as const,
};

export default defineConfig({
  testDir: "./tests/api",
  forbidOnly: !!process.env.CI,
  // more retries would hit the rate limit
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
  use: apiUse,

  projects: [
    // API - one worker, cleanup and tests share the same team
    {
      name: "api-cleanup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "api",
      testIgnore: /(auth|rate-limit)\.spec\.ts/,
      dependencies: ["api-cleanup"],
      workers: 1,
      // room for the 60 s rate limit wait
      timeout: 120_000,
    },
    // blocks submissions from our IP for 1 min
    {
      name: "api-rate-limit",
      testMatch: /rate-limit\.spec\.ts/,
      dependencies: ["api"],
      workers: 1,
    },
    // must run last - failed auth blocks our IP for 15 min, after that
    // every request (even with a valid key) gets 401
    {
      name: "api-auth",
      testMatch: /auth\.spec\.ts/,
      dependencies: ["api-rate-limit"],
      workers: 1,
    },
  ],
});
