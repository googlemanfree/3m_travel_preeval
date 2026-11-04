import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("public interaction enhancements", () => {
  it("announces same-document navigation and respects reduced motion", () => {
    const progress = read("client/src/components/NavigationProgress.tsx");
    const transition = read("client/src/components/PageTransition.tsx");

    expect(progress).toContain('document.addEventListener("click", onDocumentClick, true)');
    expect(progress).toContain('aria-label="Chargement de la page"');
    expect(transition).toContain("useReducedMotion");
    expect(transition).toContain("AnimatePresence");
  });

  it("keeps contact validation inline and accessible", () => {
    const contact = read("client/src/pages/Contact.tsx");

    expect(contact).toContain("hasAttemptedSubmit");
    expect(contact).toContain("aria-invalid");
    expect(contact).toContain("contact-email-help");
    expect(contact).toContain("Vérifiez les champs signalés");
    expect(contact).toContain("Envoi en cours...");
  });

  it("exposes an interactive employer search with a live result count", () => {
    const employers = read("client/src/pages/EmployerPortal.tsx");

    expect(employers).toContain('data-testid="partner-profile-search"');
    expect(employers).toContain('data-testid="partner-profile-search-status"');
    expect(employers).toContain("Effacer la recherche");
    expect(employers).toContain("languagesSummary");
    expect(employers).toContain('id="partner-profile-results"');
    expect(employers).toContain('data-testid="partner-sector-filter"');
    expect(employers).toContain("sectorCounts");
    expect(employers).toContain("selectedSectors");
    expect(employers).toContain("toggleSector");
    expect(employers).toContain("aria-pressed={selectedSectors.includes(value)}");
    expect(employers).toContain("secteur(s) sélectionné(s)");
    expect(employers).toContain("sans recharger la page");
  });
});
