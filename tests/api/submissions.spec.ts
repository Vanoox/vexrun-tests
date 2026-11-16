import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "./fixtures.js";
import {
  VALID_SUBMISSION,
  VALID_FORM,
  SUBMISSION_SIMPLE,
  SUBMISSION_DIFFERENT_TYPES,
  SUBMISSION_SPECIAL_CHARS,
  SUBMISSION_FIELD_NAME_MAX,
  SUBMISSION_MAX_FIELDS,
  SUBMISSION_MULTIPART,
  SUBMISSION_MULTIPART_JSON_DATA,
  SUBMISSION_MULTIPART_WITH_JSON,
  SUBMISSION_HONEYPOT_FILLED,
  SUBMISSION_EMPTY,
  SUBMISSION_ARRAY,
  SUBMISSION_INVALID_JSON,
  INVALID_JSON_MESSAGE,
  SUBMISSION_FIELD_NAME_TOO_LONG,
  SUBMISSION_TOO_LARGE,
  SUBMISSION_TOO_MANY_FIELDS,
  SUBMISSION_ERRORS,
  FORM_NOT_FOUND_MESSAGE,
  SUBMISSION_NOT_FOUND_MESSAGE,
  NOT_FOUND_IDS,
  UPDATE_DISABLE_FORM,
  UPDATE_LIMIT_ONE,
  LIST_SEARCH,
  LIST_SEARCH_NO_MATCH,
  LIST_MAX_LIMIT,
  LIST_PARAMS_INVALID,
} from "../../test-data/api_test_data.js";
import { FormsApi } from "../../api/FormsApi.js";
import { SubmissionsApi } from "../../api/SubmissionsApi.js";
import type { Submission } from "../../api/types.js";
import {
  expectApiError,
  expectStatus,
  expectSubmissionError,
  expectValidationError,
} from "../../api/expectations.js";

// 15 submissions/min per IP, so the list tests share one form with two submissions

const VALID_SUBMISSIONS = {
  "simple data": SUBMISSION_SIMPLE,
  "different types": SUBMISSION_DIFFERENT_TYPES,
  "special chars": SUBMISSION_SPECIAL_CHARS,
  "field name max length": SUBMISSION_FIELD_NAME_MAX,
  "max number of fields": SUBMISSION_MAX_FIELDS,
};

const NO_DATA_CASES = {
  "empty object": SUBMISSION_EMPTY,
  array: SUBMISSION_ARRAY,
};

const TOO_LARGE_CASES = {
  "field name too long": SUBMISSION_FIELD_NAME_TOO_LONG,
  "data too large": SUBMISSION_TOO_LARGE,
  "too many fields": SUBMISSION_TOO_MANY_FIELDS,
};

test.describe("Submissions API – create", () => {
  for (const [caseName, data] of Object.entries(VALID_SUBMISSIONS)) {
    test(`create submission ${caseName}`, async ({ submissionsApi, form }) => {
      const submission = await submissionsApi.createAndGet(form.id, data);
      expect(submission.data).toEqual(data);
    });
  }

  test("create submission returns success page data", async ({
    submissionsApi,
    form,
  }) => {
    const response = await submissionsApi.create(form.id, SUBMISSION_SIMPLE);
    await expectStatus(response, 201);
    expect(await response.json()).toEqual({
      success_title: VALID_FORM.success_title,
      success_message: VALID_FORM.success_message,
      redirect_url: VALID_FORM.redirect_url,
    });
  });

  test("create submission as multipart redirects to redirect_url", async ({
    submissionsApi,
    form,
  }) => {
    // no Accept header + multipart -> 303
    const response = await submissionsApi.createMultipart(
      form.id,
      SUBMISSION_MULTIPART,
    );
    expect(response.status()).toBe(303);
    expect(response.headers()["location"]).toBe(VALID_FORM.redirect_url);
  });

  test("create submission as multipart with accept json", async ({
    submissionsApi,
    form,
  }) => {
    const response = await submissionsApi.createMultipart(
      form.id,
      SUBMISSION_MULTIPART,
      { accept: "application/json" },
    );
    await expectStatus(response, 201);
    const [submission] = await submissionsApi.waitForSubmissions(form.id, 1);
    expect(submission!.data).toEqual(SUBMISSION_MULTIPART);
  });

  test("create submission as multipart with $ json field", async ({
    submissionsApi,
    form,
  }) => {
    const response = await submissionsApi.createMultipart(
      form.id,
      SUBMISSION_MULTIPART_WITH_JSON,
      { accept: "application/json" },
    );
    await expectStatus(response, 201);
    const [submission] = await submissionsApi.waitForSubmissions(form.id, 1);
    expect(submission!.data).toEqual(SUBMISSION_MULTIPART_JSON_DATA);
  });

  test("create submission honeypot filled is not saved", async ({
    submissionsApi,
    form,
  }) => {
    const bot = await submissionsApi.create(
      form.id,
      SUBMISSION_HONEYPOT_FILLED,
    );
    await expectStatus(bot, 201);

    // saving is async, so an empty list right after the bot request proves
    // nothing - send a normal submission and wait until that one is saved
    const human = await submissionsApi.create(form.id, SUBMISSION_SIMPLE);
    await expectStatus(human, 201);
    const results = await submissionsApi.waitForSubmissions(form.id, 1);

    expect(results.map((submission) => submission.data)).toEqual([
      SUBMISSION_SIMPLE,
    ]);
  });

  for (const [caseName, data] of Object.entries(NO_DATA_CASES)) {
    test(`create submission with ${caseName}`, async ({
      submissionsApi,
      form,
    }) => {
      const response = await submissionsApi.create(form.id, data);
      await expectSubmissionError(response, SUBMISSION_ERRORS.noData);
    });
  }

  test("create submission with invalid json", async ({
    submissionsApi,
    form,
  }) => {
    const response = await submissionsApi.create(
      form.id,
      SUBMISSION_INVALID_JSON,
    );
    await expectApiError(response, 400, INVALID_JSON_MESSAGE);
  });

  test("create submission to disabled form", async ({
    formsApi,
    submissionsApi,
    form,
  }) => {
    const update = await formsApi.update(form.id, UPDATE_DISABLE_FORM);
    await expectStatus(update, 200);

    const response = await submissionsApi.create(form.id, SUBMISSION_SIMPLE);
    await expectSubmissionError(response, SUBMISSION_ERRORS.formDisabled);
  });

  test("create submission to disabled form with accept text/html", async ({
    formsApi,
    submissionsApi,
    form,
  }) => {
    const update = await formsApi.update(form.id, UPDATE_DISABLE_FORM);
    await expectStatus(update, 200);

    const response = await submissionsApi.create(form.id, SUBMISSION_SIMPLE, {
      accept: "text/html",
    });
    expect(response.status()).toBe(303);
    // errors redirect too, with ?error=...&message=... added
    const location = new URL(response.headers()["location"]!);
    expect(location.origin + location.pathname).toBe(VALID_FORM.redirect_url);
    expect(location.searchParams.get("error")).toBe(
      SUBMISSION_ERRORS.formDisabled,
    );
    expect(location.searchParams.get("message")).toBeTruthy();
  });

  test("create submission over form limit", async ({
    formsApi,
    submissionsApi,
    form,
  }) => {
    const update = await formsApi.update(form.id, UPDATE_LIMIT_ONE);
    await expectStatus(update, 200);

    await submissionsApi.createAndWait(form.id, SUBMISSION_SIMPLE);
    const response = await submissionsApi.create(form.id, SUBMISSION_SIMPLE);
    await expectSubmissionError(response, SUBMISSION_ERRORS.limitReached);

    const overview = await formsApi.getOverview(form.id);
    expect(await overview.json()).toMatchObject({
      status: "submission_limit_reached",
    });
  });

  for (const [caseName, data] of Object.entries(TOO_LARGE_CASES)) {
    test(`create submission ${caseName}`, async ({ submissionsApi, form }) => {
      const response = await submissionsApi.create(form.id, data);
      await expectApiError(response, 413);
    });
  }
});

test.describe("Submissions API – not found", () => {
  for (const [idName, id] of Object.entries(NOT_FOUND_IDS)) {
    test(`create submission for ${idName} form id`, async ({
      submissionsApi,
    }) => {
      const response = await submissionsApi.create(id, SUBMISSION_SIMPLE);
      await expectApiError(response, 404, FORM_NOT_FOUND_MESSAGE);
    });

    test(`list submissions for ${idName} form id`, async ({
      submissionsApi,
    }) => {
      const response = await submissionsApi.list(id);
      await expectApiError(response, 404, FORM_NOT_FOUND_MESSAGE);
    });

    test(`get submission with ${idName} id`, async ({
      submissionsApi,
      form,
    }) => {
      const response = await submissionsApi.get(form.id, id);
      await expectApiError(response, 404, SUBMISSION_NOT_FOUND_MESSAGE);
    });

    test(`delete submission with ${idName} id`, async ({
      submissionsApi,
      form,
    }) => {
      const response = await submissionsApi.delete(form.id, id);
      await expectApiError(response, 404, SUBMISSION_NOT_FOUND_MESSAGE);
    });
  }
});

test.describe("Submissions API – list and get", () => {
  let request: APIRequestContext;
  let formsApi: FormsApi;
  let formId: string;

  test.beforeAll(
    "create form with two submissions",
    async ({ playwright }, testInfo) => {
      request = await playwright.request.newContext({
        baseURL: testInfo.project.use.baseURL!,
      });
      formsApi = new FormsApi(request);
      const submissionsApi = new SubmissionsApi(request);

      formId = (await formsApi.createOrFail(VALID_FORM)).id;
      for (const data of [VALID_SUBMISSION, SUBMISSION_SIMPLE]) {
        const response = await submissionsApi.create(formId, data);
        await expectStatus(response, 201);
      }
      await submissionsApi.waitForSubmissions(formId, 2);
    },
  );

  test.afterAll(async () => {
    await formsApi.deleteCreated();
    await request.dispose();
  });

  test("list submissions", async ({ submissionsApi }) => {
    const list = await submissionsApi.listOrFail(formId);
    expect(list.total).toBe(2);
    expect(list.results.map((submission) => submission.data)).toEqual(
      expect.arrayContaining([VALID_SUBMISSION, SUBMISSION_SIMPLE]),
    );
  });

  test("list submissions with limit and offset", async ({
    submissionsApi,
  }) => {
    const firstPage = await submissionsApi.listOrFail(formId, {
      limit: 1,
      offset: 0,
    });
    const secondPage = await submissionsApi.listOrFail(formId, {
      limit: 1,
      offset: 1,
    });

    expect(firstPage.results).toHaveLength(1);
    expect(secondPage.results).toHaveLength(1);
    expect(firstPage.total).toBe(2);
    expect(secondPage.results[0]!.id).not.toBe(firstPage.results[0]!.id);
  });

  test("list submissions with max limit", async ({ submissionsApi }) => {
    const list = await submissionsApi.listOrFail(formId, {
      limit: LIST_MAX_LIMIT,
    });
    expect(list.results).toHaveLength(2);
  });

  // created_at is in seconds, so two submissions can have the same value -
  // check the order of dates, not of ids
  for (const sort of ["ASC", "DESC"] as const) {
    test(`list submissions sorted ${sort}`, async ({ submissionsApi }) => {
      const list = await submissionsApi.listOrFail(formId, { sort });
      const dates = list.results.map((submission) => submission.created_at);
      const sorted = dates.toSorted((a, b) => (sort === "ASC" ? a - b : b - a));
      expect(dates).toEqual(sorted);
    });
  }

  test("list submissions with cursor", async ({ submissionsApi }) => {
    const all = await submissionsApi.listOrFail(formId, { sort: "ASC" });
    const ids = all.results.map((submission) => submission.id);

    // offset=1 skips the cursor submission itself
    const next = await submissionsApi.listOrFail(formId, {
      sort: "ASC",
      cursor: ids[0]!,
      offset: 1,
    });
    expect(next.results.map((submission) => submission.id)).toEqual(
      ids.slice(1),
    );
  });

  test("list submissions with search", async ({ submissionsApi }) => {
    const list = await submissionsApi.listOrFail(formId, {
      search: LIST_SEARCH,
    });
    expect(list.results.map((submission) => submission.data)).toEqual([
      VALID_SUBMISSION,
    ]);
  });

  test("list submissions with search no match", async ({
    submissionsApi,
  }) => {
    const list = await submissionsApi.listOrFail(formId, {
      search: LIST_SEARCH_NO_MATCH,
    });
    expect(list.results).toHaveLength(0);
  });

  for (const [caseName, { field, params }] of Object.entries(
    LIST_PARAMS_INVALID,
  )) {
    test(`list submissions invalid params ${caseName}`, async ({
      submissionsApi,
    }) => {
      const response = await submissionsApi.list(formId, params);
      await expectValidationError(response, [field]);
    });
  }

  test("get submission", async ({ submissionsApi }) => {
    const list = await submissionsApi.listOrFail(formId, {
      search: LIST_SEARCH,
    });
    const submissionId = list.results[0]!.id;

    const response = await submissionsApi.get(formId, submissionId);
    await expectStatus(response, 200);
    expect(await response.json()).toEqual({
      id: submissionId,
      country: expect.any(String),
      ip: expect.any(String),
      user_agent: expect.any(String),
      referer: expect.any(String),
      data: VALID_SUBMISSION,
      files: [],
      created_at: expect.any(Number),
    } satisfies Record<keyof Submission, unknown>);
  });
});

test.describe("Submissions API – delete", () => {
  test("delete submission", async ({ submissionsApi, form }) => {
    const submissionId = await submissionsApi.createAndWait(
      form.id,
      VALID_SUBMISSION,
    );

    const response = await submissionsApi.delete(form.id, submissionId);
    await expectStatus(response, 204);

    const getAfter = await submissionsApi.get(form.id, submissionId);
    await expectApiError(getAfter, 404, SUBMISSION_NOT_FOUND_MESSAGE);
    expect((await submissionsApi.listOrFail(form.id)).total).toBe(0);
  });
});
