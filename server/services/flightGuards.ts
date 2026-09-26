import { and, desc, eq } from "drizzle-orm";
import { flightBookingRequestHistory, type FlightBookingRequest } from "../../drizzle/schema";
import { refuseWithoutFreshFare, type FareComparison } from "../../shared/flightFareCheck";
import { HISTORY } from "../../shared/flightFollowUps";
import { assessTravelers } from "../../shared/flightTravelerCheck";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Dernier contrôle du tarif enregistré dans l'historique de la demande (résultat + date), ou null. */
export async function lastFareCheck(db: Db, requestId: number): Promise<{ kind: FareComparison["kind"]; at: Date } | null> {
  const [row] = await db.select().from(flightBookingRequestHistory).where(and(eq(flightBookingRequestHistory.requestId, requestId), eq(flightBookingRequestHistory.action, HISTORY.fareChecked))).orderBy(desc(flightBookingRequestHistory.createdAt)).limit(1);
  if (!row) return null;
  return { kind: (row.newValue as FareComparison["kind"]) ?? "unavailable", at: row.createdAt };
}

/**
 * Demander un paiement suppose un tarif relevé récemment : la création de la demande ou le dernier contrôle compte, le plus récent des deux.
 * Renvoie le motif du refus (dérogation motivée possible), ou null.
 */
export async function fareRefusal(db: Db, request: Pick<FlightBookingRequest, "id" | "createdAt">, now: Date, waiverReason?: string | null): Promise<string | null> {
  const last = await lastFareCheck(db, request.id);
  const referenceAt = last && last.at > request.createdAt ? last.at : request.createdAt;
  return refuseWithoutFreshFare({ referenceAt, now, waiverReason, lastCheck: last?.kind ?? null });
}

/** L'émission d'un billet exige les données passeport de tous les voyageurs, valides pour le voyage. Renvoie le motif du refus, ou null. */
export function travelerRefusal(request: Pick<FlightBookingRequest, "flightData" | "passengerData">, now: Date): string | null {
  const readiness = assessTravelers({ flightData: request.flightData, passengerData: request.passengerData, today: now });
  if (readiness.complete) return null;
  const detail = readiness.messages.slice(0, 3).join(" ");
  return `Émission impossible : données passeport des voyageurs incomplètes ou invalides. ${detail} Enregistrez-les dans le dossier (ou demandez-les au client) avant d’émettre.`.trim();
}
