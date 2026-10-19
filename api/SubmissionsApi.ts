import type { APIRequestContext } from "@playwright/test";
import { HEADERS } from "../test-data/api_test_data.js";

export class SubmissionsAPI {
  request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  create(data: object, form_id: string) {
    return this.request.post(`v1/forms/${form_id}`, { data });
  }

  get(
    headers: Record<string, string> = HEADERS,
    form_id: string,
    submission_id: string,
  ) {
    return this.request.get(
      `/v1/forms/${form_id}/submissions/${submission_id}`,
      { headers },
    );
  }

  listMany(headers: Record<string, string> = HEADERS, form_id: string) {
    return this.request.get(`/v1/forms/${form_id}/submissions`, { headers });
  }

  delete(
    headers: Record<string, string> = HEADERS,
    form_id: string,
    submission_id: string,
  ) {
    return this.request.delete(
      `/v1/forms/${form_id}/submissions/${submission_id}`,
      { headers },
    );
  }
}
