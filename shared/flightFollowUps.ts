/**
 * Suivi des réservations de vol : relances des devis non payés, rappel avant le départ, tableau de bord du comptoir et
 * demandes de modification du client. Fonctions pures (aucun accès base) : le journal de l'historique fait foi.
 */

export const HISTORY = {
  quoteReminder: "quote_reminder_sent",
  preDeparture: "predeparture_reminder_sent",
  fareChecked: "fare_rechecked",
  travelerDetails: "traveler_details_submitted",
  changeRequest: "client_change_request",
  changeHandled: "change_request_handled",
} as const;

export type HistoryRow = { id?: number; requestId: number; action: string; oldValue?: string | null; newValue?: string | null; details?: string | null; createdAt: Date };

const HOUR = 3_600_000;

/** Seuils internes du comptoir (alertes de suivi, pas des engagements affichés au public). */
export const DESK_THRESHOLDS = { firstResponseHours: 12, paymentCheckHours: 24 } as const;

/** Relances de devis : 2 au maximum, à 24 h puis 48 h après la mise en attente de paiement, jamais après le départ. */
export const QUOTE_REMINDER_AFTER_HOURS = [24, 48] as const;
export const PRE_DEPARTURE_DAYS = 3;

export type QuoteReminderInput = {
  status: string;
  clientValidated: boolean;
  /** Moment où le conseiller a demandé le règlement (dernier passage en « revalidé » / « en attente de paiement »). */
  awaitingSince: Date | null;
  remindersSent: number;
  lastReminderAt: Date | null;
  departureAt: Date | null;
  optedOut: boolean;
  now: Date;
};

/** Le client doit encore payer : tarif revalidé ou en attente de paiement, sans paiement déclaré ni confirmé (un paiement confirmé repasse aussi en « revalidé » avec la validation client). */
export const isAwaitingClientPayment = (status: string, clientValidated: boolean): boolean => (status === "revalidated" || status === "awaiting_payment") && !clientValidated;

export function planQuoteReminder(input: QuoteReminderInput): { due: boolean; stage: number; reason?: string } {
  if (!isAwaitingClientPayment(input.status, input.clientValidated)) return { due: false, stage: 0, reason: "pas d’attente de paiement" };
  if (input.optedOut) return { due: false, stage: 0, reason: "désinscrit" };
  if (!input.awaitingSince) return { due: false, stage: 0, reason: "date d’attente inconnue" };
  if (input.departureAt && input.departureAt.getTime() <= input.now.getTime()) return { due: false, stage: 0, reason: "départ passé" };
  const stage = input.remindersSent + 1;
  if (stage > QUOTE_REMINDER_AFTER_HOURS.length) return { due: false, stage: 0, reason: "maximum atteint" };
  const waitedHours = (input.now.getTime() - input.awaitingSince.getTime()) / HOUR;
  if (waitedHours < QUOTE_REMINDER_AFTER_HOURS[stage - 1]) return { due: false, stage: 0, reason: "trop tôt" };
  if (input.lastReminderAt && input.now.getTime() - input.lastReminderAt.getTime() < 20 * HOUR) return { due: false, stage: 0, reason: "relance récente" };
  return { due: true, stage };
}

/** Rappel avant départ : billet émis, départ dans 3 jours ou moins (pas déjà parti), une seule fois. */
export function planPreDepartureReminder(input: { status: string; departureAt: Date | null; alreadySent: boolean; now: Date }): boolean {
  if (input.status !== "issued" || input.alreadySent || !input.departureAt) return false;
  const remaining = input.departureAt.getTime() - input.now.getTime();
  return remaining > 0 && remaining <= PRE_DEPARTURE_DAYS * 24 * HOUR;
}

/** Date-heure de départ d'un vol enregistré ; null si illisible. L'heure est celle du lieu de départ : à 1 h près, sans incidence ici. */
export function departureAtOf(flightData: unknown): Date | null {
  const flight = flightData && typeof flightData === "object" ? (flightData as Record<string, unknown>) : {};
  const date = typeof flight.departureDate === "string" ? flight.departureDate.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const time = typeof flight.departureTime === "string" && /^\d{2}:\d{2}/.test(flight.departureTime) ? flight.departureTime.slice(0, 5) : "12:00";
  const parsed = new Date(`${date}T${time}:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// ─── Tableau de bord du comptoir ─────────────────────────────────────────────────────────────────────────────────

export type DeskRequest = { id: number; requestRef: string; status: string; priority: string; clientValidated: boolean; assignedAgentEmail: string | null; createdAt: Date; pnrReference: string | null; issuedPdfUrl: string | null; flightData: unknown };

/** Actions faites par le client ou le système : elles ne comptent pas comme une réponse du comptoir. */
const NOT_A_DESK_RESPONSE = new Set<string>(["created", "client_validated", HISTORY.travelerDetails, HISTORY.changeRequest, HISTORY.quoteReminder, HISTORY.preDeparture]);

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round1 = (value: number): number => Math.round(value * 10) / 10;

export type DeskStats = {
  requests: number;
  firstResponseMedianHours: number | null;
  firstResponseCount: number;
  paymentApprovalMedianHours: number | null;
  paymentApprovalCount: number;
  issuanceMedianHours: number | null;
  issuanceCount: number;
};

/** Délais médians mesurés depuis la création de la demande, d'après l'historique réel (rien d'estimé). */
export function computeDeskStats(requests: DeskRequest[], history: HistoryRow[]): DeskStats {
  const byRequest = new Map<number, HistoryRow[]>();
  for (const row of history) byRequest.set(row.requestId, [...(byRequest.get(row.requestId) ?? []), row]);
  const firstResponse: number[] = [];
  const paymentApproval: number[] = [];
  const issuance: number[] = [];
  for (const request of requests) {
    const rows = (byRequest.get(request.id) ?? []).slice().sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const since = (row: HistoryRow | undefined): number | null => (row ? (row.createdAt.getTime() - request.createdAt.getTime()) / HOUR : null);
    const first = since(rows.find((row) => !NOT_A_DESK_RESPONSE.has(row.action)));
    const paid = since(rows.find((row) => row.action === "payment_approved"));
    const issued = since(rows.find((row) => row.action === "pnr_issued"));
    if (first !== null && first >= 0) firstResponse.push(first);
    if (paid !== null && paid >= 0) paymentApproval.push(paid);
    if (issued !== null && issued >= 0) issuance.push(issued);
  }
  const med = (values: number[]) => { const value = median(values); return value === null ? null : round1(value); };
  return { requests: requests.length, firstResponseMedianHours: med(firstResponse), firstResponseCount: firstResponse.length, paymentApprovalMedianHours: med(paymentApproval), paymentApprovalCount: paymentApproval.length, issuanceMedianHours: med(issuance), issuanceCount: issuance.length };
}

export type StaleReason = "no_response" | "payment_to_verify" | "issued_without_document" | "departure_soon_unissued";
export type StaleItem = { requestId: number; requestRef: string; reason: StaleReason; hours: number; priority: string; assignedAgentEmail: string | null };

/** Demandes qui demandent une action du comptoir maintenant, les plus anciennes d'abord. */
export function findStaleRequests(requests: DeskRequest[], history: HistoryRow[], now: Date): StaleItem[] {
  const byRequest = new Map<number, HistoryRow[]>();
  for (const row of history) byRequest.set(row.requestId, [...(byRequest.get(row.requestId) ?? []), row]);
  const items: StaleItem[] = [];
  for (const request of requests) {
    const rows = byRequest.get(request.id) ?? [];
    const item = (reason: StaleReason, since: Date): StaleItem => ({ requestId: request.id, requestRef: request.requestRef, reason, hours: Math.round((now.getTime() - since.getTime()) / HOUR), priority: request.priority, assignedAgentEmail: request.assignedAgentEmail });
    const ageHours = (now.getTime() - request.createdAt.getTime()) / HOUR;
    if (request.status === "pending_review" && ageHours > DESK_THRESHOLDS.firstResponseHours && !rows.some((row) => !NOT_A_DESK_RESPONSE.has(row.action))) items.push(item("no_response", request.createdAt));
    if (request.status === "awaiting_payment" && request.clientValidated) {
      const declared = rows.filter((row) => row.action === "client_validated").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      const since = declared?.createdAt ?? request.createdAt;
      if ((now.getTime() - since.getTime()) / HOUR > DESK_THRESHOLDS.paymentCheckHours) items.push(item("payment_to_verify", since));
    }
    if (request.status === "issued" && !request.issuedPdfUrl) {
      const issuedRow = rows.filter((row) => row.action === "pnr_issued").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      items.push(item("issued_without_document", issuedRow?.createdAt ?? request.createdAt));
    }
    if (request.status !== "issued" && request.status !== "cancelled") {
      const departure = departureAtOf(request.flightData);
      if (departure && departure.getTime() > now.getTime() && departure.getTime() - now.getTime() <= 3 * 24 * HOUR) items.push(item("departure_soon_unissued", request.createdAt));
    }
  }
  return items.sort((a, b) => b.hours - a.hours);
}

export const STALE_LABELS: Record<StaleReason, string> = {
  no_response: "Aucune réponse du comptoir",
  payment_to_verify: "Paiement déclaré à vérifier",
  issued_without_document: "Billet émis sans document joint",
  departure_soon_unissued: "Départ dans moins de 3 jours, billet non émis",
};

// ─── Demandes de modification / d'annulation du client ─────────────────────────────────────────────────────────

export const CHANGE_KINDS = ["change_date", "cancel", "correct_name", "other"] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];
export const CHANGE_KIND_LABELS: Record<ChangeKind, string> = { change_date: "Changer la date", cancel: "Annuler la réservation", correct_name: "Corriger un nom", other: "Autre demande" };

export type ChangeRequestView = { id: number; requestId: number; kind: ChangeKind; message: string; createdAt: Date; handledAt: Date | null; handledNote: string | null };

/** Demandes du client, avec l'état « traitée » déduit des lignes `change_request_handled` (qui portent l'id de la demande dans newValue). */
export function collectChangeRequests(history: HistoryRow[]): ChangeRequestView[] {
  const handled = new Map<number, HistoryRow>();
  for (const row of history) if (row.action === HISTORY.changeHandled) handled.set(Number(row.newValue), row);
  return history
    .filter((row) => row.action === HISTORY.changeRequest && typeof row.id === "number")
    .map((row) => {
      const done = handled.get(row.id as number);
      const kind = (CHANGE_KINDS as readonly string[]).includes(String(row.oldValue)) ? (row.oldValue as ChangeKind) : "other";
      return { id: row.id as number, requestId: row.requestId, kind, message: row.details ?? "", createdAt: row.createdAt, handledAt: done?.createdAt ?? null, handledNote: done?.details ?? null };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
