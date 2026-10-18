import type { APIRequestContext } from "@playwright/test";
import { HEADERS } from "../test-data/api_test_data.js";

export class FormsApi {
  request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  create(data: object, headers: object = HEADERS) {
    return this.request.post("/v1/forms", { headers, data });
  }

  update(data: object, headers: object = HEADERS, form_id: Array<string>) {
    return this.request.patch(`v1/forms/${form_id}`, { headers, data });
  }

  duplicate(headers: object = HEADERS, form_id: Array<string>) {
    return this.request.post(`v1/forms/${form_id}/duplicate`, { headers });
  }

  get(form_id: Array<string>) {
    return this.request.get(`v1/forms/${form_id}/overview`);
  }

  getAll(headers: object = HEADERS) {
    return this.request.get(`v1/forms`, { headers });
  }
  delete(headers: object = HEADERS, form_id: string) {
    return this.request.delete(`v1/forms/${form_id}`, { headers });
  }
}
