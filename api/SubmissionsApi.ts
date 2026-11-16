import { expect, type APIResponse } from "@playwright/test";
import {
  HEADERS,
  RATE_LIMIT,
  SUBMISSION_ERRORS,
} from "../test-data/api_test_data.js";
import { BaseApi } from "./BaseApi.js";
import { expectStatus } from "./expectations.js";
import type { Submission, SubmissionList } from "./types.js";

type Headers = Record<string, string>;

type CreateOptions = {
  // "text/html" makes the API answer with a 303 redirect
  accept?: string;
  // rate-limit.spec.ts turns this off to get the error itself
  waitOnRateLimit?: boolean;
};

export class SubmissionsApi extends BaseApi {
  // a string is sent as a raw body (e.g. broken JSON) - playwright would
  // JSON.stringify an invalid JSON string, a Buffer goes as it is
  create(formId: string, data: object | string, options: CreateOptions = {}) {
    return this.withRateLimitRetry(options, () =>
      this.send("POST", `/v1/forms/${formId}`, {
        headers: {
          "content-type": "application/json",
          ...acceptHeader(options.accept),
        },
        data: typeof data === "string" ? Buffer.from(data) : data,
        maxRedirects: 0,
      }),
    );
  }

  createMultipart(
    formId: string,
    fields: Record<string, string>,
    options: CreateOptions = {},
  ) {
    return this.withRateLimitRetry(options, () =>
      this.send("POST", `/v1/forms/${formId}`, {
        headers: acceptHeader(options.accept),
        multipart: fields,
        maxRedirects: 0,
      }),
    );
  }

  get(formId: string, submissionId: string, headers: Headers = HEADERS) {
    return this.send(
      "GET",
      `/v1/forms/${formId}/submissions/${submissionId}`,
      { headers },
    );
  }

  list(
    formId: string,
    params: Record<string, string | number> = {},
    headers: Headers = HEADERS,
  ) {
    return this.send("GET", `/v1/forms/${formId}/submissions`, {
      headers,
      params,
    });
  }

  delete(formId: string, submissionId: string, headers: Headers = HEADERS) {
    return this.send(
      "DELETE",
      `/v1/forms/${formId}/submissions/${submissionId}`,
      { headers },
    );
  }

  async listOrFail(formId: string, params: Record<string, string | number> = {}) {
    const response = await this.list(formId, params);
    await expectStatus(response, 200);
    return (await response.json()) as SubmissionList;
  }

  // submissions are saved async, poll until there are at least `count` of them
  async waitForSubmissions(formId: string, count: number) {
    let results: Submission[] = [];

    await expect
      .poll(
        async () => {
          results = (await this.listOrFail(formId)).results;
          return results.length;
        },
        { timeout: 10_000, intervals: [500, 1000, 2000] },
      )
      .toBeGreaterThanOrEqual(count);

    return results;
  }

  async createAndWait(formId: string, data: object) {
    const createResponse = await this.create(formId, data);
    await expectStatus(createResponse, 201);
    const results = await this.waitForSubmissions(formId, 1);
    return results[0]!.id;
  }

  async createAndGet(formId: string, data: object) {
    const submissionId = await this.createAndWait(formId, data);
    const getResponse = await this.get(formId, submissionId);
    await expectStatus(getResponse, 200);
    return (await getResponse.json()) as Submission;
  }

  // on rate_limit waits a minute and tries once more
  private async withRateLimitRetry(
    { waitOnRateLimit = true }: CreateOptions,
    post: () => Promise<APIResponse>,
  ) {
    const response = await post();
    if (!waitOnRateLimit || !(await isRateLimited(response))) {
      return response;
    }
    console.warn(`rate_limit hit, retrying in ${RATE_LIMIT.waitMs / 1000}s`);
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT.waitMs));
    return post();
  }
}

function acceptHeader(accept: string | undefined): Headers {
  return accept ? { accept } : {};
}

// 422 for json, 303 with ?error= in the location for text/html
async function isRateLimited(response: APIResponse) {
  const code = SUBMISSION_ERRORS.rateLimit;
  if (response.status() === 303) {
    return response.headers()["location"]?.includes(`error=${code}`) ?? false;
  }
  if (response.status() !== 422) return false;
  const body = await response.json();
  return body.error === code;
}
