/**
 * Boîte à outils ops admin : modèles de relance, export CSV file du jour,
 * libellés de préparation à l’activation.
 */

export type AdminRelanceStage =
  | "evaluation_missing"
  | "evaluation_pending"
  | "payment_pending"
  | "documents_pending"
  | "protocol_pending"
  | "email_unverified"
  | "ready_to_activate"
  | "generic";

export type AdminMessageTemplate = {
  id: AdminRelanceStage;
  label: string;
  subject: string;
  body: string;
};

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
    body: "Bonjour {name},\n\nPour activer le suivi de votre dossier {reference}, merci de régulariser les frais d’ouverture puis de déposer la preuve de paiement dans votre espace client :\nhttps://www.3mtravelagency.com/mon-espace\n\nDès réception et validation, nous poursuivons le traitement.\n\nCordialement,\nL’équipe 3M Travel Agency\nhttps://www.3mtravelagency.com",
  },
  {
    id: "documents_pending",
    label: "Pièces manquantes",
    subject: "3M Travel — documents à déposer",
    body: "Bonjour {name},\n\nDes pièces sont encore attendues pour votre dossier {reference}. Connectez-vous à votre espace client pour les déposer.\n\nCordialement,\nL’équipe 3M Travel Agency",
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
    id: "generic",
    label: "Relance générale",
    subject: "3M Travel — suite de votre dossier",
    body: "Bonjour {name},\n\nNous revenons vers vous concernant votre dossier {reference}. Merci de consulter votre espace client pour la prochaine étape.\n\nCordialement,\nL’équipe 3M Travel Agency",
  },
];

export function fillAdminTemplate(
  template: AdminMessageTemplate,
  vars: { name: string; reference: string },
): { subject: string; body: string } {
  const replace = (text: string) =>
    text
      .replaceAll("{name}", vars.name.trim() || "Madame, Monsieur")
      .replaceAll("{reference}", vars.reference.trim() || "votre dossier");
  return { subject: replace(template.subject), body: replace(template.body) };
}

export function templateForStage(stage: string | null | undefined): AdminMessageTemplate {
  const id = (stage || "generic") as AdminRelanceStage;
  return ADMIN_MESSAGE_TEMPLATES.find((row) => row.id === id) ?? ADMIN_MESSAGE_TEMPLATES[ADMIN_MESSAGE_TEMPLATES.length - 1]!;
}

export function buildMailtoRelance(input: {
  email: string;
  name: string;
  reference: string;
  stage?: string | null;
}): string {
  const filled = fillAdminTemplate(templateForStage(input.stage), {
    name: input.name,
    reference: input.reference,
  });
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
}): string | null {
  const digits = input.phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const e164 = digits.startsWith("237") || digits.length > 9 ? digits : `237${digits}`;
  const filled = fillAdminTemplate(templateForStage(input.stage), {
    name: input.name,
    reference: input.reference,
  });
  return `https://wa.me/${e164}?text=${encodeURIComponent(filled.body)}`;
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
