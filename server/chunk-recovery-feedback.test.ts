import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("chunk recovery feedback contracts", () => {
  it("shows a 15-second accessible countdown while a page loads", () => {
    const fallback = readProjectFile("client/src/components/PageLoadingFallback.tsx");

    expect(fallback).toContain("LAZY_PAGE_TIMEOUT_MS");
    expect(fallback).toContain("secondsLeft");
    expect(fallback).toContain("progressbar");
    expect(fallback).toContain("Nouvelle tentative automatique dans");
    expect(fallback).toContain("Récupération automatique en cours");
    expect(fallback).toContain("Nous préparons votre espace");
    expect(fallback).toContain("3M Travel &amp; Services");
    expect(fallback).toContain("motion-safe:animate-pulse");
  });

  it("offers a manual retry on the error screen and marks the reload reason", () => {
    const boundary = readProjectFile("client/src/components/ErrorBoundary.tsx");

    expect(boundary).toContain("handleManualRetry");
    expect(boundary).toContain("Réessayer la page");
    expect(boundary).toContain("CHUNK_RELOAD_NOTICE_KEY");
    expect(boundary).toContain("reloadPageAfterChunkFailure");
  });

  it("notifies before and after a network-triggered reload", () => {
    const main = readProjectFile("client/src/main.tsx");
    const notice = readProjectFile("client/src/components/ChunkReloadNotice.tsx");
    const app = readProjectFile("client/src/App.tsx");

    expect(main).toContain('toast.info("Problème réseau détecté"');
    expect(main).toContain("CHUNK_RELOAD_NOTICE_KEY");
    expect(notice).toContain("Rechargement automatique terminé");
    expect(notice).toContain("problème réseau");
    expect(app).toContain("<ChunkReloadNotice />");
  });
});
