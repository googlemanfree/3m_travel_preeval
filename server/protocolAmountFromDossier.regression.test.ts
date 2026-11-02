import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildProtocolOneRichText, type ProtocolOneVariables } from "../shared/agreementProtocolCountryTemplates";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const base: ProtocolOneVariables = {
  clientNomComplet: "Client Test",
  dossierRef: "3M-TEST-1",
  destinationProjet: "Canada",
  modePaiement: "Paiement en ligne",
  dateHeurePaiement: "20/10/2026 10:00",
  conseillerEmail: "conseiller@example.test",
  empreinteSha: "abc123",
  clientIpAddress: "127.0.0.1",
  dateDuJour: "20/10/2026",
};

describe("Protocole d'accord N°01 : le montant vient du dossier, jamais d'un chiffre écrit en dur", () => {
  it("affiche le montant confirmé du dossier, quel qu'il soit", () => {
    const text = buildProtocolOneRichText({ ...base, montantValide: 90000 }, "Canada", "Visa études");
    expect(text).toContain("d'un montant de 90 000 XAF");
    expect(text).toContain("Montant validé : 90 000 XAF.");
    expect(text).not.toContain("65 000");
    expect(text).not.toContain("soixante-cinq");
  });

  it("sans montant connu, renvoie au Reçu Officiel au lieu d'afficher un chiffre supposé", () => {
    const text = buildProtocolOneRichText(base, "Canada", "Visa études");
    expect(text).toContain("dont le montant est celui indiqué sur le Reçu Officiel de paiement");
    expect(text).toContain("Montant validé : tel qu'indiqué sur le Reçu Officiel de paiement.");
    expect(text).not.toMatch(/\d{2,3} 000 XAF/);
  });

  it("les générateurs de protocole transmettent le montant du dossier en ligne", () => {
    expect(read("server/services/paymentPackage.ts")).toContain("montantValide: dossier.applicationId ? dossier.amount : undefined,");
    expect(read("server/routers/adminCandidateManagement.ts")).toContain("montantValide: paymentAmountValue,");
    expect(read("server/routers/candidate.ts")).toContain("montantValide: Number(application.paymentConfirmedAmount ?? application.paymentAmount) || undefined,");
  });

  it("le moteur d'évaluation ne promet plus de résultat et n'annonce plus un montant unique", () => {
    const engine = read("server/routers/evaluationEngine.ts");
    expect(engine).not.toContain("Garantie de résultat");
    expect(engine).not.toContain("65 000 FCFA");
  });
});
