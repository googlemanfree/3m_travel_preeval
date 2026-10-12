import { z } from "zod";
import { CV_LANGUAGES, CV_STYLE_KEYS, CvDraftSchema, styleForCountry, type CvDraft, type CvLanguage, type CvStyleKey } from "./cvDraft";

/**
 * Pack candidature international — OUTIL ADMIN uniquement.
 * L’administrateur prépare CV (+ lettre) à partir des documents fournis pour faire postuler
 * le client. Stocké dans projectDetailsJson.applicationPack (pas de migration).
 * Jamais exposé à l’espace candidat.
 */

export const ApplicationPackSchema = z.object({
  savedAt: z.string().min(10).max(40),
  savedBy: z.string().trim().min(3).max(320),
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

/** Tableau de bord admin : préparation du pack pour postuler au nom du client. */
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
    { key: "cv_source", label: "CV source déposé", done: input.hasCvFile, detail: input.hasCvFile ? "CV d’évaluation enregistré." : "Le client doit avoir un CV d’évaluation exploitable." },
    { key: "diploma", label: "Diplôme / relevé fourni", done: hasDiploma, detail: hasDiploma ? "Pièce diplômante présente dans le dossier." : "Ajouter diplôme ou relevé pour renforcer le pack." },
    { key: "experience", label: "Preuve d’expérience", done: hasExperienceProof, detail: hasExperienceProof ? "Attestation ou contrat détecté." : "Joindre une attestation d’emploi si disponible." },
    { key: "language", label: "Preuve de langue (selon le cas)", done: hasLanguageProof, detail: hasLanguageProof ? "Résultat linguistique présent." : "Facultatif sauf si la destination l’exige." },
    { key: "cv_pack", label: "CV international enregistré (admin)", done: packReady, detail: packReady ? `Format ${input.pack!.style} · ${input.pack!.language.toUpperCase()} prêt pour candidature.` : "Enregistrez le CV relu pour pouvoir postuler au nom du client." },
    { key: "letter", label: "Lettre de motivation", done: letterReady, detail: letterReady ? "Lettre jointe au pack admin." : "Optionnelle : joindre une lettre ciblée au poste." },
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
