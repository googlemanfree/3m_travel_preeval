import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildUnifiedCommunicationsTimeline,
  candidateIdFromActiveReference,
  channelLabel,
  suggestDuplicateMerges,
} from "../shared/adminUnifiedTimeline";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("adminUnifiedTimeline — fusion chronologique", () => {
  it("fusionne messages, notifications, clarifs, e-mails et ops par date décroissante", () => {
    const timeline = buildUnifiedCommunicationsTimeline({
      messages: [
        { id: 1, content: "Bonjour", senderRole: "candidate", createdAt: "2026-10-10T10:00:00Z" },
        { id: 2, content: "Via WA", senderRole: "admin", createdAt: "2026-10-12T10:00:00Z", sentVia: "whatsapp" },
      ],
      notifications: [{ id: 9, title: "Paiement reçu", body: "OK", createdAt: "2026-10-11T12:00:00Z" }],
      clarifications: [{ id: 3, documentLabel: "Passeport", requestMessage: "Page 2 illisible", status: "pending", createdAt: "2026-10-09T08:00:00Z" }],
      emails: [{ id: 4, emailType: "reminder", status: "sent", language: "fr", createdAt: "2026-10-08T08:00:00Z", sentAt: "2026-10-08T09:00:00Z" }],
      operational: [{ id: "status-1", kind: "status", label: "Nouveau → En traitement", comment: "OK", actor: "admin", createdAt: "2026-10-13T09:00:00Z" }],
    });
    expect(timeline[0]?.channel).toBe("status");
    expect(timeline.map((entry) => entry.channel)).toEqual([
      "status",
      "whatsapp",
      "notification",
      "message",
      "clarification",
      "email",
    ]);
    expect(channelLabel("whatsapp")).toBe("WhatsApp");
    expect(timeline.some((entry) => entry.channel === "whatsapp" && entry.tone === "emerald")).toBe(true);
  });

  it("suggère une fusion côté pré-compte et côté dossier actif", () => {
    const items = [
      {
        kind: "account" as const,
        id: 12,
        reference: "COMPTE-00012",
        fullName: "Aïcha N.",
        confidence: "certain" as const,
        reason: "Même e-mail",
        activeDossierReference: "3M-AGN-0034",
      },
      {
        kind: "agency_pre_dossier" as const,
        id: 99,
        reference: "3M-AGN-0099",
        fullName: "Autre",
        confidence: "probable" as const,
        reason: "Téléphone proche",
        activeDossierReference: "3M-AGN-0034",
      },
    ];
    const onAccount = suggestDuplicateMerges({
      currentFolderCode: "COMPTE-00012",
      currentCandidateId: "account_12",
      items,
    });
    expect(onAccount).toHaveLength(1);
    expect(onAccount[0]?.viewingRedundant).toBe(true);
    expect(onAccount[0]?.activeDossierReference).toBe("3M-AGN-0034");

    const onActive = suggestDuplicateMerges({
      currentFolderCode: "3M-AGN-0034",
      currentCandidateId: "agency_34",
      items,
    });
    expect(onActive).toHaveLength(2);
    expect(onActive.every((row) => row.viewingActive)).toBe(true);
    expect(candidateIdFromActiveReference("3M-AGN-0034")).toBe("agency_34");
    expect(candidateIdFromActiveReference("COMPTE-00012")).toBeNull();
  });
});

describe("adminUnifiedTimeline — câblage UI", () => {
  it("expose timeline unifiée, mode guichet et bannière doublons", () => {
    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    const guichet = read("client/src/components/AdminGuichetPanel.tsx");
    const css = read("client/src/index.css");

    expect(workspace).toContain("candidate360-unified-timeline");
    expect(workspace).toContain("buildUnifiedCommunicationsTimeline");
    expect(workspace).toContain("candidate360-duplicate-merge");
    expect(workspace).toContain("suggestDuplicateMerges");
    expect(workspace).toContain("archiveRedundantPreAccounts");

    expect(dashboard).toContain("admin-guichet-toggle");
    expect(dashboard).toContain("data-admin-guichet");
    expect(dashboard).toContain("AdminGuichetPanel");
    expect(guichet).toContain("admin-guichet-panel");
    expect(guichet).toContain("buildTodayItems");
    expect(css).toContain('[data-admin-guichet="true"]');
  });
});
