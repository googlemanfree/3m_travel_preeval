// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  submit: vi.fn(),
  save: vi.fn(),
  setActive: vi.fn(),
  remove: vi.fn(),
  previewInputs: [] as Array<Record<string, unknown>>,
  overrides: [] as Array<Record<string, unknown>>,
}));

vi.mock("framer-motion", () => {
  const strip = ({ layout, initial, animate, exit, transition, whileHover, whileTap, ...rest }: Record<string, unknown>) => rest;
  const motion = new Proxy({}, { get: (_target, tag: string) => React.forwardRef((props: Record<string, unknown>, ref) => React.createElement(tag, { ...strip(props), ref })) });
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>, useReducedMotion: () => true };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock("react-easy-crop", () => ({ default: () => null }));
vi.mock("@/components/PremiumCoverImage", () => ({ PremiumCoverImage: () => null }));
vi.mock("@/lib/pageSeo", () => ({ setPageSeo: () => undefined }));
vi.mock("@/hooks/useCandidateAuth", () => ({ useCandidateAuth: () => ({ candidate: { fullName: "Awa Test", email: "awa@example.com", preferredDestinations: [] } }) }));
vi.mock("@/components/DestinationAutocomplete", () => ({
  DestinationAutocomplete: ({ id, value, onSelect }: { id?: string; value: string; onSelect: (country: string) => void }) => (
    <div><input id={id} readOnly value={value} aria-label="Destination choisie" /><button type="button" onClick={() => onSelect("Allemagne")}>Choisir Allemagne</button></div>
  ),
}));
vi.mock("@/components/CountryPicker", () => ({
  CountrySelect: ({ value, onChange }: { value: string; onChange: (country: string) => void }) => <div><span data-testid="editor-country">{value}</span><button type="button" onClick={() => onChange("Allemagne")}>Pays : Allemagne</button></div>,
}));

const preview = {
  program: { id: "etudes-professionnelle", label: "Formation professionnelle ou apprentissage" },
  domain: null,
  countryCode: "DE",
  sections: [{ id: "program", title: "Formation professionnelle ou apprentissage", fields: [
    { key: "trainingKind", label: "Type de formation", baseLabel: "Type de formation", kind: "select", required: true, hidden: false, custom: false },
    { key: "trainingStart", label: "Rentrée ou date de début souhaitée", baseLabel: "Rentrée ou date de début souhaitée", kind: "text", required: false, hidden: true, custom: false },
    { key: "custom_q1", label: "Question ajoutée", baseLabel: "Question ajoutée", kind: "text", required: false, hidden: false, custom: true },
  ] }],
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ evaluationForms: { activeOverrides: { invalidate: vi.fn() } } }),
    evaluation: {
      submit: { useMutation: () => ({ mutate: state.submit, isPending: false, data: undefined, error: null }) },
      extractFromCV: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      inspectPdfPages: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
    evaluationForms: {
      activeOverrides: { useQuery: () => ({ data: state.overrides }) },
      adminPreview: { useQuery: (input: Record<string, unknown>) => { state.previewInputs.push(input); return { data: preview, error: null, isLoading: false, refetch: vi.fn() }; } },
      adminList: { useQuery: () => ({ data: [{ id: 11, fieldKey: "trainingStart", action: "hide", projectKind: "etudes", programId: "etudes-professionnelle", domainId: null, countryCode: null, payload: null, active: true }], error: null, isLoading: false, refetch: vi.fn() }) },
      adminSave: { useMutation: () => ({ mutate: state.save, isPending: false }) },
      adminSetActive: { useMutation: () => ({ mutate: state.setActive }) },
      adminDelete: { useMutation: () => ({ mutate: state.remove }) },
    },
  },
}));

import Evaluation from "@/pages/Evaluation";
import { AdminEvaluationFormEditor } from "@/components/AdminEvaluationFormEditor";

const radio = (name: RegExp) => screen.getByRole("radio", { name });

beforeEach(() => { state.submit.mockReset(); state.save.mockReset(); state.setActive.mockReset(); state.remove.mockReset(); state.previewInputs = []; state.overrides = []; });
afterEach(() => cleanup());

describe("éditeur des questions (administration)", () => {
  it("affiche les questions du contexte avec leur état et envoie la règle dans le contexte choisi", () => {
    render(<AdminEvaluationFormEditor sessionToken={"a".repeat(30)} />);
    fireEvent.change(screen.getByLabelText("Visa ou programme"), { target: { value: "etudes-professionnelle" } });
    fireEvent.click(screen.getByRole("button", { name: "Pays : Allemagne" }));
    expect(state.previewInputs[state.previewInputs.length - 1]).toMatchObject({ projectType: "etudes", programId: "etudes-professionnelle", country: "Allemagne" });
    expect(screen.getByTestId("editor-scope").textContent).toMatch(/Études · Formation professionnelle ou apprentissage · Allemagne/);
    const row = (key: string) => document.querySelector(`[data-field-row="${key}"]`) as HTMLElement;
    expect(row("trainingStart").textContent).toMatch(/masquée/);
    expect(row("trainingKind").textContent).toMatch(/obligatoire/);
    expect(row("custom_q1").textContent).toMatch(/ajoutée/);

    fireEvent.click(within(row("trainingKind")).getByRole("button", { name: "Masquer" }));
    expect(state.save).toHaveBeenLastCalledWith(expect.objectContaining({ fieldKey: "trainingKind", action: "hide", projectKind: "etudes", programId: "etudes-professionnelle", countryCode: "DE" }));
    fireEvent.click(within(row("trainingKind")).getByRole("button", { name: "Rendre facultative" }));
    expect(state.save).toHaveBeenLastCalledWith(expect.objectContaining({ fieldKey: "trainingKind", action: "optional" }));
  });

  it("renomme une question et réaffiche une question masquée par une règle du même contexte", () => {
    render(<AdminEvaluationFormEditor sessionToken={"a".repeat(30)} />);
    fireEvent.change(screen.getByLabelText("Visa ou programme"), { target: { value: "etudes-professionnelle" } });
    const row = (key: string) => document.querySelector(`[data-field-row="${key}"]`) as HTMLElement;
    fireEvent.click(within(row("trainingKind")).getByRole("button", { name: "Renommer" }));
    fireEvent.change(screen.getByLabelText("Nouveau libellé de Type de formation"), { target: { value: "Quelle formation ?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(state.save).toHaveBeenLastCalledWith(expect.objectContaining({ fieldKey: "trainingKind", action: "relabel", payload: { label: "Quelle formation ?" } }));
    fireEvent.click(within(row("trainingStart")).getByRole("button", { name: "Afficher" }));
    expect(state.remove).toHaveBeenCalledWith({ sessionToken: "a".repeat(30), id: 11 });
  });

  it("ajoute une question avec une liste de choix et une clé générée", () => {
    render(<AdminEvaluationFormEditor sessionToken={"a".repeat(30)} />);
    const form = screen.getByTestId("editor-add-form");
    const submit = within(form).getByRole("button", { name: "Ajouter la question" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(within(form).getByLabelText(/Libellé de la question/), { target: { value: "Avez-vous déjà travaillé en clinique ?" } });
    fireEvent.change(within(form).getByLabelText("Type de réponse"), { target: { value: "select" } });
    fireEvent.change(within(form).getByLabelText(/Choix proposés/), { target: { value: "Oui, en clinique privée\nNon" } });
    fireEvent.click(within(form).getByLabelText("Réponse obligatoire"));
    fireEvent.submit(form);
    const payload = state.save.mock.calls[0][0];
    expect(payload.fieldKey).toMatch(/^custom_avez_vous_deja_travaille_en_clinique_/);
    expect(payload).toMatchObject({ action: "add", projectKind: "etudes", payload: { label: "Avez-vous déjà travaillé en clinique ?", kind: "select", required: true, section: "program", options: [{ value: "oui_en_clinique_privee", label: "Oui, en clinique privée" }, { value: "non", label: "Non" }] } });
  });

  it("liste les règles enregistrées et permet de les désactiver ou de les supprimer", () => {
    render(<AdminEvaluationFormEditor sessionToken={"a".repeat(30)} />);
    const rules = screen.getByTestId("editor-rules");
    expect(rules.textContent).toMatch(/Masquer · trainingStart/);
    fireEvent.click(within(rules).getByRole("button", { name: "Désactiver" }));
    expect(state.setActive).toHaveBeenCalledWith({ sessionToken: "a".repeat(30), id: 11, active: false });
    fireEvent.click(within(rules).getByRole("button", { name: "Supprimer la règle" }));
    expect(state.remove).toHaveBeenCalledWith({ sessionToken: "a".repeat(30), id: 11 });
  });
});

describe("formulaire d'évaluation — règles de l'administration", () => {
  it("masque, renomme, rend obligatoire et ajoute des questions, puis envoie la réponse ajoutée", () => {
    state.overrides = [
      { id: 1, fieldKey: "trainingStart", action: "hide", projectKind: "etudes", programId: "etudes-professionnelle" },
      { id: 2, fieldKey: "trainingKind", action: "relabel", projectKind: "etudes", programId: "etudes-professionnelle", payload: { label: "Quelle formation souhaitez-vous suivre ?" } },
      { id: 3, fieldKey: "custom_clinique", action: "add", projectKind: "etudes", programId: "etudes-professionnelle", payload: { label: "Avez-vous déjà travaillé en clinique ?", kind: "select", options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }], required: true, section: "program" } },
    ];
    render(<Evaluation />);
    fireEvent.change(screen.getByLabelText(/Téléphone/), { target: { value: "+237600000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Choisir Allemagne" }));
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.click(radio(/Formation professionnelle ou apprentissage/));
    expect(screen.queryByLabelText(/Rentrée ou date de début/)).toBeNull();
    expect(screen.getByLabelText(/Quelle formation souhaitez-vous suivre/)).toBeTruthy();
    expect(screen.getByLabelText(/Avez-vous déjà travaillé en clinique/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer mon évaluation" }));
    expect(document.body.textContent).toMatch(/Avez-vous déjà travaillé en clinique/);
    expect(state.submit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Quelle formation souhaitez-vous suivre/), { target: { value: "apprentissage" } });
    fireEvent.change(screen.getByLabelText(/Métier ou formation visés/), { target: { value: "Soins infirmiers" } });
    fireEvent.change(screen.getByLabelText(/Contrat ou promesse de formation d’un employeur/), { target: { value: "aucune" } });
    fireEvent.change(screen.getByLabelText(/Avez-vous déjà travaillé en clinique/), { target: { value: "oui" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer mon évaluation" }));
    expect(state.submit).toHaveBeenCalledTimes(1);
    expect(state.submit.mock.calls[0][0].projectDetails).toMatchObject({ custom_clinique: "oui", trainingKind: "apprentissage" });
    expect(state.submit.mock.calls[0][0].projectDetails.trainingStart).toBeUndefined();
  });

  it("une règle d'un autre contexte n'a aucun effet", () => {
    state.overrides = [{ id: 1, fieldKey: "trainingStart", action: "hide", projectKind: "etudes", programId: "etudes-professionnelle", countryCode: "FR" }];
    render(<Evaluation />);
    fireEvent.click(screen.getByRole("button", { name: "Choisir Allemagne" }));
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.click(radio(/Formation professionnelle ou apprentissage/));
    expect(screen.getByLabelText(/Rentrée ou date de début/)).toBeTruthy();
  });
});
