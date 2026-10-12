import { describe, expect, it } from "vitest";
import { buildSignedAgreementEmail } from "./services/signedAgreementEmail";

describe("buildSignedAgreementEmail", () => {
  it("inclut l’en-tête agence, le pied de page légal et la signature", () => {
    const { subject, html } = buildSignedAgreementEmail({
      fullName: "Jean Dupont",
      dossierNumber: "3M-2026-1001",
      signatureName: "Jean Dupont",
      signedAt: new Date("2026-10-09T10:00:00.000Z"),
      siteUrl: "https://www.3mtravelagency.com",
      protocolFileName: "Protocole-accord-01-signe-3M-2026-1001.pdf",
      signatureImageUrl: "https://files.example/signature.png",
    });

    expect(subject).toContain("3M-2026-1001");
    expect(subject).toContain("signé");
    expect(html).toContain("3M TRAVEL AGENCY");
    expect(html).toContain("RC/YAO/2019/A/2567");
    expect(html).toContain("NIU : M112417203369H");
    expect(html).toContain("Protocole d’accord N°01 — signé");
    expect(html).toContain("Jean Dupont");
    expect(html).toContain("https://files.example/signature.png");
    expect(html).toContain("Protocole-accord-01-signe-3M-2026-1001.pdf");
  });
});
