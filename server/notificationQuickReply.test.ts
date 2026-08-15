import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("réponse rapide depuis les notifications", () => {
  it("réutilise la messagerie sécurisée du candidat", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain("trpc.candidate.sendMessage.useMutation");
    expect(dashboard).toContain("Répondre");
    expect(dashboard).toContain("notificationReplyText");
  });

  it("réserve la réponse rapide aux notifications administratives", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain('notification.category === "admin"');
    expect(dashboard).toContain("Votre réponse");
    expect(dashboard).toContain("Envoyer la réponse");
  });

  it("limite le message à 2 000 caractères côté interface", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain("maxLength={2000}");
  });

  it("propose des modèles de réponses rapides pré-rédigés", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain("Document joint");
    expect(dashboard).toContain("Paiement effectué");
    expect(dashboard).toContain("État du dossier");
    expect(dashboard).toContain("Besoin d'aide");
  });
});
