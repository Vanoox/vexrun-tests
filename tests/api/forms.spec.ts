import type { APIResponse } from "@playwright/test";
import { test, expect } from "./fixtures.js";
import {
  VALID_FORM,
  EDITED_FORM,
  FORM_MIN_VALUES,
  FORM_MAX_VALUES,
  FORM_SPECIAL_CHARS,
  FORM_READ_ONLY_FIELDS,
  INVALID_FORMS,
  FORM_MISSING_FIELDS,
  FORM_MISSING_FIELDS_ERRORS,
  FORM_NOT_FOUND_MESSAGE,
  NOT_FOUND_IDS,
  UPDATE_ONLY_NAME,
  UPDATE_DISABLE_FORM,
  UPDATE_LIMIT_ONE,
  UPDATE_CLEAR_OPTIONAL,
  UPDATE_EMPTY,
  UPDATE_EMPTY_MESSAGE,
  UPDATE_INVALID,
  ANALYTICS_RANGE,
  ANALYTICS_RANGE_DAYS,
  ANALYTICS_RANGE_REVERSED,
  ANALYTICS_RANGE_REVERSED_MESSAGE,
  ANALYTICS_PARAMS_INVALID,
  SUBMISSION_SIMPLE,
} from "../../test-data/api_test_data.js";
import type { FormsApi } from "../../api/FormsApi.js";
import type { FormOverview } from "../../api/types.js";
import {
  expectApiError,
  expectStatus,
  expectValidationError,
} from "../../api/expectations.js";

const VALID_FORMS = {
  "valid data": VALID_FORM,
  "min values": FORM_MIN_VALUES,
  "max values": FORM_MAX_VALUES,
  "special chars": FORM_SPECIAL_CHARS,
};

async function getStatus(formsApi: FormsApi, formId: string) {
  const response = await formsApi.getOverview(formId);
  await expectStatus(response, 200);
  return ((await response.json()) as FormOverview).status;
}

test.describe("Forms API – create", () => {
  for (const [caseName, data] of Object.entries(VALID_FORMS)) {
    test(`create form with ${caseName}`, async ({ formsApi }) => {
      const response = await formsApi.create(data);
      await expectStatus(response, 201);
      expect(await response.json()).toEqual({
        ...data,
        id: expect.any(String),
        created_at: expect.any(Number),
      });
    });
  }

  test("create form ignores id and created_at from body", async ({
    formsApi,
  }) => {
    const form = await formsApi.createOrFail({
      ...VALID_FORM,
      ...FORM_READ_ONLY_FIELDS,
    });
    expect(form.id).not.toBe(FORM_READ_ONLY_FIELDS.id);
    expect(form.created_at).not.toBe(FORM_READ_ONLY_FIELDS.created_at);
  });

  for (const [caseName, { field, data }] of Object.entries(INVALID_FORMS)) {
    test(`create form with invalid data: ${caseName}`, async ({ formsApi }) => {
      const response = await formsApi.create(data);
      await expectValidationError(response, [field]);
    });
  }

  test("create form with missing fields", async ({ formsApi }) => {
    const response = await formsApi.create(FORM_MISSING_FIELDS);
    await expectValidationError(response, FORM_MISSING_FIELDS_ERRORS);
  });
});

test.describe("Forms API – existing form", () => {
  test("update form", async ({ formsApi, form }) => {
    const response = await formsApi.update(form.id, EDITED_FORM);
    await expectStatus(response, 200);
    expect(await response.json()).toMatchObject(EDITED_FORM);
    expect(await formsApi.findInList(form.id)).toMatchObject(EDITED_FORM);
  });

  test("update form only name", async ({ formsApi, form }) => {
    const response = await formsApi.update(form.id, UPDATE_ONLY_NAME);
    await expectStatus(response, 200);
    const expected = { ...VALID_FORM, ...UPDATE_ONLY_NAME };
    expect(await response.json()).toMatchObject(expected);
    expect(await formsApi.findInList(form.id)).toMatchObject(expected);
  });

  test("update form disable form", async ({ formsApi, form }) => {
    const response = await formsApi.update(form.id, UPDATE_DISABLE_FORM);
    await expectStatus(response, 200);
    expect(await response.json()).toMatchObject(UPDATE_DISABLE_FORM);
    expect(await getStatus(formsApi, form.id)).toBe("form_disabled");
  });

  test("update form enable disabled form", async ({ formsApi, form }) => {
    const disable = await formsApi.update(form.id, UPDATE_DISABLE_FORM);
    await expectStatus(disable, 200);

    const response = await formsApi.update(form.id, { is_enabled: true });
    await expectStatus(response, 200);
    expect(await response.json()).toMatchObject({ is_enabled: true });
    expect(await getStatus(formsApi, form.id)).toBe("open");
  });

  test("update form limit 1", async ({ formsApi, form }) => {
    const response = await formsApi.update(form.id, UPDATE_LIMIT_ONE);
    await expectStatus(response, 200);
    expect(await response.json()).toMatchObject(UPDATE_LIMIT_ONE);
  });

  test("update form clear optional field", async ({ formsApi, form }) => {
    const response = await formsApi.update(form.id, UPDATE_CLEAR_OPTIONAL);
    await expectStatus(response, 200);
    expect(await response.json()).toMatchObject(UPDATE_CLEAR_OPTIONAL);
  });

  test("update form with empty body", async ({ formsApi, form }) => {
    const response = await formsApi.update(form.id, UPDATE_EMPTY);
    await expectApiError(response, 400, UPDATE_EMPTY_MESSAGE);
  });

  test("update form too short name", async ({ formsApi, form }) => {
    const response = await formsApi.update(form.id, UPDATE_INVALID);
    await expectValidationError(response, ["name"]);
    expect(await formsApi.findInList(form.id)).toMatchObject(VALID_FORM);
  });

  test("get form overview", async ({ formsApi, form }) => {
    const response = await formsApi.getOverview(form.id);
    await expectStatus(response, 200);
    expect(await response.json()).toEqual({
      status: "open",
      schema: null,
      show_branding: expect.any(Boolean),
      redirect_url: VALID_FORM.redirect_url,
      success_title: VALID_FORM.success_title,
      success_message: VALID_FORM.success_message,
    });
  });

  test("duplicate form", async ({ formsApi, form }) => {
    const response = await formsApi.duplicate(form.id);
    await expectStatus(response, 201);
    const copy = await response.json();
    expect(copy).toMatchObject(VALID_FORM);
    expect(copy.id).not.toBe(form.id);
    expect(await formsApi.findInList(copy.id)).toMatchObject(VALID_FORM);
  });

  test("duplicate form copies its whole config", async ({ formsApi }) => {
    const original = await formsApi.createOrFail(EDITED_FORM);
    const response = await formsApi.duplicate(original.id);
    await expectStatus(response, 201);
    expect(await response.json()).toMatchObject(EDITED_FORM);
  });

  test("duplicate form does not copy submissions", async ({
    formsApi,
    submissionsApi,
    form,
  }) => {
    await submissionsApi.createAndWait(form.id, SUBMISSION_SIMPLE);

    const response = await formsApi.duplicate(form.id);
    await expectStatus(response, 201);
    const copy = await response.json();
    expect((await submissionsApi.listOrFail(copy.id)).total).toBe(0);
  });

  test("list forms", async ({ formsApi, form }) => {
    expect(await formsApi.findInList(form.id)).toEqual(form);
  });

  test("delete form", async ({ formsApi, form }) => {
    const response = await formsApi.delete(form.id);
    await expectStatus(response, 204);

    const overview = await formsApi.getOverview(form.id);
    await expectApiError(overview, 404, FORM_NOT_FOUND_MESSAGE);
    expect(await formsApi.findInList(form.id)).toBeUndefined();
  });
});

const NOT_FOUND_REQUESTS: Record<
  string,
  (formsApi: FormsApi, formId: string) => Promise<APIResponse>
> = {
  overview: (formsApi, formId) => formsApi.getOverview(formId),
  update: (formsApi, formId) => formsApi.update(formId, UPDATE_ONLY_NAME),
  duplicate: (formsApi, formId) => formsApi.duplicate(formId),
  delete: (formsApi, formId) => formsApi.delete(formId),
  analytics: (formsApi, formId) =>
    formsApi.getAnalytics(formId, ANALYTICS_RANGE),
};

test.describe("Forms API – not found", () => {
  for (const [idName, formId] of Object.entries(NOT_FOUND_IDS)) {
    for (const [action, send] of Object.entries(NOT_FOUND_REQUESTS)) {
      test(`${action} with ${idName} id returns 404`, async ({ formsApi }) => {
        const response = await send(formsApi, formId);
        await expectApiError(response, 404, FORM_NOT_FOUND_MESSAGE);
      });
    }
  }
});

test.describe("Forms API – analytics", () => {
  test("get analytics for date range", async ({ formsApi, form }) => {
    const response = await formsApi.getAnalytics(form.id, ANALYTICS_RANGE);
    await expectStatus(response, 200);
    const days = await response.json();
    expect(days.map((day: { date: string }) => day.date)).toEqual(
      ANALYTICS_RANGE_DAYS,
    );
    expect(days[0]).toEqual({
      date: ANALYTICS_RANGE_DAYS[0],
      hours: {},
      countries: {},
      user_agents: {},
      referers: {},
    });
  });

  for (const [caseName, { params, fields }] of Object.entries(
    ANALYTICS_PARAMS_INVALID,
  )) {
    test(`get analytics invalid params ${caseName}`, async ({
      formsApi,
      form,
    }) => {
      const response = await formsApi.getAnalytics(form.id, params);
      await expectValidationError(response, fields);
    });
  }

  test("get analytics with end date before start date", async ({
    formsApi,
    form,
  }) => {
    const response = await formsApi.getAnalytics(
      form.id,
      ANALYTICS_RANGE_REVERSED,
    );
    await expectApiError(response, 400, ANALYTICS_RANGE_REVERSED_MESSAGE);
  });
});
