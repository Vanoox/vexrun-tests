export const HEADERS = {
  "x-team-id": process.env.X_TEAM_ID_TEST_API!,
  "x-api-key": process.env.X_API_KEY_TEST_API!,
};

export const VALID_FORM = {
  name: "Formularz Testowy #123",
  is_enabled: true,
  limit: 20,
  honeypot_field: "bot_trap_field",
  redirect_url: "https://example.com/thank-you?ref=test",
  success_title: "Sukces!",
  success_message:
    "Formularz został pomyślnie wysłany. Dziękujemy za zgłoszenie.",
};

export const EDITED_FORM = {
  name: "Zaktualizowany Formularz v2.0",
  is_enabled: false,
  limit: 50,
  honeypot_field: "hidden_spam_input",
  redirect_url: "https://example.com/dashboard/success",
  success_title: "Zaktualizowano!",
  success_message: "Zmiany zostały pomyślnie zapisane w systemie.",
};

export const DATA_REQUEST = {
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
