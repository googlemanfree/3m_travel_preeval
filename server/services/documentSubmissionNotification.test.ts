import { describe, expect, it } from "vitest";
import { getDocumentAlertRecipients } from "./documentSubmissionNotification";

describe("getDocumentAlertRecipients", () => {
  it("normalise et déduplique les destinataires explicitement configurés", () => {
    expect(getDocumentAlertRecipients({
      DOCUMENT_ALERT_RECIPIENTS: " ADMIN@3MTRAVELAGENCY.COM, admin@3mtravelagency.com , audit@3mtravelagency.com ",
    } as NodeJS.ProcessEnv)).toEqual([
      "admin@3mtravelagency.com",
      "audit@3mtravelagency.com",
    ]);
  });

  it("utilise les destinataires de conformité lorsqu’aucun destinataire dédié n’est configuré", () => {
    expect(getDocumentAlertRecipients({
      COMPLIANCE_AUDITOR_EMAILS: "hello@3mtravelagency.com",
    } as NodeJS.ProcessEnv)).toEqual(["hello@3mtravelagency.com"]);
  });
});
