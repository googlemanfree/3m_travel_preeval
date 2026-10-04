import { describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(async (key: string) => `https://cdn.example.com/signed/${key}?sig=abc`) }));

import { isOpenableStoredUrl, storageKeyFromStoredUrl } from "../shared/storedFileUrl";
import { loadCvExcerpt } from "./services/cvTextLoader";
import { storageGetSignedUrl } from "./storage";

/**
 * Ce que `storagePut` enregistre réellement en base pour un CV : « /manus-storage/<clé> », jamais une adresse https absolue.
 * Les anciens tests utilisaient un faux « https://files.example.com/… » et ne pouvaient donc pas voir que ni le lien admin
 * ni la lecture du CV par l'analyse (avec consentement) ne fonctionnaient avec la vraie valeur.
 */
const REAL_STORED_CV = "/manus-storage/cv-uploads/1760000000000_cv-aicha-nkolo_a1b2c3d4.pdf";

describe("adresse de fichier enregistrée", () => {
  it("la clé de stockage est extraite d'une adresse du stockage, rien d'autre", () => {
    expect(storageKeyFromStoredUrl(REAL_STORED_CV)).toBe("cv-uploads/1760000000000_cv-aicha-nkolo_a1b2c3d4.pdf");
    for (const bad of ["https://files.example.com/cv.pdf", "", null, undefined, "/manus-storage/", "/manus-storage//etc/passwd", "/manus-storage/../secret.pdf", "/manus-storage/a/./b.pdf", "/manus-storage/a b.pdf", "/manus-storage/a?x=1", "manus-storage/cv.pdf", "javascript:alert(1)"]) {
      expect(storageKeyFromStoredUrl(bad as any), String(bad)).toBeNull();
    }
  });

  it("n'est ouvrable que si https(s) absolu ou fichier du stockage : jamais javascript:, data:, ni un chemin quelconque du site", () => {
    expect(isOpenableStoredUrl(REAL_STORED_CV)).toBe(true);
    expect(isOpenableStoredUrl("https://files.example.com/cv.pdf")).toBe(true);
    for (const bad of ["javascript:alert(1)", "data:text/html,<script>1</script>", "/admin", "/api/trpc/x", "/manus-storage/../x", "", null, undefined]) {
      expect(isOpenableStoredUrl(bad as any), String(bad)).toBe(false);
    }
  });
});

describe("lecture du CV par l'analyse préparatoire avec la vraie adresse enregistrée", () => {
  const pdf = Buffer.from("%PDF-1.4 contenu");
  const deps = (overrides: Record<string, unknown> = {}) => ({
    fetchFile: vi.fn(async () => pdf),
    pdfPageCount: vi.fn(async () => 1),
    pdfText: vi.fn(async () => "Aïcha Nkolo — comptable, 6 ans d'expérience, Excel et SAGE, licence en gestion. ".repeat(8)),
    ...overrides,
  });

  it("une adresse « /manus-storage/… » est convertie en lien signé https puis lue (avant : refusée sans bruit, analyse sans CV)", async () => {
    const d = deps();
    const result = await loadCvExcerpt(REAL_STORED_CV, d as any);
    expect(result).not.toBeNull();
    expect(storageGetSignedUrl).toHaveBeenCalledWith("cv-uploads/1760000000000_cv-aicha-nkolo_a1b2c3d4.pdf");
    expect(d.fetchFile).toHaveBeenCalledWith("https://cdn.example.com/signed/cv-uploads/1760000000000_cv-aicha-nkolo_a1b2c3d4.pdf?sig=abc");
  });

  it("une adresse https absolue déjà utilisable n'est pas retraitée", async () => {
    const d = deps();
    vi.mocked(storageGetSignedUrl).mockClear();
    await loadCvExcerpt("https://files.example.com/cv.pdf", d as any);
    expect(storageGetSignedUrl).not.toHaveBeenCalled();
    expect(d.fetchFile).toHaveBeenCalledWith("https://files.example.com/cv.pdf");
  });

  it("clé suspecte, stockage indisponible ou lien signé non sûr : aucun téléchargement, analyse sans CV, jamais d'exception", async () => {
    const d = deps();
    expect(await loadCvExcerpt("/manus-storage/../secret.pdf", d as any)).toBeNull();
    expect(await loadCvExcerpt("/etc/passwd", d as any)).toBeNull();
    expect(d.fetchFile).not.toHaveBeenCalled();
    expect(await loadCvExcerpt(REAL_STORED_CV, deps({ resolveStoredUrl: vi.fn(async () => { throw new Error("stockage indisponible"); }) }) as any)).toBeNull();
    const unsafe = deps({ resolveStoredUrl: vi.fn(async () => "http://169.254.169.254/latest") });
    expect(await loadCvExcerpt(REAL_STORED_CV, unsafe as any)).toBeNull();
    expect((unsafe as any).fetchFile).not.toHaveBeenCalled();
  });
});
