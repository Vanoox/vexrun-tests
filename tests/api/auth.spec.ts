import { test } from "./fixtures.js";
import {
  VALID_FORM,
  HEADERS_WRONG_API_KEY,
  HEADERS_WRONG_TEAM_ID,
  HEADERS_EMPTY,
} from "../../test-data/api_test_data.js";
import { expectApiError } from "../../api/expectations.js";

const WRONG_HEADERS = {
  "wrong api key": HEADERS_WRONG_API_KEY,
  "wrong team id": HEADERS_WRONG_TEAM_ID,
  "empty headers": HEADERS_EMPTY,
};

test.describe("Authorization", () => {
  // too many failed auth requests block the IP for 15 minutes,
  // so these run only when asked for (nightly CI)
  test.skip(
    !process.env.RUN_AUTH_TESTS,
    "set RUN_AUTH_TESTS=1 to run, failed auth blocks the IP for 15 min",
  );

  for (const [caseName, headers] of Object.entries(WRONG_HEADERS)) {
    test(`create form with ${caseName}`, async ({ formsApi }) => {
      const response = await formsApi.create(VALID_FORM, headers);
      await expectApiError(response, 401);
    });
  }

  test("list forms with empty headers", async ({ formsApi }) => {
    const response = await formsApi.list(HEADERS_EMPTY);
    await expectApiError(response, 401);
  });

  test("list submissions with empty headers", async ({
    submissionsApi,
    form,
  }) => {
    const response = await submissionsApi.list(form.id, {}, HEADERS_EMPTY);
    await expectApiError(response, 401);
  });

  test("delete form with wrong api key", async ({ formsApi, form }) => {
    const response = await formsApi.delete(form.id, HEADERS_WRONG_API_KEY);
    await expectApiError(response, 401);
  });
});
