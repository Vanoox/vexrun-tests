import { test as setup } from "@playwright/test";
import { HEADERS } from "../../test-data/api_test_data.js";
import { FormsApi } from "../../api/FormsApi.js";
import { expectStatus } from "../../api/expectations.js";

setup("delete all forms", async ({ request }) => {
  const listResponse = await new FormsApi(request).list(HEADERS);
  await expectStatus(listResponse, 200);

  const body = await listResponse.json();
  const forms = Array.isArray(body) ? body : body.data;
  const formIds: string[] = forms.map((form: { id: string }) => form.id);

  for (const formId of formIds) {
    const deleteResponse = await new FormsApi(request).delete(HEADERS, formId);
    await expectStatus(deleteResponse, 204);
  }
});
