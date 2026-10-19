import { test, expect } from "@playwright/test";
import {
  HEADERS,
  DATA_REQUEST,
  VALID_FORM,
  EDITED_FORM,
} from "../test-data/api_test_data.js";
import { FormsApi } from "../api/FormsApi.js";
process.loadEnvFile();

test.describe("Vexrun API", () => {
  test.describe.configure({ mode: "serial" });

  let forms_id: Array<string> = [];
  let submissions_id: string | undefined;

  test.beforeAll("cleaning all forms before tests", async ({ request }) => {
    const listResponse = await new FormsApi(request).getAll(HEADERS);
    expect(listResponse.status()).toBe(200);

    const body = await listResponse.json();
    const forms = Array.isArray(body) ? body : body.data;
    const formIds: string[] = forms.map((f: { id: string }) => f.id);

    for (const id of formIds) {
      const deleteResponse = await new FormsApi(request).delete(HEADERS, id);
      expect(deleteResponse.status()).toBe(204);
    }
  });

  test("create form", async ({ request }) => {
    const response = await new FormsApi(request).create(VALID_FORM);
    expect(response.status()).toBe(201);
    forms_id.push((await response.json()).id);
  });

  test("create submissions", async ({ request }) => {
    const response = await request.post(`/v1/forms/${forms_id[0]}`, {
      headers: { Accept: "application/json" },
      maxRedirects: 0,
      data: DATA_REQUEST,
    });
    expect(response.status()).toBe(201);
  });

  test("list many submissions", async ({ request }) => {
    await expect
      .poll(
        async () => {
          const response = await request.get(
            `/v1/forms/${forms_id[0]}/submissions`,
            {
              headers: HEADERS,
            },
          );
          expect(response.status()).toBe(200);
          const body = await response.json();
          submissions_id = body.results[0]?.id;
          return submissions_id;
        },
        { timeout: 10_000, intervals: [500, 1000, 2000] },
      )
      .toBeDefined();
  });

  test("get submission", async ({ request }) => {
    const response = await request.get(
      `/v1/forms/${forms_id[0]}/submissions/${submissions_id}`,
      { headers: HEADERS },
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject(DATA_REQUEST);
  });

  test("delete submission", async ({ request }) => {
    const response = await request.delete(
      `/v1/forms/${forms_id[0]}/submissions/${submissions_id}`,
      { headers: HEADERS },
    );
    expect(response.status()).toBe(204);
  });

  test("update form", async ({ request }) => {
    const response = await new FormsApi(request).update(
      EDITED_FORM,
      HEADERS,
      forms_id[0]!,
    );
    expect(expect(response.status()).toBe(200));
  });

  test("get form overwiew", async ({ request }) => {
    const response = await new FormsApi(request).getOverview(forms_id[0]!);
    expect(response.status()).toBe(200);
  });

  test("duplicate form", async ({ request }) => {
    const response = await new FormsApi(request).duplicate(
      HEADERS,
      forms_id[0]!,
    );
    expect(response.status()).toBe(201);
    forms_id.push((await response.json()).id);
  });

  test("list all forms", async ({ request }) => {
    const response = await new FormsApi(request).getAll();
    expect(await response.status()).toBe(200);
  });

  test("delete forms", async ({ request }) => {
    for (const id of forms_id) {
      const response = await new FormsApi(request).delete(HEADERS, id);
      expect(await response.status()).toBe(204);
    }
  });
});
