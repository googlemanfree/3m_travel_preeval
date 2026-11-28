import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("santé des envois (administration)", () => {
  const router = read("server/routers/adminOps.ts");
  const panel = read("client/src/components/AdminOps.tsx");

  it("le contrôle de santé expose les canaux réellement configurés", () => {
    expect(router).toContain("email: { configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) }");
    expect(router).toContain("whatsapp: { configured: isWhatsAppConfigured() }");
    expect(router).toContain("bilanRelanceAuto: { enabled: relanceAuto }");
  });

  it("il remonte les derniers échecs : e-mails, bilans non remis, reçus et protocoles non partis", () => {
    expect(router).toContain('eq(emailDeliveryLogs.status, "failed")');
    expect(router).toContain('inArray(evaluationEmails.status, ["failed", "bounced"])');
    expect(router).toContain('eq(paymentAuditLogs.action, "receipt_failed")');
    // une lecture indisponible ne casse jamais l'écran de santé
    expect(router).toContain("const safe = async <T,>(read: () => Promise<T>, fallback: T)");
  });

  it("l'écran montre l'état des canaux, les échecs, et permet de renvoyer un bilan non remis", () => {
    for (const id of ["ops-delivery-health", "delivery-failures", "delivery-no-failure", "resend-bilan-email-"]) expect(panel).toContain(id);
    expect(panel).toContain("trpc.unifiedRequests.resendEvaluationHistory.useMutation");
    expect(panel).toContain("Non configuré : lien WhatsApp manuel seulement");
  });

  it("le contrôle reste réservé aux administrateurs connectés", () => {
    const start = router.indexOf("adminSystemHealth: publicProcedure");
    expect(router.slice(start, start + 400)).toContain("await requireValidAdminSession(input.sessionToken)");
  });
});
