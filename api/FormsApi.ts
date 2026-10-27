import { HEADERS } from "../test-data/api_test_data.js";
import { BaseApi } from "./BaseApi.js";

export class FormsApi extends BaseApi {
  create(data: object, headers: Record<string, string> = HEADERS) {
    return this.send("POST", "/v1/forms", { headers, data });
  }

  update(data: object, headers: Record<string, string>, formId: string) {
    return this.send("PATCH", `/v1/forms/${formId}`, { headers, data });
  }

  duplicate(headers: Record<string, string>, formId: string) {
    return this.send("POST", `/v1/forms/${formId}/duplicate`, { headers });
  }

  getOverview(formId: string) {
    return this.send("GET", `/v1/forms/${formId}/overview`);
  }

  list(headers: Record<string, string> = HEADERS) {
    return this.send("GET", "/v1/forms", { headers });
  }

  delete(headers: Record<string, string>, formId: string) {
    return this.send("DELETE", `/v1/forms/${formId}`, { headers });
  }
}
