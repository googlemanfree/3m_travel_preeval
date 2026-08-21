import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("parcours e‑Visa dédié", () => {
  it("dirige le lancement e‑Visa vers le formulaire documentaire synchronisé", () => {
    const catalogue = read("client/src/pages/Evisas.tsx");
    expect(catalogue).toContain("/evisas/request?countryCode=");
    expect(catalogue).not.toMatch(/handleLaunchProcedure[\s\S]*window\.open/);
  });

  it("redirige la route e‑Visa historique vers le formulaire actuel", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('<Route path={"/evisa-demande"}>{() => <Redirect to="/evisas/request" />}</Route>');
  });
});
