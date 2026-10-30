// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RESET_CONFIRMATION, availableUndos, validateUndoRequest, type ProfileFacts } from "../shared/profileUndo";

(globalThis as any).React = React;
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const state = vi.hoisted(() => ({ queries: {} as Record<string, any>, calls: [] as Array<{ proc: string; input: any }> }));
vi.mock("@/lib/trpc", () => {
  const procedure = (path: string) => ({
    useQuery: () => ({ error: null, isLoading: false, refetch: async () => undefined, ...(state.queries[path] ?? { data: undefined }) }),
    useMutation: () => ({ isPending: false, mutate: (input: unknown) => { state.calls.push({ proc: path, input }); } }),
  });
  return { trpc: new Proxy({}, { get: (_t, router: string) => router === "useUtils" ? () => new Proxy({}, { get: () => new Proxy({}, { get: () => ({ invalidate: async () => undefined }) }) }) : new Proxy({}, { get: (_p, name: string) => procedure(`${router}.${name}`) }) }) };
});
import { AdminProfileUndo } from "../client/src/components/AdminProfileUndo";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
afterEach(() => { cleanup(); state.queries = {}; state.calls = []; });
const facts = (over: Partial<ProfileFacts> = {}): ProfileFacts => ({ bilanSent: false, advisorValidated: false, hasClientDecision: false, openingRequested: false, activated: false, paid: false, evaluationDeclared: false, ...over });
const actions = (over?: Partial<ProfileFacts>) => availableUndos(facts(over)).map((option) => option.action);

describe("annuler une étape, réinitialiser un profil", () => {
  it("seules les annulations réellement possibles sont proposées, la réinitialisation étant toujours réservée au super administrateur", () => {
    expect(actions()).toEqual(["reset_profile"]);
    expect(actions({ advisorValidated: true })).toEqual(["undo_advisor_validation", "reset_profile"]);
    expect(actions({ advisorValidated: true, bilanSent: true })).toEqual(["reset_profile"]);
    expect(actions({ bilanSent: true, hasClientDecision: true })).toEqual(["undo_client_decision", "reset_profile"]);
    expect(actions({ bilanSent: true, openingRequested: true, activated: true })).toEqual(["undo_client_decision", "undo_activation", "reset_profile"]);
    expect(actions({ hasClientDecision: true, paid: true })).toEqual(["reset_profile"]);
    const reset = availableUndos(facts()).find((option) => option.action === "reset_profile")!;
    expect(reset.superAdminOnly).toBe(true);
    expect(availableUndos(facts({ activated: true, paid: false })).find((option) => option.action === "undo_activation")!.superAdminOnly).toBe(false);
    expect(availableUndos(facts({ activated: true, paid: true })).find((option) => option.action === "undo_activation")!.superAdminOnly).toBe(true);
  });

  it("un motif d'au moins huit caractères est obligatoire ; la réinitialisation exige de taper REINITIALISER", () => {
    expect(validateUndoRequest({ reason: "court", action: "undo_activation" })).toMatch(/motif/);
    expect(validateUndoRequest({ reason: "Erreur de saisie", action: "undo_activation" })).toBeNull();
    expect(validateUndoRequest({ reason: "Erreur de saisie", action: "reset_profile", confirmation: "oui" })).toMatch(RESET_CONFIRMATION);
    expect(validateUndoRequest({ reason: "Erreur de saisie", action: "reset_profile", confirmation: ` ${RESET_CONFIRMATION} ` })).toBeNull();
  });

  it("côté serveur : session administrateur, super administrateur pour la réinitialisation, motif, journal, et jamais de suppression de pièces, messages ou paiements", () => {
    const router = read("server/routers/profileUndo.ts");
    expect((router.match(/await requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(router).toContain("option.superAdminOnly ? await requireSuperAdminSession(input.sessionToken) : baseAdmin");
    // L'authentification précède toute lecture de la base et tout message propre au compte (pas de sondage par un appelant non connecté).
    const run = router.slice(router.indexOf("run: publicProcedure"));
    expect(run.indexOf("await requireValidAdminSession(input.sessionToken)")).toBeGreaterThan(-1);
    expect(run.indexOf("await requireValidAdminSession(input.sessionToken)")).toBeLessThan(run.indexOf("validateUndoRequest("));
    expect(run.indexOf("await requireValidAdminSession(input.sessionToken)")).toBeLessThan(run.indexOf("loadState(db"));
    expect(router).toContain("validateUndoRequest({ reason: input.reason, action, confirmation: input.confirmation })");
    expect(router).toContain("recordPrivacyEvent(db");
    expect(router).toContain("Cette annulation n'est plus possible");
    expect(router).not.toMatch(/delete\((candidateFiles|candidateMessages|paymentAuditLogs|evaluationEmails|evaluationBilanVersions)/);
    expect(router).toContain("deactivateCandidateDossier(db");
    expect(read("server/routers.ts")).toContain("profileUndo: profileUndoRouter");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("<AdminProfileUndo sessionToken={sessionToken}");
  });

  it("les boutons : un clic ouvre le formulaire, « Confirmer » reste inactif sans motif, et la réinitialisation exige la confirmation tapée", () => {
    state.queries["profileUndo.options"] = { data: { fullName: "Aïcha", facts: facts({ activated: true }), options: availableUndos(facts({ activated: true })) } };
    render(<AdminProfileUndo sessionToken={"t".repeat(40)} candidateId={7} />);
    expect(screen.queryByTestId("undo-pick-reset_profile")).toBeNull();
    fireEvent.click(screen.getByTestId("profile-undo-toggle"));
    expect(screen.getByTestId("undo-pick-undo_activation")).toBeTruthy();
    fireEvent.click(screen.getByTestId("undo-pick-undo_activation"));
    const confirm = () => screen.getByTestId("undo-confirm") as HTMLButtonElement;
    expect(confirm().disabled).toBe(true);
    fireEvent.change(screen.getByTestId("undo-reason"), { target: { value: "Activation faite par erreur" } });
    expect(confirm().disabled).toBe(false);
    fireEvent.click(confirm());
    expect(state.calls).toEqual([{ proc: "profileUndo.run", input: { sessionToken: "t".repeat(40), candidateId: 7, action: "undo_activation", reason: "Activation faite par erreur", confirmation: null } }]);
    fireEvent.click(screen.getByTestId("undo-pick-undo_activation"));
    fireEvent.click(screen.getByTestId("undo-pick-reset_profile"));
    fireEvent.change(screen.getByTestId("undo-reason"), { target: { value: "Recommencer le parcours" } });
    expect(confirm().disabled).toBe(true);
    fireEvent.change(screen.getByTestId("undo-confirmation"), { target: { value: RESET_CONFIRMATION } });
    expect(confirm().disabled).toBe(false);
  });
});
