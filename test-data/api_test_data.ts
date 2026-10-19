export const HEADERS = {
  "x-team-id": process.env.X_TEAM_ID_TEST_API!,
  "x-api-key": process.env.X_API_KEY_TEST_API!,
};

// Formularz tworzony na początku testów (POST /v1/forms -> 201)
export const VALID_FORM = {
  name: "Formularz kontaktowy",
  is_enabled: true,
  limit: 100, // zapas, żeby kolejne testy zgłoszeń nie wyczerpały limitu
  honeypot_field: "bot_trap_field", // pole-pułapka na boty (używa go SUBMISSION_HONEYPOT_FILLED)
  redirect_url: "https://example.com/dziekujemy",
  success_title: "Dziękujemy!",
  success_message: "Otrzymaliśmy Twoją wiadomość. Odpowiemy w ciągu 24 godzin.",
};

// Ten sam formularz po edycji (PATCH /v1/forms/{id} -> 200).
// Każde pole ma inną wartość niż w VALID_FORM,
// więc po edycji można sprawdzić, że zmieniło się naprawdę wszystko.
export const EDITED_FORM = {
  name: "Formularz kontaktowy – edytowany",
  is_enabled: false,
  limit: 50,
  honeypot_field: "hidden_spam_input",
  redirect_url: "https://example.com/wyslano",
  success_title: "Wysłano!",
  success_message: "Wiadomość została wysłana.",
};

// Zgłoszenie wysyłane do formularza (POST /v1/forms/{id} -> 201).
// Wygląda jak wypełniony formularz kontaktowy i zawiera każdy typ danych:
// tekst, liczbę, true/false, null, listę i obiekt w obiekcie.
// Test "get submission" sprawdza, czy API zwraca dokładnie te dane.
export const DATA_REQUEST = {
  imie: "Anna",
  nazwisko: "Kowalska",
  email: "anna.kowalska@example.com",
  telefon: "+48 601 234 567",
  temat: "Pytanie o ofertę",
  wiadomosc: "Dzień dobry, proszę o wycenę kuchni na wymiar.",
  budzetPLN: 15000.5, // liczba
  zgodaRodo: true, // true / false
  firma: null, // brak wartości
  preferowanyKontakt: ["email", "telefon"], // lista
  adres: {
    // obiekt w obiekcie (tylko jeden poziom, nie dziesięć)
    miasto: "Warszawa",
    kodPocztowy: "00-123",
  },
};

// =====================================================================
// PONIŻEJ: DODATKOWE DANE TESTOWE
// Zasady ze specyfikacji (http-api.json), na których opierają się dane:
//   name            -> tekst, 2–50 znaków
//   success_title   -> tekst, 2–50 znaków
//   success_message -> tekst, 2–200 znaków
//   limit           -> null albo liczba całkowita 1–100 000 000
//   honeypot_field  -> null albo tekst 1–100 znaków
//   redirect_url    -> null albo poprawny URL (max 2000 znaków)
//   is_enabled      -> true / false
// Przy tworzeniu formularza (POST) WSZYSTKIE te pola są wymagane.
// Przy edycji (PATCH) każde pole jest opcjonalne.
// =====================================================================

// ---------------------------------------------------------------------
// 1. NAGŁÓWKI (autoryzacja)
// ---------------------------------------------------------------------

// Poprawny team, ale zły klucz API -> oczekiwany błąd autoryzacji (np. 401)
export const HEADERS_WRONG_API_KEY = {
  ...HEADERS,
  "x-api-key": "zly-klucz-api-123",
};

// Poprawny klucz, ale zły team -> oczekiwany błąd autoryzacji (np. 401/403)
export const HEADERS_WRONG_TEAM_ID = {
  ...HEADERS,
  "x-team-id": "zly-team-id-123",
};

// Brak nagłówków w ogóle -> oczekiwany błąd autoryzacji (np. 401)
export const HEADERS_EMPTY = {};

// ---------------------------------------------------------------------
// 2. FORMULARZE – POPRAWNE (oczekiwany status 201)
// ---------------------------------------------------------------------

// Najmniejsze dozwolone wartości. null = "brak ustawienia".
export const FORM_MIN_VALUES = {
  name: "AB", // dokładnie 2 znaki (minimum)
  is_enabled: true,
  limit: 1, // minimum
  honeypot_field: null,
  redirect_url: null,
  success_title: "OK", // dokładnie 2 znaki (minimum)
  success_message: "Hi", // dokładnie 2 znaki (minimum)
};

// Największe dozwolone wartości.
export const FORM_MAX_VALUES = {
  name: "N".repeat(50), // "NNNN...N" – dokładnie 50 znaków (maksimum)
  is_enabled: true,
  limit: 100_000_000, // maksimum (podkreślniki to tylko separator, = 100000000)
  honeypot_field: "h".repeat(100), // dokładnie 100 znaków (maksimum)
  redirect_url: "https://example.com/dziekujemy",
  success_title: "T".repeat(50), // dokładnie 50 znaków (maksimum)
  success_message: "M".repeat(200), // dokładnie 200 znaków (maksimum)
};

// Polskie znaki, emoji i "dziwne" znaki – API powinno je zapisać bez zmian.
export const FORM_SPECIAL_CHARS = {
  name: "Zażółć gęślą jaźń 🚀",
  is_enabled: true,
  limit: null, // brak limitu zgłoszeń
  honeypot_field: null,
  redirect_url: null,
  success_title: "Dzięki! ✅",
  success_message: `Cudzysłowy "test", apostrof 'test' i <b>HTML</b>`,
};

// ---------------------------------------------------------------------
// 3. FORMULARZE – NIEPOPRAWNE (oczekiwany status 400)
// Każdy przypadek to kopia VALID_FORM z JEDNYM zepsutym polem.
// Zapis { ...VALID_FORM, name: "A" } znaczy:
//   "skopiuj wszystkie pola z VALID_FORM, ale name nadpisz na 'A'".
// Dzięki temu wiadomo dokładnie, które pole powoduje błąd.
// ---------------------------------------------------------------------
export const INVALID_FORMS = {
  nameTooShort: { ...VALID_FORM, name: "A" }, // 1 znak, min to 2
  nameTooLong: { ...VALID_FORM, name: "N".repeat(51) }, // 51 znaków, max to 50
  nameNotString: { ...VALID_FORM, name: 12345 }, // liczba zamiast tekstu
  isEnabledAsString: { ...VALID_FORM, is_enabled: "true" }, // tekst zamiast true/false
  limitZero: { ...VALID_FORM, limit: 0 }, // min to 1
  limitNegative: { ...VALID_FORM, limit: -5 },
  limitTooBig: { ...VALID_FORM, limit: 100_000_001 }, // max to 100 000 000
  limitDecimal: { ...VALID_FORM, limit: 10.5 }, // musi być liczbą całkowitą
  limitAsString: { ...VALID_FORM, limit: "20" }, // tekst zamiast liczby
  honeypotEmpty: { ...VALID_FORM, honeypot_field: "" }, // min to 1 znak
  honeypotTooLong: { ...VALID_FORM, honeypot_field: "h".repeat(101) },
  redirectUrlInvalid: { ...VALID_FORM, redirect_url: "to-nie-jest-url" },
  redirectUrlTooLong: {
    ...VALID_FORM,
    redirect_url: "https://example.com/" + "a".repeat(2000), // > 2000 znaków
  },
  successTitleTooShort: { ...VALID_FORM, success_title: "S" },
  successTitleTooLong: { ...VALID_FORM, success_title: "T".repeat(51) },
  successMessageTooShort: { ...VALID_FORM, success_message: "M" },
  successMessageTooLong: { ...VALID_FORM, success_message: "M".repeat(201) },
};

// Formularz bez wymaganych pól (przy tworzeniu wszystkie są wymagane) -> 400
export const FORM_MISSING_FIELDS = {
  name: "Tylko nazwa",
};

// Pusty obiekt -> 400
export const FORM_EMPTY = {};

// ---------------------------------------------------------------------
// 4. EDYCJA FORMULARZA (PATCH) – zmiana tylko części pól
// ---------------------------------------------------------------------

// Zmiana tylko nazwy -> 200, reszta pól powinna zostać bez zmian
export const UPDATE_ONLY_NAME = {
  name: "Tylko nowa nazwa",
};

// Wyłączenie formularza -> 200.
// Potem wysłanie zgłoszenia powinno dać 422 z błędem "form_disabled".
export const UPDATE_DISABLE_FORM = {
  is_enabled: false,
};

// Ponowne włączenie formularza -> 200
export const UPDATE_ENABLE_FORM = {
  is_enabled: true,
};

// Limit = 1 -> po pierwszym zgłoszeniu kolejne powinno dać 422
// z błędem "submission_limit_reached".
export const UPDATE_LIMIT_ONE = {
  is_enabled: true,
  limit: 1,
};

// Usunięcie ustawień (null) -> 200
export const UPDATE_CLEAR_OPTIONAL = {
  limit: null,
  honeypot_field: null,
  redirect_url: null,
};

// Pusty PATCH (nic nie zmieniamy) -> powinno być 200
export const UPDATE_EMPTY = {};

// Niepoprawna edycja -> 400
export const UPDATE_INVALID = {
  name: "A", // za krótka nazwa
};

// ---------------------------------------------------------------------
// 5. ZGŁOSZENIA (submissions) – POPRAWNE (oczekiwany status 201)
// Zgłoszenie może mieć DOWOLNE pola – API zapisuje je tak, jak przyszły.
// ---------------------------------------------------------------------

// Najprostsze możliwe zgłoszenie – płaska lista pól
export const SUBMISSION_SIMPLE = {
  imie: "Jan",
  email: "jan.nowak@example.com",
  wiadomosc: "Dzień dobry, mam pytanie.",
};

// Różne typy danych: liczby, true/false, null, listy i obiekt w obiekcie
export const SUBMISSION_DIFFERENT_TYPES = {
  imie: "Ewa",
  wiek: 30, // liczba całkowita
  ocena: 4.5, // liczba z przecinkiem
  zgodaNaNewsletter: true, // boolean
  drugieImie: null, // null = brak wartości
  tagi: ["wsparcie", "faktury"], // lista tekstów
  adres: { miasto: "Kraków", kraj: "Polska" }, // obiekt w obiekcie
};

// Znaki specjalne – sprawdza, czy API nic nie "psuje" przy zapisie
export const SUBMISSION_SPECIAL_CHARS = {
  polskieZnaki: "Zażółć gęślą jaźń ĄĆĘŁŃÓŚŹŻ",
  emoji: "😀🔥✅",
  html: "<script>alert('xss')</script>",
  sql: "'; DROP TABLE users; --",
  nowaLinia: "linia 1\nlinia 2",
};

// Nazwa pola o długości dokładnie 100 znaków (maksimum) -> 201
export const SUBMISSION_FIELD_NAME_MAX = {
  ["p".repeat(100)]: "wartość", // nawiasy [] = "nazwą pola jest wynik tego wyrażenia"
};

// Zgłoszenie z wypełnionym polem-pułapką (honeypot) z VALID_FORM.
// API odpowie sukcesem (201), ale NIE zapisze zgłoszenia –
// na liście zgłoszeń nie powinno go być.
export const SUBMISSION_HONEYPOT_FILLED = {
  imie: "Bot",
  bot_trap_field: "spam spam spam", // to samo co VALID_FORM.honeypot_field
};

// ---------------------------------------------------------------------
// 6. ZGŁOSZENIA – NIEPOPRAWNE
// ---------------------------------------------------------------------

// Pusty obiekt -> 422 z błędem "no_data"
export const SUBMISSION_EMPTY = {};

// Za długa nazwa pola: 101 znaków (max 100) -> 413
export const SUBMISSION_FIELD_NAME_TOO_LONG = {
  ["p".repeat(101)]: "wartość",
};

// Za duże zgłoszenie: jedno pole z tekstem ~110 KB (max 100 KB) -> 413
export const SUBMISSION_TOO_LARGE = {
  tekst: "x".repeat(110_000),
};

// Za dużo pól: 1001 pól (max 1000) -> 413
// Wynik wygląda tak: { pole1: 1, pole2: 2, ..., pole1001: 1001 }
export const SUBMISSION_TOO_MANY_FIELDS: Record<string, number> = {};
for (let i = 1; i <= 1001; i++) {
  SUBMISSION_TOO_MANY_FIELDS[`pole${i}`] = i;
}

// Kody błędów, które API zwraca w polu "error" przy statusie 422.
// Użycie: expect(body.error).toBe(SUBMISSION_ERRORS.formDisabled)
export const SUBMISSION_ERRORS = {
  formDisabled: "form_disabled",
  limitReached: "submission_limit_reached",
  noData: "no_data",
  rateLimit: "rate_limit",
};

// ---------------------------------------------------------------------
// 7. NIEISTNIEJĄCE / ZŁE ID
// ---------------------------------------------------------------------

// Poprawny format (24 znaki), ale takiego ID nie ma -> np. 404
export const NONEXISTENT_ID = "000000000000000000000000";

// Zupełnie zły format ID -> np. 400 lub 404
export const MALFORMED_ID = "to-nie-jest-id";

// ---------------------------------------------------------------------
// 8. PARAMETRY LISTY ZGŁOSZEŃ (GET /v1/forms/{id}/submissions)
// Uwaga: żeby ich użyć, metoda listMany musi przyjmować "params"
// (Playwright: this.request.get(url, { headers, params })).
// ---------------------------------------------------------------------
export const LIST_PARAMS_VALID = {
  firstPage: { limit: 10, offset: 0 },
  oldestFirst: { sort: "ASC" },
  newestFirst: { sort: "DESC" },
  maxLimit: { limit: 500 }, // maksimum
  search: { search: "Kowalska" }, // szuka tekstu w danych zgłoszeń
};

// Każdy z nich -> 400
export const LIST_PARAMS_INVALID = {
  limitZero: { limit: 0 }, // min 1
  limitTooBig: { limit: 501 }, // max 500
  offsetNegative: { offset: -1 }, // min 0
  sortWrong: { sort: "UP" }, // tylko ASC albo DESC
  cursorTooShort: { cursor: "abc" }, // musi mieć dokładnie 24 znaki
  searchTooLong: { search: "s".repeat(101) }, // max 100 znaków
};
