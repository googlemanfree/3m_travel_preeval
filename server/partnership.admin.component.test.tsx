// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  list: { data: [] as any[], isLoading: false, error: null as any },
  counts: { data: { toReview: 1, awaitingSignature: 2, toCountersign: 3 } },
  detail: { data: undefined as any, isLoading: false, error: null as any },
  mutations: {} as Record<string, ReturnType<typeof vi.fn>>,
  mutation: (name: string) => () => {
    const slot = (state as any).mutations;
    slot[name] ??= vi.fn();
    return { mutate: slot[name], isPending: false };
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ partnership: { adminGet: { invalidate: vi.fn() }, adminList: { invalidate: vi.fn() }, adminCounts: { invalidate: vi.fn() }, adminPdfUrl: { fetch: vi.fn() } }, partnershipSpace: { adminStatement: { invalidate: vi.fn() } } }),
    partnership: {
      adminList: { useQuery: () => state.list },
      adminCounts: { useQuery: () => state.counts },
      adminGet: { useQuery: () => state.detail },
      adminSetStatus: { useMutation: state.mutation("setStatus") },
      adminIssueProtocol: { useMutation: state.mutation("issue") },
      adminResendLink: { useMutation: state.mutation("resend") },
      adminCountersign: { useMutation: state.mutation("countersign") },
    },
    partnershipSpace: {
      adminStatement: { useQuery: () => ({ data: { available: false }, isLoading: false, error: null }) },
      adminMarkPayout: { useMutation: state.mutation("markPayout") },
      adminSendSpaceLink: { useMutation: state.mutation("sendSpaceLink") },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { AdminPartnership } from "../client/src/components/AdminPartnership";

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 1, reference: "PAR-2026-0001", kind: "travel_agency", status: "submitted", statusLabel: "Candidature reçue", partnerName: "Teranga Voyages",
  contactName: "Awa Ndiaye", email: "awa@teranga.test", phone: "+221770000000", country: "Sénégal", commissionRate: null, referralCode: null,
  createdAt: new Date("2026-11-07T09:00:00Z"), updatedAt: new Date("2026-11-07T09:00:00Z"), ...overrides,
});
const detail = (overrides: Record<string, unknown> = {}) => ({
  ...row(), companyName: "Teranga Voyages", representativeRole: "Gérante", legalRegistration: "SN-DKR-2019-B-1234", taxId: null, licenceNumber: null, website: null,
  yearsActive: 6, channels: "office,whatsapp", volumeBand: "6-20", message: "Nous orientons déjà des clients.", city: "Dakar", commissionRateBps: null, termMonths: null,
  attributionMonths: null, paymentDelayDays: null, territory: null, protocolIssuedAt: null, protocolIssuedBy: null, protocolFingerprint: null, hasProtocol: false, protocolText: null,
  partnerSignedAt: null, partnerSignatureName: null, partnerSignatureIp: null, countersignedAt: null, countersignedBy: null, rejectionReason: null,
  events: [{ id: 1, summary: "Candidature reçue (agence de voyage).", actor: "awa@teranga.test", createdAt: new Date("2026-11-07T09:00:00Z") }], ...overrides,
});

const open = (overrides: Record<string, unknown> = {}) => {
  state.list = { data: [row(overrides)], isLoading: false, error: null };
  state.detail = { data: detail(overrides), isLoading: false, error: null };
  render(<AdminPartnership sessionToken={"s".repeat(40)} />);
  fireEvent.click(screen.getByTestId("admin-partnership-row-1"));
};

beforeEach(() => { state.mutations = {}; state.list = { data: [], isLoading: false, error: null }; });
afterEach(() => cleanup());

describe("console admin du programme de partenariat", () => {
  it("affiche la file de travail et rappelle qu'aucune commission n'est due avant la contresignature", () => {
    state.list = { data: [row(), row({ id: 2, reference: "PAR-2026-0002", kind: "individual", partnerName: "Marc Tchoua" })], isLoading: false, error: null };
    render(<AdminPartnership sessionToken={"s".repeat(40)} />);
    const text = screen.getByTestId("admin-partnership").textContent ?? "";
    expect(text).toContain("À examiner : 1");
    expect(text).toContain("Attente de signature : 2");
    expect(text).toContain("À contresigner : 3");
    expect(text).toContain("Aucune commission n’est due avant la contresignature");
    expect(text).toContain("Teranga Voyages");
    expect(text).toContain("Particulier (apporteur d’affaires)");
  });

  it("signale que la migration n'est pas appliquée plutôt que d'afficher une erreur technique", () => {
    state.list = { data: [], isLoading: false, error: { message: "Le programme de partenariat n’est pas encore activé : la migration 0098 doit être appliquée." } };
    render(<AdminPartnership sessionToken={"s".repeat(40)} />);
    expect(screen.getByRole("alert").textContent).toContain("migration 0098");
  });

  it("propose d'émettre le protocole avec un taux pré-rempli, et bloque un taux hors bornes", () => {
    open();
    const rate = screen.getByTestId("admin-partnership-rate") as HTMLInputElement;
    expect(rate.value).toBe("15");
    const issue = screen.getByTestId("admin-partnership-issue") as HTMLButtonElement;
    expect(issue.disabled).toBe(false);
    fireEvent.change(rate, { target: { value: "90" } });
    expect(issue.disabled).toBe(true);
    expect(screen.getByRole("alert").textContent).toMatch(/taux de commission/i);
    fireEvent.change(rate, { target: { value: "12,5" } });
    expect(issue.disabled).toBe(false);
    fireEvent.click(issue);
    expect(state.mutations.issue).toHaveBeenCalledTimes(1);
    expect(state.mutations.issue.mock.calls[0][0]).toMatchObject({ id: 1, terms: { commissionRateBps: 1250, termMonths: 12, attributionMonths: 12, paymentDelayDays: 30, territory: "Sénégal" } });
  });

  it("ne propose la contresignature qu'une fois le protocole signé par le partenaire", () => {
    open();
    expect(screen.queryByTestId("admin-partnership-countersign")).toBeNull();
    cleanup();
    open({ status: "partner_signed", partnerSignatureName: "Awa Ndiaye", partnerSignedAt: new Date("2026-11-08T09:00:00Z"), commissionRateBps: 1500, termMonths: 12, attributionMonths: 12, paymentDelayDays: 30, territory: "Sénégal", protocolFingerprint: "a".repeat(64) });
    expect(screen.getByTestId("admin-partnership-countersign")).toBeTruthy();
    expect(screen.queryByTestId("admin-partnership-issue")).toBeNull();
  });

  it("exige un motif écrit pour refuser une candidature", () => {
    open();
    const refuse = screen.getByRole("button", { name: /Refuser la candidature/ }) as HTMLButtonElement;
    expect(refuse.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Motif/), { target: { value: "Immatriculation introuvable" } });
    expect(refuse.disabled).toBe(false);
    fireEvent.click(refuse);
    expect(state.mutations.setStatus.mock.calls[0][0]).toMatchObject({ id: 1, status: "rejected", note: "Immatriculation introuvable" });
  });

  it("un partenaire actif affiche son code de parrainage et peut être suspendu avec un motif", () => {
    open({ status: "active", referralCode: "ABC234", countersignedBy: "admin@3mtravelagency.com", countersignedAt: new Date("2026-11-09T09:00:00Z"), commissionRateBps: 1500, termMonths: 12, attributionMonths: 12, paymentDelayDays: 30, territory: "Sénégal" });
    expect(screen.getByTestId("admin-partnership-detail").textContent).toContain("ABC234");
    const suspend = screen.getByRole("button", { name: /Suspendre/ }) as HTMLButtonElement;
    expect(suspend.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Motif/), { target: { value: "Promesse de visa relevée" } });
    expect(suspend.disabled).toBe(false);
  });
});
