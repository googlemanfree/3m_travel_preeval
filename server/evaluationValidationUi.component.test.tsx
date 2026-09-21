// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }),
  });
}
if (!(window as any).ResizeObserver) {
  (window as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}
if (!(Element.prototype as any).hasPointerCapture) {
  (Element.prototype as any).hasPointerCapture = () => false;
  (Element.prototype as any).setPointerCapture = () => {};
  (Element.prototype as any).releasePointerCapture = () => {};
}
if (!(Element.prototype as any).scrollIntoView) (Element.prototype as any).scrollIntoView = () => {};

type Handlers = { onSuccess?: (result: any) => unknown; onError?: (error: any) => unknown };

const { state, mutation } = vi.hoisted(() => {
  const state = {
    view: null as any,
    isLoading: false,
    error: null as any,
    refetch: vi.fn(async () => ({})),
    invalidate: vi.fn(),
    calls: {} as Record<string, any[]>,
    /** Résultat simulé d'une mutation : appelé avec les options (onSuccess/onError) de la mutation. */
    next: {} as Record<string, ((handlers: any, variables: any) => unknown) | undefined>,
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
  };
  const mutation = (name: string) => ({
    useMutation: (handlers: Handlers) => ({
      isPending: false,
      mutate: (variables: any) => {
        (state.calls[name] ??= []).push(variables);
        state.next[name]?.(handlers, variables);
      },
    }),
  });
  return { state, mutation };
});

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ evaluationValidation: { listStatuses: { invalidate: state.invalidate } } }),
    evaluationValidation: {
      getCase: { useQuery: () => ({ data: { view: state.view }, isLoading: state.isLoading, error: state.error, refetch: state.refetch }) },
      openCase: mutation("openCase"),
      generateAiDraft: mutation("generateAiDraft"),
      saveDraft: mutation("saveDraft"),
      requestInfo: mutation("requestInfo"),
      publish: mutation("publish"),
      resendEmail: mutation("resendEmail"),
      startReevaluation: mutation("startReevaluation"),
      respondToInfoRequest: mutation("respondToInfoRequest"),
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: state.toastSuccess, error: state.toastError } }));

import CandidateEvaluationStatus, { type CandidateEvaluationViewData } from "@/components/CandidateEvaluationStatus";
import EvaluationValidationPanel from "@/components/EvaluationValidationPanel";
import { ADMIN_DRAFT_BADGE, AI_DRAFT_LABEL, CANDIDATE_PENDING_NOTICE, LEGAL_DISCLAIMER, PUBLICATION_CHECKLIST, type AdminEvaluationVersion } from "@shared/evaluationValidation";
import { buildAdminView, buildCandidateView, publishEvaluation, recordAiDraft, requestInformation, saveAdminVersion, versionStamp, type ValidationDeps } from "./services/evaluationValidationCore";
import { CANDIDATE_CONTEXT, FakeMailer, InMemoryValidationStore, sampleAiDraft } from "./services/evaluationValidationTestkit";

const NOW = new Date("2026-09-21T09:00:00.000Z");
const ADMIN = { email: "admin.a@3m.test" };
const FULL_CHECKLIST = Object.fromEntries(PUBLICATION_CHECKLIST.map((item) => [item.key, true]));

function makeDeps(): ValidationDeps & { store: InMemoryValidationStore; mailer: FakeMailer } {
  const store = new InMemoryValidationStore([CANDIDATE_CONTEXT], () => NOW);
  return { store, mailer: new FakeMailer(store.timeline), now: () => NOW, portalUrl: "https://www.3mtravelagency.com/evaluation" };
}

async function draftView(mutate?: (deps: ReturnType<typeof makeDeps>) => Promise<void>) {
  const deps = makeDeps();
  await recordAiDraft(deps, 1, { ok: true, draft: sampleAiDraft(), model: "gemini-test" });
  if (mutate) await mutate(deps);
  return { deps, view: await buildAdminView(deps, 1) };
}

const panel = () => render(<EvaluationValidationPanel evaluationId={1} sessionToken="token-a" />);
const lastCall = (name: string) => state.calls[name]?.at(-1);

beforeEach(() => {
  state.view = null;
  state.isLoading = false;
  state.error = null;
  state.calls = {};
  state.next = {};
  state.refetch.mockClear();
  state.invalidate.mockClear();
  state.toastError.mockClear();
  state.toastSuccess.mockClear();
});
afterEach(cleanup);

// ── Côté candidat ────────────────────────────────────────────────────────────

describe("espace candidat : suivi de l'évaluation", () => {
  const reportView = async (): Promise<CandidateEvaluationViewData> => {
    const deps = makeDeps();
    await recordAiDraft(deps, 1, { ok: true, draft: sampleAiDraft({ gaps: { blocking: [], reinforceable: [{ label: "SECRET-IA-LACUNE" }], nonBlocking: [] }, extracted: { ...sampleAiDraft().extracted, budget: "SECRET-BUDGET-IA" } }), model: "gemini-test" });
    const current = (await deps.store.getLatestCase(1))!;
    await saveAdminVersion(deps, ADMIN, 1, { ...current.adminVersion!, totalOverride: 68, internalComment: "SECRET-INTERNE-42", improvements: ["Passer un test de langue officiel"] });
    const fresh = (await deps.store.getLatestCase(1))!;
    await publishEvaluation(deps, ADMIN, 1, { checklist: FULL_CHECKLIST, sendEmail: false, reviewedVersionStamp: versionStamp(fresh.adminVersion!) });
    return buildCandidateView({ latest: await deps.store.getLatestCase(1), latestPublished: await deps.store.getLatestPublishedCase(1) }) as CandidateEvaluationViewData;
  };

  it("n'affiche rien avant qu'une évaluation existe", () => {
    const { container } = render(<CandidateEvaluationStatus evaluationId={1} view={{ stage: "not_started", pendingNotice: null, infoRequest: null, report: null, publishedAt: null }} />);
    expect(container.innerHTML).toBe("");
  });

  it("affiche uniquement l'avis « dossier reçu » tant que rien n'est publié : ni score, ni rapport, ni brouillon", () => {
    const { container } = render(<CandidateEvaluationStatus evaluationId={1} view={{ stage: "pending", pendingNotice: { ...CANDIDATE_PENDING_NOTICE }, infoRequest: null, report: null, publishedAt: null }} />);
    expect(screen.getByRole("heading", { name: CANDIDATE_PENDING_NOTICE.title })).toBeTruthy();
    expect(screen.getByText(CANDIDATE_PENDING_NOTICE.body)).toBeTruthy();
    expect(screen.getByText("Analyse en cours")).toBeTruthy();
    expect(container.textContent).not.toMatch(/\/100|brouillon|Score validé/i);
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("affiche le rapport validé avec le score de l'administrateur, les statuts de documents et l'avertissement légal — sans rien d'interne", async () => {
    const view = await reportView();
    const { container } = render(<CandidateEvaluationStatus evaluationId={1} view={view} />);
    expect(screen.getByLabelText("Score validé : 68 sur 100")).toBeTruthy();
    expect(screen.getByText("Modérément favorable")).toBeTruthy(); // 68/100 : tranche 60–69
    expect(screen.getByText(/Reconnaissance professionnelle \/ équivalence/)).toBeTruthy();
    expect(screen.getByText("Six ans d’expérience vérifiable")).toBeTruthy();
    expect(screen.getByText("Passeport")).toBeTruthy();
    expect(screen.getByText("Reçu")).toBeTruthy();
    expect(screen.getByText("À fournir")).toBeTruthy();
    expect(screen.getByRole("note").textContent).toBe(LEGAL_DISCLAIMER);
    expect(screen.queryByText(CANDIDATE_PENDING_NOTICE.title)).toBeNull();
    for (const secret of ["SECRET-IA-LACUNE", "SECRET-BUDGET-IA", "SECRET-INTERNE-42", "admin.a@3m.test", "BROUILLON IA"]) expect(container.textContent, secret).not.toContain(secret);
  });

  it("permet de répondre à une demande de complément et n'envoie que les réponses renseignées", async () => {
    const onChanged = vi.fn();
    state.next.respondToInfoRequest = (handlers) => handlers.onSuccess?.({});
    const user = userEvent.setup();
    render(
      <CandidateEvaluationStatus
        evaluationId={7}
        onChanged={onChanged}
        view={{ stage: "info_requested", pendingNotice: { ...CANDIDATE_PENDING_NOTICE }, infoRequest: { message: "Merci de compléter votre dossier.", items: [{ id: "q1", label: "Relevé de notes" }, { id: "q2", label: "Attestation de travail" }] }, report: null, publishedAt: null }}
      />,
    );
    expect(screen.getByText("Merci de compléter votre dossier.")).toBeTruthy();
    const submit = screen.getByRole("button", { name: "Envoyer mes réponses" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    await user.type(screen.getByLabelText("Relevé de notes"), "  Envoyé hier  ");
    expect(submit.disabled).toBe(false);
    await user.click(submit);
    expect(lastCall("respondToInfoRequest")).toEqual({ evaluationId: 7, answers: [{ id: "q1", answer: "Envoyé hier" }], note: "" });
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(state.toastSuccess).toHaveBeenCalled();
  });

  it("accepte une simple précision sans réponse par élément, et signale une erreur d'envoi", async () => {
    state.next.respondToInfoRequest = (handlers) => handlers.onError?.({ message: "Aucune information complémentaire n’est attendue pour ce dossier." });
    const user = userEvent.setup();
    render(<CandidateEvaluationStatus evaluationId={7} view={{ stage: "info_requested", pendingNotice: null, infoRequest: { message: "", items: [{ id: "q1", label: "Diplôme" }] }, report: null, publishedAt: null }} />);
    await user.type(screen.getByLabelText(/Précisions/), "Je vous écris par la messagerie.");
    await user.click(screen.getByRole("button", { name: "Envoyer mes réponses" }));
    expect(lastCall("respondToInfoRequest")).toEqual({ evaluationId: 7, answers: [], note: "Je vous écris par la messagerie." });
    expect(state.toastError).toHaveBeenCalledWith("Aucune information complémentaire n’est attendue pour ce dossier.");
  });

  it("garde le dernier rapport publié visible pendant une nouvelle demande de complément", async () => {
    const published = await reportView();
    render(<CandidateEvaluationStatus evaluationId={1} view={{ ...published, stage: "info_requested", infoRequest: { message: "Un nouveau justificatif est utile.", items: [{ id: "q1", label: "Test de langue" }] } }} />);
    expect(screen.getByText("Un nouveau justificatif est utile.")).toBeTruthy();
    expect(screen.getByLabelText("Score validé : 68 sur 100")).toBeTruthy();
  });
});

// ── Côté administrateur ──────────────────────────────────────────────────────

describe("panneau administrateur : validation structurée", () => {
  it("propose d'ouvrir le dossier tant qu'aucune version n'existe (génération IA ou saisie manuelle)", async () => {
    const user = userEvent.setup();
    panel();
    expect(screen.getByTestId("validation-not-opened")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Générer le brouillon IA/ }));
    expect(lastCall("generateAiDraft")).toEqual({ sessionToken: "token-a", evaluationId: 1 });
    await user.click(screen.getByRole("button", { name: "Saisir manuellement" }));
    expect(lastCall("openCase")).toEqual({ sessionToken: "token-a", evaluationId: 1 });
  });

  it("indique clairement que la migration manque, sans planter", () => {
    state.error = { message: "La validation structurée n’est pas encore activée sur ce serveur : la migration 0072 doit être appliquée." };
    panel();
    expect(screen.getByRole("alert").textContent).toContain("0072");
  });

  it("présente le statut, le badge de brouillon, et le brouillon IA en lecture seule dans son onglet", async () => {
    state.view = (await draftView()).view;
    const user = userEvent.setup();
    panel();
    expect(screen.getByTestId("workflow-status").textContent).toBe("EN ATTENTE DE VALIDATION ADMINISTRATEUR");
    expect(screen.getByText(ADMIN_DRAFT_BADGE)).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Brouillon IA" }));
    expect(screen.getByText(AI_DRAFT_LABEL)).toBeTruthy();
    expect(screen.getByText(/Score proposé par l’IA/).textContent).toContain("74/100");
    expect(screen.getByText("Lacunes bloquantes")).toBeTruthy();
    expect(screen.getByText(/Équivalence de diplôme requise/)).toBeTruthy();
    expect(screen.getByText("Informations extraites du formulaire")).toBeTruthy();
    expect(screen.getByText("Non renseigné", { selector: "dd" })).toBeTruthy(); // budget non fourni : jamais inventé
    const aiTab = screen.getByRole("tabpanel");
    expect(within(aiTab).queryAllByRole("textbox")).toHaveLength(0); // lecture seule
  });

  it("recalcule le total à chaque modification des notes et n'active « Enregistrer » qu'après une modification", async () => {
    state.view = (await draftView()).view;
    const user = userEvent.setup();
    panel();
    const save = screen.getByRole("button", { name: /Enregistrer le brouillon/ }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(screen.getByTestId("computed-total").textContent).toBe("74");
    fireEvent.change(screen.getByLabelText(/Expérience et compétences/), { target: { value: "10" } });
    expect(screen.getByTestId("computed-total").textContent).toBe("69");
    expect(save.disabled).toBe(false);
    await user.click(save);
    const sent = lastCall("saveDraft");
    expect(sent).toMatchObject({ sessionToken: "token-a", evaluationId: 1 });
    expect(sent.version.scores.experience).toBe(10);
    expect(sent.version.totalOverride).toBeNull(); // le score n'est fixé à la main que sur demande explicite
  });

  it("ne remplace jamais un score global fixé à la main : il reste retenu après modification des notes", async () => {
    state.view = (await draftView()).view;
    panel();
    fireEvent.change(screen.getByLabelText(/Score global manuel/), { target: { value: "61" } });
    fireEvent.change(screen.getByLabelText(/Expérience et compétences/), { target: { value: "5" } });
    expect(screen.getByTestId("computed-total").textContent).toBe("64");
    expect(screen.getByText(/Score retenu \(manuel\) : 61\/100/)).toBeTruthy();
  });

  it("interdit de publier avec des modifications non enregistrées et l'explique", async () => {
    state.view = (await draftView()).view;
    panel();
    fireEvent.change(screen.getByLabelText(/Résumé du profil/), { target: { value: "Nouveau résumé." } });
    expect((screen.getByRole("button", { name: "Publier sans email" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Publier et envoyer l’email/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Enregistrez d’abord vos modifications/)).toBeTruthy();
  });

  it("publie sans e-mail après la checklist complète (sans la relecture de l'e-mail), sur la version relue", async () => {
    const { view } = await draftView();
    state.view = view;
    const user = userEvent.setup();
    panel();
    await user.click(screen.getByRole("button", { name: "Publier sans email" }));
    const dialog = screen.getByRole("dialog");
    const boxes = within(dialog).getAllByRole("checkbox");
    expect(boxes).toHaveLength(PUBLICATION_CHECKLIST.length - 1); // la relecture de l'e-mail n'est exigée que pour l'envoi
    expect(within(dialog).getByText(/Aucun e-mail ne sera envoyé/)).toBeTruthy();
    const confirm = within(dialog).getByRole("button", { name: "Confirmer la publication" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    for (const box of boxes) await user.click(box);
    expect(confirm.disabled).toBe(false);
    await user.click(confirm);
    const sent = lastCall("publish");
    expect(sent).toMatchObject({ sessionToken: "token-a", evaluationId: 1, sendEmail: false, reviewedVersionStamp: view.case.versionStamp });
    expect(sent.checklist.emailReviewed).toBeUndefined();
    expect(Object.values(sent.checklist).every(Boolean)).toBe(true);
  });

  it("publie et envoie l'e-mail seulement après la checklist complète (8 éléments) et une confirmation finale explicite", async () => {
    const { view } = await draftView();
    state.view = view;
    const user = userEvent.setup();
    panel();
    await user.click(screen.getByRole("button", { name: /Publier et envoyer l’email/ }));
    const dialog = screen.getByRole("dialog");
    const boxes = within(dialog).getAllByRole("checkbox");
    expect(boxes).toHaveLength(PUBLICATION_CHECKLIST.length);
    expect(within(dialog).getByText(/relu l’email de notification/i)).toBeTruthy();
    expect(within(dialog).getByRole("alert").textContent).toContain("aicha@example.com");
    expect(within(dialog).getByRole("alert").textContent).toContain("Confirmer la publication et l’envoi ?");
    const confirm = within(dialog).getByRole("button", { name: "Confirmer : publier et envoyer" }) as HTMLButtonElement;
    for (const box of boxes.slice(0, -1)) await user.click(box);
    expect(confirm.disabled).toBe(true); // un élément manque
    await user.click(boxes.at(-1)!);
    expect(confirm.disabled).toBe(false);
    await user.click(confirm);
    expect(lastCall("publish")).toMatchObject({ sendEmail: true, reviewedVersionStamp: view.case.versionStamp });
  });

  it("annule sans rien publier", async () => {
    state.view = (await draftView()).view;
    const user = userEvent.setup();
    panel();
    await user.click(screen.getByRole("button", { name: "Publier sans email" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Annuler" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(state.calls.publish).toBeUndefined();
  });

  it("signale une publication réussie dont l'e-mail a échoué, et affiche l'erreur du serveur dans la fenêtre sinon", async () => {
    state.view = (await draftView()).view;
    const user = userEvent.setup();
    state.next.publish = (handlers) => handlers.onSuccess?.({ outcome: "published", emailAttempted: true, emailSent: false, emailError: "SMTP indisponible", firstValidatedBy: null });
    panel();
    await user.click(screen.getByRole("button", { name: /Publier et envoyer l’email/ }));
    for (const box of within(screen.getByRole("dialog")).getAllByRole("checkbox")) await user.click(box);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmer : publier et envoyer" }));
    await waitFor(() => expect(screen.getByText(/l’e-mail n’a pas pu être envoyé : SMTP indisponible/)).toBeTruthy());
    expect(state.refetch).toHaveBeenCalled();
    expect(state.invalidate).toHaveBeenCalled();

    cleanup();
    state.next.publish = (handlers) => handlers.onError?.({ message: "Cochez toute la checklist avant de publier." });
    panel();
    await user.click(screen.getByRole("button", { name: "Publier sans email" }));
    for (const box of within(screen.getByRole("dialog")).getAllByRole("checkbox")) await user.click(box);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmer la publication" }));
    expect(within(screen.getByRole("dialog")).getByRole("alert", { name: "" }).textContent).toContain("Cochez toute la checklist");
  });

  it("annonce la première validation quand un second administrateur est requis", async () => {
    state.view = (await draftView()).view;
    const user = userEvent.setup();
    state.next.publish = (handlers) => handlers.onSuccess?.({ outcome: "awaiting_second_validation", emailAttempted: false, emailSent: false, emailError: null, firstValidatedBy: "admin.a@3m.test" });
    panel();
    await user.click(screen.getByRole("button", { name: "Publier sans email" }));
    for (const box of within(screen.getByRole("dialog")).getAllByRole("checkbox")) await user.click(box);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirmer la publication" }));
    await waitFor(() => expect(screen.getByText(/exige un second administrateur/)).toBeTruthy());
  });

  it("demande des informations complémentaires avec un élément par ligne", async () => {
    state.view = (await draftView()).view;
    const user = userEvent.setup();
    panel();
    await user.click(screen.getByRole("button", { name: /Demander des informations complémentaires/ }));
    const dialog = screen.getByRole("dialog");
    const send = within(dialog).getByRole("button", { name: "Envoyer la demande" }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    await user.type(within(dialog).getByLabelText(/Message au candidat/), "Merci de compléter votre dossier.");
    await user.type(within(dialog).getByLabelText(/Éléments demandés/), "Relevé de notes{enter}Attestation de travail");
    await user.click(send);
    expect(lastCall("requestInfo")).toEqual({ sessionToken: "token-a", evaluationId: 1, message: "Merci de compléter votre dossier.", items: ["Relevé de notes", "Attestation de travail"] });
  });

  it("montre l'aperçu client exact, et refuse visiblement une formulation interdite", async () => {
    const { view } = await draftView();
    state.view = view;
    const user = userEvent.setup();
    const first = panel();
    await user.click(screen.getByRole("tab", { name: "Aperçu client" }));
    expect(screen.getByRole("note").textContent).toBe(LEGAL_DISCLAIMER);
    expect(screen.getByText(/Aperçu de l’e-mail de notification/)).toBeTruthy();
    expect(screen.getByText(/aicha@example.com/)).toBeTruthy();
    expect(screen.getByText(/\[lien sécurisé vers votre espace\]/)).toBeTruthy();
    first.unmount();

    const bad = await draftView(async (deps) => {
      const current = (await deps.store.getLatestCase(1))!;
      await saveAdminVersion(deps, ADMIN, 1, { ...current.adminVersion!, profileSummary: "Votre visa est garanti." } as AdminEvaluationVersion);
    });
    state.view = bad.view;
    panel();
    await user.click(screen.getByRole("tab", { name: "Aperçu client" }));
    expect(screen.getByRole("alert").textContent).toContain("garanti");
    expect((screen.getByRole("button", { name: "Publier sans email" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByText(/garanti/).length).toBeGreaterThan(0);
  });

  it("affiche les demandes en attente de réponse et la réponse du candidat", async () => {
    const { view } = await draftView(async (deps) => {
      await requestInformation(deps, ADMIN, 1, { message: "Merci.", items: ["Relevé de notes"] });
    });
    state.view = view;
    panel();
    expect(screen.getByTestId("workflow-status").textContent).toBe("INFORMATIONS COMPLÉMENTAIRES REQUISES");
    expect(screen.getByText(/En attente de la réponse du candidat/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Demander des informations complémentaires/ }) as HTMLButtonElement).disabled).toBe(true); // déjà ouverte
    expect((screen.getByRole("button", { name: "Publier sans email" }) as HTMLButtonElement).disabled).toBe(true); // pas de publication tant que la demande est ouverte
  });

  it("verrouille la version publiée (lecture seule) et propose renvoi d'e-mail et réévaluation", async () => {
    const deps = makeDeps();
    await recordAiDraft(deps, 1, { ok: true, draft: sampleAiDraft(), model: "gemini-test" });
    const current = (await deps.store.getLatestCase(1))!;
    deps.mailer.failWith(new Error("SMTP indisponible"));
    await publishEvaluation(deps, ADMIN, 1, { checklist: FULL_CHECKLIST, sendEmail: true, reviewedVersionStamp: versionStamp(current.adminVersion!) });
    state.view = await buildAdminView(deps, 1);
    const user = userEvent.setup();
    panel();
    expect(screen.getByTestId("workflow-status").textContent).toBe("ÉVALUATION VALIDÉE ET PUBLIÉE");
    expect(screen.queryByText(ADMIN_DRAFT_BADGE)).toBeNull();
    expect(screen.getByText(/l’e-mail n’a pas été envoyé : SMTP indisponible/)).toBeTruthy();
    expect((screen.getByRole("group", { name: "Version administrateur" }) as HTMLFieldSetElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Enregistrer le brouillon/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Publier sans email" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Renvoyer l’e-mail" }));
    expect(lastCall("resendEmail")).toEqual({ sessionToken: "token-a", evaluationId: 1 });
    await user.click(screen.getByRole("button", { name: "Réévaluer" }));
    const dialog = screen.getByRole("dialog");
    const open = within(dialog).getByRole("button", { name: "Ouvrir une nouvelle version" }) as HTMLButtonElement;
    expect(open.disabled).toBe(true);
    await user.type(within(dialog).getByLabelText(/Motif de la réévaluation/), "Nouveau test de langue reçu");
    await user.click(open);
    expect(lastCall("startReevaluation")).toEqual({ sessionToken: "token-a", evaluationId: 1, reason: "Nouveau test de langue reçu" });
  });

  it("exige la confirmation de relecture de l'e-mail pour un envoi tardif après une publication sans e-mail", async () => {
    const deps = makeDeps();
    await recordAiDraft(deps, 1, { ok: true, draft: sampleAiDraft(), model: "gemini-test" });
    const current = (await deps.store.getLatestCase(1))!;
    await publishEvaluation(deps, ADMIN, 1, { checklist: { ...FULL_CHECKLIST, emailReviewed: false }, sendEmail: false, reviewedVersionStamp: versionStamp(current.adminVersion!) });
    state.view = await buildAdminView(deps, 1);
    expect(state.view.case.emailReviewed).toBe(false);
    const user = userEvent.setup();
    panel();
    await user.click(screen.getByRole("button", { name: "Envoyer l’e-mail de notification" }));
    expect(state.calls.resendEmail).toBeUndefined(); // rien ne part avant la confirmation
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/aicha@example.com/)).toBeTruthy();
    expect(within(dialog).getByText(/\[lien sécurisé vers votre espace\]/)).toBeTruthy();
    const confirm = within(dialog).getByRole("button", { name: "Envoyer l’e-mail" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    await user.click(within(dialog).getByRole("checkbox"));
    expect(confirm.disabled).toBe(false);
    await user.click(confirm);
    expect(lastCall("resendEmail")).toEqual({ sessionToken: "token-a", evaluationId: 1, emailReviewed: true });
  });

  it("recharge le brouillon local depuis la version renvoyée par le serveur après un enregistrement (pas de « modifié » fantôme)", async () => {
    const { view } = await draftView();
    state.view = view;
    const user = userEvent.setup();
    state.next.saveDraft = (handlers) => handlers.onSuccess?.({ changedFields: [], view: { case: { adminVersion: { ...view.case.adminVersion!, profileSummary: "Résumé normalisé par le serveur." } } } });
    panel();
    fireEvent.change(screen.getByLabelText(/Résumé du profil/), { target: { value: "Résumé avec espace final " } });
    await user.click(screen.getByRole("button", { name: /Enregistrer le brouillon/ }));
    await waitFor(() => expect((screen.getByLabelText(/Résumé du profil/) as HTMLTextAreaElement).value).toBe("Résumé normalisé par le serveur."));
  });

  it("garde le commentaire interne clairement marqué comme jamais visible du candidat", async () => {
    state.view = (await draftView()).view;
    panel();
    expect(screen.getByText(/Interne — jamais visible du candidat/)).toBeTruthy();
  });

  it("affiche l'historique champ par champ (ancienne et nouvelle valeur, auteur)", async () => {
    const { view } = await draftView(async (deps) => {
      const current = (await deps.store.getLatestCase(1))!;
      await saveAdminVersion(deps, ADMIN, 1, { ...current.adminVersion!, profileSummary: "Résumé retouché." });
    });
    state.view = view;
    const user = userEvent.setup();
    panel();
    await user.click(screen.getByRole("tab", { name: "Historique" }));
    expect(screen.getByText("profileSummary")).toBeTruthy();
    expect(screen.getByText(/Résumé retouché\./)).toBeTruthy();
    expect(screen.getAllByText(/admin\.a@3m\.test/).length).toBeGreaterThan(0);
  });
});
