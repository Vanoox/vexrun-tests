import { test, expect } from "@playwright/test";
import {
  VALID_FORM,
  SUBMISSION_SIMPLE,
  SUBMISSION_ERRORS,
  RATE_LIMIT,
} from "../../test-data/api_test_data.js";
import { FormsApi } from "../../api/FormsApi.js";
import { SubmissionsApi } from "../../api/SubmissionsApi.js";
import { expectStatus, expectSubmissionError } from "../../api/expectations.js";

test("create submission over rate limit", async ({ request }) => {
  const createForm = await new FormsApi(request).create(VALID_FORM);
  await expectStatus(createForm, 201);
  const formId = (await createForm.json()).id;
  const api = new SubmissionsApi(request);

  const maxAttempts = RATE_LIMIT.perMinute * 2 + 1;
  let response;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    response = await api.create(SUBMISSION_SIMPLE, formId, {
      waitOnRateLimit: false,
    });
    if (response.status() !== 201) break;
  }

  expect(response, "no submissions were sent").toBeDefined();
  await expectSubmissionError(response!, SUBMISSION_ERRORS.rateLimit);
});
