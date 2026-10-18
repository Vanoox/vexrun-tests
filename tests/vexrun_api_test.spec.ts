import { test, expect } from "@playwright/test";

test.describe("Vexrun API", () => {
  test.describe.configure({ mode: "serial" });

  const HEADERS = {
    "x-team-id": process.env.X_TEAM_ID_TEST_API!,
    "x-api-key": process.env.X_API_KEY_TEST_API!,
  };

  const DATA_REQUEST = {
    numerZamowienia: "ZKM/2026/04/8921",
    dataZgloszenia: "2026-04-18T10:30:00Z",
    klient: {
      daneOsobowe: {
        imie: "Anna",
        nazwisko: "Kowalska",
        kontakt: {
          telefon: "+48 601 234 567",
          email: "anna.kowalska@example.com",
          preferowanyKontakt: "email",
          adresZamieszkania: {
            ulica: "Kwiatowa",
            numerDomu: "15",
            numerLokalu: "4B",
            kodPocztowy: "00-123",
            miasto: "Warszawa",
            szczegolyDostawy: {
              pietro: 3,
              czyJestWinda: true,
              szerokoscDrzwiCm: 80,
              uwagiDlaKierowcy: {
                kodDoBramy: "1234Key",
                miejsceParkingowe:
                  "Miejsca dla gości pod blokiem od strony podwórka",
              },
            },
          },
        },
      },
    },
    zamowienie: {
      specyfikacjaProjektu: {
        pomieszczenie: "Kuchnia",
        wymiaryMedyczneM2: 14.5,
        agdDoZabudowy: {
          lodowka: {
            model: "Samsung BRB26703EWW",
            podlaczenieWody: false,
          },
          zmywarka: {
            szerokoscCm: 60,
            podlaczenieProszku: "standard",
          },
        },
      },
      platnosc: {
        metodaPlatnosci: "raty",
        szczegolyRaty: {
          bank: "Santander Consumer Bank",
          liczbaRat: 24,
          harmonogramPlatnosci: {
            pierwszaRataData: "2026-05-10",
            kwotaRatyPLN: 450.5,
          },
        },
      },
    },
  };

  let forms_id: Array<string> = [];
  let submissions_id: string | undefined;

  test.beforeAll("cleaning all forms", async ({ request }) => {
    const listResponse = await request.get("/v1/forms", {
      headers: HEADERS,
    });
    expect(listResponse.status()).toBe(200);

    const body = await listResponse.json();
    const forms = Array.isArray(body) ? body : body.data;
    const formIds: string[] = forms.map((f: { id: string }) => f.id);

    for (const id of formIds) {
      const deleteResponse = await request.delete(`/v1/forms/${id}`, {
        headers: HEADERS,
      });
      expect(deleteResponse.status()).toBe(204);
    }
  });

  test("create form", async ({ request }) => {
    const response = await request.post("/v1/forms", {
      headers: HEADERS,
      data: {
        name: "test",
        is_enabled: true,
        limit: 20,
        honeypot_field: "age",
        redirect_url: null,
        success_title: "OK",
        success_message: "created new submission",
      },
    });
    expect(response.status()).toBe(201);
    forms_id.push((await response.json()).id);
    expect(forms_id).toBeTruthy();
  });

  test("create submissions", async ({ request }) => {
    const response = await request.post(`/v1/forms/${forms_id[0]}`, {
      headers: { Accept: "application/json" },
      maxRedirects: 0,
      data: DATA_REQUEST,
    });
    expect(response.status()).toBe(201);
  });

  test("list many submissions", async ({ request }) => {
    await expect
      .poll(
        async () => {
          const response = await request.get(
            `/v1/forms/${forms_id[0]}/submissions`,
            {
              headers: HEADERS,
            },
          );
          expect(response.status()).toBe(200);
          const body = await response.json();
          submissions_id = body.results[0]?.id;
          return submissions_id;
        },
        { timeout: 10_000, intervals: [500, 1000, 2000] },
      )
      .toBeDefined();
  });

  test("get submission", async ({ request }) => {
    const response = await request.get(
      `/v1/forms/${forms_id[0]}/submissions/${submissions_id}`,
      { headers: HEADERS },
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject(DATA_REQUEST);
  });

  test("delete submission", async ({ request }) => {
    const response = await request.delete(
      `/v1/forms/${forms_id[0]}/submissions/${submissions_id}`,
      { headers: HEADERS },
    );
    expect(response.status()).toBe(204);
  });

  test("update form", async ({ request }) => {
    const response = await request.patch(`/v1/forms/${forms_id}`, {
      headers: HEADERS,
      data: {
        name: "test_edit",
        is_enabled: false,
        limit: 20,
        honeypot_field: "age_edit",
        success_title: "Edit",
        success_message: "edit submission",
      },
    });
    expect(response.status()).toBe(200);
  });

  test("get form overwiew", async ({ request }) => {
    const response = await request.get(`/v1/forms/${forms_id}/overview`);
    expect(response.status()).toBe(200);
  });

  test("duplicate form", async ({ request }) => {
    const response = await request.post(`/v1/forms/${forms_id}/duplicate`, {
      headers: HEADERS,
    });
    expect(response.status()).toBe(201);
    forms_id.push((await response.json()).id);
  });

  test("list all forms", async ({ request }) => {
    const response = await request.get("/v1/forms", {
      headers: HEADERS,
    });
    expect(response.status()).toBe(200);
  });

  test("delete forms", async ({ request }) => {
    for (const id of forms_id) {
      const response = await request.delete(`/v1/forms/${id}`, {
        headers: HEADERS,
      });
      expect(response.status()).toBe(204);
    }
  });
});
