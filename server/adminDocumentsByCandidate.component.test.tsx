// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

import AdminDocumentsByCandidate from "@/components/AdminDocumentsByCandidate";
import { approvalRate, groupDocumentsByCandidate, groupKeyOf, isAgencyHandedDocument } from "@/lib/documentGroups";

afterEach(cleanup);

const doc = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  source: "candidate" as const,
  candidateId: 10,
  candidateEmail: "aicha@example.com",
  dossierNumber: "3M-2026-0001",
  candidateName: "Aïcha Nkolo",
  documentType: "passeport",
  documentName: "passeport.pdf",
  documentUrl: "https://files.example/p.pdf",
  verificationStatus: "pending" as const,
  submittedAt: new Date("2026-09-20T10:00:00Z"),
  ...overrides,
});

describe("regroupement des pièces par candidat", () => {
  it("une fiche par dossier, avec les compteurs par statut et les pièces remises en agence", () => {
    const groups = groupDocumentsByCandidate([
      doc({ id: 1 }),
      doc({ id: 2, documentType: "diplome", verificationStatus: "approved" }),
      doc({ id: 3, documentType: "document_remis_main_propre", source: "agency", verificationStatus: "rejected" }),
      doc({ id: 4, dossierNumber: "3M-2026-0002", candidateName: "Paul Mbarga", candidateEmail: "paul@example.com" }),
    ]);
    expect(groups).toHaveLength(2);
    const aicha = groups.find((group) => group.dossierNumber === "3M-2026-0001")!;
    expect(aicha).toMatchObject({ total: 3, approved: 1, pending: 1, rejected: 1, agencyCount: 1 });
    expect(approvalRate(aicha)).toBe(33);
  });

  it("deux candidats homonymes de dossiers différents ne sont jamais fusionnés", () => {
    const groups = groupDocumentsByCandidate([doc({ id: 1, dossierNumber: "3M-A" }), doc({ id: 2, dossierNumber: "3M-B" })]);
    expect(groups).toHaveLength(2);
  });

  it("sans numéro de dossier : regroupe par e-mail, puis par nom", () => {
    expect(groupKeyOf(doc({ dossierNumber: "N/A" }))).toBe("email:aicha@example.com");
    expect(groupKeyOf(doc({ dossierNumber: "N/A", candidateEmail: null }))).toBe("nom:aïcha nkolo");
    expect(groupDocumentsByCandidate([doc({ id: 1, dossierNumber: "N/A" }), doc({ id: 2, dossierNumber: "N/A", documentType: "cv" })])).toHaveLength(1);
  });

  it("les candidats avec le plus de pièces à contrôler passent en premier", () => {
    const groups = groupDocumentsByCandidate([
      doc({ id: 1, dossierNumber: "3M-A", candidateName: "A", verificationStatus: "approved" }),
      doc({ id: 2, dossierNumber: "3M-B", candidateName: "B" }),
      doc({ id: 3, dossierNumber: "3M-B", candidateName: "B" }),
    ]);
    expect(groups.map((group) => group.dossierNumber)).toEqual(["3M-B", "3M-A"]);
  });

  it("les versions d'une même pièce restent côte à côte, la plus récente d'abord", () => {
    const [group] = groupDocumentsByCandidate([
      doc({ id: 1, submittedAt: new Date("2026-09-01") }),
      doc({ id: 2, documentType: "cv" }),
      doc({ id: 3, submittedAt: new Date("2026-09-10") }),
    ]);
    expect(group.documents.map((d) => d.id)).toEqual([2, 3, 1]);
  });

  it("reconnaît une pièce remise en agence par sa source ou son type", () => {
    expect(isAgencyHandedDocument({ source: "agency", documentType: "cv" })).toBe(true);
    expect(isAgencyHandedDocument({ source: "candidate", documentType: "document_remis_main_propre" })).toBe(true);
    expect(isAgencyHandedDocument({ source: "candidate", documentType: "cv" })).toBe(false);
  });
});

describe("affichage individuel par candidat", () => {
  const setup = () => {
    const handlers = { onPreview: vi.fn(), onDownload: vi.fn(), onApprove: vi.fn(), onSetPending: vi.fn(), onReject: vi.fn(), onAddDocuments: vi.fn() };
    const groups = groupDocumentsByCandidate([
      doc({ id: 1 }),
      doc({ id: 2, documentType: "document_remis_main_propre", documentName: "remise-agence.pdf", verificationStatus: "approved" }),
      doc({ id: 3, dossierNumber: "3M-2026-0002", candidateName: "Paul Mbarga", candidateEmail: "paul@example.com", documentName: "cv-paul.pdf", documentType: "cv" }),
    ]);
    render(<AdminDocumentsByCandidate groups={groups} busy={false} typeLabel={(type) => `Type ${type}`} {...handlers} />);
    return handlers;
  };

  it("affiche une fiche par candidat, repliée, avec ses compteurs", () => {
    setup();
    const cards = screen.getAllByTestId("candidate-document-group");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText("Aïcha Nkolo")).toBeTruthy();
    expect(cards[0].textContent).toContain("1 à contrôler");
    expect(cards[0].textContent).toContain("1 remise(s) en agence");
    expect(screen.queryAllByTestId("candidate-document-row")).toHaveLength(0);
  });

  it("déplier une fiche montre ses pièces une à une, avec leur origine", () => {
    setup();
    fireEvent.click(screen.getByLabelText("Déplier les documents de Aïcha Nkolo"));
    const rows = screen.getAllByTestId("candidate-document-row");
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.textContent).join("|")).toContain("Remis en agence");
    expect(rows.map((row) => row.textContent).join("|")).toContain("Déposé en ligne");
    expect(screen.queryByText("cv-paul.pdf")).toBeNull();
  });

  it("chaque action s'applique à la pièce cliquée uniquement", () => {
    const handlers = setup();
    fireEvent.click(screen.getByLabelText("Déplier les documents de Paul Mbarga"));
    fireEvent.click(screen.getByLabelText("Valider cv-paul.pdf"));
    expect(handlers.onApprove).toHaveBeenCalledTimes(1);
    expect(handlers.onApprove.mock.calls[0][0]).toMatchObject({ id: 3, dossierNumber: "3M-2026-0002" });
    fireEvent.click(screen.getByLabelText("Rejeter cv-paul.pdf"));
    expect(handlers.onReject.mock.calls[0][0]).toMatchObject({ id: 3 });
  });

  it("« Ajouter une pièce remise en agence » cible le candidat de la fiche", () => {
    const handlers = setup();
    const card = screen.getAllByTestId("candidate-document-group")[1];
    fireEvent.click(within(card).getByTestId("add-agency-documents"));
    expect(handlers.onAddDocuments.mock.calls[0][0]).toMatchObject({ dossierNumber: "3M-2026-0002", candidateName: "Paul Mbarga" });
  });

  it("« Tout déplier » ouvre toutes les fiches", () => {
    setup();
    fireEvent.click(screen.getByText("Tout déplier"));
    expect(screen.getAllByTestId("candidate-document-row")).toHaveLength(3);
    expect(screen.getByText("Tout replier")).toBeTruthy();
  });

  it("aucun document : message vide", () => {
    render(<AdminDocumentsByCandidate groups={[]} busy={false} typeLabel={(t) => t} onPreview={vi.fn()} onDownload={vi.fn()} onApprove={vi.fn()} onSetPending={vi.fn()} onReject={vi.fn()} onAddDocuments={vi.fn()} />);
    expect(screen.getByTestId("documents-by-candidate-empty").textContent).toContain("Aucun document");
  });
});

describe("intégration dans l'onglet Documents", () => {
  const source = require("node:fs").readFileSync(require("node:path").resolve(import.meta.dirname, "../client/src/components/AdminDocumentsManagement.tsx"), "utf8") as string;

  it("la vue par candidat est le mode par défaut et « Ajouter une pièce » présélectionne le dépôt rapide en « remis en main propre »", () => {
    expect(source).toContain('useState<"candidates" | "list">("candidates")');
    expect(source).toContain("<AdminDocumentsByCandidate<Document>");
    expect(source).toContain('setUploadDocumentType("document_remis_main_propre")');
    expect(source).toContain('id="admin-quick-upload"');
  });

  it("le mode liste garde la sélection groupée et les actions existantes", () => {
    expect(source).toContain('viewMode === "list" && selectedDocuments.length > 0');
    expect(source).toContain("handleBulkStatus(");
  });
});
