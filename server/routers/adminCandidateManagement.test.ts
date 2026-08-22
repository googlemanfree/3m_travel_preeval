import { describe, expect, it } from "vitest";
import { escapeCsvCell, paginateCandidates } from "./adminCandidateManagement";

describe("escapeCsvCell", () => {
  it("protège les valeurs interprétables comme formules par un tableur", () => {
    expect(escapeCsvCell("=HYPERLINK(\"https://malicious.test\")")).toBe("\"'=HYPERLINK(\"\"https://malicious.test\"\")\"");
    expect(escapeCsvCell("+16728972999")).toBe("\"'+16728972999\"");
  });

  it("préserve les accents, les guillemets et neutralise les retours de ligne", () => {
    expect(escapeCsvCell('Élodie "Dupont"\nCanada')).toBe('"Élodie ""Dupont"" Canada"');
  });
});

describe("paginateCandidates", () => {
  it("retourne uniquement la page demandée avec un total et un nombre de pages cohérents", () => {
    const result = paginateCandidates([1, 2, 3, 4, 5], 2, 2);
    expect(result).toMatchObject({ records: [3, 4], total: 5, page: 2, pageSize: 2, totalPages: 3 });
  });

  it("ramène une page trop élevée vers la dernière page disponible", () => {
    const result = paginateCandidates([1, 2, 3], 8, 2);
    expect(result).toMatchObject({ records: [3], page: 2, totalPages: 2 });
  });
});
