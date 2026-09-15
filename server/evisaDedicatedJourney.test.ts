import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("parcours e‑Visa dédié", () => {
  it("dirige le lancement e‑Visa vers le formulaire documentaire synchronisé", () => {
    // Evisas.tsx was replaced by EvisasAdvanced.tsx. The catalogue now links each destination card
    // to its EvisaDetailPage.tsx first (an extra hop), and it is that detail page which links onward
    // to the synchronized request form — so both files are checked here.
    const catalogue = read("client/src/pages/EvisasAdvanced.tsx");
    const detailPage = read("client/src/pages/EvisaDetailPage.tsx");
    expect(detailPage).toContain("/evisas/request?countryCode=");
    expect(catalogue).not.toMatch(/handleLaunchProcedure[\s\S]*window\.open/);
  });

  it("redirige la route e‑Visa historique vers le formulaire actuel", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('<Route path={"/evisa-demande"}>{() => <Redirect to="/evisas/request" />}</Route>');
  });
});
