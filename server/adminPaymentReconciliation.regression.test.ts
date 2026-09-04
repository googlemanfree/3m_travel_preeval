import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readProjectFile = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("rapprochement paiement admin", () => {
  it("accepte et persiste la référence et les montants attendu/confirmé", () => {
    const router = readProjectFile("server/routers/application.ts");
    expect(router).toContain("paymentReference: z.string().trim().max(255).optional()");
    expect(router).toContain("expectedAmount: z.number().int().nonnegative().max(100000000).optional()");
    expect(router).toContain("confirmedAmount: z.number().int().nonnegative().max(100000000).optional()");
    expect(router).toContain("paymentConfirmedAmount:");
    expect(router).toContain("paymentValidatedBy:");
  });

  it("affiche les statuts métier et distingue Orange Money de l’agence", () => {
    const component = readProjectFile("client/src/components/AdminPaymentManagement.tsx");
    expect(component).toContain("En attente de référence");
    expect(component).toContain("Référence soumise à vérifier");
    expect(component).toContain("Confirmé par un conseiller");
    expect(component).toContain("Orange Money à distance");
    expect(component).toContain("Montant confirmé");
    expect(component).toContain("Référence à vérifier");
    expect(component).toContain("Écart de montant");
    expect(component).toContain("pendingReferenceCount");
  });

  it("ne demande plus le code secret candidat pour confirmer un paiement", () => {
    const component = readProjectFile("client/src/components/AdminPaymentManagement.tsx");
    expect(component).not.toContain("admin-payment-secret");
    expect(component).not.toContain("paymentSecretCode: actionType");
    expect(component).not.toContain("Saisissez le code secret transmis par le candidat");
    expect(component).toContain("référence Orange Money ou la mention de paiement en agence");
    expect(component).toContain("paymentReference: paymentReference.trim() || undefined");
  });

  it("réinitialise le cache tRPC de la liste candidats pour le jeton courant", () => {
    const dashboard = readProjectFile("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("trpcUtils.admin.listCandidates.reset()");
    expect(dashboard).toContain("const candidateListInput = useMemo");
    expect(dashboard).toContain("sessionToken");
  });
});
