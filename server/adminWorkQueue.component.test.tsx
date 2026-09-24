// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import EvaluationWorkQueue from "@/components/EvaluationWorkQueue";
import { INFO_STALE_DAYS, computeWorkQueue, evaluationIdOf, type WorkQueueItem, type WorkQueueStatus } from "@/lib/adminWorkQueue";

afterEach(cleanup);

// 24 septembre 2026, 10 h (heure locale du test)
const NOW = new Date(2026, 8, 24, 10, 0, 0).getTime();
const hoursFromNow = (hours: number) => new Date(NOW + hours * 3_600_000);
const item = (id: number, over: Partial<WorkQueueItem> = {}): WorkQueueItem => ({ id: `evaluation-${id}`, type: "evaluation", fullName: `Candidat ${id}`, destinationCountry: "Canada", reviewDeadline: hoursFromNow(-30), reviewedAt: null, finalResponseSentAt: null, status: "pending", ...over });
const statuses = (entries: Array<[number, WorkQueueStatus["status"], string?]>) => new Map<number, WorkQueueStatus>(entries.map(([id, status, updatedAt]) => [id, { status, updatedAt: updatedAt ?? null }]));

describe("file « à traiter aujourd'hui »", () => {
  it("classe échéance dépassée, échéance du jour et complément sans réponse, dans cet ordre", () => {
    const queue = computeWorkQueue({
      now: NOW,
      items: [
        item(1, { reviewDeadline: hoursFromNow(-2) }), // dépassée de 2 h
        item(2, { reviewDeadline: hoursFromNow(5) }), // aujourd'hui à 15 h
        item(3), // dépassée de 30 h
        item(4, { reviewDeadline: hoursFromNow(-1) }),
      ],
      statuses: statuses([[1, "attente_validation_admin"], [2, "en_revue_admin"], [3, "dossier_recu"], [4, "informations_complementaires", hoursFromNow(-24 * 4).toISOString()]]),
    });
    expect(queue.entries.map((entry) => `${entry.key}:${entry.evaluationId}`)).toEqual(["overdue:3", "overdue:1", "due_today:2", "info_stale:4"]);
    expect(queue.counts).toEqual({ overdue: 2, due_today: 1, info_stale: 1 });
    expect(queue.entries[0].detail).toBe("Échéance dépassée de 30 h");
    expect(queue.entries[3].detail).toBe("Demande envoyée il y a 4 jours, sans réponse");
  });

  it("ne remonte pas ce qui est publié, déjà relu, à échéance lointaine ou sans échéance", () => {
    const queue = computeWorkQueue({
      now: NOW,
      items: [
        item(1), // publié
        item(2, { reviewDeadline: hoursFromNow(48) }), // demain ou plus tard
        item(3, { reviewDeadline: null }),
        item(4, { reviewedAt: hoursFromNow(-5) }), // ancien parcours déjà relu
        item(5, { finalResponseSentAt: hoursFromNow(-5) }),
        item(6, { status: "validated_sent" }),
      ],
      statuses: statuses([[1, "validee_publiee"], [2, "attente_validation_admin"], [3, "attente_validation_admin"]]),
    });
    expect(queue.entries).toEqual([]);
  });

  it("une évaluation restée sur l'ancien parcours (sans dossier structuré) et non relue est prise en compte", () => {
    const queue = computeWorkQueue({ now: NOW, items: [item(7)], statuses: statuses([]) });
    expect(queue.counts.overdue).toBe(1);
  });

  it("un complément récent n'est pas « sans réponse »", () => {
    const recent = hoursFromNow(-(INFO_STALE_DAYS * 24) + 1).toISOString();
    const old = hoursFromNow(-(INFO_STALE_DAYS * 24)).toISOString();
    expect(computeWorkQueue({ now: NOW, items: [item(1)], statuses: statuses([[1, "informations_complementaires", recent]]) }).counts.info_stale).toBe(0);
    expect(computeWorkQueue({ now: NOW, items: [item(1)], statuses: statuses([[1, "informations_complementaires", old]]) }).counts.info_stale).toBe(1);
    expect(computeWorkQueue({ now: NOW, items: [item(1)], statuses: statuses([[1, "informations_complementaires", null as any]]) }).counts.info_stale).toBe(0);
  });

  it("ignore les éléments qui ne sont pas des évaluations et les dates illisibles", () => {
    expect(evaluationIdOf({ id: "consultation-12", type: "consultation" })).toBeNull();
    expect(evaluationIdOf({ id: "evaluation-abc", type: "evaluation" })).toBeNull();
    expect(evaluationIdOf({ id: "evaluation-12", type: "evaluation" })).toBe(12);
    const queue = computeWorkQueue({ now: NOW, items: [item(1, { type: "consultation", id: "consultation-1" }), item(2, { reviewDeadline: "pas une date" })], statuses: statuses([[2, "attente_validation_admin"]]) });
    expect(queue.entries).toEqual([]);
  });

  it("ne relance rien et ne décide rien : aucun texte de promesse ni d'envoi", () => {
    const queue = computeWorkQueue({ now: NOW, items: [item(1), item(2, { reviewDeadline: hoursFromNow(3) })], statuses: statuses([]) });
    expect(JSON.stringify(queue.entries)).not.toMatch(/envoy(é|er)|relanc|garanti/i);
  });
});

describe("barre « À traiter aujourd'hui »", () => {
  const queue = computeWorkQueue({
    now: NOW,
    items: [item(1), item(2, { reviewDeadline: hoursFromNow(4) }), item(3, { fullName: "Aïcha Nkolo" })],
    statuses: statuses([[1, "attente_validation_admin"], [2, "en_revue_admin"], [3, "informations_complementaires", hoursFromNow(-24 * 5).toISOString()]]),
  });

  it("affiche les compteurs, les premiers dossiers, et filtre au clic (puis se défiltre)", () => {
    const onSelect = vi.fn();
    render(<EvaluationWorkQueue queue={queue} active={null} onSelect={onSelect} />);
    expect(screen.getByRole("heading", { name: "À traiter aujourd’hui · 3" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Échéance dépassée \(1\)/ })).toBeTruthy();
    expect(screen.getByText(/Aïcha Nkolo/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Complément sans réponse \(1\)/ }));
    expect(onSelect).toHaveBeenCalledWith("info_stale");
    cleanup();
    render(<EvaluationWorkQueue queue={queue} active="info_stale" onSelect={onSelect} />);
    expect(screen.getByRole("button", { name: /Complément sans réponse/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByText(/Candidat 1/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Complément sans réponse/ }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("file vide : message rassurant et boutons inactifs ; chargement : pas de faux « rien à faire »", () => {
    const empty = computeWorkQueue({ now: NOW, items: [], statuses: statuses([]) });
    const { rerender } = render(<EvaluationWorkQueue queue={empty} active={null} onSelect={vi.fn()} />);
    expect(screen.getByText(/Rien d’en retard/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Échéance dépassée/ }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<EvaluationWorkQueue queue={empty} active={null} onSelect={vi.fn()} loading />);
    expect(screen.queryByText(/Rien d’en retard/)).toBeNull();
    expect(screen.getByText(/Chargement des statuts/)).toBeTruthy();
  });
});
