import { describe, expect, it } from "vitest";
import { clampSeoDescription, clampSeoTitle, SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from "../client/src/lib/seoText";

describe("longueur des titres et descriptions (SEO)", () => {
  it("laisse intacts les titres et descriptions déjà courts", () => {
    expect(clampSeoTitle("Visa Kenya — Travail | 3M TRAVEL AGENCY")).toBe("Visa Kenya — Travail | 3M TRAVEL AGENCY");
    expect(clampSeoDescription("Une description courte.")).toBe("Une description courte.");
  });

  it("retire le complément final d'un titre trop long en gardant la marque", () => {
    const long = "Visa Allemagne — Visiteur — visa visite / court séjour | 3M TRAVEL AGENCY";
    expect(long.length).toBeGreaterThan(SEO_TITLE_MAX);
    expect(clampSeoTitle(long)).toBe("Visa Allemagne — Visiteur | 3M TRAVEL AGENCY");
    const longest = "Visa Liechtenstein — Visiteur — visa visite / court séjour | 3M TRAVEL AGENCY";
    expect(clampSeoTitle(longest).length).toBeLessThanOrEqual(SEO_TITLE_MAX);
    expect(clampSeoTitle(longest).endsWith("| 3M TRAVEL AGENCY")).toBe(true);
  });

  it("coupe un titre sans séparateur au dernier mot, avec une ellipse", () => {
    const title = "Un titre vraiment très long sans aucun séparateur de complément qui dépasse la limite raisonnable";
    const clamped = clampSeoTitle(title);
    expect(clamped.length).toBeLessThanOrEqual(SEO_TITLE_MAX);
    expect(clamped.endsWith("…")).toBe(true);
    expect(title.startsWith(clamped.slice(0, -1))).toBe(true);
  });

  it("raccourcit une description au dernier mot entier", () => {
    const description = "Étapes, documents exigés, portail officiel et FAQ pour votre projet visite / court séjour vers Allemagne — accompagnement 3M TRAVEL AGENCY depuis Yaoundé, avec un conseiller à chaque étape du dossier.";
    const clamped = clampSeoDescription(description);
    expect(description.length).toBeGreaterThan(SEO_DESCRIPTION_MAX);
    expect(clamped.length).toBeLessThanOrEqual(SEO_DESCRIPTION_MAX);
    expect(clamped.endsWith("…")).toBe(true);
    expect(description.startsWith(clamped.slice(0, -1))).toBe(true);
  });
});
