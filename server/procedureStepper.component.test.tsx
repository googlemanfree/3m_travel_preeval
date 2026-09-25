// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

import ProcedureStepper from "@/components/ProcedureStepper";
import { UPCOMING_LIMIT, buildStepperView, lockedReason, type ProcedureStep } from "@/lib/procedureStepper";

afterEach(cleanup);

const source = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

/** 20 étapes : 13 internes puis 7 du pays ; les 5 premières terminées, la 6e en cours. */
const makeSteps = (doneCount = 5, total = 20): ProcedureStep[] =>
  Array.from({ length: total }, (_, index) => ({
    id: `step-${index}`,
    index,
    label: `Étape numéro ${index + 1}`,
    description: `Description de l’étape ${index + 1}`,
    sourceUrl: index === doneCount ? "https://exemple.gouv/officiel" : null,
    state: index < doneCount ? "completed" : index === doneCount ? "current" : "locked",
  }));

describe("calcul de la frise", () => {
  it("compte les étapes faites, repère l'étape en cours, les suivantes et les deux groupes", () => {
    const view = buildStepperView({ steps: makeSteps(), currentStepIndex: 5, internalCount: 13 });
    expect(view).toMatchObject({ total: 20, done: 5, percent: 25, position: 6, finished: false });
    expect(view.current?.index).toBe(5);
    expect(view.upcoming.map((step) => step.index)).toEqual([6, 7, 8]);
    expect(view.upcoming).toHaveLength(UPCOMING_LIMIT);
    expect(view.groups.map((group) => [group.id, group.steps.length, group.done])).toEqual([["internal", 13, 5], ["country", 7, 0]]);
  });

  it("ordonne les étapes, traite un état inconnu comme verrouillé et gère une liste vide", () => {
    const shuffled = [...makeSteps()].reverse();
    expect(buildStepperView({ steps: shuffled, currentStepIndex: 5, internalCount: 13 }).current?.index).toBe(5);
    const odd = buildStepperView({ steps: [{ id: "a", index: 0, label: "A", state: "bizarre" }], currentStepIndex: 0, internalCount: 13 });
    expect(odd.current).toBeNull();
    expect(odd.groups[0].steps[0].state).toBe("locked");
    expect(buildStepperView({ steps: [], currentStepIndex: 0, internalCount: 13 })).toMatchObject({ total: 0, percent: 0, position: 0, finished: false, groups: [] });
  });

  it("parcours terminé : 100 %, plus d'étape en cours, dernière position", () => {
    const view = buildStepperView({ steps: makeSteps(20), currentStepIndex: 20, internalCount: 13 });
    expect(view).toMatchObject({ finished: true, percent: 100, position: 20, done: 20 });
    expect(view.current).toBeNull();
    expect(view.upcoming).toEqual([]);
  });

  it("sans étapes du pays, un seul groupe ; le motif de blocage dépend de la position", () => {
    expect(buildStepperView({ steps: makeSteps(2, 5), currentStepIndex: 2, internalCount: 13 }).groups.map((group) => group.id)).toEqual(["internal"]);
    expect(lockedReason({ id: "x", index: 9, label: "X", state: "locked" }, 5)).toMatch(/précédente/);
    expect(lockedReason({ id: "x", index: 3, label: "X", state: "locked" }, 5)).toMatch(/prérequis/);
  });
});

const renderStepper = (over: Partial<React.ComponentProps<typeof ProcedureStepper>> = {}) => {
  const props = { title: "Canada — visa d’études", steps: makeSteps(), currentStepIndex: 5, internalCount: 13, officialSources: ["IRCC"], onValidate: vi.fn(), onUnlock: vi.fn(), onUndo: vi.fn(), ...over };
  render(<ProcedureStepper {...props} />);
  return props;
};

describe("frise d'avancement (vue administrateur)", () => {
  it("met l'étape en cours en avant, avec son action principale et sa source officielle", () => {
    const props = renderStepper();
    expect(screen.getByTestId("stepper-position").textContent).toContain("Étape 6 sur 20");
    expect(screen.getByTestId("stepper-position").textContent).toContain("25%");
    const current = screen.getByTestId("stepper-current");
    expect(within(current).getByText("6. Étape numéro 6")).toBeTruthy();
    expect(within(current).getByText("Description de l’étape 6")).toBeTruthy();
    expect(within(current).getByRole("link", { name: "Source officielle" }).getAttribute("href")).toBe("https://exemple.gouv/officiel");
    fireEvent.click(within(current).getByRole("button", { name: "Marquer l’étape comme faite" }));
    expect(props.onValidate).toHaveBeenCalledWith(expect.objectContaining({ index: 5 }));
  });

  it("n'annonce que les trois étapes suivantes, en une ligne chacune", () => {
    renderStepper();
    const upcoming = within(screen.getByTestId("stepper-upcoming")).getAllByRole("listitem");
    expect(upcoming.map((item) => item.textContent)).toEqual(["7. Étape numéro 7", "8. Étape numéro 8", "9. Étape numéro 9"]);
  });

  it("la liste complète est repliée par défaut et regroupe interne / pays avec leurs compteurs", () => {
    renderStepper();
    const all = screen.getByTestId("stepper-all") as HTMLDetailsElement;
    expect(all.open).toBe(false);
    expect(within(all).getByText(/Toutes les étapes \(5\/20 validées\)/)).toBeTruthy();
    expect(within(all).getByText("Traitement interne 3M · 5/13")).toBeTruthy();
    expect(within(all).getByText("Étapes officielles du pays · 0/7")).toBeTruthy();
    expect(within(all).getAllByTestId(/stepper-row-/)).toHaveLength(20);
  });

  it("annuler une validation et déverrouiller passent par les gestionnaires (fenêtre de confirmation côté écran)", () => {
    const props = renderStepper();
    fireEvent.click(screen.getByRole("button", { name: "Annuler la validation de l’étape 3" }));
    expect(props.onUndo).toHaveBeenCalledWith(expect.objectContaining({ index: 2 }));
    fireEvent.click(screen.getByRole("button", { name: "Déverrouiller l’étape 10 hors séquence" }));
    expect(props.onUnlock).toHaveBeenCalledWith(expect.objectContaining({ index: 9 }));
    expect(props.onValidate).not.toHaveBeenCalled();
    // l'étape en cours n'offre ni « annuler » ni « déverrouiller » dans la liste
    const currentRow = screen.getByTestId("stepper-row-5");
    expect(within(currentRow).queryByRole("button")).toBeNull();
  });

  it("occupé : l'action principale et les actions de liste sont désactivées", () => {
    renderStepper({ busy: true });
    expect((screen.getByRole("button", { name: "Validation…" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Annuler la validation de l’étape 1" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("parcours terminé : message clair, aucune action de validation", () => {
    renderStepper({ steps: makeSteps(20), currentStepIndex: 20 });
    expect(screen.getByTestId("stepper-finished").textContent).toMatch(/Toutes les étapes du parcours sont validées/);
    expect(screen.getByTestId("stepper-position").textContent).toContain("Parcours terminé");
    expect(screen.queryByRole("button", { name: "Marquer l’étape comme faite" })).toBeNull();
  });

  it("signale l'absence de source institutionnelle au lieu de la taire", () => {
    renderStepper({ officialSources: [] });
    expect(screen.getByText(/Source institutionnelle à vérifier/)).toBeTruthy();
    cleanup();
    renderStepper({ officialSources: ["IRCC", "Canada.ca"] });
    expect(screen.getByText("Sources institutionnelles : IRCC · Canada.ca")).toBeTruthy();
  });
});

describe("Pilotage du dossier : moins de blocs affichés d'emblée", () => {
  const workspace = source("client/src/components/Candidate360Workspace.tsx");

  it("la frise remplace la grille de cartes d'étapes, avec les mêmes actions serveur", () => {
    expect(workspace).toContain("<ProcedureStepper");
    expect(workspace).toContain("checklist-${step.index}");
    expect(workspace).toContain("setForceStepDialog({ stepIndex: step.index, checked: true, label: step.label })");
    expect(workspace).toContain("setForceStepDialog({ stepIndex: step.index, checked: false, label: step.label })");
    expect(workspace).not.toContain("Progression indisponible :");
    expect(workspace).not.toContain("INTERNAL_STEPS_COUNT");
  });

  it("le contrôle de cohérence et le journal d'activité sont repliés par défaut", () => {
    expect(workspace).toMatch(/<details className="mt-4 rounded-xl border border-slate-200 bg-white" data-testid="coherence-details">/);
    expect(workspace).toMatch(/<details className="mt-2 rounded-xl border border-slate-200 bg-white" data-testid="activity-details">/);
    expect(workspace).not.toMatch(/<details[^>]*\bopen\b[^>]*data-testid="(coherence|activity)-details"/);
    expect((workspace.match(/<details/g) ?? []).length).toBe((workspace.match(/<\/details>/g) ?? []).length);
  });
});
