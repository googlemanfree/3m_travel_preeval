import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const source = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("provenance Facebook et WhatsApp", () => {
  it("persiste la source et la campagne dans les modèles d’évaluation et candidat", () => {
    const schema = source("drizzle/schema.ts");
    const router = source("server/routers/evaluation.ts");
    const page = source("client/src/pages/Evaluation.tsx");

    expect(schema).toContain('acquisitionSource: mysqlEnum("acquisitionSource"');
    expect(schema).toContain('acquisitionCampaign: varchar("acquisitionCampaign"');
    expect(router).toContain("acquisitionSourceEnum");
    expect(router).toContain("acquisitionSource: input.acquisitionSource");
    expect(router).toContain("acquisitionCampaign: input.acquisitionCampaign");
    expect(page).toContain('acquisitionParams.get("source")');
    expect(page).toContain("acquisitionSource,");
    expect(page).toContain("acquisitionCampaign,");
  });

  it("expose la source, la campagne et le filtre au back-office", () => {
    const router = source("server/routers/aiEvaluationManagement.ts");
    const dashboard = source("client/src/pages/AdminAIEvaluationDashboard.tsx");

    expect(router).toContain("acquisitionSource: e.acquisitionSource");
    expect(router).toContain("acquisitionCampaign: e.acquisitionCampaign");
    expect(dashboard).toContain("ACQUISITION_LABELS");
    expect(dashboard).toContain("acquisitionSourceFilter");
    expect(dashboard).toContain("Campagne :");
    expect(dashboard).toContain('"Source", "Campagne"');
  });
});

