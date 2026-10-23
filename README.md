# Vexrun Forms – API tests

Automated API tests for the Vexrun Forms service (forms, submissions, authorization), written in Playwright and TypeScript.

## What is tested

**Forms** (`/v1/forms`)
- creating forms with valid, minimum, maximum and special-character values, and checking that the response contains the sent data
- validation: 17 invalid cases, each breaking exactly one field, plus missing required fields (400)
- partial updates (PATCH): unchanged fields keep their values, invalid and empty updates are rejected
- overview, duplicating, listing and deleting (a deleted form returns 404)

**Submissions** (`/v1/forms/{id}/submissions`)
- submissions with different data types, nested objects, special characters, HTML/SQL strings and the maximum field name length; the stored data is read back and compared
- honeypot: a bot submission returns 201 but is not saved
- list parameters (pagination, sorting, search), valid and invalid
- getting and deleting a submission (a deleted submission returns 404)

**Authorization**
- wrong API key, wrong team ID and missing headers (401)

## Tech stack

- [Playwright Test](https://playwright.dev/) (`APIRequestContext`)
- TypeScript
- pnpm

## Project structure

```
api/                  API client classes (FormsApi, SubmissionsApi)
test-data/            test data and validation cases
tests/api/            API test specs
  cleanup.setup.ts    removes leftover forms before the run
playwright.config.ts  projects, base URLs, workers
```

Specs call the API only through the classes in `api/`, so an endpoint change needs a fix in one place. The test data lives in `test-data/`, and invalid cases are generated in loops from one object.

## Design notes

- **Clean start:** the `api-cleanup` setup project runs before the tests (`dependencies`) and deletes all forms in the test team.
- **Isolation:** each test creates its own form in `beforeEach`, so tests don't depend on each other.
- **Asynchronous writes:** submissions are not stored immediately, so the tests wait for them with `expect.poll` instead of fixed timeouts.
- **Sequential API runs:** the API project uses one worker, because the cleanup step and the tests share one team.

## Running the tests

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
cp .env.example .env    # fill in the API key and team ID
pnpm test:api
pnpm report             # open the HTML report
```

The API address is set in `playwright.config.ts` (`baseURL` of the `api` project).
