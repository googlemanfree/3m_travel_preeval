// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ offers: { data: [] as any[], isLoading: false, error: null as null | { message: string } }, save: vi.fn(), close: vi.fn() }));
vi.mock("@/lib/trpc", () => {
  const mutation = (fn: ReturnType<typeof vi.fn>) => ({ useMutation: () => ({ mutate: fn, isPending: false }) });
  return {
    trpc: {
      useUtils: () => ({ employerOffers: { myOffers: { invalidate: vi.fn() } } }),
      employerOffers: { myOffers: { useQuery: () => state.offers }, saveOffer: mutation(state.save), closeOffer: mutation(state.close) },
    },
  };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { EmployerJobOffers } from "@/components/EmployerJobOffers";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const token = "t".repeat(40);
const offer = (over: Record<string, unknown> = {}) => ({
  id: 4, reference: "OFF-2026-0004", title: "Soudeur", countryCode: "CA", city: "Ville exemple", contractType: "cdi", visaSponsorship: "employer_assists", contractMonths: null, salaryMin: null, salaryMax: null,
  salaryCurrency: null, salaryPeriod: null, salaryVisible: false, benefits: null, languages: [], diplomas: [], experienceMinYears: null, startDate: null, startFlexible: true, positionsCount: 1, applicationDeadline: null,
  hideEmployerName: false, description: "x".repeat(100), requirements: null, status: "draft", moderationNote: null, applicationsCount: 3, updatedAt: null, ...over,
});

afterEach(() => { cleanup(); state.offers = { data: [], isLoading: false, error: null }; state.save.mockReset(); state.close.mockReset(); });

describe("offres de l'employeur : écran", () => {
  it("n'affiche que le nombre de candidatures, jamais l'identité, et montre la remarque de l'agence sur une offre refusée", () => {
    state.offers = { data: [offer({ status: "rejected", moderationNote: "Retirez la mention du salaire minimum légal." })], isLoading: false, error: null };
    render(<EmployerJobOffers sessionToken={token} canManage />);
    const row = screen.getByTestId("employer-offer-4");
    expect(row.textContent).toMatch(/3 candidature\(s\)/);
    expect(row.textContent).not.toMatch(/@/);
    expect(screen.getByTestId("employer-offer-note-4").textContent).toMatch(/Remarque de l'agence/);
  });

  it("un lecteur ne peut ni déposer, ni modifier, ni clôturer", () => {
    state.offers = { data: [offer()], isLoading: false, error: null };
    render(<EmployerJobOffers sessionToken={token} canManage={false} />);
    expect(screen.queryByTestId("employer-offer-new")).toBeNull();
    expect(screen.queryByText("Modifier")).toBeNull();
    expect(screen.getByText(/rôle est « lecteur »/)).toBeTruthy();
  });

  it("envoie l'offre à la modération, ou la garde en brouillon", () => {
    render(<EmployerJobOffers sessionToken={token} canManage />);
    fireEvent.click(screen.getByTestId("employer-offer-new"));
    fireEvent.change(screen.getByLabelText(/Intitulé du poste/), { target: { value: "Soudeur industriel" } });
    fireEvent.change(screen.getByLabelText(/Description du poste/), { target: { value: "Atelier de fabrication métallique, travail en équipe, lecture de plans, consignes de sécurité et formation interne." } });
    fireEvent.click(screen.getByTestId("employer-offer-submit"));
    expect(state.save).toHaveBeenLastCalledWith(expect.objectContaining({ sessionToken: token, title: "Soudeur industriel", submit: true, salaryMin: null, salaryVisible: false }));
    fireEvent.click(screen.getByTestId("employer-offer-draft"));
    expect(state.save).toHaveBeenLastCalledWith(expect.objectContaining({ submit: false }));
  });

  it("clôture une offre en indiquant pourquoi", () => {
    state.offers = { data: [offer({ status: "published" })], isLoading: false, error: null };
    render(<EmployerJobOffers sessionToken={token} canManage />);
    fireEvent.click(screen.getByText("Clôturer (pourvue)"));
    expect(state.close).toHaveBeenCalledWith({ sessionToken: token, id: 4, reason: "filled" });
  });
});

describe("offres de l'employeur : serveur", () => {
  const router = read("server/routers/employerOffers.ts");

  it("toute action passe par une session employeur vérifiée, et déposer ou clôturer exige le rôle de gestionnaire", () => {
    expect((router.match(/getEmployerSession\(input\.sessionToken\)/g) ?? []).length).toBe(3);
    expect((router.match(/requireEmployerManager\(account\)/g) ?? []).length).toBe(2);
    expect(router).toContain('organization.organizationType !== "employer"');
  });

  it("n'agit jamais sur l'offre d'une autre organisation et ne publie jamais lui-même", () => {
    expect((router.match(/eq\(jobOffers\.organizationId, organization\.id\)/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(router).not.toContain('"published" as const');
    expect(router).not.toMatch(/status: "published"/);
    expect(router).toContain('current.status === "published" ? ("in_moderation" as const)');
  });

  it("refuse coordonnées et demandes d'argent à l'envoi, ne renvoie aucune identité de candidat et prévient l'agence", () => {
    expect(router).toContain("scanOfferText(");
    expect(router).toContain("flags.contact.length > 0");
    expect(router).toContain("flags.money.length > 0");
    expect(router).not.toMatch(/candidates|fullName|candidateId/);
    expect(router).toContain("Offre d'emploi à modérer");
  });

  it("est branché, et le portail n'affiche l'onglet Offres qu'aux employeurs", () => {
    expect(read("server/routers.ts")).toContain("employerOffers: employerOffersRouter");
    const portal = read("client/src/pages/EmployerPortal.tsx");
    expect(portal).toContain('id !== "offers" || !isAgencyPortal');
    expect(portal).toContain('workspaceTab === "offers" && !isAgencyPortal');
  });

  it("aucun nom de procédure n'est un mot réservé de tRPC", () => {
    const names = Array.from(router.matchAll(/\n  ([A-Za-z]+): publicProcedure/g), (match) => match[1]);
    expect(names).toEqual(["myOffers", "saveOffer", "closeOffer"]);
  });
});
