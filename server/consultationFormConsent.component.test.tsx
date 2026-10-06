// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ submitted: [] as any[], result: undefined as any }));

vi.mock("@/lib/trpc", () => ({
  trpc: { consultationRequest: { submit: { useMutation: () => ({ mutate: (input: any) => { state.submitted.push(input); }, isPending: false, data: state.result, error: null }) } } },
}));
vi.mock("framer-motion", () => ({ motion: new Proxy({}, { get: () => (props: any) => React.createElement("div", props, props.children) }), AnimatePresence: ({ children }: any) => children }));

import ConsultationRequestForm from "@/components/ConsultationRequestForm";

const pdf = () => new File(["%PDF-1.4 contenu"], "cv-aicha.pdf", { type: "application/pdf" });

beforeEach(() => {
  state.submitted = [];
  state.result = undefined;
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ fileUrl: "/manus-storage/applications/intake/cv/1-abc-cv-aicha.pdf", fileName: "cv-aicha.pdf" }) })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const fill = () => {
  fireEvent.change(screen.getByLabelText(/nom complet/i), { target: { value: "Aïcha Nkolo" } });
  fireEvent.change(screen.getByLabelText(/e-?mail/i), { target: { value: "aicha@example.com" } });
};
const attachCv = () => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [pdf()] } });
};

describe("formulaire de consultation : accord distinct pour la lecture du CV par l'IA", () => {
  it("pas de case tant qu'aucun CV n'est joint ; la case apparaît avec le CV et est DÉCOCHÉE par défaut", () => {
    render(<ConsultationRequestForm />);
    expect(screen.queryByTestId("cv-analysis-consent")).toBeNull();
    attachCv();
    const consent = screen.getByTestId("cv-analysis-consent");
    expect(consent.textContent).toContain("Sans cette case, seul un conseiller");
    expect((consent.querySelector("input") as HTMLInputElement).checked).toBe(false);
  });

  it("CV joint sans cocher : la demande part avec l'adresse du CV mais SANS accord d'analyse", async () => {
    render(<ConsultationRequestForm />);
    fill();
    attachCv();
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(state.submitted).toHaveLength(1));
    expect(state.submitted[0]).toMatchObject({ cvFileUrl: "/manus-storage/applications/intake/cv/1-abc-cv-aicha.pdf", cvAnalysisConsent: false });
  });

  it("case cochée : l'accord part avec la demande ; retirer le CV après coup ne laisse jamais un accord sans fichier", async () => {
    render(<ConsultationRequestForm />);
    fill();
    attachCv();
    fireEvent.click(screen.getByTestId("cv-analysis-consent").querySelector("input")!);
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(state.submitted).toHaveLength(1));
    expect(state.submitted[0].cvAnalysisConsent).toBe(true);

    cleanup();
    state.submitted = [];
    render(<ConsultationRequestForm />);
    fill();
    attachCv();
    fireEvent.click(screen.getByTestId("cv-analysis-consent").querySelector("input")!);
    fireEvent.click(screen.getByLabelText("Retirer le CV"));
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(state.submitted).toHaveLength(1));
    expect(state.submitted[0]).toMatchObject({ cvFileUrl: undefined, cvAnalysisConsent: false });
  });
});
