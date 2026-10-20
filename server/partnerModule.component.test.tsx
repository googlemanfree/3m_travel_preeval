// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  invitation: { data: undefined as unknown, isLoading: false, isError: false },
  activate: vi.fn(),
  overview: { data: [] as unknown[], isLoading: false, error: null as null | { message: string }, refetch: vi.fn() },
  save: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ partnerModule: { adminPartnerInteractions: { invalidate: vi.fn() }, adminListInvitations: { invalidate: vi.fn() }, adminAuthorizationDocumentUrl: { fetch: vi.fn() } } }),
    partnerModule: {
      getInvitation: { useQuery: () => state.invitation },
      activateInvitation: { useMutation: () => ({ mutate: state.activate, isPending: false }) },
      adminPartnerOverview: { useQuery: () => state.overview },
      adminPartnerInteractions: { useQuery: () => ({ data: [] }) },
      adminListInvitations: { useQuery: () => ({ data: [] }) },
      adminPartnerSaveProfile: { useMutation: () => ({ mutate: state.save, isPending: false }) },
      adminPartnerAddInteraction: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminCreateInvitation: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      adminRevokeInvitation: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      uploadAuthorizationDocument: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
    placementPortal: { requestPartnerAccess: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
  },
}));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ t: (fr: string) => fr, language: "fr" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import PartnerInvitationActivation from "@/pages/PartnerInvitationActivation";
import PartnersHub from "@/pages/PartnersHub";
import { AdminPartnerModule } from "@/components/AdminPartnerModule";
import { B2bPartnerRegistrationForm } from "@/components/B2bPartnerRegistrationForm";

const TOKEN = "a".repeat(43);

beforeEach(() => {
  window.history.replaceState({}, "", `/partenaires/activation?token=${TOKEN}`);
  state.activate.mockReset();
  state.save.mockReset();
  state.invitation = { data: { state: "valid", organizationName: "Atlas Recrutement", fullName: "Awa Diallo", email: "awa@atlas.test", expiresAt: new Date().toISOString() }, isLoading: false, isError: false };
  state.overview = { data: [], isLoading: false, error: null, refetch: vi.fn() };
  window.localStorage.clear();
});
afterEach(() => cleanup());

describe("activation d'une invitation partenaire", () => {
  it("affiche le formulaire pour un lien valable et refuse un mot de passe trop faible ou différent", () => {
    render(<PartnerInvitationActivation />);
    expect(screen.getByText(/Atlas Recrutement vous invite/)).toBeTruthy();
    const form = screen.getByTestId("partner-activation").querySelector("form") as HTMLFormElement;
    fireEvent.change(screen.getByTestId("partner-activation-password"), { target: { value: "court1" } });
    fireEvent.submit(form);
    expect(screen.getByTestId("partner-activation-error").textContent).toMatch(/12 caractères/);
    expect(state.activate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByTestId("partner-activation-password"), { target: { value: "MotDePasse2026ok" } });
    fireEvent.submit(form);
    expect(screen.getByTestId("partner-activation-error").textContent).toMatch(/pas identiques/);
    expect(state.activate).not.toHaveBeenCalled();
  });

  it("envoie l'activation quand les deux mots de passe sont valides et identiques", () => {
    render(<PartnerInvitationActivation />);
    const form = screen.getByTestId("partner-activation").querySelector("form") as HTMLFormElement;
    const inputs = form.querySelectorAll("input[type=password]");
    fireEvent.change(inputs[0], { target: { value: "MotDePasse2026ok" } });
    fireEvent.change(inputs[1], { target: { value: "MotDePasse2026ok" } });
    fireEvent.submit(form);
    expect(state.activate).toHaveBeenCalledWith({ token: TOKEN, password: "MotDePasse2026ok", fullName: undefined });
  });

  it.each([["expired", /expiré/], ["used", /déjà été utilisée/], ["revoked", /annulée/], ["invalid", /pas valable/]])("explique un lien %s sans révéler d'information sur l'entreprise", (reason, message) => {
    state.invitation = { data: { state: reason }, isLoading: false, isError: false };
    render(<PartnerInvitationActivation />);
    const alert = screen.getByTestId("partner-activation-invalid");
    expect(alert.textContent).toMatch(message);
    expect(alert.textContent).not.toContain("Atlas");
  });
});

describe("page publique Entreprises & partenaires", () => {
  it("présente les trois catégories et les trois boutons demandés", () => {
    render(<PartnersHub />);
    const section = screen.getByTestId("companies-partners");
    expect(section.textContent).toContain("Employeur direct");
    expect(section.textContent).toContain("Recruteur / cabinet de recrutement");
    expect(section.textContent).toContain("Agence de placement");
    expect(screen.getByTestId("partners-cta-join").getAttribute("href")).toBe("/employeurs?tab=register");
    expect(screen.getByTestId("partners-cta-need").getAttribute("href")).toBe("/employeurs?tab=register&intent=need");
    expect(screen.getByTestId("partners-cta-login").getAttribute("href")).toBe("/employeurs?tab=login");
    expect(screen.getByTestId("partners-cta-join").textContent).toBe("Devenir partenaire");
    expect(screen.getByTestId("partners-cta-need").textContent).toBe("Transmettre un besoin de recrutement");
    expect(screen.getByTestId("partners-cta-login").textContent).toBe("Se connecter");
    expect(section.textContent).toMatch(/jamais d’une entreprise un « partenaire officiel »/);
  });
});

describe("inscription professionnelle", () => {
  it("demande le mandat ou l'entreprise bénéficiaire et le justificatif seulement aux intermédiaires", () => {
    const { rerender } = render(<B2bPartnerRegistrationForm defaultOrganizationType="employer" />);
    expect(screen.queryByTestId("b2b-mandate-fieldset")).toBeNull();
    cleanup();
    render(<B2bPartnerRegistrationForm defaultOrganizationType="placement_partner" lockOrganizationType />);
    expect(screen.getByTestId("b2b-mandate-fieldset")).toBeTruthy();
    expect(screen.getByTestId("b2b-authorization-file").getAttribute("accept")).toContain("application/pdf");
    expect(screen.getByTestId("b2b-mandate-confidential")).toBeTruthy();
    void rerender;
  });

  it("annonce l'intention « transmettre un besoin » venue de la page publique", () => {
    window.history.replaceState({}, "", "/employeurs?tab=register&intent=need");
    render(<B2bPartnerRegistrationForm defaultOrganizationType="employer" />);
    expect(screen.getByTestId("b2b-need-intent").textContent).toMatch(/transmettre un besoin/i);
  });
});

describe("suivi des partenaires (administration)", () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    organizationId: 7, legalName: "Atlas Recrutement", country: "Maroc", contactEmail: "contact@atlas.test", organizationType: "placement_partner", verificationStatus: "verified",
    category: "recruiter", relationshipStatus: "validated", hasProfile: true, primaryContactName: "Awa Diallo", primaryContactEmail: "awa@atlas.test", primaryContactPhone: null, primaryContactRole: "Directrice",
    specialties: "Santé", operatingCountries: "Canada", ownerAdminLabel: "admin@3m.test", nextFollowUpAt: null, publicDisplayConsent: false, mandateCompany: "Clinique Nord", mandateConfidential: true,
    internalNote: null, hasAuthorizationDocument: true, authorizationDocumentName: "licence.pdf", accountsCount: 2, pendingInvitations: 1, lastInteractionAt: null, createdAt: new Date().toISOString(), ...overrides,
  });

  it("liste les partenaires avec leur statut et filtre par statut", () => {
    state.overview.data = [row(), row({ organizationId: 8, legalName: "Nord Emploi", relationshipStatus: "prospect", category: "employer" })];
    render(<AdminPartnerModule sessionToken={"s".repeat(24)} />);
    expect(screen.getByText("Atlas Recrutement")).toBeTruthy();
    expect(screen.getByText("Nord Emploi")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Prospect · 1/ }));
    expect(screen.queryByText("Atlas Recrutement")).toBeNull();
    expect(screen.getByText("Nord Emploi")).toBeTruthy();
  });

  it("n'autorise l'affichage public que pour un partenaire actif ayant donné son autorisation écrite", () => {
    state.overview.data = [row({ relationshipStatus: "active" })];
    render(<AdminPartnerModule sessionToken={"s".repeat(24)} />);
    fireEvent.click(screen.getByRole("button", { name: /Atlas Recrutement/ }));
    expect(screen.getByTestId("partner-display-state").textContent).toMatch(/Aucun affichage public/);
    fireEvent.click(screen.getByTestId("partner-display-consent"));
    expect(screen.getByTestId("partner-display-state").textContent).toMatch(/Affichage public autorisé/);
  });

  it("enregistre la fiche avec l'identifiant de l'organisation", () => {
    state.overview.data = [row()];
    render(<AdminPartnerModule sessionToken={"s".repeat(24)} />);
    fireEvent.click(screen.getByRole("button", { name: /Atlas Recrutement/ }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer la fiche" }));
    expect(state.save).toHaveBeenCalledTimes(1);
    const payload = state.save.mock.calls[0][0];
    expect(payload.organizationId).toBe(7);
    expect(payload.relationshipStatus).toBe("validated");
    expect(payload.mandateConfidential).toBe(true);
  });

  it("explique clairement que le module n'est pas activé quand la migration manque", () => {
    state.overview.error = { message: "Le module partenaires n’est pas encore activé : la migration 0081 doit être appliquée." };
    render(<AdminPartnerModule sessionToken={"s".repeat(24)} />);
    expect(screen.getByRole("status").textContent).toContain("migration 0081");
  });
});
