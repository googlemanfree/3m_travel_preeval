// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderBilanStandalone, toBilanHtml } from "../shared/bilanContent";
import { bilanFileBase, makePrintableDocument, makeWordDocument } from "../shared/bilanPrint";

(globalThis as any).React = React;
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

import { BilanPasteEditor } from "../client/src/components/BilanPasteEditor";
import { BilanDocumentActions } from "../client/src/components/BilanDocumentActions";

const model = readFileSync(resolve(process.cwd(), "server/fixtures/bilanModele.txt"), "utf8");
const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const branded = renderBilanStandalone({ html: toBilanHtml(model).replace("[À CONFIRMER]", "100 000"), title: "Évaluation professionnelle", candidateName: "Prénom Nom", reference: "3M-AGN-0034" });

afterEach(() => cleanup());

describe("bilan imprimable et téléchargeable", () => {
  it("le document imprimable garde le papier à en-tête, passe en A4, conserve les couleurs et cache la barre à l'impression", () => {
    const page = makePrintableDocument(branded, { title: "Bilan <test>" });
    expect(page).toContain("<title>Bilan &lt;test&gt;</title>");
    expect(page).toContain("@page { size: A4;");
    expect(page).toContain("print-color-adjust: exact");
    expect(page).toContain(".bilan-bar { display: none !important; }");
    expect(page).toContain("window.print()");
    expect(page).toContain("3M TRAVEL");
    expect(page).toContain("RC : RC/YAO/2019/A/2567");
    expect(page).toContain("100 000");
    expect((page.match(/<body/g) ?? []).length).toBe(1);
    expect(page).not.toContain("<!--3m-brand-->");
  });

  it("le document Word déclare la page A4 et reprend l'en-tête et le contenu", () => {
    const word = makeWordDocument(branded, { title: "Bilan" });
    expect(word).toContain("w:WordDocument");
    expect(word).toContain("size: 21cm 29.7cm");
    expect(word).toContain("3M TRAVEL");
    expect(word).toContain("VOS ATOUTS CLÉS");
  });

  it("le nom de fichier est sûr et lisible", () => {
    expect(bilanFileBase("Éloïse N'Diaye", "3M-AGN-0034")).toBe("Bilan-evaluation-Eloise-N-Diaye-3M-AGN-0034");
    expect(bilanFileBase(null, null)).toBe("Bilan-evaluation");
    expect(bilanFileBase("../../etc/passwd", "")).not.toMatch(/[./\\]/);
  });

  it("les boutons Imprimer, Word et Copier existent côté administration comme côté candidat ; le PDF serveur est proposé s'il existe", () => {
    render(<BilanDocumentActions getDocumentHtml={() => branded} title="Bilan" candidateName="Prénom Nom" pdfUrl="https://exemple.test/bilan.pdf" />);
    for (const id of ["bilan-print", "bilan-word", "bilan-copy", "bilan-pdf"]) expect(screen.getByTestId(id)).toBeTruthy();
    expect(screen.getByTestId("bilan-pdf").getAttribute("href")).toBe("https://exemple.test/bilan.pdf");
    cleanup();
    render(<BilanDocumentActions getDocumentHtml={() => branded} title="Bilan" />);
    expect(screen.queryByTestId("bilan-pdf")).toBeNull();
  });

  it("l'espace candidat et l'éditeur de l'administration utilisent les mêmes boutons", () => {
    expect(read("client/src/components/SentBilanViewer.tsx")).toContain("<BilanDocumentActions");
    expect(read("client/src/components/BilanPasteEditor.tsx")).toContain("<BilanDocumentActions");
    expect(read("client/src/components/EvaluationDeliveryEditor.tsx")).toContain("documentMeta={{");
  });
});

describe("éditeur du bilan : outils de mise en forme", () => {
  it("propose couleur, surlignage, taille, encadrés, alignements, style de tableau, annuler et rétablir", () => {
    render(<BilanPasteEditor value="" onChange={() => {}} />);
    for (const name of ["Souligné", "Barré", "Aligner à gauche", "Centrer", "Aligner à droite", "Justifier", "Couleur du texte", "Surlignage", "Taille du texte", "Style du tableau", "Annuler", "Rétablir"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${name}`) }), name).toBeTruthy();
    }
    fireEvent.click(screen.getByRole("button", { name: "Couleur du texte" }));
    expect(screen.getByTestId("bilan-panel-color").querySelectorAll("button").length).toBeGreaterThanOrEqual(10);
    fireEvent.click(screen.getByRole("button", { name: /^Encadré/ }));
    expect(screen.getByTestId("bilan-panel-callout").textContent).toMatch(/Point d'attention/);
  });

  it("signale une zone à compléter et bloque l'envoi tant qu'elle reste, sans bloquer l'édition", () => {
    const html = toBilanHtml(model);
    render(<BilanPasteEditor value={html} onChange={() => {}} />);
    expect(screen.getByTestId("bilan-placeholders").textContent).toMatch(/\[À CONFIRMER\]/);
    expect(screen.queryByTestId("bilan-forbidden")).toBeNull();
    expect(read("server/routers/unifiedRequests.ts")).toContain("Zone à compléter restante dans le bilan");
  });

  it("la zone papier à en-tête n'apparaît qu'avec un bilan et l'identité du dossier", () => {
    const html = toBilanHtml(model);
    render(<BilanPasteEditor value={html} onChange={() => {}} documentMeta={{ title: "Évaluation", candidateName: "Prénom Nom" }} />);
    expect(screen.getByTestId("bilan-document-zone")).toBeTruthy();
    cleanup();
    render(<BilanPasteEditor value="" onChange={() => {}} documentMeta={{ title: "Évaluation", candidateName: "Prénom Nom" }} />);
    expect(screen.queryByTestId("bilan-document-zone")).toBeNull();
  });
});
