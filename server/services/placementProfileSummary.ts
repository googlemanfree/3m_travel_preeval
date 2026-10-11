import { createHash } from "node:crypto";

type SummaryDocument = {
  type?: string | null;
  name?: string | null;
  status?: string | null;
  comment?: string | null;
};

export type PlacementSummaryInput = {
  fullName: string;
  destination: string;
  procedure: string;
  sector?: string | null;
  yearsExperience?: string | null;
  languages?: string | null;
  profileSummary?: string | null;
  documents?: SummaryDocument[];
};

export type PlacementSummaryDraft = {
  firstName: string;
  identity: string;
  destination: string;
  procedure: string;
  sector: string;
  experience: string;
  languages: string;
  profileSummary: string;
  documents: Array<{ type: string; status: string }>;
};

const TYPE_LABELS: Record<string, string> = {
  cv: "CV",
  passeport: "Passeport",
  diplome: "Diplôme",
  releve_notes: "Relevé de notes",
  photo: "Photo",
  contrat: "Contrat",
  autre: "Autre",
};

function identityFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "Candidat";
  const lastName = parts.slice(1).join(" ");
  return { firstName, identity: lastName ? `${firstName} ${lastName[0].toUpperCase()}.` : firstName };
}

export function sanitizeSummaryText(value?: string | null, fallback = "À préciser") {
  return String(value || fallback)
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[coordonnée masquée]")
    .replace(/(?:\+?\d[\d .()/-]{7,}\d)/g, "[coordonnée masquée]")
    .replace(/\b(?:passeport|passport|n[°o]\s*)[A-Z0-9 -]{4,}\b/gi, "[identifiant masqué]")
    .replace(/\b[A-Z]{1,4}[ -]?\d{5,}\b/g, "[identifiant masqué]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

function normalizeType(value?: string | null) {
  const key = String(value || "autre").trim().toLowerCase().replace(/[éèêë]/g, "e").replace(/\s+/g, "_");
  return TYPE_LABELS[key] || value?.trim() || "Autre";
}

export function buildPlacementSummaryDraft(input: PlacementSummaryInput): PlacementSummaryDraft {
  const identity = identityFromName(input.fullName);
  const documents = new Map<string, { type: string; status: string }>();
  for (const document of input.documents || []) {
    const type = normalizeType(document.type || document.name);
    const status = document.status === "verified" || document.status === "approved" ? "Validé" : document.status === "rejected" ? "À corriger" : "En vérification";
    const existing = documents.get(type);
    const rank = { "Validé": 3, "À corriger": 2, "En vérification": 1 } as const;
    if (!existing || rank[status as keyof typeof rank] > rank[existing.status as keyof typeof rank]) documents.set(type, { type, status });
  }
  return {
    ...identity,
    destination: sanitizeSummaryText(input.destination),
    procedure: sanitizeSummaryText(input.procedure),
    sector: sanitizeSummaryText(input.sector),
    experience: sanitizeSummaryText(input.yearsExperience),
    languages: sanitizeSummaryText(input.languages),
    profileSummary: sanitizeSummaryText(input.profileSummary, "Profil préparé et suivi par 3M."),
    documents: Array.from(documents.values()).sort((a, b) => a.type.localeCompare(b.type, "fr")),
  };
}

export function fingerprintPlacementSummary(draft: PlacementSummaryDraft) {
  return createHash("sha256").update(JSON.stringify(draft)).digest("hex");
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "?");
}

export function buildPlacementSummaryPdf(draft: PlacementSummaryDraft) {
  const lines = [
    "3M TRAVEL AGENCY — FICHE DE SYNTHESE",
    `Identite externe : ${draft.identity}`,
    `Destination : ${draft.destination}`,
    `Procedure : ${draft.procedure}`,
    `Secteur : ${draft.sector}`,
    `Experience : ${draft.experience}`,
    `Langues : ${draft.languages}`,
    "",
    `Resume : ${draft.profileSummary}`,
    "",
    "Pieces declarees :",
    ...(draft.documents.length ? draft.documents.map((document) => `- ${document.type} : ${document.status}`) : ["- Aucune piece referencee"]),
    "",
    "Contact : 3M TRAVEL AGENCY uniquement",
  ];
  const renderedLines = lines.map((line, index) => {
    const move = index < lines.length - 1 ? " 0 -16 Td" : "";
    return `(${pdfEscape(line.slice(0, 110))}) Tj${move}`;
  });
  const content = ["BT", "/F1 10 Tf", "50 760 Td", ...renderedLines, "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => { offsets[index + 1] = Buffer.byteLength(pdf, "latin1"); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}
