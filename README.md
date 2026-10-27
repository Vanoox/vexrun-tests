# Vexrun Forms – API tests

Automated API tests for the Vexrun Forms service (forms, submissions, authorization), written in Playwright and TypeScript.

## What is tested

**Forms** (`/v1/forms`)
- creating forms with valid, minimum, maximum and special-character values, and checking that the response contains the sent data
- validation: 17 invalid cases, each breaking exactly one field, plus missing required fields (400); the `errors` list must point at exactly the broken fields
- partial updates (PATCH): unchanged fields keep their values, invalid and empty updates are rejected
- overview, duplicating, listing and deleting (a deleted form returns 404)

**Submissions** (`/v1/forms/{id}/submissions`)
- submissions with different data types, nested objects, special characters, HTML/SQL strings and the maximum field name length; the stored data is read back and compared
- honeypot: a bot submission returns 201 but is not saved
- errors: empty data, disabled form and form limit reached (422 with the matching `error` code), too long field name, too large data and too many fields (413)
- rate limit: more than 15 submissions per minute returns 422 `rate_limit`
- list parameters (pagination, sorting, search), valid and invalid
- getting and deleting a submission (a deleted submission returns 404)

**Authorization** (skipped for now)
- wrong API key, wrong team ID and missing headers (401)
- skipped because too many failed auth requests block the IP for 15 minutes

## Tech stack

- [Playwright Test](https://playwright.dev/) (`APIRequestContext`)
- TypeScript
- pnpm

## Project structure

```
api/                  API client classes (FormsApi, SubmissionsApi)
  BaseApi.ts          shared request method, hides the API key in errors
  expectations.ts     status and error body checks
test-data/            test data and validation cases
tests/api/            API test specs
  cleanup.setup.ts    removes leftover forms before the run
playwright.config.ts  projects, base URLs, workers
```

Specs call the API only through the classes in `api/`, so an endpoint change needs a fix in one place. The test data lives in `test-data/`, and invalid cases are generated in loops from one object.

## Design notes

- **Clean start:** the `api-cleanup` setup project runs before the tests (`dependencies`) and deletes all forms in the test team.
- **Isolation:** tests that change data create their own form in `beforeEach`. Read-only submission tests share one form and submission from `beforeAll`.
- **Asynchronous writes:** submissions are not stored immediately, so the tests wait for them with `expect.poll` instead of fixed timeouts.
- **Sequential API runs:** the API project uses one worker, because the cleanup step and the tests share one team.
- **Error bodies:** a failed status check prints the URL and response body. Error tests check the invalid field (400) or the `error` code (422), since all submission errors share 422.
- **Rate limits:** 15 submissions per minute per IP, so read-only tests share one submission, and on `rate_limit` a submission waits a minute and retries once. Too many failed auth requests block the IP for 15 minutes, so auth and rate-limit tests run last (`api-limits`).
- **No secrets in reports:** traces are off for API tests (they store request headers), and the API key is replaced with `***` in request errors.

## Running the tests

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
cp .env.example .env    # fill in the API key and team ID
pnpm test:api
pnpm report             # open the HTML report
```

The API address is set in `playwright.config.ts` (`apiUse.baseURL`).
