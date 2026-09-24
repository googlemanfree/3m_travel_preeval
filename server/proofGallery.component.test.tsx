// @vitest-environment jsdom
import React from "react";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

(globalThis as any).React = React;

import ProofGallerySection from "@/components/ProofGallerySection";
import { PROOF_COLLAPSED_COUNT, PROOF_PHOTOS, filterProofPhotos, neighbourIndex, proofFilterCounts } from "@/data/proofPhotos";

afterEach(cleanup);

const thumbnails = () => screen.getAllByRole("button").filter((button) => button.querySelector("img"));
const chip = (name: RegExp) => screen.getByRole("button", { name });

describe("données de la galerie", () => {
  it("classe chaque photo dans une catégorie et les effectifs se recoupent", () => {
    const counts = proofFilterCounts(PROOF_PHOTOS);
    expect(counts[0]).toEqual({ filter: "all", label: "Tous", count: PROOF_PHOTOS.length });
    expect(counts.slice(1).reduce((total, entry) => total + entry.count, 0)).toBe(PROOF_PHOTOS.length);
    expect(counts.map((entry) => entry.label)).toEqual(["Tous", "Canada", "Chine", "Schengen"]);
    expect(filterProofPhotos(PROOF_PHOTOS, "schengen").every((photo) => /schengen/i.test(photo.alt))).toBe(true);
    expect(filterProofPhotos(PROOF_PHOTOS, "canada").every((photo) => /canada|IRCC|résidence permanente/i.test(photo.alt))).toBe(true);
    expect(filterProofPhotos(PROOF_PHOTOS, "chine").every((photo) => /chine/i.test(photo.alt))).toBe(true);
  });

  it("chaque image existe sur le disque et se déclare masquée", () => {
    for (const photo of PROOF_PHOTOS) {
      expect(existsSync(resolve(import.meta.dirname, "../client/public", photo.src.replace(/^\//, ""))), photo.src).toBe(true);
      expect(photo.alt).toMatch(/masquées/);
    }
    expect(new Set(PROOF_PHOTOS.map((photo) => photo.src)).size).toBe(PROOF_PHOTOS.length); // pas de doublon
  });

  it("navigue en boucle dans le diaporama", () => {
    expect(neighbourIndex(0, 5, -1)).toBe(4);
    expect(neighbourIndex(4, 5, 1)).toBe(0);
    expect(neighbourIndex(2, 5, 1)).toBe(3);
    expect(neighbourIndex(0, 0, 1)).toBe(0);
  });
});

describe("galerie des preuves", () => {
  it("annonce le nombre de preuves publiées et n'en montre d'abord que quelques-unes", () => {
    render(<ProofGallerySection />);
    expect(screen.getByTestId("proof-count").textContent).toBe(`${PROOF_PHOTOS.length} preuves publiées`);
    expect(thumbnails()).toHaveLength(PROOF_COLLAPSED_COUNT);
    expect(screen.getByRole("button", { name: `Voir les ${PROOF_PHOTOS.length - PROOF_COLLAPSED_COUNT} autres preuves` })).toBeTruthy();
  });

  it("déplie puis replie la galerie", async () => {
    const user = userEvent.setup();
    render(<ProofGallerySection />);
    await user.click(screen.getByRole("button", { name: /Voir les \d+ autres preuves/ }));
    expect(thumbnails()).toHaveLength(PROOF_PHOTOS.length);
    await user.click(screen.getByRole("button", { name: "Réduire la galerie" }));
    expect(thumbnails()).toHaveLength(PROOF_COLLAPSED_COUNT);
  });

  it("filtre par destination, marque le filtre actif, et n'affiche plus le bouton « voir plus » quand il n'y a rien à replier", async () => {
    const user = userEvent.setup();
    render(<ProofGallerySection />);
    const chine = filterProofPhotos(PROOF_PHOTOS, "chine");
    await user.click(chip(/^Chine/));
    expect(chip(/^Chine/).getAttribute("aria-pressed")).toBe("true");
    expect(chip(/^Tous/).getAttribute("aria-pressed")).toBe("false");
    expect(thumbnails()).toHaveLength(chine.length);
    expect(screen.queryByRole("button", { name: /autres preuves|Réduire/ })).toBeNull(); // 4 photos : moins que le seuil
    for (const photo of chine) expect(screen.getByText(photo.caption)).toBeTruthy(); // les textes alternatifs sont identiques d'une photo à l'autre : on vérifie les légendes
    await user.click(chip(/^Schengen/));
    expect(thumbnails()).toHaveLength(PROOF_COLLAPSED_COUNT); // 9 : replié à 6
    expect(screen.getByRole("button", { name: `Voir les ${filterProofPhotos(PROOF_PHOTOS, "schengen").length - PROOF_COLLAPSED_COUNT} autres preuves` })).toBeTruthy();
  });

  it("le compteur global ne change pas avec le filtre, et changer de filtre replie la galerie", async () => {
    const user = userEvent.setup();
    render(<ProofGallerySection />);
    await user.click(screen.getByRole("button", { name: /Voir les \d+ autres preuves/ }));
    await user.click(chip(/^Schengen/));
    expect(screen.getByTestId("proof-count").textContent).toBe(`${PROOF_PHOTOS.length} preuves publiées`);
    expect(thumbnails()).toHaveLength(PROOF_COLLAPSED_COUNT);
  });

  it("ouvre une photo en grand, avec sa légende et sa position, et se ferme avec Échap en rendant le focus", async () => {
    const user = userEvent.setup();
    render(<ProofGallerySection />);
    const first = thumbnails()[0];
    await user.click(first);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toBe(PROOF_PHOTOS[0].caption);
    expect(within(dialog).getByText(`(1/${PROOF_PHOTOS.length})`)).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(first);
  });

  it("parcourt les photos avec les flèches et les boutons, en boucle, y compris celles repliées", async () => {
    const user = userEvent.setup();
    render(<ProofGallerySection />);
    await user.click(thumbnails()[0]);
    fireEvent.keyDown(window, { key: "ArrowLeft" }); // retour à la dernière : elle est repliée dans la grille mais dans le diaporama
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe(PROOF_PHOTOS[PROOF_PHOTOS.length - 1].caption);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe(PROOF_PHOTOS[0].caption);
    await user.click(screen.getByRole("button", { name: "Preuve suivante" }));
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe(PROOF_PHOTOS[1].caption);
    await user.click(screen.getByRole("button", { name: "Preuve précédente" }));
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe(PROOF_PHOTOS[0].caption);
  });

  it("ne parcourt que les photos du filtre courant", async () => {
    const user = userEvent.setup();
    render(<ProofGallerySection />);
    await user.click(chip(/^Chine/));
    await user.click(thumbnails()[0]);
    const chine = filterProofPhotos(PROOF_PHOTOS, "chine");
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe(chine[chine.length - 1].caption);
    expect(screen.getByText(`(${chine.length}/${chine.length})`)).toBeTruthy();
  });
});
