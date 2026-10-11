import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSetPasswordAccessUrl } from "./services/ensureAgencyClientAccess";
import { buildCandidateSpaceAccessUrl } from "./services/candidateAccessLink";
import { generateReceiptA5HTML } from "./receiptA5Service";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("vague 1 — confiance client", () => {
  it("construit les liens d’accès compte sécurisés", () => {
    expect(buildCandidateSpaceAccessUrl("3M-AGN-0012")).toContain("/login?redirect=1");
    expect(buildCandidateSpaceAccessUrl("3M-AGN-0012")).toContain(encodeURIComponent("/mon-espace?dossier=3M-AGN-0012"));
    expect(buildSetPasswordAccessUrl("abc123token", "3M-AGN-0012")).toContain("/reset-password?token=abc123token");
    expect(buildSetPasswordAccessUrl("abc123token", "3M-AGN-0012")).toContain("from=");
  });

  it("génère un reçu A5 imprimable", () => {
    const html = generateReceiptA5HTML({
      receiptNumber: "REC-A5-3M-AGN-0001",
      date: new Date("2026-10-11T10:00:00Z"),
      time: "11:00",
      candidateName: "Jean Mbarga",
      amount: "65000",
      currency: "XAF",
      paymentMethod: "Espèces",
      agentName: "Conseiller 3M",
      agencyLocation: "Yaoundé",
      description: "Frais de dossier",
    });
    expect(html).toContain("Jean Mbarga");
    expect(html).toContain("65000");
    expect(html).toContain("REC-A5-3M-AGN-0001");
    expect(html).toContain("210mm");
  });

  it("branche import → accès compte, inbox, A5 et correctifs téléphone", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("ensureAgencyClientAccess");
    expect(admin).toContain("clientInviteSent");
    expect(admin).toContain("buildCandidateSpaceAccessUrl");

    const ensure = read("server/services/ensureAgencyClientAccess.ts");
    expect(ensure).toContain("sendClientAccessInviteEmail");
    expect(ensure).toContain("issuePasswordResetToken");
    expect(read("server/services/clientAccessInviteEmail.ts")).toContain("Activer mon espace client");

    const management = read("server/routers/adminCandidateManagement.ts");
    expect(management).toContain("getPaymentReceiptA5Html");
    expect(management).toContain("generateReceiptA5HTML");
    expect(management).toContain("receiptA5Ready");

    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("ClientNotificationsInbox");
    expect(space).toContain('id: "notifications"');

    const inbox = read("client/src/components/ClientNotificationsInbox.tsx");
    expect(inbox).toContain("Centre de notifications");
    expect(inbox).toContain("Marquer comme lue");
    expect(inbox).toContain("Administration");

    const submit = read("client/src/pages/SubmitDocuments.tsx");
    expect(submit).toContain("/mon-espace");
    expect(submit).not.toContain("XXX XXX XXX");
    expect(submit).toContain("+237 620 996 045");

    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("print-receipt-a5");
    expect(dashboard).toContain("getPaymentReceiptA5Html");
  });
});
