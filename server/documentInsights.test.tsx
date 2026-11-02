// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({
  rows: new Map<unknown, any[]>(),
  stats: null as any,
  duplicates: null as any,
}));

vi.mock("./db", () => ({
  getDb: async () => {
    const chain = (rows: any[]) => {
      const c: any = { where: () => c, limit: () => c, orderBy: () => c, then: (resolve: (value: any[]) => unknown) => resolve(rows) };
      return c;
    };
    return { select: () => ({ from: (table: unknown) => chain(state.rows.get(table) ?? []) }) };
  },
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ id: 1, email: "agent@3mtravelagency.com" }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    adminDocumentInsights: {
      stats: { useQuery: () => ({ data: state.stats }) },
      duplicates: { useQuery: () => ({ data: state.duplicates }) },
    },
  },
}));

import { candidateFiles, clientDocuments } from "../drizzle/schema";
import { adminDocumentInsightsRouter } from "./routers/adminDocumentInsights";
import { averageVerificationHours, findDuplicateGroups } from "../shared/documentInsights";
import { composeRejectionComment } from "../shared/documentRejectionReasons";
import { AdminDocumentInsightsCard, AdminDuplicateFilesNotice } from "@/components/AdminDocumentInsights";

const caller = () => adminDocumentInsightsRouter.createCaller({ req: { headers: {} }, res: {} } as any);
const token = "t".repeat(40);

beforeEach(() => {
  state.rows = new Map();
  state.stats = null;
  state.duplicates = null;
});
afterEach(() => cleanup());

describe("pièces en double", () => {
  const file = (id: number, size: number | null, status = "uploaded", day = 1, fileType = "passeport", fileName = `f${id}.pdf`) => ({ id, fileType, fileName, fileSizeBytes: size, status, uploadedAt: new Date(2026, 9, day) });

  it("regroupe les pièces de même catégorie et de même taille, ignore les tailles absentes", () => {
    const groups = findDuplicateGroups([file(1, 5000), file(2, 5000, "uploaded", 3), file(3, 7000), file(4, null), file(5, null), file(6, 5000, "uploaded", 2, "diplome")]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ fileType: "passeport", sizeBytes: 5000, fileIds: [1, 2], resentAfterRejection: false });
  });

  it("signale une pièce rejetée puis renvoyée à l'identique, en premier", () => {
    const groups = findDuplicateGroups([file(1, 5000, "rejected", 1), file(2, 5000, "uploaded", 5), file(3, 9000, "uploaded", 1, "cv"), file(4, 9000, "uploaded", 2, "cv")]);
    expect(groups[0]).toMatchObject({ fileType: "passeport", resentAfterRejection: true });
    expect(groups[1].resentAfterRejection).toBe(false);
  });

  it("une pièce rejetée sans renvoi plus récent n'est pas signalée comme renvoyée", () => {
    const groups = findDuplicateGroups([file(1, 5000, "uploaded", 1), file(2, 5000, "rejected", 5)]);
    expect(groups[0].resentAfterRejection).toBe(false);
  });
});

describe("délai moyen de vérification", () => {
  it("moyenne en heures, couples incohérents ignorés", () => {
    const base = new Date("2026-10-01T00:00:00Z");
    const plus = (hours: number) => new Date(base.getTime() + hours * 3600 * 1000);
    expect(averageVerificationHours([
      { uploadedAt: base, verifiedAt: plus(10) },
      { uploadedAt: base, verifiedAt: plus(20) },
      { uploadedAt: base, verifiedAt: plus(-5) },
      { uploadedAt: base, verifiedAt: null },
    ])).toEqual({ averageHours: 15, count: 2 });
    expect(averageVerificationHours([])).toEqual({ averageHours: null, count: 0 });
  });
});

describe("routeur adminDocumentInsights", () => {
  it("stats : compte les motifs standard et libres sur les deux sources, et calcule le délai", async () => {
    const base = new Date("2026-10-01T00:00:00Z");
    state.rows.set(candidateFiles, [{ comment: composeRejectionComment("illisible") }, { comment: "Merci de renvoyer la page 2." }]);
    state.rows.set(clientDocuments, [
      { comment: composeRejectionComment("illisible", "Page 1."), status: "rejected", uploadedAt: base, verifiedAt: new Date(base.getTime() + 10 * 3600 * 1000) },
      { comment: null, status: "approved", uploadedAt: base, verifiedAt: new Date(base.getTime() + 20 * 3600 * 1000) },
    ]);
    const result = await caller().stats({ sessionToken: token });
    expect(result.totalRejected).toBe(3);
    expect(result.reasons[0]).toMatchObject({ code: "illisible", count: 2 });
    expect(result.reasons.find((reason) => reason.code === "libre")?.count).toBe(1);
    expect(result.averageVerificationHours).toBe(15);
  });

  it("duplicates : renvoie les groupes du candidat demandé", async () => {
    state.rows.set(candidateFiles, [
      { id: 1, fileType: "cv", fileName: "a.pdf", fileSizeBytes: 100, status: "uploaded", uploadedAt: new Date(2026, 9, 1) },
      { id: 2, fileType: "cv", fileName: "b.pdf", fileSizeBytes: 100, status: "uploaded", uploadedAt: new Date(2026, 9, 2) },
    ]);
    const result = await caller().duplicates({ sessionToken: token, candidateId: 5 });
    expect(result.groups).toHaveLength(1);
  });
});

describe("affichage", () => {
  it("la carte de pilotage reste muette sans donnée utile", () => {
    state.stats = { windowDays: 90, totalRejected: 0, reasons: [], averageVerificationHours: null, verifiedSampleSize: 0 };
    const { container } = render(<AdminDocumentInsightsCard sessionToken="tok" />);
    expect(container.innerHTML).toBe("");
  });

  it("la carte de pilotage montre délai et motifs", () => {
    state.stats = { windowDays: 90, totalRejected: 4, reasons: [{ code: "illisible", label: "Document illisible", count: 3 }, { code: "expire", label: "Document expiré", count: 1 }], averageVerificationHours: 30.5, verifiedSampleSize: 12 };
    render(<AdminDocumentInsightsCard sessionToken="tok" />);
    expect(screen.getByTestId("insight-average-hours").textContent).toBe("30.5 h");
    expect(screen.getByTestId("insight-reasons").textContent).toContain("Document illisible");
  });

  it("l'avis de doublons n'apparaît que s'il y a des groupes et rappelle que c'est un indice", () => {
    state.duplicates = { groups: [] };
    const { container, rerender } = render(<AdminDuplicateFilesNotice sessionToken="tok" candidateId={5} />);
    expect(container.innerHTML).toBe("");
    state.duplicates = { groups: [{ fileType: "passeport", sizeBytes: 5000, fileIds: [1, 2], fileNames: ["a.pdf", "b.pdf"], resentAfterRejection: true }] };
    rerender(<AdminDuplicateFilesNotice sessionToken="tok" candidateId={5} />);
    expect(screen.getByTestId("duplicate-files-notice").textContent).toContain("renvoyée sans modification");
    expect(screen.getByTestId("duplicate-files-notice").textContent).toContain("à confirmer en ouvrant les pièces");
  });
});
