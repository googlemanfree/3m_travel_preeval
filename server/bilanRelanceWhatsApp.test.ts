import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AUTO_RELANCE_MAX,
  buildAutoRelanceMessage,
  buildBilanPdfWhatsAppMessage,
  buildWhatsAppManualLink,
  isWithinSendWindow,
  planAutoRelance,
} from "../shared/bilanRelanceAuto";
import { waitingTime } from "../client/src/lib/evaluationQueue";
import { sendWhatsAppDocument } from "./whatsappService";

const NOW = new Date("2026-11-26T10:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();
const row = (over: Partial<Parameters<typeof planAutoRelance>[0]> = {}) => ({
  candidateId: 7, sentAt: daysAgo(3), viewedAt: null, paymentStatus: null, activationRequestedAt: null, ...over,
});

describe("relance automatique des bilans — calendrier", () => {
  it("relance à J+2, J+5 puis J+10, trois fois au maximum", () => {
    expect(planAutoRelance(row({ sentAt: daysAgo(1) }), undefined, undefined, NOW)).toEqual({ due: false, reason: "too_early" });
    expect(planAutoRelance(row({ sentAt: daysAgo(2) }), undefined, undefined, NOW)).toMatchObject({ due: true, step: 1 });
    expect(planAutoRelance(row({ sentAt: daysAgo(4) }), undefined, { at: daysAgo(2), count: 1 }, NOW)).toEqual({ due: false, reason: "too_early" });
    expect(planAutoRelance(row({ sentAt: daysAgo(6) }), undefined, { at: daysAgo(3), count: 1 }, NOW)).toMatchObject({ due: true, step: 2 });
    expect(planAutoRelance(row({ sentAt: daysAgo(11) }), undefined, { at: daysAgo(5), count: 2 }, NOW)).toMatchObject({ due: true, step: 3 });
    expect(planAutoRelance(row({ sentAt: daysAgo(15) }), undefined, { at: daysAgo(5), count: AUTO_RELANCE_MAX }, NOW)).toEqual({ due: false, reason: "max_reached" });
  });

  it("ne relance pas un candidat qui a répondu, payé, refusé ou sans compte", () => {
    expect(planAutoRelance(row({ paymentStatus: "SUCCESS" }), undefined, undefined, NOW)).toEqual({ due: false, reason: "answered" });
    expect(planAutoRelance(row({ activationRequestedAt: daysAgo(1) }), undefined, undefined, NOW)).toEqual({ due: false, reason: "answered" });
    expect(planAutoRelance(row(), { decision: "declined", reason: "price", at: daysAgo(1) }, undefined, NOW)).toEqual({ due: false, reason: "answered" });
    expect(planAutoRelance(row({ candidateId: null }), undefined, undefined, NOW)).toEqual({ due: false, reason: "no_account" });
    expect(planAutoRelance(row({ sentAt: null }), undefined, undefined, NOW)).toEqual({ due: false, reason: "not_sent" });
  });

  it("respecte 48 h entre deux relances (manuelles comprises) et un âge maximal de 30 jours", () => {
    expect(planAutoRelance(row({ sentAt: daysAgo(6) }), undefined, { at: daysAgo(1), count: 1 }, NOW)).toEqual({ due: false, reason: "cooldown" });
    expect(planAutoRelance(row({ sentAt: daysAgo(31) }), undefined, undefined, NOW)).toEqual({ due: false, reason: "too_old" });
  });

  it("distingue le candidat qui a ouvert son bilan de celui qui ne l’a pas ouvert", () => {
    expect(planAutoRelance(row({ viewedAt: daysAgo(1) }), undefined, undefined, NOW)).toMatchObject({ due: true, viewed: true });
    expect(planAutoRelance(row(), undefined, undefined, NOW)).toMatchObject({ due: true, viewed: false });
  });

  it("n’envoie qu’aux heures de bureau de Yaoundé (07 h–18 h UTC)", () => {
    expect(isWithinSendWindow(new Date("2026-11-26T06:59:00Z"))).toBe(false);
    expect(isWithinSendWindow(new Date("2026-11-26T07:00:00Z"))).toBe(true);
    expect(isWithinSendWindow(new Date("2026-11-26T17:59:00Z"))).toBe(true);
    expect(isWithinSendWindow(new Date("2026-11-26T18:00:00Z"))).toBe(false);
  });
});

describe("relance automatique des bilans — messages", () => {
  const base = { firstName: "Aïcha", dossierNumber: "3M-EVAL-0042", spaceUrl: "https://www.3mtravelagency.com/mon-espace" };

  it("trois messages distincts, sans promesse de résultat ni pression", () => {
    const messages = ([1, 2, 3] as const).map((step) => buildAutoRelanceMessage({ ...base, step, viewed: false }));
    expect(new Set(messages.map((m) => m.title)).size).toBe(3);
    for (const message of messages) {
      expect(message.body).toContain("Aïcha");
      expect(message.body).toContain("3M-EVAL-0042");
      expect(message.body).toMatch(/ne garantit aucune décision/i);
      expect(`${message.body} ${message.whatsapp}`).not.toMatch(/dernière chance|urgent|garanti(?!t)/i);
    }
    expect(messages[2].body).toMatch(/dernier message automatique/i);
    expect(messages[2].whatsapp).toMatch(/ne vous relancerons plus/i);
  });

  it("adapte la première relance à l’ouverture du bilan", () => {
    expect(buildAutoRelanceMessage({ ...base, step: 1, viewed: true }).title).toMatch(/questions/i);
    expect(buildAutoRelanceMessage({ ...base, step: 1, viewed: false }).title).toMatch(/vous attend/i);
  });

  it("le message WhatsApp du bilan contient le lien du PDF, l’espace client et la mention légale", () => {
    const message = buildBilanPdfWhatsAppMessage({ ...base, pdfUrl: "https://www.3mtravelagency.com/manus-storage/x.pdf" });
    expect(message).toContain("https://www.3mtravelagency.com/manus-storage/x.pdf");
    expect(message).toContain("https://www.3mtravelagency.com/mon-espace");
    expect(message).toMatch(/ne garantit aucune décision/i);
  });

  it("construit un lien WhatsApp prérempli, ou rien si le numéro est invalide", () => {
    const link = buildWhatsAppManualLink("698 10 48 32", "Bonjour & merci");
    expect(link).toBe("https://wa.me/237698104832?text=Bonjour%20%26%20merci");
    expect(buildWhatsAppManualLink("abc", "x")).toBeNull();
    expect(buildWhatsAppManualLink(null, "x")).toBeNull();
  });
});

describe("envoi WhatsApp avec pièce jointe", () => {
  it("ne simule jamais un envoi : sans Twilio configuré, aucun succès n’est annoncé", async () => {
    const result = await sendWhatsAppDocument("+237698104832", "Bonjour", "https://www.3mtravelagency.com/x.pdf");
    expect(result.success).toBe(false);
    expect(result.configured).toBe(false);
    expect(result.error).toMatch(/non configuré/i);
  });

  it("refuse un lien non https et un numéro invalide", async () => {
    expect((await sendWhatsAppDocument("+237698104832", "Bonjour", "http://x/y.pdf")).error).toMatch(/https/);
    expect((await sendWhatsAppDocument("xx", "Bonjour", "https://x/y.pdf")).error).toMatch(/invalide/i);
  });
});

describe("file des bilans — temps d’attente", () => {
  const at = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString();
  it("signale les retards à 24 h et 48 h", () => {
    expect(waitingTime({ id: 1, generatedAt: at(3) }, NOW)).toMatchObject({ level: "ok", label: "3 h d’attente" });
    expect(waitingTime({ id: 1, generatedAt: at(30) }, NOW)).toMatchObject({ level: "late" });
    expect(waitingTime({ id: 1, generatedAt: at(72) }, NOW)).toMatchObject({ level: "overdue", label: "3 j d’attente" });
    expect(waitingTime({ id: 1 }, NOW)).toBeNull();
  });
});

describe("branchements", () => {
  const read = (path: string) => readFileSync(path, "utf8");
  it("la relance automatique démarre avec le serveur et peut être coupée", () => {
    expect(read("server/_core/index.ts")).toContain("startBilanAutoRelance();");
    const actions = read("server/services/bilanFollowUpActions.ts");
    expect(actions).toContain('BILAN_RELANCE_AUTO || "").toLowerCase() === "off"');
    expect(actions).toContain("emailAllowed(db, row.candidateId");
    expect(actions).toContain("isWhatsAppConfigured()");
  });
  it("le bilan part aussi par WhatsApp (PDF) à l’envoi quand WhatsApp est configuré, sans bloquer l’envoi", () => {
    const unified = read("server/routers/unifiedRequests.ts");
    expect(unified).toMatch(/if \(isWhatsAppConfigured\(\)\) \{\s*void sendBilanPdfByWhatsApp\(db, application\.id\)\.catch/);
  });
  it("les écrans exposent l’envoi WhatsApp, la relance automatique et le temps d’attente", () => {
    expect(read("client/src/components/AdminBilanFollowUp.tsx")).toContain("auto-relance-toggle");
    expect(read("client/src/components/AdminBilanFollowUp.tsx")).toContain("WhatsApp + PDF");
    expect(read("client/src/components/EvaluationDeliveryEditor.tsx")).toContain("bilan-whatsapp-send");
    expect(read("client/src/pages/AdminEvaluations.tsx")).toContain("queue-waiting");
  });
});
