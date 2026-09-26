import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: new Map<any, any[]>(),
  inserts: [] as Array<{ table: any; values: any }>,
  emails: [] as any[],
  failEmail: false,
}));

vi.mock("./_core/email", () => ({
  sendEmail: async (message: any) => {
    if (state.failEmail) throw new Error("smtp down");
    state.emails.push(message);
  },
}));

const fake = vi.hoisted(() => ({
  db: null as any,
}));
vi.mock("./db", () => ({ getDb: async () => fake.db }));

import { agencyDossierDocuments, agencyDossiers, agencySettings, applications, candidateFiles, candidates, clientDocuments, emailDeliveryLogs, evaluations } from "../drizzle/schema";
import { REMINDER_SCHEDULE_DAYS, buildDocumentReminderEmail, planReminder, reminderOptOutKey, signReminderStopToken, verifyReminderStopToken, type ReminderCandidate } from "./services/documentReminders";
import { handleReminderStop, runDocumentReminders } from "./scheduled/documentReminderJob";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-09-26T10:00:00Z");
const daysAgo = (days: number, from = NOW) => new Date(from.getTime() - days * DAY);

const candidate = (overrides: Partial<ReminderCandidate> = {}): ReminderCandidate => ({ email: "a@example.com", fullName: "Aïcha", lastActivityAt: daysAgo(4), remindersSinceActivity: 0, lastReminderAt: null, missing: 3, replace: 0, total: 8, optedOut: false, ...overrides });

describe("quand relancer", () => {
  it("J+3, J+7 puis J+14 depuis la dernière activité, trois relances au maximum", () => {
    expect(REMINDER_SCHEDULE_DAYS).toEqual([3, 7, 14]);
    expect(planReminder(candidate({ lastActivityAt: daysAgo(2) }), NOW)).toMatchObject({ due: false, reason: "trop tôt" });
    expect(planReminder(candidate({ lastActivityAt: daysAgo(3) }), NOW)).toMatchObject({ due: true, stage: 1 });
    expect(planReminder(candidate({ lastActivityAt: daysAgo(8), remindersSinceActivity: 1, lastReminderAt: daysAgo(4) }), NOW)).toMatchObject({ due: true, stage: 2 });
    expect(planReminder(candidate({ lastActivityAt: daysAgo(6), remindersSinceActivity: 1, lastReminderAt: daysAgo(3) }), NOW)).toMatchObject({ due: false, reason: "trop tôt" });
    expect(planReminder(candidate({ lastActivityAt: daysAgo(15), remindersSinceActivity: 2, lastReminderAt: daysAgo(5) }), NOW)).toMatchObject({ due: true, stage: 3 });
    expect(planReminder(candidate({ lastActivityAt: daysAgo(60), remindersSinceActivity: 3, lastReminderAt: daysAgo(20) }), NOW)).toMatchObject({ due: false, reason: "relances épuisées" });
  });

  it("jamais deux relances à moins de 3 jours d'écart", () => {
    expect(planReminder(candidate({ lastActivityAt: daysAgo(30), remindersSinceActivity: 1, lastReminderAt: daysAgo(1) }), NOW)).toMatchObject({ due: false, reason: "relance trop récente" });
  });

  it("rien à relancer si la checklist est complète ; jamais après désinscription", () => {
    expect(planReminder(candidate({ missing: 0, replace: 0 }), NOW).due).toBe(false);
    expect(planReminder(candidate({ optedOut: true }), NOW)).toMatchObject({ due: false, reason: "désinscrit" });
    expect(planReminder(candidate({ missing: 0, replace: 2 }), NOW).due).toBe(true);
  });
});

describe("jeton de désinscription", () => {
  it("valable pour la bonne adresse (casse ignorée) et le bon secret, refusé sinon", () => {
    const token = signReminderStopToken("Aicha@Example.com", "secret-1");
    expect(verifyReminderStopToken("aicha@example.com", token, "secret-1")).toBe(true);
    expect(verifyReminderStopToken("autre@example.com", token, "secret-1")).toBe(false);
    expect(verifyReminderStopToken("aicha@example.com", token, "secret-2")).toBe(false);
    expect(verifyReminderStopToken("aicha@example.com", "", "secret-1")).toBe(false);
    expect(verifyReminderStopToken("aicha@example.com", token.slice(0, -1) + (token.endsWith("a") ? "b" : "a"), "secret-1")).toBe(false);
  });

  it("la clé de désinscription ne contient pas l'adresse en clair", () => {
    expect(reminderOptOutKey("Aicha@Example.com")).toBe(reminderOptOutKey("aicha@example.com"));
    expect(reminderOptOutKey("aicha@example.com")).not.toContain("aicha");
    expect(reminderOptOutKey("aicha@example.com").length).toBeLessThanOrEqual(100);
  });
});

describe("e-mail de rappel", () => {
  const input = { fullName: "Aïcha Nkolo", stage: 1, missing: 3, replace: 0, total: 8, firstLabel: "Passeport valide", siteUrl: "https://site.example/", whatsappNumber: "237698104832", whatsappDisplay: "+237 6 98 10 48 32", stopUrl: "https://site.example/api/reminders/stop?e=a&t=b" };

  it("dit combien de pièces sont reçues, laquelle envoyer d'abord, et renvoie vers l'envoi, WhatsApp et la désinscription", () => {
    const { subject, html } = buildDocumentReminderEmail(input);
    expect(subject).toContain("Rappel de vos documents");
    expect(subject).toContain("3 pièces");
    for (const expected of ["5 sur 8", "Passeport valide", "https://site.example/mon-espace?section=documents", "https://wa.me/237698104832", "Ne plus recevoir ces rappels", "3 rappels au maximum", "https://site.example/api/reminders/stop"]) expect(html, expected).toContain(expected);
  });

  it("le dernier rappel le dit ; le message n'invente ni échéance ni conséquence", () => {
    const last = buildDocumentReminderEmail({ ...input, stage: 3 }).html;
    expect(last).toContain("dernier rappel automatique");
    for (const html of [last, buildDocumentReminderEmail(input).html]) expect(html).not.toMatch(/avant le|sous \d+ ?(h|jours)|refus|annul|perdre|urgent/i);
  });

  it("pièces refusées seules : le titre le dit ; HTML et retours à la ligne neutralisés", () => {
    expect(buildDocumentReminderEmail({ ...input, missing: 0, replace: 2 }).subject).toContain("2 pièces sont à remplacer");
    const evil = buildDocumentReminderEmail({ ...input, fullName: "<img src=x onerror=1>", firstLabel: "<script>x</script>\r\nBcc: v@x.y" });
    expect(evil.html).not.toContain("<img");
    expect(evil.html).not.toContain("<script>");
    expect(evil.subject).not.toMatch(/[\r\n]/);
  });
});

// ── Base simulée : les filtres SQL sont ignorés, chaque table renvoie ses lignes ────────────────────────────────────────
const makeDb = () => ({
  select: () => ({
    from: (table: any) => {
      const chain: any = { where: () => chain, orderBy: () => chain, limit: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.rows.get(table) ?? []) };
      return chain;
    },
  }),
  insert: (table: any) => ({
    values: async (values: any) => {
      state.inserts.push({ table, values });
      state.rows.set(table, [...(state.rows.get(table) ?? []), values.createdAt ? values : { ...values, createdAt: new Date() }]);
    },
  }),
});

const seed = (overrides: Record<string, unknown> = {}) => {
  state.rows.set(applications, [{ email: "aicha@example.com" }]);
  state.rows.set(candidates, [{ id: 7, email: "aicha@example.com", fullName: "Aïcha Nkolo", emailVerified: true, dossierStatus: "documents", destination: "canada", preferredDestinations: '["Canada"]', lastLoginAt: null, createdAt: daysAgo(10), ...overrides }]);
  state.rows.set(evaluations, [{ projectType: "etudes" }]);
};

beforeEach(() => {
  state.rows = new Map();
  state.inserts = [];
  state.emails = [];
  state.failEmail = false;
  fake.db = makeDb();
  process.env.JWT_SECRET = "test-secret-reminders";
  seed();
});

describe("tâche planifiée", () => {
  it("envoie une relance au candidat qui a des pièces manquantes, et la journalise", async () => {
    const outcomes = await runDocumentReminders(fake.db, { now: NOW });
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toMatchObject({ email: "aicha@example.com", stage: 1, sent: true });
    expect(outcomes[0].missing).toBeGreaterThan(2);
    expect(state.emails).toHaveLength(1);
    expect(state.emails[0].to).toBe("aicha@example.com");
    expect(state.emails[0].html).toContain("api/reminders/stop?e=aicha%40example.com&amp;t=");
    expect(state.inserts.find((entry) => entry.table === emailDeliveryLogs)!.values).toMatchObject({ recipientEmail: "aicha@example.com", status: "sent" });
  });

  it("un aperçu (dryRun) n'envoie rien et n'écrit rien", async () => {
    const outcomes = await runDocumentReminders(fake.db, { now: NOW, dryRun: true });
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].sent).toBe(false);
    expect(state.emails).toHaveLength(0);
    expect(state.inserts).toHaveLength(0);
  });

  it("la relance suivante attend 3 jours puis part à J+7, la troisième à J+14, puis plus rien", async () => {
    const sent: number[] = [];
    for (const dayOffset of [0, 1, 4, 8, 12, 30]) {
      const outcomes = await runDocumentReminders(fake.db, { now: new Date(NOW.getTime() + dayOffset * DAY) });
      for (const outcome of outcomes) if (outcome.sent) sent.push(outcome.stage);
    }
    expect(sent).toEqual([1, 2, 3]);
    expect(state.emails).toHaveLength(3);
  });

  it("une activité du candidat (dépôt d'une pièce) remet le compteur à zéro", async () => {
    state.rows.set(candidateFiles, [{ fileType: "autre", fileName: "scan.pdf", status: "uploaded", uploadedAt: NOW }]);
    const outcomes = await runDocumentReminders(fake.db, { now: NOW });
    expect(outcomes.filter((outcome) => outcome.sent)).toHaveLength(0);
  });

  it("checklist complète : aucune relance", async () => {
    const { buildRequirementOptions } = await import("../client/src/components/DossierDocumentChecklist");
    const { buildStoredDocumentName } = await import("./routers/candidateUpload");
    state.rows.set(candidateFiles, buildRequirementOptions("Canada", "etudes").map((option) => ({ fileType: "autre", fileName: buildStoredDocumentName(option.label, "scan.pdf"), status: "uploaded", uploadedAt: daysAgo(9) })));
    const outcomes = await runDocumentReminders(fake.db, { now: NOW });
    expect(outcomes).toHaveLength(0);
    expect(state.emails).toHaveLength(0);
  });

  it("désinscrit, non vérifié, ou hors étape « documents » : aucune relance", async () => {
    state.rows.set(agencySettings, [{ id: 1, settingKey: reminderOptOutKey("aicha@example.com") }]);
    expect(await runDocumentReminders(fake.db, { now: NOW })).toHaveLength(0);
    state.rows.delete(agencySettings);
    seed({ emailVerified: false });
    expect(await runDocumentReminders(fake.db, { now: NOW })).toHaveLength(0);
    seed({ dossierStatus: "nouveau" });
    state.rows.set(applications, []);
    expect(await runDocumentReminders(fake.db, { now: NOW })).toHaveLength(0);
    expect(state.emails).toHaveLength(0);
  });

  it("un échec d'envoi n'interrompt pas la tâche et n'est pas journalisé comme envoyé (donc relançable)", async () => {
    state.failEmail = true;
    const outcomes = await runDocumentReminders(fake.db, { now: NOW });
    expect(outcomes[0]).toMatchObject({ sent: false, error: "échec" });
    expect(state.inserts.some((entry) => entry.table === emailDeliveryLogs)).toBe(false);
  });
});

describe("désinscription", () => {
  const response = () => {
    const res: any = { statusCode: 200, body: "" };
    res.status = (code: number) => { res.statusCode = code; return res; };
    res.type = () => res;
    res.send = (body: string) => { res.body = body; return res; };
    return res;
  };

  it("refuse un lien falsifié, sans rien écrire", async () => {
    const res = response();
    await handleReminderStop({ query: { e: "aicha@example.com", t: "faux" } } as any, res);
    expect(res.statusCode).toBe(400);
    expect(state.inserts).toHaveLength(0);
  });

  it("un lien valide enregistre la désinscription (une seule fois) et confirme", async () => {
    const token = signReminderStopToken("aicha@example.com", process.env.JWT_SECRET!);
    for (let index = 0; index < 2; index += 1) {
      const res = response();
      await handleReminderStop({ query: { e: "Aicha@Example.com", t: token } } as any, res);
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain("Rappels arrêtés");
    }
    expect(state.inserts.filter((entry) => entry.table === agencySettings)).toHaveLength(1);
    expect(state.inserts.find((entry) => entry.table === agencySettings)!.values.settingKey).toBe(reminderOptOutKey("aicha@example.com"));
  });

  it("les routes sont protégées par le secret de tâche planifiée, la désinscription est publique", () => {
    const index = read("server/_core/index.ts");
    const job = index.slice(index.indexOf('"/api/scheduled/document-reminders"'), index.indexOf('"/api/reminders/stop"'));
    expect(job).toContain("requireCronSecret(req, res)");
    expect(index).toContain('app.get("/api/reminders/stop"');
  });
});

void agencyDossierDocuments; void agencyDossiers; void clientDocuments;
