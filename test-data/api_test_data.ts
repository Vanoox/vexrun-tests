function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env variable: ${name}`);
  }
  return value;
}

export const HEADERS = {
  "x-team-id": requireEnv("X_TEAM_ID_TEST_API"),
  "x-api-key": requireEnv("X_API_KEY_TEST_API"),
};

// Validation rules from http-api.json:
// name, success_title: 2-50 chars | success_message: 2-200
// limit: null or 1-100 000 000 | honeypot_field: null or 1-100 chars
// redirect_url: null or URL (max 2000) | is_enabled: boolean
// POST requires all fields, PATCH makes them all optional.

// --- Forms ---

// limit 100 so the submission tests don't use it up
export const VALID_FORM = {
  name: "Contact form",
  is_enabled: true,
  limit: 100,
  honeypot_field: "bot_trap_field",
  redirect_url: "https://example.com/thank-you",
  success_title: "Thank you!",
  success_message: "We got your message and will reply within 24 hours.",
};

// every field differs from VALID_FORM
export const EDITED_FORM = {
  name: "Contact form – edited",
  is_enabled: false,
  limit: 50,
  honeypot_field: "hidden_spam_input",
  redirect_url: "https://example.com/sent",
  success_title: "Sent!",
  success_message: "Your message has been sent.",
};

export const FORM_MIN_VALUES = {
  name: "AB",
  is_enabled: true,
  limit: 1,
  honeypot_field: null,
  redirect_url: null,
  success_title: "OK",
  success_message: "Hi",
};

export const FORM_MAX_VALUES = {
  name: "N".repeat(50),
  is_enabled: true,
  limit: 100_000_000,
  honeypot_field: "h".repeat(100),
  redirect_url: "https://example.com/thank-you",
  success_title: "T".repeat(50),
  success_message: "M".repeat(200),
};

export const FORM_SPECIAL_CHARS = {
  name: "Ünïcödé ąęółż 日本語 🚀",
  is_enabled: true,
  limit: null,
  honeypot_field: null,
  redirect_url: null,
  success_title: "Thanks! ✅",
  success_message: `Double quotes "test", apostrophe 'test' and <b>HTML</b>`,
};

// each case breaks one field -> 400 with that field in errors
function invalidForm<K extends keyof typeof VALID_FORM>(
  field: K,
  value: unknown,
) {
  return { field, data: { ...VALID_FORM, [field]: value } };
}

export const INVALID_FORMS = {
  nameTooShort: invalidForm("name", "A"),
  nameTooLong: invalidForm("name", "N".repeat(51)),
  nameNotString: invalidForm("name", 12345),
  nameNull: invalidForm("name", null),
  isEnabledAsString: invalidForm("is_enabled", "true"),
  isEnabledNull: invalidForm("is_enabled", null),
  limitZero: invalidForm("limit", 0),
  limitNegative: invalidForm("limit", -5),
  limitTooBig: invalidForm("limit", 100_000_001),
  limitDecimal: invalidForm("limit", 10.5),
  limitAsString: invalidForm("limit", "20"),
  honeypotEmpty: invalidForm("honeypot_field", ""),
  honeypotTooLong: invalidForm("honeypot_field", "h".repeat(101)),
  redirectUrlInvalid: invalidForm("redirect_url", "not-a-url"),
  redirectUrlTooLong: invalidForm(
    "redirect_url",
    "https://example.com/" + "a".repeat(2000),
  ),
  successTitleTooShort: invalidForm("success_title", "S"),
  successTitleTooLong: invalidForm("success_title", "T".repeat(51)),
  successMessageTooShort: invalidForm("success_message", "M"),
  successMessageTooLong: invalidForm("success_message", "M".repeat(201)),
};

export const FORM_MISSING_FIELDS = {
  name: "Name only",
};

// everything except name
export const FORM_MISSING_FIELDS_ERRORS = [
  "is_enabled",
  "limit",
  "honeypot_field",
  "redirect_url",
  "success_title",
  "success_message",
];

// the API generates these itself and ignores them in the body
export const FORM_READ_ONLY_FIELDS = {
  id: "000000000000000000000000",
  created_at: 1,
};

// --- Updates (PATCH) ---

export const UPDATE_ONLY_NAME = {
  name: "New name only",
};

// submitting to a disabled form -> 422 form_disabled
export const UPDATE_DISABLE_FORM = {
  is_enabled: false,
};

// second submission -> 422 submission_limit_reached
export const UPDATE_LIMIT_ONE = {
  is_enabled: true,
  limit: 1,
};

export const UPDATE_CLEAR_OPTIONAL = {
  limit: null,
  honeypot_field: null,
  redirect_url: null,
};

// the API rejects an empty PATCH -> 400, no errors list
export const UPDATE_EMPTY = {};
export const UPDATE_EMPTY_MESSAGE = "No fields to update";

export const UPDATE_INVALID = {
  name: "A",
};

// --- Headers ---

export const HEADERS_WRONG_API_KEY = {
  ...HEADERS,
  "x-api-key": "wrong-api-key-123",
};

export const HEADERS_WRONG_TEAM_ID = {
  ...HEADERS,
  "x-team-id": "wrong-team-id-123",
};

export const HEADERS_EMPTY = {};

// --- Submissions ---
// The API accepts any fields and stores them as sent.

export const VALID_SUBMISSION = {
  firstName: "Anna",
  lastName: "Smith",
  email: "anna.smith@example.com",
  phone: "+48 601 234 567",
  subject: "Pricing question",
  message: "Hello, could you send me a quote for a custom kitchen?",
  budget: 15000.5,
  privacyConsent: true,
  company: null,
  preferredContact: ["email", "phone"],
  address: {
    city: "Warsaw",
    postalCode: "00-123",
  },
};

// different from VALID_SUBMISSION, so search can tell them apart
export const SUBMISSION_SIMPLE = {
  firstName: "John",
  email: "john.doe@example.com",
  message: "Hello, I have a question.",
};

export const SUBMISSION_DIFFERENT_TYPES = {
  firstName: "Eve",
  age: 30,
  rating: 4.5,
  newsletter: true,
  middleName: null,
  tags: ["support", "billing"],
  address: { city: "Krakow", country: "Poland" },
};

export const SUBMISSION_SPECIAL_CHARS = {
  unicode: "Ünïcödé ąęółż ĄĆĘŁŃÓŚŹŻ 日本語",
  emoji: "😀🔥✅",
  html: "<script>alert('xss')</script>",
  sql: "'; DROP TABLE users; --",
  newLine: "line 1\nline 2",
};

// field name: 100 chars (max)
export const SUBMISSION_FIELD_NAME_MAX = {
  ["f".repeat(100)]: "value",
};

// 1000 fields - the max
export const SUBMISSION_MAX_FIELDS: Record<string, number> = {};
for (let i = 1; i <= 1000; i++) {
  SUBMISSION_MAX_FIELDS[`field${i}`] = i;
}

// multipart/form-data - values are always strings
export const SUBMISSION_MULTIPART = {
  firstName: "Olivia",
  email: "olivia@example.com",
  message: "Sent as multipart/form-data",
};

// "$" with a JSON string replaces all other non-file fields
export const SUBMISSION_MULTIPART_JSON_DATA = {
  firstName: "Peter",
  age: 41,
  address: { city: "Gdansk" },
};

export const SUBMISSION_MULTIPART_WITH_JSON = {
  ignored: "this field should not be saved",
  $: JSON.stringify(SUBMISSION_MULTIPART_JSON_DATA),
};

export const SUBMISSION_REQUEST_HEADERS = {
  referer: "https://example.com/contact",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) vexrun-tests",
};

// fills the VALID_FORM honeypot -> 201, but the submission is not saved
export const SUBMISSION_HONEYPOT_FILLED = {
  firstName: "Bot",
  bot_trap_field: "spam spam spam",
};

// -> 422 no_data
export const SUBMISSION_EMPTY = {};
export const SUBMISSION_ARRAY = ["a", "b"];

// -> 400
export const SUBMISSION_INVALID_JSON = '{"firstName": "John",';
export const INVALID_JSON_MESSAGE =
  "Body is not valid JSON but content-type is set to 'application/json'";

// -> 413
export const SUBMISSION_FIELD_NAME_TOO_LONG = {
  ["f".repeat(101)]: "value",
};

// ~110 KB, max 100 KB -> 413
export const SUBMISSION_TOO_LARGE = {
  text: "x".repeat(110_000),
};

// 1001 fields, max 1000 -> 413
export const SUBMISSION_TOO_MANY_FIELDS: Record<string, number> = {};
for (let i = 1; i <= 1001; i++) {
  SUBMISSION_TOO_MANY_FIELDS[`field${i}`] = i;
}

// --- Files ---

const FILE_CONTENT = "Hello from the file upload test";

export const SUBMISSION_FILE = {
  name: "notes.txt",
  mimeType: "text/plain",
  buffer: Buffer.from(FILE_CONTENT),
};

export const SUBMISSION_WITH_FILE = {
  firstName: "Anna",
  cv: SUBMISSION_FILE,
};

export const SUBMISSION_FILE_METADATA = {
  field_name: "cv",
  size: Buffer.byteLength(FILE_CONTENT),
  mime_type: "text/plain",
  ext: ".txt",
};
export const SUBMISSION_FILE_CONTENT = FILE_CONTENT;

function textFiles(count: number) {
  const files: Record<string, typeof SUBMISSION_FILE> = {};
  for (let i = 1; i <= count; i++) {
    files[`file${i}`] = {
      name: `file${i}.txt`,
      mimeType: "text/plain",
      buffer: Buffer.from(`file ${i}`),
    };
  }
  return files;
}

// max 10 files per submission, 11 -> 413
export const SUBMISSION_MAX_FILES = textFiles(10);
export const SUBMISSION_TOO_MANY_FILES = textFiles(11);
export const FILE_COUNT_LIMIT_MESSAGE = "File count limit exceeded";
export const FILE_NOT_FOUND_MESSAGE = "File not found";

// values of the "error" field returned with 422
export const SUBMISSION_ERRORS = {
  formDisabled: "form_disabled",
  limitReached: "submission_limit_reached",
  noData: "no_data",
  rateLimit: "rate_limit",
};

// 15 submissions/min per IP, then 422 rate_limit for 60 s
export const RATE_LIMIT = {
  perMinute: 15,
  waitMs: 61_000,
};

export const FORM_NOT_FOUND_MESSAGE = "Form not found";
export const SUBMISSION_NOT_FOUND_MESSAGE = "Submission not found";

// --- IDs ---

// both return 404, the API doesn't validate the id format
export const NOT_FOUND_IDS = {
  nonexistent: "000000000000000000000000",
  malformed: "not-an-id",
};

// --- Analytics ---

// one entry per day, both dates included
export const ANALYTICS_RANGE = {
  start_date: "2026-01-01",
  end_date: "2026-01-07",
};
export const ANALYTICS_RANGE_DAYS = [
  "2026-01-01",
  "2026-01-02",
  "2026-01-03",
  "2026-01-04",
  "2026-01-05",
  "2026-01-06",
  "2026-01-07",
];

export const ANALYTICS_RANGE_REVERSED = {
  start_date: "2026-01-07",
  end_date: "2026-01-01",
};
export const ANALYTICS_RANGE_REVERSED_MESSAGE =
  "Start date must not be after end date";

// -> 400 with `fields` in errors
export const ANALYTICS_PARAMS_INVALID = {
  noDates: { fields: ["start_date", "end_date"], params: {} },
  noEndDate: { fields: ["end_date"], params: { start_date: "2026-01-01" } },
  wrongFormat: {
    fields: ["start_date"],
    params: { start_date: "01.01.2026", end_date: "2026-01-07" },
  },
};

// --- Submission list params ---

// search is case-insensitive, only VALID_SUBMISSION has this
export const LIST_SEARCH = "smith";
export const LIST_SEARCH_NO_MATCH = "no-such-text";
export const LIST_MAX_LIMIT = 500;

// -> 400 with `field` in errors
export const LIST_PARAMS_INVALID = {
  limitZero: { field: "limit", params: { limit: 0 } },
  limitTooBig: { field: "limit", params: { limit: 501 } },
  offsetNegative: { field: "offset", params: { offset: -1 } },
  sortWrong: { field: "sort", params: { sort: "UP" } },
  // must be exactly 24 chars
  cursorTooShort: { field: "cursor", params: { cursor: "abc" } },
  searchTooLong: { field: "search", params: { search: "s".repeat(101) } },
  // with search, offset can be max 1
  searchWithOffset: { field: "offset", params: { search: "a", offset: 2 } },
};
