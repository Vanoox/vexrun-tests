import { expect, type APIRequestContext } from "@playwright/test";
import { HEADERS } from "../test-data/api_test_data.js";

export class SubmissionsApi {
  request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  create(data: object, formId: string) {
    return this.request.post(`/v1/forms/${formId}`, { data });
  }

  // submissions are saved async, poll until the new one shows up
  async waitForFirstSubmissionId(formId: string) {
    let submissionId: string | undefined;

    await expect
      .poll(
        async () => {
          const listResponse = await this.list(HEADERS, formId);
          expect(listResponse.status()).toBe(200);
          const body = await listResponse.json();
          submissionId = body.results[0]?.id;
          return submissionId;
        },
        { timeout: 10_000, intervals: [500, 1000, 2000] },
      )
      .toBeDefined();

    return submissionId!;
  }

  get(headers: Record<string, string>, formId: string, submissionId: string) {
    return this.request.get(`/v1/forms/${formId}/submissions/${submissionId}`, {
      headers,
    });
  }

  list(
    headers: Record<string, string>,
    formId: string,
    params?: Record<string, string | number>,
  ) {
    return this.request.get(`/v1/forms/${formId}/submissions`, {
      headers,
      params: params ?? {},
    });
  }

  delete(
    headers: Record<string, string>,
    formId: string,
    submissionId: string,
  ) {
    return this.request.delete(
      `/v1/forms/${formId}/submissions/${submissionId}`,
      { headers },
    );
  }

  // creates a submission and returns it as saved by the API
  async createAndGet(formId: string, data: object) {
    const createResponse = await this.create(data, formId);
    expect(createResponse.status()).toBe(201);

    const submissionId = await this.waitForFirstSubmissionId(formId);
    const getResponse = await this.get(HEADERS, formId, submissionId);
    expect(getResponse.status()).toBe(200);

    return getResponse.json();
  }
}
