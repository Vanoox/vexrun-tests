import { test as base } from "@playwright/test";
import { FormsApi } from "../../api/FormsApi.js";
import { SubmissionsApi } from "../../api/SubmissionsApi.js";
import type { Form } from "../../api/types.js";
import { VALID_FORM } from "../../test-data/api_test_data.js";

type ApiFixtures = {
  formsApi: FormsApi;
  submissionsApi: SubmissionsApi;
  form: Form;
};

export const test = base.extend<ApiFixtures>({
  // deletes every form created in the test, also when the test fails
  formsApi: async ({ request }, use) => {
    const formsApi = new FormsApi(request);
    await use(formsApi);
    await formsApi.deleteCreated();
  },

  submissionsApi: async ({ request }, use) => {
    await use(new SubmissionsApi(request));
  },

  form: async ({ formsApi }, use) => {
    await use(await formsApi.createOrFail(VALID_FORM));
  },
});

export { expect } from "@playwright/test";
