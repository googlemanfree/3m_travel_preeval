import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildProtocolOneRichText } from "../shared/agreementProtocolCountryTemplates";
import { referenceChangeSentence, resolveClientReference } from "../shared/caseReference";
import { pickActiveNumber } from "./services/promotePaidReference";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("après paiement, COMPTE-… est remplacé par un numéro 3M-… généré", () => {
  it("le numéro suit le format 3M-AAAA-NNNNN, avec une suite libre si déjà pris", () => {
    expect(pickActiveNumber({ year: 2026, applicationId: 42, taken: [] })).toBe("3M-2026-00042");
    expect(pickActiveNumber({ year: 2026, applicationId: 42, taken: ["3M-2026-00042"] })).toBe("3M-2026-0001");
    expect(pickActiveNumber({ year: 2026, applicationId: 10230001, taken: ["COMPTE-10230001"] })).toBe("3M-2026-10230001");
  });

  it("une demande payée et validée porte sa référence 3M- ; un paiement non validé reste un compte", () => {
    const view = resolveClientReference({ candidateId: 7, onlineApplication: { dossierNumber: "3M-2026-00042", paymentStatus: "SUCCESS", paymentValidatedAt: new Date() } });
    expect(view.reference).toBe("3M-2026-00042");
    expect(view.activated).toBe(true);
    // Une demande non payée reste un compte.
    expect(resolveClientReference({ candidateId: 7, onlineApplication: { dossierNumber: "COMPTE-00007", paymentStatus: "PENDING" } }).reference).toBe("COMPTE-00007");
    expect(resolveClientReference({ candidateId: 7, onlineApplication: { dossierNumber: "3M-2026-00042", paymentStatus: "SUCCESS" } }).reference).toBe("COMPTE-00007");
  });

  it("le reçu et le protocole partent APRÈS la promotion de la référence", () => {
    const source = read("./services/paymentPackage.ts");
    const promote = source.indexOf("promoteOnlineApplicationToActiveNumber(db, reference.id");
    const load = source.indexOf("const dossier = await loadDossier(db, reference);", source.indexOf("export async function sendReceiptAndProtocol"));
    expect(promote).toBeGreaterThan(-1);
    expect(promote).toBeLessThan(load);
  });

  it("le rattrapage des dossiers déjà payés est branché sur la normalisation et la garde permanente", () => {
    expect(read("./services/normalizeAccountReferences.ts")).toContain("promotePaidAccountKeys");
    expect(read("./services/activationGuard.ts")).toContain("report.paidAccountKeys.promoted");
    expect(read("./services/normalizeAfterOpeningPayment.ts")).toContain("promoteOnlineApplicationToActiveNumber");
  });

  it("la promotion ne touche ni un compte non payé ni un miroir de dossier agence", () => {
    const source = read("./services/promotePaidReference.ts");
    expect(source).toContain('paymentStatus !== "SUCCESS" || !app.paymentValidatedAt');
    expect(source).toContain("parseEvalAgencyShellId(app.dossierNumber) != null");
  });
});

describe("la référence COMPTE n'est plus montrée après paiement", () => {
  it("la phrase d'activation ne cite plus COMPTE", () => {
    const sentence = referenceChangeSentence("COMPTE-00012", "3M-2026-00042");
    expect(sentence).not.toContain("COMPTE");
    expect(sentence).toContain("3M-2026-00042");
  });
  it("le protocole ne rappelle pas l'ancienne référence de compte", () => {
    const text = buildProtocolOneRichText({
      clientNomComplet: "A", dossierRef: "3M-2026-00042", destinationProjet: "Canada", modePaiement: "OM", dateHeurePaiement: "x",
      conseillerEmail: "c@x", empreinteSha: "a", clientIpAddress: "-", dateDuJour: "x",
    }, "Canada", "Canada RP");
    expect(text).toContain("Dossier actif n° 3M-2026-00042");
    expect(text).not.toContain("COMPTE");
  });
  it("les écrans d'administration n'affichent plus « Ancien compte »", () => {
    expect(read("../client/src/components/AdminContractsReceiptsDesk.tsx")).not.toContain("Ancien compte");
    expect(read("../client/src/components/Candidate360Workspace.tsx")).not.toContain("Ancien compte");
    expect(read("../server/emailService.ts")).not.toContain("Votre référence de compte <strong>");
  });
});
