import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const progressSource = readFileSync(resolve(process.cwd(), "client/src/components/NavigationProgress.tsx"), "utf8");
const toasterSource = readFileSync(resolve(process.cwd(), "client/src/components/ui/sonner.tsx"), "utf8");
const emailSource = readFileSync(resolve(process.cwd(), "client/src/components/AdminEmailDeliveryManagement.tsx"), "utf8");

describe("retours d’interface", () => {
  it("prévoit une fermeture de secours pour l’indicateur de navigation", () => {
    expect(progressSource).toContain("fallbackTimeout");
    expect(progressSource).toContain('aria-valuetext="Navigation en cours"');
  });

  it("configure des notifications lisibles et fermables", () => {
    expect(toasterSource).toContain('position="top-right"');
    expect(toasterSource).toContain("richColors");
    expect(toasterSource).toContain("closeButton");
  });

  it("affiche et permet d’effacer la recherche instantanée des journaux e-mail", () => {
    expect(emailSource).toContain("Rechercher instantanément dans les journaux e-mail");
    expect(emailSource).toContain('onClick={() => setSearch("")}');
    expect(emailSource).toContain('aria-live="polite"');
  });
});
