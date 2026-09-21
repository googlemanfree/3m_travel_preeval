import { describe, expect, it } from "vitest";
import {
  ADMIN_DRAFT_BADGE,
  AI_DRAFT_LABEL,
  AUDITED_VERSION_FIELDS,
  AdminEvaluationVersionSchema,
  AiEvaluationDraftSchema,
  CANDIDATE_PENDING_NOTICE,
  ClientTextViolationError,
  EMAIL_DISCLAIMER,
  LEGAL_DISCLAIMER,
  NOTIFICATION_EMAIL_SUBJECT,
  NOTIFICATION_PORTAL_PLACEHOLDER,
  PUBLICATION_CHECKLIST,
  SCORE_CRITERIA,
  SCORE_MAX_TOTAL,
  SensitiveDataError,
  SUGGESTED_STATUS_LABELS,
  WORKFLOW_ACTIONS,
  WORKFLOW_STATUSES,
  WORKFLOW_STATUS_LABELS,
  assertClientSafeText,
  assertNoSensitiveData,
  auditAiDraftWording,
  blankAdminVersion,
  buildClientReport,
  candidateVisibility,
  clientReportToPlainText,
  computeScoreTotal,
  defaultNotificationEmail,
  diffEvaluationVersions,
  findForbiddenTerms,
  findSensitiveData,
  isChecklistComplete,
  isPublishedStatus,
  missingChecklistItems,
  nextWorkflowStatus,
  normalizeCriterionScore,
  renderNotificationEmail,
  resolveScore,
  suggestedStatusForScore,
  versionFromAiDraft,
  type AdminEvaluationVersion,
  type AiEvaluationDraft,
  type WorkflowAction,
  type WorkflowStatus,
} from "../shared/evaluationValidation";

const goodScores = { identity: 9, qualification: 12, languages: 10, experience: 15, employability: 11, finances: 6, documents: 7, coherence: 4 }; // = 74

function aiDraft(overrides: Partial<AiEvaluationDraft> = {}): AiEvaluationDraft {
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
    scores: goodScores,
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

function version(overrides: Partial<AdminEvaluationVersion> = {}): AdminEvaluationVersion {
  return { ...versionFromAiDraft(aiDraft(), { evaluationDate: "2026-09-20" }), ...overrides };
}

describe("libellés imposés par le brief", () => {
  it("expose les libellés exacts du brouillon, du badge administrateur et de l'avis d'attente", () => {
    expect(AI_DRAFT_LABEL).toBe("BROUILLON IA — VALIDATION ADMINISTRATEUR REQUISE");
    expect(ADMIN_DRAFT_BADGE).toBe("BROUILLON IA — À VÉRIFIER ET VALIDER");
    expect(CANDIDATE_PENDING_NOTICE.title).toBe("Dossier reçu avec succès.");
    expect(CANDIDATE_PENDING_NOTICE.body).toContain("en cours d’analyse et de vérification par notre équipe");
    expect(CANDIDATE_PENDING_NOTICE.body).toContain("validée et publiée dans votre espace personnel");
  });

  it("porte l'avertissement légal complet, y compris ses exclusions", () => {
    for (const fragment of ["préanalyse interne 3M", "décision d’immigration", "garantie de visa", "offre d’emploi", "contrat de travail", "résidence permanente", "reconnaissance de diplôme", "garantie de logement", "employeurs, organismes professionnels et autorités compétentes"]) {
      expect(LEGAL_DISCLAIMER).toContain(fragment);
    }
  });
});

describe("grille de score sur 100", () => {
  it("compte huit critères aux poids du brief, pour un total de 100", () => {
    expect(SCORE_CRITERIA.map((criterion) => [criterion.key, criterion.max])).toEqual([
      ["identity", 10], ["qualification", 15], ["languages", 15], ["experience", 20], ["employability", 15], ["finances", 10], ["documents", 10], ["coherence", 5],
    ]);
    expect(SCORE_MAX_TOTAL).toBe(100);
  });

  it("borne et arrondit chaque note, et traite l'illisible comme zéro", () => {
    expect(normalizeCriterionScore("identity", 12)).toBe(10);
    expect(normalizeCriterionScore("identity", -3)).toBe(0);
    expect(normalizeCriterionScore("experience", 14.6)).toBe(15);
    for (const value of [NaN, undefined, null, "abc", Infinity]) expect(normalizeCriterionScore("languages", value), String(value)).toBe(value === Infinity ? 0 : 0);
    expect(normalizeCriterionScore("languages", "12")).toBe(12);
  });

  it("recalcule le total depuis les notes, les critères manquants comptant zéro", () => {
    expect(computeScoreTotal(goodScores)).toBe(74);
    expect(computeScoreTotal({})).toBe(0);
    expect(computeScoreTotal(null)).toBe(0);
    expect(computeScoreTotal({ identity: 99, qualification: 99, languages: 99, experience: 99, employability: 99, finances: 99, documents: 99, coherence: 99 })).toBe(100);
  });

  it.each([
    [0, "preparation_recommandee"], [44, "preparation_recommandee"],
    [45, "a_renforcer"], [59, "a_renforcer"],
    [60, "moderement_favorable"], [69, "moderement_favorable"],
    [70, "favorable"], [79, "favorable"],
    [80, "tres_favorable"], [100, "tres_favorable"],
    [101, "tres_favorable"], [-5, "preparation_recommandee"], [NaN, "preparation_recommandee"],
  ])("suggère le statut aux bonnes frontières : %s → %s", (total, expected) => {
    expect(suggestedStatusForScore(total as number)).toBe(expected);
  });

  it("libelle les cinq statuts comme le brief", () => {
    expect(Object.values(SUGGESTED_STATUS_LABELS)).toEqual(["Très favorable", "Favorable", "Modérément favorable", "À renforcer", "Préparation recommandée"]);
  });
});

describe("recalcul et valeurs fixées à la main", () => {
  it("suit les notes tant que l'administrateur n'a rien fixé", () => {
    const first = resolveScore({ scores: goodScores });
    expect(first).toMatchObject({ computedTotal: 74, effectiveTotal: 74, hasManualTotal: false, deviation: 0, suggestedStatus: "favorable", effectiveStatus: "favorable", hasManualStatus: false });
    const raised = resolveScore({ scores: { ...goodScores, finances: 10, documents: 10 } });
    expect(raised.effectiveTotal).toBe(81);
    expect(raised.effectiveStatus).toBe("tres_favorable");
  });

  it("ne remplace jamais un score global saisi à la main quand les notes changent", () => {
    const manual = resolveScore({ scores: goodScores, totalOverride: 65 });
    expect(manual).toMatchObject({ computedTotal: 74, effectiveTotal: 65, hasManualTotal: true, deviation: -9, suggestedStatus: "moderement_favorable" });
    const afterEdit = resolveScore({ scores: { ...goodScores, finances: 10, documents: 10 }, totalOverride: 65 });
    expect(afterEdit.effectiveTotal).toBe(65);
    expect(afterEdit.computedTotal).toBe(81);
    expect(afterEdit.deviation).toBe(-16);
  });

  it("laisse l'administrateur choisir le statut final, qui n'est jamais remplacé par le statut suggéré", () => {
    const result = resolveScore({ scores: goodScores, finalStatus: "a_renforcer" });
    expect(result.suggestedStatus).toBe("favorable");
    expect(result.effectiveStatus).toBe("a_renforcer");
    expect(result.hasManualStatus).toBe(true);
    const after = resolveScore({ scores: { ...goodScores, experience: 20, qualification: 15, languages: 15 }, finalStatus: "a_renforcer" });
    expect(after.suggestedStatus).toBe("tres_favorable");
    expect(after.effectiveStatus).toBe("a_renforcer");
  });

  it("borne un score manuel hors limites et ignore un statut inconnu", () => {
    expect(resolveScore({ scores: goodScores, totalOverride: 250 }).effectiveTotal).toBe(100);
    expect(resolveScore({ scores: goodScores, totalOverride: -1 }).effectiveTotal).toBe(0);
    expect(resolveScore({ scores: goodScores, finalStatus: "approuve" as never }).hasManualStatus).toBe(false);
  });
});

describe("workflow : statuts et transitions", () => {
  const allowed: Array<[WorkflowStatus, WorkflowAction, WorkflowStatus]> = [
    ["dossier_recu", "generate_ai_draft", "attente_validation_admin"],
    ["dossier_recu", "save_draft", "en_revue_admin"],
    ["dossier_recu", "request_info", "informations_complementaires"],
    ["dossier_recu", "publish", "validee_publiee"],
    ["dossier_recu", "publish_and_notify", "validee_publiee_notifiee"],
    ["attente_validation_admin", "save_draft", "en_revue_admin"],
    ["attente_validation_admin", "request_info", "informations_complementaires"],
    ["attente_validation_admin", "publish", "validee_publiee"],
    ["attente_validation_admin", "publish_and_notify", "validee_publiee_notifiee"],
    ["en_revue_admin", "save_draft", "en_revue_admin"],
    ["en_revue_admin", "request_info", "informations_complementaires"],
    ["en_revue_admin", "publish", "validee_publiee"],
    ["en_revue_admin", "publish_and_notify", "validee_publiee_notifiee"],
    ["informations_complementaires", "candidate_replied", "attente_validation_admin"],
    ["informations_complementaires", "save_draft", "en_revue_admin"],
    ["validee_publiee", "send_notification", "validee_publiee_notifiee"],
    ["validee_publiee", "start_reevaluation", "en_revue_admin"],
    ["validee_publiee_notifiee", "start_reevaluation", "en_revue_admin"],
  ];

  it("libelle les six statuts comme le brief", () => {
    expect(WORKFLOW_STATUS_LABELS).toEqual({
      dossier_recu: "DOSSIER REÇU",
      attente_validation_admin: "EN ATTENTE DE VALIDATION ADMINISTRATEUR",
      en_revue_admin: "EN REVUE ADMINISTRATEUR",
      informations_complementaires: "INFORMATIONS COMPLÉMENTAIRES REQUISES",
      validee_publiee: "ÉVALUATION VALIDÉE ET PUBLIÉE",
      validee_publiee_notifiee: "ÉVALUATION VALIDÉE, PUBLIÉE ET NOTIFIÉE",
    });
  });

  it("autorise exactement les transitions prévues, et aucune autre (matrice complète)", () => {
    const allowedKeys = new Set(allowed.map(([from, action]) => `${from}|${action}`));
    for (const from of WORKFLOW_STATUSES) {
      for (const action of WORKFLOW_ACTIONS) {
        const expected = allowed.find(([f, a]) => f === from && a === action)?.[2] ?? null;
        expect(nextWorkflowStatus(from, action), `${from} + ${action}`).toBe(expected);
        expect(allowedKeys.has(`${from}|${action}`), `${from} + ${action}`).toBe(expected !== null);
      }
    }
  });

  it("interdit de publier tant qu'une demande de complément est ouverte, et depuis un dossier déjà publié", () => {
    expect(nextWorkflowStatus("informations_complementaires", "publish")).toBeNull();
    expect(nextWorkflowStatus("informations_complementaires", "publish_and_notify")).toBeNull();
    expect(nextWorkflowStatus("validee_publiee", "publish")).toBeNull();
    expect(nextWorkflowStatus("validee_publiee_notifiee", "publish_and_notify")).toBeNull();
  });

  it("ne notifie jamais sans publication : l'état notifié n'est atteint que par publish_and_notify, ou par le renvoi de l'email depuis « publiée »", () => {
    const reachingNotified = allowed.filter(([, , to]) => to === "validee_publiee_notifiee");
    expect(new Set(reachingNotified.map(([, action]) => action))).toEqual(new Set(["publish_and_notify", "send_notification"]));
    expect(reachingNotified.filter(([, action]) => action === "send_notification").map(([from]) => from)).toEqual(["validee_publiee"]);
    // Un dossier non publié ne peut jamais être « notifié » par le seul envoi de l'email.
    for (const status of ["dossier_recu", "attente_validation_admin", "en_revue_admin", "informations_complementaires"] as const) {
      expect(nextWorkflowStatus(status, "send_notification"), status).toBeNull();
    }
    expect(isPublishedStatus("validee_publiee")).toBe(true);
    expect(isPublishedStatus("validee_publiee_notifiee")).toBe(true);
    expect(isPublishedStatus("en_revue_admin")).toBe(false);
  });
});

describe("ce que le candidat peut voir", () => {
  it("ne voit que l'avis d'attente tant que rien n'est publié, quel que soit l'état de la revue", () => {
    for (const status of ["dossier_recu", "attente_validation_admin", "en_revue_admin"] as const) {
      expect(candidateVisibility(status, false), status).toEqual({ showFinalReport: false, showPendingNotice: true, showInfoRequests: false });
    }
  });

  it("voit uniquement les éléments demandés pendant une demande de complément, sans rapport ni brouillon", () => {
    expect(candidateVisibility("informations_complementaires", false)).toEqual({ showFinalReport: false, showPendingNotice: true, showInfoRequests: true });
  });

  it("voit le rapport une fois publié, et garde le dernier rapport publié pendant une réévaluation", () => {
    expect(candidateVisibility("validee_publiee", true).showFinalReport).toBe(true);
    expect(candidateVisibility("validee_publiee_notifiee", true).showPendingNotice).toBe(false);
    expect(candidateVisibility("en_revue_admin", true)).toEqual({ showFinalReport: true, showPendingNotice: false, showInfoRequests: false });
  });
});

describe("formulations interdites", () => {
  it.each([
    ["Votre dossier est approuvé.", "approuvé"],
    ["Profil APPROUVÉ par l’équipe", "approuvé"],
    ["Votre visa est garanti", "garanti"],
    ["Nous garantissons votre départ", "garanti"],
    ["Une réussite garantie", "garanti"],
    ["Vous êtes éligible officiellement", "éligible officiellement"],
    ["Candidat officiellement éligible", "éligible officiellement"],
    ["Un visa assuré pour vous", "visa assuré"],
    ["Emploi assuré dès l’arrivée", "emploi assuré"],
    ["Résidence assurée", "résidence assurée"],
    ["Résidence permanente assurée", "résidence assurée"],
  ])("détecte « %s »", (text, term) => {
    expect(findForbiddenTerms(text)).toContain(term);
  });

  it("ne signale pas les mots voisins ni les négations légitimes", () => {
    for (const text of [
      "Profil à renforcer avant dépôt.",
      "Il désapprouve la demande d’un tiers.",
      "Aucune garantie de résultat n’est donnée.",
      "Sans garantie de visa, l’étude reste indicative.",
      "Ceci n’est pas une garantie d’emploi.",
      "Un assuré social n’a pas de visa à ce jour.",
      "Le service est officiel et nos conseillers sont éligibles au programme de formation interne.",
    ]) expect(findForbiddenTerms(text), text).toEqual([]);
  });

  it("exempte les deux avertissements légaux imposés, qui contiennent le mot « garantie »", () => {
    expect(findForbiddenTerms(LEGAL_DISCLAIMER)).toEqual([]);
    expect(findForbiddenTerms(EMAIL_DISCLAIMER)).toEqual([]);
    expect(findForbiddenTerms(`${LEGAL_DISCLAIMER} Votre visa est garanti.`)).toEqual(["garanti"]);
  });

  it("lève une erreur explicite qui nomme le champ et les termes", () => {
    expect(() => assertClientSafeText("Observations", "Emploi assuré et visa assuré")).toThrow(ClientTextViolationError);
    try {
      assertClientSafeText("Observations", "Emploi assuré et visa assuré");
    } catch (error) {
      expect((error as ClientTextViolationError).field).toBe("Observations");
      expect((error as ClientTextViolationError).terms.sort()).toEqual(["emploi assuré", "visa assuré"]);
    }
    expect(() => assertClientSafeText("Observations", "Dossier à renforcer.")).not.toThrow();
  });
});

describe("données sensibles interdites par e-mail", () => {
  it.each([
    ["Votre numéro de passeport est utilisé", "numéro de passeport"],
    ["Passeport n° A1234567 reçu", "numéro de passeport"],
    ["Réf AB1234567", "numéro de passeport"],
    ["Virement sur IBAN CM21 1000 2000 3000 4000 5000 600", "information bancaire"],
    ["Voir votre relevé bancaire", "information bancaire"],
    ["Carte 4111 1111 1111 1111", "numéro de carte"],
    ["Joindre l’acte de naissance", "acte de naissance"],
    ["Votre casier judiciaire est demandé", "casier judiciaire"],
  ])("détecte « %s »", (text, reason) => {
    expect(findSensitiveData(text)).toContain(reason);
  });

  it("laisse passer un texte courant, y compris les numéros de téléphone de l'agence", () => {
    for (const text of ["Bonjour Aïcha, votre rapport est prêt.", "WhatsApp : +237 698 104 832 | +237 620 996 045", "Bureau Canada : +1 672 897 2999", "Dossier 3M-AGN-270002 mis à jour"]) {
      expect(findSensitiveData(text), text).toEqual([]);
    }
    expect(() => assertNoSensitiveData("Corps", "Votre passeport n° A1234567")).toThrow(SensitiveDataError);
  });
});

describe("checklist obligatoire avant publication", () => {
  const all = Object.fromEntries(PUBLICATION_CHECKLIST.map((item) => [item.key, true]));

  it("comporte les huit éléments du brief, dont un seul dépend de l'e-mail", () => {
    expect(PUBLICATION_CHECKLIST).toHaveLength(8);
    expect(PUBLICATION_CHECKLIST.filter((item) => item.onlyWhenEmail).map((item) => item.key)).toEqual(["emailReviewed"]);
    expect(PUBLICATION_CHECKLIST[6].label).toBe("J’ai relu l’aperçu final visible par le candidat.");
  });

  it("exige sept éléments sans e-mail et les huit avec e-mail", () => {
    expect(missingChecklistItems({}, { sendEmail: false })).toHaveLength(7);
    expect(missingChecklistItems({}, { sendEmail: true })).toHaveLength(8);
    expect(missingChecklistItems(undefined, { sendEmail: false })).toHaveLength(7);
    expect(missingChecklistItems(null, { sendEmail: true })).toHaveLength(8);
  });

  it("n'autorise la publication que lorsque tout ce qui est exigé est coché", () => {
    expect(isChecklistComplete(all, { sendEmail: true })).toBe(true);
    const { emailReviewed: _ignored, ...withoutEmail } = all;
    expect(isChecklistComplete(withoutEmail, { sendEmail: false })).toBe(true);
    expect(isChecklistComplete(withoutEmail, { sendEmail: true })).toBe(false);
    expect(isChecklistComplete({ ...all, finalScore: false }, { sendEmail: false })).toBe(false);
    expect(missingChecklistItems({ ...all, route: false }, { sendEmail: true })).toEqual(["route"]);
  });

  it("ne se laisse pas tromper par une valeur non booléenne", () => {
    expect(isChecklistComplete({ ...all, coherence: "true" as never }, { sendEmail: false })).toBe(false);
  });
});

describe("version administrateur et historique des modifications", () => {
  it("part d'une copie du brouillon IA sans jamais le modifier", () => {
    const draft = aiDraft();
    const before = JSON.parse(JSON.stringify(draft));
    const admin = versionFromAiDraft(draft, { evaluationDate: "2026-09-20" });
    admin.strengths.push("Ajout humain");
    admin.scores.identity = 1;
    admin.alternatives[0].country = "Suisse";
    expect(draft).toEqual(before);
    expect(admin).toMatchObject({ totalOverride: null, finalStatus: null, sendEmail: false, internalComment: "", clientRemarks: "" });
    expect(AdminEvaluationVersionSchema.safeParse(admin).success).toBe(true);
  });

  it("refuse plus de trois alternatives et des notes hors grille", () => {
    const tooMany = { ...version(), alternatives: Array.from({ length: 4 }, (_, index) => ({ country: `Pays ${index}`, rationale: "x" })) };
    expect(AdminEvaluationVersionSchema.safeParse(tooMany).success).toBe(false);
    expect(AdminEvaluationVersionSchema.safeParse({ ...version(), scores: { ...goodScores, coherence: 6 } }).success).toBe(false);
    expect(AiEvaluationDraftSchema.safeParse(aiDraft({ alternativeCountries: Array.from({ length: 4 }, (_, index) => ({ country: `Pays ${index}`, rationale: "x" })) })).success).toBe(false);
  });

  it("détaille chaque changement avec l'ancienne et la nouvelle valeur, critère par critère", () => {
    const before = version();
    const after = version({ scores: { ...goodScores, identity: 10, finances: 8 }, riskLevel: "faible", strengths: [...before.strengths, "Ajout"] });
    const changes = diffEvaluationVersions(before, after);
    expect(changes).toEqual(expect.arrayContaining([
      { field: "scores.identity", oldValue: 9, newValue: 10 },
      { field: "scores.finances", oldValue: 6, newValue: 8 },
      { field: "riskLevel", oldValue: "modere", newValue: "faible" },
    ]));
    expect(changes.find((change) => change.field === "strengths")?.newValue).toEqual(["Six ans d’expérience vérifiable", "Ajout"]);
    expect(changes.some((change) => change.field === "scores")).toBe(false);
    expect(changes.some((change) => change.field === "priorityCountry")).toBe(false);
  });

  it("ne produit aucun changement pour une version identique, et suit tous les champs éditables", () => {
    expect(diffEvaluationVersions(version(), version())).toEqual([]);
    expect(AUDITED_VERSION_FIELDS).toEqual(expect.arrayContaining(["priorityCountry", "scores", "totalOverride", "finalStatus", "route", "strengths", "improvements", "blockers", "riskLevel", "actionPlan", "requiredDocuments", "alternatives", "clientRemarks", "evaluationDate", "validUntil", "emailSubject", "emailBody", "sendEmail", "internalComment"]));
  });

  it("enregistre la création initiale comme une suite de changements depuis « rien »", () => {
    const changes = diffEvaluationVersions(null, version());
    expect(changes.length).toBeGreaterThan(10);
    expect(changes.every((change) => change.oldValue === null || change.oldValue === undefined)).toBe(true);
  });
});

describe("rapport client", () => {
  it("est généré depuis la version administrateur et contient les treize éléments du brief", () => {
    const report = buildClientReport(version({ totalOverride: 68, finalStatus: "a_renforcer", clientRemarks: "Merci de compléter votre dossier." }), { candidateName: "Aïcha Nkolo", validatedAt: "2026-09-21" });
    expect(report).toMatchObject({ candidateName: "Aïcha Nkolo", validatedAt: "2026-09-21", priorityCountry: "Canada", score: 68, scoreMax: 100, status: "a_renforcer", statusLabel: "À renforcer" });
    expect(report.route).toEqual({ key: "D", label: "Reconnaissance professionnelle / équivalence" });
    expect(report.scoreBreakdown).toHaveLength(8);
    expect(report.scoreBreakdown.reduce((sum, item) => sum + item.score, 0)).toBe(74);
    expect(report.strengths.length).toBeGreaterThan(0);
    expect(report.actionPlan.length).toBeGreaterThan(0);
    expect(report.documents).toEqual([{ label: "Passeport", status: "recu", statusLabel: "Reçu" }, { label: "Test de langue", status: "a_fournir", statusLabel: "À fournir" }]);
    expect(report.alternatives.length).toBeLessThanOrEqual(3);
    expect(report.legalDisclaimer).toBe(LEGAL_DISCLAIMER);
    expect(report.remarks).toBe("Merci de compléter votre dossier.");
  });

  it("ne laisse jamais fuiter le commentaire interne, l'e-mail ni le brouillon", () => {
    const report = buildClientReport(version({ internalComment: "SECRET-INTERNE-42", emailBody: "SECRET-EMAIL-7", sendEmail: true }), { candidateName: "Aïcha", validatedAt: "2026-09-21" });
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("SECRET-INTERNE-42");
    expect(serialized).not.toContain("SECRET-EMAIL-7");
    for (const key of ["internalComment", "emailBody", "emailSubject", "sendEmail", "totalOverride", "finalStatus", "extracted", "gaps"]) {
      expect(Object.keys(report), key).not.toContain(key);
    }
  });

  it("intègre les obstacles bloquants aux points à renforcer visibles du candidat", () => {
    const report = buildClientReport(version({ blockers: ["Équivalence de diplôme requise"], improvements: ["Test de langue"] }), { candidateName: "A", validatedAt: "2026-09-21" });
    expect(report.improvements).toEqual(["Test de langue", "Équivalence de diplôme requise"]);
  });

  it("refuse de publier une formulation interdite, où qu'elle se trouve", () => {
    for (const patch of [
      { clientRemarks: "Votre visa est garanti." },
      { profileSummary: "Profil approuvé." },
      { strengths: ["Emploi assuré au Canada"] },
      { alternatives: [{ country: "Belgique", rationale: "Résidence assurée" }] },
      { actionPlan: [{ title: "Éligible officiellement", detail: "" }] },
    ]) {
      expect(() => buildClientReport(version(patch as Partial<AdminEvaluationVersion>), { candidateName: "A", validatedAt: "2026-09-21" }), JSON.stringify(patch)).toThrow(ClientTextViolationError);
    }
  });

  it("refuse une version qui dépasse trois alternatives plutôt que de la tronquer en silence", () => {
    const four = version({ alternatives: Array.from({ length: 4 }, (_, index) => ({ country: `Pays ${index}`, rationale: "x" })) as never });
    expect(() => buildClientReport(four, { candidateName: "A", validatedAt: "2026-09-21" })).toThrow();
  });
});

describe("version administrateur vierge (IA indisponible)", () => {
  const blank = blankAdminVersion({ priorityCountry: "Belgique", candidateName: "Aïcha Nkolo", evaluationDate: "2026-09-20" });

  it("respecte le schéma, garde le pays choisi par le candidat et n'invente aucune valeur", () => {
    expect(AdminEvaluationVersionSchema.safeParse(blank).success).toBe(true);
    expect(blank.priorityCountry).toBe("Belgique");
    expect(blank).toMatchObject({ route: null, riskLevel: null, finalStatus: null, totalOverride: null, sendEmail: false, internalComment: "", validUntil: null });
    for (const list of [blank.targetJobs, blank.targetSectors, blank.strengths, blank.improvements, blank.blockers, blank.actionPlan, blank.requiredDocuments, blank.alternatives]) {
      expect(list).toEqual([]);
    }
    expect(resolveScore({ scores: blank.scores }).effectiveTotal).toBe(0);
  });

  it("pré-remplit l'e-mail avec le modèle du brief, sans rien envoyer", () => {
    expect(blank.emailSubject).toBe(NOTIFICATION_EMAIL_SUBJECT);
    expect(blank.emailBody).toContain("Aïcha Nkolo");
    expect(blank.sendEmail).toBe(false);
  });

  it("ne peut pas être publiée sans que l'administrateur ait coché toute la checklist", () => {
    expect(isChecklistComplete({}, { sendEmail: false })).toBe(false);
    expect(missingChecklistItems({}, { sendEmail: true })).toHaveLength(PUBLICATION_CHECKLIST.length);
  });
});

describe("rendu texte du rapport client", () => {
  const report = buildClientReport(version({ totalOverride: 68, finalStatus: "a_renforcer", internalComment: "SECRET-INTERNE-42", emailBody: "SECRET-EMAIL-7" }), { candidateName: "Aïcha Nkolo", validatedAt: "2026-09-21" });
  const text = clientReportToPlainText(report);

  it("contient les rubriques du rapport, séparées par de vrais retours à la ligne", () => {
    expect(text).toContain("pays prioritaire : Canada");
    expect(text).toContain("Score validé : 68/100 — À renforcer");
    expect(text).toContain("Voie principale recommandée : Reconnaissance professionnelle / équivalence");
    expect(text).toContain("Atouts :\n- Six ans d’expérience vérifiable");
    expect(text).toContain("Documents :\n- Passeport : Reçu\n- Test de langue : À fournir");
    expect(text.split("\n").length).toBeGreaterThan(10);
  });

  it("se termine par l'avertissement légal obligatoire", () => {
    expect(text.endsWith(LEGAL_DISCLAIMER)).toBe(true);
  });

  it("ne reprend jamais le commentaire interne ni l'e-mail", () => {
    expect(text).not.toContain("SECRET-INTERNE-42");
    expect(text).not.toContain("SECRET-EMAIL-7");
  });

  it("ne contient aucune formulation interdite ni donnée sensible", () => {
    expect(findForbiddenTerms(text)).toEqual([]);
    expect(findSensitiveData(text)).toEqual([]);
  });
});

describe("e-mail de notification", () => {
  it("reprend l'objet et le texte du brief", () => {
    expect(NOTIFICATION_EMAIL_SUBJECT).toBe("Votre évaluation professionnelle est disponible — 3M Travel & Services");
    const email = defaultNotificationEmail({ candidateName: "Aïcha Nkolo", priorityCountry: "Canada" });
    expect(email.subject).toBe(NOTIFICATION_EMAIL_SUBJECT);
    expect(email.body).toContain("Bonjour Aïcha Nkolo,");
    expect(email.body).toContain("pour votre projet de mobilité vers Canada a été examinée et validée par notre équipe.");
    expect(email.body).toContain("Votre rapport personnel est désormais disponible dans votre espace sécurisé.");
    expect(email.body).toContain(NOTIFICATION_PORTAL_PLACEHOLDER);
    expect(email.body).toContain(EMAIL_DISCLAIMER);
  });

  it("insère le lien sécurisé, ajoute la signature et le bouton, et échappe le nom", () => {
    const email = defaultNotificationEmail({ candidateName: "<script>alert(1)</script>", priorityCountry: "Canada" });
    const rendered = renderNotificationEmail({ ...email, portalUrl: "https://www.3mtravelagency.com/mon-espace?section=dossier" });
    expect(rendered.text).toContain("Lien sécurisé : https://www.3mtravelagency.com/mon-espace?section=dossier");
    expect(rendered.text).toContain("Direction de la Mobilité Internationale");
    expect(rendered.text).toContain("+237 698 104 832 | +237 620 996 045");
    expect(rendered.text).toContain("Bureau Canada : +1 672 897 2999");
    expect(rendered.text).toContain("hello@3mtravelagency.com");
    expect(rendered.html).toContain(">Consulter mon évaluation</a>");
    expect(rendered.html).toContain("href=\"https://www.3mtravelagency.com/mon-espace?section=dossier\"");
    expect(rendered.html).not.toContain("[BOUTON");
    expect(rendered.text).not.toContain("[BOUTON");
    expect(rendered.text).toContain("Consulter mon évaluation : https://www.3mtravelagency.com/mon-espace?section=dossier");
    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(rendered.text).not.toContain(NOTIFICATION_PORTAL_PLACEHOLDER);
  });

  it("refuse un e-mail modifié qui contient une formulation interdite ou une donnée sensible", () => {
    const base = defaultNotificationEmail({ candidateName: "Aïcha", priorityCountry: "Canada" });
    expect(() => renderNotificationEmail({ subject: base.subject, body: `${base.body}\nVotre visa est garanti.`, portalUrl: "https://x.test" })).toThrow(ClientTextViolationError);
    expect(() => renderNotificationEmail({ subject: "Visa assuré", body: base.body, portalUrl: "https://x.test" })).toThrow(ClientTextViolationError);
    expect(() => renderNotificationEmail({ subject: base.subject, body: `${base.body}\nPasseport n° A1234567`, portalUrl: "https://x.test" })).toThrow(SensitiveDataError);
    expect(() => renderNotificationEmail({ subject: base.subject, body: `${base.body}\nIBAN CM21 1000 2000 3000 4000 5000 600`, portalUrl: "https://x.test" })).toThrow(SensitiveDataError);
  });

  it("accepte l'e-mail par défaut tel quel (l'avertissement contenant « garantie » est exempté)", () => {
    const base = defaultNotificationEmail({ candidateName: "Aïcha", priorityCountry: "Sénégal" });
    expect(() => renderNotificationEmail({ ...base, portalUrl: "https://www.3mtravelagency.com/mon-espace" })).not.toThrow();
  });
});

describe("brouillon IA", () => {
  it("valide la structure attendue et rejette une note hors grille", () => {
    expect(AiEvaluationDraftSchema.safeParse(aiDraft()).success).toBe(true);
    expect(AiEvaluationDraftSchema.safeParse(aiDraft({ scores: { ...goodScores, experience: 25 } })).success).toBe(false);
    expect(AiEvaluationDraftSchema.safeParse({ ...aiDraft(), route: "Z" }).success).toBe(false);
  });

  it("admet les informations non fournies (null) plutôt que des valeurs inventées", () => {
    const draft = aiDraft();
    draft.extracted = { ...draft.extracted, fullName: null, nationality: null, residenceCountry: null, passportAvailable: null, verifiableExperienceYears: null, budget: null };
    expect(AiEvaluationDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("signale à l'administrateur les formulations interdites du brouillon, sans les supprimer", () => {
    const draft = aiDraft({ profileSummary: "Le visa est garanti pour ce profil.", strengths: ["Six ans d’expérience", "Emploi assuré"] });
    const findings = auditAiDraftWording(draft);
    expect(findings).toEqual([
      { field: "Résumé du profil", terms: ["garanti"] },
      { field: "Atout 2", terms: ["emploi assuré"] },
    ]);
    expect(draft.profileSummary).toContain("garanti");
    expect(auditAiDraftWording(aiDraft())).toEqual([]);
  });
});
