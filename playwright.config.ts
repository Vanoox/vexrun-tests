import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// no .env on CI, vars come from secrets
if (existsSync(".env")) process.loadEnvFile();

// cookies expire after ~1 month, refresh in .env
const sessionCookie = {
  domain: "dev.vexrun.com",
  path: "/",
  expires: -1,
  httpOnly: true,
  secure: true,
  sameSite: "Lax" as const,
};

const uiUse = {
  baseURL: "https://dev.vexrun.com",
  storageState: {
    cookies: [
      { ...sessionCookie, name: "SID", value: process.env.SID! },
      {
        ...sessionCookie,
        name: "last-active-team-id",
        value: process.env.ACTIVE_TEAM!,
      },
    ],
    origins: [],
  },
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
      use: { baseURL: "https://forms.dev.vexrun.com" },
    },
    {
      name: "api",
      testDir: "./tests/api",
      dependencies: ["api-cleanup"],
      fullyParallel: false,
      workers: 1,
      use: {
        baseURL: "https://forms.dev.vexrun.com",
      },
    },

    // UI
    {
      name: "ui-chrome",
      testDir: "./tests/ui",
      fullyParallel: true,
      use: { ...devices["Desktop Chrome"], channel: "chrome", ...uiUse },
    },
    {
      name: "ui-firefox",
      testDir: "./tests/ui",
      fullyParallel: true,
      use: { ...devices["Desktop Firefox"], ...uiUse },
    },
    {
      name: "ui-webkit",
      testDir: "./tests/ui",
      fullyParallel: true,
      use: { ...devices["Desktop Safari"], ...uiUse },
    },
    {
      name: "ui-edge",
      testDir: "./tests/ui",
      fullyParallel: true,
      use: { ...devices["Desktop Edge"], channel: "msedge", ...uiUse },
    },
  ],
});
