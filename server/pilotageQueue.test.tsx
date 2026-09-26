// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableName } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ data: undefined as any, error: null as any, loading: false }));
vi.mock("@/lib/trpc", () => ({
  trpc: { adminCandidateManagement: { getPilotageQueue: { useQuery: () => ({ data: state.data, error: state.error, isLoading: state.loading, isFetching: false, refetch: vi.fn() }) } } },
}));

import AdminPilotageQueue from "@/components/AdminPilotageQueue";
import { STALLED_AFTER_DAYS, ageInDays, documentsToReviewItem, rankPilotageItems, readyToActivateItem, severityFor, stalledItem, summarizePilotage } from "./services/pilotageQueue";
import { loadPilotageQueue } from "./services/pilotageQueueStore";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const now = new Date("2026-09-26T12:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
afterEach(cleanup);

describe("classement de la file de pilotage", () => {
  it("l'ancienneté se compte en jours entiers, jamais négative", () => {
    expect(ageInDays(daysAgo(3), now)).toBe(3);
    expect(ageInDays(new Date(now.getTime() + 86_400_000), now)).toBe(0);
    expect(ageInDays(null, now)).toBe(0);
    expect(ageInDays("pas une date", now)).toBe(0);
  });

  it("l'urgence monte avec l'ancienneté", () => {
    expect(severityFor("ready_to_activate", 0)).toBe("medium");
    expect(severityFor("ready_to_activate", 2)).toBe("high");
    expect(severityFor("documents_to_review", 0)).toBe("low");
    expect(severityFor("documents_to_review", 1)).toBe("medium");
    expect(severityFor("documents_to_review", 3)).toBe("high");
    expect(severityFor("stalled", 7)).toBe("medium");
    expect(severityFor("stalled", 14)).toBe("high");
  });

  it("un dossier n'est « sans mouvement » qu'après 7 jours", () => {
    const base = { key: "a1", openId: "agency_1", reference: "3M-AGN-0001", fullName: "A", statusLabel: "Traitement en cours", now };
    expect(stalledItem({ ...base, lastMovement: daysAgo(STALLED_AFTER_DAYS - 1) })).toBeNull();
    expect(stalledItem({ ...base, lastMovement: daysAgo(STALLED_AFTER_DAYS) })?.ageDays).toBe(STALLED_AFTER_DAYS);
  });

  it("les plus urgents et les plus anciens d'abord ; les compteurs suivent", () => {
    const items = [
      documentsToReviewItem({ key: "c1", openId: "account_1", reference: "COMPTE-00001", fullName: "Zoé", count: 1, oldest: daysAgo(0), now }),
      readyToActivateItem({ candidateId: 2, reference: "COMPTE-00002", fullName: "Paul", destination: "canada", since: daysAgo(5), now }),
      stalledItem({ key: "o1", openId: "online_1", reference: "3M-2026-0001", fullName: "Aïcha", statusLabel: "x", lastMovement: daysAgo(20), now })!,
      documentsToReviewItem({ key: "c3", openId: "account_3", reference: "COMPTE-00003", fullName: "Marc", count: 4, oldest: daysAgo(4), now }),
    ];
    const ranked = rankPilotageItems(items);
    expect(ranked.map((item) => item.fullName)).toEqual(["Aïcha", "Paul", "Marc", "Zoé"]);
    expect(summarizePilotage(items)).toEqual({ readyToActivate: 1, documentsToReview: 2, stalled: 1, high: 3, total: 4 });
  });

  it("l'urgence prime sur l'ancienneté : un dossier « à traiter » très ancien passe après un « urgent » plus récent", () => {
    const medium = stalledItem({ key: "o2", openId: "online_2", reference: "3M-2026-0002", fullName: "Ancien", statusLabel: "x", lastMovement: daysAgo(9), now })!;
    const high = documentsToReviewItem({ key: "c9", openId: "account_9", reference: "COMPTE-00009", fullName: "Urgent", count: 2, oldest: daysAgo(3), now });
    expect(medium.severity).toBe("medium");
    expect(medium.ageDays).toBeGreaterThan(high.ageDays);
    expect(rankPilotageItems([medium, high]).map((item) => item.fullName)).toEqual(["Urgent", "Ancien"]);
  });

  it("le texte d'un prêt à activer rappelle l'attribution du numéro 3M-", () => {
    expect(readyToActivateItem({ candidateId: 2, reference: "COMPTE-00002", fullName: "Paul", since: daysAgo(1), now }).detail).toContain("3M-");
  });
});

describe("chargement de la file (base simulée)", () => {
  const rows: Record<string, unknown[]> = {
    "candidates:id,fullName,email,destination,reviewedAt": [
      { id: 12, fullName: "Aïcha Nkolo", email: "aicha@example.com", destination: "canada", reviewedAt: daysAgo(6) },
      { id: 13, fullName: "Paul Mbarga", email: "paul@example.com", destination: "canada", reviewedAt: daysAgo(6) },
      { id: 14, fullName: "Marc Eto", email: "marc@example.com", destination: "canada", reviewedAt: daysAgo(6) },
      { id: 15, fullName: "Léa Onana", email: "lea@example.com", destination: "canada", reviewedAt: daysAgo(6) },
    ],
    "applications:candidateId,paymentStatus,validatedAt,validatedBy,createdAt": [
      { candidateId: 12, paymentStatus: "SUCCESS", validatedAt: daysAgo(3), validatedBy: "admin@3m.com", createdAt: daysAgo(9) },
      // Paiement réussi mais jamais validé par un administrateur : pas prêt.
      { candidateId: 13, paymentStatus: "SUCCESS", validatedAt: null, validatedBy: null, createdAt: daysAgo(9) },
    ],
    // Léa : dossier agence marqué « payé » mais sans confirmation dans le journal d'audit des paiements : pas prête.
    "agency_dossiers:id,email": [{ id: 50, email: "marc@example.com" }, { id: 60, email: "lea@example.com" }],
    "payment_audit_logs:paymentId": [{ paymentId: 50 }],
    "candidate_files:candidateId,count,oldest": [{ candidateId: 12, count: 3, oldest: daysAgo(4) }],
    "agency_dossier_documents:dossierId,count,oldest": [{ dossierId: 50, count: 1, oldest: daysAgo(0) }],
    "candidates:id,fullName": [{ id: 12, fullName: "Aïcha Nkolo" }],
    "agency_dossiers:id,fullName": [{ id: 50, fullName: "Marc Eto" }],
    "applications:id,dossierNumber,fullName,status,lastMovement,createdAt": [{ id: 7, dossierNumber: "3M-2026-0007", fullName: "Lina Fouda", status: "en_attente_documents", lastMovement: daysAgo(10), createdAt: daysAgo(30) }],
    "agency_dossiers:id,fullName,status,lastMovement,createdAt": [{ id: 51, fullName: "Yann Bekolo", status: "en_cours", lastMovement: null, createdAt: daysAgo(20) }],
  };
  const chain = (result: unknown[]): any => new Proxy({}, { get: (_target, property) => (property === "then" ? (resolve: (value: unknown[]) => void) => resolve(result) : () => chain(result)) });
  const fakeDb: any = { select: (fields: Record<string, unknown>) => ({ from: (table: any) => chain(rows[`${getTableName(table)}:${Object.keys(fields).join(",")}`] ?? []) }) };

  it("regroupe les trois files, applique la règle d'activation et classe par urgence", async () => {
    const { items, summary } = await loadPilotageQueue(fakeDb, now);
    const byCategory = (category: string) => items.filter((item) => item.category === category).map((item) => item.fullName).sort();
    // Aïcha (paiement en ligne validé) et Marc (paiement agence confirmé) sont prêts ; Paul (paiement non validé) et Léa (agence non confirmée) non.
    expect(byCategory("ready_to_activate")).toEqual(["Aïcha Nkolo", "Marc Eto"]);
    expect(byCategory("documents_to_review")).toEqual(["Aïcha Nkolo", "Marc Eto"]);
    expect(byCategory("stalled")).toEqual(["Lina Fouda", "Yann Bekolo"]);
    expect(summary.total).toBe(6);
    expect(items[0].severity).toBe("high");
    expect(items.find((item) => item.reference === "3M-AGN-0051")?.ageDays).toBe(20);
    expect(items.find((item) => item.openId === "agency_50" && item.category === "documents_to_review")?.reference).toBe("3M-AGN-0050");
  });

  it("aucune écriture : lecture seule", () => {
    const store = read("server/services/pilotageQueueStore.ts");
    expect(store).not.toMatch(/\.(update|insert|delete)\(/);
  });
});

describe("procédure et panneau", () => {
  it("la procédure exige une session administrateur", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    const procedure = router.slice(router.indexOf("getPilotageQueue:"), router.indexOf("listRedundantPreAccounts:"));
    expect(procedure).toContain("requireValidAdminSession(input.sessionToken)");
  });

  it("affiche les priorités classées, filtre par file et ouvre le dossier cliqué", () => {
    const onOpen = vi.fn();
    state.data = {
      summary: { readyToActivate: 1, documentsToReview: 1, stalled: 0, high: 1, total: 2 },
      items: [
        { id: "ready:12", category: "ready_to_activate", openId: "account_12", reference: "COMPTE-00012", fullName: "Aïcha Nkolo", title: "Prêt à activer", detail: "Évaluation validée", ageDays: 3, severity: "high", count: 1 },
        { id: "docs:c12", category: "documents_to_review", openId: "account_12", reference: "COMPTE-00012", fullName: "Aïcha Nkolo", title: "3 pièces à contrôler", detail: "x", ageDays: 0, severity: "low", count: 3 },
      ],
    };
    render(<AdminPilotageQueue sessionToken="t" onOpen={onOpen} />);
    expect(screen.getAllByTestId("pilotage-row")).toHaveLength(2);
    expect(screen.getAllByTestId("pilotage-row")[0].getAttribute("data-severity")).toBe("high");
    fireEvent.click(screen.getByText(/Pièces à contrôler \(1\)/));
    expect(screen.getAllByTestId("pilotage-row")).toHaveLength(1);
    fireEvent.click(screen.getByTestId("pilotage-row"));
    expect(onOpen).toHaveBeenCalledWith("account_12");
  });

  it("file vide : message rassurant ; erreur : affichée", () => {
    state.data = { summary: { readyToActivate: 0, documentsToReview: 0, stalled: 0, high: 0, total: 0 }, items: [] };
    render(<AdminPilotageQueue sessionToken="t" onOpen={vi.fn()} />);
    expect(screen.getByText(/Aucune action en attente/)).toBeTruthy();
    cleanup();
    state.data = undefined;
    state.error = { message: "Base indisponible" };
    render(<AdminPilotageQueue sessionToken="t" onOpen={vi.fn()} />);
    expect(screen.getByRole("alert").textContent).toContain("Base indisponible");
    state.error = null;
  });

  it("le tableau de bord affiche la file dans l'onglet Pilotage", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("<AdminPilotageQueue sessionToken={sessionToken} onOpen={(openId) => setSelectedCandidateId(openId)} />");
  });
});
