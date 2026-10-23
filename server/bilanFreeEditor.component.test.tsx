// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { jsPDF } from "jspdf";
import { BilanPasteEditor } from "@/components/BilanPasteEditor";
import { evaluationSourceTypeOf } from "@/lib/evaluationSourceType";
import { drawBilanBlocks, parsePdfBlocks, pdfSafeText } from "./services/bilanPdfRichText";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

(globalThis as { React?: typeof React }).React = React;
afterEach(cleanup);

describe("zone « Bilan complet » : on colle, on relit, on valide", () => {
  it("affiche un bilan collé avec sa mise en forme et signale une promesse de résultat", () => {
    render(<BilanPasteEditor value="<h2>Synthèse</h2><p>Visa garanti à 100 % pour ce profil.</p>" onChange={() => {}} />);
    expect(screen.getByTestId("bilan-paste-editor")).toBeTruthy();
    expect(screen.getByTestId("bilan-forbidden")).toBeTruthy();
  });

  it("signale une donnée sensible (numéro de carte) à retirer avant validation", () => {
    render(<BilanPasteEditor value="<p>Carte 4111 1111 1111 1111</p>" onChange={() => {}} />);
    expect(screen.getByTestId("bilan-sensitive")).toBeTruthy();
  });

  it("onglet code : du Markdown/HTML collé est converti puis renvoyé au parent", () => {
    const onChange = vi.fn();
    render(<BilanPasteEditor value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: /Code HTML/ }));
    fireEvent.change(screen.getByLabelText("Code source du bilan"), { target: { value: "## Points forts\n- Expérience solide\n- Anglais courant" } });
    fireEvent.click(screen.getByRole("button", { name: /Appliquer/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const html = String(onChange.mock.calls[0][0]);
    expect(html).toContain("<h2>");
    expect(html).toContain("<li>");
    expect(html).not.toMatch(/<script/i);
  });

  it("retire scripts et gestionnaires d'événements d'un code HTML collé", () => {
    const onChange = vi.fn();
    render(<BilanPasteEditor value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: /Code HTML/ }));
    fireEvent.change(screen.getByLabelText("Code source du bilan"), { target: { value: '<p onclick="x()">Bonjour</p><script>alert(1)</script><img src=x onerror=alert(1)>' } });
    fireEvent.click(screen.getByRole("button", { name: /Appliquer/ }));
    const html = String(onChange.mock.calls[0][0]);
    expect(html).toContain("Bonjour");
    expect(html).not.toMatch(/script|onclick|onerror|<img/i);
  });
});

describe("type de source du candidat dans l'éditeur de bilan", () => {
  it("compte seul → candidate ; dossier d'agence → agency ; sinon application", () => {
    expect(evaluationSourceTypeOf({ id: "account_12", source: "ACCOUNT_ONLY", folderCode: "COMPTE-12" })).toBe("candidate");
    expect(evaluationSourceTypeOf({ id: "account_12", source: "", folderCode: "" })).toBe("candidate");
    expect(evaluationSourceTypeOf({ id: "7", source: "AGENCY_PHYSICAL", folderCode: "3M-AGN-0007" })).toBe("agency");
    expect(evaluationSourceTypeOf({ id: "7", source: "APPLICATION", folderCode: "EVAL-AG-0007" })).toBe("agency");
    expect(evaluationSourceTypeOf({ id: "7", source: "APPLICATION", folderCode: "3M-0007" })).toBe("application");
    expect(evaluationSourceTypeOf(null)).toBe("application");
  });
});

describe("PDF du bilan libre", () => {
  const html = "<h2>Synthèse ✓</h2><p>Un <strong>profil</strong> solide ①</p><ul><li>Point A</li><li>Point B</li></ul><table><thead><tr><th>Critère</th><th>Note</th></tr></thead><tbody><tr><td>Langue</td><td>12/15</td></tr></tbody></table>";

  it("découpe titres, paragraphes, listes et tableaux", () => {
    const kinds = parsePdfBlocks(html).map((block) => block.kind);
    expect(kinds).toEqual(["heading", "paragraph", "item", "item", "table"]);
  });

  it("remplace les symboles que les polices PDF ne savent pas dessiner", () => {
    expect(pdfSafeText("✓ ok ▸ suite ①")).toBe("+ ok > suite (1)");
  });

  it("dessine sur plusieurs pages sans erreur et reste dans la zone utile", () => {
    const long = Array.from({ length: 80 }, (_, i) => `<p>Paragraphe ${i} — ${"texte ".repeat(40)}</p>`).join("");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const end = drawBilanBlocks(doc, parsePdfBlocks(long + html), { left: 18, width: 174, nextTop: 30, bottom: 275 }, 40);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(end).toBeLessThanOrEqual(275 + 6);
  });
});
