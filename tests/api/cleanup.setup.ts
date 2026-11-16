import { test as setup } from "@playwright/test";
import { FormsApi } from "../../api/FormsApi.js";
import type { Form } from "../../api/types.js";
import { expectStatus } from "../../api/expectations.js";

// tests delete their own forms, this only catches leftovers
// from runs that were killed before the teardown
setup("delete all forms", async ({ request }) => {
  const formsApi = new FormsApi(request);
  const listResponse = await formsApi.list();
  await expectStatus(listResponse, 200);

  const forms: Form[] = await listResponse.json();
  for (const form of forms) {
    const deleteResponse = await formsApi.delete(form.id);
    await expectStatus(deleteResponse, 204);
  }
});
