/**
 * Livre le formulaire d’évaluation préliminaire du pays choisi :
 * — coffre (case_documents + documents agence si dossier lié)
 * — notification espace client
 * — e-mail avec PDF en pièce jointe + instructions claires
 */

import { and, desc, eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  COUNTRY_EVAL_FORM_DOCUMENT_TYPE,
  resolveCountryEvaluationForm,
  type CountryEvaluationFormTemplate,
} from "../../shared/countryEvaluationForms";
import { agencyDossierDocuments, agencyDossiers, candidates, clientDocuments } from "../../drizzle/schema";
import { caseDocuments, clientNotifications, documentRequirements } from "../../drizzle/caseTrackingSchema";
import { sendEmail } from "../_core/email";
import type { getDb } from "../db";
import { storagePut } from "../storage";
import { generateCountryEvaluationFormPdf } from "./generateCountryEvaluationFormPdf";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");

export type DeliverCountryEvaluationFormInput = {
  destination: string;
  email: string;
  fullName: string;
  candidateId?: number | null;
  caseId?: number | null;
  agencyDossierId?: number | null;
  evaluationId?: number | null;
  /** Si false, n’envoie pas l’e-mail (coffre / notif seulement). */
  sendEmail?: boolean;
  /** Force l’e-mail même si un envoi a déjà été noté. */
  forceEmail?: boolean;
};

export type DeliverCountryEvaluationFormResult = {
  delivered: boolean;
  skippedReason?: string;
  countryLabel?: string;
  emailSent: boolean;
  vaultInserted: boolean;
  agencyInserted: boolean;
  notificationInserted: boolean;
  fileName?: string;
  documentUrl?: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character] ?? character));
}

async function loadFormPdfBytes(template: CountryEvaluationFormTemplate): Promise<Buffer> {
  if (template.kind === "static_fillable" && template.publicPath) {
    const relative = template.publicPath.replace(/^\//, "");
    const absolute = path.join(process.cwd(), "client/public", relative.replace(/^forms\//, "forms/"));
    // publicPath is /forms/... → client/public/forms/...
    const publicFile = path.join(process.cwd(), "client/public", relative);
    try {
      return await readFile(publicFile);
    } catch {
      // Fallback si le cwd n’est pas la racine du monorepo.
      try {
        return await readFile(path.join(process.cwd(), relative));
      } catch {
        console.warn("[deliverCountryEvaluationForm] PDF statique introuvable, génération de secours:", absolute);
        return generateCountryEvaluationFormPdf(template);
      }
    }
  }
  return generateCountryEvaluationFormPdf(template);
}

function buildInstructionEmailHtml(input: {
  fullName: string;
  template: CountryEvaluationFormTemplate;
  documentUrl?: string | null;
}): string {
  const safeName = escapeHtml(input.fullName.trim() || "Candidat");
  const safeCountry = escapeHtml(input.template.countryLabel);
  const safePurpose = escapeHtml(input.template.purpose);
  const steps = input.template.instructions
    .map((step, index) => `<li style="margin:0 0 10px;line-height:1.55;"><strong>Étape ${index + 1}.</strong> ${escapeHtml(step)}</li>`)
    .join("");
  const spaceUrl = `${SITE_URL}/mon-espace?section=documents`;
  const downloadBlock = input.documentUrl
    ? `<p style="text-align:center;margin:22px 0 8px;"><a href="${escapeHtml(input.documentUrl.startsWith("http") ? input.documentUrl : `${SITE_URL}${input.documentUrl}`)}" style="background:#1d4ed8;color:#fff;padding:12px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;">Télécharger le formulaire PDF</a></p>`
    : `<p style="background:#eff6ff;border-left:4px solid #2563eb;padding:12px 14px;border-radius:8px;font-size:14px;color:#1e3a8a;">Le formulaire est aussi joint à cet e-mail en pièce jointe PDF.</p>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
      <div style="background:linear-gradient(135deg,#0f2d5c 0%,#1d4ed8 100%);padding:28px 30px;color:#fff;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.85;">3M TRAVEL AGENCY</p>
        <h1 style="margin:0;font-size:22px;">Formulaire d’évaluation — ${safeCountry}</h1>
      </div>
      <div style="padding:28px 30px;background:#f8fafc;">
        <p>Bonjour <strong>${safeName}</strong>,</p>
        <p>${escapeHtml(input.template.emailIntro).replace(/\n/g, "<br/>")}</p>
        <div style="background:#fff;border:1px solid #dbeafe;border-radius:12px;padding:16px 18px;margin:18px 0;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:.04em;">À quoi sert ce PDF ?</p>
          <p style="margin:0;line-height:1.6;color:#334155;">${safePurpose}</p>
        </div>
        <p style="font-size:13px;font-weight:700;color:#0f172a;margin:20px 0 8px;">Instructions à suivre</p>
        <ol style="margin:0;padding-left:18px;color:#334155;">${steps}</ol>
        ${downloadBlock}
        <p style="text-align:center;margin:18px 0 6px;">
          <a href="${spaceUrl}" style="background:#0f766e;color:#fff;padding:12px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;">Ouvrir mon coffre documentaire</a>
        </p>
        <p style="font-size:12px;color:#64748b;margin-top:22px;">Besoin d’aide ? WhatsApp +237 698 104 832 · hello@3mtravelagency.com · Yaoundé &amp; Ottawa</p>
      </div>
    </div>
  `;
}

async function resolveAgencyDossierId(db: Db, email: string, explicit?: number | null): Promise<number | null> {
  if (explicit && explicit > 0) return explicit;
  const [row] = await db
    .select({ id: agencyDossiers.id })
    .from(agencyDossiers)
    .where(eq(agencyDossiers.email, email))
    .orderBy(desc(agencyDossiers.createdAt))
    .limit(1);
  return row?.id ?? null;
}

async function resolveCandidateId(db: Db, email: string, explicit?: number | null): Promise<number | null> {
  if (explicit && explicit > 0) return explicit;
  const [row] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, email)).limit(1);
  return row?.id ?? null;
}

export async function deliverCountryEvaluationForm(
  db: Db,
  input: DeliverCountryEvaluationFormInput,
): Promise<DeliverCountryEvaluationFormResult> {
  const template = resolveCountryEvaluationForm(input.destination);
  if (!template) {
    return {
      delivered: false,
      skippedReason: "destination_without_form",
      emailSent: false,
      vaultInserted: false,
      agencyInserted: false,
      notificationInserted: false,
    };
  }

  const email = input.email.trim().toLowerCase();
  if (!email) {
    return {
      delivered: false,
      skippedReason: "missing_email",
      emailSent: false,
      vaultInserted: false,
      agencyInserted: false,
      notificationInserted: false,
    };
  }

  const pdfBytes = await loadFormPdfBytes(template);
  let documentUrl = template.publicPath || null;
  let storageKey: string | null = null;

  // Publication stockage (coffre / liens signés) — best effort.
  try {
    const stored = await storagePut(
      `country-evaluation-forms/${template.countryKey}/${template.fileName}`,
      pdfBytes,
      "application/pdf",
    );
    storageKey = stored.key;
    documentUrl = stored.url;
  } catch (error) {
    console.warn("[deliverCountryEvaluationForm] storagePut indisponible, fallback public/generated:", error);
    if (!documentUrl && template.publicPath) documentUrl = template.publicPath;
  }

  const caseId = input.caseId && input.caseId > 0 ? input.caseId : null;
  const agencyDossierId = await resolveAgencyDossierId(db, email, input.agencyDossierId);
  const candidateId = await resolveCandidateId(db, email, input.candidateId);

  let vaultInserted = false;
  let agencyInserted = false;
  let notificationInserted = false;

  if (caseId) {
    const existing = await db
      .select({ id: caseDocuments.id })
      .from(caseDocuments)
      .where(and(eq(caseDocuments.caseId, caseId), eq(caseDocuments.documentType, COUNTRY_EVAL_FORM_DOCUMENT_TYPE)))
      .limit(1);
    if (!existing[0]) {
      await db.insert(caseDocuments).values({
        caseId,
        candidateId: candidateId ?? null,
        documentType: COUNTRY_EVAL_FORM_DOCUMENT_TYPE,
        fileName: template.fileName,
        fileKey: storageKey || template.publicPath || template.fileName,
        mimeType: "application/pdf",
        fileSizeBytes: pdfBytes.length,
        uploadedByRole: "agency",
        reviewStatus: "approved",
        reviewNote: template.purpose,
        versionNo: 1,
        reviewedAt: new Date(),
      });
      vaultInserted = true;
    }

    const reqExisting = await db
      .select({ id: documentRequirements.id })
      .from(documentRequirements)
      .where(and(eq(documentRequirements.caseId, caseId), eq(documentRequirements.documentType, COUNTRY_EVAL_FORM_DOCUMENT_TYPE)))
      .limit(1);
    if (!reqExisting[0]) {
      await db.insert(documentRequirements).values({
        caseId,
        documentType: COUNTRY_EVAL_FORM_DOCUMENT_TYPE,
        isRequired: true,
        status: "received",
        adminComment: "Formulaire 3M remis au candidat (espace + e-mail). À redéposer une fois rempli.",
      });
    }
  }

  if (agencyDossierId) {
    const existingAgency = await db
      .select({ id: agencyDossierDocuments.id })
      .from(agencyDossierDocuments)
      .where(and(
        eq(agencyDossierDocuments.dossierId, agencyDossierId),
        eq(agencyDossierDocuments.documentType, COUNTRY_EVAL_FORM_DOCUMENT_TYPE),
      ))
      .limit(1);
    if (!existingAgency[0]) {
      await db.insert(agencyDossierDocuments).values({
        dossierId: agencyDossierId,
        documentType: COUNTRY_EVAL_FORM_DOCUMENT_TYPE,
        documentName: template.fileName,
        documentUrl: documentUrl || template.publicPath || `/forms/${template.fileName}`,
        fileSize: pdfBytes.length,
        source: "admin_upload",
        uploadedBy: "system@3mtravelagency.com",
        verificationStatus: "verified",
        verificationComment: template.notificationBody,
      });
      agencyInserted = true;
    }
  }

  if (input.evaluationId && input.evaluationId > 0) {
    const existingEvalDoc = await db
      .select({ id: clientDocuments.id })
      .from(clientDocuments)
      .where(and(
        eq(clientDocuments.evaluationId, input.evaluationId),
        eq(clientDocuments.documentName, template.fileName),
      ))
      .limit(1);
    if (!existingEvalDoc[0]) {
      await db.insert(clientDocuments).values({
        evaluationId: input.evaluationId,
        candidateEmail: email,
        documentType: "other",
        documentName: template.fileName,
        documentUrl: documentUrl || template.publicPath || null,
        fileSize: pdfBytes.length,
        source: "manual_admin",
        uploadedByAdmin: "system@3mtravelagency.com",
        receivedByAdmin: true,
        status: "received",
        verificationStatus: "approved",
        verificationComment: template.purpose,
        verifiedByAdmin: "system@3mtravelagency.com",
        verifiedAt: new Date(),
      });
    }
  }

  let alreadyEmailed = false;
  if (candidateId) {
    const prior = await db
      .select({ id: clientNotifications.id, emailSentAt: clientNotifications.emailSentAt })
      .from(clientNotifications)
      .where(and(
        eq(clientNotifications.candidateId, candidateId),
        eq(clientNotifications.type, "country_evaluation_form"),
      ))
      .limit(1);
    alreadyEmailed = Boolean(prior[0]?.emailSentAt);
    if (!prior[0]) {
      await db.insert(clientNotifications).values({
        candidateId,
        caseId: caseId ?? null,
        type: "country_evaluation_form",
        title: template.notificationTitle,
        body: template.notificationBody,
        actionUrl: "/mon-espace?section=documents",
        isRead: false,
      });
      notificationInserted = true;
    }
  }

  // Un seul e-mail d’instructions réussi par candidat (réessaie si l’envoi précédent a échoué).
  const shouldEmail = input.sendEmail !== false && (input.forceEmail === true || !alreadyEmailed);
  let emailSent = false;
  if (shouldEmail) {
    try {
      const publicOrStored = documentUrl || template.publicPath || null;
      await sendEmail({
        to: email,
        subject: template.emailSubject,
        html: buildInstructionEmailHtml({
          fullName: input.fullName,
          template,
          documentUrl: publicOrStored,
        }),
        attachments: [{
          filename: template.fileName,
          content: pdfBytes,
          contentType: "application/pdf",
        }],
      });
      emailSent = true;
      if (candidateId) {
        await db.update(clientNotifications)
          .set({ emailSentAt: new Date() })
          .where(and(
            eq(clientNotifications.candidateId, candidateId),
            eq(clientNotifications.type, "country_evaluation_form"),
          ));
      }
    } catch (error) {
      console.error("[deliverCountryEvaluationForm] e-mail échoué:", error);
      emailSent = false;
    }
  }

  return {
    delivered: true,
    countryLabel: template.countryLabel,
    emailSent,
    vaultInserted,
    agencyInserted,
    notificationInserted,
    fileName: template.fileName,
    documentUrl: documentUrl || undefined,
  };
}
