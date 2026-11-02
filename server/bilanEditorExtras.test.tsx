// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { hasStructure, htmlToStructuredText, insertAtSelection, locatePassage } from "../client/src/lib/bilanPaste";
import { bilanSkeleton } from "../shared/bilanSkeleton";
import { inspectBilan, toBilanHtml } from "../shared/bilanContent";
import { BILAN_VARIABLE_NAMES, bilanVariablesFrom, draftExtras, formatDeadline, resolveBilanVariables } from "../shared/bilanVariables";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ calls: [] as Array<{ proc: string; input: any }>, results: {} as Record<string, any>, queries: {} as Record<string, any> }));
vi.mock("@/lib/trpc", () => {
  const procedure = (path: string) => ({
    useQuery: () => state.queries[path] ?? { data: undefined, isLoading: false, isFetching: false, isError: false, error: null, refetch: async () => ({ data: undefined }) },
    useMutation: (options?: { onSuccess?: (result: unknown, input: unknown) => void }) => ({
      isPending: false,
      mutate: (input: any) => { state.calls.push({ proc: path, input }); options?.onSuccess?.(state.results[path] ?? { ok: true }, input); },
      mutateAsync: async (input: any) => { state.calls.push({ proc: path, input }); const result = state.results[path] ?? { ok: true, message: "ok" }; options?.onSuccess?.(result, input); return result; },
    }),
  });
  const utilsFor = () => new Proxy({}, { get: () => ({ invalidate: async () => undefined, fetch: async () => null }) });
  return { trpc: new Proxy({}, { get: (_t, router: string) => router === "useUtils" ? () => new Proxy({}, { get: utilsFor }) : new Proxy({}, { get: (_p, name: string) => procedure(`${router}.${name}`) }) }) };
});

import { EvaluationDeliveryEditor } from "../client/src/components/EvaluationDeliveryEditor";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const token = "t".repeat(40);
const SAVE = "unifiedRequests.saveEvaluationDeliveryDraft";
const VALIDATE = "unifiedRequests.validateEvaluationDraft";

const delivery = (draft: Record<string, unknown> = {}, application: Record<string, unknown> = {}) => ({
  data: {
    application: { id: 5, dossierNumber: "3M-EVAL-0005", fullName: "Aïcha Diallo", email: "aicha@example.test", destination: "Luxembourg", visaType: "Travail", paymentAmount: 65000, paymentStatus: "PENDING", evaluationDeliveryStatus: "draft", evaluationApprovalStatus: "not_required", ...application },
    versions: [],
    offlineEvaluation: { validated: false },
    draft: { destination: "luxembourg", projectKind: "travail", projectType: "worker", finalScore: 0, verdict: "", strengths: [], weaknesses: [], recommendations: [], bilanHtml: "", bilanSource: "", message: "", language: "fr", subject: "Votre bilan d'évaluation 3M TRAVEL AGENCY", requiresSecondApproval: false, advisorValidated: false, openingFeeXaf: null, openingDeadline: "", advisorName: "", ...draft },
  },
  isLoading: false, isFetching: false, isError: false, error: null, refetch: async () => ({}),
});
const open = (draft?: Record<string, unknown>, application?: Record<string, unknown>, onOpenChange = vi.fn()) => {
  state.queries["unifiedRequests.getEvaluationDelivery"] = delivery(draft, application);
  state.results[SAVE] = { reportHtml: "<p>x</p>" };
  state.results[VALIDATE] = { message: "validé", dossierNumber: "3M-1" };
  return { onOpenChange, ...render(<EvaluationDeliveryEditor sessionToken={token} sourceRecordId={5} sourceType="application" open onOpenChange={onOpenChange} onCompleted={() => {}} />) };
};
const type = (value: string) => fireEvent.change(screen.getByTestId("bilan-input"), { target: { value } });
const callsOf = (proc: string) => state.calls.filter((call) => call.proc === proc);

beforeAll(() => {
  (window.HTMLElement.prototype as any).scrollIntoView = vi.fn();
  (window.HTMLElement.prototype as any).hasPointerCapture = vi.fn();
  (window as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); try { localStorage.clear(); } catch { /* ignoré */ } state.calls = []; state.results = {}; state.queries = {}; });

describe("informations du dossier choisies par l'administrateur", () => {
  it("le montant, la date limite et le conseiller saisis remplacent {{montant}}, {{date_limite}} et {{conseiller}} dans l'aperçu et partent avec le brouillon", async () => {
    open();
    type("Bonjour {{nom}}. Frais : {{montant}} XAF avant le {{date_limite}}, avec {{conseiller}}.");
    fireEvent.change(screen.getByTestId("bilan-fee"), { target: { value: "85000" } });
    fireEvent.change(screen.getByTestId("bilan-deadline"), { target: { value: "2026-11-20" } });
    fireEvent.change(screen.getByTestId("bilan-advisor"), { target: { value: "Marie Ngo" } });
    await waitFor(() => expect(screen.getByTestId("bilan-live-preview").getAttribute("srcdoc")).toContain("85 000 XAF"));
    const preview = screen.getByTestId("bilan-live-preview").getAttribute("srcdoc") ?? "";
    expect(preview).toContain("20 novembre 2026");
    expect(preview).toContain("Marie Ngo");
    fireEvent.click(screen.getByTestId("bilan-save-draft"));
    await waitFor(() => expect(callsOf(SAVE)).toHaveLength(1));
    expect(callsOf(SAVE)[0].input).toMatchObject({ openingFeeXaf: 85000, openingDeadline: "2026-11-20", advisorName: "Marie Ngo" });
  });

  it("un montant trop petit est signalé et n'est jamais envoyé ; sans montant saisi, le champ propose celui du profil", async () => {
    open();
    type("Bonjour {{nom}}, voici votre analyse détaillée et complète.");
    expect((screen.getByTestId("bilan-fee") as HTMLInputElement).placeholder).toMatch(/^\d+$/);
    fireEvent.change(screen.getByTestId("bilan-fee"), { target: { value: "500" } });
    await waitFor(() => expect(screen.getByTestId("bilan-blockers").textContent).toMatch(/Frais d'ouverture/));
    expect((screen.getByTestId("bilan-validate") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByTestId("bilan-fee"), { target: { value: "" } });
    fireEvent.click(screen.getByTestId("bilan-save-draft"));
    await waitFor(() => expect(callsOf(SAVE)).toHaveLength(1));
    expect(callsOf(SAVE)[0].input.openingFeeXaf).toBeUndefined();
  });

  it("modifier seulement une information du dossier suffit à activer « Enregistrer » ; les valeurs enregistrées reviennent à la réouverture", () => {
    open({ bilanSource: "Un bilan déjà enregistré et assez long pour être valable.", openingFeeXaf: 120000, openingDeadline: "2026-12-01", advisorName: "Paul Eto" });
    expect((screen.getByTestId("bilan-fee") as HTMLInputElement).value).toBe("120000");
    expect((screen.getByTestId("bilan-deadline") as HTMLInputElement).value).toBe("2026-12-01");
    expect((screen.getByTestId("bilan-advisor") as HTMLInputElement).value).toBe("Paul Eto");
    expect((screen.getByTestId("bilan-save-draft") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByTestId("bilan-advisor"), { target: { value: "Paul Eto-Mbarga" } });
    expect((screen.getByTestId("bilan-save-draft") as HTMLButtonElement).disabled).toBe(false);
  });

  it("le mot d'accompagnement n'est réécrit que s'il est modifié ; sinon le message déjà enregistré est conservé tel quel", async () => {
    open({ bilanSource: "Un bilan déjà enregistré et assez long pour être valable.", message: "<p>Bonjour, voici votre bilan.</p>" });
    expect((screen.getByTestId("bilan-note") as HTMLTextAreaElement).value).toBe("Bonjour, voici votre bilan.");
    fireEvent.change(screen.getByTestId("bilan-advisor"), { target: { value: "Paul" } });
    fireEvent.click(screen.getByTestId("bilan-save-draft"));
    await waitFor(() => expect(callsOf(SAVE)).toHaveLength(1));
    expect(callsOf(SAVE)[0].input.message).toBe("<p>Bonjour, voici votre bilan.</p>");
    cleanup();
    state.calls = [];
    open({ bilanSource: "Un bilan déjà enregistré et assez long pour être valable.", message: "<p>Bonjour, voici votre bilan.</p>" });
    fireEvent.change(screen.getByTestId("bilan-note"), { target: { value: "Un mot plus chaleureux." } });
    fireEvent.click(screen.getByTestId("bilan-save-draft"));
    await waitFor(() => expect(callsOf(SAVE)).toHaveLength(1));
    expect(callsOf(SAVE)[0].input.message).toBe("Un mot plus chaleureux.");
  });

  it("variables : date limite lisible, conseiller, valeurs absentes laissées visibles pour bloquer la validation", () => {
    expect(BILAN_VARIABLE_NAMES).toContain("date_limite");
    expect(formatDeadline("2026-11-20")).toBe("20 novembre 2026");
    expect(formatDeadline("2026-02-31")).toBeNull();
    expect(formatDeadline("n'importe quoi")).toBeNull();
    expect(draftExtras({ openingDeadline: "2026-11-20", advisorName: "Marie" })).toEqual({ openingDeadline: "2026-11-20", advisorName: "Marie" });
    expect(draftExtras(null)).toEqual({ openingDeadline: null, advisorName: null });
    const values = bilanVariablesFrom({ fullName: "Aïcha Diallo", paymentAmount: 90000, openingDeadline: "2026-11-20", advisorName: " Marie Ngo " });
    expect(resolveBilanVariables("{{montant}} / {{date_limite}} / {{conseiller}}", values)).toBe("90 000 / 20 novembre 2026 / Marie Ngo");
    expect(resolveBilanVariables("{{date_limite}}", bilanVariablesFrom({ fullName: "A B" }))).toBe("{{date_limite}}");
  });

  it("côté serveur, le montant choisi devient le montant attendu au paiement, sauf si le paiement est déjà confirmé", () => {
    const router = read("server/routers/unifiedRequests.ts");
    expect(router).toContain("openingFeeXaf: z.number().int().min(1000).max(5_000_000).optional()");
    expect(router).toContain('const feeToApply = input.openingFeeXaf !== undefined && application.paymentStatus !== "SUCCESS" ? input.openingFeeXaf : undefined;');
    expect(router).toContain("...(feeToApply !== undefined ? { paymentAmount: feeToApply } : {})");
    expect(router).toContain("...draftExtras(previousDraft)");
    expect(read("server/evaluationService.ts")).toContain("...draftExtras(adminDraft)");
    expect(read("server/evaluationBilanPdfService.ts")).toContain("...draftExtras(draft)");
  });
});

describe("protection de la saisie", () => {
  it("fermer avec des modifications non enregistrées demande confirmation ; sans modification, la fermeture est immédiate", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const view = open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(confirm).not.toHaveBeenCalled();
    expect(view.onOpenChange).toHaveBeenCalledWith(false);
    view.onOpenChange.mockClear();
    type("Une saisie qui ne doit pas être perdue par accident.");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(view.onOpenChange).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(view.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("la saisie non enregistrée est gardée sur l'appareil et restaurée à la réouverture, avec un avis ; l'enregistrement efface la copie", async () => {
    open();
    type("Brouillon important non enregistré, rédigé pendant une coupure de réseau.");
    await waitFor(() => expect(localStorage.getItem("bilan-draft:5")).toContain("Brouillon important"));
    cleanup();
    open();
    await waitFor(() => expect((screen.getByTestId("bilan-input") as HTMLTextAreaElement).value).toContain("Brouillon important"));
    expect(screen.getByTestId("bilan-restored")).toBeTruthy();
    fireEvent.click(screen.getByTestId("bilan-save-draft"));
    await waitFor(() => expect(callsOf(SAVE)).toHaveLength(1));
    await waitFor(() => expect(localStorage.getItem("bilan-draft:5")).toBeNull());
  });
});

describe("saisie assistée", () => {
  it("coller depuis Word ou Google Docs garde titres, listes, gras et tableaux ; un collage en texte brut reste inchangé", () => {
    open();
    const field = screen.getByTestId("bilan-input") as HTMLTextAreaElement;
    const html = "<h2>Vos atouts</h2><ul><li>Anglais courant</li><li>Cinq ans d'expérience</li></ul><p>Bonjour <strong>Aïcha</strong>, voici votre analyse.</p><table><tr><th>Critère</th><th>Note</th></tr><tr><td>Langues</td><td>8 / 15</td></tr></table><script>alert(1)</script>";
    const paste = (data: Record<string, string>) => fireEvent.paste(field, { clipboardData: { getData: (type: string) => data[type] ?? "" } });
    paste({ "text/html": html, "text/plain": "ignoré" });
    expect(field.value).toContain("## Vos atouts");
    expect(field.value).toContain("- Anglais courant");
    expect(field.value).toContain("**Aïcha**");
    expect(field.value).toContain("| Critère | Note |");
    expect(field.value).toContain("| Langues | 8 / 15 |");
    expect(field.value).not.toContain("alert(1)");
    type("");
    paste({ "text/plain": "Simple texte" });
    expect(field.value).toBe("");
  });

  it("les utilitaires de collage : structure détectée, insertion à la sélection, passage retrouvé sans accents ni casse", () => {
    expect(hasStructure("<p>Bonjour</p>")).toBe(true);
    expect(hasStructure("Bonjour")).toBe(false);
    expect(htmlToStructuredText("<div><p>Un</p><ol><li>a</li><li>b</li></ol></div>")).toBe("Un\n\n1. a\n2. b");
    expect(htmlToStructuredText('<a href="https://exemple.test/x">lien</a> et <a href="javascript:alert(1)">piège</a>')).toBe("[lien](https://exemple.test/x) et piège");
    expect(insertAtSelection("Bonjour monde", 8, 13, "Aïcha")).toEqual({ value: "Bonjour Aïcha", caret: 13 });
    expect(locatePassage("Votre visa est GARANTI cette fois", "garanti")).toEqual({ start: 15, end: 22 });
    expect(locatePassage("Rien ici", "garanti")).toBeNull();
    expect(locatePassage("texte", "  ")).toBeNull();
  });

  it("chaque blocage cliquable place le curseur sur le passage concerné dans le champ", async () => {
    open();
    type("Bonjour Aïcha Diallo, votre visa est garanti sans aucune réserve. Frais : [À CONFIRMER : montant].");
    await waitFor(() => expect(screen.getAllByTestId("bilan-blocker-locate").length).toBeGreaterThanOrEqual(2));
    const field = screen.getByTestId("bilan-input") as HTMLTextAreaElement;
    const target = screen.getAllByTestId("bilan-blocker-locate").find((button) => /promesse de résultat/.test(button.textContent ?? ""))!;
    fireEvent.click(target);
    const selected = field.value.slice(field.selectionStart, field.selectionEnd);
    expect(selected.toLowerCase()).toContain("garanti");
    expect(document.activeElement).toBe(field);
    const placeholder = screen.getAllByTestId("bilan-blocker-locate").find((button) => /Zone à compléter/.test(button.textContent ?? ""))!;
    fireEvent.click(placeholder);
    expect(field.value.slice(field.selectionStart, field.selectionEnd)).toMatch(/À CONFIRMER/);
  });

  it("le canevas de départ n'apparaît que si le champ est vide, pose la structure sans inventer de contenu et bloque la validation tant qu'il reste à compléter", async () => {
    open();
    fireEvent.change(screen.getByTestId("bilan-skeleton"), { target: { value: "etudes" } });
    const field = screen.getByTestId("bilan-input") as HTMLTextAreaElement;
    expect(field.value).toContain("projet d'études");
    expect(field.value).toContain("## Vos atouts");
    expect(screen.queryByTestId("bilan-skeleton")).toBeNull();
    await waitFor(() => expect(screen.getByTestId("bilan-blockers").textContent).toMatch(/Zone à compléter/));
    expect((screen.getByTestId("bilan-validate-send") as HTMLButtonElement).disabled).toBe(true);
    for (const kind of ["travail", "etudes", "tourisme", "autre"] as const) {
      const check = inspectBilan(toBilanHtml(bilanSkeleton(kind)));
      expect(check.forbiddenTerms, kind).toEqual([]);
      expect(check.sensitiveData, kind).toEqual([]);
      expect(check.placeholders.length, kind).toBeGreaterThan(0);
    }
    expect(bilanSkeleton("travail")).not.toMatch(/garanti|assuré|sans aucun doute|\d{2,3}\s?000/i);
  });
});

describe("pas de double envoi du bilan", () => {
  const SEND = "unifiedRequests.sendEvaluationNow";

  it("un bilan déjà envoyé montre « Bilan déjà envoyé » sur un bouton inactif ; rien ne peut être renvoyé depuis cet écran", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    open({ bilanSource: "Un bilan déjà envoyé au candidat, assez long." }, { evaluationDeliveryStatus: "sent" });
    const button = screen.getByTestId("bilan-validate-send") as HTMLButtonElement;
    expect(button.textContent).toBe("Bilan déjà envoyé");
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(confirm).not.toHaveBeenCalled();
    expect(callsOf(SEND)).toHaveLength(0);
  });

  it("un double clic n'envoie qu'une fois, et après l'envoi le bouton devient « Bilan déjà envoyé » sans attendre le rechargement", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    state.results[SEND] = { message: "Envoyé", dossierNumber: "3M-0005" };
    open();
    type("Bonjour Aïcha Diallo, voici votre analyse détaillée et complète du dossier.");
    const button = screen.getByTestId("bilan-validate-send");
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(callsOf(SEND)).toHaveLength(1));
    await waitFor(() => expect(screen.getByTestId("bilan-validate-send").textContent).toBe("Bilan déjà envoyé"));
    fireEvent.click(screen.getByTestId("bilan-validate-send"));
    await new Promise((done) => setTimeout(done, 20));
    expect(callsOf(SEND)).toHaveLength(1);
    expect(callsOf(VALIDATE)).toHaveLength(1);
  });

  it("côté serveur, deux envois simultanés du même bilan sont refusés pour le second ; l'envoi suivant, une fois le premier terminé, repart normalement", async () => {
    const { exclusiveEvaluationSend } = await import("../server/routers/unifiedRequests");
    let release: () => void = () => undefined;
    const first = exclusiveEvaluationSend(7, () => new Promise<string>((done) => { release = () => done("premier"); }));
    await expect(exclusiveEvaluationSend(7, async () => "second")).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(exclusiveEvaluationSend(8, async () => "autre dossier")).resolves.toBe("autre dossier");
    release();
    await expect(first).resolves.toBe("premier");
    await expect(exclusiveEvaluationSend(7, async () => "troisième")).resolves.toBe("troisième");
    await expect(exclusiveEvaluationSend(7, async () => { throw new Error("échec d'envoi"); })).rejects.toThrow("échec d'envoi");
    await expect(exclusiveEvaluationSend(7, async () => "après échec")).resolves.toBe("après échec");
    const source = read("server/routers/unifiedRequests.ts");
    expect(source).toContain(".mutation(({ input }) => exclusiveEvaluationSend(input.sourceRecordId, async () => {");
    expect(source).toContain("L’envoi de ce bilan est déjà en cours");
  });
});

describe("présentation, impression et renvoi", () => {
  it("l'aperçu propose imprimer / PDF ; sur téléphone, deux onglets permettent de passer de la saisie à l'aperçu", () => {
    open();
    expect(screen.queryByTestId("bilan-print-zone")).toBeNull();
    type("Bonjour Aïcha Diallo, voici votre analyse détaillée et complète.");
    expect(screen.getByTestId("bilan-print")).toBeTruthy();
    expect(screen.getByTestId("bilan-print").textContent).toMatch(/Imprimer/);
    expect(screen.getByTestId("bilan-print-zone")).toBeTruthy();
    const input = screen.getByTestId("bilan-input").closest("div.flex-col")!;
    expect(input.className).not.toContain("hidden");
    fireEvent.click(screen.getByTestId("bilan-tab-preview"));
    expect(input.className).toContain("hidden lg:flex");
    expect(screen.getByTestId("bilan-live-preview").parentElement!.className).not.toContain("hidden");
    fireEvent.click(screen.getByTestId("bilan-tab-input"));
    expect(input.className).not.toContain("hidden");
  });

  it("un bilan envoyé propose de renvoyer l'e-mail au candidat, après confirmation, à partir du dernier envoi réussi", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    state.queries["unifiedRequests.listEvaluationDeliveryHistory"] = { data: [{ id: 41, status: "failed" }, { id: 40, status: "sent" }], isLoading: false };
    state.results["unifiedRequests.resendEvaluationHistory"] = { message: "Renvoyé" };
    open({ bilanSource: "Un bilan déjà envoyé au candidat, assez long." }, { evaluationDeliveryStatus: "sent" });
    fireEvent.click(screen.getByTestId("bilan-resend"));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(callsOf("unifiedRequests.resendEvaluationHistory")).toHaveLength(0);
    fireEvent.click(screen.getByTestId("bilan-resend"));
    await waitFor(() => expect(callsOf("unifiedRequests.resendEvaluationHistory")).toHaveLength(1));
    expect(callsOf("unifiedRequests.resendEvaluationHistory")[0].input).toEqual({ sessionToken: token, emailId: 40 });
  });
});
