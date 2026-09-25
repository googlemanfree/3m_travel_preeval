// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

(globalThis as any).React = React;

const calls = vi.hoisted(() => ({ decide: [] as any[], deposit: [] as any[], add: [] as any[] }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    adminCaseDesk: {
      setRequirementStatus: { useMutation: () => ({ mutate: (value: any) => calls.decide.push(value), isPending: false }) },
      depositDocument: { useMutation: () => ({ mutate: (value: any) => calls.deposit.push(value), isPending: false }) },
      addRequirement: { useMutation: () => ({ mutate: (value: any) => calls.add.push(value), isPending: false }) },
    },
  },
}));

import CandidateDocumentsCrm from "@/components/CandidateDocumentsCrm";
import CaseDocumentsPanel, { agencyDepositedDocuments } from "@/components/CaseDocumentsPanel";
import { dueLabel, filterOf, filterRequirements, latestFileFor, normalizeStatus, rowActions, summarizeRequirements, type CrmRequirement } from "@/lib/requirementsCrm";

const NOW = new Date("2026-09-25T10:00:00Z").getTime();
const requirements: CrmRequirement[] = [
  { id: 1, documentType: "CV", status: "pending", adminComment: "CV détaillé en français ou en anglais." },
  { id: 2, documentType: "Passeport", status: "received", adminComment: null },
  { id: 3, documentType: "Diplômes et certifications", status: "rejected", adminComment: "Scan illisible" },
  { id: 4, documentType: "Assurance médicale", status: "approved" },
  { id: 5, documentType: "Justificatif d’hébergement", status: "waived" },
  { id: 6, documentType: "Attestation d’emploi", status: "pending", dueAt: "2026-09-20T00:00:00Z" },
];
const documents = [
  { id: "case-1", documentType: "Passeport", fileName: "passeport-p1.pdf", uploadedAt: "2026-09-10T10:00:00Z", uploadedByRole: "candidate", documentUrl: "/manus-storage/a" },
  { id: "case-2", documentType: "PASSEPORT", fileName: "passeport-scan.pdf", uploadedAt: "2026-09-22T10:00:00Z", uploadedByRole: "agency", documentUrl: "/manus-storage/b" },
];

afterEach(cleanup);
beforeEach(() => { calls.decide.length = 0; calls.deposit.length = 0; calls.add.length = 0; });

describe("logique de la vue CRM", () => {
  it("les statuts sont lisibles en français et un statut inconnu vaut « à fournir »", () => {
    expect(normalizeStatus("pending")).toBe("pending");
    expect(normalizeStatus("n'importe quoi")).toBe("pending");
    expect(normalizeStatus(undefined)).toBe("pending");
    expect([filterOf("pending"), filterOf("received"), filterOf("rejected"), filterOf("approved"), filterOf("waived")]).toEqual(["to_provide", "to_review", "to_fix", "done", "done"]);
  });

  it("la progression ne compte que les pièces requises et non dispensées", () => {
    const summary = summarizeRequirements(requirements);
    expect(summary).toMatchObject({ total: 5, validated: 1, percent: 20, awaitingCandidate: 3 });
    expect(summary.counts).toEqual({ all: 6, to_provide: 2, to_review: 1, to_fix: 1, done: 2 });
    expect(summarizeRequirements([])).toMatchObject({ total: 0, percent: 0 });
    expect(summarizeRequirements([{ id: 1, documentType: "X", status: "pending", isRequired: false }]).total).toBe(0);
  });

  it("filtre par famille de statut", () => {
    expect(filterRequirements(requirements, "to_provide").map((item) => item.id)).toEqual([1, 6]);
    expect(filterRequirements(requirements, "done").map((item) => item.id)).toEqual([4, 5]);
    expect(filterRequirements(requirements, "all")).toHaveLength(6);
  });

  it("propose la bonne action principale par état, jamais de bouton sans effet", () => {
    expect(rowActions("pending")).toEqual(["deposit", "waive"]);
    expect(rowActions("received")).toEqual(["approve", "reject", "deposit"]);
    expect(rowActions("rejected")).toEqual(["deposit", "waive"]);
    expect(rowActions("approved")).toEqual(["reopen"]);
    expect(rowActions("waived")).toEqual(["reopen"]);
  });

  it("retrouve le dernier fichier d'une pièce par son intitulé (sans accents ni casse) et son origine", () => {
    const latest = latestFileFor(requirements[1], documents);
    expect(latest).toMatchObject({ fileName: "passeport-scan.pdf", origin: "agence", url: "/manus-storage/b" });
    expect(latestFileFor({ id: 9, documentType: "Diplômes", status: "pending" }, [{ documentType: "diplomes", fileName: "d.pdf", uploadedByRole: "candidate" }])?.origin).toBe("candidat");
    expect(latestFileFor(requirements[0], documents)).toBeNull();
  });

  it("annonce une échéance dépassée ou à venir, rien une fois la pièce terminée", () => {
    expect(dueLabel(requirements[5], NOW)).toEqual({ text: "En retard de 5 j", overdue: true });
    expect(dueLabel({ id: 1, documentType: "X", status: "pending", dueAt: "2026-10-10T00:00:00Z" }, NOW)?.overdue).toBe(false);
    expect(dueLabel({ id: 1, documentType: "X", status: "approved", dueAt: "2026-09-01T00:00:00Z" }, NOW)).toBeNull();
    expect(dueLabel(requirements[0], NOW)).toBeNull();
  });
});

const renderCrm = (over: Partial<React.ComponentProps<typeof CandidateDocumentsCrm>> = {}) => {
  const props = { sessionToken: "tok", candidateId: "online-12", requirements, documents, onChanged: vi.fn(), onRemind: vi.fn(), ...over };
  render(<CandidateDocumentsCrm {...props} />);
  return props;
};
const row = (id: number) => screen.getByTestId(`crm-row-${id}`);

describe("vue CRM des pièces", () => {
  it("affiche la progression, les statuts en français et un seul intitulé par pièce", () => {
    renderCrm();
    expect(screen.getByTestId("crm-progress").textContent).toBe("1 sur 5 validée");
    expect(within(row(1)).getByText("À fournir")).toBeTruthy();
    expect(within(row(2)).getByText("À vérifier")).toBeTruthy();
    expect(within(row(3)).getByText("À corriger")).toBeTruthy();
    expect(within(row(4)).getByText("Validée")).toBeTruthy();
    expect(within(row(5)).getByText("Non requise")).toBeTruthy();
    expect(screen.queryByText("pending")).toBeNull();
    expect(within(row(2)).getByText("passeport-scan.pdf")).toBeTruthy();
    expect(within(row(2)).getByText(/Remis en agence/)).toBeTruthy();
    expect(within(row(6)).getByText("En retard de 5 j")).toBeTruthy();
  });

  it("filtre au clic sur un compteur", () => {
    renderCrm();
    fireEvent.click(screen.getByRole("tab", { name: "À corriger (1)" }));
    expect(screen.getAllByTestId(/crm-row-/)).toHaveLength(1);
    expect(screen.getByTestId("crm-row-3")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Toutes (6)" }));
    expect(screen.getAllByTestId(/crm-row-/)).toHaveLength(6);
  });

  it("valider, non requise et rouvrir envoient la bonne décision au serveur", () => {
    renderCrm();
    fireEvent.click(within(row(2)).getByRole("button", { name: /Valider — Passeport/ }));
    fireEvent.click(within(row(1)).getByRole("button", { name: /Non requise — CV/ }));
    fireEvent.click(within(row(4)).getByRole("button", { name: /Rouvrir — Assurance médicale/ }));
    expect(calls.decide).toEqual([
      { sessionToken: "tok", candidateId: "online-12", requirementId: 2, status: "approved" },
      { sessionToken: "tok", candidateId: "online-12", requirementId: 1, status: "waived" },
      { sessionToken: "tok", candidateId: "online-12", requirementId: 4, status: "pending" },
    ]);
  });

  it("« À corriger » exige d'expliquer au candidat ce qui manque, puis envoie l'explication", async () => {
    renderCrm();
    fireEvent.click(within(row(2)).getByRole("button", { name: /À corriger — Passeport/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Demander la correction" }));
    expect(within(dialog).getByRole("alert").textContent).toMatch(/5 caractères/);
    expect(calls.decide).toHaveLength(0);
    fireEvent.change(within(dialog).getByLabelText("Ce qui doit être corrigé"), { target: { value: "Scannez les deux pages du passeport." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Demander la correction" }));
    expect(calls.decide).toEqual([{ sessionToken: "tok", candidateId: "online-12", requirementId: 2, status: "rejected", comment: "Scannez les deux pages du passeport." }]);
  });

  it("déposer un document reçu en agence : fichier obligatoire, puis envoi en base64 avec la date et la validation sur place", async () => {
    renderCrm();
    fireEvent.click(within(row(1)).getByRole("button", { name: /Déposer — CV/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Déposer le document" }));
    expect(within(dialog).getByRole("alert").textContent).toMatch(/Choisissez le fichier/);
    expect(calls.deposit).toHaveLength(0);

    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], "cv.pdf", { type: "application/pdf" });
    fireEvent.change(within(dialog).getByLabelText(/Fichier/), { target: { files: [file] } });
    fireEvent.change(within(dialog).getByLabelText(/Date de remise/), { target: { value: "2026-09-24" } });
    fireEvent.click(within(dialog).getByLabelText(/contrôlé ce document sur place/));
    await act(async () => { fireEvent.click(within(dialog).getByRole("button", { name: "Déposer le document" })); });
    await waitFor(() => expect(calls.deposit).toHaveLength(1));
    expect(calls.deposit[0]).toMatchObject({ sessionToken: "tok", candidateId: "online-12", requirementId: 1, fileName: "cv.pdf", receivedAt: "2026-09-24", validate: true, base64: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]).toString("base64") });
    expect(calls.deposit[0].documentType).toBeUndefined();
  });

  it("refuse un fichier de plus de 8 Mo sans rien envoyer", async () => {
    renderCrm();
    fireEvent.click(within(row(1)).getByRole("button", { name: /Déposer — CV/ }));
    const dialog = await screen.findByRole("dialog");
    const big = new File(["x"], "gros.pdf", { type: "application/pdf" });
    Object.defineProperty(big, "size", { value: 9 * 1024 * 1024 });
    fireEvent.change(within(dialog).getByLabelText(/Fichier/), { target: { files: [big] } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Déposer le document" }));
    expect(within(dialog).getByRole("alert").textContent).toMatch(/8 Mo/);
    expect(calls.deposit).toHaveLength(0);
  });

  it("ajouter une pièce, et relancer seulement quand une pièce est attendue du candidat", async () => {
    const props = renderCrm();
    fireEvent.click(screen.getByRole("button", { name: /Ajouter une pièce/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Ajouter" }));
    expect(within(dialog).getByRole("alert").textContent).toMatch(/Indiquez la pièce/);
    fireEvent.change(within(dialog).getByLabelText("Pièce demandée"), { target: { value: "Attestation d’hébergement" } });
    fireEvent.change(within(dialog).getByLabelText(/À fournir avant le/), { target: { value: "2026-10-15" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Ajouter" }));
    expect(calls.add).toEqual([{ sessionToken: "tok", candidateId: "online-12", documentType: "Attestation d’hébergement", comment: undefined, dueAt: "2026-10-15" }]);

    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Relancer (3)" }));
    expect(props.onRemind).toHaveBeenCalledTimes(1);
  });

  it("aucune relance proposée quand tout est en règle, et message clair sans pièce", () => {
    cleanup();
    renderCrm({ requirements: [{ id: 1, documentType: "CV", status: "approved" }] });
    expect(screen.queryByRole("button", { name: /Relancer/ })).toBeNull();
    expect(screen.getByTestId("crm-progress").textContent).toBe("1 sur 1 validée");
    cleanup();
    renderCrm({ requirements: [] });
    expect(screen.getByText(/Aucune pièce demandée pour l’instant/)).toBeTruthy();
    expect(screen.getByTestId("crm-progress").textContent).toBe("Aucune pièce demandée");
  });
});

describe("espace client : documents enregistrés par l'agence", () => {
  const cases = [
    { id: 1, documents: [
      { id: 10, documentType: "Passeport", fileName: "passeport.pdf", uploadedByRole: "agency", reviewStatus: "received", uploadedAt: "2026-09-22T10:00:00Z" },
      { id: 11, documentType: "CV", fileName: "cv.pdf", uploadedByRole: "candidate", reviewStatus: "approved", uploadedAt: "2026-09-23T10:00:00Z" },
      { id: 12, documentType: "Diplôme", fileName: "diplome.jpg", uploadedByRole: "admin", reviewStatus: "rejected", reviewNote: "Scan illisible", uploadedAt: "2026-09-24T10:00:00Z" },
    ] },
  ];

  it("ne retient que les documents enregistrés par l'équipe, du plus récent au plus ancien", () => {
    expect(agencyDepositedDocuments(cases).map((document) => document.id)).toEqual([12, 10]);
    expect(agencyDepositedDocuments(undefined)).toEqual([]);
    expect(agencyDepositedDocuments([{ documents: "x" }, null])).toEqual([]);
  });

  it("montre l'état en français, la note de correction, et déclenche le téléchargement", () => {
    const onDownload = vi.fn();
    render(<CaseDocumentsPanel documents={agencyDepositedDocuments(cases)} onDownload={onDownload} />);
    expect(screen.getByText("Documents enregistrés par l’agence")).toBeTruthy();
    expect(screen.getByText("Reçu — en cours de vérification")).toBeTruthy();
    expect(screen.getByText("À corriger")).toBeTruthy();
    expect(screen.getByText("Scan illisible")).toBeTruthy();
    expect(screen.queryByText("rejected")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Télécharger passeport.pdf" }));
    expect(onDownload).toHaveBeenCalledWith(10);
  });

  it("ne s'affiche pas sans document d'agence", () => {
    const { container } = render(<CaseDocumentsPanel documents={[]} onDownload={vi.fn()} />);
    expect(container.textContent).toBe("");
  });
});
