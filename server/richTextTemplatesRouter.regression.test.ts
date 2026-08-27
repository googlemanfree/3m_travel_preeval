import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("gestion administrative des modèles d’évaluation", () => {
  it("exige une session et un motif pour modifier ou supprimer un modèle", () => {
    const source = read("server/routers/richTextTemplatesRouter.ts");
    expect(source).toContain("update: publicProcedure");
    expect(source).toContain("reason: z.string().trim().min(8).max(500)");
    expect(source).toContain("const admin = await requireValidAdminSession(input.sessionToken);");
    expect(source).toContain("action: \"updated\"");
    expect(source).toContain("action: \"deleted\"");
  });

  it("journalise les changements sans répliquer le contenu du modèle", () => {
    const source = read("server/routers/richTextTemplatesRouter.ts");
    const schema = read("drizzle/richTextSchema.ts");
    expect(source).toContain("createHash(\"sha256\")");
    expect(source).toContain("contentFingerprint: fingerprint(input.contentText)");
    expect(schema).toContain("adminTextTemplateAuditEvents");
    expect(schema).toContain("contentFingerprint");
  });

  it("bloque les scores, verdicts et garanties dans les modèles d’évaluation", () => {
    const source = read("server/routers/richTextTemplatesRouter.ts");
    expect(source).toContain("unsafeEvaluationTemplatePatterns");
    expect(source).toContain("score, décision d’éligibilité, garantie ou orientation automatique");
    expect(source).toContain("assertSafeEvaluationTemplate(input.scope, contentText)");
  });

  it("rend les opérations de modèle accessibles depuis la file de revue", () => {
    const dashboard = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(dashboard).toContain("Modèles de réponse");
    expect(dashboard).toContain("Créer le modèle");
    expect(dashboard).toContain("Modifier");
    expect(dashboard).toContain("Supprimer");
    expect(dashboard).toContain("richTextTemplates.update");
  });
});
