import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeNextStep, type NextStepInput } from "@/lib/nextStep";

const base: NextStepInput = { evaluationRequired: false, agreementSignatureRequired: false };

describe("espace client confiance — priorité lecture seule", () => {
  it("paiement dû avant protocole et pièces", () => {
    const step = computeNextStep({
      ...base,
      paymentDue: true,
      paymentHref: "/paiement?ref=3M-AGN-1",
      agreementSignatureRequired: true,
      requirements: [{ id: 1, status: "pending", isRequired: true }],
    });
    expect(step.id).toBe("payment-due");
    expect(step.action).toEqual({ kind: "link", href: "/paiement?ref=3M-AGN-1" });
  });

  it("notifications et messages après les pièces bloquantes", () => {
    expect(computeNextStep({ ...base, unreadNotifications: 2, unreadMessages: 3 }).id).toBe("notifications-unread");
    expect(computeNextStep({ ...base, unreadMessages: 2 }).id).toBe("messages-unread");
    expect(
      computeNextStep({
        ...base,
        requirements: [{ id: 1, status: "rejected", isRequired: true }],
        unreadNotifications: 9,
      }).id,
    ).toBe("documents-rejected");
  });

  it("WhatsApp conseillé quand tout est à jour", () => {
    const step = computeNextStep({ ...base, advisorWhatsAppUrl: "https://wa.me/237698104832?text=bonjour" });
    expect(step.id).toBe("all-clear");
    expect(step.actionLabel).toBe("Écrire sur WhatsApp");
    expect(step.action).toEqual({ kind: "link", href: "https://wa.me/237698104832?text=bonjour" });
  });

  it("EvaluationSpace n’écrit pas les dossiers actifs (mutations lecture seule UI)", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/EvaluationSpace.tsx"), "utf8");
    // Garde-fou : pas de mutation admin / rewrite de statut dossier dans l’espace client de cette vague.
    expect(source).not.toMatch(/admin\.(updateDossier|setDossierStatus|rewrite|forceStatus)/);
    expect(source).toContain("À faire maintenant");
    expect(source).toContain("client-agency-proofs");
    expect(source).toContain("client-sticky-next-step");
    expect(source).toContain("ClientAdvisorWhatsApp");
    expect(source).toContain("n’est pas modifié");
  });
});
