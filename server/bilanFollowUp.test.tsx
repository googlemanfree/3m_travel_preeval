// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { buildFollowUp, followUpState, reminderMessage, splitInTwo, type FollowUpRow } from "../shared/bilanFollowUp";
import { bilanIdentityFrom, inspectBilan, renderBilanFragment, toBilanHtml } from "../shared/bilanContent";

(globalThis as any).React = React;
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const state = vi.hoisted(() => ({ queries: {} as Record<string, any>, calls: [] as Array<{ proc: string; input: any }>, results: {} as Record<string, any> }));
vi.mock("@/lib/clientSpaceSync", () => ({ clientSpacePolling: () => ({}) }));
vi.mock("@/lib/trpc", () => {
  const procedure = (path: string) => ({
    useQuery: () => ({ error: null, isLoading: false, ...(state.queries[path] ?? { data: undefined }) }),
    useMutation: (options?: { onSuccess?: (result: unknown) => void }) => ({
      isPending: false,
      mutate: (input?: unknown) => { state.calls.push({ proc: path, input }); options?.onSuccess?.(state.results[path] ?? { ok: true, emailSent: true, items: [{ amount: 1 }, { amount: 2 }] }); },
      mutateAsync: async (input?: unknown) => { state.calls.push({ proc: path, input }); return state.results[path] ?? { ok: true, message: "ok" }; },
    }),
  });
  return { trpc: new Proxy({}, { get: (_t, router: string) => router === "useUtils" ? () => new Proxy({}, { get: () => new Proxy({}, { get: () => ({ invalidate: async () => undefined }) }) }) : new Proxy({}, { get: (_p, name: string) => procedure(`${router}.${name}`) }) }) };
});

import { AdminBilanFollowUp } from "../client/src/components/AdminBilanFollowUp";
import { ClientBilanDecision } from "../client/src/components/ClientBilanDecision";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const token = "t".repeat(40);
beforeAll(() => { (window.HTMLElement.prototype as any).scrollIntoView = vi.fn(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); state.queries = {}; state.calls = []; state.results = {}; });

const NOW = new Date("2026-11-10T12:00:00Z");
const row = (id: number, over: Partial<FollowUpRow> = {}): FollowUpRow => ({ id, candidateId: id + 100, fullName: `Candidat ${id}`, email: `c${id}@example.test`, dossierNumber: `3M-${id}`, destination: "Canada", visaType: "Travail", paymentAmount: 100000, paymentStatus: "PENDING", sentAt: "2026-11-05T12:00:00Z", viewedAt: null, activationRequestedAt: null, ...over });

describe("suivi des bilans : calculs", () => {
  it("chaque bilan est en attente, refusé, en ouverture ou payé ; le paiement l'emporte sur tout", () => {
    expect(followUpState(row(1), undefined)).toBe("waiting");
    expect(followUpState(row(1), { decision: "declined", reason: "price", at: "x" })).toBe("declined");
    expect(followUpState(row(1), { decision: "accepted", reason: null, at: "x" })).toBe("opening");
    expect(followUpState(row(1, { activationRequestedAt: "2026-11-06T00:00:00Z" }), undefined)).toBe("opening");
    expect(followUpState(row(1, { paymentStatus: "SUCCESS" }), { decision: "declined", reason: "price", at: "x" })).toBe("paid");
  });

  it("l'entonnoir compte envoyés, ouverts, ouvertures demandées, payés et refusés ; la liste ne garde que ceux à relancer, les plus anciens d'abord", () => {
    const rows = [row(1, { viewedAt: "2026-11-06T00:00:00Z", sentAt: "2026-11-09T12:00:00Z" }), row(2, { sentAt: "2026-11-01T12:00:00Z" }), row(3), row(4, { paymentStatus: "SUCCESS" }), row(5, { activationRequestedAt: "2026-11-07T00:00:00Z" }), row(6, { sentAt: "2026-11-02T12:00:00Z" })];
    const decisions = { 3: { decision: "declined" as const, reason: "question", comment: "Rappelez-moi", at: "2026-11-08T00:00:00Z" }, 6: { decision: "declined" as const, reason: "price", at: "2026-11-08T00:00:00Z" } };
    const { stats, items } = buildFollowUp(rows, decisions, {}, NOW);
    expect(stats).toMatchObject({ sent: 6, viewed: 1, opening: 2, paid: 1, declined: 2, waiting: 2 });
    expect(stats.reasons).toEqual([{ reason: "question", count: 1 }, { reason: "price", count: 1 }].sort((a, b) => b.count - a.count || 0));
    expect(items.map((item) => item.id)).toEqual([3, 2, 6, 1]);
    expect(items[0]).toMatchObject({ state: "declined", reason: "question", comment: "Rappelez-moi", daysSinceSent: 5 });
    expect(items.find((item) => item.id === 4)).toBeUndefined();
    expect(items.find((item) => item.id === 5)).toBeUndefined();
  });

  it("une relance n'est possible qu'une fois par 24 h et seulement si le dossier est rattaché à un compte", () => {
    const reminders = { 1: { at: "2026-11-10T06:00:00Z", count: 2 }, 2: { at: "2026-11-09T06:00:00Z", count: 1 } };
    const { items } = buildFollowUp([row(1), row(2), row(3, { candidateId: null })], {}, reminders, NOW);
    expect(items.find((item) => item.id === 1)).toMatchObject({ canRemind: false, reminderCount: 2 });
    expect(items.find((item) => item.id === 2)?.canRemind).toBe(true);
    expect(items.find((item) => item.id === 3)?.canRemind).toBe(false);
  });

  it("le taux par destination n'est donné qu'à partir de 5 bilans ; ensuite il compte les ouvertures demandées", () => {
    const many = Array.from({ length: 5 }, (_, index) => row(10 + index, { destination: "Luxembourg", activationRequestedAt: index < 2 ? "2026-11-07T00:00:00Z" : null }));
    const { stats } = buildFollowUp([...many, row(1), row(2)], {}, {}, NOW);
    expect(stats.byDestination.find((item) => item.destination === "Luxembourg")).toMatchObject({ sent: 5, opening: 2, ratePercent: 40, lowSample: false });
    expect(stats.byDestination.find((item) => item.destination === "Canada")).toMatchObject({ sent: 2, ratePercent: null, lowSample: true });
  });

  it("le texte de relance est factuel : pas d'urgence inventée, pas de promesse, rappel de non-garantie", () => {
    const { title, body } = reminderMessage("Aïcha");
    expect(title).toMatch(/bilan/i);
    expect(body).toContain("Bonjour Aïcha");
    expect(body).toContain("Je valide et j'ouvre mon dossier");
    expect(body).toContain("ne garantit aucune décision");
    expect(body).not.toMatch(/dernier|urgent|limité|expire|plus que|\d+\s?(?:XAF|FCFA|€)/i);
    expect(inspectBilan(toBilanHtml(body)).forbiddenTerms).toEqual([]);
    expect(reminderMessage("").body.startsWith("Bonjour, votre bilan")).toBe(true);
  });

  it("deux versements : la somme est exacte, le premier est arrondi au-dessus, le solde arrive trente jours plus tard", () => {
    const [first, second] = splitInTwo(100001, new Date("2026-11-10T12:00:00Z"));
    expect(first.amount + second.amount).toBe(100001);
    expect(first.amount).toBe(50001);
    expect([first.dueOn, second.dueOn]).toEqual(["2026-11-10", "2026-12-10"]);
    expect(first.label).toContain("1er versement");
  });
});

describe("panneau « Bilans à relancer »", () => {
  const data = () => ({ data: buildFollowUp([row(1, { viewedAt: "2026-11-06T00:00:00Z" }), row(2), row(3)], { 3: { decision: "declined", reason: "price", comment: "Trop cher", at: "2026-11-08T00:00:00Z" } }, { 2: { at: "2026-11-10T10:00:00Z", count: 1 } }, NOW) });

  it("montre l'entonnoir, les motifs de refus et la liste ; relancer demande confirmation puis appelle le serveur ; le dossier relancé il y a moins de 24 h est grisé", async () => {
    state.queries["bilanFollowUp.pending"] = data();
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    render(<AdminBilanFollowUp sessionToken={token} />);
    expect(screen.getByTestId("followup-funnel").textContent).toMatch(/Bilans envoyés/);
    expect(screen.getByTestId("followup-reasons").textContent).toMatch(/frais me paraissent trop élevés/);
    expect(screen.getByTestId("followup-item-3").textContent).toMatch(/Trop cher/);
    expect((screen.getByTestId("followup-remind-2") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("followup-remind-2").textContent).toMatch(/moins de 24 h/);
    fireEvent.click(screen.getByTestId("followup-remind-1"));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(state.calls).toHaveLength(0);
    fireEvent.click(screen.getByTestId("followup-remind-1"));
    await waitFor(() => expect(state.calls.filter((call) => call.proc === "bilanFollowUp.remind")).toHaveLength(1));
    expect(state.calls[0].input).toEqual({ sessionToken: token, applicationId: 1 });
  });

  it("« Proposer 2 versements » demande confirmation avec le montant puis appelle le serveur", async () => {
    state.queries["bilanFollowUp.pending"] = data();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminBilanFollowUp sessionToken={token} />);
    fireEvent.click(screen.getByTestId("followup-installments-3"));
    expect(confirm.mock.calls[0][0]).toMatch(/deux versements/);
    await waitFor(() => expect(state.calls.some((call) => call.proc === "bilanFollowUp.proposeInstallments" && call.input.applicationId === 3)).toBe(true));
  });

  it("sans bilan en attente, le panneau le dit", () => {
    state.queries["bilanFollowUp.pending"] = { data: buildFollowUp([row(1, { paymentStatus: "SUCCESS" })], {}, {}, NOW) };
    render(<AdminBilanFollowUp sessionToken={token} />);
    expect(screen.getByTestId("followup-empty")).toBeTruthy();
  });
});

describe("garde-fous et branchements", () => {
  it("toutes les procédures de suivi exigent une session administrateur ; la relance est limitée à 24 h ; le test d'e-mail va à l'administrateur connecté seulement", () => {
    const router = read("server/routers/bilanFollowUp.ts");
    const names = Array.from(router.matchAll(/\n  ([A-Za-z]+): publicProcedure/g), (match) => match[1]);
    expect(names).toEqual(["pending", "remind", "proposeInstallments", "sendTest"]);
    expect((router.match(/await requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(names.length);
    expect(router).toContain("Une relance a déjà été envoyée il y a moins de 24 heures.");
    expect(router).toContain("testEmail: admin.email");
    expect(router).not.toMatch(/application\.email[^;\n]*sendEvaluationTestEmail/);
    expect(router).toContain('application.paymentStatus === "SUCCESS"');
    expect(router).toContain("emailAllowed(db, application.candidateId)");
    expect(read("server/routers.ts")).toContain("bilanFollowUp: bilanFollowUpRouter");
    expect(read("client/src/components/AdminOps.tsx")).toContain('{section === "followup" && <AdminBilanFollowUp sessionToken={sessionToken} />}');
  });

  it("l'éditeur propose « M'envoyer un test » ; le client peut « Parler à mon conseiller » (rendez-vous de la page, sinon contact)", async () => {
    const editor = read("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(editor).toContain('data-testid="bilan-test-email"');
    expect(editor).toContain("trpc.bilanFollowUp.sendTest.useMutation()");
    state.queries["evaluationDecision.myDecision"] = { data: { sent: true, decision: null, reason: null, at: null, opening: false } };
    const target = document.createElement("div");
    target.setAttribute("data-testid", "client-remote-support");
    document.body.appendChild(target);
    target.scrollIntoView = vi.fn();
    render(<ClientBilanDecision />);
    fireEvent.click(screen.getByTestId("bilan-talk"));
    expect(target.scrollIntoView).toHaveBeenCalled();
    target.remove();
  });
});

describe("fiche d'identification automatique dans le bilan", () => {
  it("reprend le numéro de compte, la référence, l'e-mail, le téléphone, le conseiller et la date, sans valeur vide ni « Non renseigné »", () => {
    const identity = bilanIdentityFrom({ candidateId: 9, email: " aicha@example.test ", phone: "+237 600 00 00 00", advisor: "Marie Ngo", now: new Date("2026-11-10T12:00:00Z") });
    expect(identity).toMatchObject({ accountNumber: "COMPTE-00009", email: "aicha@example.test", phone: "+237 600 00 00 00", advisor: "Marie Ngo", issuedAt: "10 novembre 2026" });
    const html = renderBilanFragment({ html: toBilanHtml("Bonjour"), title: "Évaluation", candidateName: "Aïcha Diallo", reference: "3M-2026-00005", identity });
    for (const value of ["Fiche d’identification du dossier", "COMPTE-00009", "3M-2026-00005", "aicha@example.test", "+237 600 00 00 00", "Marie Ngo", "10 novembre 2026"]) expect(html).toContain(value);
    const sparse = bilanIdentityFrom({ candidateId: null, email: "a@b.test", phone: "Non renseigné", advisor: " ", now: new Date("2026-11-10T12:00:00Z") });
    expect(sparse).toMatchObject({ accountNumber: null, phone: null, advisor: null });
    const sparseHtml = renderBilanFragment({ html: "<p>x</p>", title: "T", candidateName: "A B", identity: sparse });
    expect(sparseHtml).not.toContain("COMPTE-");
    expect(sparseHtml).not.toContain("Non renseigné");
    expect(renderBilanFragment({ html: "<p>x</p>", title: "T", candidateName: "A B" })).not.toContain("Fiche d’identification");
  });

  it("les valeurs sont échappées et la fiche est alimentée partout où le bilan est rendu (e-mail, espace client, aperçu)", () => {
    const html = renderBilanFragment({ html: "<p>x</p>", title: "T", candidateName: "A B", identity: { email: "<script>alert(1)</script>@x.test", accountNumber: "COMPTE-00001" } });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(read("server/evaluationService.ts")).toContain("identity: bilanIdentityFrom(");
    expect(read("client/src/components/EvaluationDeliveryEditor.tsx")).toContain("identity: bilanIdentityFrom(");
    expect(read("server/routers/unifiedRequests.ts")).toContain("candidateId: (application as { candidateId?: number | null }).candidateId ?? null");
  });
});
