// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;
const state = vi.hoisted(() => ({ editor: undefined as any, saveDraft: vi.fn(), publish: vi.fn(), notify: vi.fn(), saveText: vi.fn(), score: vi.fn(), clipboard: vi.fn(), mutation: (fn: (...args: any[]) => unknown) => ({ useMutation: () => ({ mutate: fn, isPending: false }) }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ adminBilanAuto: { editor: { invalidate: vi.fn() }, preview: { invalidate: vi.fn() }, compare: { invalidate: vi.fn() } } }),
    adminBilanAuto: {
      editor: { useQuery: () => ({ data: state.editor, isLoading: false, error: null }) },
      saveDraft: state.mutation(state.saveDraft), saveDraftText: state.mutation(state.saveText), changeScore: state.mutation(state.score), publishVersion: state.mutation(state.publish), notifyCandidate: state.mutation(state.notify),
      downloadPdf: { useQuery: () => ({ refetch: vi.fn(async () => ({ data: undefined })) }) },
      preview: { useQuery: () => ({ data: undefined, isLoading: false }) },
      compare: { useQuery: () => ({ data: undefined }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock("@/components/EvaluationReportView", () => ({ default: () => <div data-testid="report-view" /> }));
import BilanEditorPanel from "@/components/BilanEditorPanel";

const editorData = (over: Record<string, unknown> = {}) => ({
  run: { fullName: "Awa Ndiaye" }, editable: true,
  currentVersion: { versionNumber: 1, authorKind: "systeme", author: "systeme", status: "brouillon", notified: false },
  versions: [{ versionNumber: 1, authorKind: "systeme", author: "systeme", reason: "Proposition générée par le système", status: "brouillon", baseVersion: null, hasPdf: false, publishedAt: null, notified: false, createdAt: "2026-11-13T10:00:00Z" }],
  sections: [
    { id: "profil", title: "3. Profil et points forts", paragraphs: ["Profil de test."], bullets: ["Point fort A"] },
    { id: "verdict", title: "2. Verdict interne", paragraphs: ["Seuil atteint."], bullets: [], locked: true, table: [["Formation", "12/15"]] },
  ],
  score: { rubrics: [{ key: "formation", label: "Formation", subCriteria: [{ key: "niveau", label: "Niveau", max: 6 }] }] },
  plainText: "BILAN\n3. PROFIL ET POINTS FORTS\nProfil de test.", html: "<article>BILAN</article>", editableText: "## 3. Profil et points forts\nProfil de test.\n- Point fort A", otherRuns: [], ...over,
});

beforeEach(() => {
  state.editor = editorData();
  Object.defineProperty(navigator, "clipboard", { value: { writeText: state.clipboard, write: vi.fn() }, configurable: true });
  (globalThis as any).ClipboardItem = undefined;
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const labels = ["Copier tout le bilan", "Modifier le bilan", "Enregistrer le brouillon", "Prévisualiser", "Publier sans notification", "Publier et notifier", "Télécharger le PDF", "Notifier le candidat", "Voir l'historique"];

describe("éditeur de bilan (administrateur)", () => {
  it("propose les huit actions demandées", () => {
    render(<BilanEditorPanel sessionToken="t" runId={1} onChanged={vi.fn()} />);
    for (const label of labels) expect(screen.getByRole("button", { name: new RegExp(label) })).toBeTruthy();
  });
  it("« Copier tout le bilan » copie le texte du bilan seul, sans boutons ni éléments d'interface", async () => {
    render(<BilanEditorPanel sessionToken="t" runId={1} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Copier tout le bilan" }));
    await waitFor(() => expect(state.clipboard).toHaveBeenCalledWith("BILAN\n3. PROFIL ET POINTS FORTS\nProfil de test."));
    const copied = state.clipboard.mock.calls[0][0] as string;
    for (const ui of labels) expect(copied).not.toContain(ui);
  });
  it("enregistrer reste inactif sans modification ; publier est inactif tant que des modifications ne sont pas enregistrées", () => {
    render(<BilanEditorPanel sessionToken="t" runId={1} onChanged={vi.fn()} />);
    expect((screen.getByRole("button", { name: /Enregistrer le brouillon/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("tab", { name: "Modifier" }));
    fireEvent.change(screen.getByLabelText("Paragraphes profil"), { target: { value: "Profil corrigé." } });
    expect(screen.getByText("Modifications non enregistrées")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Enregistrer le brouillon/ }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: /Publier sans notification/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Publier et notifier/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer le brouillon/ }));
    expect(state.saveDraft).toHaveBeenCalledWith(expect.objectContaining({ runId: 1, sections: [expect.objectContaining({ id: "profil", paragraphs: ["Profil corrigé."], bullets: ["Point fort A"] })] }));
  });
  it("la section calculée n'est pas envoyée à l'enregistrement et ses champs sont verrouillés", () => {
    render(<BilanEditorPanel sessionToken="t" runId={1} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Modifier" }));
    expect(screen.getByLabelText("Titre verdict").matches(":disabled")).toBe(true); // champ d'un fieldset désactivé
    fireEvent.change(screen.getByLabelText("Paragraphes profil"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer le brouillon/ }));
    const sent = state.saveDraft.mock.calls[0][0].sections as Array<{ id: string }>;
    expect(sent.map((s) => s.id)).toEqual(["profil"]);
  });
  it("le mode texte simple enregistre le texte tel quel", () => {
    render(<BilanEditorPanel sessionToken="t" runId={1} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Texte simple" }));
    fireEvent.change(screen.getByLabelText("Texte du bilan"), { target: { value: "## 3. Profil\nNouveau." } });
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer le brouillon/ }));
    expect(state.saveText).toHaveBeenCalledWith(expect.objectContaining({ runId: 1, text: "## 3. Profil\nNouveau." }));
  });
  it("une version publiée ne peut plus être republiée ; « Notifier » n'est offert qu'une fois la version publiée et non notifiée", () => {
    state.editor = editorData({ currentVersion: { versionNumber: 2, authorKind: "admin", author: "a@3m.test", status: "publiee", notified: false } });
    render(<BilanEditorPanel sessionToken="t" runId={1} onChanged={vi.fn()} />);
    expect((screen.getByRole("button", { name: /Publier sans notification/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Notifier le candidat/ }) as HTMLButtonElement).disabled).toBe(false);
    cleanup();
    state.editor = editorData({ currentVersion: { versionNumber: 2, authorKind: "admin", author: "a@3m.test", status: "publiee", notified: true } });
    render(<BilanEditorPanel sessionToken="t" runId={1} onChanged={vi.fn()} />);
    expect((screen.getByRole("button", { name: /Notifier le candidat/ }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("signale une version corrigée existante pour le même dossier", () => {
    state.editor = editorData({ otherRuns: [{ id: 4, state: "ready_for_review", stateLabel: "Bilan prêt à valider", createdAt: "2026-11-13T10:00:00Z" }] });
    render(<BilanEditorPanel sessionToken="t" runId={9} onChanged={vi.fn()} />);
    expect(screen.getByRole("alert").textContent).toMatch(/jamais écrasée/);
  });
  it("l'historique montre l'auteur, le motif et le statut de chaque version", () => {
    state.editor = editorData({ versions: [
      { versionNumber: 1, authorKind: "systeme", author: "systeme", reason: "Proposition générée par le système", status: "remplacee", baseVersion: null, hasPdf: true, publishedAt: "2026-11-13T10:00:00Z", notified: true, createdAt: "2026-11-13T09:00:00Z" },
      { versionNumber: 2, authorKind: "admin", author: "a@3m.test", reason: "Reformulation", status: "publiee", baseVersion: 1, hasPdf: true, publishedAt: "2026-11-13T11:00:00Z", notified: false, createdAt: "2026-11-13T10:30:00Z" },
    ] });
    render(<BilanEditorPanel sessionToken="t" runId={1} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Historique" }));
    const list = screen.getByLabelText("Versions du bilan");
    expect(list.textContent).toMatch(/Administrateur : a@3m\.test/);
    expect(list.textContent).toMatch(/Motif : Reformulation/);
    expect(list.textContent).toMatch(/PDF enregistré/);
  });
});
