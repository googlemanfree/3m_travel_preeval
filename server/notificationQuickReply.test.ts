import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("réponse rapide depuis les notifications", () => {
  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  // client/src/components/ClientMessagesPanel.tsx (the current messaging component) still calls
  // trpc.candidate.sendMessage.useMutation, but has no notification-specific "Répondre" quick-reply
  // affordance or "notificationReplyText" state.
  it("réutilise la messagerie sécurisée du candidat", () => {
    const dashboard = read("client/src/pages/EvaluationSpace.tsx");
    expect(dashboard).toContain("trpc.candidate.sendMessage.useMutation");
    expect(dashboard).toContain("Répondre");
    expect(dashboard).toContain("notificationReplyText");
  });

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  it("réserve la réponse rapide aux notifications administratives", () => {
    const dashboard = read("client/src/pages/EvaluationSpace.tsx");
    expect(dashboard).toContain('notification.category === "admin"');
    expect(dashboard).toContain("Votre réponse");
    expect(dashboard).toContain("Envoyer la réponse");
  });

  it("limite le message à 2 000 caractères côté interface", () => {
    // The quick-reply character limit now lives on the general candidate messaging composer.
    const dashboard = read("client/src/components/ClientMessagesPanel.tsx");
    expect(dashboard).toContain("maxLength={2000}");
  });

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  it("propose des modèles de réponses rapides pré-rédigés", () => {
    const dashboard = read("client/src/pages/EvaluationSpace.tsx");
    expect(dashboard).toContain("Document joint");
    expect(dashboard).toContain("Paiement effectué");
    expect(dashboard).toContain("État du dossier");
    expect(dashboard).toContain("Besoin d'aide");
  });
});
