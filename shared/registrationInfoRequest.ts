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
    subject: `Informations à compléter — ${destination} · ${visaType} — 3M TRAVEL AGENCY`,
  };
}

export function registrationInfoRequestEmailHtml(input: {
  fullName: string;
  destination: string;
  visaType: string;
  items: RegistrationInfoItem[];
  portalUrl?: string;
}): string {
  const esc = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const list = input.items
    .map(
      (item) =>
        `<li style="margin:0 0 10px"><strong>${esc(item.label)}</strong>${item.priority === "required" ? " <span style=\"color:#b45309\">(prioritaire)</span>" : ""}<br/><span style="color:#475569;font-size:13px">${esc(item.detail)}</span></li>`,
    )
    .join("");
  const portal = input.portalUrl || "/mon-espace";
  return `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;max-width:640px">
<p>Bonjour ${esc(input.fullName)},</p>
<p>Pour avancer sur votre projet <strong>${esc(input.destination)}</strong> · <strong>${esc(input.visaType)}</strong>, merci de compléter les éléments suivants dans votre espace client 3M TRAVEL AGENCY :</p>
<ul style="padding-left:18px">${list}</ul>
<p>Connectez-vous à votre <a href="${esc(portal)}">espace candidat sécurisé</a> pour déposer les pièces ou répondre à votre conseiller. Aucune décision automatique n’est prise : un conseiller relit chaque élément.</p>
<p style="color:#64748b;font-size:13px">3M TRAVEL AGENCY — accompagnement mobilité internationale</p>
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
