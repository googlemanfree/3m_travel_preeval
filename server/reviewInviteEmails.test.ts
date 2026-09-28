import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/email", () => ({ sendEmail: vi.fn(async () => {}) }));

import { sendEmail } from "./_core/email";
import { REVIEW_INVITE_DAILY_CAP, REVIEW_INVITE_MIN_AGE_MS, buildReviewInviteEmail, planReviewInvites } from "./scheduled/reviewInviteEmails";
import type { InviteCandidate } from "../shared/reviewInviteTargets";

const sendEmailMock = vi.mocked(sendEmail);
afterEach(() => sendEmailMock.mockClear());

const NOW = new Date("2026-09-28T08:00:00Z");
const candidate = (patch: Partial<InviteCandidate> = {}): InviteCandidate => ({
  key: "online_1",
  email: "awa@example.com",
  fullName: "Awa Nkolo",
  phone: "699000000",
  destination: "Canada",
  visaType: "travail",
  approvedAt: new Date(NOW.getTime() - REVIEW_INVITE_MIN_AGE_MS - 60_000),
  ...patch,
});

describe("contenu de l'e-mail d'invitation", () => {
  it("neutre (avis positif ou critique), avec l'accord de publication annoncé, jamais un avis fabriqué", () => {
    const { subject, html } = buildReviewInviteEmail({ firstName: "Awa", url: "https://www.3mtravelagency.com/avis?service=Visa+Travail#deposer-un-avis" });
    expect(subject).toContain("Votre avis");
    expect(html).toContain("Bonjour Awa");
    expect(html).toContain("positif ou critique");
    expect(html).toContain("avec votre accord");
    expect(html).toContain("après vérification par notre équipe");
    expect(html).toContain("https://www.3mtravelagency.com/avis?service=Visa+Travail#deposer-un-avis");
  });

  it("neutralise le HTML d'un prénom imprévisible", () => {
    const { html } = buildReviewInviteEmail({ firstName: '<img src=x onerror="alert(1)">', url: "https://x/y" });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

describe("planification : qui reçoit un e-mail, qui est écarté", () => {
  it("un dossier approuvé depuis assez longtemps, sans opt-out, part en e-mail", () => {
    const plan = planReviewInvites([candidate()], new Set(), NOW);
    expect(plan).toEqual([{ candidate: candidate(), action: "send" }]);
  });

  it("laisse le temps à un conseiller d'agir : un dossier trop récent n'est pas encore invité", () => {
    const tooRecent = candidate({ approvedAt: new Date(NOW.getTime() - REVIEW_INVITE_MIN_AGE_MS + 60_000) });
    expect(planReviewInvites([tooRecent], new Set(), NOW)).toEqual([]);
  });

  it("une adresse invalide n'est jamais envoyée, mais reste comptée (pour qu'un admin la corrige)", () => {
    const plan = planReviewInvites([candidate({ email: "pas-une-adresse" })], new Set(), NOW);
    expect(plan).toEqual([{ candidate: candidate({ email: "pas-une-adresse" }), action: "invalid_email" }]);
  });

  it("un client qui s'est désinscrit des e-mails automatiques (même liste que les relances) n'est jamais sollicité", () => {
    const plan = planReviewInvites([candidate()], new Set(["awa@example.com"]), NOW);
    expect(plan.map((item) => item.action)).toEqual(["opted_out"]);
  });

  it("plafonné, les dossiers approuvés en attente depuis le plus longtemps d'abord", () => {
    const old = candidate({ key: "online_1", approvedAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000) });
    const recent = candidate({ key: "online_2", approvedAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000) });
    const plan = planReviewInvites([recent, old], new Set(), NOW, 1);
    expect(plan).toHaveLength(1);
    expect(plan[0].candidate.key).toBe("online_1");
  });

  it("respecte le plafond quotidien par défaut", () => {
    const many = Array.from({ length: REVIEW_INVITE_DAILY_CAP + 5 }, (_, index) => candidate({ key: `online_${index}`, email: `client${index}@example.com` }));
    expect(planReviewInvites(many, new Set(), NOW)).toHaveLength(REVIEW_INVITE_DAILY_CAP);
  });

  it("un dossier sans date d'approbation n'est jamais bloqué par le délai", () => {
    expect(planReviewInvites([candidate({ approvedAt: null })], new Set(), NOW)).toEqual([{ candidate: candidate({ approvedAt: null }), action: "send" }]);
  });
});

describe("branchement : même tâche quotidienne, même clé « déjà invité » que l'outil manuel", () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), "utf8").split(String.fromCharCode(13)).join("");

  it("la tâche quotidienne lance les invitations et renvoie leur résumé", () => {
    const job = read("server/scheduled/documentReminderJob.ts");
    expect(job).toContain("runReviewInviteEmails(db, { dryRun })");
    expect(job).toContain("reviewInvites:");
  });

  it("réutilise exactement la même marque « déjà invité » et la même sélection que l'outil manuel de l'admin", () => {
    const source = read("server/scheduled/reviewInviteEmails.ts");
    expect(source).toContain("reviewInvitedKey(candidate.key)".replace("candidate.key", "key"));
    expect(source).toContain("pickClientsToInvite(candidates,");
    expect(source).toContain('like(agencySettings.settingKey, `${REVIEW_INVITED_KEY_PREFIX}%`)');
  });

  it("en aperçu (dryRun), aucun e-mail n'est envoyé et aucun client n'est marqué invité", async () => {
    const { runReviewInviteEmails } = await import("./scheduled/reviewInviteEmails");
    const calls: string[] = [];
    const fakeDb = {
      select: () => ({
        from: (table: unknown) => {
          calls.push(String(table));
          return { where: () => ({ limit: async () => [] }), limit: async () => [] };
        },
      }),
    } as never;
    const outcomes = await runReviewInviteEmails(fakeDb, { dryRun: true, now: NOW });
    expect(outcomes).toEqual([]);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
