/**
 * Structures de bilan et modèles de message par type de projet (visa).
 * Utilisés dans l’espace de préparation admin avant envoi espace client + e-mail.
 */

import {
  resolveEvaluationProjectKind,
  type EvaluationProjectKind,
} from "./evaluationVisaCv";

export type BilanMessageTemplate = {
  label: string;
  subject: string;
  message: string;
};

export type BilanStructure = {
  label: string;
  score: string;
  verdict: string;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  message: string;
};

export const EVALUATION_KIND_LABELS: Record<EvaluationProjectKind, string> = {
  travail: "Visa travail",
  etudes: "Visa études",
  tourisme: "Visa visiteurs / tourisme",
  autre: "Projet de mobilité",
};

const MESSAGE_TEMPLATES_BY_KIND: Record<
  EvaluationProjectKind,
  Record<string, BilanMessageTemplate>
> = {
  travail: {
    en_standard: {
      label: "English — Work assessment",
      subject: "Your work mobility assessment - 3M TRAVEL AGENCY",
      message:
        "Hello,\n\nOur team has completed the preliminary review of your work mobility profile. This assessment outlines your professional strengths, documents to prepare (including an up-to-date CV) and recommended next steps.",
    },
    en_promising: {
      label: "English — Promising work profile",
      subject: "Your work profile shows promising prospects - 3M TRAVEL AGENCY",
      message:
        "Hello,\n\nYour professional profile shows promising strengths. Please review the attached assessment and prepare the recommended employment documents and CV updates.",
    },
    standard: {
      label: "Travail — bilan standard",
      subject: "Votre bilan visa travail - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a finalisé l’analyse préliminaire de votre projet de visa travail. Vous trouverez dans ce bilan vos points forts professionnels, les pièces à préparer (CV à jour inclus) et les prochaines étapes recommandées.",
    },
    promising: {
      label: "Travail — profil prometteur",
      subject: "Votre profil professionnel présente de belles perspectives - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nVotre profil professionnel présente des atouts intéressants. Nous vous invitons à consulter le bilan joint et à préparer le CV et les justificatifs d’emploi recommandés.",
    },
    improvement: {
      label: "Travail — plan d’amélioration",
      subject: "Votre plan d’amélioration visa travail - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre analyse identifie des axes précis à renforcer pour votre dossier travail (expérience, langue, CV ou pièces). Votre bilan détaille les actions prioritaires.",
    },
    canada: {
      label: "Canada — visa travail",
      subject: "Votre bilan procédure Canada (travail) - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a finalisé la revue de votre projet Canada en visa travail. Votre bilan présente le CV et les pièces retenues, les justificatifs à préparer et les prochaines étapes.",
    },
    luxembourg: {
      label: "Luxembourg — visa travail",
      subject: "Votre bilan procédure Luxembourg (travail) - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nVotre bilan Luxembourg (travail) est prêt. Consultez les priorités et préparez CV, attestations d’emploi et pièces listées pour la prochaine étape.",
    },
    europe: {
      label: "Europe — visa travail",
      subject: "Votre bilan mobilité Europe (travail) - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a préparé votre bilan de mobilité Europe en visa travail. Vous y trouverez l’orientation retenue, les points à renforcer et le plan d’action avant la suite.",
    },
  },
  etudes: {
    en_standard: {
      label: "English — Studies assessment",
      subject: "Your study project assessment - 3M TRAVEL AGENCY",
      message:
        "Hello,\n\nOur team has completed the preliminary review of your study project. This assessment covers your academic background, target cycle, documents to prepare (diplomas and transcripts) and next steps.",
    },
    en_promising: {
      label: "English — Promising study profile",
      subject: "Your study profile shows promising prospects - 3M TRAVEL AGENCY",
      message:
        "Hello,\n\nYour academic profile shows promising strengths. Please review the assessment and prepare diplomas, transcripts and funding evidence for the next stage.",
    },
    standard: {
      label: "Études — bilan standard",
      subject: "Votre bilan visa études - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a finalisé l’analyse préliminaire de votre projet d’études. Ce bilan couvre votre parcours académique, le cycle visé, les diplômes et relevés à préparer, ainsi que les prochaines étapes.",
    },
    promising: {
      label: "Études — profil prometteur",
      subject: "Votre projet d’études présente de belles perspectives - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nVotre dossier études présente des atouts intéressants. Consultez le bilan joint et préparez diplômes, relevés, lettre de motivation et preuves de financement recommandés.",
    },
    improvement: {
      label: "Études — plan d’amélioration",
      subject: "Votre plan d’amélioration visa études - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre analyse identifie des axes précis à renforcer pour votre dossier études (historique scolaire, cycle, langue ou financement). Votre bilan détaille les actions prioritaires.",
    },
    canada: {
      label: "Canada — visa études",
      subject: "Votre bilan procédure Canada (études) - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a finalisé la revue de votre projet Canada en visa études. Votre bilan présente le parcours académique retenu, les pièces scolaires à préparer et les prochaines étapes.",
    },
    luxembourg: {
      label: "Luxembourg — visa études",
      subject: "Votre bilan procédure Luxembourg (études) - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nVotre bilan Luxembourg (études) est prêt. Consultez les priorités et préparez diplômes, relevés et justificatifs listés pour la prochaine étape.",
    },
    europe: {
      label: "Europe — visa études",
      subject: "Votre bilan mobilité Europe (études) - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a préparé votre bilan de mobilité Europe en visa études. Vous y trouverez l’orientation académique, les points à renforcer et le plan d’action avant la suite.",
    },
  },
  tourisme: {
    en_standard: {
      label: "English — Visitor assessment",
      subject: "Your visitor / tourism assessment - 3M TRAVEL AGENCY",
      message:
        "Hello,\n\nOur team has completed the preliminary review of your visitor project. This assessment covers your declared status, travel purpose, supporting documents and recommended next steps.",
    },
    en_promising: {
      label: "English — Promising visitor profile",
      subject: "Your visitor profile shows promising prospects - 3M TRAVEL AGENCY",
      message:
        "Hello,\n\nYour visitor file shows promising coherence. Please review the assessment and prepare itinerary, funds and home-country ties evidence as recommended.",
    },
    standard: {
      label: "Visiteurs — bilan standard",
      subject: "Votre bilan visa visiteurs - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a finalisé l’analyse préliminaire de votre projet de visite. Ce bilan couvre votre statut déclaré, le motif du séjour, les justificatifs à préparer et les prochaines étapes.",
    },
    promising: {
      label: "Visiteurs — profil cohérent",
      subject: "Votre projet de visite présente une bonne cohérence - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nVotre dossier visiteurs présente une bonne cohérence. Consultez le bilan joint et préparez itinéraire, ressources et preuves d’attaches recommandées.",
    },
    improvement: {
      label: "Visiteurs — plan d’amélioration",
      subject: "Votre plan d’amélioration visa visiteurs - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre analyse identifie des axes précis à renforcer pour votre dossier visiteurs (statut, motif, ressources ou attaches). Votre bilan détaille les actions prioritaires.",
    },
    canada: {
      label: "Canada — visa visiteurs",
      subject: "Votre bilan procédure Canada (visiteurs) - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a finalisé la revue de votre projet Canada en visa visiteurs. Votre bilan présente le statut et le motif retenus, les justificatifs à préparer et les prochaines étapes.",
    },
    luxembourg: {
      label: "Luxembourg / Schengen — visiteurs",
      subject: "Votre bilan procédure Schengen (visiteurs) - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nVotre bilan visiteurs / tourisme est prêt. Consultez les priorités et préparez itinéraire, hébergement et preuves d’attaches listées pour la prochaine étape.",
    },
    europe: {
      label: "Europe — visa visiteurs",
      subject: "Votre bilan mobilité Europe (visiteurs) - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a préparé votre bilan de mobilité Europe en visa visiteurs. Vous y trouverez l’orientation retenue, les points à renforcer et le plan d’action avant la suite.",
    },
  },
  autre: {
    en_standard: {
      label: "English — Standard assessment",
      subject: "Your 3M TRAVEL AGENCY profile assessment",
      message:
        "Hello,\n\nOur team has completed the preliminary review of your profile. This assessment outlines your strengths, areas to improve and recommended next steps for your international mobility project.",
    },
    en_promising: {
      label: "English — Promising profile",
      subject: "Your profile shows promising prospects - 3M TRAVEL AGENCY",
      message:
        "Hello,\n\nYour profile shows promising strengths for your project. Please review the attached assessment and prepare the recommended information to strengthen your application.",
    },
    standard: {
      label: "Bilan standard",
      subject: "Votre Bilan d'Évaluation - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a finalisé l'analyse préliminaire de votre profil. Vous trouverez dans ce bilan vos points forts, les axes à renforcer et les prochaines étapes recommandées pour votre projet de mobilité internationale.",
    },
    promising: {
      label: "Profil prometteur",
      subject: "Votre profil présente de belles perspectives - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nVotre profil présente des atouts intéressants pour votre projet. Nous vous invitons à consulter le bilan joint et à préparer les éléments recommandés afin de renforcer votre candidature.",
    },
    improvement: {
      label: "Profil à renforcer",
      subject: "Votre plan d'amélioration personnalisé - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre analyse identifie des axes précis à renforcer avant la suite de votre procédure. Votre bilan détaille les actions prioritaires qui permettront d'améliorer la présentation et la cohérence de votre dossier.",
    },
    canada: {
      label: "Canada — bilan et prochaines étapes",
      subject: "Votre bilan de procédure Canada - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a finalisé la revue de votre projet Canada. Votre bilan présente les éléments retenus, les justificatifs à préparer et les prochaines étapes recommandées pour faire avancer votre dossier.",
    },
    luxembourg: {
      label: "Luxembourg — bilan et pièces à préparer",
      subject: "Votre bilan de procédure Luxembourg - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nVotre bilan pour le Luxembourg est prêt. Nous vous invitons à consulter les priorités indiquées et à préparer les pièces justificatives listées pour la prochaine étape de votre dossier.",
    },
    europe: {
      label: "Europe — orientation et plan d’action",
      subject: "Votre bilan de mobilité Europe - 3M TRAVEL AGENCY",
      message:
        "Bonjour,\n\nNotre équipe a préparé votre bilan de mobilité Europe. Vous y trouverez l’orientation retenue, les points à renforcer et le plan d’action recommandé avant la suite de la procédure.",
    },
  },
};

const BILAN_STRUCTURES_BY_KIND: Record<
  EvaluationProjectKind,
  Record<string, BilanStructure>
> = {
  travail: {
    standard: {
      label: "Travail — structure standard",
      score: "60",
      verdict: "Profil professionnel à examiner avec attention",
      strengths: "Expérience et motivation professionnelle à confirmer",
      weaknesses: "CV, pièces d’emploi et cohérence du métier visé à renforcer",
      recommendations:
        "Déposer un CV à jour et chronologique\nCompléter attestations d’emploi et références\nÉchanger avec un conseiller sur le métier et la destination",
      message: MESSAGE_TEMPLATES_BY_KIND.travail.standard!.message,
    },
    favorable: {
      label: "Travail — profil favorable",
      score: "78",
      verdict: "Profil professionnel favorable sous réserve",
      strengths: "Parcours professionnel cohérent\nMotivation clairement exprimée",
      weaknesses: "Quelques justificatifs d’emploi ou linguistiques restent à consolider",
      recommendations:
        "Finaliser le CV et les preuves d’expérience\nPréparer les justificatifs linguistiques si requis\nValider le calendrier de la procédure travail",
      message: MESSAGE_TEMPLATES_BY_KIND.travail.promising!.message,
    },
    improvement: {
      label: "Travail — plan d’amélioration",
      score: "48",
      verdict: "Profil professionnel à renforcer avant la suite",
      strengths: "Projet travail identifié et volonté d’avancer",
      weaknesses: "Expérience, langue, CV ou justificatifs à renforcer",
      recommendations:
        "Mettre à jour le CV selon le métier visé\nSuivre les recommandations du conseiller\nReprésenter les documents d’emploi manquants",
      message: MESSAGE_TEMPLATES_BY_KIND.travail.improvement!.message,
    },
  },
  etudes: {
    standard: {
      label: "Études — structure standard",
      score: "60",
      verdict: "Projet d’études à examiner avec attention",
      strengths: "Intention d’études et filière à confirmer",
      weaknesses: "Diplômes, relevés et cycle visé à consolider",
      recommendations:
        "Joindre diplômes et relevés de notes complets\nPréciser le cycle visé (licence, master…)\nPréparer un plan de financement indicatif",
      message: MESSAGE_TEMPLATES_BY_KIND.etudes.standard!.message,
    },
    favorable: {
      label: "Études — profil favorable",
      score: "78",
      verdict: "Projet d’études favorable sous réserve",
      strengths: "Parcours académique cohérent\nCycle et motivation clairement exprimés",
      weaknesses: "Quelques pièces scolaires ou de financement restent à consolider",
      recommendations:
        "Finaliser diplômes, relevés et traductions si besoin\nPréparer lettre de motivation et preuves de financement\nValider le calendrier d’admission / procédure",
      message: MESSAGE_TEMPLATES_BY_KIND.etudes.promising!.message,
    },
    improvement: {
      label: "Études — plan d’amélioration",
      score: "48",
      verdict: "Projet d’études à renforcer avant la suite",
      strengths: "Projet d’études identifié et volonté d’avancer",
      weaknesses: "Historique scolaire, langue d’études ou financement à renforcer",
      recommendations:
        "Compléter l’historique scolaire (diplômes et relevés)\nClarifier le cycle et l’établissement visés\nRenforcer les preuves de ressources pour le séjour d’études",
      message: MESSAGE_TEMPLATES_BY_KIND.etudes.improvement!.message,
    },
  },
  tourisme: {
    standard: {
      label: "Visiteurs — structure standard",
      score: "60",
      verdict: "Projet de visite à examiner avec attention",
      strengths: "Intention de séjour et statut à confirmer",
      weaknesses: "Motif, ressources et attaches au pays de résidence à consolider",
      recommendations:
        "Préciser le statut (chef d’entreprise, employé ou particulier)\nDécrire le motif et l’itinéraire du séjour\nPréparer preuves de fonds et d’attaches",
      message: MESSAGE_TEMPLATES_BY_KIND.tourisme.standard!.message,
    },
    favorable: {
      label: "Visiteurs — profil cohérent",
      score: "78",
      verdict: "Projet de visite cohérent sous réserve",
      strengths: "Statut et motif clairement exprimés\nCohérence du séjour apparente",
      weaknesses: "Quelques justificatifs d’itinéraire ou de ressources restent à consolider",
      recommendations:
        "Finaliser hébergement, dates et programme\nPréparer preuves de fonds pour toute la durée\nDocumenter les attaches au pays de résidence",
      message: MESSAGE_TEMPLATES_BY_KIND.tourisme.promising!.message,
    },
    improvement: {
      label: "Visiteurs — plan d’amélioration",
      score: "48",
      verdict: "Projet de visite à renforcer avant la suite",
      strengths: "Projet de visite identifié et volonté d’avancer",
      weaknesses: "Statut, motif, ressources ou intention de retour à renforcer",
      recommendations:
        "Clarifier le statut et le motif précis du séjour\nRenforcer les preuves de ressources de voyage\nDocumenter l’intention de retour (emploi, famille, biens…)",
      message: MESSAGE_TEMPLATES_BY_KIND.tourisme.improvement!.message,
    },
  },
  autre: {
    standard: {
      label: "Structure standard",
      score: "60",
      verdict: "Profil à examiner avec attention",
      strengths: "Expérience et motivation à confirmer",
      weaknesses: "Pièces justificatives et cohérence du projet à renforcer",
      recommendations:
        "Compléter les pièces demandées\nÉchanger avec un conseiller sur les prochaines étapes",
      message: MESSAGE_TEMPLATES_BY_KIND.autre.standard!.message,
    },
    favorable: {
      label: "Profil favorable",
      score: "78",
      verdict: "Profil favorable sous réserve",
      strengths: "Parcours cohérent\nMotivation clairement exprimée",
      weaknesses: "Quelques justificatifs restent à consolider",
      recommendations:
        "Préparer les justificatifs prioritaires\nValider le calendrier de la procédure",
      message: MESSAGE_TEMPLATES_BY_KIND.autre.promising!.message,
    },
    improvement: {
      label: "Plan d’amélioration",
      score: "48",
      verdict: "Profil à renforcer avant la suite",
      strengths: "Projet identifié et volonté d’avancer",
      weaknesses: "Expérience, langue ou justificatifs à renforcer",
      recommendations:
        "Suivre les recommandations du conseiller\nReprésenter les documents manquants",
      message: MESSAGE_TEMPLATES_BY_KIND.autre.improvement!.message,
    },
  },
};

export function messageTemplatesForKind(
  kind: EvaluationProjectKind,
): Record<string, BilanMessageTemplate> {
  return MESSAGE_TEMPLATES_BY_KIND[kind] ?? MESSAGE_TEMPLATES_BY_KIND.autre;
}

export function bilanStructuresForKind(
  kind: EvaluationProjectKind,
): Record<string, BilanStructure> {
  return BILAN_STRUCTURES_BY_KIND[kind] ?? BILAN_STRUCTURES_BY_KIND.autre;
}

export function resolveBilanProjectKind(
  ...values: Array<string | null | undefined>
): EvaluationProjectKind {
  return resolveEvaluationProjectKind(...values);
}
