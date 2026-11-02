/**
 * Boîte à outils ops admin : modèles de relance, export CSV file du jour,
 * libellés de préparation à l’activation.
 */

import {
  resolveEvaluationProjectKind,
  type EvaluationProjectKind,
} from "./evaluationVisaCv";

export type AdminRelanceStage =
  | "evaluation_missing"
  | "evaluation_pending"
  | "payment_pending"
  | "documents_pending"
  | "protocol_pending"
  | "email_unverified"
  | "ready_to_activate"
  | "cv_missing"
  | "conversion_open_dossier"
  | "bilan_confirmation_pending"
  | "phone_update"
  | "passport_photo_missing"
  | "passport_validity"
  | "payment_proof_unclear"
  | "appointment_followup"
  | "generic";

export type AdminMessageTemplate = {
  id: AdminRelanceStage;
  label: string;
  subject: string;
  body: string;
  /** Version courte pour WhatsApp (sinon le corps complet est repris). */
  short?: string;
};

const SPACE_URL = "https://www.3mtravelagency.com/mon-espace";
const SITE_URL = "https://www.3mtravelagency.com";
const CONSULTATION_URL = "https://www.3mtravelagency.com/consultation";
const SIGNATURE = "Cordialement,\nL’équipe 3M Travel Agency";
const SIGNATURE_SITE = `${SIGNATURE}\n${SITE_URL}`;
const HELP_LINE = "Une difficulté ? Répondez simplement à ce message : un conseiller vous aide.";

export const ADMIN_MESSAGE_TEMPLATES: AdminMessageTemplate[] = [
  {
    id: "evaluation_missing",
    label: "Évaluation manquante",
    subject: "3M Travel — finalisez votre évaluation",
    body: "Bonjour {name},\n\nVotre dossier {reference} est ouvert. Merci de finaliser votre évaluation en ligne pour que nous puissions poursuivre le traitement.\n\nCordialement,\nL’équipe 3M Travel Agency",
  },
  {
    id: "evaluation_pending",
    label: "Évaluation à valider (interne)",
    subject: "3M Travel — évaluation reçue, validation en cours",
    body: "Bonjour {name},\n\nNous avons bien reçu votre évaluation pour le dossier {reference}. Un conseiller la valide sous peu ; vous serez notifié(e) dès qu’elle sera confirmée.\n\nCordialement,\nL’équipe 3M Travel Agency",
  },
  {
    id: "payment_pending",
    label: "Paiement des frais d’ouverture",
    subject: "3M Travel — frais d’ouverture en attente ({reference})",
    body: `Bonjour {name},\n\nPour activer le suivi de votre dossier {reference} ({visaType} — {destination}), il reste à régler les frais d’ouverture, puis à déposer la preuve de paiement.\n\n1. Ouvrez votre espace : ${SPACE_URL}\n2. Rubrique Paiement : le montant exact de votre dossier y est affiché.\n3. Une fois le règlement effectué, déposez une photo lisible de la preuve (montant, date, référence visibles).\n\nDès validation du paiement, nous poursuivons le traitement et le protocole d’accord N°01.\n\n${HELP_LINE}\n\n${SIGNATURE_SITE}`,
    short: `Bonjour {name}, pour activer le suivi de votre dossier {reference}, il reste à régler les frais d’ouverture puis à déposer la preuve de paiement (photo lisible : montant, date, référence) dans ${SPACE_URL}. Une difficulté ? Répondez ici. — 3M Travel Agency`,
  },
  {
    id: "documents_pending",
    label: "Pièces manquantes",
    subject: "3M Travel — documents à déposer ({reference})",
    body: `Bonjour {name},\n\nPour avancer sur votre dossier {reference}, des pièces sont encore attendues.\n{missingItems}\nComment faire :\n1. Connectez-vous : ${SPACE_URL}\n2. Rubrique Documents, puis « Ajouter une pièce ».\n3. Photographiez ou scannez chaque document en entier, lisible et sans reflet (PDF, JPG ou PNG).\n\nUne pièce difficile à obtenir ? Dites-le-nous : nous cherchons une solution avec vous.\n\n${SIGNATURE_SITE}`,
    short: `Bonjour {name}, des pièces sont encore attendues pour votre dossier {reference}.{missingShort} Déposez-les dans ${SPACE_URL} (rubrique Documents, photo lisible en entier). Une pièce difficile à obtenir ? Répondez ici. — 3M Travel Agency`,
  },
  {
    id: "protocol_pending",
    label: "Protocole à signer",
    subject: "3M Travel — signature du protocole d’accord",
    body: "Bonjour {name},\n\nVotre paiement est confirmé. Merci de signer le protocole d’accord dans votre espace client pour le dossier {reference}.\n\nCordialement,\nL’équipe 3M Travel Agency",
  },
  {
    id: "email_unverified",
    label: "E-mail à confirmer",
    subject: "3M Travel — confirmez votre adresse e-mail ({reference})",
    body: "Bonjour {name},\n\nVotre compte 3M Travel (dossier {reference}) n’est pas encore confirmé.\n\n1) Vérifiez d’abord vos spams / courriers indésirables : cherchez un message de hello@3mtravelagency.com ou « 3M Travel ».\n2) Ouvrez le lien de confirmation dans cet e-mail.\n3) Ou connectez-vous ici : https://www.3mtravelagency.com/login\n\nSi vous ne trouvez toujours pas le message, répondez à ce mail ou écrivez-nous sur WhatsApp — nous pourrons vous renvoyer un nouveau lien.\n\nCordialement,\nL’équipe 3M Travel Agency\nhttps://www.3mtravelagency.com",
  },
  {
    id: "ready_to_activate",
    label: "Prêt à activer (interne)",
    subject: "3M Travel — dossier prêt",
    body: "Bonjour {name},\n\nVotre dossier {reference} est prêt côté pièces et paiement. Notre équipe finalise l’activation du suivi.\n\nCordialement,\nL’équipe 3M Travel Agency",
  },
  {
    id: "cv_missing",
    label: "CV manquant (préévaluation)",
    subject: "3M Travel — votre CV pour finaliser le bilan ({reference})",
    body: `Bonjour {name},\n\nPour terminer l’évaluation de votre profil {reference} ({visaType} — {destination}), il nous manque votre CV à jour.\n\nEn 3 étapes :\n1. Connectez-vous : ${SPACE_URL}\n2. Ouvrez la rubrique Documents (ou Évaluation).\n3. Déposez votre CV (PDF, JPG ou PNG, 5 Mo maximum).\n\nDès réception, un conseiller prépare votre bilan.\n\n${HELP_LINE}\n\n${SIGNATURE_SITE}`,
    short: `Bonjour {name}, il manque votre CV à jour pour finaliser votre bilan ({reference}). Déposez-le dans ${SPACE_URL} (PDF, JPG ou PNG, 5 Mo max). Une difficulté ? Répondez ici. — 3M Travel Agency`,
  },
  {
    id: "conversion_open_dossier",
    label: "Convaincre d’ouvrir le dossier",
    subject: "3M Travel — activez le suivi de votre dossier ({reference})",
    body: `Bonjour {name},\n\nVotre pré-inscription {reference} ({visaType} — {destination}) est bien enregistrée. Pour que nous démarrions le traitement (bilan, protocole, suivi par un conseiller), il reste à ouvrir votre dossier officiel :\n\n1. Ouvrez votre espace : ${SPACE_URL}\n2. Rubrique Paiement : réglez les frais d’ouverture (le montant exact de votre dossier y est affiché) et déposez la preuve de paiement.\n3. Nous vérifions le paiement, puis nous activons votre dossier officiel et votre suivi.\n\nUne question avant de vous décider ? Répondez à ce message ou prenez rendez-vous avec un conseiller : ${CONSULTATION_URL}\n\n${SIGNATURE_SITE}`,
    short: `Bonjour {name}, votre pré-inscription {reference} est enregistrée. Pour démarrer le traitement, ouvrez votre dossier officiel : règlement des frais d’ouverture et preuve de paiement dans ${SPACE_URL}. Une question ? Répondez ici ou prenez rendez-vous : ${CONSULTATION_URL} — 3M Travel Agency`,
  },
  {
    id: "bilan_confirmation_pending",
    label: "Confirmer la réception du bilan",
    subject: "3M Travel — confirmez la réception de votre bilan ({reference})",
    body: "Bonjour {name},\n\nVotre bilan d’évaluation pour le dossier {reference} est disponible dans votre espace client.\n\nMerci de confirmer que vous l’avez bien reçu et compris (bouton de confirmation dans Mon espace). Cette étape débloque ensuite le paiement d’ouverture et la suite du parcours.\n\nEspace client : https://www.3mtravelagency.com/mon-espace\n\nCordialement,\nL’équipe 3M Travel Agency\nhttps://www.3mtravelagency.com",
  },
  {
    id: "phone_update",
    label: "Mettre à jour le téléphone",
    subject: "3M Travel — vérifiez votre numéro de téléphone ({reference})",
    body: `Bonjour {name},\n\nNous n’arrivons pas à vous joindre de façon fiable avec le numéro enregistré pour votre dossier {reference}. Pour que votre conseiller puisse vous appeler ou vous écrire sur WhatsApp :\n\n1. Connectez-vous : ${SPACE_URL}\n2. Ouvrez votre profil et vérifiez votre numéro, avec l’indicatif du pays (par exemple +237…).\n3. Précisez si ce numéro est aussi votre WhatsApp.\n\nVous pouvez aussi répondre directement à ce message avec votre numéro actuel.\n\n${SIGNATURE_SITE}`,
    short: `Bonjour {name}, le numéro enregistré pour votre dossier {reference} ne nous permet pas de vous joindre. Répondez ici avec votre numéro actuel (avec l’indicatif) et dites-nous s’il est sur WhatsApp, ou mettez votre profil à jour : ${SPACE_URL} — 3M Travel Agency`,
  },
  {
    id: "passport_photo_missing",
    label: "Photo de profil type passeport",
    subject: "3M Travel — photo de profil type passeport ({reference})",
    body: `Bonjour {name},\n\nPour poursuivre votre dossier {reference}, nous avons besoin d’une photo de profil de type passeport.\n\nPour qu’elle soit acceptée :\n• de face, visage entièrement visible, sans lunettes teintées ni couvre-chef ;\n• fond uni et clair, bonne lumière, sans filtre ;\n• photo récente, nette, au format JPG ou PNG.\n\nDéposez-la ici : ${SPACE_URL} (rubrique Profil ou Documents).\n\n${HELP_LINE}\n\n${SIGNATURE_SITE}`,
    short: `Bonjour {name}, il manque une photo de profil type passeport pour votre dossier {reference} : de face, fond clair uni, sans filtre ni lunettes teintées (JPG ou PNG). Déposez-la dans ${SPACE_URL}. Une difficulté ? Répondez ici. — 3M Travel Agency`,
  },
  {
    id: "passport_validity",
    label: "Valider la validité du passeport",
    subject: "3M Travel — vérifiez la validité de votre passeport ({reference})",
    body: `Bonjour {name},\n\nAvant d’aller plus loin sur votre dossier {reference} ({visaType} — {destination}), merci de vérifier la date d’expiration de votre passeport : la plupart des démarches demandent une validité suffisante après la date de voyage (la durée exacte se confirme sur la source officielle du pays).\n\nSi votre passeport expire bientôt ou a expiré, il vaut mieux le renouveler avant de déposer une demande.\n\nVous pouvez nous indiquer la date d’expiration en répondant à ce message, ou déposer une copie de la page d’identité dans ${SPACE_URL}.\n\n${SIGNATURE_SITE}`,
    short: `Bonjour {name}, pour votre dossier {reference}, pouvez-vous nous confirmer la date d’expiration de votre passeport ? S’il expire bientôt, mieux vaut le renouveler avant toute demande. Répondez ici ou déposez la page d’identité dans ${SPACE_URL} — 3M Travel Agency`,
  },
  {
    id: "payment_proof_unclear",
    label: "Preuve de paiement à renvoyer",
    subject: "3M Travel — preuve de paiement à renvoyer ({reference})",
    body: `Bonjour {name},\n\nLa preuve de paiement reçue pour votre dossier {reference} n’est pas exploitable en l’état (illisible, incomplète ou coupée). Pour que nous puissions valider votre règlement :\n\n1. Reprenez une photo nette de tout le justificatif, ou une capture d’écran de la confirmation de votre opérateur.\n2. Vérifiez que le montant, la date, la référence de la transaction et le bénéficiaire sont visibles.\n3. Déposez-la dans ${SPACE_URL} (rubrique Paiement).\n\n${HELP_LINE}\n\n${SIGNATURE_SITE}`,
    short: `Bonjour {name}, la preuve de paiement de votre dossier {reference} n’est pas lisible. Merci d’en redéposer une photo nette de tout le justificatif (montant, date, référence, bénéficiaire) dans ${SPACE_URL}. Une difficulté ? Répondez ici. — 3M Travel Agency`,
  },
  {
    id: "appointment_followup",
    label: "Proposer un rendez-vous",
    subject: "3M Travel — prenons rendez-vous ({reference})",
    body: `Bonjour {name},\n\nPour avancer sur votre dossier {reference} ({visaType} — {destination}), certains éléments se vérifient mieux de vive voix ou en agence : situation personnelle, ressources, pièces originales.\n\nChoisissez le créneau qui vous convient : ${CONSULTATION_URL}\n\nPensez à apporter ou à avoir sous la main votre passeport et les pièces déjà rassemblées. Votre conseiller aura préparé votre dossier avant l’entretien.\n\n${SIGNATURE_SITE}`,
    short: `Bonjour {name}, pour avancer sur votre dossier {reference}, un échange avec un conseiller est utile. Choisissez un créneau : ${CONSULTATION_URL} (passeport et pièces déjà réunies, si possible). — 3M Travel Agency`,
  },
  {
    id: "generic",
    label: "Relance générale",
    subject: "3M Travel — suite de votre dossier",
    body: "Bonjour {name},\n\nNous revenons vers vous concernant votre dossier {reference}. Merci de consulter votre espace client pour la prochaine étape.\n\nCordialement,\nL’équipe 3M Travel Agency",
  },
];

/** Variantes évaluation / documents selon le type de visa (travail · études · visiteurs). */
const VISA_AWARE_STAGE_COPY: Partial<
  Record<AdminRelanceStage, Partial<Record<EvaluationProjectKind, { subject: string; body: string; label?: string; short?: string }>>>
> = {
  evaluation_missing: {
    travail: {
      label: "Évaluation manquante (visa travail)",
      subject: "3M Travel — évaluation visa travail + CV ({reference})",
      body: `Bonjour {name},\n\nVotre dossier {reference} (visa travail) est ouvert. Il reste à finaliser l’évaluation en ligne avec votre profil professionnel et un CV actualisé.\n\n1. Connectez-vous : ${SPACE_URL}\n2. Complétez le formulaire d’évaluation (métier visé, expérience, langues).\n3. Déposez votre CV à jour.\n\nSans CV, nous ne pourrons pas valider le bilan de mobilité.\n\n${HELP_LINE}\n\n${SIGNATURE}`,
      short: `Bonjour {name}, pour finaliser votre évaluation visa travail ({reference}), complétez le formulaire et déposez votre CV à jour dans ${SPACE_URL}. Une difficulté ? Répondez ici. — 3M Travel Agency`,
    },
    etudes: {
      label: "Évaluation manquante (visa études)",
      subject: "3M Travel — évaluation visa études ({reference})",
      body: `Bonjour {name},\n\nVotre dossier {reference} (visa études) est ouvert. Il reste à compléter le formulaire d’évaluation : il suffit à préparer votre bilan, sans CV obligatoire.\n\n1. Connectez-vous : ${SPACE_URL}\n2. Complétez le formulaire : parcours scolaire, cycle d’études visé, diplômes et relevés de notes, admission, financement.\n3. Les questions s’adaptent au pays et au programme que vous avez choisis.\n\n${HELP_LINE}\n\n${SIGNATURE}`,
      short: `Bonjour {name}, pour votre évaluation visa études ({reference}), complétez le formulaire dans ${SPACE_URL} : parcours scolaire, cycle visé, diplômes et relevés, admission, financement. Pas de CV obligatoire. — 3M Travel Agency`,
    },
    tourisme: {
      label: "Évaluation manquante (visa visiteurs)",
      subject: "3M Travel — évaluation visa visiteurs ({reference})",
      body: `Bonjour {name},\n\nVotre dossier {reference} (visa visiteurs) est ouvert. Il reste à remplir le formulaire adapté à votre séjour : il suffit à préparer votre bilan, sans CV.\n\n1. Connectez-vous : ${SPACE_URL}\n2. Complétez le formulaire : votre statut (chef d’entreprise, employé ou particulier), le motif et les dates du séjour, l’hébergement, le financement et vos attaches dans votre pays.\n3. Un conseiller étudie ensuite vos réponses et vous propose un rendez-vous si nécessaire.\n\n${HELP_LINE}\n\n${SIGNATURE}`,
      short: `Bonjour {name}, pour votre dossier visiteur {reference}, complétez le formulaire dans ${SPACE_URL} : statut, motif et dates du séjour, hébergement, financement, attaches. Pas de CV. Un conseiller vous proposera un rendez-vous si besoin. — 3M Travel Agency`,
    },
  },
  documents_pending: {
    travail: {
      label: "Pièces manquantes (visa travail)",
      subject: "3M Travel — CV / pièces pro à déposer ({reference})",
      body: `Bonjour {name},\n\nDes pièces sont encore attendues pour votre dossier {reference} (visa travail). Priorité : CV à jour et justificatifs professionnels.\n{missingItems}\nComment faire :\n1. Connectez-vous : ${SPACE_URL}\n2. Rubrique Documents, puis « Ajouter une pièce ».\n3. Photographiez ou scannez chaque document en entier, lisible et sans reflet (PDF, JPG ou PNG).\n\n${HELP_LINE}\n\n${SIGNATURE_SITE}`,
      short: `Bonjour {name}, il manque encore des pièces pour votre dossier {reference} (visa travail) : CV à jour et justificatifs professionnels.{missingShort} Déposez-les dans ${SPACE_URL}. Une difficulté ? Répondez ici. — 3M Travel Agency`,
    },
    etudes: {
      label: "Pièces manquantes (visa études)",
      subject: "3M Travel — diplômes et relevés à déposer ({reference})",
      body: `Bonjour {name},\n\nDes pièces sont encore attendues pour votre dossier {reference} (visa études). Priorité : diplômes obtenus et relevés de notes.\n{missingItems}\nComment faire :\n1. Connectez-vous : ${SPACE_URL}\n2. Rubrique Documents, puis « Ajouter une pièce ».\n3. Photographiez ou scannez chaque document en entier, lisible et sans reflet (PDF, JPG ou PNG).\n\n${HELP_LINE}\n\n${SIGNATURE_SITE}`,
      short: `Bonjour {name}, il manque encore des pièces pour votre dossier {reference} (visa études) : diplômes et relevés de notes.{missingShort} Déposez-les dans ${SPACE_URL}. Une difficulté ? Répondez ici. — 3M Travel Agency`,
    },
    tourisme: {
      label: "Pièces manquantes (visa visiteurs)",
      subject: "3M Travel — justificatifs visiteurs ({reference})",
      body: `Bonjour {name},\n\nDes pièces sont encore attendues pour votre dossier {reference} (visa visiteurs). Selon votre statut (chef d’entreprise, employé ou particulier), déposez les justificatifs correspondants.\n{missingItems}\nComment faire :\n1. Connectez-vous : ${SPACE_URL}\n2. Rubrique Documents, puis « Ajouter une pièce ».\n3. Photographiez ou scannez chaque document en entier, lisible et sans reflet (PDF, JPG ou PNG).\n\nCertains éléments se vérifient aussi en rendez-vous : ${CONSULTATION_URL}\n\n${HELP_LINE}\n\n${SIGNATURE_SITE}`,
      short: `Bonjour {name}, il manque encore des justificatifs pour votre dossier visiteur {reference} (selon votre statut : chef d’entreprise, employé ou particulier).{missingShort} Déposez-les dans ${SPACE_URL} ou prenez rendez-vous : ${CONSULTATION_URL} — 3M Travel Agency`,
    },
  },
};

export function fillAdminTemplate(
  template: AdminMessageTemplate,
  vars: {
    name: string;
    reference: string;
    destination?: string | null;
    visaType?: string | null;
    /** Pièces réellement manquantes pour ce dossier : insérées là où le modèle contient {missingItems}. */
    missingItems?: string[];
  },
): { subject: string; body: string; short: string } {
  const items = (vars.missingItems ?? []).map((item) => item.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 12);
  const missingBlock = items.length ? `\nPièces encore attendues :\n${items.map((item) => `• ${item}`).join("\n")}\n` : "";
  const missingShort = items.length ? ` Attendu : ${items.slice(0, 4).join(", ")}${items.length > 4 ? "…" : ""}.` : "";
  const replace = (text: string) =>
    text
      .replaceAll("{name}", vars.name.trim() || "Madame, Monsieur")
      .replaceAll("{reference}", vars.reference.trim() || "votre dossier")
      .replaceAll("{destination}", (vars.destination || "").trim() || "votre destination")
      .replaceAll("{visaType}", (vars.visaType || "").trim() || "votre procédure")
      .replaceAll("{missingItems}", missingBlock)
      .replaceAll("{missingShort}", missingShort)
      .replace(/\n{3,}/g, "\n\n");
  return { subject: replace(template.subject), body: replace(template.body), short: replace(template.short ?? template.body) };
}

export function templateForStage(
  stage: string | null | undefined,
  visaOrProject?: string | null,
): AdminMessageTemplate {
  const id = (stage || "generic") as AdminRelanceStage;
  const base = ADMIN_MESSAGE_TEMPLATES.find((row) => row.id === id)
    ?? ADMIN_MESSAGE_TEMPLATES[ADMIN_MESSAGE_TEMPLATES.length - 1]!;
  const kind = resolveEvaluationProjectKind(visaOrProject);
  const variant = VISA_AWARE_STAGE_COPY[id]?.[kind];
  if (!variant) return base;
  return {
    id: base.id,
    label: variant.label ?? base.label,
    subject: variant.subject,
    body: variant.body,
    short: variant.short ?? base.short,
  };
}

export function buildMailtoRelance(input: {
  email: string;
  name: string;
  reference: string;
  stage?: string | null;
  /** Type de visa / projet pour adapter le texte (travail, études, visiteurs). */
  visaType?: string | null;
  projectType?: string | null;
}): string {
  const filled = fillAdminTemplate(
    templateForStage(input.stage, input.projectType ?? input.visaType),
    {
      name: input.name,
      reference: input.reference,
    },
  );
  const params = new URLSearchParams({
    subject: filled.subject,
    body: filled.body,
  });
  return `mailto:${encodeURIComponent(input.email)}?${params.toString()}`;
}

export function buildWhatsAppRelance(input: {
  phone: string;
  name: string;
  reference: string;
  stage?: string | null;
  visaType?: string | null;
  projectType?: string | null;
}): string | null {
  const digits = input.phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const e164 = digits.startsWith("237") || digits.length > 9 ? digits : `237${digits}`;
  const filled = fillAdminTemplate(
    templateForStage(input.stage, input.projectType ?? input.visaType),
    {
      name: input.name,
      reference: input.reference,
    },
  );
  // WhatsApp : version courte du modèle (quelques lignes, un seul lien).
  return `https://wa.me/${e164}?text=${encodeURIComponent(filled.short)}`;
}

export type TodayCsvRow = {
  label: string;
  fullName: string;
  folderCode: string;
  detail: string;
  destination?: string | null;
  tone: string;
};

export function todayQueueToCsv(rows: TodayCsvRow[]): string {
  const header = ["Priorité", "Candidat", "Référence", "Détail", "Destination", "Urgence"];
  const escape = (value: string) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = rows.map((row) =>
    [row.label, row.fullName, row.folderCode, row.detail, row.destination ?? "", row.tone]
      .map((cell) => escape(String(cell)))
      .join(";"),
  );
  return `\uFEFF${[header.map(escape).join(";"), ...lines].join("\n")}`;
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Badge liste dossiers : préparation d’activation pour un pré-dossier compte. */
export function preDossierReadinessBadge(input: {
  source?: string | null;
  evaluationDeclarationStatus?: string | null;
  paymentStatus?: string | null;
}): { label: string; tone: "amber" | "emerald" | "slate" | "rose" } | null {
  if (input.source !== "ACCOUNT_ONLY") return null;
  const evalOk =
    input.evaluationDeclarationStatus === "validated"
    || input.evaluationDeclarationStatus === "approved";
  const payOk = ["SUCCESS", "success", "paid", "paye", "completed"].includes(
    String(input.paymentStatus ?? ""),
  );
  if (evalOk && payOk) return { label: "Prêt à activer", tone: "emerald" };
  if (!evalOk && !payOk) return { label: "Éval + paiement", tone: "rose" };
  if (!evalOk) return { label: "Éval à valider", tone: "amber" };
  return { label: "Paiement à valider", tone: "amber" };
}

export function formatActivationTransition(input: {
  formerAccountReference?: string | null;
  folderCode?: string | null;
  activatedAt?: string | Date | null;
  activatedBy?: string | null;
}): string | null {
  if (!input.formerAccountReference || !input.folderCode) return null;
  if (input.formerAccountReference === input.folderCode) return null;
  const when = input.activatedAt
    ? new Date(input.activatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
    : null;
  const by = input.activatedBy ? ` par ${input.activatedBy}` : "";
  return when
    ? `${input.formerAccountReference} → ${input.folderCode} · ${when}${by}`
    : `${input.formerAccountReference} → ${input.folderCode}${by}`;
}
