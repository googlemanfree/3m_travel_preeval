import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");

describe("Fournisseur global de coordonnées", () => {
  it("englobe le layout partagé avant le routeur et les composants flottants", () => {
    const appSource = fs.readFileSync(path.join(projectRoot, "client/src/App.tsx"), "utf8");

    expect(appSource).toContain('import { OfficeContactProvider } from "./contexts/OfficeContactContext";');
    expect(appSource).toContain("<OfficeContactProvider>");
    expect(appSource).toContain("<Router />");
    expect(appSource.indexOf("<OfficeContactProvider>")).toBeLessThan(appSource.indexOf("<Router />"));
    expect(appSource.indexOf("<OfficeContactProvider>")).toBeLessThan(appSource.indexOf("<FloatingActionMenu />"));
  });
});
