import { expect, type APIResponse } from "@playwright/test";

export async function expectStatus(response: APIResponse, status: number) {
  const body = await response.text();
  expect(response.status(), `${response.url()}\n${body}`).toBe(status);
}

export async function expectValidationError(
  response: APIResponse,
  fields: string[],
) {
  await expectStatus(response, 400);
  const body = await response.json();
  const paths = body.errors.map((error: { path: string }) => error.path);
  expect([...new Set(paths)].sort()).toEqual(
    fields.map((field) => `$input.${field}`).sort(),
  );
}

export async function expectSubmissionError(
  response: APIResponse,
  code: string,
) {
  await expectStatus(response, 422);
  expect(await response.json()).toMatchObject({
    error: code,
    message: expect.any(String),
  });
}

export async function expectApiError(
  response: APIResponse,
  status: number,
  message?: string,
) {
  await expectStatus(response, status);
  expect(await response.json()).toMatchObject({
    message: message ?? expect.any(String),
  });
}
