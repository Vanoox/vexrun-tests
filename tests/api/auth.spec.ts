import { test } from "@playwright/test";
import {
  VALID_FORM,
  HEADERS_WRONG_API_KEY,
  HEADERS_WRONG_TEAM_ID,
  HEADERS_EMPTY,
} from "../../test-data/api_test_data.js";
import { FormsApi } from "../../api/FormsApi.js";
import { expectApiError } from "../../api/expectations.js";

test.describe.skip("Authorization", () => {
  test("create form with wrong api key", async ({ request }) => {
    const response = await new FormsApi(request).create(
      VALID_FORM,
      HEADERS_WRONG_API_KEY,
    );
    await expectApiError(response, 401);
  });

  test("create form with wrong team id", async ({ request }) => {
    const response = await new FormsApi(request).create(
      VALID_FORM,
      HEADERS_WRONG_TEAM_ID,
    );
    await expectApiError(response, 401);
  });

  test("create form with empty headers", async ({ request }) => {
    const response = await new FormsApi(request).create(
      VALID_FORM,
      HEADERS_EMPTY,
    );
    await expectApiError(response, 401);
  });
});
