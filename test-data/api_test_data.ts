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
  name: "Formularz kontaktowy",
  is_enabled: true,
  limit: 100,
  honeypot_field: "bot_trap_field",
  redirect_url: "https://example.com/dziekujemy",
  success_title: "Dziękujemy!",
  success_message: "Otrzymaliśmy Twoją wiadomość. Odpowiemy w ciągu 24 godzin.",
};

// every field differs from VALID_FORM
export const EDITED_FORM = {
  name: "Formularz kontaktowy – edytowany",
  is_enabled: false,
  limit: 50,
  honeypot_field: "hidden_spam_input",
  redirect_url: "https://example.com/wyslano",
  success_title: "Wysłano!",
  success_message: "Wiadomość została wysłana.",
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
  redirect_url: "https://example.com/dziekujemy",
  success_title: "T".repeat(50),
  success_message: "M".repeat(200),
};

export const FORM_SPECIAL_CHARS = {
  name: "Zażółć gęślą jaźń 🚀",
  is_enabled: true,
  limit: null,
  honeypot_field: null,
  redirect_url: null,
  success_title: "Dzięki! ✅",
  success_message: `Cudzysłowy "test", apostrof 'test' i <b>HTML</b>`,
};

// each case breaks one field -> 400
export const INVALID_FORMS = {
  nameTooShort: { ...VALID_FORM, name: "A" },
  nameTooLong: { ...VALID_FORM, name: "N".repeat(51) },
  nameNotString: { ...VALID_FORM, name: 12345 },
  isEnabledAsString: { ...VALID_FORM, is_enabled: "true" },
  limitZero: { ...VALID_FORM, limit: 0 },
  limitNegative: { ...VALID_FORM, limit: -5 },
  limitTooBig: { ...VALID_FORM, limit: 100_000_001 },
  limitDecimal: { ...VALID_FORM, limit: 10.5 },
  limitAsString: { ...VALID_FORM, limit: "20" },
  honeypotEmpty: { ...VALID_FORM, honeypot_field: "" },
  honeypotTooLong: { ...VALID_FORM, honeypot_field: "h".repeat(101) },
  redirectUrlInvalid: { ...VALID_FORM, redirect_url: "to-nie-jest-url" },
  redirectUrlTooLong: {
    ...VALID_FORM,
    redirect_url: "https://example.com/" + "a".repeat(2000),
  },
  successTitleTooShort: { ...VALID_FORM, success_title: "S" },
  successTitleTooLong: { ...VALID_FORM, success_title: "T".repeat(51) },
  successMessageTooShort: { ...VALID_FORM, success_message: "M" },
  successMessageTooLong: { ...VALID_FORM, success_message: "M".repeat(201) },
};

export const FORM_MISSING_FIELDS = {
  name: "Tylko nazwa",
};

export const FORM_EMPTY = {};

// --- Updates (PATCH) ---

export const UPDATE_ONLY_NAME = {
  name: "Tylko nowa nazwa",
};

// submitting to a disabled form -> 422 form_disabled
export const UPDATE_DISABLE_FORM = {
  is_enabled: false,
};

export const UPDATE_ENABLE_FORM = {
  is_enabled: true,
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

// the API rejects an empty PATCH -> 400
export const UPDATE_EMPTY = {};

export const UPDATE_INVALID = {
  name: "A",
};

// --- Headers ---

export const HEADERS_WRONG_API_KEY = {
  ...HEADERS,
  "x-api-key": "zly-klucz-api-123",
};

export const HEADERS_WRONG_TEAM_ID = {
  ...HEADERS,
  "x-team-id": "zly-team-id-123",
};

export const HEADERS_EMPTY = {};

// --- Submissions ---
// The API accepts any fields and stores them as sent.

export const VALID_SUBMISSION = {
  imie: "Anna",
  nazwisko: "Kowalska",
  email: "anna.kowalska@example.com",
  telefon: "+48 601 234 567",
  temat: "Pytanie o ofertę",
  wiadomosc: "Dzień dobry, proszę o wycenę kuchni na wymiar.",
  budzetPLN: 15000.5,
  zgodaRodo: true,
  firma: null,
  preferowanyKontakt: ["email", "telefon"],
  adres: {
    miasto: "Warszawa",
    kodPocztowy: "00-123",
  },
};

export const SUBMISSION_SIMPLE = {
  imie: "Jan",
  email: "jan.nowak@example.com",
  wiadomosc: "Dzień dobry, mam pytanie.",
};

export const SUBMISSION_DIFFERENT_TYPES = {
  imie: "Ewa",
  wiek: 30,
  ocena: 4.5,
  zgodaNaNewsletter: true,
  drugieImie: null,
  tagi: ["wsparcie", "faktury"],
  adres: { miasto: "Kraków", kraj: "Polska" },
};

export const SUBMISSION_SPECIAL_CHARS = {
  polskieZnaki: "Zażółć gęślą jaźń ĄĆĘŁŃÓŚŹŻ",
  emoji: "😀🔥✅",
  html: "<script>alert('xss')</script>",
  sql: "'; DROP TABLE users; --",
  nowaLinia: "linia 1\nlinia 2",
};

// field name: 100 chars (max)
export const SUBMISSION_FIELD_NAME_MAX = {
  ["p".repeat(100)]: "wartość",
};

// fills the VALID_FORM honeypot -> 201, but the submission is not saved
export const SUBMISSION_HONEYPOT_FILLED = {
  imie: "Bot",
  bot_trap_field: "spam spam spam",
};

// -> 422 no_data
export const SUBMISSION_EMPTY = {};

// -> 413
export const SUBMISSION_FIELD_NAME_TOO_LONG = {
  ["p".repeat(101)]: "wartość",
};

// ~110 KB, max 100 KB -> 413
export const SUBMISSION_TOO_LARGE = {
  tekst: "x".repeat(110_000),
};

// 1001 fields, max 1000 -> 413
export const SUBMISSION_TOO_MANY_FIELDS: Record<string, number> = {};
for (let i = 1; i <= 1001; i++) {
  SUBMISSION_TOO_MANY_FIELDS[`pole${i}`] = i;
}

// values of the "error" field returned with 422
export const SUBMISSION_ERRORS = {
  formDisabled: "form_disabled",
  limitReached: "submission_limit_reached",
  noData: "no_data",
  rateLimit: "rate_limit",
};

// --- IDs ---

export const NONEXISTENT_ID = "000000000000000000000000";
export const MALFORMED_ID = "to-nie-jest-id";

// --- Submission list params ---

export const LIST_PARAMS_VALID = {
  firstPage: { limit: 10, offset: 0 },
  oldestFirst: { sort: "ASC" },
  newestFirst: { sort: "DESC" },
  maxLimit: { limit: 500 },
  search: { search: "Kowalska" },
};

// -> 400
export const LIST_PARAMS_INVALID = {
  limitZero: { limit: 0 },
  limitTooBig: { limit: 501 },
  offsetNegative: { offset: -1 },
  sortWrong: { sort: "UP" },
  cursorTooShort: { cursor: "abc" }, // must be exactly 24 chars
  searchTooLong: { search: "s".repeat(101) },
};
