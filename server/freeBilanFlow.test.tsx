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

/** Un résultat `{ __error: "message" }` simule un refus du serveur. */
const outcome = (path: string) => {
  const result = state.results[path] ?? { ok: true, message: "ok" };
  if (result && typeof result === "object" && "__error" in result) throw new Error(String(result.__error));
  return result;
};

vi.mock("@/lib/trpc", () => {
  const procedure = (path: string) => ({
    useQuery: () => state.queries[path] ?? { data: undefined, isLoading: false, isFetching: false, isError: false, error: null, refetch: async () => ({ data: state.queries[path]?.data }) },
    useMutation: (options?: { onSuccess?: (result: unknown, input: unknown) => void }) => ({
      isPending: false,
      mutate: (input: any) => { state.calls.push({ proc: path, input }); try { options?.onSuccess?.(outcome(path), input); } catch { /* refus simulé */ } },
      mutateAsync: async (input: any) => { state.calls.push({ proc: path, input }); const result = outcome(path); options?.onSuccess?.(result, input); return result; },
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

import { EvaluationDeliveryEditor, scoreFromBilanText } from "../client/src/components/EvaluationDeliveryEditor";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
// Un champ de saisie normalise toujours ses fins de ligne en \n (la fixture est en CRLF sur un poste Windows).
const model = readFileSync(resolve(process.cwd(), "server/fixtures/bilanModele.txt"), "utf8").replace(/\r\n/g, "\n");
const ownModel = model.replace("PRÉNOM NOM", "Aïcha Diallo").replace("[À CONFIRMER]", "{{montant}}");
const token = "t".repeat(40);

type Overrides = { application?: Record<string, unknown>; draft?: Record<string, unknown>; offline?: boolean };
const deliveryData = ({ application = {}, draft = {}, offline = false }: Overrides = {}) => ({
  application: {
    id: 5, dossierNumber: "3M-EVAL-0005", fullName: "Aïcha Diallo", email: "aicha@example.test", whatsappNumber: null, destination: "Luxembourg", visaType: "Travail", paymentAmount: null,
    scoringTotal: 0, evaluationScheduledAt: null, evaluationDeliveryStatus: "draft", evaluationReportViewedAt: null, evaluationApprovalStatus: "not_required", evaluationRequiresSecondApproval: false,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...application,
  },
  versions: [],
  offlineEvaluation: { validated: offline, validatedAt: null, validatedBy: null },
  draft: {
    destination: "luxembourg", modelLabel: null, criteria: null, projectKind: "travail", projectType: "worker", finalScore: 0, verdict: "", profileSummary: "", bilanHtml: "", bilanSource: "",
    strengths: [], weaknesses: [], recommendations: [], informationToVerify: [], nextAdminAction: "", message: "", language: "fr", subject: "Votre bilan d'évaluation 3M TRAVEL AGENCY",
    requiresSecondApproval: false, advisorValidated: false, advisorValidatedAt: null, advisorValidatedByAdminId: null, ...draft,
  },
});

beforeAll(() => {
  (window.HTMLElement.prototype as any).scrollIntoView = vi.fn();
  (window.HTMLElement.prototype as any).hasPointerCapture = vi.fn();
  (window as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); try { localStorage.clear(); } catch { /* ignoré */ } state.calls = []; state.results = {}; state.queries = {}; state.fetches = {}; });

const loaded = (overrides?: Overrides) => ({ data: deliveryData(overrides), isLoading: false, isFetching: false, isError: false, error: null, refetch: async () => ({ data: deliveryData(overrides) }) });
const callbacks = { done: vi.fn(), close: vi.fn() };
const open = (overrides?: Overrides) => {
  callbacks.done = vi.fn();
  callbacks.close = vi.fn();
  state.queries["unifiedRequests.getEvaluationDelivery"] = loaded(overrides);
  state.results["unifiedRequests.saveEvaluationDeliveryDraft"] = { reportHtml: "<p>Aperçu</p>", versionNumber: 1 };
  state.results["unifiedRequests.validateEvaluationDraft"] = { message: "Bilan validé", dossierNumber: "3M-0005" };
  state.results["unifiedRequests.sendEvaluationNow"] = { message: "Envoyé", dossierNumber: "3M-0005" };
  state.results["unifiedRequests.approveSensitiveEvaluation"] = { message: "Approuvé" };
  const view = render(<EvaluationDeliveryEditor sessionToken={token} sourceRecordId={5} sourceType="application" open onOpenChange={callbacks.close} onCompleted={callbacks.done} />);
  return view;
};
const typeBilan = (value: string) => fireEvent.change(screen.getByTestId("bilan-input"), { target: { value } });
const callsOf = (proc: string) => state.calls.filter((call) => call.proc === proc);
const order = (...procs: string[]) => procs.map((proc) => state.calls.findIndex((call) => call.proc === proc));
const SAVE = "unifiedRequests.saveEvaluationDeliveryDraft";
const VALIDATE = "unifiedRequests.validateEvaluationDraft";
const SEND = "unifiedRequests.sendEvaluationNow";

describe("saisie, validation et envoi du bilan côté administration", () => {
  it("l'écran se limite à un champ de saisie, un aperçu et trois boutons ; rien d'autre", () => {
    open();
    expect(screen.getByTestId("bilan-input")).toBeTruthy();
    expect(screen.getByTestId("bilan-live-preview-empty")).toBeTruthy();
    const buttons = screen.getAllByRole("button").map((button) => button.getAttribute("data-testid"));
    expect(buttons.filter(Boolean)).toEqual(["bilan-save-draft", "bilan-validate", "bilan-validate-send"]);
    expect(screen.getByTestId("bilan-blockers").textContent).toMatch(/Saisissez le bilan/);
    expect((screen.getByTestId("bilan-validate") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("bilan-validate-send") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("bilan-save-draft") as HTMLButtonElement).disabled).toBe(true);
  });

  it("l'aperçu se met à jour pendant la frappe et reprend le nom du candidat, le titre et le texte saisi", async () => {
    open();
    typeBilan("## Vos atouts\n- Expérience solide en comptabilité\n\nBonjour {{nom}}.");
    await waitFor(() => expect(screen.getByTestId("bilan-live-preview")).toBeTruthy());
    const first = screen.getByTestId("bilan-live-preview").getAttribute("srcdoc") ?? "";
    expect(first).toContain("Vos atouts");
    expect(first).toContain("Expérience solide en comptabilité");
    expect(first).toContain("Aïcha Diallo");
    expect(first).toContain("Évaluation professionnelle");
    expect(first).not.toContain("{{nom}}");
    typeBilan("## Vos atouts\n- Expérience solide en comptabilité\n- Anglais courant\n\nBonjour {{nom}}.");
    await waitFor(() => expect(screen.getByTestId("bilan-live-preview").getAttribute("srcdoc")).toContain("Anglais courant"));
    expect(screen.getByTestId("bilan-live-preview").getAttribute("sandbox")).toBe("");
    typeBilan("");
    await waitFor(() => expect(screen.getByTestId("bilan-live-preview-empty")).toBeTruthy());
  });

  it("le bilan d'un autre candidat est signalé avant tout envoi, puis le bilan corrigé n'a plus aucun blocage", async () => {
    open();
    typeBilan(model.replace("[À CONFIRMER]", "{{montant}}"));
    await waitFor(() => expect(screen.getByTestId("bilan-blockers").textContent).toMatch(/s'adresse à « PRÉNOM NOM »/));
    expect((screen.getByTestId("bilan-validate-send") as HTMLButtonElement).disabled).toBe(true);
    typeBilan(ownModel);
    await waitFor(() => expect(screen.getByTestId("bilan-ready")).toBeTruthy());
    expect(screen.queryByTestId("bilan-blockers")).toBeNull();
    expect((screen.getByTestId("bilan-validate-send") as HTMLButtonElement).disabled).toBe(false);
  });

  it("une promesse de résultat bloque la validation et l'envoi, et le dit", async () => {
    open();
    typeBilan("Bonjour Aïcha Diallo, votre visa est garanti et sera accordé sans aucun doute. Merci de votre confiance, nous restons à votre disposition.");
    await waitFor(() => expect(screen.getByTestId("bilan-blockers").textContent).toMatch(/promesse de résultat/));
    expect((screen.getByTestId("bilan-validate") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("bilan-validate-send") as HTMLButtonElement).disabled).toBe(true);
  });

  it("« Enregistrer » envoie le texte tel que saisi au serveur, sans valider ni envoyer", async () => {
    open();
    typeBilan(ownModel);
    fireEvent.click(screen.getByTestId("bilan-save-draft"));
    await waitFor(() => expect(callsOf(SAVE)).toHaveLength(1));
    const save = callsOf(SAVE)[0].input;
    expect(save).toMatchObject({ sessionToken: token, sourceRecordId: 5, bilanHtml: ownModel, bilanSource: ownModel, finalScore: 61, destination: "luxembourg", language: "fr" });
    expect(callsOf(VALIDATE)).toHaveLength(0);
    expect(callsOf(SEND)).toHaveLength(0);
    await waitFor(() => expect((screen.getByTestId("bilan-save-draft") as HTMLButtonElement).disabled).toBe(true));
    expect(screen.getByTestId("bilan-status").textContent).toMatch(/Enregistré/);
  });

  it("« Valider » enregistre d'abord le texte saisi, puis le valide", async () => {
    open();
    typeBilan(ownModel);
    fireEvent.click(screen.getByTestId("bilan-validate"));
    await waitFor(() => expect(callsOf(VALIDATE)).toHaveLength(1));
    expect(callsOf(VALIDATE)[0].input).toMatchObject({ sessionToken: token, sourceRecordId: 5 });
    const [saved, validated] = order(SAVE, VALIDATE);
    expect(saved).toBeGreaterThanOrEqual(0);
    expect(saved).toBeLessThan(validated);
    expect(callsOf(SEND)).toHaveLength(0);
  });

  it("« Envoyer » demande confirmation, puis enregistre, valide et envoie dans l'espace client et par e-mail, dans cet ordre", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    open();
    typeBilan(ownModel);
    fireEvent.click(screen.getByTestId("bilan-validate-send"));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm.mock.calls[0][0]).toContain("Aïcha Diallo");
    expect(state.calls).toHaveLength(0);
    await new Promise((done) => setTimeout(done, 0));

    fireEvent.click(screen.getByTestId("bilan-validate-send"));
    await waitFor(() => expect(callsOf(SEND)).toHaveLength(1));
    expect(callsOf(SEND)[0].input).toMatchObject({ sessionToken: token, sourceRecordId: 5, previewConfirmed: true, attachments: [] });
    const [saved, validated, sent] = order(SAVE, VALIDATE, SEND);
    expect(saved).toBeGreaterThanOrEqual(0);
    expect(saved).toBeLessThan(validated);
    expect(validated).toBeLessThan(sent);
    await waitFor(() => expect(callbacks.done).toHaveBeenCalledTimes(1));
    expect(callbacks.close).toHaveBeenCalledWith(false);
  });

  it("si la validation est refusée par le serveur, rien n'est envoyé et l'écran reste ouvert", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    open();
    state.results[VALIDATE] = { __error: "Relecture automatique : le bilan s'adresse à un autre candidat." };
    typeBilan(ownModel);
    fireEvent.click(screen.getByTestId("bilan-validate-send"));
    await waitFor(() => expect(callsOf(VALIDATE)).toHaveLength(1));
    await new Promise((done) => setTimeout(done, 30));
    expect(callsOf(SEND)).toHaveLength(0);
    expect(callbacks.done).not.toHaveBeenCalled();
    expect(callbacks.close).not.toHaveBeenCalled();
  });

  it("si l'enregistrement est refusé, ni validation ni envoi ne sont tentés", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    open();
    state.results[SAVE] = { __error: "Base de données indisponible." };
    typeBilan(ownModel);
    fireEvent.click(screen.getByTestId("bilan-validate-send"));
    await waitFor(() => expect(callsOf(SAVE)).toHaveLength(1));
    await new Promise((done) => setTimeout(done, 30));
    expect(callsOf(VALIDATE)).toHaveLength(0);
    expect(callsOf(SEND)).toHaveLength(0);
  });

  it("un bilan déjà enregistré et validé, non modifié, part sans nouvel enregistrement ; le texte exact est restitué", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    open({ draft: { bilanSource: ownModel, bilanHtml: "<p>html dérivé</p>", advisorValidated: true } });
    expect((screen.getByTestId("bilan-input") as HTMLTextAreaElement).value).toBe(ownModel);
    expect(screen.getByTestId("bilan-status").textContent).toMatch(/Validé/);
    expect((screen.getByTestId("bilan-validate") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId("bilan-validate-send"));
    await waitFor(() => expect(callsOf(SEND)).toHaveLength(1));
    expect(callsOf(SAVE)).toHaveLength(0);
    expect(callsOf(VALIDATE)).toHaveLength(0);
  });

  it("modifier un bilan validé le remet à valider : l'envoi enregistre et valide de nouveau", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    open({ draft: { bilanSource: ownModel, advisorValidated: true } });
    typeBilan(`${ownModel}\n\nPrécision ajoutée.`);
    expect(screen.getByTestId("bilan-status").textContent).toMatch(/Modifications non enregistrées/);
    expect((screen.getByTestId("bilan-validate") as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByTestId("bilan-validate-send"));
    await waitFor(() => expect(callsOf(SEND)).toHaveLength(1));
    expect(callsOf(SAVE)).toHaveLength(1);
    expect(callsOf(VALIDATE)).toHaveLength(1);
  });

  it("un bilan déjà envoyé ou validé hors ligne est en lecture seule, boutons inactifs", () => {
    open({ application: { evaluationDeliveryStatus: "sent" }, draft: { bilanSource: ownModel } });
    expect(screen.getByTestId("bilan-locked").textContent).toMatch(/déjà été envoyé/);
    expect((screen.getByTestId("bilan-input") as HTMLTextAreaElement).disabled).toBe(true);
    for (const id of ["bilan-save-draft", "bilan-validate", "bilan-validate-send"]) expect((screen.getByTestId(id) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    open({ offline: true, draft: { bilanSource: ownModel } });
    expect(screen.getByTestId("bilan-locked").textContent).toMatch(/validée hors ligne/);
    expect((screen.getByTestId("bilan-validate-send") as HTMLButtonElement).disabled).toBe(true);
  });

  it("un bilan sensible attend l'approbation d'un autre administrateur : l'envoi est refusé, l'approbation est proposée", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    open({ application: { evaluationApprovalStatus: "pending", evaluationRequiresSecondApproval: true }, draft: { requiresSecondApproval: true, bilanSource: ownModel, advisorValidated: true } });
    expect(screen.getByTestId("bilan-second-approval")).toBeTruthy();
    fireEvent.click(screen.getByTestId("bilan-validate-send"));
    expect(confirm).not.toHaveBeenCalled();
    expect(callsOf(SEND)).toHaveLength(0);
    fireEvent.click(screen.getByTestId("bilan-approve"));
    await waitFor(() => expect(callsOf("unifiedRequests.approveSensitiveEvaluation")).toHaveLength(1));
  });

  it("un rechargement du serveur n'écrase pas un bilan saisi depuis la dernière synchronisation", () => {
    const view = open({ draft: { bilanSource: "Texte du serveur" } });
    typeBilan("Texte que je viens de saisir");
    state.queries["unifiedRequests.getEvaluationDelivery"] = loaded({ draft: { bilanSource: "Texte du serveur" } });
    view.rerender(<EvaluationDeliveryEditor sessionToken={token} sourceRecordId={5} sourceType="application" open onOpenChange={() => {}} onCompleted={() => {}} />);
    expect((screen.getByTestId("bilan-input") as HTMLTextAreaElement).value).toBe("Texte que je viens de saisir");
  });

  it("un ancien bilan sans texte d'origine s'affiche à partir de son HTML ; une panne de chargement propose de réessayer", () => {
    open({ draft: { bilanSource: "", bilanHtml: "<p>Ancien bilan enregistré</p>" } });
    expect((screen.getByTestId("bilan-input") as HTMLTextAreaElement).value).toBe("<p>Ancien bilan enregistré</p>");
    cleanup();
    state.queries["unifiedRequests.getEvaluationDelivery"] = { data: undefined, isLoading: false, isFetching: false, isError: true, error: { message: "Panne du serveur" }, refetch: async () => ({}) };
    render(<EvaluationDeliveryEditor sessionToken={token} sourceRecordId={5} sourceType="application" open onOpenChange={() => {}} onCompleted={() => {}} />);
    expect(screen.getByText("Panne du serveur")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Réessayer/ })).toBeTruthy();
  });

  it("la note globale est lue dans le texte du bilan (61/100), jamais ailleurs", () => {
    expect(scoreFromBilanText(ownModel)).toBe(61);
    expect(scoreFromBilanText("Aucune note ici")).toBeNull();
    expect(scoreFromBilanText("Note : 140/100")).toBeNull();
    expect(scoreFromBilanText(`${"x".repeat(700)} 80/100`)).toBeNull();
  });

  it("ce que l'écran juge sans blocage est accepté par les contrôles du serveur (mêmes fonctions, même résultat)", async () => {
    const { inspectBilan, toBilanHtml } = await import("../shared/bilanContent");
    const { bilanVariablesFrom, resolveBilanVariables } = await import("../shared/bilanVariables");
    const { reviewBilan } = await import("../shared/bilanReview");
    const { proposedOpeningFee } = await import("../shared/openingFee");
    // Chemin du serveur : le texte est converti puis stocké, et la validation relit le HTML après remplacement des variables.
    const stored = toBilanHtml(ownModel);
    const resolved = resolveBilanVariables(stored, bilanVariablesFrom({ fullName: "Aïcha Diallo", dossierNumber: "3M-EVAL-0005", destination: "Luxembourg", visaType: "Travail", paymentAmount: null }));
    const inspection = inspectBilan(resolved);
    expect(inspection.empty).toBe(false);
    expect(inspection.forbiddenTerms).toEqual([]);
    expect(inspection.sensitiveData).toEqual([]);
    expect(inspection.placeholders).toEqual([]);
    expect(reviewBilan(resolved, { fullName: "Aïcha Diallo", destinations: ["Luxembourg"], expectedAmount: proposedOpeningFee("Travail") }).filter((issue) => issue.level === "error")).toEqual([]);
    // Et le bilan d'un autre candidat est refusé par le serveur comme par l'écran.
    const other = resolveBilanVariables(toBilanHtml(model.replace("[À CONFIRMER]", "{{montant}}")), bilanVariablesFrom({ fullName: "Aïcha Diallo", dossierNumber: "3M-EVAL-0005", destination: "Luxembourg", visaType: "Travail", paymentAmount: null }));
    expect(reviewBilan(other, { fullName: "Aïcha Diallo", destinations: ["Luxembourg"], expectedAmount: proposedOpeningFee("Travail") }).some((issue) => issue.level === "error")).toBe(true);
  });

  it("côté serveur, le texte saisi est conservé tel quel et renvoyé à la réouverture", () => {
    const router = read("server/routers/unifiedRequests.ts");
    expect(router).toContain("bilanSource: z.string().max(400_000).optional()");
    expect(router).toContain('bilanSource: typeof adminDraft.bilanSource === "string" ? adminDraft.bilanSource : ""');
    expect(router).toContain("bilanSource: pastedBilanHtml && typeof input.bilanSource === \"string\" ? input.bilanSource : undefined");
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
    state.queries["unifiedRequests.getEvaluationDelivery"] = loaded();
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
