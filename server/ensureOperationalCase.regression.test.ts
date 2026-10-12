import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { agencyDossierReference } from "../shared/caseReference";
import { ensureOperationalCase } from "./routers/admin";

const root = resolve(import.meta.dirname, "..");

describe("ensureOperationalCase — fallback caseNumber 3M-AGN", () => {
  it("réutilise un cases existant par caseNumber quand agency_dossiers manque", async () => {
    const existingCase = {
      id: 390,
      caseNumber: "3M-AGN-390001",
      candidateId: 1410001,
      legacyAgencyDossierId: null,
      currentStatus: "documents_review",
    };
    const inserts: unknown[] = [];
    let selectCall = 0;
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              selectCall += 1;
              // 1) lookup legacyAgencyDossierId → vide
              // 2) lookup caseNumber → trouvé
              if (selectCall === 1) return [];
              if (selectCall === 2) return [existingCase];
              return [];
            },
          }),
        }),
      }),
      insert: () => ({
        values: async (values: unknown) => {
          inserts.push(values);
        },
      }),
    };

    const result = await ensureOperationalCase(db, { source: "agency", id: 390001 });
    expect(result).toMatchObject({ id: 390, caseNumber: "3M-AGN-390001" });
    expect(agencyDossierReference(390001)).toBe("3M-AGN-390001");
    expect(inserts).toHaveLength(0);
  });

  it("refuse toujours si ni legacy ni caseNumber ni agency_dossiers", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      }),
      insert: vi.fn(),
    };

    await expect(ensureOperationalCase(db, { source: "agency", id: 999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Dossier agence introuvable.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("expose le fallback caseNumber dans le code source", () => {
    const source = readFileSync(resolve(root, "server/routers/admin.ts"), "utf8");
    const slice = source.slice(
      source.indexOf("export async function ensureOperationalCase"),
      source.indexOf("function serializeAdminCandidateDetails"),
    );
    expect(slice).toContain("agencyDossierReference(reference.id)");
    expect(slice).toContain("cases.caseNumber");
    expect(slice).toContain("Fallback QA");
  });
});

describe("agencyDossierReference — format stable", () => {
  it("pad 4 chiffres pour coller aux dossiers affichés", () => {
    expect(agencyDossierReference(12)).toBe("3M-AGN-0012");
    expect(agencyDossierReference(390001)).toBe("3M-AGN-390001");
  });
});
