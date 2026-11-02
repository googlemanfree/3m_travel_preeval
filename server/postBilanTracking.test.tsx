// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const mocks = vi.hoisted(() => ({
  scan: vi.fn(),
  deactivate: vi.fn(),
  sendEmail: vi.fn(),
}));
vi.mock("./services/deactivateDossier", () => ({ scanActivationsWithoutProof: mocks.scan, deactivateCandidateDossier: mocks.deactivate }));
vi.mock("./_core/email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("./db", () => ({ getDb: async () => null }));

import { ACTIVATION_GUARD_ACTOR, ACTIVATION_GUARD_BATCH, activationGuardEnabled, enforceActivationInvariant } from "./services/activationGuard";
import { acknowledgeBilanSent, recordBilanViewed } from "./services/bilanReceipts";
import { AdminPreDossierEvaluationPanel } from "../client/src/components/AdminPreDossierEvaluationPanel";
import { isBilanSent } from "../client/src/lib/bilanSent";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");

/** Fausse base : les lectures rendent les réponses données dans l'ordre ; les écritures sont enregistrées ; `affected` simule le nombre de lignes modifiées. */
function fakeDb(reads: unknown[][] = [], affected = 1) {
  const inserts: any[] = [];
  const updates: any[] = [];
  const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => reads.shift() ?? [] };
  return {
    inserts,
    updates,
    db: {
      select: () => chain,
      insert: () => ({ values: async (values: any) => { inserts.push(values); } }),
      update: () => ({ set: (values: any) => ({ where: async () => { updates.push(values); return [{ affectedRows: affected }]; } }) }),
    } as any,
  };
}
const row = (id: number, suggested: boolean) => ({ candidateId: id, fullName: `C${id}`, email: `c${id}@x.test`, dossierStatus: "documents", activeDossierNumber: null, activatedAt: null, evidence: { ok: false }, autoActivated: suggested, suggested });

beforeEach(() => { mocks.scan.mockReset(); mocks.deactivate.mockReset().mockResolvedValue({ ok: true, reference: "COMPTE-1", touchedDossiers: 0 }); mocks.sendEmail.mockReset().mockResolvedValue(undefined); delete process.env.ACTIVATION_GUARD; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("contrôle permanent : aucun dossier activé sans preuve de paiement", () => {
  it("retire l'activation des dossiers sans preuve, journalise l'acteur automatique, et laisse à l'administration les dossiers avancés ou payés sans trace", async () => {
    mocks.scan.mockResolvedValue({ scanned: 9, rows: [row(1, true), row(2, true), row(3, false)] });
    const { db, inserts } = fakeDb([[]]);
    const report = await enforceActivationInvariant(db);
    expect(report).toEqual({ enabled: true, scanned: 9, removed: 2, review: 1, failures: 0 });
    expect(mocks.deactivate).toHaveBeenCalledTimes(2);
    expect(mocks.deactivate.mock.calls.map((call) => call[1].candidateId)).toEqual([1, 2]);
    expect(mocks.deactivate.mock.calls[0][1]).toMatchObject({ actorEmail: ACTIVATION_GUARD_ACTOR, notifyCandidate: false });
    expect(mocks.deactivate.mock.calls[0][1].reason).toMatch(/sans preuve de paiement/);
    const alert = inserts.find((item) => item.relatedId === "activation_guard");
    expect(alert.message).toMatch(/2 dossier\(s\)/);
    expect(alert.message).toMatch(/1 dossier\(s\) avancé\(s\)/);
  });

  it("un échec sur un dossier n'arrête pas les suivants ; le lot est plafonné ; ne rien retirer ne crée aucune alerte répétée", async () => {
    mocks.scan.mockResolvedValue({ scanned: 3, rows: [row(1, true), row(2, true), row(3, true)] });
    mocks.deactivate.mockRejectedValueOnce(new Error("panne")).mockResolvedValue({ ok: true, reference: "x", touchedDossiers: 0 });
    const first = await enforceActivationInvariant(fakeDb([[]]).db);
    expect(first).toMatchObject({ removed: 2, failures: 1 });
    mocks.deactivate.mockClear();
    mocks.scan.mockResolvedValue({ scanned: 500, rows: Array.from({ length: ACTIVATION_GUARD_BATCH + 20 }, (_, index) => row(index + 1, true)) });
    const capped = await enforceActivationInvariant(fakeDb([[]]).db);
    expect(capped.removed).toBe(ACTIVATION_GUARD_BATCH);
    mocks.scan.mockResolvedValue({ scanned: 4, rows: [row(9, false)] });
    const same = fakeDb([[{ id: 1, settingValue: "1" }]]);
    await enforceActivationInvariant(same.db);
    expect(same.inserts.filter((item) => item.relatedId === "activation_guard")).toHaveLength(0);
    const changed = fakeDb([[{ id: 1, settingValue: "0" }]]);
    await enforceActivationInvariant(changed.db);
    expect(changed.inserts.filter((item) => item.relatedId === "activation_guard")).toHaveLength(1);
  });

  it("l'arrêt d'urgence ACTIVATION_GUARD=off désactive tout ; le contrôle est branché au démarrage du serveur", async () => {
    expect(activationGuardEnabled(undefined)).toBe(true);
    expect(activationGuardEnabled("off")).toBe(false);
    expect(activationGuardEnabled(" OFF ")).toBe(false);
    process.env.ACTIVATION_GUARD = "off";
    const off = await enforceActivationInvariant(fakeDb().db);
    expect(off).toEqual({ enabled: false, scanned: 0, removed: 0, review: 0, failures: 0 });
    expect(mocks.scan).not.toHaveBeenCalled();
    const index = read("server/_core/index.ts");
    expect(index).toContain("startActivationGuard();");
    expect(index).toContain('import { startActivationGuard } from "../services/activationGuard";');
  });
});

describe("accusé de réception et notification de consultation", () => {
  it("l'accusé d'envoi part par e-mail à l'agence avec le candidat, le dossier, l'heure et l'auteur ; il est branché à l'envoi", async () => {
    await acknowledgeBilanSent({ fullName: "Aïcha Diallo", email: "aicha@x.test", dossierNumber: "3M-2026-00005", destination: "Luxembourg", kindLabel: "Visa travail", sentBy: "Marie Ngo" });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    const mail = mocks.sendEmail.mock.calls[0][0];
    expect(mail.to).toBe("hello@3mtravelagency.com");
    expect(mail.subject).toContain("Aïcha Diallo");
    expect(mail.html).toContain("3M-2026-00005");
    expect(mail.html).toContain("Marie Ngo");
    expect(mail.html).toContain("Message interne de suivi");
    const send = read("server/routers/unifiedRequests.ts");
    expect(send.slice(send.indexOf("sendEvaluationNow: publicProcedure"))).toContain("void acknowledgeBilanSent({");
  });

  it("un e-mail agence qui échoue ne casse jamais l'envoi du bilan", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("SMTP indisponible"));
    await expect(acknowledgeBilanSent({ fullName: "A B", email: "a@b.test", dossierNumber: "3M-1", kindLabel: "Visa travail", sentBy: "Admin" })).resolves.toBe(false);
  });

  it("la première consultation est notifiée une seule fois (admin + e-mail agence) ; les suivantes, ou une requête simultanée perdue, ne font rien", async () => {
    const first = fakeDb([[{ fullName: "Aïcha Diallo", email: "a@x.test", dossierNumber: "3M-2026-00005", destination: "Canada" }]], 1);
    expect(await recordBilanViewed(first.db, 5, "espace client")).toBe(true);
    expect(first.inserts[0]).toMatchObject({ title: "Bilan consulté par le candidat", relatedId: "evaluation_viewed:5" });
    expect(first.inserts[0].message).toContain("espace client");
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendEmail.mock.calls[0][0].subject).toContain("Bilan consulté");
    mocks.sendEmail.mockClear();
    const again = fakeDb([], 0);
    expect(await recordBilanViewed(again.db, 5, "e-mail")).toBe(false);
    expect(again.inserts).toHaveLength(0);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("l'ouverture de l'e-mail précise qu'elle peut être un aperçu automatique ; les deux points de lecture passent par la même fonction", async () => {
    const view = fakeDb([[{ fullName: "A B", email: "a@x.test", dossierNumber: "3M-1", destination: null }]], 1);
    await recordBilanViewed(view.db, 7, "e-mail");
    expect(view.inserts[0].message).toMatch(/aperçu automatique/);
    expect(read("server/_core/index.ts")).toContain('recordBilanViewed(db, tracked.evaluationId, "e-mail")');
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain('module.recordBilanViewed(db, application.id, "espace client")');
    expect(candidate).toContain('await recordBilanViewed(db, application.id, "espace client")');
  });
});

describe("boutons du dossier une fois le bilan envoyé", () => {
  const props = { status: "pending_validation" as const, declaredAt: "2026-10-27T15:42:25Z", onReview: vi.fn() };

  it("« Valider l'évaluation » devient « Évaluation effectuée » (inactif) et les décisions disparaissent ; sans envoi, rien ne change", () => {
    const { unmount } = render(<AdminPreDossierEvaluationPanel {...props} evaluationDone />);
    const done = screen.getByTestId("evaluation-done") as HTMLButtonElement;
    expect(done.textContent).toMatch(/Évaluation effectuée/);
    expect(done.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Valider l’évaluation" })).toBeNull();
    expect(screen.queryByText("Refuser la déclaration")).toBeNull();
    unmount();
    render(<AdminPreDossierEvaluationPanel {...props} />);
    expect(screen.queryByTestId("evaluation-done")).toBeNull();
    expect((screen.getByRole("button", { name: "Valider l’évaluation" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("« Préparer / envoyer le bilan » devient « Modifier le bilan » quand le bilan est envoyé", () => {
    expect(isBilanSent({ evaluationDeliveryStatus: "sent" }, null)).toBe(true);
    expect(isBilanSent({}, { candidate: { evaluationDeliveryStatus: "SENT" } })).toBe(true);
    expect(isBilanSent({ internalStatus: "bilan_envoye" }, {})).toBe(true);
    expect(isBilanSent({ evaluationDeliveryStatus: "draft" }, { candidate: {} })).toBe(false);
    expect(isBilanSent(null, undefined)).toBe(false);
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('{isBilanSent(candidate, data) ? "Modifier le bilan" : "Préparer / envoyer le bilan"}');
    expect(dashboard).toContain("evaluationDone={isBilanSent(candidate, data)}");
  });
});
