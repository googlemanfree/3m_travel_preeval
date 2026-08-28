export type DocumentClarificationHistorySource = {
  id: number;
  requestMessage: string;
  responseMessage?: string | null;
  createdAt: Date | string;
  answeredAt?: Date | string | null;
};

export type DocumentClarificationRecordedEvent = {
  id: number;
  clarificationRequestId: number;
  actorRole: "candidate" | "advisor" | "system";
  eventType: string;
  message?: string | null;
  createdAt: Date | string;
};

export type DocumentClarificationHistoryEntry = {
  id: string;
  actorRole: "candidate" | "advisor" | "system";
  eventType: string;
  message: string | null;
  createdAt: Date | string;
};

export type ClarificationUploadState = {
  id: number;
  documentLabel: string;
  status: "pending" | "answered" | "closed";
  uploadedCandidateFileId?: number | null;
};

function asTimestamp(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/**
 * Retourne seulement les messages que le candidat est autorisé à relire :
 * question, réponse conseillère et confirmation de dépôt. Les notes internes
 * ne font volontairement pas partie de ce contrat.
 */
export function buildDocumentClarificationHistory(
  request: DocumentClarificationHistorySource,
  recordedEvents: DocumentClarificationRecordedEvent[],
  options: { includeInternal?: boolean } = {},
): DocumentClarificationHistoryEntry[] {
  const events = recordedEvents
    .filter((event) => event.clarificationRequestId === request.id && (options.includeInternal || ["request_created", "advisor_response_sent", "document_uploaded"].includes(event.eventType)))
    .map((event) => ({
      id: `event-${event.id}`,
      actorRole: event.actorRole,
      eventType: event.eventType,
      message: event.message?.trim() || null,
      createdAt: event.createdAt,
    }));

  if (!events.some((event) => event.eventType === "request_created")) {
    events.push({
      id: `legacy-request-${request.id}`,
      actorRole: "candidate",
      eventType: "request_created",
      message: request.requestMessage,
      createdAt: request.createdAt,
    });
  }
  if (request.responseMessage?.trim() && !events.some((event) => event.eventType === "advisor_response_sent")) {
    events.push({
      id: `legacy-response-${request.id}`,
      actorRole: "advisor",
      eventType: "advisor_response_sent",
      message: request.responseMessage,
      createdAt: request.answeredAt ?? request.createdAt,
    });
  }

  return events.sort((left, right) => asTimestamp(left.createdAt) - asTimestamp(right.createdAt));
}

export function classifyDocumentClarificationDeadline(dueAt: Date | string | null | undefined, now = new Date()) {
  if (!dueAt) return { key: "not_set" as const, label: "À planifier" };
  const remainingMs = asTimestamp(dueAt) - now.getTime();
  if (remainingMs < 0) return { key: "overdue" as const, label: "Échéance dépassée" };
  if (remainingMs <= 24 * 60 * 60 * 1000) return { key: "urgent" as const, label: "À répondre sous 24 h" };
  return { key: "planned" as const, label: "Échéance planifiée" };
}

/** Vérifie côté serveur que le dépôt demandé reste attaché au candidat et à une réponse reçue. */
export function assertClarificationUploadEligibility(
  clarificationRequestId: number | null,
  clarification: ClarificationUploadState | null | undefined,
): void {
  if (!clarificationRequestId) return;
  if (!clarification) throw new Error("Cette clarification ne correspond pas à votre espace candidat");
  if (clarification.status !== "answered") throw new Error("Attendez la réponse du conseiller avant de déposer cette pièce");
  if (clarification.uploadedCandidateFileId) throw new Error("Une pièce a déjà été déposée pour cette clarification");
}

export function buildDocumentClarificationAnsweredNotification(documentLabel: string) {
  const label = documentLabel.replace(/\s+/g, " ").trim().slice(0, 180) || "votre pièce justificative";
  return {
    type: "document_clarification_answered",
    title: "Réponse à votre demande de précision",
    body: `Une réponse est disponible pour la pièce « ${label} » dans votre espace.`,
    actionUrl: "/mon-espace?section=documents",
  } as const;
}
