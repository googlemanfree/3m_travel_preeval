import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("checklist interactive des procédures", () => {
  it("persiste une progression strictement rattachée au dossier et au candidat", () => {
    const schema = read("drizzle/caseTrackingSchema.ts");
    const router = read("server/routers/candidate.ts");
    expect(schema).toContain('procedureChecklistProgress = mysqlTable("procedure_checklist_progress"');
    expect(schema).toContain('dossierKey: varchar("dossierKey"');
    expect(schema).toContain('candidateId: int("candidateId")');
    expect(router).toContain("eq(procedureChecklistProgress.dossierKey, context.dossierKey)");
    expect(router).toContain("eq(procedureChecklistProgress.candidateId, context.candidateId)");
  });

  it("bloque côté serveur la coche d’une étape future", () => {
    const router = read("server/routers/candidate.ts");
    expect(router).toContain("if (input.checked && stepIndex > currentIndex)");
    expect(router).toContain("Cette étape sera disponible après validation des étapes précédentes.");
  });

  it("expose une checkbox accessible et synchronisée avec tRPC côté candidat", () => {
    const component = read("client/src/components/CandidateCountryJourney.tsx");
    expect(component).toContain("getProcedureChecklist.useQuery");
    expect(component).toContain("updateProcedureChecklist.useMutation");
    expect(component).toContain('type="checkbox"');
    expect(component).toContain("aria-label={");
    expect(component).toContain("checklistMutation.mutate({ stepId: checklistStepId, checked: event.target.checked })");
  });
});

