import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("poste de travail du jour", () => {
  const router = read("server/routers/adminOps.ts");
  const bar = read("client/src/components/AdminWorkQueueBar.tsx");
  const dashboard = read("client/src/pages/AdminDashboard.tsx");

  it("les compteurs serveur sont calculés en une seule lecture, hors corbeille, et réservés aux administrateurs", () => {
    const start = router.indexOf("adminWorkQueue: publicProcedure");
    const block = router.slice(start, start + 2600);
    expect(block).toContain("await requireValidAdminSession(input.sessionToken)");
    expect(block).toContain("a.deletedAt IS NULL");
    for (const name of ["lateBilans", "unseenBilans", "paymentsToConfirm"]) expect(block).toContain(`AS ${name}`);
    // bilans à faire : pas encore envoyés, créés il y a plus de 24 h ; non consultés : envoyés, jamais ouverts, sans réponse du candidat
    expect(block).toContain("a.evaluationDeliveryStatus <> 'sent' AND a.dossierStatus IN ('nouveau', 'en_evaluation') AND a.createdAt < ${dayAgo}");
    expect(block).toContain("a.evaluationReportViewedAt IS NULL AND a.evaluationCompletedAt < ${dayAgo}");
    expect(block).toContain("a.activationRequestedAt IS NOT NULL AND COALESCE(a.paymentStatus, '') <> 'SUCCESS'");
  });

  it("la barre renvoie chaque compteur vers la bonne section et se rafraîchit seule", () => {
    for (const id of ["late-bilans", "unseen-bilans", "payments", "receipts", "protocols"]) expect(bar).toContain(`id: "${id}"`);
    expect(bar).toContain('tab: "evaluation-review"');
    expect(bar).toContain('tab: "evaluation-reminders"');
    expect(bar).toContain("refetchInterval: 60_000");
    expect(bar).toContain("Tout est à jour.");
    expect(dashboard).toContain("<AdminWorkQueueBar sessionToken={sessionToken || \"\"} onGo={setActiveAdminTab} />");
  });
});

describe("suivi du reçu et du protocole comme celui du bilan", () => {
  const desk = read("client/src/components/AdminContractsReceiptsDesk.tsx");
  const candidates = read("server/routers/adminCandidateManagement.ts");

  it("chaque ligne porte la date d'envoi du lot reçu + protocole (journal des paiements)", () => {
    expect(candidates).toContain('inArray(paymentAuditLogs.action, ["receipt_protocol_sent", "receipt_protocol_resent"])');
    expect(candidates).toContain("const pipeline = [...onlinePipeline, ...agencyPipeline].map(withPackageDate)");
  });

  it("le bureau signale les protocoles non signés, filtre, et copie le lien du protocole", () => {
    for (const id of ["desk-filter", "protocol-sent-", "protocol-not-sent-", "protocol-copy-link-"]) expect(desk).toContain(id);
    expect(desk).toContain("Protocoles non signés (");
    expect(desk).toContain("— non signé");
    expect(read("server/routers/adminDocumentDrafts.ts")).toContain("protocolLink: publicProcedure");
  });

  it("la relance automatique de signature joint le lien du protocole (PDF)", () => {
    const reminders = read("server/services/signatureAndConfirmationReminders.ts");
    expect(reminders).toContain("Téléchargez votre protocole d’accord (PDF)");
    expect(reminders).toContain("html: protocolOneEmailHtml(row.fullName, row.dossierNumber, await protocolPdfUrl(db, row.id))");
  });
});
