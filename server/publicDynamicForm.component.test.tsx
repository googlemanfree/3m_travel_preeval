// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ submit: vi.fn(), upload: vi.fn() }));

vi.mock("framer-motion", () => {
  const strip = ({ layout, initial, animate, exit, transition, whileHover, whileTap, ...rest }: Record<string, unknown>) => rest;
  const motion = new Proxy({}, { get: (_target, tag: string) => React.forwardRef((props: Record<string, unknown>, ref) => React.createElement(tag, { ...strip(props), ref })) });
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>, useReducedMotion: () => true };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), message: vi.fn(), warning: vi.fn() } }));
vi.mock("wouter", () => ({ useLocation: () => ["/", vi.fn()] }));
vi.mock("@/hooks/useCandidateAuth", () => ({ useCandidateAuth: () => ({ isAuthenticated: false, candidate: null }) }));
vi.mock("@/components/CountryPicker", () => ({
  CountrySelect: ({ value, onChange }: { value: string; onChange: (country: string) => void }) => (
    <div><span data-testid="country-value">{value}</span>{["Allemagne", "Canada", "France"].map((country) => <button key={country} type="button" onClick={() => onChange(country)}>Pays : {country}</button>)}</div>
  ),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    evaluation: {
      submitEvaluation: { useMutation: () => ({ mutateAsync: state.submit, isPending: false }) },
      uploadSupportingDocument: { useMutation: () => ({ mutateAsync: state.upload }) },
      geminiOrientationPreview: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import { SimpleMultiProjectForm } from "@/components/SimpleMultiProjectForm";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").split("\r\n").join("\n");
const radio = (name: RegExp) => screen.getByRole("radio", { name });

beforeEach(() => { state.submit.mockReset(); state.upload.mockReset(); });
afterEach(() => cleanup());

describe("formulaire public de l’accueil — visa, domaine et pays recomposent les questions", () => {
  it("affiche le choix du visa ou programme après le pays, sans redemander le type de projet", () => {
    render(<SimpleMultiProjectForm />);
    expect(screen.queryByTestId("dynamic-project-choice")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Pays : Allemagne" }));
    expect(screen.getByTestId("dynamic-project-choice")).toBeTruthy();
    expect(screen.queryByRole("radio", { name: /Étudier ou se former/ })).toBeNull();
    expect(radio(/Permis de travail lié à un employeur/)).toBeTruthy();
    expect(radio(/Je ne sais pas encore/)).toBeTruthy();
  });

  it("le domaine apparaît pour un programme qui en dépend et disparaît pour un séjour", () => {
    render(<SimpleMultiProjectForm />);
    fireEvent.click(screen.getByRole("button", { name: "Pays : Allemagne" }));
    fireEvent.click(radio(/Stage, alternance ou formation en entreprise/));
    expect(screen.getByLabelText(/Dans quel domaine/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Dans quel domaine/), { target: { value: "sante" } });
    expect(screen.getByTestId("dynamic-summary").textContent).toMatch(/Santé et soins/);
  });

  it("branche le moteur partagé à la place des anciennes questions génériques", () => {
    const form = read("client/src/components/SimpleMultiProjectForm.tsx");
    expect(form).toContain("<DynamicProjectChoice");
    expect(form).toContain("<DynamicFormSections");
    expect(form).toContain("projectAnswers: visibleProgramAnswers()");
    expect(form).toContain("programId: programId || undefined");
    expect(form).not.toContain("<CountryAdaptiveQuestions");
    expect(form).toContain("section.id !== \"education\"");
  });

  it("le serveur nettoie les réponses du parcours avant de les enregistrer et de les confier à l’IA", () => {
    const router = read("server/routers/evaluation.ts");
    expect(router).toContain("const publicDetails = sanitizeProjectDetails({ country: input.destinationCountry, projectType: input.projectType, overrides: formOverrides }");
    expect(router).toContain("...publicDetails,\n          dynamicResponses: input.dynamicResponses,");
    expect(router).toContain("guidance: publicGuidance,");
    expect(router).toContain("projectAnswers: z.record(z.string().max(60), z.string().max(1000)).optional(),");
  });
});
