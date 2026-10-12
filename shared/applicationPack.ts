import { z } from "zod";
import { CV_LANGUAGES, CV_STYLE_KEYS, CvDraftSchema, styleForCountry, type CvDraft, type CvLanguage, type CvStyleKey } from "./cvDraft";

/**
 * Pack candidature international : CV relu par l’agence (+ lettre de motivation optionnelle),
 * publié dans l’espace candidat pour postuler. Stocké dans projectDetailsJson.applicationPack
 * (pas de migration) — jamais inventé côté modèle, seulement relu et validé par un admin.
 */

export const ApplicationPackSchema = z.object({
  releasedAt: z.string().min(10).max(40),
  releasedBy: z.string().trim().min(3).max(320),
  style: z.enum(CV_STYLE_KEYS),
  language: z.enum(CV_LANGUAGES),
  includeContact: z.boolean(),
  targetRole: z.string().trim().max(160).nullable().optional(),
  draft: CvDraftSchema,
  motivationLetter: z.string().trim().max(4000).nullable().optional(),
});
export type ApplicationPack = z.infer<typeof ApplicationPackSchema>;

export type SupportingDocumentFact = {
  label: string;
  kind: "cv" | "diploma" | "experience" | "language" | "other";
};

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Classe une pièce fournie pour enrichir le prompt CV (faits déclarés, pas inventés). */
export function classifySupportingDocument(label: string): SupportingDocumentFact["kind"] {
  const key = fold(label);
  if (/(^| )cv( |$)|curriculum|resume/.test(key)) return "cv";
  if (/diplome|releve|transcript|degree|bachelor|master|licence|certificat scolaire/.test(key)) return "diploma";
  if (/experience|attestation|employeur|contrat|reference|travail|emploi/.test(key)) return "experience";
  if (/langue|ielts|toefl|tcf|delf|dalf|toeic|language/.test(key)) return "language";
  return "other";
}

/**
 * Construit une liste courte de faits issus des libellés de documents fournis
 * (diplômes, attestations…) pour aider le générateur sans inventer de contenu.
 */
export function supportingFactsFromDocuments(
  documents: Array<{ documentType?: string | null; documentName?: string | null; fileName?: string | null; verificationStatus?: string | null; status?: string | null }>,
  max = 16,
): SupportingDocumentFact[] {
  const seen = new Set<string>();
  const facts: SupportingDocumentFact[] = [];
  for (const document of documents) {
    const label = String(document.documentType || document.documentName || document.fileName || "").trim();
    if (!label) continue;
    const key = fold(label);
    if (!key || seen.has(key)) continue;
    const status = fold(String(document.verificationStatus || document.status || ""));
    // On privilégie les pièces reçues / validées ; on ignore les rejetées.
    if (status.includes("reject") || status.includes("refuse")) continue;
    seen.add(key);
    facts.push({ label: label.slice(0, 160), kind: classifySupportingDocument(label) });
    if (facts.length >= max) break;
  }
  return facts;
}

export function parseApplicationPack(projectDetailsJson?: string | null): ApplicationPack | null {
  if (!projectDetailsJson) return null;
  try {
    const details = JSON.parse(projectDetailsJson) as Record<string, unknown>;
    const parsed = ApplicationPackSchema.safeParse(details.applicationPack);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Fusionne / retire le pack dans projectDetailsJson sans toucher aux autres clés (consentements…). */
export function writeApplicationPackJson(projectDetailsJson: string | null | undefined, pack: ApplicationPack | null): string {
  let details: Record<string, unknown> = {};
  if (projectDetailsJson) {
    try {
      const parsed = JSON.parse(projectDetailsJson);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) details = parsed as Record<string, unknown>;
    } catch {
      details = {};
    }
  }
  if (pack) details.applicationPack = pack;
  else delete details.applicationPack;
  return JSON.stringify(details);
}

export type ApplicationReadinessInput = {
  destination?: string | null;
  hasCvFile: boolean;
  documents: Array<{ documentType?: string | null; documentName?: string | null; fileName?: string | null; verificationStatus?: string | null; status?: string | null }>;
  pack: ApplicationPack | null;
};

export type ApplicationReadiness = {
  score: number;
  readyToApply: boolean;
  recommendedStyle: CvStyleKey;
  recommendedLanguage: CvLanguage;
  checks: Array<{ key: string; label: string; done: boolean; detail: string }>;
};

/** Tableau de bord candidat : où en est le pack pour postuler. */
export function buildApplicationReadiness(input: ApplicationReadinessInput): ApplicationReadiness {
  const recommendedStyle = styleForCountry(input.destination);
  const recommendedLanguage = recommendedStyle === "international" ? "en" : "fr";
  const facts = supportingFactsFromDocuments(input.documents);
  const hasDiploma = facts.some((fact) => fact.kind === "diploma");
  const hasExperienceProof = facts.some((fact) => fact.kind === "experience");
  const hasLanguageProof = facts.some((fact) => fact.kind === "language");
  const packReady = Boolean(input.pack?.draft);
  const letterReady = Boolean(input.pack?.motivationLetter?.trim());

  const checks = [
    { key: "cv_source", label: "CV source déposé", done: input.hasCvFile, detail: input.hasCvFile ? "Votre CV d’évaluation est enregistré." : "Déposez votre CV dans l’évaluation ou le centre documentaire." },
    { key: "diploma", label: "Diplôme / relevé fourni", done: hasDiploma, detail: hasDiploma ? "Une pièce diplômante figure dans vos documents." : "Ajoutez diplôme ou relevé pour renforcer le pack." },
    { key: "experience", label: "Preuve d’expérience", done: hasExperienceProof, detail: hasExperienceProof ? "Attestation ou contrat détecté parmi vos pièces." : "Ajoutez une attestation d’emploi si vous en avez une." },
    { key: "language", label: "Preuve de langue (selon le cas)", done: hasLanguageProof, detail: hasLanguageProof ? "Résultat linguistique présent." : "Facultatif sauf si la destination l’exige." },
    { key: "cv_pack", label: "CV international publié par l’agence", done: packReady, detail: packReady ? `Format ${input.pack!.style} · ${input.pack!.language.toUpperCase()} prêt à télécharger.` : "L’agence prépare puis publie votre CV international après relecture." },
    { key: "letter", label: "Lettre de motivation", done: letterReady, detail: letterReady ? "Lettre jointe au pack." : "Optionnelle : l’agence peut en joindre une ciblée au poste." },
  ];

  const weights = { cv_source: 25, diploma: 15, experience: 15, language: 10, cv_pack: 25, letter: 10 } as const;
  const score = Math.min(100, checks.reduce((sum, check) => sum + (check.done ? weights[check.key as keyof typeof weights] : 0), 0));
  return {
    score,
    readyToApply: packReady && input.hasCvFile,
    recommendedStyle,
    recommendedLanguage,
    checks,
  };
}

export function draftHasMinimumContent(draft: CvDraft): boolean {
  return Boolean(
    (draft.headline?.trim() || draft.summary?.trim())
    && (draft.experiences.length > 0 || draft.education.length > 0),
  );
}
