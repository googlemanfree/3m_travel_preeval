import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeWhatsAppPhone, toE164WhatsApp } from "../shared/whatsappPhone";
import {
  buildAgencyDocumentsPublishedWhatsApp,
  buildDossierCreatedWhatsApp,
  buildPaymentReceiptApprovedWhatsApp,
  buildProcedureStageWhatsApp,
} from "./whatsappService";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("normalizeWhatsAppPhone", () => {
  it("accepte les formats camerounais courants", () => {
    expect(normalizeWhatsAppPhone("6 99 12 34 56")).toBe("237699123456");
    expect(normalizeWhatsAppPhone("+237 698 104 832")).toBe("237698104832");
    expect(normalizeWhatsAppPhone("237620996045")).toBe("237620996045");
    expect(normalizeWhatsAppPhone("00237620996045")).toBe("237620996045");
    expect(toE164WhatsApp("699123456")).toBe("+237699123456");
  });

  it("refuse les numéros incomplets", () => {
    expect(normalizeWhatsAppPhone("123")).toBeNull();
    expect(normalizeWhatsAppPhone("")).toBeNull();
    expect(normalizeWhatsAppPhone("abc")).toBeNull();
  });
});

describe("messages WhatsApp dossier / documents", () => {
  it("construit le message de documents publiés", () => {
    const message = buildAgencyDocumentsPublishedWhatsApp({
      candidateName: "Jean Mbarga",
      documentCount: 2,
      dossierNumber: "3M-AGN-0012",
    });
    expect(message).toContain("Jean Mbarga");
    expect(message).toContain("2 documents");
    expect(message).toContain("3M-AGN-0012");
    expect(message).toContain("mon-espace?section=documents");
  });

  it("construit le message de création de dossier", () => {
    const message = buildDossierCreatedWhatsApp({
      candidateName: "Amina",
      dossierNumber: "3M-AGN-0007",
      destination: "Canada",
      visaType: "Études",
    });
    expect(message).toContain("Amina");
    expect(message).toContain("Canada");
    expect(message).toContain("Études");
    expect(message).toContain("3M-AGN-0007");
  });

  it("construit le message d’étape procédure", () => {
    const message = buildProcedureStageWhatsApp({
      candidateName: "Paul",
      dossierNumber: "3M-2026-0042",
      stageLabel: "Collecte des documents",
      stepLabel: "Étape 3 sur 7 : Pièces à fournir",
    });
    expect(message).toContain("Paul");
    expect(message).toContain("Collecte des documents");
    expect(message).toContain("Étape 3 sur 7");
  });

  it("construit le message de reçu signé", () => {
    const message = buildPaymentReceiptApprovedWhatsApp({
      candidateName: "Grace",
      dossierNumber: "3M-AGN-0015",
      amount: "65000",
      currency: "XAF",
    });
    expect(message).toContain("Grace");
    expect(message).toContain("3M-AGN-0015");
    expect(message).toContain("65000 XAF");
    expect(message).toContain("mon-espace?section=overview");
    expect(message).toContain("Reçu de paiement validé");
  });
});

describe("branchements WhatsApp admin", () => {
  it("publie WhatsApp à l’import, à la publication docs et au changement de statut", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("notifyDossierCreatedWhatsApp");
    expect(admin).toContain("notifyProcedureStageWhatsApp");
    expect(admin).toContain("whatsappSent");

    const publish = read("server/services/publishAgencyDocumentsToCase.ts");
    expect(publish).toContain("notifyAgencyDocumentsPublishedWhatsApp");
    expect(publish).toContain("whatsapp_documents_published");

    const service = read("server/whatsappService.ts");
    expect(service).toContain("toE164WhatsApp");
    expect(service).toContain("buildAgencyDocumentsPublishedWhatsApp");
    expect(service).toContain("buildPaymentReceiptApprovedWhatsApp");
    expect(service).toContain("URLSearchParams");

    const management = read("server/routers/adminCandidateManagement.ts");
    expect(management).toContain("notifyPaymentReceiptApprovedWhatsApp");
    expect(management).toContain("receipt_approved_whatsapp");
    expect(management).toContain("whatsappSent");

    expect(read("client/src/components/AgencyDossierDocumentCenter.tsx")).toContain("WhatsApp envoyé au client");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("WhatsApp envoyé");
    expect(read("client/src/components/AdminContractsReceiptsDesk.tsx")).toContain("WhatsApp envoyé au client");
  });
});
