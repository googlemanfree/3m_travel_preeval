import type { AiEvaluationDraft, WorkflowStatus } from "../../shared/evaluationValidation";
import type {
  EvaluationContext,
  FieldChangeRecord,
  LegacyPublication,
  Mailer,
  NewValidationCase,
  TransitionEffects,
  UpdateGuard,
  ValidationCase,
  ValidationCasePatch,
  ValidationStore,
} from "./evaluationValidationCore";
import { versionStamp } from "./evaluationValidationCore";

/**
 * Outils de test de l'orchestration : un store en mémoire qui respecte le contrat du store réel
 * (compare-and-set sur le statut, unicité de version, effets écrits avec la transition), un mailer
 * factice et une chronologie commune pour prouver l'ordre « publication puis e-mail ».
 */

export const GOOD_SCORES = { identity: 9, qualification: 12, languages: 10, experience: 15, employability: 11, finances: 6, documents: 7, coherence: 4 }; // = 74

export function sampleAiDraft(overrides: Partial<AiEvaluationDraft> = {}): AiEvaluationDraft {
  return {
    priorityCountry: "Canada",
    projectType: "travail",
    extracted: {
      fullName: "Aïcha Nkolo",
      ageOrBirthDate: "1993-04-12",
      nationality: "Camerounaise",
      residenceCountry: "Cameroun",
      passportAvailable: true,
      profession: "Infirmière",
      professionalLevel: "Confirmé",
      diplomas: ["Licence en soins infirmiers"],
      verifiableExperienceYears: 6,
      skills: ["Soins intensifs"],
      languages: ["Français C1"],
      budget: null,
      documentsAvailable: ["CV", "Diplôme"],
      documentsMissing: ["Test de langue"],
    },
    gaps: { blocking: [{ label: "Équivalence de diplôme requise" }], reinforceable: [{ label: "Test de langue officiel" }], nonBlocking: [{ label: "Mise en forme du CV" }] },
    route: "D",
    alternativeCountries: [{ country: "Belgique", rationale: "Reconnaissance plus rapide" }],
    scores: GOOD_SCORES,
    strengths: ["Six ans d’expérience vérifiable"],
    improvements: ["Passer un test de langue officiel"],
    targetJobs: ["Infirmière autorisée"],
    targetSectors: ["Santé"],
    riskLevel: "modere",
    profileSummary: "Profil d’infirmière confirmée visant le Canada.",
    actionPlan: [{ title: "Demander l’équivalence du diplôme", horizon: "3 mois" }],
    requiredDocuments: [{ label: "Passeport", status: "recu" }, { label: "Test de langue", status: "a_fournir" }],
    ...overrides,
  };
}

export type AuditRecord = { evaluationId: number; adminEmail: string; action: string; note?: string; at: Date };

export class InMemoryValidationStore implements ValidationStore {
  cases: ValidationCase[] = [];
  changes: FieldChangeRecord[] = [];
  audit: AuditRecord[] = [];
  legacyPublications: Array<LegacyPublication & { evaluationId: number }> = [];
  /** Chronologie partagée avec le mailer factice. */
  timeline: string[] = [];
  private nextId = 1;
  private beforeNextUpdate: (() => Promise<void>) | null = null;

  constructor(
    private readonly contexts: EvaluationContext[],
    private readonly clock: () => Date = () => new Date("2026-09-21T09:00:00.000Z"),
  ) {}

  /** Simule un administrateur concurrent qui écrit entre la lecture et l'écriture de l'appelant. */
  interceptNextUpdate(action: () => Promise<void>) {
    this.beforeNextUpdate = action;
  }

  async loadEvaluationContext(evaluationId: number) {
    return this.contexts.find((context) => context.evaluationId === evaluationId) ?? null;
  }

  private snapshot(row: ValidationCase): ValidationCase {
    return structuredClone(row);
  }

  async getLatestCase(evaluationId: number) {
    const rows = this.cases.filter((row) => row.evaluationId === evaluationId).sort((a, b) => b.versionNumber - a.versionNumber);
    return rows[0] ? this.snapshot(rows[0]) : null;
  }

  async getLatestPublishedCase(evaluationId: number) {
    const rows = this.cases.filter((row) => row.evaluationId === evaluationId && row.publishedReport !== null).sort((a, b) => b.versionNumber - a.versionNumber);
    return rows[0] ? this.snapshot(rows[0]) : null;
  }

  async listCases(evaluationId: number) {
    return this.cases.filter((row) => row.evaluationId === evaluationId).sort((a, b) => a.versionNumber - b.versionNumber).map((row) => this.snapshot(row));
  }

  private record(row: ValidationCase, effects?: TransitionEffects) {
    const at = this.clock();
    if (effects?.changes) {
      for (const change of effects.changes.rows) {
        this.changes.push({ evaluationId: row.evaluationId, versionNumber: row.versionNumber, adminEmail: effects.changes.adminEmail, createdAt: at, ...change });
      }
    }
    if (effects?.audit) this.audit.push({ evaluationId: row.evaluationId, at, ...effects.audit });
    if (effects?.legacyPublication) this.legacyPublications.push({ evaluationId: row.evaluationId, ...effects.legacyPublication });
  }

  async insertCase(input: NewValidationCase, effects?: TransitionEffects) {
    if (this.cases.some((row) => row.evaluationId === input.evaluationId && row.versionNumber === input.versionNumber)) return null;
    const at = this.clock();
    const row: ValidationCase = {
      id: this.nextId++,
      aiDraft: null,
      aiDraftGeneratedAt: null,
      aiDraftModel: null,
      aiDraftWarnings: [],
      aiDraftError: null,
      adminVersion: null,
      adminVersionUpdatedAt: null,
      adminVersionUpdatedBy: null,
      firstValidatedBy: null,
      firstValidatedAt: null,
      infoRequest: null,
      infoRequestedAt: null,
      infoRequestedBy: null,
      publishedReport: null,
      publishedAt: null,
      publishedBy: null,
      publishedChecklist: null,
      emailSubject: null,
      emailSentAt: null,
      emailError: null,
      emailClaimedAt: null,
      createdAt: at,
      updatedAt: at,
      ...structuredClone(input),
    };
    this.cases.push(row);
    this.timeline.push(`store:insert:${row.workflowStatus}`);
    this.record(row, effects);
    return this.snapshot(row);
  }

  async updateCaseIf(id: number, expectedStatus: WorkflowStatus, patch: ValidationCasePatch, effects?: TransitionEffects, guard?: UpdateGuard) {
    if (this.beforeNextUpdate) {
      const action = this.beforeNextUpdate;
      this.beforeNextUpdate = null;
      await action();
    }
    const row = this.cases.find((entry) => entry.id === id);
    if (!row || row.workflowStatus !== expectedStatus) return null;
    // mêmes préconditions de contenu que le store réel (voir UpdateGuard)
    if (guard?.adminVersionStamp !== undefined && (!row.adminVersion || versionStamp(row.adminVersion) !== guard.adminVersionStamp)) return null;
    if (guard?.requireNoAiDraft && row.aiDraft !== null) return null;
    if (guard?.emailClaimableSince && row.emailClaimedAt && row.emailClaimedAt.getTime() >= guard.emailClaimableSince.getTime()) return null;
    Object.assign(row, structuredClone(patch), { updatedAt: this.clock() });
    this.timeline.push(`store:update:${row.workflowStatus}`);
    this.record(row, effects);
    return this.snapshot(row);
  }

  async listChanges(evaluationId: number) {
    return this.changes.filter((change) => change.evaluationId === evaluationId);
  }

  async latestStatuses(evaluationIds: number[]) {
    const result = new Map<number, { status: WorkflowStatus; versionNumber: number; updatedAt: Date }>();
    for (const evaluationId of evaluationIds) {
      const latest = await this.getLatestCase(evaluationId);
      if (latest) result.set(evaluationId, { status: latest.workflowStatus, versionNumber: latest.versionNumber, updatedAt: latest.updatedAt });
    }
    return result;
  }
}

export type SentMail = { to: string; subject: string; text: string; html: string };

export class FakeMailer implements Mailer {
  sent: SentMail[] = [];
  private failure: Error | null = null;
  private gate: Promise<void> | null = null;

  constructor(private readonly timeline: string[] = []) {}

  failWith(error: Error | null) {
    this.failure = error;
  }

  /** Suspend les envois jusqu'à l'appel de la fonction renvoyée (simule un SMTP lent pour tester les courses). */
  hold(): () => void {
    let release!: () => void;
    this.gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    return () => {
      this.gate = null;
      release();
    };
  }

  async send(message: SentMail) {
    this.timeline.push("mail:send");
    if (this.gate) await this.gate;
    if (this.failure) throw this.failure;
    this.sent.push(message);
  }
}

/** Erreur telle que Drizzle la remonte quand la migration 0072 n'est pas appliquée (la requête citée nomme la table). */
export function missingTablesError(): Error {
  return Object.assign(new Error("Failed query: select `id` from `evaluation_validation_cases` where `evaluationId` = ?"), {
    cause: Object.assign(new Error("Table 'railway.evaluation_validation_cases' doesn't exist"), { code: "ER_NO_SUCH_TABLE", errno: 1146 }),
  });
}

export const CANDIDATE_CONTEXT: EvaluationContext = { evaluationId: 1, candidateName: "Aïcha Nkolo", candidateEmail: "aicha@example.com", candidateCountry: "Canada" };
