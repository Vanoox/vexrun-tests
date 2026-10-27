import { expect, type APIResponse } from "@playwright/test";
import {
  HEADERS,
  RATE_LIMIT,
  SUBMISSION_ERRORS,
} from "../test-data/api_test_data.js";
import { BaseApi } from "./BaseApi.js";
import { expectStatus } from "./expectations.js";

export class SubmissionsApi extends BaseApi {
  // on rate_limit waits a minute and tries once more,
  // rate-limit.spec.ts turns this off to get the error itself
  async create(
    data: object,
    formId: string,
    { waitOnRateLimit = true } = {},
  ) {
    const response = await this.post(data, formId);
    if (!waitOnRateLimit || !(await isRateLimited(response))) {
      return response;
    }
    console.warn(`rate_limit hit, retrying in ${RATE_LIMIT.waitMs / 1000}s`);
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT.waitMs));
    return this.post(data, formId);
  }

  private post(data: object, formId: string) {
    return this.send("POST", `/v1/forms/${formId}`, { data });
  }

  // submissions are saved async, poll until the new one shows up
  async waitForFirstSubmissionId(formId: string) {
    let submissionId: string | undefined;

    await expect
      .poll(
        async () => {
          const listResponse = await this.list(HEADERS, formId);
          await expectStatus(listResponse, 200);
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
    return this.send(
      "GET",
      `/v1/forms/${formId}/submissions/${submissionId}`,
      { headers },
    );
  }

  list(
    headers: Record<string, string>,
    formId: string,
    params?: Record<string, string | number>,
  ) {
    return this.send("GET", `/v1/forms/${formId}/submissions`, {
      headers,
      params: params ?? {},
    });
  }

  delete(
    headers: Record<string, string>,
    formId: string,
    submissionId: string,
  ) {
    return this.send(
      "DELETE",
      `/v1/forms/${formId}/submissions/${submissionId}`,
      { headers },
    );
  }

  async createAndWait(formId: string, data: object) {
    const createResponse = await this.create(data, formId);
    await expectStatus(createResponse, 201);
    return this.waitForFirstSubmissionId(formId);
  }

  async createAndGet(formId: string, data: object) {
    const submissionId = await this.createAndWait(formId, data);
    const getResponse = await this.get(HEADERS, formId, submissionId);
    await expectStatus(getResponse, 200);
    return getResponse.json();
  }
}

async function isRateLimited(response: APIResponse) {
  if (response.status() !== 422) return false;
  const body = await response.json();
  return body.error === SUBMISSION_ERRORS.rateLimit;
}
