/** Pilotage avancé : calculs purs (qualité des données, entonnoir, rapport, satisfaction, rapprochement offres/profils). */

// ───────────── Qualité des données ─────────────
export const digitsOf = (value: string | null | undefined): string => String(value ?? "").replace(/[^\d]/g, "").replace(/^00/, "");

/** Problème de numéro de téléphone, ou null s'il est plausible. */
export function phoneIssue(phone: string | null | undefined): "missing" | "invalid" | null {
  const raw = String(phone ?? "").trim();
  if (!raw || /^non renseign/i.test(raw)) return "missing";
  const digits = digitsOf(raw);
  if (digits.length < 8 || digits.length > 15 || /^(\d)\1+$/.test(digits)) return "invalid";
  return null;
}

const EMAIL_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmil.com": "gmail.com", "gnail.com": "gmail.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmail.con": "hotmail.com", "hormail.com": "hotmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.con": "yahoo.com", "yahoo.fr.com": "yahoo.fr",
  "outlok.com": "outlook.com", "outlook.con": "outlook.com", "iclod.com": "icloud.com",
};

/** Adresse probablement mal saisie : la correction proposée, ou null. */
export function emailTypoSuggestion(email: string | null | undefined): string | null {
  const value = String(email ?? "").trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at < 1) return null;
  const fixed = EMAIL_TYPOS[value.slice(at + 1)];
  return fixed ? `${value.slice(0, at)}@${fixed}` : null;
}

export const foldName = (value: string | null | undefined): string => String(value ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean).sort().join(" ");

export type QualityIssueCode = "phone_missing" | "phone_invalid" | "email_typo" | "duplicate_phone" | "duplicate_identity" | "active_without_destination";
export const QUALITY_LABELS: Record<QualityIssueCode, { label: string; severity: "low" | "medium" | "high"; help: string }> = {
  phone_missing: { label: "Téléphone manquant", severity: "medium", help: "Sans numéro, ni relance WhatsApp ni appel." },
  phone_invalid: { label: "Téléphone invalide", severity: "medium", help: "Moins de 8 chiffres, trop long ou chiffres répétés." },
  email_typo: { label: "Adresse e-mail probablement mal saisie", severity: "high", help: "Le candidat ne recevra aucun message : corrigez avec lui." },
  duplicate_phone: { label: "Même téléphone sur plusieurs comptes", severity: "medium", help: "Doublon probable ou compte créé deux fois." },
  duplicate_identity: { label: "Même nom et même date de naissance", severity: "high", help: "Doublon probable : fusionnez ou archivez l'un des comptes." },
  active_without_destination: { label: "Dossier actif sans destination précise", severity: "medium", help: "Le parcours et la liste de pièces ne peuvent pas s'adapter." },
};

export type QualityCandidate = { id: number; fullName: string; email: string; phone: string | null; dateOfBirth: string | null; destination: string | null; preferredDestinations: string | null; dossierStatus: string };
export type QualityIssue = { code: QualityIssueCode; candidateId: number; fullName: string; detail: string };

const hasPreferredDestination = (raw: string | null) => {
  try { const parsed = JSON.parse(raw || "[]"); return Array.isArray(parsed) && parsed.some((item) => typeof item === "string" && item.trim()); } catch { return false; }
};

export function findQualityIssues(candidates: QualityCandidate[]): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const byPhone = new Map<string, QualityCandidate[]>();
  const byIdentity = new Map<string, QualityCandidate[]>();
  for (const candidate of candidates) {
    const phone = phoneIssue(candidate.phone);
    if (phone === "missing") issues.push({ code: "phone_missing", candidateId: candidate.id, fullName: candidate.fullName, detail: "Aucun numéro enregistré" });
    else if (phone === "invalid") issues.push({ code: "phone_invalid", candidateId: candidate.id, fullName: candidate.fullName, detail: String(candidate.phone) });
    const suggestion = emailTypoSuggestion(candidate.email);
    if (suggestion) issues.push({ code: "email_typo", candidateId: candidate.id, fullName: candidate.fullName, detail: `${candidate.email} → ${suggestion} ?` });
    const digits = digitsOf(candidate.phone);
    if (!phone && digits) byPhone.set(digits, [...(byPhone.get(digits) ?? []), candidate]);
    const name = foldName(candidate.fullName);
    const birth = String(candidate.dateOfBirth ?? "").trim();
    if (name.length >= 5 && birth) byIdentity.set(`${name}|${birth}`, [...(byIdentity.get(`${name}|${birth}`) ?? []), candidate]);
    if (candidate.dossierStatus !== "nouveau" && candidate.dossierStatus !== "evaluation" && !hasPreferredDestination(candidate.preferredDestinations) && (!candidate.destination || candidate.destination === "autre")) {
      issues.push({ code: "active_without_destination", candidateId: candidate.id, fullName: candidate.fullName, detail: "Destination : « autre » ou vide" });
    }
  }
  for (const group of Array.from(byPhone.values())) if (group.length > 1) for (const candidate of group) issues.push({ code: "duplicate_phone", candidateId: candidate.id, fullName: candidate.fullName, detail: `Partagé avec ${group.filter((other) => other.id !== candidate.id).map((other) => `COMPTE-${String(other.id).padStart(5, "0")}`).join(", ")}` });
  for (const group of Array.from(byIdentity.values())) if (group.length > 1) for (const candidate of group) issues.push({ code: "duplicate_identity", candidateId: candidate.id, fullName: candidate.fullName, detail: `Même identité que ${group.filter((other) => other.id !== candidate.id).map((other) => `COMPTE-${String(other.id).padStart(5, "0")}`).join(", ")}` });
  return issues;
}

// ───────────── Entonnoir et rapport ─────────────
export type FunnelStage = { key: string; label: string; count: number };
export type FunnelStats = { days: number; stages: FunnelStage[]; sources: Array<{ source: string; accounts: number }>; destinations: Array<{ destination: string; accounts: number }> };

export const SOURCE_LABELS: Record<string, string> = { facebook: "Facebook", whatsapp: "WhatsApp", direct: "Accès direct", other: "Autre" };

/** Taux de passage d'une étape à la suivante (null si l'étape précédente est vide). */
export function conversionRates(stages: FunnelStage[]): Array<number | null> {
  return stages.map((stage, index) => (index === 0 || stages[index - 1].count === 0 ? null : Math.round((stage.count / stages[index - 1].count) * 100)));
}

export function buildWeeklyReportText(input: { generatedOn: Date; funnel: FunnelStats; blocked: number; openRequests: number; waitingUrgent: number; proofsToCheck: number; activationsWithoutProof: number; satisfaction: { responses: number; nps: number | null } }): string {
  const rates = conversionRates(input.funnel.stages);
  const lines: string[] = [];
  lines.push(`Rapport de pilotage — ${input.generatedOn.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`);
  lines.push(`Période : ${input.funnel.days} derniers jours`);
  lines.push("");
  lines.push("ENTONNOIR");
  input.funnel.stages.forEach((stage, index) => lines.push(`- ${stage.label} : ${stage.count}${rates[index] !== null ? ` (${rates[index]} % de l'étape précédente)` : ""}`));
  if (input.funnel.sources.length) lines.push(`- Sources des nouveaux comptes : ${input.funnel.sources.map((item) => `${SOURCE_LABELS[item.source] ?? item.source} ${item.accounts}`).join(" · ")}`);
  lines.push("");
  lines.push("À TRAITER");
  lines.push(`- Demandes ouvertes : ${input.openRequests}, dont ${input.blocked} sans activité depuis plus de 7 jours`);
  lines.push(`- Messages urgents sans réponse : ${input.waitingUrgent}`);
  lines.push(`- Preuves de paiement à vérifier : ${input.proofsToCheck}`);
  lines.push(`- Dossiers activés sans preuve de paiement : ${input.activationsWithoutProof}`);
  lines.push("");
  lines.push("SATISFACTION");
  lines.push(input.satisfaction.responses ? `- ${input.satisfaction.responses} réponse(s), indice de recommandation : ${input.satisfaction.nps ?? "n/d"}` : "- Aucune réponse sur la période");
  return lines.join("\n");
}

// ───────────── Satisfaction ─────────────
/** Indice de recommandation : % de promoteurs (9-10) moins % de détracteurs (0-6) ; null sans réponse. */
export function computeNps(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const promoters = scores.filter((score) => score >= 9).length;
  const detractors = scores.filter((score) => score <= 6).length;
  return Math.round(((promoters - detractors) / scores.length) * 100);
}

export const SATISFACTION_MILESTONES = { dossier: "Ouverture de votre dossier", rdv: "Votre rendez-vous en ligne" } as const;

// ───────────── Rapprochement offres / profils ─────────────
export type MatchOffer = { countryName: string; title: string; description: string; experienceMinYears: number | null; languages: Array<{ lang: string; required?: boolean }> };
export type MatchProfile = { profileCode: string; summary: string; targetDestination: string; sector: string | null; yearsExperience: string | null; languagesSummary: string | null };

const fold = (value: string | null | undefined) => String(value ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const STOP = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "un", "une", "pour", "avec", "dans", "sur", "au", "aux", "par", "poste", "emploi", "agent", "assistant"]);
const words = (value: string) => fold(value).split(/[^a-z0-9]+/).filter((word) => word.length >= 4 && !STOP.has(word));

/** Score 0-100 et raisons lisibles. Aucune donnée personnelle : le rapprochement n'utilise que la fiche anonymisée et consentie. */
export function scoreOfferMatch(offer: MatchOffer, profile: MatchProfile): { score: number; reasons: string[]; blockers: string[] } {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;
  if (fold(profile.targetDestination).includes(fold(offer.countryName))) { score += 40; reasons.push(`Destination visée : ${offer.countryName}`); }
  else blockers.push(`Destination visée : ${profile.targetDestination}`);
  const offerWords = new Set([...words(offer.title), ...words(offer.description).slice(0, 40)]);
  const profileWords = words(`${profile.sector ?? ""} ${profile.summary}`);
  const common = Array.from(new Set(profileWords.filter((word) => offerWords.has(word)))).slice(0, 4);
  if (common.length > 0) { score += Math.min(30, common.length * 10); reasons.push(`Mots communs : ${common.join(", ")}`); }
  const years = Number((profile.yearsExperience ?? "").match(/\d+/)?.[0] ?? NaN);
  if (offer.experienceMinYears !== null && Number.isFinite(years)) {
    if (years >= offer.experienceMinYears) { score += 15; reasons.push(`Expérience : ${years} an(s) pour ${offer.experienceMinYears} demandé(s)`); }
    else blockers.push(`Expérience : ${years} an(s) pour ${offer.experienceMinYears} demandé(s)`);
  }
  const spoken = fold(profile.languagesSummary);
  const required = offer.languages.filter((language) => language.required);
  const matched = required.filter((language) => spoken.includes(fold(language.lang)));
  if (required.length > 0) {
    if (matched.length === required.length) { score += 15; reasons.push(`Langues exigées couvertes : ${required.map((language) => language.lang).join(", ")}`); }
    else blockers.push(`Langues à vérifier : ${required.filter((language) => !matched.includes(language)).map((language) => language.lang).join(", ")}`);
  } else score += 5;
  return { score: Math.min(100, score), reasons, blockers };
}
