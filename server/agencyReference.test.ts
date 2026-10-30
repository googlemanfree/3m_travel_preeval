import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { agencyDisplayReference } from "../shared/caseReference";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");

describe("dossier agence : COMPTE-… tant que les frais d'ouverture ne sont pas payés", () => {
  it("un dossier agence non payé et sans suite s'affiche avec la référence de compte du candidat", () => {
    expect(agencyDisplayReference({ id: 34, status: "nouveau", initialPaymentStatus: "pending" }, 9)).toBe("COMPTE-00009");
    expect(agencyDisplayReference({ id: 270001, status: "nouveau", initialPaymentStatus: null }, 717)).toBe("COMPTE-00717");
  });

  it("payé ou réellement avancé : la référence 3M-AGN s'affiche ; sans compte lié, c'est la seule référence disponible", () => {
    expect(agencyDisplayReference({ id: 34, status: "nouveau", initialPaymentStatus: "paid" }, 9)).toBe("3M-AGN-0034");
    expect(agencyDisplayReference({ id: 34, status: "documents_requis", initialPaymentStatus: "pending" }, 9)).toBe("3M-AGN-0034");
    expect(agencyDisplayReference({ id: 34, status: "nouveau", initialPaymentStatus: "pending" }, null)).toBe("3M-AGN-0034");
    expect(agencyDisplayReference({ id: 34, status: "nouveau", initialPaymentStatus: "pending" }, 0)).toBe("3M-AGN-0034");
  });

  it("la fiche administrateur utilise cette règle pour l'en-tête et le code canonique", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("folderCode: agencyDisplayReference(dossier, candRec?.id),");
    expect(admin).toContain("? agencyDisplayReference(sourceRecord as typeof agencyDossiers.$inferSelect, candidateRecord?.id)");
  });
});
