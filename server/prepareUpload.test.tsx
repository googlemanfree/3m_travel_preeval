// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;

vi.mock("@/hooks/useCandidateAuth", () => ({ getCandidateToken: () => "token-test", useCandidateAuth: () => ({ isAuthenticated: true }) }));

const prep = vi.hoisted(() => ({
  prepare: vi.fn(),
  merge: vi.fn(),
}));
vi.mock("@/lib/prepareUpload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/prepareUpload")>()),
  prepareFileForUpload: (file: File) => prep.prepare(file),
  imagesToPdf: (files: File[], name: string) => prep.merge(files, name),
}));

import { analyzePixels, fitOnPage, fitWithin, isHeic, isImage, readabilityWarnings, LIGHT_TOO_BRIGHT } from "@/lib/prepareUpload";
import RequirementQuickUpload from "@/components/RequirementQuickUpload";
import { DocumentUploader } from "@/components/DocumentUploader";

const image = (name = "photo.jpg") => new File([new Uint8Array(500)], name, { type: "image/jpeg" });
const rgba = (width: number, height: number, pixel: (x: number, y: number) => number) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const value = pixel(x, y);
    const index = (y * width + x) * 4;
    data[index] = data[index + 1] = data[index + 2] = value;
    data[index + 3] = 255;
  }
  return data;
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
  (globalThis as any).fetch = fetchMock;
  prep.prepare.mockReset();
  prep.merge.mockReset();
  prep.prepare.mockImplementation(async (file: File) => ({ file, notes: [], warnings: [] }));
});
afterEach(cleanup);

describe("calculs de préparation (purs)", () => {
  it("réduit le côté le plus long sans jamais agrandir", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 2200, height: 1650 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 1650, height: 2200 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(5000, 10, 100).height).toBeGreaterThanOrEqual(1);
  });

  it("mesure la luminance et la netteté : sombre, très clair, flou (uni), net (damier)", () => {
    const dark = analyzePixels(rgba(32, 32, () => 10), 32, 32);
    expect(dark.meanLuma).toBeLessThan(45);
    expect(readabilityWarnings(dark).join(" ")).toContain("sombre");
    const bright = analyzePixels(rgba(32, 32, () => 255), 32, 32);
    expect(bright.meanLuma).toBeGreaterThan(LIGHT_TOO_BRIGHT);
    expect(readabilityWarnings(bright).join(" ")).toContain("claire");
    const flat = analyzePixels(rgba(32, 32, () => 128), 32, 32);
    expect(readabilityWarnings(flat).join(" ")).toContain("floue");
    const sharp = analyzePixels(rgba(32, 32, (x, y) => ((x + y) % 2 === 0 ? 30 : 220)), 32, 32);
    expect(sharp.sharpness).toBeGreaterThan(flat.sharpness);
    expect(readabilityWarnings(sharp)).toEqual([]);
  });

  it("données absentes ou trop petites : aucune fausse alerte", () => {
    expect(readabilityWarnings(analyzePixels([], 0, 0))).toEqual([]);
    expect(readabilityWarnings(analyzePixels(rgba(2, 2, () => 128), 2, 2))).toEqual([]);
  });

  it("place l'image sur la page A4 : centrée, dans les marges, proportions conservées", () => {
    const box = fitOnPage(2000, 1000);
    expect(box.x).toBeGreaterThanOrEqual(24 - 0.01);
    expect(box.x + box.width).toBeLessThanOrEqual(595.28 - 24 + 0.01);
    expect(box.width / box.height).toBeCloseTo(2, 5);
    expect(box.x * 2 + box.width).toBeCloseTo(595.28, 3);
  });

  it("reconnaît HEIC et les images", () => {
    expect(isHeic({ name: "IMG_1.HEIC" })).toBe(true);
    expect(isHeic({ name: "x", type: "image/heif" })).toBe(true);
    expect(isHeic({ name: "a.jpg", type: "image/jpeg" })).toBe(false);
    expect(isImage({ name: "a.PNG" })).toBe(true);
    expect(isImage({ name: "a.pdf", type: "application/pdf" })).toBe(false);
  });
});

describe("envoi direct : préparation avant l'envoi", () => {
  it("l'envoi part avec le fichier préparé (allégé) et le résultat est annoncé", async () => {
    const light = new File([new Uint8Array(100)], "photo.jpg", { type: "image/jpeg" });
    prep.prepare.mockResolvedValueOnce({ file: light, notes: ["Photo allégée : 4.0 Mo → 0.4 Mo."], warnings: [] });
    render(<RequirementQuickUpload label="Passeport valide" />);
    fireEvent.change(screen.getByTestId("quick-upload-file"), { target: { files: [image()] } });
    await waitFor(() => expect(screen.getByTestId("requirement-quick-upload").getAttribute("data-state")).toBe("done"));
    expect((fetchMock.mock.calls[0][1].body as FormData).get("file")).toBe(light);
    expect(screen.getByRole("status").textContent).toContain("Photo allégée");
  });

  it("une photo floue est signalée avant l'envoi : rien ne part tant que le candidat n'a pas choisi", async () => {
    prep.prepare.mockResolvedValueOnce({ file: image("floue.jpg"), notes: [], warnings: ["La photo semble floue : posez le document à plat et reprenez-la, sans bouger."] });
    render(<RequirementQuickUpload label="Passeport valide" />);
    fireEvent.change(screen.getByTestId("quick-upload-file"), { target: { files: [image("floue.jpg")] } });
    await waitFor(() => expect(screen.getByTestId("quick-upload-warning").textContent).toContain("floue"));
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Envoyer quand même"));
    await waitFor(() => expect(screen.getByTestId("requirement-quick-upload").getAttribute("data-state")).toBe("done"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("« Reprendre la photo » ouvre l'appareil photo sans rien envoyer", async () => {
    prep.prepare.mockResolvedValueOnce({ file: image(), notes: [], warnings: ["La photo est très sombre : reprenez-la dans un endroit plus éclairé."] });
    render(<RequirementQuickUpload label="Photo d’identité" />);
    const camera = screen.getByTestId("quick-upload-camera") as HTMLInputElement;
    const click = vi.spyOn(camera, "click");
    fireEvent.change(screen.getByTestId("quick-upload-file"), { target: { files: [image()] } });
    await waitFor(() => screen.getByText("Reprendre la photo"));
    fireEvent.click(screen.getByText("Reprendre la photo"));
    expect(click).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("plusieurs photos sont assemblées en un seul PDF, puis envoyées", async () => {
    const pdf = new File([new Uint8Array(300)], "Acte de naissance.pdf", { type: "application/pdf" });
    prep.merge.mockResolvedValueOnce({ file: pdf });
    render(<RequirementQuickUpload label="Acte de naissance" />);
    fireEvent.change(screen.getByTestId("quick-upload-file"), { target: { files: [image("recto.jpg"), image("verso.jpg")] } });
    await waitFor(() => expect(screen.getByTestId("requirement-quick-upload").getAttribute("data-state")).toBe("done"));
    expect(prep.merge).toHaveBeenCalledTimes(1);
    expect(prep.merge.mock.calls[0][1]).toBe("Acte de naissance");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0][1].body as FormData).get("file")).toBe(pdf);
    expect(screen.getByRole("status").textContent).toContain("2 photos assemblées");
  });

  it("plusieurs fichiers dont un PDF : message clair, rien n'est envoyé", async () => {
    render(<RequirementQuickUpload label="Acte de naissance" />);
    fireEvent.change(screen.getByTestId("quick-upload-file"), { target: { files: [image("a.jpg"), new File([new Uint8Array(10)], "b.pdf", { type: "application/pdf" })] } });
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("un seul fichier"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prep.merge).not.toHaveBeenCalled();
  });

  it("une photo illisible (HEIC non supporté) : l'erreur s'affiche, rien n'est envoyé", async () => {
    prep.prepare.mockResolvedValueOnce({ file: image("IMG.heic"), notes: [], warnings: [], error: "Cette photo HEIC ne peut pas être lue par votre navigateur." });
    render(<RequirementQuickUpload label="Passeport valide" />);
    fireEvent.change(screen.getByTestId("quick-upload-file"), { target: { files: [image("IMG.heic")] } });
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("HEIC"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("téléverseur complet : préparation des photos", () => {
  const addFiles = (container: HTMLElement, files: File[]) => fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files } });

  it("une photo floue affiche l'avertissement sur sa ligne, sans bloquer l'envoi", async () => {
    prep.prepare.mockImplementation(async (file: File) => ({ file, notes: [], warnings: ["La photo semble floue : posez le document à plat et reprenez-la, sans bouger."] }));
    const { container } = render(<DocumentUploader dossierNumber="3M-1" />);
    addFiles(container, [image("floue.jpg")]);
    await waitFor(() => expect(screen.getByTestId("file-warning").textContent).toContain("floue"));
    const upload = screen.getByText(/Téléverser 1 fichier/).closest("button") as HTMLButtonElement;
    expect(upload.disabled).toBe(false);
    fireEvent.click(upload);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("deux photos : le bouton d'assemblage les remplace par un seul PDF", async () => {
    const pdf = new File([new Uint8Array(300)], "document.pdf", { type: "application/pdf" });
    prep.merge.mockResolvedValueOnce({ file: pdf });
    const { container } = render(<DocumentUploader dossierNumber="3M-1" />);
    addFiles(container, [image("recto.jpg"), image("verso.jpg")]);
    await waitFor(() => screen.getByTestId("merge-photos"));
    fireEvent.click(screen.getByTestId("merge-photos"));
    await waitFor(() => screen.getByText("document.pdf"));
    expect(screen.queryByText("recto.jpg")).toBeNull();
    expect(screen.queryByTestId("merge-photos")).toBeNull();
    expect(screen.getByText("2 photos assemblées en un seul PDF.")).toBeTruthy();
  });

  it("une photo HEIC est acceptée à l'ajout (convertie ensuite) ; si la conversion échoue, l'erreur est claire", async () => {
    prep.prepare.mockResolvedValueOnce({ file: image("IMG.heic"), notes: [], warnings: [], error: "Cette photo HEIC ne peut pas être lue par votre navigateur." });
    const { container } = render(<DocumentUploader dossierNumber="3M-1" />);
    addFiles(container, [new File([new Uint8Array(50)], "IMG.heic", { type: "image/heic" })]);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("HEIC"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
