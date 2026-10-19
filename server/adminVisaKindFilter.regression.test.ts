import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { detectAdminProcedureKind } from "../shared/adminDynamicPilotage";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

describe("tableau de bord administrateur : filtres rapides par type de visa", () => {
  it("le serveur filtre par type et renvoie le décompte avant filtrage", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain('visaKind: z.enum(["evisa", "work", "study", "visitor", "family", "residence", "other"]).optional(),');
    expect(admin).toContain("detectAdminProcedureKind(c.projectType, c.projectType) === input.visaKind");
    expect(admin).toContain("availableVisaKinds,");
    // Le décompte est calculé avant tout filtre : les pastilles restent stables quand on filtre.
    expect(admin.indexOf("const availableVisaKinds")).toBeLessThan(admin.indexOf("if (input.visaKind) {"));
    expect(admin.indexOf("const availableVisaKinds")).toBeLessThan(admin.indexOf("if (input.status && input.status !== \"ALL\")"));
  });

  it("l'interface propose des pastilles accessibles, intégrées à la réinitialisation des filtres", () => {
    const page = read("client/src/pages/AdminDashboard.tsx");
    expect(page).toContain('data-testid="visa-kind-filters"');
    expect(page).toContain('aria-label="Filtrer par type de visa"');
    expect(page).toContain("aria-pressed={active}");
    expect(page).toContain("visaKind: visaKindFilter !== \"ALL\"");
    expect(page).toContain("visaKindFilter, assignedToMeFilter, sortBy]);");
    expect(page).toContain('visaKindFilter !== "ALL" || assignedToMeFilter');
    expect(page).toContain('setVisaKindFilter("ALL");');
  });

  it("reconnaît les types de visa courants à partir du libellé de la procédure", () => {
    expect(detectAdminProcedureKind("Visa travail", "Visa travail")).toBe("work");
    expect(detectAdminProcedureKind("Études", "Permis d’études")).toBe("study");
    expect(detectAdminProcedureKind("Visiteur", "Visa visiteur Schengen")).toBe("visitor");
    expect(detectAdminProcedureKind("e-Visa", "e-Visa Kenya")).toBe("evisa");
    expect(detectAdminProcedureKind("", "")).toBe("other");
  });
});
