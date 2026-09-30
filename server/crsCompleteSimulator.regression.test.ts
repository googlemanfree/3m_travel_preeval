import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/components/CanadaScoreSimulator.tsx", import.meta.url), "utf8");

describe("simulateur CRS complet", () => {
  it("propose un parcours guidé et une collecte de profil", () => {
    expect(source).toContain("Évaluation guidée 3M Travel");
    expect(source).toContain("crs-full-name");
    expect(source).toContain("crs-residence");
    expect(source).toContain("crs-test-date");
    expect(source).toContain("frenchReading");
    expect(source).toContain("englishSpeaking");
  });

  it("génère un lien partageable et un partage WhatsApp", () => {
    expect(source).toContain("shareProfile");
    expect(source).toContain("handleShareWhatsApp");
    expect(source).toContain("?crs=");
    expect(source).toContain("wa.me/237698104832");
  });

  it("compose un PDF avec marque et coordonnées de l’agence", () => {
    expect(source).toContain("3M TRAVEL AGENCY");
    expect(source).toContain("pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg");
    expect(source).toContain("Yaoundé · Ottawa");
    expect(source).toContain("Résultats indicatifs, sans garantie d'invitation");
  });
});
