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
  FORM_MISSING_FIELDS_ERRORS,
  FORM_NOT_FOUND_MESSAGE,
  UPDATE_ONLY_NAME,
  UPDATE_DISABLE_FORM,
  UPDATE_ENABLE_FORM,
  UPDATE_LIMIT_ONE,
  UPDATE_CLEAR_OPTIONAL,
  UPDATE_EMPTY,
  UPDATE_EMPTY_MESSAGE,
  UPDATE_INVALID,
} from "../../test-data/api_test_data.js";
import { FormsApi } from "../../api/FormsApi.js";
import {
  expectApiError,
  expectStatus,
  expectValidationError,
} from "../../api/expectations.js";

test.describe("Forms API – create", () => {
  test("create form with valid data", async ({ request }) => {
    const response = await new FormsApi(request).create(VALID_FORM);
    await expectStatus(response, 201);
    const body = await response.json();
    expect(body).toMatchObject(VALID_FORM);
  });

  test("create form with min values", async ({ request }) => {
    const response = await new FormsApi(request).create(FORM_MIN_VALUES);
    await expectStatus(response, 201);
    const body = await response.json();
    expect(body).toMatchObject(FORM_MIN_VALUES);
  });

  test("create form with max values", async ({ request }) => {
    const response = await new FormsApi(request).create(FORM_MAX_VALUES);
    await expectStatus(response, 201);
    const body = await response.json();
    expect(body).toMatchObject(FORM_MAX_VALUES);
  });

  test("create form with special chars", async ({ request }) => {
    const response = await new FormsApi(request).create(FORM_SPECIAL_CHARS);
    await expectStatus(response, 201);
    const body = await response.json();
    expect(body).toMatchObject(FORM_SPECIAL_CHARS);
  });

  for (const [caseName, { field, data }] of Object.entries(INVALID_FORMS)) {
    test(`create form with invalid data: ${caseName}`, async ({ request }) => {
      const response = await new FormsApi(request).create(data);
      await expectValidationError(response, [field]);
    });
  }

  test("create form with missing fields", async ({ request }) => {
    const response = await new FormsApi(request).create(FORM_MISSING_FIELDS);
    await expectValidationError(response, FORM_MISSING_FIELDS_ERRORS);
  });
});

test.describe("Forms API – existing form", () => {
  let formId: string;

  test.beforeEach("create form and save id", async ({ request }) => {
    const response = await new FormsApi(request).create(VALID_FORM);
    await expectStatus(response, 201);
    formId = (await response.json()).id;
  });

  test("update form", async ({ request }) => {
    const response = await new FormsApi(request).update(
      EDITED_FORM,
      HEADERS,
      formId,
    );
    await expectStatus(response, 200);
    const body = await response.json();
    expect(body).toMatchObject(EDITED_FORM);
  });

  test("update form only name", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_ONLY_NAME,
      HEADERS,
      formId,
    );
    await expectStatus(response, 200);
    const body = await response.json();
    expect(body).toMatchObject({ ...VALID_FORM, ...UPDATE_ONLY_NAME });
  });

  test("update form disable form", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_DISABLE_FORM,
      HEADERS,
      formId,
    );
    await expectStatus(response, 200);
    const body = await response.json();
    expect(body).toMatchObject(UPDATE_DISABLE_FORM);
  });

  test("update form enable form", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_ENABLE_FORM,
      HEADERS,
      formId,
    );
    await expectStatus(response, 200);
    const body = await response.json();
    expect(body).toMatchObject(UPDATE_ENABLE_FORM);
  });

  test("update form limit 1", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_LIMIT_ONE,
      HEADERS,
      formId,
    );
    await expectStatus(response, 200);
    const body = await response.json();
    expect(body).toMatchObject(UPDATE_LIMIT_ONE);
  });

  test("update form clear optional field", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_CLEAR_OPTIONAL,
      HEADERS,
      formId,
    );
    await expectStatus(response, 200);
    const body = await response.json();
    expect(body).toMatchObject(UPDATE_CLEAR_OPTIONAL);
  });

  test("update form with empty body", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_EMPTY,
      HEADERS,
      formId,
    );
    await expectApiError(response, 400, UPDATE_EMPTY_MESSAGE);
  });

  test("update form too short name", async ({ request }) => {
    const response = await new FormsApi(request).update(
      UPDATE_INVALID,
      HEADERS,
      formId,
    );
    await expectValidationError(response, ["name"]);
  });

  test("get form overview", async ({ request }) => {
    const response = await new FormsApi(request).getOverview(formId);
    await expectStatus(response, 200);
    const body = await response.json();
    expect(body).toMatchObject({
      status: "open",
      redirect_url: VALID_FORM.redirect_url,
      success_title: VALID_FORM.success_title,
      success_message: VALID_FORM.success_message,
    });
  });

  test("duplicate form", async ({ request }) => {
    const response = await new FormsApi(request).duplicate(HEADERS, formId);
    await expectStatus(response, 201);
    const body = await response.json();
    expect(body).toMatchObject(VALID_FORM);
  });

  test("list forms", async ({ request }) => {
    const response = await new FormsApi(request).list();
    await expectStatus(response, 200);
  });

  test("delete form", async ({ request }) => {
    const response = await new FormsApi(request).delete(HEADERS, formId);
    await expectStatus(response, 204);
    const responseGet = await new FormsApi(request).getOverview(formId);
    await expectApiError(responseGet, 404, FORM_NOT_FOUND_MESSAGE);
  });
});
