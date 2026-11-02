import { describe, expect, it } from "vitest";
import {
  buildRegistrationInfoClientSpaceContent,
  buildRegistrationInfoRequest,
  isEvaluationCompleteForJustificatifs,
  registrationInfoRequestEmailHtml,
  registrationInfoRequestPlainBody,
  registrationProfileDownloadText,
} from "./registrationInfoRequest";

describe("registrationInfoRequest", () => {
  it("exige le CV pour un visa travail sans CV", () => {
    const request = buildRegistrationInfoRequest({
      destination: "Luxembourg",
      visaType: "Travail",
      hasCv: false,
    });
    expect(request.items.some((item) => /cv/i.test(item.label) && item.priority === "required")).toBe(true);
    expect(request.subject).toContain("Luxembourg");
    expect(request.subject.toLowerCase()).toContain("justificatif");
  });

  it("construit une checklist études sans imposer le CV", () => {
    const request = buildRegistrationInfoRequest({
      destination: "Canada",
      visaType: "Études",
      hasCv: false,
    });
    expect(request.projectKind).toBe("etudes");
    expect(request.items.length).toBeGreaterThan(0);
    expect(request.items.some((item) => /cv/i.test(item.label) && item.priority === "required")).toBe(false);
  });

  it("ne permet les justificatifs qu’après évaluation", () => {
    expect(isEvaluationCompleteForJustificatifs({})).toBe(false);
    expect(isEvaluationCompleteForJustificatifs({ evaluationDeclarationStatus: "pending_validation" })).toBe(false);
    expect(isEvaluationCompleteForJustificatifs({ evaluationDeclarationStatus: "validated" })).toBe(true);
    expect(isEvaluationCompleteForJustificatifs({ evaluationDeliveryStatus: "sent" })).toBe(true);
    expect(isEvaluationCompleteForJustificatifs({ evaluationClientConfirmedAt: new Date() })).toBe(true);
    expect(isEvaluationCompleteForJustificatifs({ evaluationValidatedAt: "2026-10-01" })).toBe(true);
  });

  it("produit un e-mail brandé, un corps texte et une entête espace client", () => {
    const request = buildRegistrationInfoRequest({ destination: "France", visaType: "Tourisme", hasCv: true });
    const html = registrationInfoRequestEmailHtml({
      fullName: "Jean Test",
      destination: request.destination,
      visaType: request.visaType,
      items: request.items,
      reference: "3M-001",
    });
    expect(html).toContain("Jean Test");
    expect(html).toContain("France");
    expect(html).toContain("3M TRAVEL AGENCY");
    expect(html).toContain("Documents justificatifs");
    expect(html).toContain("Suite à votre évaluation");

    const plain = registrationInfoRequestPlainBody({
      fullName: "Jean Test",
      destination: "France",
      visaType: "Tourisme",
      items: request.items,
      reference: "3M-001",
    });
    expect(plain).toContain("Suite à votre évaluation");
    expect(plain).toContain("3M-001");

    const space = buildRegistrationInfoClientSpaceContent({
      destination: "France",
      visaType: "Tourisme",
      reference: "3M-001",
      body: plain,
    });
    expect(space).toContain("3M TRAVEL AGENCY");
    expect(space).toContain("Demande de documents justificatifs");
    expect(space).toContain("Référence : 3M-001");

    const text = registrationProfileDownloadText({
      fullName: "Jean Test",
      email: "jean@example.com",
      preferredDestinations: ["France"],
      visaType: "Tourisme",
      nationality: "Camerounaise",
    });
    expect(text).toContain("Jean Test");
    expect(text).toContain("France (principale)");
    expect(text).toContain("Tourisme");
  });
});
