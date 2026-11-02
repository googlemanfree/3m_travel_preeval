// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { findConsistencyIssues, FIXABLE_CODES, type ConsistencyApplication } from "../shared/dossierConsistency";

(globalThis as any).React = React;
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const state = vi.hoisted(() => ({ queries: {} as Record<string, any>, calls: [] as Array<{ proc: string; input: any }> }));
vi.mock("@/lib/trpc", () => {
  const procedure = (path: string) => ({
    useQuery: () => ({ error: null, isLoading: false, ...(state.queries[path] ?? { data: undefined }) }),
    useMutation: () => ({ isPending: false, mutate: (input: unknown) => { state.calls.push({ proc: path, input }); } }),
  });
  return { trpc: new Proxy({}, { get: (_t, router: string) => router === "useUtils" ? () => new Proxy({}, { get: () => new Proxy({}, { get: () => ({ invalidate: async () => undefined }) }) }) : new Proxy({}, { get: (_p, name: string) => procedure(`${router}.${name}`) }) }) };
});
import { AdminConsistency } from "../client/src/components/AdminConsistency";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
afterEach(() => { cleanup(); state.queries = {}; state.calls = []; });
const app = (id: number, over: Partial<ConsistencyApplication> = {}): ConsistencyApplication => ({ id, candidateId: id + 100, fullName: `Candidat ${id}`, dossierNumber: `3M-2026-${id}`, dossierStatus: "bilan_envoye", evaluationDeliveryStatus: null, activationRequestedAt: null, paymentStatus: "PENDING", candidateStatus: "nouveau", ...over });
const issue = (issues: ReturnType<typeof findConsistencyIssues>, code: string) => issues.find((item) => item.code === code)!;

describe("passage en revue des dossiers : règles", () => {
  it("repère chaque incohérence et ne signale pas les dossiers cohérents", () => {
    const issues = findConsistencyIssues({
      applications: [
        app(1, { evaluationDeliveryStatus: "sent", dossierStatus: "en_evaluation" }),
        app(2, { paymentStatus: "SUCCESS", candidateStatus: "evaluation", dossierStatus: "paye" }),
        app(3, { activationRequestedAt: "2026-11-01T00:00:00Z" }),
        app(4, { evaluationDeliveryStatus: "sent", dossierStatus: "bilan_envoye" }),
        app(5, { paymentStatus: "SUCCESS", candidateStatus: "documents", dossierStatus: "paye" }),
      ],
      agencyDossiers: [{ id: 7, fullName: "Agence A", status: "documents_requis", initialPaymentStatus: "pending" }, { id: 8, fullName: "Agence B", status: "nouveau", initialPaymentStatus: "pending" }, { id: 9, fullName: "Agence C", status: "soumis", initialPaymentStatus: "paid" }],
    });
    expect(issue(issues, "bilan_sent_status_mismatch").rows.map((row) => row.id)).toEqual([1]);
    expect(issue(issues, "paid_but_pre_dossier").rows.map((row) => row.id)).toEqual([2]);
    expect(issue(issues, "opening_without_bilan").rows.map((row) => row.id)).toEqual([3]);
    expect(issue(issues, "agency_advanced_unpaid").rows.map((row) => row.id)).toEqual([7]);
    expect(issue(issues, "unpaid_with_3m_number").count).toBe(3);
    expect(issues.map((item) => item.code)).toHaveLength(5);
  });

  it("aucune incohérence : toutes les catégories sont à zéro ; seule la correction sans risque est marquée corrigeable", () => {
    const issues = findConsistencyIssues({ applications: [app(1, { evaluationDeliveryStatus: "sent", paymentStatus: "SUCCESS", candidateStatus: "documents", dossierStatus: "paye" })], agencyDossiers: [] });
    expect(issues.every((item) => item.count === 0)).toBe(true);
    expect(issues.filter((item) => item.fixable).map((item) => item.code)).toEqual([...FIXABLE_CODES]);
    expect(FIXABLE_CODES).toEqual(["bilan_sent_status_mismatch"]);
  });

  it("le routeur authentifie d'abord, ne touche ni pièces ni paiements ni messages, et réserve le retrait des activations au super administrateur", () => {
    const router = read("server/routers/consistency.ts");
    expect(Array.from(router.matchAll(/\n  (scan|fix): publicProcedure/g), (match) => match[1])).toEqual(["scan", "fix"]);
    expect((router.match(/await requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(2);
    expect(router).toContain("await requireSuperAdminSession(input.sessionToken);\n      const report = await enforceActivationInvariant(db);");
    expect(router).not.toMatch(/delete\(|paymentAuditLogs|candidateFiles|candidateMessages/);
    expect(router).toContain('set({ dossierStatus: "bilan_envoye"');
    expect(read("server/routers.ts")).toContain("consistency: consistencyRouter");
    expect(read("client/src/components/AdminOps.tsx")).toContain('{section === "consistency" && <AdminConsistency sessionToken={sessionToken} />}');
  });
});

describe("écran « Incohérences »", () => {
  it("affiche le résumé et les catégories ; « Corriger » demande confirmation puis appelle le serveur ; « Retirer maintenant » aussi", () => {
    const issues = findConsistencyIssues({ applications: [app(1, { evaluationDeliveryStatus: "sent", dossierStatus: "en_evaluation" })], agencyDossiers: [] });
    state.queries["consistency.scan"] = { data: { checked: 12, issues, activationGuard: "Le retrait s'exécute aussi toutes les 30 minutes." } };
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    render(<AdminConsistency sessionToken={"t".repeat(40)} />);
    expect(screen.getByTestId("consistency-summary").textContent).toMatch(/12 dossier\(s\) contrôlé\(s\) — 1 incohérence/);
    expect(screen.getByTestId("consistency-bilan_sent_status_mismatch").textContent).toMatch(/Candidat 1/);
    fireEvent.click(screen.getByTestId("consistency-fix-bilan_sent_status_mismatch"));
    expect(state.calls).toHaveLength(0);
    fireEvent.click(screen.getByTestId("consistency-fix-bilan_sent_status_mismatch"));
    expect(state.calls).toEqual([{ proc: "consistency.fix", input: { sessionToken: "t".repeat(40), target: "bilan_sent_status_mismatch" } }]);
    fireEvent.click(screen.getByTestId("consistency-fix-activations"));
    expect(state.calls[1].input.target).toBe("activations_without_payment");
    expect(confirm).toHaveBeenCalledTimes(3);
    expect(screen.queryByTestId("consistency-fix-paid_but_pre_dossier")).toBeNull();
  });
});
