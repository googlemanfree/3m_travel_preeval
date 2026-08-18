import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("exports, IA et alertes documentaires", () => {
  it("réserve l’analyse IA de document aux administrateurs et impose une relecture", () => {
    const router = readFileSync(resolve(root, "server/routers/admin.ts"), "utf8");
    const service = readFileSync(resolve(root, "server/services/adminDocumentRecognitionAssistant.ts"), "utf8");
    expect(router).toContain("suggestDroppedDocumentMetadata: publicProcedure");
    expect(router).toContain("await requireValidAdminSession(input.sessionToken)");
    expect(router).toContain("reviewRequired: z.literal(true)");
    expect(service).toContain("reviewRequired: true");
    expect(service).toContain("Ne déduis jamais de données personnelles");
  });

  it("préserve les exports PDF/CSV et le filtre des dossiers inactifs", () => {
    const manager = readFileSync(resolve(root, "client/src/components/AdminDocumentsManagement.tsx"), "utf8");
    expect(manager).toContain("exportMonthlyCsv");
    expect(manager).toContain("exportMonthlyPdf");
    expect(manager).toContain("rapport-completude-");
    expect(manager).toContain("staleDossiers");
    expect(manager).toContain("incomplet(s) depuis plus de 7 jours");
  });
});
