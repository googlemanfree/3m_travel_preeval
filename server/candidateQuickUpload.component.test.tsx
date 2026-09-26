// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;

vi.mock("@/hooks/useCandidateAuth", () => ({ getCandidateToken: () => "token-test", useCandidateAuth: () => ({ isAuthenticated: true }) }));

import { categoryForRequirement, uploadCandidateDocument, validateCandidateFile } from "@/lib/candidateUpload";
import RequirementQuickUpload from "@/components/RequirementQuickUpload";
import DossierDocumentChecklist from "@/components/DossierDocumentChecklist";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const pdf = (name = "passeport.pdf", size = 2048) => new File([new Uint8Array(size)], name, { type: "application/pdf" });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
  (globalThis as any).fetch = fetchMock;
});
afterEach(cleanup);

describe("contrôle d'un fichier avant envoi", () => {
  it("accepte PDF, images et Word", () => {
    for (const name of ["a.pdf", "b.JPG", "c.png", "d.webp", "e.docx", "f.doc"]) expect(validateCandidateFile({ name, size: 1000 }).ok, name).toBe(true);
  });

  it("refuse avec un message clair : vide, trop lourd, format inconnu, HEIC", () => {
    expect(validateCandidateFile({ name: "a.pdf", size: 0 }).message).toContain("vide");
    expect(validateCandidateFile({ name: "a.pdf", size: 11 * 1024 * 1024 }).message).toMatch(/trop volumineux.*10 Mo/);
    expect(validateCandidateFile({ name: "a.exe", size: 100 }).message).toContain("Format non accepté");
    const heic = validateCandidateFile({ name: "IMG_1.HEIC", size: 100, type: "image/heic" });
    expect(heic.ok).toBe(false);
    expect(heic.message).toMatch(/HEIC.*JPEG/);
    expect(validateCandidateFile({ name: "IMG_2.heic", size: 100, type: "" }).message).toMatch(/HEIC.*JPEG/);
  });
});

describe("catégorie déduite de la pièce demandée", () => {
  it("chaque intitulé courant mène à une catégorie que le serveur accepte", () => {
    const server = read("server/routers/candidateUpload.ts");
    const expected: Record<string, string> = {
      "Passeport valide": "passport",
      "Photo d’identité": "photo_identite",
      "Acte de naissance": "birth_certificate",
      "Justificatif de domicile": "proof_of_residence",
      "Justificatifs de ressources": "financial_documents",
      "Lettre de l’employeur": "employment_letter",
      "Diplômes et relevés de notes": "education_documents",
      "Certificat médical": "medical_documents",
      "Casier judiciaire": "police_certificate",
      "Test de langue (IELTS)": "language_test",
      "CV": "cv",
      "Curriculum vitae": "cv",
      "Objet inconnu": "other",
    };
    for (const [label, category] of Object.entries(expected)) {
      expect(categoryForRequirement(label), label).toBe(category);
      expect(server, category).toContain(`${category}:`);
    }
  });
});

describe("envoi vers le serveur", () => {
  it("envoie le fichier avec la catégorie et le jeton du candidat", async () => {
    const result = await uploadCandidateDocument({ file: pdf(), category: "passport" });
    expect(result.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/candidate/upload");
    expect(init.headers.Authorization).toBe("Bearer token-test");
    expect((init.body as FormData).get("fileType")).toBe("passport");
    expect(((init.body as FormData).get("file") as File).name).toBe("passeport.pdf");
  });

  it("n'envoie rien pour un fichier invalide ; relaie le motif du serveur ; gère une coupure réseau", async () => {
    expect((await uploadCandidateDocument({ file: new File([], "vide.pdf"), category: "other" })).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Passeport illisible" }) });
    expect((await uploadCandidateDocument({ file: pdf(), category: "passport" })).message).toBe("Passeport illisible");
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect((await uploadCandidateDocument({ file: pdf(), category: "passport" })).message).toContain("Connexion interrompue");
  });
});

describe("bouton d'envoi direct d'une pièce demandée", () => {
  it("choisir un fichier l'envoie tout de suite, sans catégorie à choisir ni seconde validation", async () => {
    const onUploaded = vi.fn();
    render(<RequirementQuickUpload label="Passeport valide" onUploaded={onUploaded} />);
    fireEvent.change(screen.getByTestId("quick-upload-file"), { target: { files: [pdf()] } });
    await waitFor(() => expect(screen.getByTestId("requirement-quick-upload").getAttribute("data-state")).toBe("done"));
    expect((fetchMock.mock.calls[0][1].body as FormData).get("fileType")).toBe("passport");
    expect(onUploaded).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toContain("passeport.pdf envoyé");
  });

  it("la photo prise avec le téléphone suit le même chemin (capture de l'appareil photo)", async () => {
    render(<RequirementQuickUpload label="Photo d’identité" />);
    const camera = screen.getByTestId("quick-upload-camera");
    expect(camera.getAttribute("capture")).toBe("environment");
    fireEvent.change(camera, { target: { files: [new File([new Uint8Array(500)], "photo.jpg", { type: "image/jpeg" })] } });
    await waitFor(() => expect(screen.getByTestId("requirement-quick-upload").getAttribute("data-state")).toBe("done"));
    expect((fetchMock.mock.calls[0][1].body as FormData).get("fileType")).toBe("photo_identite");
  });

  it("un échec montre le motif et propose de réessayer avec le même fichier", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Fichier illisible" }) });
    render(<RequirementQuickUpload label="Acte de naissance" />);
    fireEvent.change(screen.getByTestId("quick-upload-file"), { target: { files: [pdf("acte.pdf")] } });
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Fichier illisible"));
    fireEvent.click(screen.getByText("Réessayer"));
    await waitFor(() => expect(screen.getByTestId("requirement-quick-upload").getAttribute("data-state")).toBe("done"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("un fichier refusé avant envoi n'appelle pas le serveur et explique pourquoi", async () => {
    render(<RequirementQuickUpload label="Passeport valide" />);
    fireEvent.change(screen.getByTestId("quick-upload-file"), { target: { files: [new File([new Uint8Array(10)], "scan.exe")] } });
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Format non accepté"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("checklist documentaire : chaque pièce à fournir s'envoie directement", () => {
  it("une pièce manquante a son bouton d'envoi ; une pièce reçue n'en a pas", () => {
    render(<DossierDocumentChecklist destination="Canada" projectType="etudes" documents={[{ documentType: "passport", documentName: "passeport.pdf", verificationStatus: "pending" }]} onUploaded={() => undefined} />);
    const buttons = screen.getAllByTestId("requirement-quick-upload");
    expect(buttons.length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Envoyer : Passeport valide")).toBeNull();
  });

  it("une pièce rejetée propose une nouvelle version", () => {
    render(<DossierDocumentChecklist destination="Canada" projectType="etudes" documents={[{ documentType: "passport", documentName: "passeport.pdf", verificationStatus: "rejected" }]} onUploaded={() => undefined} />);
    expect(screen.getAllByText("Envoyer une nouvelle version").length).toBeGreaterThan(0);
  });

  it("sans gestionnaire d'envoi, l'ancien lien « Déposer cette pièce » reste disponible", () => {
    render(<DossierDocumentChecklist destination="Canada" projectType="etudes" documents={[]} onOpenDocuments={() => undefined} />);
    expect(screen.queryAllByTestId("requirement-quick-upload")).toHaveLength(0);
    expect(screen.getAllByText("Déposer cette pièce").length).toBeGreaterThan(0);
  });

  it("l'espace client active l'envoi direct et rafraîchit la liste après un dépôt", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space.match(/onUploaded=\{refreshDocuments\}/g)!.length).toBe(2);
    expect(space).toContain("const refreshDocuments = () =>");
  });
});
