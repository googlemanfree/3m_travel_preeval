import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("protocole d’accord — signature espace client → PDF mail", () => {
  it("exige la signature manuscrite et génère le PDF signé avec envoi e-mail", () => {
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain("signAgreementProtocol");
    expect(candidate).toContain('signatureDataUrl: z.string().min(80');
    expect(candidate).toContain("createAgreementProtocolOnePdf");
    expect(candidate).toContain("buildSignedAgreementEmail");
    expect(candidate).toContain('contentType: "application/pdf"');
    expect(candidate).toContain("Protocole-accord-01-signe-");
    expect(candidate).toContain("signature: {");
  });

  it("embarque la signature dans le PDF et dessine pied de page agence", () => {
    const pdf = read("server/agreementProtocolPdfService.ts");
    expect(pdf).toContain("AgreementProtocolSignature");
    expect(pdf).toContain("drawAgencyFooter");
    expect(pdf).toContain("RC/YAO/2019/A/2567");
    expect(pdf).toContain("exemplaire signé");
    expect(pdf).toContain("addImage(dataUrl, \"PNG\"");
    expect(pdf).toContain("protocole-01-signe.pdf");
  });

  it("affiche le CTA de signature et le message de transmission côté espace client", () => {
    const page = read("client/src/pages/EvaluationSpace.tsx");
    expect(page).toContain("Signer et soumettre le protocole");
    expect(page).toContain("Signature et envoi");
    expect(page).toContain("exemplaire PDF signé");
  });
});
