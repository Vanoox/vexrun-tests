import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from .env file.
 */
process.loadEnvFile();

/* Cookies shared by every UI test (valid ~1 month, refresh values in .env) */
const sessionCookie = {
  domain: "dev.vexrun.com",
  path: "/",
  expires: -1,
  httpOnly: true,
  secure: true,
  sameSite: "Lax" as const,
};

/* Settings shared by every UI project (each one only adds its browser) */
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
  /* Global limit of parallel workers (default would be half of CPU cores) */
  workers: process.env.CI ? 2 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Keep trace only for failed tests. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
  },

  projects: [
    /* API tests – no browser, one at a time (they clean shared data) */
    {
      name: "api",
      testDir: "./tests/api",
      fullyParallel: false,
      workers: 1,
      use: {
        baseURL: "https://forms.dev.vexrun.com",
        /* Added to every request made with the `request` fixture */
        extraHTTPHeaders: {
          "x-team-id": process.env.X_TEAM_ID_TEST_API!,
          "x-api-key": process.env.X_API_KEY_TEST_API!,
        },
      },
    },

    /* UI tests – the same tests run in every browser below */
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
