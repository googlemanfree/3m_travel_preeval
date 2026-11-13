import { createHash } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { candidates, clientDocuments, evaluations } from "../../../drizzle/schema";
import { storageKeyFromStoredUrl } from "../../../shared/storedFileUrl";
import type { ClientReport } from "../../../shared/evaluationValidation";
import { getDb } from "../../db";
import { sendEmail } from "../../_core/email";
import { invokeLLM } from "../../_core/llm";
import { storageGetSignedUrl, storagePut } from "../../storage";
import { cvAnalysisConsented, loadCvExcerpt, loadStoredCvBuffer } from "../cvTextLoader";
import { getValidationStore } from "../evaluationValidationStore";
import { ensureCase, requestInformation, startReevaluation, type ValidationDeps } from "../evaluationValidationCore";
import { clientReportToPlainText } from "../../../shared/evaluationValidation";
import { configFromEnv, type EvaluationInputs, type Mailer, type PipelineDeps, type Publisher } from "./pipeline";
import { DrizzleBilanAutoStore } from "./drizzleStore";
import { parseModelJson, type ExtractionRunner } from "./extraction";
import { renderPdf } from "./reportPdf";
import { checkRecordCoherence, projectKindOf } from "../../../shared/dataCoherence";
import { DrizzleSourcesStore, makeReferentialSearch } from "./sources";
import type { BilanReport, RunRecord } from "./types";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const WORK_VISA = new Set(["schengen_travail", "canada_travail"]);
const DOC_KIND: Record<string, EvaluationInputs["documents"][number]["kind"]> = {
  diploma: "diplome", educational_transcript: "diplome", certificate: "autre", employment_letter: "attestation_travail", employment_contract: "attestation_travail",
  language_test: "test_langue", passport: "passeport", cv: "cv",
};
const mimeFromName = (name: string): "application/pdf" | "image/png" | "image/jpeg" | "image/webp" | null => {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
};

/**
 * La lecture visuelle (CV scanné, pièces en image) envoie des images à un service de vision. Le site ne le faisait pas jusqu'ici
 * (« aucune donnée envoyée à un service de vision ») : elle reste donc DÉSACTIVÉE tant que le propriétaire ne l'a pas approuvée
 * (BILAN_AUTO_VISION_ENABLED=true). Désactivée, un scan est traité comme illisible : complément demandé, jamais un refus.
 */
const visionEnabled = () => process.env.BILAN_AUTO_VISION_ENABLED === "true";

async function pdfTextOf(buffer: Buffer, url: string): Promise<string | null> {
  const excerpt = await loadCvExcerpt(url, { fetchFile: async () => buffer });
  return excerpt?.text ?? null;
}

export function makeLoadInputs(db: Db, io: { fetchBuffer: (url: string) => Promise<Buffer | null> } = { fetchBuffer: (url) => loadStoredCvBuffer(url) }): PipelineDeps["loadInputs"] {
  return async (evaluationId, options = {}) => {
    const [ev] = await db.select().from(evaluations).where(eq(evaluations.id, evaluationId)).limit(1);
    if (!ev) return null;
    const [candidate] = ev.candidateId ? await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, ev.candidateId)).limit(1) : [];
    const details = (() => { try { return JSON.parse(ev.projectDetailsJson ?? "{}") as Record<string, unknown>; } catch { return {}; } })();
    const form = {
      fullName: ev.fullName, email: ev.email, phone: ev.phone, dateOfBirth: ev.dateOfBirth, educationLevel: ev.educationLevel, diplomaTitle: ev.diplomaTitle,
      fieldOfStudy: ev.fieldOfStudy, currentJobTitle: ev.currentJobTitle, yearsOfExperience: ev.yearsOfExperience, mainTasks: ev.mainTasks, frenchLevel: ev.frenchLevel,
      englishLevel: ev.englishLevel, languageTestsTaken: ev.languageTestsTaken, destinationCountry: ev.destinationCountry, travelReason: ev.travelReason,
      passportDeclared: Boolean(details.passportNumber || details.passportAvailable === true),
      completenessFields: { fullName: ev.fullName, email: ev.email, phone: ev.phone, dateOfBirth: ev.dateOfBirth, nationality: ev.nationality, educationLevel: ev.educationLevel, diplomaTitle: ev.diplomaTitle, fieldOfStudy: ev.fieldOfStudy, currentJobTitle: ev.currentJobTitle, yearsOfExperience: ev.yearsOfExperience, mainTasks: ev.mainTasks, frenchLevel: ev.frenchLevel, englishLevel: ev.englishLevel, destinationCountry: ev.destinationCountry },
    };

    const cvUrl = ev.cvFileUrl ?? null;
    const cv: EvaluationInputs["cv"] = { key: storageKeyFromStoredUrl(cvUrl) ?? cvUrl, fileName: ev.cvFileName ?? null, sha256: null, stored: Boolean(cvUrl), attachedToAccount: Boolean(candidate), text: null, file: null };
    const docRows = await db.select().from(clientDocuments).where(and(eq(clientDocuments.evaluationId, evaluationId), ne(clientDocuments.documentType, "cv")));
    const documents: EvaluationInputs["documents"] = docRows.map((row) => ({ id: String(row.id), kind: DOC_KIND[row.documentType] ?? "autre", key: storageKeyFromStoredUrl(row.documentUrl) ?? row.documentUrl ?? null, sha256: null, text: null, file: null }));

    // Sans l'accord du candidat à la lecture de son CV, aucun fichier n'est téléchargé ni lu.
    const consented = cvAnalysisConsented(ev);
    if (options.content && consented && cvUrl) {
      const buffer = await io.fetchBuffer(cvUrl);
      if (buffer) {
        cv.sha256 = createHash("sha256").update(buffer).digest("hex");
        cv.text = await pdfTextOf(buffer, cvUrl);
        const mime = mimeFromName(ev.cvFileName ?? cvUrl);
        if (!cv.text && mime && visionEnabled()) {
          const key = storageKeyFromStoredUrl(cvUrl);
          cv.file = { url: key ? await storageGetSignedUrl(key) : cvUrl, mimeType: mime };
        }
      }
    }
    if (options.content && consented) {
      for (let index = 0; index < docRows.length; index += 1) {
        const row = docRows[index];
        if (!row.documentUrl) continue;
        const buffer = await io.fetchBuffer(row.documentUrl);
        if (!buffer) continue;
        documents[index].sha256 = createHash("sha256").update(buffer).digest("hex");
        documents[index].text = await pdfTextOf(buffer, row.documentUrl);
        const mime = mimeFromName(row.documentName);
        if (!documents[index].text && mime && visionEnabled()) {
          const key = storageKeyFromStoredUrl(row.documentUrl);
          documents[index].file = { url: key ? await storageGetSignedUrl(key) : row.documentUrl, mimeType: mime };
        }
      }
    }

    return {
      evaluationId, candidateId: ev.candidateId ?? null, email: ev.email, fullName: ev.fullName, dossierRef: ev.referenceCode ?? null,
      priorityCountry: ev.destinationCountry ?? null, submitted: true,
      projectIsWork: projectKindOf(ev.projectType, ev.visaType) === "travail" || WORK_VISA.has(ev.visaType),
      projectConflict: checkRecordCoherence({ destinationCountry: ev.destinationCountry, visaType: ev.visaType, projectType: ev.projectType }).some((issue) => issue.code === "VISA_PROJET_INCOHERENT"),
      cvConsent: consented, form, cv, documents,
    };
  };
}

// ── Modèle d'IA (service déjà intégré : invokeLLM, passerelle Forge) ───────

export const runExtractionWithForge: ExtractionRunner = async ({ system, user, files }) => {
  const content: Array<Record<string, unknown>> = [{ type: "text", text: user }];
  for (const file of files) content.push(file.mimeType === "application/pdf" ? { type: "file_url", file_url: { url: file.url, mime_type: "application/pdf" } } : { type: "image_url", image_url: { url: file.url, detail: "high" } });
  const result = await invokeLLM({
    messages: [{ role: "system", content: system }, { role: "user", content: content as never }],
    responseFormat: { type: "json_object" } as never,
    maxTokens: 3000,
  });
  const message = result.choices[0]?.message?.content;
  const text = typeof message === "string" ? message : (message ?? []).map((part) => (part.type === "text" ? part.text : "")).join("");
  parseModelJson(text); // lève si la réponse ne contient pas d'objet JSON : l'appelant retentera
  return text;
};

// ── Publication dans le parcours existant (évaluation validée) ────────────

const ROLE_TO_KEY = { formation: "qualification", experience: "experience", competences: "employability", langues: "languages", projet: "coherence", administratif: "identity", justificatifs: "documents" } as const;

export function toClientReport(report: BilanReport, run: Pick<RunRecord, "id" | "scoreResult" | "orientations" | "validatedBy">, pdfAvailable: boolean, validatedAt: string): ClientReport {
  const rubrics = run.scoreResult?.rubrics ?? [];
  const score = report.score ?? 0;
  const status = report.thresholdReached ? (score >= 85 ? "tres_favorable" : "favorable") : score >= 50 ? "a_renforcer" : "preparation_recommandee";
  const find = (id: string) => report.sections.find((entry) => entry.id === id);
  return {
    profile: "travail",
    profileLabel: "Travail",
    reportTitle: "Bilan d'évaluation préliminaire — projet de travail",
    candidateName: report.candidateName,
    validatedAt,
    priorityCountry: run.orientations?.proposals.find((proposal) => proposal.role === "prioritaire")?.country ?? "Luxembourg",
    score,
    scoreMax: report.scoreMax,
    status,
    statusLabel: report.verdictLabel,
    route: null,
    profileSummary: (find("profil")?.paragraphs ?? []).join(" "),
    scoreBreakdown: rubrics.map((rubric) => ({ key: ROLE_TO_KEY[rubric.key as keyof typeof ROLE_TO_KEY], label: rubric.label, score: rubric.points ?? 0, max: rubric.max })),
    strengths: find("profil")?.bullets ?? [],
    improvements: find("reserves")?.bullets ?? [],
    riskLevel: null,
    actionPlan: (find("actions")?.bullets ?? []).map((title) => ({ title })),
    documents: [],
    alternatives: (run.orientations?.proposals ?? []).filter((proposal) => proposal.role !== "prioritaire").map((proposal) => ({ country: proposal.country, rationale: proposal.rationale })),
    remarks: "",
    validUntil: null,
    legalDisclaimer: report.disclaimer,
    automated: { runId: run.id, gridVersion: report.gridVersion, verdictLabel: report.verdictLabel, sections: report.sections, pdfAvailable, reviewedByAgency: Boolean(run.validatedBy) },
  };
}

export function makePublisher(validation: ValidationDeps, now: () => Date): Publisher & { markNotified: (run: RunRecord) => Promise<void> } {
  const ACTOR = { email: "bilan-auto@3mtravelagency.com" };
  return {
    async publish(run, report, pdf) {
      let current = await ensureCase(validation, run.evaluationId);
      if (current.workflowStatus === "validee_publiee" || current.workflowStatus === "validee_publiee_notifiee") {
        current = await startReevaluation(validation, ACTOR, run.evaluationId, { reason: "Nouveau bilan automatisé" });
      }
      const publishedAt = now();
      const clientReport = toClientReport(report, run, Boolean(pdf), publishedAt.toISOString().slice(0, 10));
      const updated = await validation.store.updateCaseIf(
        current.id, current.workflowStatus,
        { workflowStatus: "validee_publiee", publishedReport: clientReport, publishedAt, publishedBy: run.validatedBy ?? ACTOR.email, emailSentAt: null, emailError: null },
        {
          audit: { adminEmail: run.validatedBy ?? ACTOR.email, action: "bilan_auto_publish", note: `run ${run.id} · ${report.verdictLabel} · empreinte ${run.reportHash?.slice(0, 12)}` },
          legacyPublication: { publishedBy: run.validatedBy ?? ACTOR.email, publishedAt, reportText: clientReportToPlainText(clientReport), secondValidatedBy: null, firstValidatedBy: run.validatedBy ?? ACTOR.email, firstValidatedAt: publishedAt },
        },
      );
      if (!updated) throw new Error("Le parcours d'évaluation a changé : réessayez.");
      return { reference: String(updated.id) };
    },
    async requestComplement(run, items) {
      try {
        await requestInformation(validation, ACTOR, run.evaluationId, { message: "Pour poursuivre votre évaluation, merci de compléter les éléments suivants.", items: items.map((item) => item.label).slice(0, 12) });
      } catch (error) {
        console.warn("[bilanAuto] demande de complément non enregistrée dans le parcours :", error instanceof Error ? error.message : error);
      }
    },
    async markNotified(run) {
      const latest = await validation.store.getLatestCase(run.evaluationId);
      if (latest?.workflowStatus === "validee_publiee") {
        await validation.store.updateCaseIf(latest.id, "validee_publiee", { workflowStatus: "validee_publiee_notifiee", emailSentAt: now(), emailError: null });
      }
    },
  };
}

export const smtpMailer: Mailer = {
  async send(message) {
    await sendEmail({ to: message.to, subject: message.subject, html: message.html });
    return { messageId: null }; // le serveur d'envoi ne renvoie pas d'identifiant exploitable : l'état « délivré » n'est jamais déduit
  },
};

/** Assemble les dépendances de production. Renvoie null si la base de données ou le parcours d'évaluation sont indisponibles. */
export async function createProductionDeps(workerId = `worker-${process.pid}`): Promise<PipelineDeps | null> {
  const db = await getDb();
  const store = await DrizzleBilanAutoStore.create();
  const validationStore = await getValidationStore();
  if (!db || !store || !validationStore) return null;
  const portalUrl = `${(process.env.PUBLIC_SITE_URL ?? "https://www.3mtravelagency.com").replace(/\/$/, "")}/mon-espace`;
  const validation: ValidationDeps = { store: validationStore, mailer: { send: async () => undefined }, now: () => new Date(), portalUrl };
  const publisher = makePublisher(validation, () => new Date());
  return {
    store, config: configFromEnv(), workerId, now: () => new Date(),
    loadInputs: makeLoadInputs(db), runExtraction: runExtractionWithForge, search: makeReferentialSearch(new DrizzleSourcesStore(db)),
    renderPdf, storePdf: async (key, bytes) => storagePut(key, bytes, "application/pdf"),
    publisher, mailer: smtpMailer, portalUrl,
    onPublicationEmailAccepted: publisher.markNotified,
  };
}
