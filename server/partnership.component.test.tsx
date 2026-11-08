// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  submit: vi.fn(),
  sign: vi.fn(),
  preview: { data: undefined as any, isLoading: false, isError: false },
  signing: { data: undefined as any, isLoading: false, isError: false },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    partnership: {
      submit: { useMutation: () => ({ mutate: state.submit, isPending: false }) },
      sign: { useMutation: () => ({ mutate: state.sign, isPending: false }) },
      previewProtocol: { useQuery: () => state.preview },
      getForSigning: { useQuery: () => state.signing },
    },
  },
}));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ t: (fr: string) => fr, language: "fr" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Partnership from "../client/src/pages/Partnership";
import PartnershipSignature from "../client/src/pages/PartnershipSignature";

beforeEach(() => {
  state.submit.mockReset();
  state.sign.mockReset();
  state.preview = { data: undefined, isLoading: false, isError: false };
  state.signing = { data: undefined, isLoading: false, isError: false };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  window.scrollTo = vi.fn() as never;
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const type = (testId: string, value: string) => fireEvent.change(screen.getByTestId(testId), { target: { value } });
const check = (testId: string) => fireEvent.click(screen.getByTestId(testId));
const sendForm = () => fireEvent.click(screen.getByTestId("partnership-submit"));

describe("page publique /partenariat", () => {
  it("présente les deux profils et les garde-fous, sans chiffre de commission ni promesse de résultat", () => {
    render(<Partnership />);
    expect(screen.getByTestId("partnership-profile-travel_agency").textContent).toContain("Agence de voyage");
    expect(screen.getByTestId("partnership-profile-individual").textContent).toContain("Particulier");
    const page = screen.getByTestId("partnership-page").textContent ?? "";
    expect(page).toContain("Des conditions écrites avant de signer");
    expect(page).toContain("Pas de paiement, pas de commission");
    expect(page).toContain("Aucune promesse, aucun encaissement");
    expect(page).not.toMatch(/\b\d{1,2}\s?%/);
    expect(page).not.toMatch(/visa garanti|100 % de réussite/i);
  });

  it("propose les champs d'une agence par défaut, puis ceux d'un particulier", () => {
    render(<Partnership />);
    expect(screen.getByTestId("partnership-company")).toBeTruthy();
    expect(screen.getByTestId("partnership-registration")).toBeTruthy();
    expect(screen.queryByTestId("partnership-adult")).toBeNull();
    fireEvent.click(screen.getByTestId("partnership-kind-individual"));
    expect(screen.queryByTestId("partnership-company")).toBeNull();
    expect(screen.getByTestId("partnership-adult")).toBeTruthy();
  });

  it("n'envoie rien tant que les champs obligatoires, le consentement et la charte manquent", () => {
    render(<Partnership />);
    sendForm();
    expect(screen.getByTestId("partnership-error").textContent).toMatch(/champs obligatoires/);
    type("partnership-company", "Teranga Voyages");
    type("partnership-registration", "SN-DKR-2019-B-1234");
    type("partnership-name", "Awa Ndiaye");
    type("partnership-email", "awa@teranga.test");
    type("partnership-phone", "+221770000000");
    type("partnership-country", "Sénégal");
    sendForm();
    expect(screen.getByTestId("partnership-error").textContent).toMatch(/consentement et la charte/);
    expect(state.submit).not.toHaveBeenCalled();
  });

  it("refuse un particulier qui ne se déclare pas majeur", () => {
    render(<Partnership />);
    fireEvent.click(screen.getByTestId("partnership-kind-individual"));
    type("partnership-name", "Marc Tchoua");
    type("partnership-email", "marc@example.com");
    type("partnership-phone", "+237690000000");
    type("partnership-country", "Cameroun");
    check("partnership-consent");
    check("partnership-conduct");
    sendForm();
    expect(screen.getByTestId("partnership-error").textContent).toMatch(/majeures/);
    expect(state.submit).not.toHaveBeenCalled();
  });

  it("envoie la candidature d'une agence complète, avec le champ piège vide", () => {
    render(<Partnership />);
    type("partnership-company", "Teranga Voyages");
    type("partnership-registration", "SN-DKR-2019-B-1234");
    type("partnership-name", "Awa Ndiaye");
    type("partnership-email", "awa@teranga.test");
    type("partnership-phone", "+221770000000");
    type("partnership-country", "Sénégal");
    check("partnership-consent");
    check("partnership-conduct");
    sendForm();
    expect(state.submit).toHaveBeenCalledTimes(1);
    expect(state.submit.mock.calls[0][0]).toMatchObject({
      kind: "travel_agency", companyName: "Teranga Voyages", legalRegistration: "SN-DKR-2019-B-1234", contactName: "Awa Ndiaye",
      email: "awa@teranga.test", country: "Sénégal", consentPrivacy: true, codeOfConduct: true, hp: "",
    });
    expect(state.submit.mock.calls[0][0].isAdult).toBeUndefined();
  });

  it("envoie la candidature d'un particulier majeur sans aucune donnée d'agence", () => {
    render(<Partnership />);
    fireEvent.click(screen.getByTestId("partnership-kind-individual"));
    type("partnership-name", "Marc Tchoua");
    type("partnership-email", "marc@example.com");
    type("partnership-phone", "+237690000000");
    type("partnership-country", "Cameroun");
    check("partnership-adult");
    check("partnership-consent");
    check("partnership-conduct");
    sendForm();
    const payload = state.submit.mock.calls[0][0];
    expect(payload).toMatchObject({ kind: "individual", isAdult: true, contactName: "Marc Tchoua" });
    expect(payload.companyName).toBeUndefined();
    expect(payload.legalRegistration).toBeUndefined();
  });

  it("affiche le modèle de protocole du profil choisi, avec sa version", () => {
    state.preview = { data: { kind: "travel_agency", version: "2026-11-07-v1", text: "Entre les soussignés\n\n3M Group SARL …\n\nArticle 1 — Objet\n\nLe présent protocole fixe…" }, isLoading: false, isError: false };
    render(<Partnership />);
    fireEvent.click(screen.getByTestId("partnership-preview-travel_agency"));
    const box = screen.getByTestId("partnership-protocol-preview").textContent ?? "";
    expect(box).toContain("Article 1 — Objet");
    expect(box).toContain("2026-11-07-v1");
    expect(box).toContain("qui seul fait foi");
  });
});

describe("page de signature /partenariat/signature", () => {
  const open = (token: string) => window.history.pushState({}, "", `/partenariat/signature${token ? `?token=${token}` : ""}`);
  const view = (overrides: Record<string, unknown> = {}) => ({
    state: "ready",
    summary: { reference: "PAR-2026-0042", partnerName: "Teranga Voyages", representativeName: "Awa Ndiaye", commissionRate: "15 %", termMonths: 12, territory: "Sénégal" },
    protocolText: "Entre les soussignés\n\n3M Group SARL …\n\nArticle 1 — Objet\n\nLe présent protocole fixe…",
    ...overrides,
  });

  it("refuse l'absence de lien", () => {
    open("");
    render(<PartnershipSignature />);
    expect(screen.getByTestId("partnership-signature-invalid")).toBeTruthy();
  });

  it("annonce un lien expiré, sans formulaire", () => {
    open("x".repeat(43));
    state.signing = { data: view({ state: "expired", protocolText: null }), isLoading: false, isError: false };
    render(<PartnershipSignature />);
    expect(screen.getByTestId("partnership-signature-expired")).toBeTruthy();
    expect(screen.queryByTestId("partnership-sign-submit")).toBeNull();
  });

  it("montre le résumé et le texte, et n'autorise la signature qu'avec le nom et les trois déclarations", () => {
    open("x".repeat(43));
    state.signing = { data: view(), isLoading: false, isError: false };
    render(<PartnershipSignature />);
    expect(screen.getByTestId("partnership-summary").textContent).toContain("15 %");
    expect(screen.getByTestId("partnership-summary").textContent).toContain("12 mois");
    expect(screen.getByTestId("partnership-protocol-text").textContent).toContain("Article 1 — Objet");

    fireEvent.click(screen.getByTestId("partnership-sign-submit"));
    expect(screen.getByTestId("partnership-signature-error").textContent).toMatch(/nom complet/);
    type("partnership-signature-name", "Awa Ndiaye");
    fireEvent.click(screen.getByTestId("partnership-sign-submit"));
    expect(screen.getByTestId("partnership-signature-error").textContent).toMatch(/trois déclarations/);
    expect(state.sign).not.toHaveBeenCalled();

    for (const index of [0, 1, 2]) check(`partnership-declaration-${index}`);
    fireEvent.click(screen.getByTestId("partnership-sign-submit"));
    expect(state.sign).toHaveBeenCalledTimes(1);
    expect(state.sign.mock.calls[0][0]).toMatchObject({ token: "x".repeat(43), signatureName: "Awa Ndiaye", declarations: [true, true, true] });
  });

  it("indique qu'un protocole déjà signé ne se signe pas deux fois", () => {
    open("x".repeat(43));
    state.signing = { data: view({ state: "signed" }), isLoading: false, isError: false };
    render(<PartnershipSignature />);
    expect(screen.getByTestId("partnership-already-signed")).toBeTruthy();
    expect(screen.queryByTestId("partnership-sign-submit")).toBeNull();
  });
});
