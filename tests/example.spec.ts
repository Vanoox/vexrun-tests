import { test } from "@playwright/test";

test("vexrun ui test", async ({ page }) => {
  await page.goto("https://dev.vexrun.com//");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Get Started" })
    .click();
  await page.getByRole("link", { name: "View Form" });
});
