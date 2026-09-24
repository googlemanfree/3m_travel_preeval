/**
 * Synchronisation de l'espace client avec le back-office : ce que l'administrateur change (statut d'un dossier,
 * pièce validée ou à corriger, évaluation publiée, e-Visa, assurance, message) doit se voir sans recharger la page,
 * et le candidat doit en être averti. Logique pure : le composant ne fait que rafraîchir, comparer et afficher.
 */

import { clientCaseStatusLabel, clientEvisaStatusLabel, clientInsuranceStatusLabel, humanizeStatus } from "../../../shared/caseStatusLabels";

export const CLIENT_SPACE_POLL_MS = 30_000;
export const CLIENT_SPACE_SUMMARY_POLL_MS = 60_000;
export const CLIENT_SPACE_MAX_ANNOUNCEMENTS = 3;

/** Options react-query : rafraîchissement régulier tant que l'onglet est visible (jamais en arrière-plan). */
export const clientSpacePolling = (intervalMs: number = CLIENT_SPACE_POLL_MS) =>
  ({ refetchInterval: intervalMs, refetchIntervalInBackground: false, refetchOnWindowFocus: true, refetchOnReconnect: true }) as const;

type EvaluationStage = "not_started" | "pending" | "info_requested" | "published";
type Tracked = { status: string; label: string };

/** Une facette absente (`undefined`) n'est pas encore chargée : elle n'est jamais comparée. */
export type ClientSpaceSnapshot = {
  evaluationStage?: EvaluationStage;
  cases?: Record<string, Tracked>;
  requirements?: Record<string, Tracked & { caseId: string }>;
  insurance?: Record<string, Tracked & { coupon: boolean; attestation: boolean }>;
  evisa?: Record<string, Tracked & { issued: boolean }>;
  /** Toutes les notifications connues : un identifiant déjà vu (même remis « non lu » par le candidat) n'est jamais réannoncé. */
  notifications?: Record<string, { title: string; body: string; caseId: string | null; unread: boolean }>;
};

export type ClientSpaceChange = { id: string; tone: "info" | "success" | "warning"; title: string; description?: string };

const STAGES: readonly string[] = ["not_started", "pending", "info_requested", "published"];

const asArray = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
const text = (value: unknown, max = 160): string => (typeof value === "string" ? value.trim().slice(0, max) : "");
const idOf = (value: unknown): string | null => (typeof value === "number" || typeof value === "string") && String(value).trim() !== "" ? String(value) : null;

export { humanizeStatus };

/** Instantané des données que l'administrateur peut faire évoluer ; chaque entrée est lue avec prudence (données serveur). */
export function buildClientSpaceSnapshot(input: { evaluation?: unknown; cases?: unknown; insurance?: unknown; evisa?: unknown }): ClientSpaceSnapshot {
  const snapshot: ClientSpaceSnapshot = {};

  const stage = (input.evaluation as { view?: { stage?: unknown } } | undefined)?.view?.stage;
  if (typeof stage === "string" && STAGES.includes(stage)) snapshot.evaluationStage = stage as EvaluationStage;

  if (input.cases && typeof input.cases === "object") {
    const source = input.cases as { cases?: unknown; notifications?: unknown };
    const cases: NonNullable<ClientSpaceSnapshot["cases"]> = {};
    const requirements: NonNullable<ClientSpaceSnapshot["requirements"]> = {};
    for (const item of asArray(source.cases)) {
      const id = idOf(item.id);
      if (!id) continue;
      cases[id] = { status: text(item.currentStatus, 80), label: text(item.caseNumber, 40) || `#${id}` };
      for (const requirement of asArray(item.requirements)) {
        const requirementId = idOf(requirement.id);
        if (requirementId) requirements[requirementId] = { status: text(requirement.status, 40), label: humanizeStatus(text(requirement.documentType, 100)), caseId: id };
      }
    }
    snapshot.cases = cases;
    snapshot.requirements = requirements;
    const notifications: NonNullable<ClientSpaceSnapshot["notifications"]> = {};
    for (const item of asArray(source.notifications)) {
      const id = idOf(item.id);
      if (!id) continue;
      notifications[id] = { title: text(item.title, 200), body: text(item.body, 400), caseId: idOf(item.caseId), unread: item.isRead !== true && item.isArchived !== true };
    }
    snapshot.notifications = notifications;
  }

  if (Array.isArray(input.insurance)) {
    snapshot.insurance = {};
    for (const item of asArray(input.insurance)) {
      const id = idOf(item.id);
      if (id) snapshot.insurance[id] = { status: text(item.status, 40), label: text(item.reference, 40) || `#${id}`, coupon: Boolean(item.couponFileName), attestation: Boolean(item.attestationFileName) };
    }
  }

  const evisaList = (input.evisa as { data?: unknown } | undefined)?.data;
  if (Array.isArray(evisaList)) {
    snapshot.evisa = {};
    for (const item of asArray(evisaList)) {
      const id = idOf(item.id);
      if (id) snapshot.evisa[id] = { status: text(item.status, 40), label: text(item.countryName, 80) || `#${id}`, issued: Boolean(item.issuedPdfUrl) };
    }
  }
  return snapshot;
}

/** Fusionne sans perdre une facette déjà connue quand la requête suivante n'est pas encore revenue. */
export function mergeClientSpaceSnapshots(previous: ClientSpaceSnapshot | null, next: ClientSpaceSnapshot): ClientSpaceSnapshot {
  return { ...(previous ?? {}), ...Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined)) };
}

/**
 * Ce qui a changé côté back-office entre deux instantanés. La première lecture (`previous` nul) sert de référence :
 * aucune annonce pour ce que le candidat vient de charger.
 */
export function diffClientSpace(previous: ClientSpaceSnapshot | null, next: ClientSpaceSnapshot): ClientSpaceChange[] {
  if (!previous) return [];
  const changes: ClientSpaceChange[] = [];

  // Un message de l'équipe (notification) est prioritaire sur l'annonce générique de changement d'état du même dossier.
  const announcedCases = new Set<string>();
  if (previous.notifications && next.notifications) {
    for (const [id, notification] of Object.entries(next.notifications)) {
      if (previous.notifications[id] || !notification.unread) continue;
      if (notification.caseId) announcedCases.add(notification.caseId);
      changes.push({ id: `notification-${id}`, tone: "info", title: notification.title || "Nouveau message de l’équipe 3M", description: notification.body ? notification.body.slice(0, 160) : undefined });
    }
  }

  if (previous.evaluationStage && next.evaluationStage && previous.evaluationStage !== next.evaluationStage) {
    if (next.evaluationStage === "published") changes.push({ id: "evaluation-published", tone: "success", title: "Votre évaluation est disponible", description: "Ouvrez la section Évaluation pour consulter votre rapport." });
    else if (next.evaluationStage === "info_requested") changes.push({ id: "evaluation-info", tone: "warning", title: "L’équipe 3M vous demande des informations complémentaires", description: "Répondez depuis la section Évaluation pour que votre analyse avance." });
  }

  if (previous.cases && next.cases) {
    for (const [id, current] of Object.entries(next.cases)) {
      const before = previous.cases[id];
      if (!before) changes.push({ id: `case-new-${id}`, tone: "info", title: "Un dossier a été ouvert pour vous", description: `Dossier N° ${current.label}.` });
      else if (before.status !== current.status && current.status && !announcedCases.has(id)) changes.push({ id: `case-${id}`, tone: "info", title: `Votre dossier N° ${current.label} a évolué`, description: `Nouvel état : ${clientCaseStatusLabel(current.status)}.` });
    }
  }

  if (previous.requirements && next.requirements) {
    for (const [id, current] of Object.entries(next.requirements)) {
      const before = previous.requirements[id];
      if (!before || before.status === current.status) continue;
      if (current.status === "approved") changes.push({ id: `requirement-${id}`, tone: "success", title: `Pièce validée : ${current.label}` });
      else if (current.status === "rejected") changes.push({ id: `requirement-${id}`, tone: "warning", title: `Pièce à corriger : ${current.label}`, description: "Déposez une nouvelle version depuis votre checklist." });
    }
  }

  if (previous.insurance && next.insurance) {
    for (const [id, current] of Object.entries(next.insurance)) {
      const before = previous.insurance[id];
      if (!before) continue;
      if (!before.coupon && current.coupon) changes.push({ id: `insurance-coupon-${id}`, tone: "success", title: "Votre coupon d’assurance voyage est disponible", description: `Demande ${current.label}.` });
      else if (!before.attestation && current.attestation) changes.push({ id: `insurance-attestation-${id}`, tone: "success", title: "Votre attestation d’assurance voyage est disponible", description: `Demande ${current.label}.` });
      else if (before.status !== current.status && current.status) changes.push({ id: `insurance-${id}`, tone: "info", title: `Assurance voyage ${current.label} : statut mis à jour`, description: `Nouvel état : ${clientInsuranceStatusLabel(current.status)}.` });
    }
  }

  if (previous.evisa && next.evisa) {
    for (const [id, current] of Object.entries(next.evisa)) {
      const before = previous.evisa[id];
      if (!before) continue;
      if (!before.issued && current.issued) changes.push({ id: `evisa-issued-${id}`, tone: "success", title: `Votre e-Visa ${current.label} est disponible`, description: "Téléchargez-le depuis la section Dossier." });
      else if (before.status !== current.status && current.status === "rejected") changes.push({ id: `evisa-${id}`, tone: "warning", title: `Demande d’e-Visa ${current.label} : refusée`, description: "Contactez l’agence pour connaître la suite." });
      else if (before.status !== current.status && current.status) changes.push({ id: `evisa-${id}`, tone: "info", title: `Demande d’e-Visa ${current.label} : statut mis à jour`, description: `Nouvel état : ${clientEvisaStatusLabel(current.status)}.` });
    }
  }
  return changes;
}

/** Au plus quelques annonces, puis un récapitulatif : un rattrapage après une longue absence ne noie pas l'écran. */
export function limitAnnouncements(changes: ClientSpaceChange[], max: number = CLIENT_SPACE_MAX_ANNOUNCEMENTS): ClientSpaceChange[] {
  if (changes.length <= max) return changes;
  const extra = changes.length - max;
  return [...changes.slice(0, max), { id: "more-updates", tone: "info", title: `${extra} autre${extra > 1 ? "s" : ""} mise${extra > 1 ? "s" : ""} à jour`, description: "Consultez votre espace pour le détail." }];
}
