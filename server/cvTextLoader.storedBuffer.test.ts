import { describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(async (key: string) => `https://cdn.example.com/signed/${key}?sig=abc`) }));

import { loadStoredCvBuffer } from "./services/cvTextLoader";

describe("loadStoredCvBuffer", () => {
  it("transforme l'adresse du site en lien signé, puis télécharge côté serveur", async () => {
    const fetchFile = vi.fn(async () => Buffer.from("%PDF-1.4 contenu"));

    const buffer = await loadStoredCvBuffer("/manus-storage/cv/jean.pdf", { fetchFile });

    expect(fetchFile).toHaveBeenCalledWith("https://cdn.example.com/signed/cv/jean.pdf?sig=abc");
    expect(buffer?.toString()).toContain("%PDF");
  });

  it("refuse une adresse locale ou privée (pas d'accès au réseau interne)", async () => {
    const fetchFile = vi.fn();

    expect(await loadStoredCvBuffer("https://169.254.169.254/latest/meta-data", { fetchFile })).toBeNull();
    expect(await loadStoredCvBuffer("http://example.com/cv.pdf", { fetchFile })).toBeNull();
    expect(await loadStoredCvBuffer("/manus-storage/../secret", { fetchFile, resolveStoredUrl: async (url) => url })).toBeNull();
    expect(fetchFile).not.toHaveBeenCalled();
  });

  it("ne lève jamais : un échec réseau donne null", async () => {
    const fetchFile = vi.fn(async () => { throw new Error("réseau coupé"); });

    expect(await loadStoredCvBuffer("/manus-storage/cv/jean.pdf", { fetchFile })).toBeNull();
    expect(await loadStoredCvBuffer(null)).toBeNull();
  });
});
