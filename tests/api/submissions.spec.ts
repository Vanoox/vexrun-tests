import { test, expect } from "@playwright/test";
import {
  HEADERS,
  VALID_SUBMISSION,
  VALID_FORM,
  SUBMISSION_SIMPLE,
  SUBMISSION_DIFFERENT_TYPES,
  SUBMISSION_SPECIAL_CHARS,
  SUBMISSION_FIELD_NAME_MAX,
  SUBMISSION_HONEYPOT_FILLED,
  LIST_PARAMS_VALID,
  LIST_PARAMS_INVALID,
} from "../../test-data/api_test_data.js";
import { FormsApi } from "../../api/FormsApi.js";
import { SubmissionsApi } from "../../api/SubmissionsApi.js";

test.describe("Submissions API", () => {
  let formId: string;

  test.beforeEach("create form and save id", async ({ request }) => {
    const createFormResponse = await new FormsApi(request).create(VALID_FORM);
    expect(createFormResponse.status()).toBe(201);
    formId = (await createFormResponse.json()).id;
  });

  test("create submission", async ({ request }) => {
    const response = await new SubmissionsApi(request).create(
      VALID_SUBMISSION,
      formId,
    );
    expect(response.status()).toBe(201);
  });

  test("create submission simple data", async ({ request }) => {
    const response = await new SubmissionsApi(request).create(
      SUBMISSION_SIMPLE,
      formId,
    );
    expect(response.status()).toBe(201);
  });

  test("create submission different types", async ({ request }) => {
    const response = await new SubmissionsApi(request).create(
      SUBMISSION_DIFFERENT_TYPES,
      formId,
    );
    expect(response.status()).toBe(201);
  });

  test("create submission special chars", async ({ request }) => {
    const response = await new SubmissionsApi(request).create(
      SUBMISSION_SPECIAL_CHARS,
      formId,
    );
    expect(response.status()).toBe(201);
  });

  test("create submission field name max lenght", async ({ request }) => {
    const response = await new SubmissionsApi(request).create(
      SUBMISSION_FIELD_NAME_MAX,
      formId,
    );
    expect(response.status()).toBe(201);
  });

  test("create submission honeypot filled", async ({ request }) => {
    const response = await new SubmissionsApi(request).create(
      SUBMISSION_HONEYPOT_FILLED,
      formId,
    );
    expect(response.status()).toBe(201);
  });

  test.describe("existing submission", () => {
    let submissionId: string;

    test.beforeEach("create submission and save id", async ({ request }) => {
      const submissionsApi = new SubmissionsApi(request);

      const createResponse = await submissionsApi.create(
        VALID_SUBMISSION,
        formId,
      );
      expect(createResponse.status()).toBe(201);

      submissionId = await submissionsApi.waitForFirstSubmissionId(formId);
    });

    test("list submissions", async ({ request }) => {
      const response = await new SubmissionsApi(request).list(HEADERS, formId);
      expect(response.status()).toBe(200);
    });

    for (const [caseName, data] of Object.entries(LIST_PARAMS_VALID)) {
      test(`list submissions valid params ${caseName} `, async ({
        request,
      }) => {
        const response = await new SubmissionsApi(request).list(
          HEADERS,
          formId,
          data,
        );
        expect(response.status()).toBe(200);
      });
    }

    for (const [caseName, data] of Object.entries(LIST_PARAMS_INVALID)) {
      test(`list submissions invalid params ${caseName} `, async ({
        request,
      }) => {
        const response = await new SubmissionsApi(request).list(
          HEADERS,
          formId,
          data,
        );
        expect(response.status()).toBe(400);
      });
    }

    test("get submission", async ({ request }) => {
      const response = await new SubmissionsApi(request).get(
        HEADERS,
        formId,
        submissionId,
      );
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data).toMatchObject(VALID_SUBMISSION);
    });

    test("delete submission", async ({ request }) => {
      const response = await new SubmissionsApi(request).delete(
        HEADERS,
        formId,
        submissionId,
      );
      expect(response.status()).toBe(204);
    });
  });
});
