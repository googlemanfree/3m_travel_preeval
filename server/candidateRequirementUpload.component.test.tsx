// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;

vi.mock("@/hooks/useCandidateAuth", () => ({ getCandidateToken: () => "token-test", useCandidateAuth: () => ({ isAuthenticated: true }) }));

import { buildStoredDocumentName, sanitizeRequirementLabel } from "./routers/candidateUpload";
import DossierDocumentChecklist, { buildRequirementOptions, deriveChecklistStates } from "@/components/DossierDocumentChecklist";
import { DocumentUploader } from "@/components/DocumentUploader";

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
  (globalThis as any).fetch = fetchMock;
});
afterEach(cleanup);

describe("nom enregistré avec l'intitulé de la pièce demandée (serveur)", () => {
  it("rend l'intitulé sûr : sans accents, espaces ni symboles, borné", () => {
    expect(sanitizeRequirementLabel("Acte de naissance")).toBe("Acte_de_naissance");
    expect(sanitizeRequirementLabel("Diplômes & relevés (traduits)")).toBe("Diplomes_releves_traduits");
    expect(sanitizeRequirementLabel("../../etc/passwd")).toBe("etc_passwd");
    expect(sanitizeRequirementLabel("a".repeat(300)).length).toBeLessThanOrEqual(80);
    expect(sanitizeRequirementLabel(undefined)).toBe("");
    expect(sanitizeRequirementLabel({ x: 1 })).toBe("");
  });

  it("préfixe le nom du fichier ; sans intitulé, le nom reste celui du fichier", () => {
    expect(buildStoredDocumentName("Acte de naissance", "scan.pdf")).toBe("Acte_de_naissance--scan.pdf");
    expect(buildStoredDocumentName("", "scan.pdf")).toBe("scan.pdf");
    expect(buildStoredDocumentName("!!!", "scan.pdf")).toBe("scan.pdf");
    expect(buildStoredDocumentName("x".repeat(500), "a".repeat(160)).length).toBeLessThanOrEqual(255);
  });

  it("chaque pièce envoyée pour une ligne de la checklist la fait passer à « reçue » (nom enregistré → checklist)", () => {
    for (const [destination, projectType] of [["Canada", "etudes"], ["Allemagne", "travail"], ["France", "tourisme"]] as const) {
      const requirements = buildRequirementOptions(destination, projectType);
      expect(requirements.length, destination).toBeGreaterThan(2);
      for (const { label } of requirements) {
        const stored = buildStoredDocumentName(label, "scan.pdf");
        const states = deriveChecklistStates(destination, projectType, [{ documentType: "autre", documentName: stored, verificationStatus: "pending" }]);
        const line = states.find((item) => item.requirement.label === label);
        expect(line?.state.kind, `${destination} / ${label}`).toBe("received");
      }
    }
  });

  it("une pièce sans intitulé (« Autre document ») ne coche aucune ligne par erreur", () => {
    const states = deriveChecklistStates("Canada", "etudes", [{ documentType: "autre", documentName: buildStoredDocumentName("", "scan.pdf"), verificationStatus: "pending" }]);
    expect(states.every((item) => item.state.kind === "missing")).toBe(true);
  });
});

describe("liste des pièces selon le pays et le type de visa", () => {
  it("diffère selon la destination et le projet, et reprend les lignes de la checklist", () => {
    const canada = buildRequirementOptions("Canada", "etudes").map((o) => o.label);
    const allemagne = buildRequirementOptions("Allemagne", "travail").map((o) => o.label);
    expect(canada).not.toEqual(allemagne);
    render(<DossierDocumentChecklist destination="Canada" projectType="etudes" documents={[]} />);
    for (const label of canada) expect(screen.getAllByText(label).length, label).toBeGreaterThan(0);
  });

  it("chaque option porte son groupe ; pas de doublon ; les demandes du conseiller s'ajoutent, les pièces dispensées non", () => {
    const options = buildRequirementOptions("Canada", "etudes", [
      { documentType: "Lettre de parrainage", status: "pending" },
      { documentType: "Passeport valide", status: "pending" },
      { documentType: "Pièce dispensée", status: "waived" },
    ]);
    expect(options.every((option) => option.group && option.label)).toBe(true);
    const keys = options.map((option) => option.label.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
    expect(options.find((option) => option.label === "Lettre de parrainage")?.group).toBe("Demande de votre conseiller");
    expect(options.some((option) => option.label === "Pièce dispensée")).toBe(false);
  });

  it("sans destination : liste de base, jamais vide", () => {
    expect(buildRequirementOptions(null, null).length).toBeGreaterThan(0);
  });
});

describe("téléverseur : choix de la pièce du pays et du visa", () => {
  const options = [
    { label: "Passeport valide", group: "Identité" },
    { label: "Acte de naissance", group: "État civil" },
    { label: "Lettre d’admission", group: "Études" },
  ];
  const addFile = (container: HTMLElement, name = "scan.pdf") => {
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File([new Uint8Array(400)], name, { type: "application/pdf" })] } });
  };

  it("propose les pièces groupées, pas une catégorie générique", () => {
    render(<DocumentUploader dossierNumber="3M-1" requirementOptions={options} />);
    const select = screen.getByLabelText("Quelle pièce envoyez-vous ?") as HTMLSelectElement;
    expect(Array.from(select.querySelectorAll("optgroup")).map((group) => group.label)).toEqual(["Identité", "État civil", "Études"]);
    expect(screen.getByText("Autre document (non listé)")).toBeTruthy();
    expect(screen.queryByText("Catégorie du document")).toBeNull();
  });

  it("l'envoi est bloqué tant que la pièce n'est pas choisie, puis part avec la catégorie et l'intitulé", async () => {
    const { container } = render(<DocumentUploader dossierNumber="3M-1" requirementOptions={options} />);
    addFile(container);
    expect(screen.getByRole("status").textContent).toContain("Choisissez la pièce concernée");
    expect((screen.getByText(/Téléverser 1 fichier/).closest("button") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Quelle pièce envoyez-vous ?"), { target: { value: "Acte de naissance" } });
    const upload = screen.getByText(/Téléverser 1 fichier/).closest("button") as HTMLButtonElement;
    expect(upload.disabled).toBe(false);
    fireEvent.click(upload);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("fileType")).toBe("birth_certificate");
    expect(body.get("requirementLabel")).toBe("Acte de naissance");
  });

  it("la pièce choisie avant d'ajouter le fichier s'applique directement ; « Autre document » n'envoie pas d'intitulé", async () => {
    const { container } = render(<DocumentUploader dossierNumber="3M-1" requirementOptions={options} />);
    fireEvent.change(screen.getByLabelText("Quelle pièce envoyez-vous ?"), { target: { value: "__other" } });
    addFile(container, "divers.pdf");
    fireEvent.click(screen.getByText(/Téléverser 1 fichier/).closest("button") as HTMLButtonElement);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("fileType")).toBe("other");
    expect(body.get("requirementLabel")).toBeNull();
  });

  it("chaque fichier peut avoir sa propre pièce", async () => {
    const { container } = render(<DocumentUploader dossierNumber="3M-1" requirementOptions={options} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File([new Uint8Array(400)], "a.pdf", { type: "application/pdf" }), new File([new Uint8Array(400)], "b.pdf", { type: "application/pdf" })] } });
    fireEvent.change(screen.getByLabelText("Pièce demandée pour a.pdf"), { target: { value: "Passeport valide" } });
    fireEvent.change(screen.getByLabelText("Pièce demandée pour b.pdf"), { target: { value: "Lettre d’admission" } });
    fireEvent.click(screen.getByText(/Téléverser 2 fichiers/).closest("button") as HTMLButtonElement);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const sent = fetchMock.mock.calls.map((call) => [(call[1].body as FormData).get("requirementLabel"), (call[1].body as FormData).get("fileType")]);
    expect(sent).toEqual([["Passeport valide", "passport"], ["Lettre d’admission", "education_documents"]]);
  });

  it("sans liste (autre usage du téléverseur) : l'ancien choix de catégorie reste", () => {
    render(<DocumentUploader dossierNumber="3M-1" />);
    expect(screen.getByText("Catégorie du document")).toBeTruthy();
    expect(screen.queryByLabelText("Quelle pièce envoyez-vous ?")).toBeNull();
  });
});
