import type { APIRequestContext } from "@playwright/test";
import { HEADERS } from "../test-data/api_test_data.js";

type RequestOptions = NonNullable<Parameters<APIRequestContext["fetch"]>[1]>;

const SECRETS = Object.values(HEADERS);

export class BaseApi {
  request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  // playwright adds request headers to network errors (call log),
  // so the api key would end up in the CI logs and the report
  protected async send(
    method: string,
    url: string,
    options: RequestOptions = {},
  ) {
    try {
      return await this.request.fetch(url, { ...options, method });
    } catch (error) {
      throw hideSecrets(error);
    }
  }
}

function hideSecrets(error: unknown) {
  if (!(error instanceof Error)) return error;
  for (const secret of SECRETS) {
    error.message = error.message.replaceAll(secret, "***");
    if (error.stack) error.stack = error.stack.replaceAll(secret, "***");
  }
  return error;
}
