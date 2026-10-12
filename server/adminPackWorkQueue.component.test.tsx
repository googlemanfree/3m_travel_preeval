// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import ApplicationPackWorkQueue from "@/components/ApplicationPackWorkQueue";
import {
  computePackWorkQueue,
  packSuggestedAction,
  type PackQueueItem,
} from "@/lib/adminPackWorkQueue";

afterEach(cleanup);

const item = (id: number, over: Partial<PackQueueItem> = {}): PackQueueItem => ({
  id: `evaluation-${id}`,
  type: "evaluation",
  fullName: `Candidat ${id}`,
  destinationCountry: "Canada",
  hasConverted: false,
  applicationPackSummary: {
    saved: false,
    hasLetter: false,
    hasCvFile: true,
    readyToApply: false,
    style: null,
    language: null,
    savedAt: null,
  },
  ...over,
});

describe("file packs candidature (logique)", () => {
  it("classe prêt, incomplet et manquant, ignore convertis et sans CV", () => {
    const queue = computePackWorkQueue({
      items: [
        item(1, {
          applicationPackSummary: {
            saved: true,
            hasLetter: true,
            hasCvFile: true,
            readyToApply: true,
            style: "canada",
            language: "fr",
            savedAt: "2026-10-12T10:00:00.000Z",
          },
        }),
        item(2, {
          applicationPackSummary: {
            saved: true,
            hasLetter: false,
            hasCvFile: false,
            readyToApply: false,
            style: "europe",
            language: "fr",
            savedAt: "2026-10-11T10:00:00.000Z",
          },
        }),
        item(3),
        item(4, {
          applicationPackSummary: {
            saved: false,
            hasLetter: false,
            hasCvFile: false,
            readyToApply: false,
            style: null,
            language: null,
            savedAt: null,
          },
        }),
        item(5, { hasConverted: true }),
        item(6, { type: "consultation", id: "consultation-6" }),
      ],
    });
    expect(queue.entries.map((entry) => `${entry.key}:${entry.evaluationId}`)).toEqual([
      "pack_ready:1",
      "pack_incomplete:2",
      "pack_missing:3",
    ]);
    expect(queue.counts).toEqual({ pack_ready: 1, pack_incomplete: 1, pack_missing: 1 });
  });

  it("propose une action admin lisible sans promesse d’envoi automatique", () => {
    expect(packSuggestedAction({
      saved: false,
      hasLetter: false,
      hasCvFile: true,
      readyToApply: false,
    })).toContain("Préparer le pack CV");
    expect(packSuggestedAction({
      saved: true,
      hasLetter: true,
      hasCvFile: true,
      readyToApply: true,
    })).toContain("postuler au nom du client");
    expect(JSON.stringify([
      packSuggestedAction({ saved: true, hasLetter: false, hasCvFile: true, readyToApply: true }),
    ])).not.toMatch(/envoy(é|er)|garanti/i);
  });
});

describe("barre packs candidature", () => {
  const queue = computePackWorkQueue({
    items: [
      item(1, {
        fullName: "Aïcha Nkolo",
        applicationPackSummary: {
          saved: true,
          hasLetter: true,
          hasCvFile: true,
          readyToApply: true,
          style: "canada",
          language: "fr",
          savedAt: "2026-10-12T10:00:00.000Z",
        },
      }),
      item(2),
      item(3, {
        applicationPackSummary: {
          saved: true,
          hasLetter: false,
          hasCvFile: true,
          readyToApply: false,
          style: "europe",
          language: "fr",
          savedAt: "2026-10-10T10:00:00.000Z",
        },
      }),
    ],
  });

  it("affiche les compteurs et filtre au clic", () => {
    const onSelect = vi.fn();
    render(<ApplicationPackWorkQueue queue={queue} active={null} onSelect={onSelect} />);
    expect(screen.getByTestId("application-pack-work-queue")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Packs candidature · 3/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Pack prêt — postuler \(1\)/ })).toBeTruthy();
    expect(screen.getByText(/Aïcha Nkolo/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Pack CV à préparer \(1\)/ }));
    expect(onSelect).toHaveBeenCalledWith("pack_missing");
  });

  it("file vide : message neutre et boutons inactifs", () => {
    const empty = computePackWorkQueue({ items: [] });
    render(<ApplicationPackWorkQueue queue={empty} active={null} onSelect={vi.fn()} />);
    expect(screen.getByText(/Aucun pack à prioriser/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Pack prêt — postuler/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
