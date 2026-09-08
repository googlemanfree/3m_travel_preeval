import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildPaymentReceiptEmailHtml } from "./utils/paymentReceipt";

const projectRoot = path.resolve(__dirname, "..");

describe("Payment receipt professional delivery", () => {
  it("uses the requested fee wording and does not promise employment", () => {
    const html = buildPaymentReceiptEmailHtml({
      dossierNumber: "3M-AGN-270002",
      fullName: "SIEWE TCHAKOUA Louis Valere",
      email: "louistchakoua4@gmail.com",
      amount: 65000,
      currency: "XAF",
      paymentDate: new Date("2026-09-08T10:52:19Z"),
      paymentMethod: "Paiement en agence / validation administrative",
      paymentReference: "Validation manuelle / agence",
      validatedBy: "conseiller@3mtravelagency.com",
      destination: "luxembourg",
      visaType: "Travail",
    });

    expect(html).toContain("Ouverture du dossier, traitement administratif");
    expect(html).toContain("agences de placement partenaires");
    expect(html).toContain("recherche d’un contrat de travail");
    expect(html).toContain("ne constitue pas une garantie d’emploi");
    expect(html).toContain("mon-espace?section=dossier");
    expect(html).not.toContain("IA");
  });

  it("attaches the generated PDF in both online and candidate receipt flows", () => {
    const applicationRouter = fs.readFileSync(path.join(projectRoot, "server/routers/application.ts"), "utf8");
    const candidateRouter = fs.readFileSync(path.join(projectRoot, "server/routers/adminCandidateManagement.ts"), "utf8");
    expect(applicationRouter).toContain("buildPaymentReceiptPdf");
    expect(applicationRouter).toContain('contentType: "application/pdf"');
    expect(candidateRouter).toContain("sendPaymentReceiptForCandidate");
    expect(candidateRouter).toContain("buildPaymentReceiptEmailHtml");
    expect(candidateRouter).toContain("Recu-paiement-");
  });
});
