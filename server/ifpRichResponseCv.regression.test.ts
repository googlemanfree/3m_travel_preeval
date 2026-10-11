import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("IFP — réponse riche manuelle et réclamation CV visa travail", () => {
  it("sanitise le brouillon HTML, envoie un e-mail riche et publie côté client", () => {
    const router = read("server/routers/aiEvaluationManagement.ts");
    const email = read("server/emailService.ts");
    expect(router).toContain("normalizeAdminMessage(input.draft)");
    expect(router).toContain("sendValidatedEvaluationResponseEmail");
    expect(router).toContain('type: "evaluation_delivered"');
    expect(router).toContain("content: responseHtml");
    expect(email).toContain("bodyHtml");
    expect(email).toContain("sendWorkVisaCvRequestEmail");
  });

  it("expose un éditeur type Word et le bouton Réclamer le CV pour le visa travail", () => {
    const dashboard = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(dashboard).toContain("<RichTextEditor");
    expect(dashboard).toContain('templateScope="evaluation_message"');
    expect(dashboard).toContain("requestWorkVisaCv");
    expect(dashboard).toContain("Réclamer le CV");
    expect(dashboard).toContain('item.projectType === "travail"');
  });

  it("réclame le CV uniquement pour les dossiers travail (checklist + mail + notification)", () => {
    const router = read("server/routers/aiEvaluationManagement.ts");
    expect(router).toContain("requestWorkVisaCv");
    expect(router).toContain("isWorkVisaForPassportPhoto(evaluation.projectType)");
    expect(router).toContain("sendWorkVisaCvRequestEmail");
    expect(router).toContain('documentType: "cv"');
    expect(router).toContain('action: "work_visa_cv_requested"');
    expect(router).toContain('actionUrl: "/mon-espace?section=documents"');
  });

  it("affiche la réponse validée en HTML sanitizé dans l’espace client et la messagerie", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    const messages = read("client/src/components/ClientMessagesPanel.tsx");
    expect(space).toContain("validatedEvaluationResponseHtml");
    expect(space).toContain("sanitizeRichText");
    expect(space).toContain('data-testid="validated-evaluation-response"');
    expect(space).toContain("Réponse validée par l’agence.");
    expect(messages).toContain("sanitizeRichText(message.content)");
  });
});
