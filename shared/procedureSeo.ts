export type ProcedureVisaType = "travail" | "etudes" | "visiteur";
export type ProcedureLocale = "fr" | "en";

export type ProcedureSeoInput = {
  name: string;
  visaType: ProcedureVisaType;
};

const VISA_TYPE_LABELS: Record<ProcedureVisaType, string> = {
  travail: "Travail",
  etudes: "Études",
  visiteur: "Visiteur",
};

const VISA_TYPE_LABELS_EN: Record<ProcedureVisaType, string> = {
  travail: "Work",
  etudes: "Study",
  visiteur: "Visitor",
};

const VISA_TYPE_PROJECT_NOUN: Record<ProcedureVisaType, string> = {
  travail: "de travail",
  etudes: "d'études",
  visiteur: "de séjour ou de tourisme",
};

const VISA_TYPE_PROJECT_NOUN_EN: Record<ProcedureVisaType, string> = {
  travail: "work",
  etudes: "study",
  visiteur: "visitor or tourism",
};

export const getVisaTypeLabel = (visaType: ProcedureVisaType, locale: ProcedureLocale = "fr") =>
  locale === "en" ? VISA_TYPE_LABELS_EN[visaType] : VISA_TYPE_LABELS[visaType];

export const getProcedureDisplayTitle = (procedure: ProcedureSeoInput, locale: ProcedureLocale = "fr") =>
  locale === "en"
    ? `${procedure.name} — ${getVisaTypeLabel(procedure.visaType, "en")} Visa`
    : `Visa ${procedure.name} — ${getVisaTypeLabel(procedure.visaType)}`;

export const getProcedureSeoTitle = (procedure: ProcedureSeoInput, siteName: string, locale: ProcedureLocale = "fr") =>
  locale === "en"
    ? `${getProcedureDisplayTitle(procedure, "en")} from Yaoundé | ${siteName}`
    : `${getProcedureDisplayTitle(procedure)} à Yaoundé | ${siteName}`;

const SEO_PROJECT_LABEL: Record<ProcedureLocale, Record<ProcedureVisaType, string>> = {
  fr: { etudes: "études", visiteur: "visite / court séjour", travail: "travail" },
  en: { etudes: "studies", visiteur: "visitor / short stay", travail: "work" },
};

/**
 * Description de page d'une fiche de procédure. Source UNIQUE pour le prérendu serveur et la page affichée :
 * Google peut retenir la première version qu'il voit, elle ne doit donc plus changer après le chargement.
 * Les frais ne sont cités que s'ils sont vérifiés (`fee`), jamais inventés.
 */
export const getProcedureSeoDescription = (
  procedure: ProcedureSeoInput,
  locale: ProcedureLocale = "fr",
  fee?: { costLabel: string; delayLabel: string },
) => {
  const title = getProcedureDisplayTitle(procedure, locale);
  const project = SEO_PROJECT_LABEL[locale][procedure.visaType];
  if (locale === "en") {
    return fee
      ? `${title}: official fees about ${fee.costLabel}, timelines ${fee.delayLabel}. Steps, documents and FAQ with 3M TRAVEL AGENCY support from Yaoundé.`
      : `Steps, required documents, official portal and FAQ for your ${project} project to ${procedure.name} — prepared with 3M TRAVEL AGENCY from Yaoundé.`;
  }
  return fee
    ? `${title} : frais ${fee.costLabel}, délais ${fee.delayLabel}. Étapes, documents, portail officiel et FAQ — accompagnement 3M TRAVEL AGENCY depuis Yaoundé.`
    : `Étapes, documents exigés, portail officiel et FAQ pour votre projet ${project} vers ${procedure.name} — accompagnement 3M TRAVEL AGENCY depuis Yaoundé.`;
};

export type ProcedureFaqItem = { question: string; answer: string };

/**
 * FAQ générique mais spécialisée par pays + type de visa, sans inventer de règle
 * procédurale spécifique : les réponses restent prudentes (pas de promesse de délai,
 * de décision ou d'éligibilité) et renvoient vers la vérification institutionnelle.
 */
export const getProcedureFaqItems = (procedure: ProcedureSeoInput, locale: ProcedureLocale = "fr"): ProcedureFaqItem[] => {
  if (locale === "en") {
    const labelEn = getVisaTypeLabel(procedure.visaType, "en").toLowerCase();
    const projectNounEn = VISA_TYPE_PROJECT_NOUN_EN[procedure.visaType];
    return [
      {
        question: `How does 3M TRAVEL AGENCY support a ${projectNounEn} project to ${procedure.name} from Yaoundé?`,
        answer: `An advisor reviews your project details, outlines the documents generally requested for a ${labelEn} visa to ${procedure.name}, and supports you through preparing your file. Final requirements and the decision remain with the competent authority.`,
      },
      {
        question: `What documents should I prepare for this ${labelEn} process?`,
        answer: `The document list shown on this page is a starting point for preparation. It should be verified with the relevant institutional source before any submission, as it can vary depending on your personal situation.`,
      },
      {
        question: `Is the processing time or decision for a ${labelEn} visa to ${procedure.name} guaranteed?`,
        answer: `No. Processing time and the final decision belong exclusively to the competent authority, institution, or employer involved. 3M TRAVEL AGENCY supports preparation and follow-up without guaranteeing the outcome.`,
      },
      {
        question: `How do I start my evaluation for ${procedure.name}?`,
        answer: `Create a free candidate account, then use the site's free evaluation form, specifying your destination and project type. The account also covers follow-up and document upload. For an initial orientation without an account, contact 3M TRAVEL AGENCY in Yaoundé.`,
      },
    ];
  }

  const label = getVisaTypeLabel(procedure.visaType).toLowerCase();
  const projectNoun = VISA_TYPE_PROJECT_NOUN[procedure.visaType];
  return [
    {
      question: `Comment 3M TRAVEL AGENCY accompagne-t-il un projet ${projectNoun} vers ${procedure.name} depuis Yaoundé ?`,
      answer: `Un conseiller examine les informations de votre projet, indique les pièces généralement demandées pour un visa ${label} vers ${procedure.name} et vous accompagne dans la préparation du dossier. Les exigences définitives et la décision relèvent de l'autorité compétente.`,
    },
    {
      question: `Quels documents dois-je préparer pour cette procédure ${label} ?`,
      answer: `La liste de documents affichée sur cette page constitue une base de préparation. Elle doit être vérifiée avec la source institutionnelle compétente avant tout dépôt, car elle peut varier selon votre situation personnelle.`,
    },
    {
      question: `Le délai et la décision pour un visa ${label} vers ${procedure.name} sont-ils garantis ?`,
      answer: `Non. Le délai de traitement et la décision finale appartiennent exclusivement à l'autorité compétente, à l'établissement ou à l'employeur concerné. 3M TRAVEL AGENCY accompagne la préparation et le suivi du dossier sans garantir l'issue.`,
    },
    {
      question: `Comment démarrer mon évaluation pour ${procedure.name} ?`,
      answer: `Créez un compte candidat gratuit, puis utilisez le formulaire d'évaluation gratuit du site en précisant votre destination et votre type de projet. Le compte sert aussi au suivi et au dépôt de pièces. Pour une première orientation sans compte, contactez 3M TRAVEL AGENCY à Yaoundé.`,
    },
  ];
};
