import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readProjectFile = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("client communication and report previews", () => {
  it("does not expose AI wording in the client messaging surface", () => {
    const space = readProjectFile("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("Messagerie avec votre conseiller 3M Travel");
    expect(space).toContain("Assistance 3M Travel");
    expect(space).not.toContain("Assistant Aureol IA");
    expect(space).not.toContain("Posez vos questions à notre IA");
  });

  it("brands the client report with the official logo and 3M palette", () => {
    const service = readProjectFile("server/evaluationService.ts");
    expect(service).toContain("pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg");
    expect(service).toContain("brand-logo");
    expect(service).toContain("#0B1F4B");
    expect(service).toContain("3M Travel &amp; Services SARL");
  });

  it("keeps email and PDF previews available before final send", () => {
    const editor = readProjectFile("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(editor).toContain("Aperçu exact de l’e-mail d’évaluation");
    expect(editor).toContain("PDFPreviewModal");
    expect(editor).toContain("Valider et envoyer");
  });
});
