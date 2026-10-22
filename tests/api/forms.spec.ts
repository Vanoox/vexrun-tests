import { test, expect } from "@playwright/test";
import {
  HEADERS,
  VALID_FORM,
  EDITED_FORM,
  FORM_MIN_VALUES,
  FORM_MAX_VALUES,
  FORM_SPECIAL_CHARS,
  INVALID_FORMS,
  FORM_MISSING_FIELDS,
  UPDATE_ONLY_NAME,
  UPDATE_DISABLE_FORM,
  UPDATE_ENABLE_FORM,
  UPDATE_LIMIT_ONE,
  UPDATE_CLEAR_OPTIONAL,
  UPDATE_EMPTY,
  UPDATE_INVALID,
} from "../../test-data/api_test_data.js";
import { FormsApi } from "../../api/FormsApi.js";

test.describe("Forms API – create", () => {
  test("create form with valid data", async ({ request }) => {
    const response = await new FormsApi(request).create(VALID_FORM);
    expect(response.status()).toBe(201);
  });

  test("create form with min values", async ({ request }) => {
    const response = await new FormsApi(request).create(FORM_MIN_VALUES);
    expect(response.status()).toBe(201);
  });

  test("create form with max values", async ({ request }) => {
    const response = await new FormsApi(request).create(FORM_MAX_VALUES);
    expect(response.status()).toBe(201);
  });

  test("create form with special chars", async ({ request }) => {
    const response = await new FormsApi(request).create(FORM_SPECIAL_CHARS);
    expect(response.status()).toBe(201);
  });

  for (const [caseName, data] of Object.entries(INVALID_FORMS)) {
    test(`create form with invalid data: ${caseName}`, async ({ request }) => {
      const response = await new FormsApi(request).create(data);
      expect(response.status()).toBe(400);
    });
  }

  test("create form with missing fields", async ({ request }) => {
    const response = await new FormsApi(request).create(FORM_MISSING_FIELDS);
    expect(response.status()).toBe(400);
  });
});

test.describe("Forms API – existing form", () => {
  let formId: string;

  test.beforeEach("create form and save id", async ({ request }) => {
    const response = await new FormsApi(request).create(VALID_FORM);
    expect(response.status()).toBe(201);
    formId = (await response.json()).id;
  });

  test("update form", async ({ request }) => {
    const response = await new FormsApi(request).update(
      EDITED_FORM,
      HEADERS,
      formId,
    );
    expect(response.status()).toBe(200);
  });

  test("update form only name", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_ONLY_NAME,
      HEADERS,
      formId,
    );
    expect(response.status()).toBe(200);
  });

  test("update form disable form", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_DISABLE_FORM,
      HEADERS,
      formId,
    );
    expect(response.status()).toBe(200);
  });

  test("update form enable form", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_ENABLE_FORM,
      HEADERS,
      formId,
    );
    expect(response.status()).toBe(200);
  });

  test("update form limit 1", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_LIMIT_ONE,
      HEADERS,
      formId,
    );
    expect(response.status()).toBe(200);
  });

  test("update form clear optional field", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_CLEAR_OPTIONAL,
      HEADERS,
      formId,
    );
    expect(response.status()).toBe(200);
  });

  test("update form clear without change", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_EMPTY,
      HEADERS,
      formId,
    );
    expect(response.status()).toBe(200);
  });

  test("update form too short name", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_INVALID,
      HEADERS,
      formId,
    );
    expect(response.status()).toBe(400);
  });

  test("get form overview", async ({ request }) => {
    const response = await new FormsApi(request).getOverview(formId);
    expect(response.status()).toBe(200);
  });

  test("duplicate form", async ({ request }) => {
    const response = await new FormsApi(request).duplicate(HEADERS, formId);
    expect(response.status()).toBe(201);
  });

  test("list forms", async ({ request }) => {
    const response = await new FormsApi(request).list();
    expect(response.status()).toBe(200);
  });

  test("delete form", async ({ request }) => {
    const response = await new FormsApi(request).delete(HEADERS, formId);
    expect(response.status()).toBe(204);
  });
});
