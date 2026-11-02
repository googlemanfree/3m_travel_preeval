import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("../server/_core/email", () => ({ sendEmail: vi.fn(async () => undefined) }));
vi.mock("../server/routers/adminNotifications", () => ({ notifyAdmins: vi.fn(async () => undefined) }));

import { sendEmail } from "./_core/email";
import { notifyAdmins } from "./routers/adminNotifications";
import {
  EMAIL_ALERT_WINDOW_MS,
  alertStaffOfCandidateMessage,
  buildCandidateMessageEmail,
  getCandidateMessageAlertRecipients,
  maskSensitiveRuns,
  resetCandidateMessageEmailThrottle,
  shouldEmailNow,
} from "./services/candidateMessageEmailAlert";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

beforeEach(() => {
  resetCandidateMessageEmailThrottle();
  vi.clearAllMocks();
});

describe("alerte e-mail quand un client écrit", () => {
  it("masque les numéros de document, de carte et de compte", () => {
    const masked = maskSensitiveRuns("Mon passeport AB1234567 et ma carte 4111 1111 1111 1111, IBAN FR76 3000 6000 0112 3456 7890 189");
    expect(masked).not.toMatch(/AB1234567|4111|3000 6000/);
    expect(masked).toContain("masqué");
  });

  it("destinataires : variable dédiée, sinon alertes de documents, sinon hello@ ; adresses invalides écartées", () => {
    expect(getCandidateMessageAlertRecipients({})).toEqual(["hello@3mtravelagency.com"]);
    expect(getCandidateMessageAlertRecipients({ DOCUMENT_ALERT_RECIPIENTS: "a@x.com" })).toEqual(["a@x.com"]);
    expect(getCandidateMessageAlertRecipients({ CANDIDATE_MESSAGE_ALERT_RECIPIENTS: "B@x.com, nope, b@x.com,c@y.org", DOCUMENT_ALERT_RECIPIENTS: "a@x.com" })).toEqual(["b@x.com", "c@y.org"]);
  });

  it("le corps est échappé et ne contient aucune pièce jointe", () => {
    const { subject, html } = buildCandidateMessageEmail({ candidateId: 12, fullName: "<b>Awa</b>", content: "<script>alert(1)</script> bonjour", hasAttachment: true });
    expect(subject).toContain("COMPTE-00012");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>Awa");
    expect(html).toContain("pièce jointe");
  });

  it("limite les e-mails par client pour les messages ordinaires, jamais pour un rendez-vous ou une question", () => {
    expect(shouldEmailNow(5, "message", 1_000)).toBe(true);
    expect(shouldEmailNow(5, "message", 1_000 + EMAIL_ALERT_WINDOW_MS - 1)).toBe(false);
    expect(shouldEmailNow(5, "message", 1_000 + EMAIL_ALERT_WINDOW_MS)).toBe(true);
    expect(shouldEmailNow(6, "message", 2_000)).toBe(true);
    expect(shouldEmailNow(5, "rendez-vous", 2_000)).toBe(true);
    expect(shouldEmailNow(5, "question", 2_001)).toBe(true);
  });

  it("cloche à chaque message, e-mail une fois par fenêtre ; un e-mail en échec ne casse rien", async () => {
    await alertStaffOfCandidateMessage({ candidateId: 9, fullName: "Awa Diop", content: "Bonjour, un point sur mon dossier", hasAttachment: false });
    await alertStaffOfCandidateMessage({ candidateId: 9, fullName: "Awa Diop", content: "Deuxième message", hasAttachment: false });
    expect(notifyAdmins).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    (sendEmail as any).mockRejectedValueOnce(new Error("SMTP indisponible"));
    await expect(alertStaffOfCandidateMessage({ candidateId: 10, fullName: "B", content: "Ça marche ?", hasAttachment: false })).resolves.toBeUndefined();
  });

  it("tous les points d'écriture du client alertent l'équipe", () => {
    const candidate = read("server/routers/candidate.ts");
    expect(candidate.match(/alertStaffOfCandidateMessage\(/g)?.length).toBe(3);
    expect(read("server/routers/oauthUserDashboard.ts")).toContain("alertStaffOfCandidateMessage(");
  });

  it("l'administrateur répond depuis l'onglet Échanges par l'espace + e-mail ou par WhatsApp (sans e-mail)", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain('channel: z.enum(["space_email", "whatsapp"]).default("space_email")');
    expect(admin).toContain('if (input.channel !== "whatsapp") try {');
    const ui = read("client/src/components/Candidate360Workspace.tsx");
    expect(ui).toContain('data-testid="candidate360-reply-whatsapp"');
    expect(ui).toContain('data-testid="candidate360-reply-email"');
    expect(ui).toContain('channel: "whatsapp"');
    expect(ui).toContain("candidate360-last-candidate-message");
  });
});
