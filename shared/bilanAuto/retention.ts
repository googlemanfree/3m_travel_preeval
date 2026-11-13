/**
 * Politique de conservation du bilan automatisé — PROPOSITION À VALIDER. Aucune purge n'est exécutée tant que `approvedAt` est vide :
 * `planRetention` ne fait que lister (simulation), jamais supprimer. Les durées sont des propositions de gestion, pas des durées légales :
 * les obligations de conservation (comptabilité, fiscalité, litiges, droit local applicable) sont à vérifier avec le conseil de l'agence.
 */
export type RetentionCategory = "dossiers_actifs" | "dossiers_inactifs" | "cv_justificatifs" | "bilans_historique" | "journaux_techniques" | "sauvegardes";

export type RetentionRule = {
  category: RetentionCategory;
  label: string;
  /** Durée proposée en jours après l'événement de départ ; null = tant que la finalité existe. */
  days: number | null;
  startsAt: string;
  justification: string;
  /** Points à vérifier avant approbation. */
  toVerify: string;
};

export type RetentionPolicy = { version: number; approvedAt: string | null; approvedBy: string | null; purgeEnabled: boolean; noticeDays: number; rules: RetentionRule[] };

export const PROPOSED_RETENTION_POLICY: RetentionPolicy = {
  version: 1,
  approvedAt: null,
  approvedBy: null,
  purgeEnabled: false,
  noticeDays: 30,
  rules: [
    { category: "dossiers_actifs", label: "Dossiers actifs", days: null, startsAt: "tant que le dossier est en cours", justification: "Le traitement se justifie tant que le candidat poursuit sa démarche.", toVerify: "Définir ce qu'est un dossier « actif » (dernière connexion, dernier échange, paiement en cours)." },
    { category: "dossiers_inactifs", label: "Dossiers inactifs ou abandonnés", days: 365, startsAt: "dernière activité du candidat", justification: "Un an sans activité laisse le temps de reprendre la démarche ; un préavis de 30 jours est envoyé avant suppression.", toVerify: "Durée à confirmer ; prévoir une relance avant suppression." },
    { category: "cv_justificatifs", label: "CV et justificatifs", days: 365, startsAt: "clôture ou dernière activité du dossier", justification: "Documents les plus sensibles : conservation la plus courte compatible avec le suivi du candidat.", toVerify: "Obligations de conservation éventuelles selon la prestation réalisée (contrat, paiement)." },
    { category: "bilans_historique", label: "Bilans et historique de notes", days: 730, startsAt: "date de publication du bilan", justification: "Permet le rappel d'une évaluation antérieure et le réexamen ; le candidat peut demander la suppression à tout moment.", toVerify: "Durée à confirmer ; l'historique nécessaire à une réclamation peut justifier une durée plus longue." },
    { category: "journaux_techniques", label: "Journaux techniques", days: 90, startsAt: "date de l'événement", justification: "Diagnostic des incidents ; aucun CV ni document n'y figure (références et empreintes seulement).", toVerify: "Journaux d'audit des corrections administrateur : durée éventuellement plus longue à décider." },
    { category: "sauvegardes", label: "Sauvegardes", days: 35, startsAt: "date de la sauvegarde", justification: "Rotation courte : une suppression demandée disparaît des sauvegardes au plus tard à la fin de la rotation.", toVerify: "Rotation réelle du prestataire d'hébergement et de base de données." },
  ],
};

export const isRetentionApproved = (policy: RetentionPolicy) => Boolean(policy.approvedAt && policy.approvedBy);

export type RetentionItem = { kind: RetentionCategory; id: string; referenceDate: Date };
export type RetentionPlan = { executable: boolean; reason: string; due: Array<{ item: RetentionItem; dueSince: Date }>; notice: Array<{ item: RetentionItem; deleteOn: Date }> };

/** Simulation : liste ce qui serait supprimé ou annoncé. N'exécute rien, même si la politique est approuvée (l'exécution est un autre module, volontairement absent). */
export function planRetention(items: RetentionItem[], policy: RetentionPolicy, now: Date): RetentionPlan {
  const executable = isRetentionApproved(policy) && policy.purgeEnabled;
  const due: RetentionPlan["due"] = [];
  const notice: RetentionPlan["notice"] = [];
  for (const item of items) {
    const rule = policy.rules.find((entry) => entry.category === item.kind);
    if (!rule || rule.days === null) continue;
    const deadline = new Date(item.referenceDate.getTime() + rule.days * 86_400_000);
    if (deadline <= now) due.push({ item, dueSince: deadline });
    else if (deadline.getTime() - now.getTime() <= policy.noticeDays * 86_400_000) notice.push({ item, deleteOn: deadline });
  }
  return { executable, reason: executable ? "Politique approuvée : exécution possible par le module de purge." : "Politique non approuvée ou purge désactivée : simulation uniquement, aucune suppression.", due, notice };
}
