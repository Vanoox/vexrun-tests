import { test, expect } from "@playwright/test";
import {
  VALID_FORM,
  HEADERS_WRONG_API_KEY,
  HEADERS_WRONG_TEAM_ID,
  HEADERS_EMPTY,
} from "../../test-data/api_test_data.js";
import { FormsApi } from "../../api/FormsApi.js";

test.describe("Authorization", () => {
  test("create form with wrong api key", async ({ request }) => {
    const response = await new FormsApi(request).create(
      VALID_FORM,
      HEADERS_WRONG_API_KEY,
    );
    expect(response.status()).toBe(401);
  });

  test("create form with wrong team id", async ({ request }) => {
    const response = await new FormsApi(request).create(
      VALID_FORM,
      HEADERS_WRONG_TEAM_ID,
    );
    expect(response.status()).toBe(401);
  });

  test("create form with empty headers", async ({ request }) => {
    const response = await new FormsApi(request).create(
      VALID_FORM,
      HEADERS_EMPTY,
    );
    expect(response.status()).toBe(401);
  });
});
