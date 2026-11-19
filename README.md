# Vexrun Forms – API tests

Automated API tests for the Vexrun Forms service (forms, submissions, analytics, authorization), written in Playwright and TypeScript. API docs: [http-api.json](https://docs.dev.vexrun.com/http-api.json).

## What is tested

**Forms** (`/v1/forms`)
- creating forms with valid, minimum, maximum and special-character values; the response must equal the sent data plus `id` and `created_at`
- `id` and `created_at` sent in the body are ignored
- validation: 19 invalid cases, each breaking exactly one field, plus missing required fields (400); the `errors` list must point at exactly the broken fields
- partial updates (PATCH): the change is read back from the list, unchanged fields keep their values, invalid and empty updates are rejected
- overview status after enabling and disabling a form (`open`, `form_disabled`)
- duplicating (new id, whole config copied, submissions not copied), listing and deleting (a deleted form returns 404 and is gone from the list)
- 404 for a nonexistent and a malformed id on every form endpoint

**Analytics** (`/v1/forms/{id}/analytics`)
- one entry per day for a date range, missing and wrong dates (400)
- end date before start date – marked with `test.fail()`, the API returns 500

**Submissions** (`/v1/forms/{id}`, `/v1/forms/{id}/submissions`)
- JSON submissions with different data types, nested objects, special characters, HTML/SQL strings, max field name length and max number of fields; the stored data is read back and compared
- the success response (`success_title`, `success_message`, `redirect_url`)
- `Referer` and `User-Agent` are saved with the submission
- `multipart/form-data`: 303 redirect without `Accept`, 201 with `Accept: application/json`, the `$` field with JSON data
- `Accept: text/html` on an error: 303 to `redirect_url` with `error` and `message` in the query
- honeypot: a bot submission returns 201 but is not saved
- errors: empty data, disabled form and form limit reached (422 with the matching `error` code), invalid JSON (400), too long field name, too large data and too many fields (413)
- rate limit: more than 15 submissions per minute returns 422 `rate_limit`
- list: pagination (`limit`/`offset` and `cursor`), sorting by `created_at`, case-insensitive search, invalid params (400)
- getting and deleting a submission (a deleted submission returns 404), 404 for unknown ids
- deleting a form deletes its submissions

**Files** (`/v1/forms/{id}/submissions/{id}/files/{id}`)
- uploading a file with multipart: file metadata in the submission, downloading it and comparing the content
- the download is named after the field, the original file name is not saved
- max 10 files per submission, 11 returns 413
- 404 for unknown file ids, deleting a submission deletes its files

**Authorization** (nightly only)
- wrong API key, wrong team ID and missing headers (401)
- runs only with `RUN_AUTH_TESTS=1`, because too many failed auth requests block the IP for 15 minutes

## Tech stack

- [Playwright Test](https://playwright.dev/) (`APIRequestContext`)
- TypeScript
- pnpm

## Project structure

```
api/                  API client classes (FormsApi, SubmissionsApi)
  BaseApi.ts          shared request method, hides the API key in errors
  expectations.ts     status and error body checks
  types.ts            response types from http-api.json
test-data/            test data and validation cases
tests/api/            API test specs
  fixtures.ts         formsApi, submissionsApi and form fixtures
  cleanup.setup.ts    removes leftover forms before the run
playwright.config.ts  projects, base URL, workers
```

Specs call the API only through the classes in `api/`, so an endpoint change needs a fix in one place. The test data lives in `test-data/`, and invalid cases are generated in loops from one object.

## Design notes

- **Fixtures:** specs get `formsApi`, `submissionsApi` and a fresh `form` from `tests/api/fixtures.ts`. Every form created through `formsApi` is deleted after the test, also when it fails.
- **Clean start:** the `api-cleanup` setup project runs before the tests and deletes all forms in the test team. It only catches leftovers from killed runs.
- **Isolation:** tests that change data use their own `form`. List tests share one form with two submissions from `beforeAll`.
- **Asynchronous writes:** submissions are not stored immediately, so the tests wait for them with `expect.poll` instead of fixed timeouts. The honeypot test sends a normal submission after the bot one and waits for it, otherwise an empty list would prove nothing.
- **Sorting:** `created_at` has one-second precision, so sort tests check the order of dates, not of ids.
- **Sequential API runs:** one worker, because the cleanup step and the tests share one team.
- **Error bodies:** a failed status check prints the URL and response body. Error tests check the invalid field (400) or the `error` code (422), since all submission errors share 422.
- **Rate limits:** 15 submissions per minute per IP, so list tests share submissions, and on `rate_limit` a submission waits a minute and retries once. Rate-limit tests run after the main suite (`api-rate-limit`), auth tests run last (`api-auth`) because failed auth blocks the IP for 15 min.
- **No secrets in reports:** traces are off for API tests (they store request headers), and the API key is replaced with `***` in request errors.

## Running the tests

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
cp .env.example .env    # fill in the API key and team ID
pnpm test:api
pnpm report             # open the HTML report
```

Optional env variables: `BASE_URL` (default `https://forms.dev.vexrun.com`) and `RUN_AUTH_TESTS=1`.

CI runs on push and PR to `main`, and every night (with the auth tests).
