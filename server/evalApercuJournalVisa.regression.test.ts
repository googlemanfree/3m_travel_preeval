import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveEvaluationProjectKind } from "../shared/evaluationVisaCv";
import { EVALUATION_KIND_LABELS } from "../shared/evaluationBilanTemplates";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("aperçu obligatoire + journal visa à l’envoi", () => {
  it("exige previewConfirmed côté API et journalise le type de visa", () => {
    const router = read("server/routers/unifiedRequests.ts");
    expect(router).toContain("previewConfirmed: z.literal(true)");
    expect(router).toContain("resolveDeliveryVisaJournal");
    expect(router).toContain("Type de visa utilisé");
    expect(router).toContain("caseActivityLogs");
    expect(router).toContain("actionType: \"evaluation_sent\"");
    expect(router).toContain("journalVisaLabel");
  });

  it("bloque l’envoi UI tant que l’aperçu n’est pas contrôlé", () => {
    const editor = read("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(editor).toContain("bilan-preview-gate");
    expect(editor).toContain("J’ai contrôlé l’aperçu du bilan avant envoi");
    expect(editor).toContain("previewConfirmed: true");
    expect(editor).toContain("Aperçu requis avant envoi");
    expect(editor).toContain("evaluation-send-journal");
    expect(editor).toContain("Type de visa journalisé");
  });

  it("expose le visaType dans l’historique e-mails du cockpit 360", () => {
    const admin = read("server/routers/admin.ts");
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(admin).toContain("visaType: evaluationEmails.visaType");
    expect(workspace).toContain("evaluation-email-journal-row");
    expect(workspace).toContain("email.visaType");
  });

  it("conserve des libellés distincts études / travail / visiteurs", () => {
    expect(EVALUATION_KIND_LABELS[resolveEvaluationProjectKind("canada_etude")]).toMatch(/études/i);
    expect(EVALUATION_KIND_LABELS[resolveEvaluationProjectKind("schengen_travail")]).toMatch(/travail/i);
    expect(EVALUATION_KIND_LABELS[resolveEvaluationProjectKind("schengen_tourisme")]).toMatch(/visiteurs|tourisme/i);
  });
});
