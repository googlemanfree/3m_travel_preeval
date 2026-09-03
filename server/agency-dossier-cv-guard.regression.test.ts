import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const routerSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "routers/agencyDossier.ts"),
  "utf8",
);

describe("agency dossier CV guard", () => {
  it("checks agency dossier documents before en_cours is persisted", () => {
    const transition = routerSource.indexOf('input.newStatus === "en_cours"');
    const cvLookup = routerSource.indexOf("agencyDossierDocuments", transition);
    const statusWrite = routerSource.indexOf(".update(agencyDossiers)", transition);
    const guardMessage = routerSource.indexOf("Un CV exploitable doit être déposé", transition);

    expect(transition).toBeGreaterThan(-1);
    expect(cvLookup).toBeGreaterThan(transition);
    expect(guardMessage).toBeGreaterThan(cvLookup);
    expect(statusWrite).toBeGreaterThan(guardMessage);
  });
});
