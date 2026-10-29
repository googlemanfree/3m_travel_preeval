// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { findForbiddenTerms } from "../shared/evaluationValidation";
import {
  ACK_TEMPLATES,
  REPLY_TEMPLATES,
  buildHandoverSummary,
  canBookSlot,
  canCancelBooking,
  fillTemplate,
  firstName,
  needsReminder,
  normalizeJoinUrl,
  typedNameMatches,
  waitingDays,
  waitingLevel,
  whatsappLink,
} from "../shared/remoteSupport";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  overview: { data: undefined as any },
  book: vi.fn(), cancel: vi.fn(), accept: vi.fn(), decline: vi.fn(), report: vi.fn(),
  slots: { data: [] as any[] }, waiting: { data: [] as any[] }, prompt: { data: null as any },
}));
vi.mock("@/lib/clientSpaceSync", () => ({ clientSpacePolling: () => ({}) }));
vi.mock("@/lib/trpc", () => {
  const mutation = (fn: ReturnType<typeof vi.fn>) => ({ useMutation: () => ({ mutate: fn, isPending: false }) });
  const query = (get: () => unknown) => ({ useQuery: () => ({ ...(get() as object), error: null, isLoading: false }) });
  return {
    trpc: {
      useUtils: () => new Proxy({}, { get: () => new Proxy({}, { get: () => ({ invalidate: vi.fn() }) }) }),
      adminInsights: { mySatisfactionPrompt: query(() => state.prompt), answerSatisfaction: mutation(vi.fn()) },
      remoteSupport: {
        myOverview: query(() => state.overview),
        adminSlots: query(() => state.slots),
        adminWaiting: query(() => state.waiting),
        adminFindCandidate: query(() => ({ data: [] })),
        bookSlot: mutation(state.book), cancelBooking: mutation(state.cancel), acceptAcknowledgement: mutation(state.accept), declineAcknowledgement: mutation(state.decline), reportProblem: mutation(state.report),
        adminCreateSlots: mutation(vi.fn()), adminCancelSlot: mutation(vi.fn()), adminCloseSlot: mutation(vi.fn()), adminSendDueReminders: mutation(vi.fn()), adminReply: mutation(vi.fn()),
      },
    },
  };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import { ClientRemoteSupport } from "../client/src/components/ClientRemoteSupport";
import { AdminRemoteSupport } from "../client/src/components/AdminRemoteSupport";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const HOUR = 3600_000;
afterEach(() => { cleanup(); for (const key of ["book", "cancel", "accept", "decline", "report"] as const) state[key].mockReset(); });

describe("accompagnement à distance : règles", () => {
  it("n'accepte que des liens https de plateformes de visio connues, sans identifiant", () => {
    expect(normalizeJoinUrl("https://meet.google.com/abc-defg-hij")).toMatchObject({ ok: true });
    expect(normalizeJoinUrl("https://us02web.zoom.us/j/123456789?pwd=x")).toMatchObject({ ok: true });
    expect(normalizeJoinUrl("https://wa.me/237698104832")).toMatchObject({ ok: true });
    for (const bad of ["http://meet.google.com/x", "https://meet.google.com.evil.example/x", "https://evil.example/zoom.us", "javascript:alert(1)", "https://user:pass@meet.google.com/x", "", "pas un lien"]) {
      expect(normalizeJoinUrl(bad), bad).toMatchObject({ ok: false });
    }
  });

  it("un créneau se réserve et s'annule jusqu'à 2 heures avant son début, et le rappel part dans les 26 heures", () => {
    const now = new Date("2026-11-02T08:00:00Z");
    const at = (hours: number) => new Date(now.getTime() + hours * HOUR);
    expect(canBookSlot({ status: "open", startsAt: at(3) }, now)).toBe(true);
    expect(canBookSlot({ status: "open", startsAt: at(1) }, now)).toBe(false);
    expect(canBookSlot({ status: "booked", startsAt: at(5) }, now)).toBe(false);
    expect(canCancelBooking({ status: "booked", startsAt: at(5) }, now)).toBe(true);
    expect(canCancelBooking({ status: "booked", startsAt: at(1) }, now)).toBe(false);
    expect(needsReminder({ status: "booked", startsAt: at(20), reminderSentAt: null }, now)).toBe(true);
    expect(needsReminder({ status: "booked", startsAt: at(30), reminderSentAt: null }, now)).toBe(false);
    expect(needsReminder({ status: "booked", startsAt: at(20), reminderSentAt: now }, now)).toBe(false);
    expect(needsReminder({ status: "open", startsAt: at(20) }, now)).toBe(false);
  });

  it("messages sans réponse : récent, à relancer dès 2 jours, urgent dès 5 jours", () => {
    const now = new Date("2026-11-10T12:00:00Z");
    expect(waitingDays(new Date("2026-11-07T12:00:00Z"), now)).toBe(3);
    expect(waitingLevel(1)).toBe("normal");
    expect(waitingLevel(2)).toBe("late");
    expect(waitingLevel(5)).toBe("urgent");
  });

  it("réponses types : prénom inséré, aucun montant, aucune promesse de résultat", () => {
    expect(firstName("Olivier NOUBISSI NZOKOU")).toBe("Olivier");
    expect(fillTemplate("Bonjour {prenom}, merci.", "Aïcha DIALLO")).toBe("Bonjour Aïcha, merci.");
    for (const template of [...REPLY_TEMPLATES.map((item) => item.body), ...ACK_TEMPLATES.map((item) => item.body)]) {
      expect(findForbiddenTerms(template), template).toEqual([]);
      expect(template).not.toMatch(/\d[\d\s]{2,}\s?(?:XAF|FCFA|€|EUR)/i);
    }
  });

  it("lien WhatsApp : chiffres seulement, numéro plausible", () => {
    expect(whatsappLink("+237 698 104 832", "Bonjour & merci")).toBe("https://wa.me/237698104832?text=Bonjour%20%26%20merci");
    expect(whatsappLink("00237698104832", "x")).toContain("wa.me/237698104832");
    expect(whatsappLink("12", "x")).toBeNull();
    expect(whatsappLink(null, "x")).toBeNull();
  });

  it("la confirmation à distance exige le nom du compte (accents, casse et ordre ignorés)", () => {
    expect(typedNameMatches("aicha diallo", "Aïcha DIALLO")).toBe(true);
    expect(typedNameMatches("DIALLO Aïcha", "Aïcha DIALLO")).toBe(true);
    expect(typedNameMatches("Aïcha", "Aïcha DIALLO")).toBe(false);
    expect(typedNameMatches("", "Aïcha DIALLO")).toBe(false);
  });

  it("la note de passation signale l'absence de preuve de paiement et ne contient aucune donnée de pièce", () => {
    const summary = buildHandoverSummary({
      generatedOn: new Date("2026-11-02T10:00:00Z"),
      candidate: { fullName: "Aïcha DIALLO", email: "aicha@example.test", phone: "+237600000000", destination: "Canada", visaType: "Travail", dossierStatus: "nouveau" },
      payment: { ok: false, source: null },
      requests: [{ label: "Évaluation", destination: "Canada", status: "processing", lastActivityAt: "2026-10-20T10:00:00Z", assignedTo: "Marie" }],
      lastMessages: [{ from: "candidat", at: "2026-11-01T10:00:00Z", text: "Bonjour, où en est mon dossier ?" }],
      pendingClarifications: 2,
      nextActions: [{ action: "Relancer pour le passeport", owner: "Marie", dueOn: "2026-11-05" }],
      upcomingSlots: [{ startsAt: "2026-11-04T09:00:00Z", channel: "video", topic: "Point dossier" }],
      pendingAcknowledgements: ["Accusé de réception de mes documents"],
    });
    expect(summary).toContain("PASSATION DE DOSSIER — Aïcha DIALLO");
    expect(summary).toContain("AUCUNE PREUVE enregistrée");
    expect(summary).toContain("pré-compte, pas encore activé");
    expect(summary).toContain("Relancer pour le passeport (Marie)");
    expect(summary).toContain("2 demande(s) de précision");
    expect(summary).toContain("Visioconférence");
    expect(summary).not.toMatch(/passeport n°|IBAN|mot de passe/i);
  });
});

describe("accompagnement à distance : serveur", () => {
  const router = read("server/routers/remoteSupport.ts");

  it("toute procédure d'administration vérifie la session ; les procédures candidat passent par candidateProcedure", () => {
    const adminNames = Array.from(router.matchAll(/\n  (admin[A-Za-z]+): publicProcedure/g), (match) => match[1]);
    expect(adminNames.length).toBe(16);
    expect((router.match(/await requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(adminNames.length);
    expect(Array.from(router.matchAll(/\n  ([A-Za-z]+): candidateProcedure/g), (match) => match[1])).toEqual(["myOverview", "bookSlot", "cancelBooking", "acceptAcknowledgement", "declineAcknowledgement", "reportProblem"]);
  });

  it("la réservation est atomique et le lien de visio n'est jamais envoyé pour un créneau libre ou à un autre candidat", () => {
    expect(router).toContain('and(eq(remoteSlots.id, slot.id), eq(remoteSlots.status, "open"))');
    const openSelect = router.slice(router.indexOf("const open = await db.select({"), router.indexOf("const acks = await"));
    expect(openSelect).not.toContain("joinUrl");
    expect(router).toContain('joinUrl: slot.status === "booked" ? slot.joinUrl : null');
    expect(router).toContain("eq(remoteSlots.candidateId, ctx.candidate.id)");
  });

  it("les liens de visio sont validés à la publication", () => {
    expect(router).toContain("normalizeJoinUrl(input.joinUrl");
  });

  it("une seule prochaine action ouverte par dossier : la précédente est annulée, jamais effacée", () => {
    expect(router).toContain('set({ status: "cancelled", doneAt: new Date() }).where(and(eq(caseNextActions.candidateId, candidate.id)');
    expect(router).not.toMatch(/db\.delete\(/);
  });

  it("la confirmation à distance conserve l'empreinte du texte, le nom saisi et la date ; elle ne se modifie plus", () => {
    expect(router).toContain('createHash("sha256")');
    expect(router).toContain('eq(remoteAcknowledgements.status, "pending")');
    expect(router).toContain("typedNameMatches(input.typedName, ctx.candidate.fullName)");
  });

  it("le bouton « j'ai un problème » est limité à 3 demandes par heure", () => {
    expect(router).toContain("MAX_PROBLEMS_PER_HOUR");
    expect(router).toContain("TOO_MANY_REQUESTS");
  });

  it("la migration 0091 ne crée que des tables, sans toucher à l'existant", () => {
    const sql = read("drizzle/0091_remote_support.sql");
    expect((sql.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length).toBe(3);
    expect(sql.replace(/ON UPDATE CURRENT_TIMESTAMP/g, "")).not.toMatch(/\b(?:DROP|ALTER|DELETE|UPDATE|TRUNCATE|INSERT)\b/i);
  });

  it("le routeur et les écrans sont branchés, aucun nom de procédure n'est réservé", () => {
    expect(read("server/routers.ts")).toContain("remoteSupport: remoteSupportRouter");
    expect(read("drizzle/schema.ts")).toContain('export * from "./remoteSupportSchema"');
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("<AdminRemoteSupport sessionToken={sessionToken} />");
    expect(read("client/src/pages/EvaluationSpace.tsx")).toContain("<ClientRemoteSupport enabled={isAuthenticated} />");
    const names = Array.from(router.matchAll(/\n  ([A-Za-z]+): (?:publicProcedure|candidateProcedure)/g), (match) => match[1]);
    for (const reserved of ["apply", "call", "bind", "then", "constructor"]) expect(names).not.toContain(reserved);
  });
});

const overview = (over: Record<string, unknown> = {}) => ({
  nextStep: null,
  myBookings: [],
  openSlots: [],
  acknowledgements: [],
  ...over,
});

describe("espace candidat : accompagnement à distance", () => {
  it("n'affiche rien tant que les données ne sont pas là (ou si la migration manque)", () => {
    state.overview = { data: undefined };
    const { container } = render(<ClientRemoteSupport />);
    expect(container.textContent).toBe("");
  });

  it("montre l'étape à faire, le lien de visio du rendez-vous réservé et permet de réserver un créneau", () => {
    const future = new Date(Date.now() + 48 * HOUR).toISOString();
    const later = new Date(Date.now() + 72 * HOUR).toISOString();
    state.overview = { data: overview({
      nextStep: { text: "Envoyez la photo de votre passeport", dueOn: null },
      myBookings: [{ id: 1, startsAt: future, durationMin: 30, channel: "video", topic: "Point dossier", status: "booked", joinUrl: "https://meet.google.com/abc-defg-hij", canCancel: true }],
      openSlots: [{ id: 7, startsAt: later, durationMin: 30, channel: "video", topic: null }],
    }) };
    render(<ClientRemoteSupport />);
    expect(screen.getByTestId("remote-next-step").textContent).toMatch(/photo de votre passeport/);
    expect(screen.getByText("Rejoindre le rendez-vous").closest("a")?.getAttribute("href")).toBe("https://meet.google.com/abc-defg-hij");
    fireEvent.click(screen.getByTestId("slot-book-7"));
    expect(state.book).toHaveBeenCalledWith({ slotId: 7, note: null });
  });

  it("« J'ai un problème » envoie le type de difficulté choisi", () => {
    state.overview = { data: overview() };
    render(<ClientRemoteSupport />);
    expect(screen.queryByTestId("remote-help-form")).toBeNull();
    fireEvent.click(screen.getByTestId("remote-help-open"));
    fireEvent.click(screen.getByLabelText(/Je ne comprends pas une étape/));
    fireEvent.click(screen.getByTestId("remote-help-send"));
    expect(state.report).toHaveBeenCalledWith({ topic: "step", details: null });
  });

  it("l'accusé de réception exige la case « j'ai lu » et le nom complet ; le refus exige un motif", () => {
    state.overview = { data: overview({ acknowledgements: [{ id: 3, title: "Accusé de réception de mes documents", body: "Je confirme avoir remis mes documents.", status: "pending", answeredAt: null }] }) };
    render(<ClientRemoteSupport />);
    const confirm = screen.getByTestId("ack-accept-3") as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/J'ai lu ce texte/));
    fireEvent.change(screen.getByLabelText(/Tapez votre nom complet/), { target: { value: "Aïcha Diallo" } });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);
    expect(state.accept).toHaveBeenCalledWith({ id: 3, typedName: "Aïcha Diallo", confirm: true });
  });
});

describe("administration : accompagnement à distance", () => {
  it("propose les six outils et publie des créneaux avec un lien contrôlé", () => {
    render(<AdminRemoteSupport sessionToken={"t".repeat(40)} />);
    for (const id of ["slots", "waiting", "actions", "workload", "handover", "acks"]) expect(screen.getByTestId(`remote-tab-${id}`)).toBeTruthy();
    expect(screen.getByTestId("slot-create")).toBeTruthy();
    fireEvent.click(screen.getByTestId("remote-tab-waiting"));
    expect(screen.getByTestId("remote-waiting").textContent).toMatch(/Aucun message en attente/);
  });
});
