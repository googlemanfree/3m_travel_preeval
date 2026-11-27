import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildFollowUp, deliveryState, reminderMessage, type FollowUpRow } from "../shared/bilanFollowUp";
import { buildAutoRelanceMessage } from "../shared/bilanRelanceAuto";

const NOW = new Date("2026-11-27T10:00:00Z");
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString();
const row = (over: Partial<FollowUpRow> = {}): FollowUpRow => ({
  id: 1, candidateId: 7, fullName: "Aïcha Test", email: "a@example.test", dossierNumber: "3M-EVAL-0001", destination: "Canada", visaType: "travail",
  paymentAmount: 0, paymentStatus: null, sentAt: hoursAgo(50), viewedAt: null, activationRequestedAt: null, pdfUrl: "https://www.3mtravelagency.com/manus-storage/b.pdf", ...over,
});

describe("vérification de réception des bilans", () => {
  it("distingue consulté, non consulté (spam probable), échec d'envoi et trop récent", () => {
    expect(deliveryState(row({ viewedAt: hoursAgo(5) }), NOW)).toBe("viewed");
    expect(deliveryState(row(), NOW)).toBe("unseen");
    expect(deliveryState(row({ sentAt: hoursAgo(3) }), NOW)).toBe("recent");
    expect(deliveryState(row({ emailStatus: "failed" }), NOW)).toBe("failed");
    expect(deliveryState(row({ emailStatus: "bounced", viewedAt: hoursAgo(1) }), NOW)).toBe("failed");
    expect(deliveryState(row({ sentAt: null }), NOW)).toBe("recent");
  });

  it("compte les bilans non consultés et les échecs, et les place en tête de liste", () => {
    const rows = [
      row({ id: 1, viewedAt: hoursAgo(2) }),
      row({ id: 2 }),
      row({ id: 3, emailStatus: "failed", sentAt: hoursAgo(2) }),
      row({ id: 4, sentAt: hoursAgo(2) }),
      row({ id: 5, paymentStatus: "SUCCESS" }),
    ];
    const { stats, items } = buildFollowUp(rows, {}, {}, NOW);
    expect(stats.unseen).toBe(1);
    expect(stats.failed).toBe(1);
    expect(items.map((item) => item.id).slice(0, 2)).toEqual([3, 2]);
    expect(items.find((item) => item.id === 2)).toMatchObject({ delivery: "unseen", pdfUrl: "https://www.3mtravelagency.com/manus-storage/b.pdf" });
    expect(items.find((item) => item.id === 1)).toMatchObject({ delivery: "viewed", opened: true });
  });

  it("la relance manuelle et la relance automatique joignent le lien de téléchargement quand le bilan n'a pas été consulté", () => {
    const manual = reminderMessage("Aïcha", "https://x.test/b.pdf");
    expect(manual.body).toContain("https://x.test/b.pdf");
    expect(reminderMessage("Aïcha").body).not.toContain("https://");
    const auto = buildAutoRelanceMessage({ step: 1, viewed: false, firstName: "Aïcha", dossierNumber: "3M-EVAL-0001", spaceUrl: "https://x.test/mon-espace", pdfUrl: "https://x.test/b.pdf" });
    expect(auto.body).toContain("Téléchargez votre bilan en PDF : https://x.test/b.pdf");
    expect(auto.body).toMatch(/ne garantit aucune décision/i);
    expect(auto.whatsapp).toContain("https://x.test/b.pdf");
    expect(buildAutoRelanceMessage({ step: 1, viewed: false, firstName: "A", dossierNumber: "", spaceUrl: "https://x.test" }).body).not.toContain("Téléchargez votre bilan");
  });
});

describe("vérification de réception — branchements", () => {
  const read = (path: string) => readFileSync(path, "utf8");
  it("le suivi lit le statut du dernier e-mail et expose le lien du PDF", () => {
    const router = read("server/routers/bilanFollowUp.ts");
    expect(router).toContain("evaluationEmails.status");
    expect(router).toContain("pdfUrl: row.evaluationReportPdfUrl ? absoluteSiteUrl(row.evaluationReportPdfUrl) : null");
    expect(router).toContain("pdfLink: publicProcedure");
    expect(router).toContain("reminderMessage(firstName(application.fullName), application.evaluationReportPdfUrl");
  });
  it("la relance automatique envoie le lien du PDF seulement si le bilan n'a pas été consulté", () => {
    expect(read("server/services/bilanFollowUpActions.ts")).toContain("pdfUrl: !plan.viewed && row.evaluationReportPdfUrl");
  });
  it("l'e-mail du bilan conseille de vérifier les indésirables et donne un lien de téléchargement", () => {
    const unified = read("server/routers/unifiedRequests.ts");
    expect(unified).toContain("Ce message est arrivé dans vos courriers indésirables ?");
    expect(unified).toContain("absoluteSiteUrl(finalPdf.url)");
  });
  it("les écrans montrent l'état de réception, filtrent les non consultés et copient le lien du PDF", () => {
    const followUp = read("client/src/components/AdminBilanFollowUp.tsx");
    for (const id of ["delivery-alert", "delivery-filter", "followup-copy-link-", "followup-delivery-"]) expect(followUp).toContain(id);
    expect(read("client/src/components/EvaluationDeliveryEditor.tsx")).toContain("bilan-copy-pdf-link");
  });
});
