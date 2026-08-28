import { describe, expect, it } from "vitest";
import { assertClarificationUploadEligibility, buildDocumentClarificationAnsweredNotification, buildDocumentClarificationHistory, classifyDocumentClarificationDeadline } from "../shared/documentClarification";

describe("historique de clarification documentaire", () => {
  const request = {
    id: 4,
    requestMessage: "Pouvez-vous préciser le format attendu ?",
    responseMessage: "Merci de joindre une copie lisible en PDF.",
    createdAt: new Date("2026-08-27T09:00:00.000Z"),
    answeredAt: new Date("2026-08-27T10:00:00.000Z"),
  };

  it("reconstruit les échanges historiques quand les événements n’existaient pas encore", () => {
    expect(buildDocumentClarificationHistory(request, [])).toEqual([
      expect.objectContaining({ eventType: "request_created", actorRole: "candidate", message: request.requestMessage }),
      expect.objectContaining({ eventType: "advisor_response_sent", actorRole: "advisor", message: request.responseMessage }),
    ]);
  });

  it("n’expose pas l’échéance interne au candidat, mais la conserve pour le conseiller", () => {
    const events = [
      { id: 1, clarificationRequestId: 4, actorRole: "candidate" as const, eventType: "request_created", message: request.requestMessage, createdAt: request.createdAt },
      { id: 2, clarificationRequestId: 4, actorRole: "system" as const, eventType: "internal_deadline_updated", message: "Échéance interne fixée.", createdAt: new Date("2026-08-27T09:30:00.000Z") },
      { id: 3, clarificationRequestId: 4, actorRole: "advisor" as const, eventType: "advisor_response_sent", message: request.responseMessage, createdAt: request.answeredAt },
    ];
    expect(buildDocumentClarificationHistory(request, events).map((event) => event.eventType)).toEqual(["request_created", "advisor_response_sent"]);
    expect(buildDocumentClarificationHistory(request, events, { includeInternal: true }).map((event) => event.eventType)).toEqual(["request_created", "internal_deadline_updated", "advisor_response_sent"]);
  });

  it("classe l’échéance interne sans en faire une promesse au candidat", () => {
    const now = new Date("2026-08-27T12:00:00.000Z");
    expect(classifyDocumentClarificationDeadline(null, now).key).toBe("not_set");
    expect(classifyDocumentClarificationDeadline(new Date("2026-08-27T11:59:59.000Z"), now).key).toBe("overdue");
    expect(classifyDocumentClarificationDeadline(new Date("2026-08-28T11:00:00.000Z"), now).key).toBe("urgent");
    expect(classifyDocumentClarificationDeadline(new Date("2026-08-29T12:00:00.000Z"), now).key).toBe("planned");
  });

  it("interdit le dépôt d’une clarification absente, en attente ou déjà servie", () => {
    expect(() => assertClarificationUploadEligibility(8, null)).toThrow("ne correspond pas");
    expect(() => assertClarificationUploadEligibility(8, { id: 8, documentLabel: "CV", status: "pending" })).toThrow("Attendez la réponse");
    expect(() => assertClarificationUploadEligibility(8, { id: 8, documentLabel: "CV", status: "answered", uploadedCandidateFileId: 91 })).toThrow("déjà été déposée");
    expect(() => assertClarificationUploadEligibility(8, { id: 8, documentLabel: "CV", status: "answered" })).not.toThrow();
  });

  it("produit une notification candidate limitée à la pièce et à l’espace Documents", () => {
    expect(buildDocumentClarificationAnsweredNotification("  Relevé bancaire  ")).toEqual({
      type: "document_clarification_answered",
      title: "Réponse à votre demande de précision",
      body: "Une réponse est disponible pour la pièce « Relevé bancaire » dans votre espace.",
      actionUrl: "/mon-espace?section=documents",
    });
  });
});
