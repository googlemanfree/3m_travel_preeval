// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  exportData: undefined as any,
  exportError: null as any,
  requestCalls: [] as any[],
  requestResult: { success: true, alreadyPending: false, acknowledged: true } as any,
  toasts: [] as any[],
  listData: undefined as any,
  listError: null as any,
  resolveCalls: [] as any[],
}));

vi.mock("sonner", () => ({ toast: { error: (message: string) => state.toasts.push({ error: message }), success: (message: string) => state.toasts.push({ success: message }) } }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: (toast: any) => state.toasts.push(toast) }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      candidatePrivacy: {
        myDataExport: { fetch: async () => { if (state.exportError) throw state.exportError; return state.exportData; } },
        listDeletionRequests: { invalidate: () => undefined },
      },
    }),
    candidatePrivacy: {
      requestDeletion: { useMutation: () => ({ mutate: () => { state.requestCalls.push(true); }, isPending: false }) },
      listDeletionRequests: { useQuery: () => ({ data: state.listData, error: state.listError, isLoading: false }) },
      resolveDeletionRequest: { useMutation: () => ({ mutate: (input: any) => state.resolveCalls.push(input), isPending: false }) },
    },
  },
}));

import AdminPrivacyRequests from "@/components/AdminPrivacyRequests";
import PrivacyDataCard from "@/components/PrivacyDataCard";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

let clickedAnchor: { href: string; download: string } | null = null;
const realCreateObjectURL = URL.createObjectURL;
const realRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  state.exportData = { exportedAt: "2026-09-27T00:00:00Z", profile: {} };
  state.exportError = null;
  state.requestCalls = [];
  state.requestResult = { success: true, alreadyPending: false, acknowledged: true };
  state.toasts = [];
  state.listData = undefined;
  state.listError = null;
  state.resolveCalls = [];
  clickedAnchor = null;
  URL.createObjectURL = vi.fn(() => "blob:fake");
  URL.revokeObjectURL = vi.fn();
  const realClick = HTMLAnchorElement.prototype.click;
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { clickedAnchor = { href: this.href, download: this.download }; });
  return () => { HTMLAnchorElement.prototype.click = realClick; };
});
afterEach(() => { cleanup(); URL.createObjectURL = realCreateObjectURL; URL.revokeObjectURL = realRevokeObjectURL; vi.restoreAllMocks(); });

describe("carte « Mes données personnelles »", () => {
  it("télécharger déclenche un fichier .json nommé et daté, sans passer par le serveur pour l'enregistrer", async () => {
    render(<PrivacyDataCard />);
    fireEvent.click(screen.getByTestId("download-my-data"));
    await vi.waitFor(() => expect(clickedAnchor).not.toBeNull());
    expect(clickedAnchor!.download).toMatch(/^mes-donnees-3m-travel-\d{4}-\d{2}-\d{2}\.json$/);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it("suppression : demande une confirmation explicite avant d'envoyer quoi que ce soit", () => {
    render(<PrivacyDataCard />);
    expect(screen.queryByTestId("deletion-confirm")).toBeNull();
    fireEvent.click(screen.getByTestId("ask-deletion"));
    expect(screen.getByTestId("deletion-confirm").textContent).toContain("vérifiera d'abord vos dossiers en cours");
    expect(state.requestCalls).toHaveLength(0);
    fireEvent.click(screen.getByTestId("cancel-deletion"));
    expect(screen.queryByTestId("deletion-confirm")).toBeNull();
    expect(state.requestCalls).toHaveLength(0);
  });

  it("confirmer envoie effectivement la demande", () => {
    render(<PrivacyDataCard />);
    fireEvent.click(screen.getByTestId("ask-deletion"));
    fireEvent.click(screen.getByTestId("confirm-deletion"));
    expect(state.requestCalls).toHaveLength(1);
  });

  it("un échec du téléchargement affiche une erreur claire, sans planter", async () => {
    state.exportError = new Error("boom");
    render(<PrivacyDataCard />);
    fireEvent.click(screen.getByTestId("download-my-data"));
    await vi.waitFor(() => expect(state.toasts.length).toBeGreaterThan(0));
    expect(state.toasts[0]).toEqual({ error: "boom" });
  });
});

describe("admin : demandes de suppression", () => {
  it("résumé replié : nombre de demandes en attente", () => {
    state.listData = [{ candidateId: 1, email: "a@b.cd", fullName: "A B", requestedAt: "2026-09-20T00:00:00Z", status: "pending" }];
    render(<AdminPrivacyRequests sessionToken="tok" />);
    expect(screen.getByTestId("privacy-summary").textContent).toContain("1 demande en attente");
    expect(screen.queryByTestId("privacy-request-row")).toBeNull();
  });

  it("ouvert : chaque demande affiche le candidat et sa date ; clôturer demande une note puis l'envoie", () => {
    state.listData = [{ candidateId: 1, email: "a@b.cd", fullName: "Aïcha Nkolo", requestedAt: "2026-09-20T00:00:00Z", status: "pending" }];
    render(<AdminPrivacyRequests sessionToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: /Demandes de suppression/ }));
    const row = screen.getByTestId("privacy-request-row");
    expect(row.textContent).toContain("Aïcha Nkolo");
    expect(row.textContent).toContain("a@b.cd");
    const prompt = vi.spyOn(window, "prompt").mockReturnValue("Compte supprimé, dossier soldé.");
    fireEvent.click(screen.getByTestId("resolve-privacy-request"));
    expect(state.resolveCalls).toEqual([{ sessionToken: "tok", candidateId: 1, note: "Compte supprimé, dossier soldé." }]);
    prompt.mockRestore();
  });

  it("annuler la saisie de la note n'envoie rien", () => {
    state.listData = [{ candidateId: 1, email: "a@b.cd", fullName: "A B", requestedAt: "2026-09-20T00:00:00Z", status: "pending" }];
    render(<AdminPrivacyRequests sessionToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: /Demandes de suppression/ }));
    const prompt = vi.spyOn(window, "prompt").mockReturnValue(null);
    fireEvent.click(screen.getByTestId("resolve-privacy-request"));
    expect(state.resolveCalls).toHaveLength(0);
    prompt.mockRestore();
  });

  it("aucune demande : message clair ; erreur : message clair sans planter", () => {
    state.listData = [];
    const { unmount } = render(<AdminPrivacyRequests sessionToken="tok" />);
    expect(screen.getByTestId("privacy-summary").textContent).toContain("Aucune demande en attente");
    unmount();
    state.listData = undefined;
    state.listError = new Error("boom");
    render(<AdminPrivacyRequests sessionToken="tok" />);
    expect(screen.getByTestId("privacy-summary").textContent).toContain("indisponible");
  });
});

describe("montage", () => {
  it("PrivacyDataCard dans l'espace client, AdminPrivacyRequests sur la page des paramètres de sécurité", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("<PrivacyDataCard />");
    const settings = read("client/src/pages/AdminEmailSettings.tsx");
    expect(settings).toContain('<AdminPrivacyRequests sessionToken={sessionToken ?? ""} />');
  });
});
