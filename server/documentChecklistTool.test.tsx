// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { buildCountryProcedureDocumentChecklist } from "../shared/countryProcedureChecklist";
import { WORLD_COUNTRY_ROWS } from "../shared/worldCountries";
import { composePublicPrerender, getIndexablePublicPaths } from "./publicPrerender";

(globalThis as any).React = React;
vi.mock("@/components/ServicePageShell", () => ({ ServicePageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/lib/pageSeo", () => ({ setPageSeo: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import DocumentChecklistTool from "@/pages/DocumentChecklistTool";

afterEach(() => { cleanup(); window.localStorage.clear(); });

describe("outil gratuit : liste des pièces", () => {
  it("fournit une liste non vide pour les 196 pays et chaque type de projet", () => {
    for (const [, name] of WORLD_COUNTRY_ROWS) {
      for (const project of ["travail", "etudes", "visiteur", "evisa", "residence", "famille"]) {
        const list = buildCountryProcedureDocumentChecklist({ destination: name, procedureType: project });
        expect(list.documents.length, `${name} ${project}`).toBeGreaterThan(0);
        expect(list.documents.length).toBeLessThanOrEqual(16);
      }
    }
  });

  it("affiche la liste, mémorise les pièces cochées sur l'appareil et change de liste avec le projet", () => {
    render(<DocumentChecklistTool />);
    const first = screen.getAllByRole("checkbox")[0] as HTMLInputElement;
    expect(first.checked).toBe(false);
    fireEvent.click(first);
    expect(first.checked).toBe(true);
    expect(screen.getByRole("status").textContent).toMatch(/^1 pièce prête sur/);
    expect(window.localStorage.getItem("3m-document-checklist-v1")).toContain("CA|travail");
    fireEvent.change(document.getElementById("checklist-project") as HTMLSelectElement, { target: { value: "etudes" } });
    expect(screen.getByRole("status").textContent).toMatch(/^0 pièce/);
  });

  it("la page est publique, indexable et lisible sans JavaScript", () => {
    const shell = '<!doctype html><html><head><title>t</title></head><body><div id="root"><!--prerender-app--></div></body></html>';
    const rendered = composePublicPrerender(shell, "/outils/liste-de-pieces");
    expect(rendered.status).toBe(200);
    expect(rendered.noindex).toBe(false);
    expect(rendered.html).toContain("Liste des pièces");
    expect(getIndexablePublicPaths()).toContain("/outils/liste-de-pieces");
  });
});
