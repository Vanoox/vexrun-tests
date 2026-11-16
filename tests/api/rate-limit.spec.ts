import { test, expect } from "./fixtures.js";
import {
  SUBMISSION_SIMPLE,
  SUBMISSION_ERRORS,
  RATE_LIMIT,
} from "../../test-data/api_test_data.js";
import { expectSubmissionError } from "../../api/expectations.js";

test("create submission over rate limit", async ({ submissionsApi, form }) => {
  // earlier tests may have used part of the limit already,
  // so it can only be checked that the error comes no later than expected
  const maxAttempts = RATE_LIMIT.perMinute * 2 + 1;
  let attempts = 0;
  let response;
  while (attempts < maxAttempts) {
    attempts++;
    response = await submissionsApi.create(form.id, SUBMISSION_SIMPLE, {
      waitOnRateLimit: false,
    });
    if (response.status() !== 201) break;
  }

  expect(response, "no submissions were sent").toBeDefined();
  await expectSubmissionError(response!, SUBMISSION_ERRORS.rateLimit);
  expect(attempts).toBeLessThanOrEqual(RATE_LIMIT.perMinute + 1);
});
