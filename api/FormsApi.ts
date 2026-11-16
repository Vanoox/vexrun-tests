import type { APIResponse } from "@playwright/test";
import { HEADERS } from "../test-data/api_test_data.js";
import { BaseApi } from "./BaseApi.js";
import { expectStatus } from "./expectations.js";
import type { Form } from "./types.js";

type Headers = Record<string, string>;

export class FormsApi extends BaseApi {
  // forms created through this instance, the fixture deletes them after the test
  createdIds: string[] = [];

  async create(data: object, headers: Headers = HEADERS) {
    const response = await this.send("POST", "/v1/forms", { headers, data });
    await this.remember(response);
    return response;
  }

  update(formId: string, data: object, headers: Headers = HEADERS) {
    return this.send("PATCH", `/v1/forms/${formId}`, { headers, data });
  }

  async duplicate(formId: string, headers: Headers = HEADERS) {
    const response = await this.send("POST", `/v1/forms/${formId}/duplicate`, {
      headers,
    });
    await this.remember(response);
    return response;
  }

  getOverview(formId: string) {
    return this.send("GET", `/v1/forms/${formId}/overview`);
  }

  getAnalytics(
    formId: string,
    params: Record<string, string> = {},
    headers: Headers = HEADERS,
  ) {
    return this.send("GET", `/v1/forms/${formId}/analytics`, {
      headers,
      params,
    });
  }

  list(headers: Headers = HEADERS) {
    return this.send("GET", "/v1/forms", { headers });
  }

  delete(formId: string, headers: Headers = HEADERS) {
    return this.send("DELETE", `/v1/forms/${formId}`, { headers });
  }

  async createOrFail(data: object) {
    const response = await this.create(data);
    await expectStatus(response, 201);
    return (await response.json()) as Form;
  }

  // there is no GET /v1/forms/{id}, so the list is the only way to read a form
  async findInList(formId: string) {
    const response = await this.list();
    await expectStatus(response, 200);
    const forms: Form[] = await response.json();
    return forms.find((form) => form.id === formId);
  }

  async deleteCreated() {
    for (const formId of this.createdIds) {
      const response = await this.delete(formId);
      // 404 - the test already deleted it
      if (![204, 404].includes(response.status())) {
        console.warn(`could not delete form ${formId}: ${response.status()}`);
      }
    }
    this.createdIds = [];
  }

  private async remember(response: APIResponse) {
    if (response.status() === 201) {
      this.createdIds.push((await response.json()).id);
    }
  }
}
