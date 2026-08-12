import { describe, expect, it } from "vitest";
import { escapeCsvCell } from "./adminCandidateManagement";

describe("escapeCsvCell", () => {
  it("protège les valeurs interprétables comme formules par un tableur", () => {
    expect(escapeCsvCell("=HYPERLINK(\"https://malicious.test\")")).toBe("\"'=HYPERLINK(\"\"https://malicious.test\"\")\"");
    expect(escapeCsvCell("+237698104832")).toBe("\"'+237698104832\"");
  });

  it("préserve les accents, les guillemets et neutralise les retours de ligne", () => {
    expect(escapeCsvCell('Élodie "Dupont"\nCanada')).toBe('"Élodie ""Dupont"" Canada"');
  });
});
