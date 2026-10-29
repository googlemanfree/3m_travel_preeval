// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  calls: [] as Array<{ proc: string; input: any }>,
  results: {} as Record<string, any>,
  queries: {} as Record<string, any>,
  fetches: {} as Record<string, any>,
}));

vi.mock("@/lib/trpc", () => {
  const procedure = (path: string) => ({
    useQuery: () => state.queries[path] ?? { data: undefined, isLoading: false, isFetching: false, isError: false, error: null, refetch: async () => ({ data: state.queries[path]?.data }) },
    useMutation: (options?: { onSuccess?: (result: unknown, input: unknown) => void }) => ({
      isPending: false,
      mutate: (input: any, local?: { onSuccess?: (result: unknown) => void }) => { state.calls.push({ proc: path, input }); const result = state.results[path] ?? { ok: true, message: "ok" }; options?.onSuccess?.(result, input); local?.onSuccess?.(result); },
      mutateAsync: async (input: any) => { state.calls.push({ proc: path, input }); const result = state.results[path] ?? { ok: true, message: "ok" }; options?.onSuccess?.(result, input); return result; },
    }),
  });
  const utilsFor = (router: string) => new Proxy({}, { get: (_t, name: string) => ({ invalidate: async () => undefined, fetch: async (input: unknown) => { state.calls.push({ proc: `${router}.${name}`, input }); return state.fetches[`${router}.${name}`] ?? null; } }) });
  return {
    trpc: new Proxy({}, {
      get: (_t, router: string) => router === "useUtils"
        ? () => new Proxy({}, { get: (_u, name: string) => utilsFor(name) })
        : new Proxy({}, { get: (_p, name: string) => procedure(`${router}.${name}`) }),
    }),
  };
});
vi.mock("@/components/PDFPreviewModal", () => ({ PDFPreviewModal: () => null }));

import { EvaluationDeliveryEditor } from "../client/src/components/EvaluationDeliveryEditor";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const model = readFileSync(resolve(process.cwd(), "server/fixtures/bilanModele.txt"), "utf8");
const token = "t".repeat(40);

const deliveryData = () => ({
  application: {
    id: 5, dossierNumber: "3M-EVAL-0005", fullName: "Aïcha Diallo", email: "aicha@example.test", whatsappNumber: null, destination: "Luxembourg", visaType: "Travail", paymentAmount: null,
    scoringTotal: 0, evaluationScheduledAt: null, evaluationDeliveryStatus: "draft", evaluationReportViewedAt: null, evaluationApprovalStatus: "not_required", evaluationRequiresSecondApproval: false,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  versions: [],
  offlineEvaluation: { validated: false, validatedAt: null, validatedBy: null },
  draft: {
    destination: "luxembourg", modelLabel: null, criteria: null, projectKind: "travail", projectType: "worker", finalScore: 0, verdict: "", profileSummary: "", bilanHtml: "",
    strengths: [], weaknesses: [], recommendations: [], informationToVerify: [], nextAdminAction: "", message: "", language: "fr", subject: "Votre bilan d'évaluation 3M TRAVEL AGENCY",
    requiresSecondApproval: false, advisorValidated: false, advisorValidatedAt: null, advisorValidatedByAdminId: null,
  },
});

beforeAll(() => {
  (window.HTMLElement.prototype as any).scrollIntoView = vi.fn();
  (window.HTMLElement.prototype as any).hasPointerCapture = vi.fn();
  (window as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(() => { cleanup(); state.calls = []; state.results = {}; state.queries = {}; state.fetches = {}; });

const open = () => {
  state.queries["unifiedRequests.getEvaluationDelivery"] = { data: deliveryData(), isLoading: false, isFetching: false, isError: false, error: null, refetch: async () => ({ data: deliveryData() }) };
  state.results["unifiedRequests.saveEvaluationDeliveryDraft"] = { reportHtml: "<p>Aperçu</p>", versionNumber: 1 };
  state.results["unifiedRequests.validateEvaluationDraft"] = { message: "Bilan validé", dossierNumber: "3M-0005" };
  state.results["unifiedRequests.sendEvaluationNow"] = { message: "Envoyé", dossierNumber: "3M-0005" };
  return render(<EvaluationDeliveryEditor sessionToken={token} sourceRecordId={5} sourceType="application" open onOpenChange={() => {}} onCompleted={() => {}} />);
};
const typeBilan = (text: string) => {
  fireEvent.click(screen.getByRole("tab", { name: /Code HTML/ }));
  fireEvent.change(screen.getByLabelText("Code source du bilan"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: /Appliquer/ }));
};
const callsOf = (proc: string) => state.calls.filter((call) => call.proc === proc);

describe("saisie, validation et envoi du bilan côté administration", () => {
  it("les trois boutons sont toujours visibles dans la zone de saisie et dans la barre du bas, et disent ce qui bloque", () => {
    open();
    expect(screen.getByTestId("bilan-actions")).toBeTruthy();
    expect(screen.getByTestId("bilan-save-draft")).toBeTruthy();
    expect(screen.getByTestId("bilan-validate")).toBeTruthy();
    expect(screen.getByTestId("bilan-validate-send")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Valider le bilan/ }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId("bilan-bottom-bar")).toBeTruthy();
    expect(screen.getByTestId("bilan-blockers").textContent).toMatch(/Collez ou saisissez le bilan/);
  });

  it("le bilan d'un autre candidat est signalé avant tout envoi, puis le bilan corrigé n'a plus que le contrôle d'aperçu à faire", async () => {
    open();
    typeBilan(model.replace("[À CONFIRMER]", "{{montant}}"));
    await waitFor(() => expect(screen.getByTestId("bilan-blockers").textContent).toMatch(/s'adresse à « PRÉNOM NOM »/));
    typeBilan(model.replace("PRÉNOM NOM", "Aïcha Diallo").replace("[À CONFIRMER]", "{{montant}}"));
    await waitFor(() => expect(screen.getByTestId("bilan-blockers").textContent).not.toMatch(/s'adresse à/));
    expect(screen.getByTestId("bilan-blockers").textContent).not.toMatch(/Zone à compléter/);
    expect(screen.getByTestId("bilan-blockers").textContent).toMatch(/aperçu/i);
  });

  it("« Valider le bilan » enregistre le texte saisi puis le valide", async () => {
    open();
    typeBilan(model.replace("PRÉNOM NOM", "Aïcha Diallo").replace("[À CONFIRMER]", "{{montant}}"));
    fireEvent.click(screen.getByTestId("bilan-validate"));
    await waitFor(() => expect(callsOf("unifiedRequests.validateEvaluationDraft").length).toBe(1));
    const save = callsOf("unifiedRequests.saveEvaluationDeliveryDraft")[0];
    expect(save.input.bilanHtml).toContain("VOS ATOUTS CLÉS");
    expect(save.input.bilanHtml).toContain("{{montant}}");
    expect(save.input.sourceRecordId).toBe(5);
    expect(callsOf("unifiedRequests.validateEvaluationDraft")[0].input).toMatchObject({ sessionToken: token, sourceRecordId: 5 });
    expect(state.calls.findIndex((call) => call.proc === "unifiedRequests.saveEvaluationDeliveryDraft")).toBeLessThan(state.calls.findIndex((call) => call.proc === "unifiedRequests.validateEvaluationDraft"));
  });

  it("« Valider et envoyer » refuse sans contrôle d'aperçu, puis valide et envoie dans l'espace client et par e-mail une fois l'aperçu contrôlé", async () => {
    open();
    typeBilan(model.replace("PRÉNOM NOM", "Aïcha Diallo").replace("[À CONFIRMER]", "{{montant}}"));
    fireEvent.click(screen.getByTestId("bilan-validate-send"));
    await waitFor(() => expect(screen.getByTestId("bilan-validate-send")).toBeTruthy());
    expect(callsOf("unifiedRequests.sendEvaluationNow")).toHaveLength(0);

    // L'enregistrement ouvre l'aperçu : la case de contrôle devient cochable.
    fireEvent.click(screen.getByTestId("bilan-validate"));
    await waitFor(() => expect(callsOf("unifiedRequests.validateEvaluationDraft").length).toBe(1));
    const checkbox = await screen.findByRole("checkbox", { name: /Confirmer le contrôle d’aperçu/ });
    await waitFor(() => expect(checkbox.getAttribute("data-disabled")).toBeNull());
    fireEvent.click(checkbox);
    await waitFor(() => expect(screen.queryByText(/Cochez « J’ai contrôlé/)).toBeNull());

    fireEvent.click(screen.getByTestId("bilan-validate-send"));
    await waitFor(() => expect(callsOf("unifiedRequests.sendEvaluationNow").length).toBe(1));
    expect(callsOf("unifiedRequests.sendEvaluationNow")[0].input).toMatchObject({ sessionToken: token, sourceRecordId: 5, previewConfirmed: true, attachments: [] });
  });

  it("la barre du bas n'est plus « fixed » : elle ne peut plus disparaître sous le contenu ou hors de l'écran", () => {
    const source = read("client/src/components/EvaluationDeliveryEditor.tsx");
    const bar = source.slice(source.indexOf('data-testid="bilan-bottom-bar"') - 260, source.indexOf('data-testid="bilan-bottom-bar"') + 40);
    expect(bar).not.toContain("fixed inset-x-0");
    expect(bar).toContain("shrink-0");
  });

  it("un rechargement du serveur n'écrase pas un bilan saisi depuis la dernière synchronisation", () => {
    const source = read("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(source).toContain("setBilanHtml((current) => (current === hydratedBilan.current ? serverBilan : current));");
  });
});

describe("accès au bilan saisi depuis la liste des évaluations", () => {
  it("chaque évaluation de la liste « automatique » porte le bouton « Saisir et envoyer mon bilan »", () => {
    const dashboard = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(dashboard).toContain("<AdminFreeBilanLauncher sessionToken={sessionToken} email={item.email} fullName={item.fullName} />");
    expect(dashboard).toMatch(/<AdminFreeBilanLauncher[^\n]*\n\s*\{validationStatusById/);
  });

  it("le bouton retrouve le compte du candidat par son adresse et ouvre l'éditeur ; sans compte, il l'explique", async () => {
    const { AdminFreeBilanLauncher } = await import("../client/src/components/AdminFreeBilanLauncher");
    state.fetches["adminOps.adminCandidateByEmail"] = { id: 77, fullName: "Aïcha Diallo" };
    state.queries["unifiedRequests.getEvaluationDelivery"] = { data: deliveryData(), isLoading: false, isFetching: false, isError: false, error: null, refetch: async () => ({ data: deliveryData() }) };
    state.results["unifiedRequests.initializeEvaluationDelivery"] = { application: { id: 5, dossierNumber: "3M-EVAL-0005", fullName: "Aïcha Diallo", email: "aicha@example.test" } };
    render(<AdminFreeBilanLauncher sessionToken={token} email="aicha@example.test" fullName="Aïcha Diallo" />);
    fireEvent.click(screen.getByTestId("open-free-bilan"));
    await waitFor(() => expect(callsOf("adminOps.adminCandidateByEmail")).toHaveLength(1));
    expect(callsOf("adminOps.adminCandidateByEmail")[0].input).toEqual({ sessionToken: token, email: "aicha@example.test" });
    await waitFor(() => expect(callsOf("unifiedRequests.initializeEvaluationDelivery")[0]?.input).toMatchObject({ candidateId: 77, sourceType: "candidate" }));
    cleanup();
    state.calls = [];
    state.fetches["adminOps.adminCandidateByEmail"] = null;
    render(<AdminFreeBilanLauncher sessionToken={token} email="inconnu@example.test" fullName="Inconnu" />);
    fireEvent.click(screen.getByTestId("open-free-bilan"));
    await waitFor(() => expect(callsOf("adminOps.adminCandidateByEmail")).toHaveLength(1));
    expect(callsOf("unifiedRequests.initializeEvaluationDelivery")).toHaveLength(0);
  });
});
