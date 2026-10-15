/**
 * Timeline unifiée 360° : fusionne messages, notifications, clarifications,
 * e-mails d’évaluation et événements opérationnels (statuts / activité).
 */

export type UnifiedTimelineChannel =
  | "message"
  | "notification"
  | "clarification"
  | "email"
  | "whatsapp"
  | "status"
  | "activity"
  | "request"
  | "other";

export type UnifiedTimelineEntry = {
  id: string;
  channel: UnifiedTimelineChannel;
  label: string;
  detail: string;
  actor: string;
  createdAt: Date | string;
  tone: "blue" | "emerald" | "violet" | "amber" | "slate" | "rose";
};

export type UnifiedTimelineInput = {
  messages?: Array<{
    id: number | string;
    content?: string | null;
    senderRole?: string | null;
    createdAt: Date | string;
    channel?: string | null;
    sentVia?: string | null;
  }>;
  notifications?: Array<{
    id: number | string;
    title?: string | null;
    body?: string | null;
    createdAt: Date | string;
  }>;
  clarifications?: Array<{
    id: number | string;
    documentLabel?: string | null;
    requestMessage?: string | null;
    status?: string | null;
    createdAt: Date | string;
    respondedAt?: Date | string | null;
  }>;
  emails?: Array<{
    id: number | string;
    emailType?: string | null;
    status?: string | null;
    language?: string | null;
    sentVia?: string | null;
    sentAt?: Date | string | null;
    createdAt: Date | string;
    failureReason?: string | null;
  }>;
  operational?: Array<{
    id: string;
    kind?: string | null;
    label?: string | null;
    comment?: string | null;
    actor?: string | null;
    status?: string | null;
    createdAt: Date | string;
  }>;
  limit?: number;
};

const trim = (value: string | null | undefined, fallback: string) => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const isWhatsApp = (value: string | null | undefined) =>
  /whats?app|wa\.me/i.test(String(value ?? ""));

export function channelLabel(channel: UnifiedTimelineChannel): string {
  switch (channel) {
    case "message":
      return "Message";
    case "notification":
      return "Notification";
    case "clarification":
      return "Clarification";
    case "email":
      return "E-mail";
    case "whatsapp":
      return "WhatsApp";
    case "status":
      return "Statut";
    case "activity":
      return "Activité";
    case "request":
      return "Demande";
    default:
      return "Événement";
  }
}

export function buildUnifiedCommunicationsTimeline(input: UnifiedTimelineInput): UnifiedTimelineEntry[] {
  const entries: UnifiedTimelineEntry[] = [];

  for (const message of input.messages ?? []) {
    const via = message.channel || message.sentVia || "";
    const whatsapp = isWhatsApp(via);
    entries.push({
      id: `message-${message.id}`,
      channel: whatsapp ? "whatsapp" : "message",
      label: whatsapp
        ? "WhatsApp"
        : message.senderRole === "candidate"
          ? "Message candidat"
          : "Message administration",
      detail: trim(message.content, "Message enregistré"),
      actor: message.senderRole === "candidate" ? "candidat" : "administration",
      createdAt: message.createdAt,
      tone: whatsapp ? "emerald" : "blue",
    });
  }

  for (const notification of input.notifications ?? []) {
    entries.push({
      id: `notification-${notification.id}`,
      channel: "notification",
      label: trim(notification.title, "Notification client"),
      detail: trim(notification.body, "Notification enregistrée"),
      actor: "système",
      createdAt: notification.createdAt,
      tone: "slate",
    });
  }

  for (const clarification of input.clarifications ?? []) {
    entries.push({
      id: `clarification-${clarification.id}`,
      channel: "clarification",
      label: `Clarification · ${trim(clarification.documentLabel, "pièce")}`,
      detail: trim(
        clarification.requestMessage,
        clarification.status === "pending" ? "En attente de réponse" : "Clarification traitée",
      ),
      actor: "administration",
      createdAt: clarification.respondedAt || clarification.createdAt,
      tone: clarification.status === "pending" ? "violet" : "emerald",
    });
  }

  for (const email of input.emails ?? []) {
    const via = email.sentVia || "";
    const whatsapp = isWhatsApp(via);
    const typeLabel =
      email.emailType === "reminder"
        ? "Relance de bilan"
        : email.emailType === "follow_up"
          ? "Suivi évaluation"
          : "Bilan d’évaluation";
    entries.push({
      id: `email-${email.id}`,
      channel: whatsapp ? "whatsapp" : "email",
      label: whatsapp ? `${typeLabel} (WhatsApp)` : typeLabel,
      detail: email.failureReason
        ? `Échec : ${email.failureReason}`
        : `Statut ${email.status || "inconnu"}${email.language ? ` · ${email.language === "en" ? "EN" : "FR"}` : ""}`,
      actor: "système",
      createdAt: email.sentAt || email.createdAt,
      tone: email.failureReason ? "rose" : whatsapp ? "emerald" : "amber",
    });
  }

  for (const event of input.operational ?? []) {
    const kind = String(event.kind ?? "activity");
    const channel: UnifiedTimelineChannel =
      kind === "status" ? "status" : kind === "request" ? "request" : "activity";
    entries.push({
      id: event.id,
      channel,
      label: trim(event.label, event.status || "Événement"),
      detail: trim(event.comment, "Événement enregistré"),
      actor: trim(event.actor, "système"),
      createdAt: event.createdAt,
      tone: channel === "status" ? "blue" : event.status === "deadline_updated" ? "amber" : "slate",
    });
  }

  const limit = input.limit ?? 120;
  return entries
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit);
}

/** Suggestion de fusion : pré-compte redondant lié à un dossier actif (ou l’inverse). */
export type DuplicateMergeSuggestion = {
  kind: "agency_pre_dossier" | "account";
  id: number;
  reference: string;
  fullName: string;
  confidence: "certain" | "probable";
  reason: string;
  activeDossierReference: string;
  /** true si la fiche ouverte est le pré-compte redondant (CTA = ouvrir le 3M actif). */
  viewingRedundant: boolean;
  /** true si la fiche ouverte est le dossier actif qui couvre le pré-compte. */
  viewingActive: boolean;
};

export function suggestDuplicateMerges(input: {
  currentFolderCode?: string | null;
  currentCandidateId?: string | null;
  items: Array<{
    kind: "agency_pre_dossier" | "account";
    id: number;
    reference: string;
    fullName: string;
    confidence: "certain" | "probable";
    reason: string;
    activeDossierReference: string;
  }>;
}): DuplicateMergeSuggestion[] {
  const folder = String(input.currentFolderCode ?? "").trim().toUpperCase();
  const candidateId = String(input.currentCandidateId ?? "").trim().toLowerCase();
  if (!folder && !candidateId) return [];

  const results: DuplicateMergeSuggestion[] = [];
  for (const item of input.items) {
    const itemRef = item.reference.trim().toUpperCase();
    const activeRef = item.activeDossierReference.trim().toUpperCase();
    const itemId =
      item.kind === "account"
        ? `account_${item.id}`
        : `agency_${item.id}`;
    const viewingRedundant =
      (folder && itemRef === folder)
      || (candidateId && candidateId === itemId);
    const viewingActive = Boolean(folder && activeRef === folder);
    if (!viewingRedundant && !viewingActive) continue;
    results.push({
      kind: item.kind,
      id: item.id,
      reference: item.reference,
      fullName: item.fullName,
      confidence: item.confidence,
      reason: item.reason,
      activeDossierReference: item.activeDossierReference,
      viewingRedundant,
      viewingActive,
    });
  }
  return results.sort((left, right) =>
    left.confidence === right.confidence ? 0 : left.confidence === "certain" ? -1 : 1,
  );
}

/** Résout une référence active « 3M-AGN-0034 » vers l’id candidat admin `agency_34`. */
export function candidateIdFromActiveReference(reference: string | null | undefined): string | null {
  const value = String(reference ?? "").trim().toUpperCase();
  const agency = /^#?3M-AGN-(\d+)$/i.exec(value);
  if (agency) return `agency_${Number(agency[1])}`;
  return null;
}
