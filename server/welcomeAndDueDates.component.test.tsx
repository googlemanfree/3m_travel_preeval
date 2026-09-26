// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import WelcomeJourneyCard from "@/components/WelcomeJourneyCard";
import DossierDocumentChecklist from "@/components/DossierDocumentChecklist";
import { buildWelcomeSteps, dueInfo } from "@/lib/documentChecklist";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const NOW = new Date(2026, 8, 26, 10, 0, 0);
const inDays = (days: number) => new Date(2026, 8, 26 + days, 15, 0, 0);

beforeEach(() => {
  try { window.localStorage.clear(); } catch { /* ignore */ }
});
afterEach(cleanup);

describe("échéance d'une pièce fixée par le conseiller", () => {
  it("en retard, aujourd'hui, bientôt (3 jours ou moins) ou simple date", () => {
    expect(dueInfo(inDays(-2), NOW)).toMatchObject({ tone: "overdue" });
    expect(dueInfo(inDays(-2), NOW)!.label).toContain("En retard de 2 j");
    expect(dueInfo(inDays(0), NOW)).toMatchObject({ tone: "soon" });
    expect(dueInfo(inDays(0), NOW)!.label).toContain("aujourd’hui");
    expect(dueInfo(inDays(3), NOW)).toMatchObject({ tone: "soon" });
    expect(dueInfo(inDays(3), NOW)!.label).toContain("Plus que 3 j");
    expect(dueInfo(inDays(10), NOW)).toMatchObject({ tone: "normal" });
    expect(dueInfo(inDays(10), NOW)!.label).toContain("À déposer avant le");
  });

  it("aucune échéance saisie ou date invalide : rien n'est affiché, rien n'est inventé", () => {
    expect(dueInfo(null, NOW)).toBeNull();
    expect(dueInfo(undefined, NOW)).toBeNull();
    expect(dueInfo("pas une date", NOW)).toBeNull();
  });

  it("la checklist colore l'échéance d'une demande du conseiller", () => {
    render(<DossierDocumentChecklist destination="Canada" projectType="etudes" documents={[]} customRequirements={[{ id: 1, documentType: "Lettre de parrainage", status: "pending", dueAt: new Date(Date.now() - 3 * 86_400_000) }]} />);
    const due = screen.getByTestId("checklist-due");
    expect(due.getAttribute("data-tone")).toBe("overdue");
    expect(due.textContent).toContain("En retard de");
  });
});

describe("parcours d'accueil en 3 étapes", () => {
  const base = { evaluationRequired: true, checklistMissing: 5, checklistTotal: 8, paymentConfirmed: false, agreementSigned: false, accountAgeDays: 2 };

  it("coche ce qui est réellement fait", () => {
    expect(buildWelcomeSteps(base).map((step) => step.done)).toEqual([false, false, false]);
    expect(buildWelcomeSteps({ ...base, evaluationRequired: false }).map((step) => step.done)).toEqual([true, false, false]);
    expect(buildWelcomeSteps({ ...base, evaluationRequired: false, checklistMissing: 0 }).map((step) => step.done)).toEqual([true, true, false]);
    expect(buildWelcomeSteps({ ...base, evaluationRequired: false, checklistMissing: 0, paymentConfirmed: true }).map((step) => step.done)).toEqual([true, true, false]);
    expect(buildWelcomeSteps({ ...base, evaluationRequired: false, checklistMissing: 0, paymentConfirmed: true, agreementSigned: true }).every((step) => step.done)).toBe(true);
    expect(buildWelcomeSteps({ ...base, checklistTotal: 0, checklistMissing: 0 })[1].done).toBe(false);
  });

  it("l'étape des pièces dit combien sont reçues", () => {
    expect(buildWelcomeSteps(base)[1].detail).toContain("3 sur 8 déjà reçues");
  });

  it("affiche la carte avec l'étape en cours mise en avant", () => {
    render(<WelcomeJourneyCard {...base} evaluationRequired={false} />);
    expect(screen.getByTestId("welcome-journey").textContent).toContain("1 sur 3");
    const steps = screen.getAllByTestId("welcome-step");
    expect(steps.map((step) => step.getAttribute("data-done"))).toEqual(["true", "false", "false"]);
    expect(steps[1].getAttribute("data-current")).toBe("true");
    expect(steps[2].textContent).toContain("Le reçu et le protocole d’accord vous arrivent ensemble");
  });

  it("disparaît : compte ancien, trois étapes faites, ou fermée (mémorisé sur l'appareil)", () => {
    const { unmount } = render(<WelcomeJourneyCard {...base} accountAgeDays={45} />);
    expect(screen.queryByTestId("welcome-journey")).toBeNull();
    unmount();
    const done = render(<WelcomeJourneyCard {...base} evaluationRequired={false} checklistMissing={0} paymentConfirmed agreementSigned />);
    expect(screen.queryByTestId("welcome-journey")).toBeNull();
    done.unmount();
    const shown = render(<WelcomeJourneyCard {...base} />);
    fireEvent.click(screen.getByTestId("welcome-dismiss"));
    expect(screen.queryByTestId("welcome-journey")).toBeNull();
    shown.unmount();
    render(<WelcomeJourneyCard {...base} />);
    expect(screen.queryByTestId("welcome-journey")).toBeNull();
  });

  it("branchée dans l'aperçu d'ensemble, avec le résumé de checklist partagé", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("<WelcomeJourneyCard");
    expect(space).toContain("checklist: checklistSummary");
    expect(space).toContain("checklistMissing={checklistSummary.missing + checklistSummary.replace}");
  });
});

describe("e-mail d'une pièce refusée", () => {
  it("propose de renvoyer la pièce en un geste, vers l'onglet Documents ; les autres décisions renvoient aussi vers Documents", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain('input.status === "rejected"');
    expect(admin).toContain("Renvoyer ce document");
    expect(admin).toContain("Envoyer une nouvelle version");
    expect(admin).toContain("https://3mtravelagency.com/mon-espace?section=documents");
    expect(admin).toContain("Accéder à mes documents");
  });
});
