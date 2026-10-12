import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildAgreementSignedWhatsApp } from "./whatsappService";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("WhatsApp confirmation protocole signé", () => {
  it("message client clair avec lien documents", () => {
    const message = buildAgreementSignedWhatsApp({
      candidateName: "Amina Nguema",
      dossierNumber: "3M-2026-0101",
    });
    expect(message).toContain("Amina Nguema");
    expect(message).toContain("3M-2026-0101");
    expect(message).toMatch(/signé/i);
    expect(message).toContain("mon-espace?section=documents");
  });

  it("branche signAgreementProtocol (online + agency) sans rewrite de status", () => {
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain("notifyAgreementSignedWhatsApp");
    expect(candidate).toContain("agreement_signed_whatsapp");

    const mutationSlice = candidate.slice(
      candidate.indexOf("signAgreementProtocol:"),
      candidate.indexOf("signSecondAgreementProtocol:"),
    );
    expect(mutationSlice).toContain("notifyAgreementSignedWhatsApp");
    // Deux branches (agence + online)
    expect(mutationSlice.match(/notifyAgreementSignedWhatsApp/g)?.length).toBeGreaterThanOrEqual(2);
    // Pas de rewrite de statut dans le bloc WhatsApp post-signature
    expect(mutationSlice).not.toMatch(/dossierStatus:\s*"paye"/);
    expect(mutationSlice).not.toMatch(/\.update\(agencyDossiers\)[\s\S]{0,200}status:/);

    const notify = read("server/services/clientWhatsAppNotify.ts");
    expect(notify).toContain("buildAgreementSignedWhatsApp");
    expect(notify).toContain("notifyAgreementSignedWhatsApp");
  });
});
