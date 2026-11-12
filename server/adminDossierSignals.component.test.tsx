// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import AdminDossierSignals, { buildDossierSignals } from "@/components/AdminDossierSignals";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

afterEach(() => cleanup());

describe("pastilles de dossier (liste admin)", () => {
  it("non payé : une seule pastille, aucun bruit sur le protocole", () => {
    const signals = buildDossierSignals({ paymentStatus: "NOT_PAID", agreementSigned: false, checklistPercent: null });
    expect(signals.map((signal) => signal.key)).toEqual(["payment"]);
    expect(signals[0]).toMatchObject({ label: "Non payé", tone: "idle" });
  });

  it("paiement en attente = à valider (ambre) ; échoué = rouge", () => {
    expect(buildDossierSignals({ paymentStatus: "PENDING" })[0]).toMatchObject({ label: "Paiement à valider", tone: "wait" });
    expect(buildDossierSignals({ paymentStatus: "FAILED" })[0]).toMatchObject({ tone: "bad" });
    expect(buildDossierSignals({ paymentStatus: "CANCELLED" })[0]).toMatchObject({ tone: "bad" });
  });

  it("payé : le protocole apparaît (à signer, puis signé)", () => {
    expect(buildDossierSignals({ paymentStatus: "SUCCESS", agreementSigned: false }).map((s) => s.label)).toEqual(["Payé", "Protocole à signer"]);
    expect(buildDossierSignals({ paymentStatus: "SUCCESS", agreementSigned: true }).map((s) => s.label)).toEqual(["Payé", "Protocole signé"]);
  });

  it("pièces : pourcentage borné et coloré, absent si inconnu", () => {
    const pieces = (percent: number | null | undefined) => buildDossierSignals({ paymentStatus: "SUCCESS", agreementSigned: true, checklistPercent: percent }).find((s) => s.key === "documents");
    expect(pieces(null)).toBeUndefined();
    expect(pieces(undefined)).toBeUndefined();
    expect(pieces(30)).toMatchObject({ label: "Pièces 30 %", tone: "idle" });
    expect(pieces(60)).toMatchObject({ label: "Pièces 60 %", tone: "wait" });
    expect(pieces(100)).toMatchObject({ label: "Pièces 100 %", tone: "ok" });
    expect(pieces(140)).toMatchObject({ label: "Pièces 100 %" });
    expect(pieces(-5)).toMatchObject({ label: "Pièces 0 %" });
  });

  it("rendu : liste accessible avec le texte de chaque pastille", () => {
    render(<AdminDossierSignals paymentStatus="SUCCESS" agreementSigned={false} checklistPercent={40} />);
    const list = screen.getByTestId("admin-dossier-signals");
    expect(list.getAttribute("aria-label")).toBe("Signaux du dossier");
    expect(list.textContent).toContain("Payé");
    expect(list.textContent).toContain("Protocole à signer");
    expect(list.textContent).toContain("Pièces 40 %");
  });

  it("la liste admin affiche les pastilles (avec le paiement en attente de sauvegarde) et replie les ressources", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx").replace(/\s+/g, " ");
    expect(dashboard).toContain("<AdminDossierSignals paymentStatus={pendingInlineChanges[candidate.id]?.paymentStatus ?? candidate.paymentStatus}");
    expect(dashboard).toContain('data-testid="admin-journey-resources"');
    // Les liens de ressources restent dans le DOM, à l'intérieur du repli.
    const details = dashboard.slice(dashboard.indexOf('data-testid="admin-journey-resources"'));
    expect(details.indexOf('data-testid="admin-published-guide-link"')).toBeGreaterThan(-1);
    expect(details.indexOf('data-testid="admin-published-guide-link"')).toBeLessThan(details.indexOf("</details>"));
    expect(details.indexOf('data-testid="admin-guide-summary"')).toBeLessThan(details.indexOf("</details>"));
  });
});
