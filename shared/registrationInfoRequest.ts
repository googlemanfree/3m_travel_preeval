/**
 * Demande d’informations complémentaires dérivée du pays + type de visa
 * déclarés à l’inscription (ou confirmés en pré-dossier).
 */

import { buildCountryProcedureDocumentChecklist } from "./countryProcedureChecklist";
import { evaluationRequiresCv } from "./evaluationVisaCv";

export type RegistrationInfoItem = {
  label: string;
  detail: string;
  priority: "required" | "recommended";
};

function fold(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeProjectType(visaType: string | null | undefined): "travail" | "etudes" | "tourisme" | "autre" {
  const value = fold(visaType);
  if (/(etude|study|scolaire)/.test(value)) return "etudes";
  if (/(touris|visitor|visiteur|sejour)/.test(value)) return "tourisme";
  if (/(travail|work|emploi|job|qualified|qualifie)/.test(value)) return "travail";
  return "autre";
}

/** Liste des pièces / infos à demander selon destination + visa. */
export function buildRegistrationInfoRequest(input: {
  destination?: string | null;
  visaType?: string | null;
  hasCv?: boolean;
}): { destination: string; visaType: string; projectKind: string; items: RegistrationInfoItem[]; subject: string } {
  const destination = String(input.destination ?? "").trim() || "Destination à préciser";
  const visaType = String(input.visaType ?? "").trim() || "Procédure à qualifier";
  const projectKind = normalizeProjectType(visaType);
  const checklist = buildCountryProcedureDocumentChecklist({
    destination,
    procedureType: visaType,
  });

  const workCvRequired = evaluationRequiresCv(visaType, projectKind);
  const items: RegistrationInfoItem[] = checklist.documents.slice(0, 16).map((line) => {
    const isCv = /cv|curriculum/i.test(line.documentType);
    const priority: RegistrationInfoItem["priority"] =
      isCv
        ? (workCvRequired ? "required" : "recommended")
        : /passeport|diplome|releve|financement|admission/i.test(line.documentType)
          ? "required"
          : "recommended";
    return {
      label: line.documentType,
      detail: line.comment,
      priority,
    };
  });

  if (workCvRequired && !input.hasCv) {
    const already = items.some((item) => /cv|curriculum/i.test(item.label));
    if (!already) {
      items.unshift({
        label: "CV à jour (PDF, JPG ou PNG, 5 Mo max)",
        detail: "Obligatoire pour finaliser l’évaluation d’un projet de visa travail. Déposez-le depuis votre espace candidat.",
        priority: "required",
      });
    } else {
      const cvItem = items.find((item) => /cv|curriculum/i.test(item.label));
      if (cvItem) {
        cvItem.priority = "required";
        cvItem.detail = `${cvItem.detail} Obligatoire pour votre projet de visa travail.`;
      }
    }
  } else if (!workCvRequired) {
    for (const item of items) {
      if (/cv|curriculum/i.test(item.label) && item.priority === "required") {
        item.priority = "recommended";
      }
    }
  }

  if (projectKind === "etudes") {
    const hasAdmission = items.some((item) => /admission|lettre/i.test(item.label));
    if (!hasAdmission) {
      items.push({
        label: "Projet d’études et établissement visé",
        detail: "Indiquez le domaine, le niveau et, si disponible, toute preuve de candidature ou d’admission.",
        priority: "required",
      });
    }
  }

  if (projectKind === "tourisme") {
    const hasItinerary = items.some((item) => /itineraire|motif|sejour/i.test(fold(item.label)));
    if (!hasItinerary) {
      items.push({
        label: "Motif et calendrier du séjour",
        detail: "Précisez la durée envisagée, les attaches au pays de résidence et les ressources prévues.",
        priority: "required",
      });
    }
  }

  if (!items.length) {
    items.push({
      label: "Compléter le profil projet",
      detail: "Précisez votre destination, votre type de visa et les pièces déjà disponibles pour que le conseiller puisse préparer votre évaluation.",
      priority: "required",
    });
  }

  return {
    destination,
    visaType,
    projectKind,
    items,
    subject: `Documents justificatifs — ${destination} · ${visaType} — 3M TRAVEL AGENCY`,
  };
}

/**
 * Les pièces justificatives (passeport, état civil, ressources, etc.)
 * ne se demandent qu’après l’évaluation / envoi du bilan.
 */
export function isEvaluationCompleteForJustificatifs(input: {
  evaluationDeclarationStatus?: string | null;
  evaluationReviewedAt?: Date | string | null;
  evaluationDeliveryStatus?: string | null;
  evaluationClientConfirmed?: boolean | null;
  evaluationClientConfirmedAt?: Date | string | null;
  evaluationValidatedAt?: Date | string | null;
}): boolean {
  if (String(input.evaluationDeclarationStatus || "").trim().toLowerCase() === "validated") return true;
  if (input.evaluationReviewedAt) return true;
  if (input.evaluationValidatedAt) return true;
  if (String(input.evaluationDeliveryStatus || "").trim().toLowerCase() === "sent") return true;
  if (input.evaluationClientConfirmed) return true;
  if (input.evaluationClientConfirmedAt) return true;
  return false;
}

/** Corps texte professionnel pour e-mail brandé + espace client. */
export function registrationInfoRequestPlainBody(input: {
  fullName: string;
  destination: string;
  visaType: string;
  items: RegistrationInfoItem[];
  reference?: string | null;
}): string {
  const lines = input.items.map(
    (item) => `• ${item.label}${item.priority === "required" ? " (prioritaire)" : ""} — ${item.detail}`,
  );
  return [
    `Bonjour ${input.fullName},`,
    "",
    `Suite à votre évaluation, merci de déposer les documents justificatifs pour votre projet ${input.destination} · ${input.visaType}${input.reference ? ` (réf. ${input.reference})` : ""} :`,
    "",
    ...lines,
    "",
    "Connectez-vous à votre espace candidat (Documents) pour déposer chaque pièce. Un conseiller relit chaque élément — aucune décision automatique.",
    "",
    "Cordialement,",
    "L’équipe 3M Travel Agency",
    "https://www.3mtravelagency.com",
  ].join("\n");
}

/** Entête complète pour le fil de messages de l’espace client. */
export function buildRegistrationInfoClientSpaceContent(input: {
  destination: string;
  visaType: string;
  reference?: string | null;
  body: string;
}): string {
  const meta = [
    input.reference ? `Référence : ${input.reference}` : null,
    `Destination : ${input.destination}`,
    `Procédure : ${input.visaType}`,
  ].filter(Boolean).join(" · ");
  return [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "3M TRAVEL AGENCY",
    "Demande de documents justificatifs",
    meta,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    input.body.trim(),
  ].join("\n");
}

export function registrationInfoRequestEmailHtml(input: {
  fullName: string;
  destination: string;
  visaType: string;
  items: RegistrationInfoItem[];
  portalUrl?: string;
  reference?: string | null;
}): string {
  const esc = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const list = input.items
    .map(
      (item) =>
        `<li style="margin:0 0 10px"><strong>${esc(item.label)}</strong>${item.priority === "required" ? " <span style=\"color:#b45309\">(prioritaire)</span>" : ""}<br/><span style=\"color:#475569;font-size:13px\">${esc(item.detail)}</span></li>`,
    )
    .join("");
  const portal = input.portalUrl || "/mon-espace";
  const meta = [
    input.reference ? `Réf. ${esc(input.reference)}` : null,
    esc(input.destination),
    esc(input.visaType),
  ].filter(Boolean).join(" · ");
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.55;max-width:640px;margin:0 auto;background:#ffffff">
<div style="background:linear-gradient(135deg,#123b70 0%,#2563eb 100%);padding:28px 32px;color:#ffffff">
<p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.85">3M TRAVEL AGENCY</p>
<h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff">Documents justificatifs</h1>
${meta ? `<p style="margin:10px 0 0;font-size:13px;opacity:.9">${meta}</p>` : ""}
</div>
<div style="padding:28px 32px;background:#f8fafc">
<p>Bonjour <strong>${esc(input.fullName)}</strong>,</p>
<p>Suite à votre évaluation, merci de déposer les documents justificatifs pour votre projet <strong>${esc(input.destination)}</strong> · <strong>${esc(input.visaType)}</strong> dans votre espace client :</p>
<ul style="padding-left:18px;margin:16px 0">${list}</ul>
<p style="text-align:center;margin:28px 0 12px">
<a href="${esc(portal.startsWith("http") ? portal : `https://www.3mtravelagency.com${portal.startsWith("/") ? portal : `/${portal}`}`)}" style="background:#2563eb;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:7px;display:inline-block;font-weight:700">Ouvrir mon espace Documents</a>
</p>
<p style="font-size:13px;color:#64748b">Un conseiller relit chaque élément. Aucune décision de visa, d’admission ou d’emploi n’est automatique.</p>
</div>
<div style="padding:16px 32px;background:#e2e8f0;font-size:12px;color:#475569;text-align:center">3M TRAVEL AGENCY — accompagnement mobilité internationale</div>
</div>`;
}

export function registrationProfileDownloadText(input: {
  fullName?: string | null;
  email?: string | null;
  preferredDestinations?: string[] | null;
  visaType?: string | null;
  educationLevel?: string | null;
  employmentStatus?: string | null;
  languageLevel?: string | null;
  nationality?: string | null;
  generatedAt?: Date;
}): string {
  const destinations = (input.preferredDestinations ?? []).filter(Boolean);
  const lines = [
    "3M TRAVEL AGENCY — Projet déclaré à l’inscription",
    `Généré le ${(input.generatedAt ?? new Date()).toLocaleString("fr-FR")}`,
    "",
    `Candidat : ${input.fullName || "—"}`,
    `E-mail : ${input.email || "—"}`,
    "",
    "Destinations déclarées :",
    ...(destinations.length
      ? destinations.map((name, index) => `  ${index + 1}. ${name}${index === 0 ? " (principale)" : ""}`)
      : ["  (aucune destination précise)"]),
    "",
    `Type de projet : ${input.visaType || "Non renseigné"}`,
    `Niveau d’études : ${input.educationLevel || "Non renseigné"}`,
    `Situation professionnelle : ${input.employmentStatus || "Non renseigné"}`,
    `Niveau de langue : ${input.languageLevel || "Non renseigné"}`,
    `Nationalité : ${input.nationality || "Non renseigné"}`,
    "",
    "Document généré depuis l’espace administrateur. À usage interne et suivi dossier.",
  ];
  return lines.join("\n");
}
