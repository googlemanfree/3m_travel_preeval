import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SCHEDULED_JOBS } from "./cron/scheduledJobsCron";
import {
  REMINDER_DEDUPE_DAYS,
  REMINDER_MIN_AGE_DAYS,
} from "./services/signatureAndConfirmationReminders";
import {
  buildBilanConfirmationReminderWhatsApp,
  buildDocumentReminderWhatsApp,
  buildSecondAgreementSignatureReminderWhatsApp,
} from "./whatsappService";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Relances auto — protocole, bilan, pièces WhatsApp", () => {
  it("enregistre le job signature-confirmation-reminders", () => {
    expect(REMINDER_MIN_AGE_DAYS).toBe(2);
    expect(REMINDER_DEDUPE_DAYS).toBe(3);
    const job = SCHEDULED_JOBS.find((entry) => entry.path === "/api/scheduled/signature-confirmation-reminders");
    expect(job?.supportsDryRun).toBe(true);
    expect(read("server/_core/index.ts")).toContain("/api/scheduled/signature-confirmation-reminders");
    const service = read("server/services/signatureAndConfirmationReminders.ts");
    expect(service).toContain("protocol_one");
    expect(service).toContain("protocol_two");
    expect(service).toContain("bilan_confirmation");
    expect(service).toContain("agreement_signature_reminder_sent");
    expect(service).toContain("bilan_confirmation_reminder_sent");
  });

  it("ajoute WhatsApp aux relances pièces du job document-reminders", () => {
    const job = read("server/scheduled/documentReminderJob.ts");
    expect(job).toContain("notifyDocumentReminderWhatsApp");
    expect(job).toContain("whatsappSent");
  });

  it("construit les messages WhatsApp protocole 02, bilan et pièces", () => {
    const p2 = buildSecondAgreementSignatureReminderWhatsApp({
      candidateName: "Sara",
      dossierNumber: "3M-2026-0001",
      employerName: "Acme Care",
    });
    expect(p2).toContain("Sara");
    expect(p2).toContain("Protocole N°02");
    expect(p2).toContain("Acme Care");

    const bilan = buildBilanConfirmationReminderWhatsApp({
      candidateName: "Paul",
      dossierNumber: "3M-AGN-0012",
    });
    expect(bilan).toContain("Paul");
    expect(bilan).toContain("bilan");

    const docs = buildDocumentReminderWhatsApp({
      candidateName: "Amina",
      stage: 2,
      missing: 3,
      replace: 1,
      firstLabel: "Passeport",
    });
    expect(docs).toContain("Amina");
    expect(docs).toContain("Passeport");
    expect(docs).toContain("documents");
  });
});
