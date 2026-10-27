import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  HEADERS,
  VALID_SUBMISSION,
  VALID_FORM,
  SUBMISSION_SIMPLE,
  SUBMISSION_DIFFERENT_TYPES,
  SUBMISSION_SPECIAL_CHARS,
  SUBMISSION_FIELD_NAME_MAX,
  SUBMISSION_HONEYPOT_FILLED,
  SUBMISSION_EMPTY,
  SUBMISSION_FIELD_NAME_TOO_LONG,
  SUBMISSION_TOO_LARGE,
  SUBMISSION_TOO_MANY_FIELDS,
  SUBMISSION_ERRORS,
  UPDATE_DISABLE_FORM,
  UPDATE_LIMIT_ONE,
  LIST_PARAMS_VALID,
  LIST_PARAMS_INVALID,
} from "../../test-data/api_test_data.js";
import { FormsApi } from "../../api/FormsApi.js";
import { SubmissionsApi } from "../../api/SubmissionsApi.js";
import {
  expectApiError,
  expectStatus,
  expectSubmissionError,
  expectValidationError,
} from "../../api/expectations.js";

// 15 submissions/min per IP, so read-only tests share one submission

async function createForm(request: APIRequestContext) {
  const response = await new FormsApi(request).create(VALID_FORM);
  await expectStatus(response, 201);
  return (await response.json()).id as string;
}

test.describe("Submissions API – create", () => {
  let formId: string;

  test.beforeEach("create form and save id", async ({ request }) => {
    formId = await createForm(request);
  });

  test("create submission simple data", async ({ request }) => {
    const body = await new SubmissionsApi(request).createAndGet(
      formId,
      SUBMISSION_SIMPLE,
    );
    expect(body.data).toMatchObject(SUBMISSION_SIMPLE);
  });

  test("create submission different types", async ({ request }) => {
    const body = await new SubmissionsApi(request).createAndGet(
      formId,
      SUBMISSION_DIFFERENT_TYPES,
    );
    expect(body.data).toMatchObject(SUBMISSION_DIFFERENT_TYPES);
  });

  test("create submission special chars", async ({ request }) => {
    const body = await new SubmissionsApi(request).createAndGet(
      formId,
      SUBMISSION_SPECIAL_CHARS,
    );
    expect(body.data).toMatchObject(SUBMISSION_SPECIAL_CHARS);
  });

  test("create submission field name max length", async ({ request }) => {
    const body = await new SubmissionsApi(request).createAndGet(
      formId,
      SUBMISSION_FIELD_NAME_MAX,
    );
    expect(body.data).toMatchObject(SUBMISSION_FIELD_NAME_MAX);
  });

  test("create submission honeypot filled is not saved", async ({
    request,
  }) => {
    const api = new SubmissionsApi(request);
    const response = await api.create(SUBMISSION_HONEYPOT_FILLED, formId);
    await expectStatus(response, 201);
    const list = await (await api.list(HEADERS, formId)).json();
    expect(list.results).toHaveLength(0);
  });

  test("create submission with empty data", async ({ request }) => {
    const response = await new SubmissionsApi(request).create(
      SUBMISSION_EMPTY,
      formId,
    );
    await expectSubmissionError(response, SUBMISSION_ERRORS.noData);
  });

  test("create submission to disabled form", async ({ request }) => {
    const update = await new FormsApi(request).update(
      UPDATE_DISABLE_FORM,
      HEADERS,
      formId,
    );
    await expectStatus(update, 200);

    const response = await new SubmissionsApi(request).create(
      SUBMISSION_SIMPLE,
      formId,
    );
    await expectSubmissionError(response, SUBMISSION_ERRORS.formDisabled);
  });

  test("create submission over form limit", async ({ request }) => {
    const update = await new FormsApi(request).update(
      UPDATE_LIMIT_ONE,
      HEADERS,
      formId,
    );
    await expectStatus(update, 200);

    const api = new SubmissionsApi(request);
    await api.createAndWait(formId, SUBMISSION_SIMPLE);
    const response = await api.create(SUBMISSION_SIMPLE, formId);
    await expectSubmissionError(response, SUBMISSION_ERRORS.limitReached);
  });

  const TOO_LARGE_CASES = {
    "field name too long": SUBMISSION_FIELD_NAME_TOO_LONG,
    "data too large": SUBMISSION_TOO_LARGE,
    "too many fields": SUBMISSION_TOO_MANY_FIELDS,
  };

  for (const [caseName, data] of Object.entries(TOO_LARGE_CASES)) {
    test(`create submission ${caseName}`, async ({ request }) => {
      const response = await new SubmissionsApi(request).create(data, formId);
      await expectApiError(response, 413);
    });
  }
});

test.describe("Submissions API – existing submission", () => {
  let formId: string;
  let submissionId: string;

  test.beforeAll(
    "create form and submission",
    async ({ playwright }, testInfo) => {
      const request = await playwright.request.newContext({
        baseURL: testInfo.project.use.baseURL!,
      });
      formId = await createForm(request);
      submissionId = await new SubmissionsApi(request).createAndWait(
        formId,
        VALID_SUBMISSION,
      );
      await request.dispose();
    },
  );

  test("list submissions", async ({ request }) => {
    const response = await new SubmissionsApi(request).list(HEADERS, formId);
    await expectStatus(response, 200);
  });

  for (const [caseName, data] of Object.entries(LIST_PARAMS_VALID)) {
    test(`list submissions valid params ${caseName}`, async ({ request }) => {
      const response = await new SubmissionsApi(request).list(
        HEADERS,
        formId,
        data,
      );
      await expectStatus(response, 200);
    });
  }

  for (const [caseName, data] of Object.entries(LIST_PARAMS_INVALID)) {
    test(`list submissions invalid params ${caseName}`, async ({ request }) => {
      const response = await new SubmissionsApi(request).list(
        HEADERS,
        formId,
        data,
      );
      await expectValidationError(response, Object.keys(data));
    });
  }

  test("get submission", async ({ request }) => {
    const response = await new SubmissionsApi(request).get(
      HEADERS,
      formId,
      submissionId,
    );
    await expectStatus(response, 200);
    const body = await response.json();
    expect(body.data).toMatchObject(VALID_SUBMISSION);
  });
});

test.describe("Submissions API – delete", () => {
  test("delete submission", async ({ request }) => {
    const api = new SubmissionsApi(request);
    const formId = await createForm(request);
    const submissionId = await api.createAndWait(formId, VALID_SUBMISSION);

    const response = await api.delete(HEADERS, formId, submissionId);
    await expectStatus(response, 204);
    const getAfter = await api.get(HEADERS, formId, submissionId);
    await expectApiError(getAfter, 404);
  });
});
