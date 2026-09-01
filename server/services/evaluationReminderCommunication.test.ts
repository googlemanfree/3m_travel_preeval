import { describe, expect, it } from "vitest";
import { buildEvaluationReminderEmailHtml, buildEvaluationReminderEmailSubject } from "./evaluationReminderCommunication";

describe("relances de bilan bilingues", () => {
  it("génère une relance française avec un lien vers l’espace client", () => {
    const html = buildEvaluationReminderEmailHtml("Aline <Test>", "3M-2026-00042", "fr");
    expect(html).toContain("Votre bilan d’évaluation");
    expect(html).toContain("Aline &lt;Test&gt;");
    expect(html).toContain("https://www.3mtravelagency.com/login?redirect=1");
  });

  it("génère une relance anglaise et un objet cohérent", () => {
    expect(buildEvaluationReminderEmailHtml("Aline", "3M-2026-00042", "en")).toContain("Your evaluation report");
    expect(buildEvaluationReminderEmailSubject("3M-2026-00042", "en")).toContain("Reminder:");
  });

  it("insère le message personnalisé de relance sans autoriser de HTML", () => {
    const html = buildEvaluationReminderEmailHtml("Aline", "3M-2026-00042", "fr", "Bonjour <script>alert(1)</script>\n\nMerci de consulter votre bilan.");
    expect(html).toContain("Bonjour &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Ouvrir mon espace client sécurisé");
  });
});
