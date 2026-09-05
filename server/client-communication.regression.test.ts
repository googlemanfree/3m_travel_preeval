import { describe, expect, it } from "vitest";
import { sanitizeClientCommunicationText } from "./clientCommunication";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readProjectFile = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("client communication wording", () => {
  it("replaces technical AI wording with human adviser wording", () => {
    const cleaned = sanitizeClientCommunicationText("Rapport généré par IA. Analyse par intelligence artificielle.");
    expect(cleaned).not.toMatch(/\bIA\b|intelligence artificielle/i);
    expect(cleaned).toContain("conseiller 3M Travel");
  });

  it("sanitizes outgoing report emails but keeps raw report content for admin review", () => {
    const application = readProjectFile("server/routers/application.ts");
    expect(application).toContain("sanitizeClientCommunicationHtml(report)");
    expect(application).toContain("sanitizeClientCommunicationHtml(report.reportContent)");
    expect(application).toContain("reportContent: report");
  });

  it("keeps technical wording confined to the admin editor surfaces", () => {
    const editor = readProjectFile("client/src/components/EvaluationDeliveryEditor.tsx");
    const adminDashboard = readProjectFile("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(editor).toContain("proposition IA à relire");
    expect(adminDashboard).toContain("Brouillon IA disponible");
  });
});
