// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  space: { data: undefined as any, isLoading: false, isError: false, error: null as any },
  pdfFetch: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ partnershipSpace: { spaceProtocolPdfUrl: { fetch: state.pdfFetch } } }),
    partnershipSpace: { spaceGet: { useQuery: () => state.space } },
  },
}));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ t: (fr: string) => fr, language: "fr" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import PartnershipSpace from "../client/src/pages/PartnershipSpace";

const open = (token = "x".repeat(43)) => window.history.pushState({}, "", `/partenariat/espace${token ? `?token=${token}` : ""}`);
const month = (overrides: Record<string, unknown> = {}) => ({ period: "2026-11", paymentsCount: 2, baseXaf: 165_000, commissionXaf: 24_750, dueAt: "2099-12-30T23:59:59.000Z", paid: false, paidAt: null, paidAmountXaf: null, paidReference: null, deltaXaf: 0, ...overrides });
const space = (overrides: Record<string, unknown> = {}) => ({
  reference: "PAR-2026-0042", kind: "travel_agency", kindLabel: "Agence de voyage", partnerName: "Teranga Voyages", status: "active", statusLabel: "Partenaire actif",
  referralCode: "ABC234", referralLink: "https://www.3mtravelagency.com/?ref=ABC234",
  terms: { commissionRate: "15 %", termMonths: 12, attributionMonths: 12, paymentDelayDays: 30, territory: "Sénégal" },
  activeSince: "2026-11-10T09:00:00.000Z", termEndsAt: "2027-11-10T09:00:00.000Z", hasProtocolPdf: true,
  totals: { referrals: 5, paidReferrals: 3, earnedXaf: 39_750, paidOutXaf: 15_000, dueXaf: 24_750, overdueXaf: 0 },
  months: [month(), month({ period: "2026-10", paymentsCount: 1, commissionXaf: 15_000, baseXaf: 100_000, paid: true, paidAt: "2026-11-20T10:00:00.000Z", paidAmountXaf: 15_000, paidReference: "OM-1" })],
  lines: [{ reference: "3M-2026-0001", openedAt: "2026-11-12T10:00:00.000Z", paidAt: "2026-11-20T10:00:00.000Z", amountXaf: 100_000, commissionXaf: 15_000, eligible: true, statusLabel: "Commissionnable" }],
  ...overrides,
});

beforeEach(() => {
  state.space = { data: undefined, isLoading: false, isError: false, error: null };
  state.pdfFetch.mockReset();
  window.open = vi.fn() as never;
});
afterEach(() => cleanup());

describe("page /partenariat/espace", () => {
  it("refuse l'absence de lien", () => {
    open("");
    render(<PartnershipSpace />);
    expect(screen.getByTestId("partnership-space-invalid")).toBeTruthy();
  });

  it("affiche le message du serveur pour un lien expiré ou révoqué", () => {
    open();
    state.space = { data: undefined, isLoading: false, isError: true, error: { message: "Ce lien a expiré. Demandez-en un nouveau à 3M TRAVEL AGENCY." } };
    render(<PartnershipSpace />);
    expect(screen.getByTestId("partnership-space-invalid").textContent).toContain("a expiré");
  });

  it("montre le code, le lien, les conditions et les chiffres clés", () => {
    open();
    state.space = { data: space(), isLoading: false, isError: false, error: null };
    render(<PartnershipSpace />);
    expect(screen.getByTestId("partnership-space-code").textContent).toContain("ABC234");
    expect(screen.getByTestId("partnership-space-code").textContent).toContain("?ref=ABC234");
    const terms = screen.getByTestId("partnership-space-terms").textContent ?? "";
    expect(terms).toContain("15 %");
    expect(terms).toContain("Sénégal");
    const totals = screen.getByTestId("partnership-space-totals").textContent ?? "";
    expect(totals).toContain("Clients orientés");
    expect(totals.replace(/\s/g, "")).toContain("39750XAF");
    expect(screen.getByTestId("partnership-space-stat-payments").textContent).toContain("Paiements validés");
    expect(screen.getByTestId("partnership-space-stat-link").textContent).toContain("Actif");
    expect(screen.getByTestId("partnership-space-status").textContent).toBe("Partenaire actif");
  });

  it("distingue un mois versé (avec sa référence) d'un mois à verser", () => {
    open();
    state.space = { data: space(), isLoading: false, isError: false, error: null };
    render(<PartnershipSpace />);
    expect(screen.getByTestId("partnership-space-month-2026-10").textContent).toContain("Versé le");
    expect(screen.getByTestId("partnership-space-month-2026-10").textContent).toContain("OM-1");
    expect(screen.getByTestId("partnership-space-month-2026-11").textContent).toContain("À verser");
  });

  it("annonce un écart plutôt que de le cacher", () => {
    open();
    state.space = { data: space({ months: [month({ paid: true, paidAt: "2026-12-10T10:00:00.000Z", paidAmountXaf: 24_750, paidReference: "VIR-1", commissionXaf: 9_750, deltaXaf: 15_000 })] }), isLoading: false, isError: false, error: null };
    render(<PartnershipSpace />);
    expect(screen.getByTestId("partnership-space-month-2026-11").textContent).toContain("3M vous contactera");
  });

  it("explique le relevé vide sans afficher de tableau", () => {
    open();
    state.space = { data: space({ months: [], lines: [], totals: { referrals: 0, paidReferrals: 0, earnedXaf: 0, paidOutXaf: 0, dueXaf: 0, overdueXaf: 0 } }), isLoading: false, isError: false, error: null };
    render(<PartnershipSpace />);
    expect(screen.getByTestId("partnership-space-empty")).toBeTruthy();
  });

  it("signale une suspension sans cacher le relevé", () => {
    open();
    state.space = { data: space({ status: "suspended", statusLabel: "Suspendu" }), isLoading: false, isError: false, error: null };
    render(<PartnershipSpace />);
    expect(screen.getByTestId("partnership-space-suspended").textContent).toContain("plus aucune nouvelle commission");
    expect(screen.getByTestId("partnership-space-statement")).toBeTruthy();
  });

  it("n'affiche aucun nom ni coordonnée de client dans le détail par dossier", () => {
    open();
    state.space = { data: space(), isLoading: false, isError: false, error: null };
    const { container } = render(<PartnershipSpace />);
    const detail = container.querySelector("details")?.textContent ?? "";
    expect(detail).toContain("3M-2026-0001");
    expect(detail).not.toMatch(/@|\+\d{6,}/);
  });

  it("ouvre le protocole signé dans un nouvel onglet", async () => {
    open();
    state.pdfFetch.mockResolvedValue({ url: "https://files.test/signed.pdf" });
    state.space = { data: space(), isLoading: false, isError: false, error: null };
    render(<PartnershipSpace />);
    fireEvent.click(screen.getByTestId("partnership-space-protocol"));
    await waitFor(() => expect(window.open).toHaveBeenCalledWith("https://files.test/signed.pdf", "_blank", "noopener,noreferrer"));
  });

  it("ne propose pas de téléchargement quand aucun exemplaire n'existe", () => {
    open();
    state.space = { data: space({ hasProtocolPdf: false }), isLoading: false, isError: false, error: null };
    render(<PartnershipSpace />);
    expect(screen.queryByTestId("partnership-space-protocol")).toBeNull();
  });
});
