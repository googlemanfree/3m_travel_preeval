import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { ambassadors, partnershipApplications, partnershipEvents, type PartnershipApplicationRow } from "../../drizzle/schema";
import { buildPartnershipProtocolText, PARTNERSHIP_PROTOCOL_VERSION } from "../../shared/partnershipProtocolContent";
import {
  PARTNERSHIP_CHANNELS,
  PARTNERSHIP_FIELD_LIMITS,
  PARTNERSHIP_KINDS,
  PARTNERSHIP_ROUTES,
  PARTNERSHIP_SIGNING_VALIDITY_DAYS,
  PARTNERSHIP_STATUSES,
  PARTNERSHIP_STATUS_LABELS,
  PARTNERSHIP_TERMS_LIMITS,
  PARTNERSHIP_VOLUME_BANDS,
  normalizeWebsite,
  partnershipReference,
  partnershipSigningState,
  partnershipTermsProblem,
  formatCommissionRate,
  type PartnershipStatus,
} from "../../shared/partnershipProgram";
import { sendEmail } from "../_core/email";
import { logger } from "../_core/logger";
import { clientKeyOf, createFixedWindowLimiter, createSubmissionGuard } from "../_core/publicRateLimit";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { storageGetSignedUrl, storagePut } from "../storage";
import {
  buildPartnershipProtocolPreview,
  createPartnershipProtocolPdf,
  partnershipVariablesFromRow,
  protocolFingerprint,
} from "../services/partnershipProtocol";
import { requireValidAdminSession } from "./adminAuth";
import { notifyAdmins } from "./adminNotifications";
import { hashToken } from "./placementPortal";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const SITE_URL = (process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/$/, "");
const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const OPEN_STATUSES: PartnershipStatus[] = ["submitted", "in_review", "protocol_issued", "partner_signed", "active"];
const SIGNATURE_PNG_MAX_BYTES = 400_000;

/** Une migration non appliquée ne doit jamais casser le reste du site : message clair, pas d'erreur technique. */
async function guarded<T>(label: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le programme de partenariat n’est pas encore activé : la migration 0098 doit être appliquée." });
    }
    logger.error(`partnership.${label}`, {}, error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
  return db;
}

async function logEvent(db: Db, applicationId: number, kind: string, summary: string, actor?: string | null) {
  try {
    await db.insert(partnershipEvents).values({ applicationId, kind, summary: summary.slice(0, 500), actor: actor ? actor.slice(0, 320) : null });
  } catch (error) {
    logger.error("partnership.event_failed", { applicationId, kind }, error);
  }
}

async function loadApplication(db: Db, id: number): Promise<PartnershipApplicationRow> {
  const [row] = await db.select().from(partnershipApplications).where(eq(partnershipApplications.id, id)).limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier de partenariat introuvable." });
  return row;
}

const adminActor = (admin: { email?: string | null } | undefined | null) => (admin?.email || "Administrateur").slice(0, 320);

const submissionGuard = createSubmissionGuard({
  perClient: { limit: 5, windowMs: 60 * 60_000 },
  perEmail: { limit: 3, windowMs: 60 * 60_000 },
  global: { limit: 120, windowMs: 60 * 60_000 },
});
/** Lecture et signature par lien personnel : un lien deviné ou rejoué en rafale est freiné. */
const signingLimiter = createFixedWindowLimiter({ limit: 30, windowMs: 10 * 60_000 });

function assertSigningRate(ctx: { req?: unknown }) {
  const key = clientKeyOf(ctx?.req as never);
  if (key === null) return;
  const decision = signingLimiter.check(key);
  if (!decision.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Trop de tentatives. Réessayez dans quelques minutes." });
}

const text = (max: number, min = 0) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => (value ? value : undefined));

const applyInput = z.object({
  kind: z.enum(PARTNERSHIP_KINDS),
  contactName: text(PARTNERSHIP_FIELD_LIMITS.name, 2),
  email: z.string().trim().toLowerCase().email().max(PARTNERSHIP_FIELD_LIMITS.email),
  phone: text(PARTNERSHIP_FIELD_LIMITS.phone, 6),
  country: text(PARTNERSHIP_FIELD_LIMITS.country, 2),
  city: optionalText(PARTNERSHIP_FIELD_LIMITS.city),
  companyName: optionalText(PARTNERSHIP_FIELD_LIMITS.company),
  representativeRole: optionalText(PARTNERSHIP_FIELD_LIMITS.role),
  legalRegistration: optionalText(PARTNERSHIP_FIELD_LIMITS.registration),
  taxId: optionalText(PARTNERSHIP_FIELD_LIMITS.taxId),
  licenceNumber: optionalText(PARTNERSHIP_FIELD_LIMITS.licence),
  website: optionalText(PARTNERSHIP_FIELD_LIMITS.website),
  yearsActive: z.number().int().min(0).max(80).optional(),
  channels: z.array(z.enum(PARTNERSHIP_CHANNELS)).max(PARTNERSHIP_CHANNELS.length).optional(),
  volumeBand: z.enum(PARTNERSHIP_VOLUME_BANDS).optional(),
  message: optionalText(PARTNERSHIP_FIELD_LIMITS.message),
  isAdult: z.boolean().optional(),
  consentPrivacy: z.boolean(),
  codeOfConduct: z.boolean(),
  /** Champ piège invisible : un robot le remplit, une personne jamais. */
  hp: z.string().max(200).optional(),
});

function applicationProblem(input: z.infer<typeof applyInput>): string | null {
  if (!input.consentPrivacy) return "Le consentement au traitement de vos informations est requis pour envoyer la candidature.";
  if (!input.codeOfConduct) return "Vous devez accepter la charte de communication du partenaire.";
  if (input.kind === "travel_agency") {
    if (!input.companyName || input.companyName.length < 2) return "Le nom de l’agence est obligatoire.";
    if (!input.legalRegistration || input.legalRegistration.length < 3) return "Le numéro d’immatriculation de l’agence est obligatoire.";
  } else if (!input.isAdult) {
    return "Le partenariat est réservé aux personnes majeures.";
  }
  return null;
}

const termsInput = z.object({
  commissionRateBps: z.number().int(),
  termMonths: z.number().int(),
  attributionMonths: z.number().int(),
  paymentDelayDays: z.number().int(),
  territory: z.string().trim().max(200),
});

function emailShell(paragraphs: string[], cta?: { label: string; url: string }) {
  const body = paragraphs.map((paragraph) => `<p style="margin:0 0 12px;font:14px/1.6 Arial,Helvetica,sans-serif;color:#1f2937">${paragraph}</p>`).join("");
  const button = cta
    ? `<p style="margin:18px 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#17375e;color:#ffffff;text-decoration:none;font:bold 14px Arial,Helvetica,sans-serif;padding:12px 22px;border-radius:8px">${esc(cta.label)}</a></p><p style="margin:0 0 12px;font:12px/1.5 Arial,Helvetica,sans-serif;color:#64748b">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${esc(cta.url)}</p>`
    : "";
  return `${body}${button}`;
}

async function trySend(label: string, applicationId: number, mail: { to: string; subject: string; html: string; attachments?: Array<{ filename: string; content: Buffer; contentType?: string }> }) {
  try {
    await sendEmail(mail);
    return true;
  } catch (error) {
    logger.error(`partnership.${label}_mail_failed`, { applicationId }, error);
    return false;
  }
}

const signingLink = (token: string) => `${SITE_URL}${PARTNERSHIP_ROUTES.sign}?token=${encodeURIComponent(token)}`;

function publicSummary(row: PartnershipApplicationRow) {
  return {
    reference: partnershipReference(row.id, row.createdAt),
    kind: row.kind,
    partnerName: row.kind === "travel_agency" ? (row.companyName || row.contactName) : row.contactName,
    representativeName: row.contactName,
    email: row.email,
    country: row.country,
    commissionRate: row.commissionRateBps ? formatCommissionRate(row.commissionRateBps) : null,
    termMonths: row.termMonths,
    territory: row.territory,
  };
}

/** Code de parrainage unique (même alphabet que le programme ambassadeur : sans caractères ambigus). */
async function uniqueReferralCode(db: Db): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let code = "";
    const bytes = randomBytes(6);
    for (let i = 0; i < 6; i += 1) code += alphabet[bytes[i] % alphabet.length];
    const [clash] = await db.select({ id: ambassadors.id }).from(ambassadors).where(eq(ambassadors.referralCode, code)).limit(1);
    if (!clash) return code;
  }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de générer un code de parrainage unique. Réessayez." });
}

/** Active le suivi des parrainages du partenaire : crée (ou met à jour) son compte, au taux convenu dans le protocole. */
async function activateReferral(db: Db, row: PartnershipApplicationRow): Promise<{ ambassadorId: number; referralCode: string }> {
  const rate = row.commissionRateBps ?? PARTNERSHIP_TERMS_LIMITS.commissionBps.proposed;
  const displayName = (row.kind === "travel_agency" ? `${row.companyName || row.contactName} (${row.contactName})` : row.contactName).slice(0, 255);
  const [existing] = await db.select().from(ambassadors).where(eq(ambassadors.email, row.email)).limit(1);
  if (existing) {
    await db.update(ambassadors).set({ commissionRateBps: rate, status: "active", fullName: displayName, phone: row.phone ?? existing.phone, country: row.country }).where(eq(ambassadors.id, existing.id));
    return { ambassadorId: existing.id, referralCode: existing.referralCode };
  }
  const referralCode = await uniqueReferralCode(db);
  await db.insert(ambassadors).values({ fullName: displayName, email: row.email, phone: row.phone, country: row.country, referralCode, commissionRateBps: rate, status: "active" });
  const [created] = await db.select({ id: ambassadors.id }).from(ambassadors).where(eq(ambassadors.referralCode, referralCode)).limit(1);
  if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le suivi de parrainage n’a pas pu être créé." });
  return { ambassadorId: created.id, referralCode };
}

function dataUrlToPng(dataUrl: string | undefined): Buffer | null {
  if (!dataUrl) return null;
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!match) return null;
  const bytes = Buffer.from(match[1], "base64");
  const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return isPng && bytes.length <= SIGNATURE_PNG_MAX_BYTES ? bytes : null;
}

export const partnershipRouter = router({
  /** Modèle de protocole (aperçu public) : mêmes articles que le protocole signé, parties entre crochets. */
  previewProtocol: publicProcedure.input(z.object({ kind: z.enum(PARTNERSHIP_KINDS) })).query(({ input }) => ({
    kind: input.kind,
    version: PARTNERSHIP_PROTOCOL_VERSION,
    text: buildPartnershipProtocolPreview(input.kind),
  })),

  /** Candidature publique. Ne crée aucun droit : un partenaire n'existe qu'après signature et contresignature. */
  submit: publicProcedure.input(applyInput).mutation(({ ctx, input }) => guarded("submit", async () => {
    submissionGuard.assertAllowed(ctx?.req as never, input.email);
    // Un robot a rempli le champ piège : on répond comme si tout allait bien, sans rien enregistrer.
    if (input.hp && input.hp.trim()) return { received: true as const, reference: "PAR-0000-0000", alreadyReceived: false };
    const problem = applicationProblem(input);
    if (problem) throw new TRPCError({ code: "BAD_REQUEST", message: problem });

    const db = await requireDb();
    const open = await db.select().from(partnershipApplications).where(eq(partnershipApplications.email, input.email)).limit(10);
    const current = open.find((row) => OPEN_STATUSES.includes(row.status));
    if (current) return { received: true as const, reference: partnershipReference(current.id, current.createdAt), alreadyReceived: true };

    const now = new Date();
    const inserted = await db.insert(partnershipApplications).values({
      kind: input.kind,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      country: input.country,
      city: input.city,
      companyName: input.kind === "travel_agency" ? input.companyName : undefined,
      representativeRole: input.kind === "travel_agency" ? input.representativeRole : undefined,
      legalRegistration: input.kind === "travel_agency" ? input.legalRegistration : undefined,
      taxId: input.kind === "travel_agency" ? input.taxId : undefined,
      licenceNumber: input.kind === "travel_agency" ? input.licenceNumber : undefined,
      website: normalizeWebsite(input.website) || undefined,
      yearsActive: input.kind === "travel_agency" ? input.yearsActive : undefined,
      channels: input.channels?.length ? input.channels.join(",") : undefined,
      volumeBand: input.volumeBand,
      message: input.message,
      consentPrivacyAt: now,
      codeOfConductAt: now,
      sourceIp: clientKeyOf(ctx?.req as never)?.slice(0, 64),
    });
    const id = Number((inserted as unknown as Array<{ insertId?: number }>)[0]?.insertId || 0);
    const row = await loadApplication(db, id);
    const reference = partnershipReference(row.id, row.createdAt);
    await logEvent(db, row.id, "submitted", `Candidature reçue (${input.kind === "travel_agency" ? "agence de voyage" : "particulier"}).`, input.email);

    await notifyAdmins({
      type: "new_contact_message",
      title: "Nouvelle candidature de partenariat",
      message: `${reference} — ${input.kind === "travel_agency" ? input.companyName : input.contactName} (${input.country})`,
      relatedId: `partenariat-${row.id}`,
      targetAdminType: "accompagnement",
    });
    await trySend("ack", row.id, {
      to: input.email,
      subject: `Votre candidature de partenariat — ${reference}`,
      html: emailShell([
        `Bonjour ${esc(input.contactName)},`,
        `Nous avons bien reçu votre candidature de partenariat (référence <strong>${esc(reference)}</strong>).`,
        "Notre équipe vérifie les informations transmises, puis vous répond par e-mail. Si votre candidature est retenue, nous vous enverrons le protocole d’accord à lire et à signer en ligne ; les conditions (commission, durée) y seront indiquées avant toute signature.",
        "Une candidature ne vaut ni accord ni autorisation de se présenter comme partenaire de 3M.",
      ]),
    });
    return { received: true as const, reference, alreadyReceived: false };
  })),

  /** Lecture du protocole par le lien personnel du partenaire. */
  getForSigning: publicProcedure.input(z.object({ token: z.string().min(20).max(200) })).query(({ ctx, input }) => guarded("get_for_signing", async () => {
    assertSigningRate(ctx);
    const db = await requireDb();
    const [row] = await db.select().from(partnershipApplications).where(eq(partnershipApplications.signTokenHash, hashToken(input.token))).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Ce lien n’est pas valide. Demandez-en un nouveau à 3M." });
    const state = partnershipSigningState(row);
    return {
      state,
      summary: publicSummary(row),
      protocolText: state === "ready" || state === "signed" ? row.protocolText : null,
      signedAt: row.partnerSignedAt,
      expiresAt: row.signTokenExpiresAt,
    };
  })),

  /** Signature électronique du partenaire : nom saisi, déclarations cochées, signature manuscrite facultative. */
  sign: publicProcedure.input(z.object({
    token: z.string().min(20).max(200),
    signatureName: text(PARTNERSHIP_FIELD_LIMITS.name, 3),
    declarations: z.array(z.boolean()).length(3),
    signaturePng: z.string().max(600_000).optional(),
  })).mutation(({ ctx, input }) => guarded("sign", async () => {
    assertSigningRate(ctx);
    if (!input.declarations.every(Boolean)) throw new TRPCError({ code: "BAD_REQUEST", message: "Cochez les trois déclarations pour signer." });
    const db = await requireDb();
    const [row] = await db.select().from(partnershipApplications).where(eq(partnershipApplications.signTokenHash, hashToken(input.token))).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Ce lien n’est pas valide. Demandez-en un nouveau à 3M." });
    const state = partnershipSigningState(row);
    if (state === "signed") throw new TRPCError({ code: "CONFLICT", message: "Ce protocole a déjà été signé." });
    if (state === "expired") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ce lien a expiré. Demandez-en un nouveau à 3M." });
    if (state !== "ready" || !row.protocolText || !row.protocolFingerprint) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ce protocole n’est plus disponible à la signature." });
    // Garde-fou d'intégrité : le texte lu est celui dont l'empreinte a été enregistrée à l'émission.
    if (protocolFingerprint(row.protocolText) !== row.protocolFingerprint) {
      logger.error("partnership.fingerprint_mismatch", { applicationId: row.id });
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le texte du protocole ne peut pas être vérifié. 3M a été prévenue." });
    }

    const signedAt = new Date();
    const ip = clientKeyOf(ctx?.req as never)?.slice(0, 64) ?? null;
    const png = dataUrlToPng(input.signaturePng);
    const reference = partnershipReference(row.id, row.createdAt);
    const partnerName = row.kind === "travel_agency" ? (row.companyName || row.contactName) : row.contactName;
    const pdf = await createPartnershipProtocolPdf({
      kind: row.kind,
      reference,
      partnerName,
      protocolText: row.protocolText,
      fingerprint: row.protocolFingerprint,
      partnerSignature: { name: input.signatureName, signedAt, ipAddress: ip, pngBytes: png },
    });
    const folder = `partnership/${row.id}`;
    const storedPdf = await storagePut(`${folder}/protocole-signe-partenaire.pdf`, pdf, "application/pdf");
    const storedPng = png ? await storagePut(`${folder}/signature-partenaire.png`, png, "image/png") : null;

    // Écriture conditionnelle : si deux signatures arrivent en même temps, une seule est enregistrée.
    const updated = await db.update(partnershipApplications).set({
      status: "partner_signed",
      partnerSignedAt: signedAt,
      partnerSignatureName: input.signatureName,
      partnerSignatureIp: ip,
      partnerSignatureKey: storedPng?.key ?? null,
      partnerSignedPdfKey: storedPdf.key,
    }).where(and(eq(partnershipApplications.id, row.id), eq(partnershipApplications.status, "protocol_issued")));
    const affected = Number((updated as unknown as Array<{ affectedRows?: number }>)[0]?.affectedRows ?? 1);
    if (affected === 0) throw new TRPCError({ code: "CONFLICT", message: "Ce protocole vient d’être signé." });
    await logEvent(db, row.id, "partner_signed", `Protocole signé par ${input.signatureName}${ip ? ` (IP ${ip})` : ""}. Empreinte ${row.protocolFingerprint.slice(0, 12)}…`, row.email);

    await notifyAdmins({
      type: "new_contact_message",
      title: "Protocole de partenariat signé : à contresigner",
      message: `${reference} — ${partnerName} a signé. Contresignature de 3M requise.`,
      relatedId: `partenariat-${row.id}`,
      targetAdminType: "accompagnement",
    });
    await trySend("signed", row.id, {
      to: row.email,
      subject: `Votre protocole de partenariat signé — ${reference}`,
      html: emailShell([
        `Bonjour ${esc(row.contactName)},`,
        `Nous avons bien enregistré votre signature sur le protocole d’accord de partenariat <strong>${esc(reference)}</strong>. Vous en trouverez l’exemplaire signé en pièce jointe.`,
        "Le protocole produit ses effets, et votre commission commence à courir, à la contresignature de 3M. Vous recevrez votre code et votre lien personnels dès cette étape.",
      ]),
      attachments: [{ filename: `protocole-partenariat-${reference}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    return { signed: true as const, reference };
  })),

  // ───────────────────────────── Administration ─────────────────────────────

  adminList: publicProcedure.input(z.object({
    sessionToken: z.string().min(32),
    status: z.enum(PARTNERSHIP_STATUSES).optional(),
  })).query(({ input }) => guarded("admin_list", async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(partnershipApplications)
      .where(input.status ? eq(partnershipApplications.status, input.status) : undefined)
      .orderBy(desc(partnershipApplications.createdAt)).limit(500);
    return rows.map((row) => ({
      id: row.id,
      reference: partnershipReference(row.id, row.createdAt),
      kind: row.kind,
      status: row.status,
      statusLabel: PARTNERSHIP_STATUS_LABELS[row.status].fr,
      partnerName: row.kind === "travel_agency" ? (row.companyName || row.contactName) : row.contactName,
      contactName: row.contactName,
      email: row.email,
      phone: row.phone,
      country: row.country,
      commissionRate: row.commissionRateBps ? formatCommissionRate(row.commissionRateBps) : null,
      referralCode: row.referralCode,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  })),

  adminGet: publicProcedure.input(z.object({ sessionToken: z.string().min(32), id: z.number().int().positive() })).query(({ input }) => guarded("admin_get", async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = await loadApplication(db, input.id);
    const events = await db.select().from(partnershipEvents).where(eq(partnershipEvents.applicationId, row.id)).orderBy(desc(partnershipEvents.createdAt)).limit(100);
    const { protocolText, signTokenHash, ...rest } = row;
    return {
      ...rest,
      reference: partnershipReference(row.id, row.createdAt),
      hasProtocol: Boolean(protocolText),
      protocolText,
      signingLinkActive: Boolean(signTokenHash) && partnershipSigningState(row) === "ready",
      events,
      termsLimits: PARTNERSHIP_TERMS_LIMITS,
    };
  })),

  adminSetStatus: publicProcedure.input(z.object({
    sessionToken: z.string().min(32),
    id: z.number().int().positive(),
    status: z.enum(["in_review", "rejected", "suspended"]),
    note: z.string().trim().max(PARTNERSHIP_FIELD_LIMITS.note).optional(),
  })).mutation(({ input }) => guarded("admin_set_status", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = await loadApplication(db, input.id);
    if (input.status === "in_review" && row.status !== "submitted") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seule une candidature reçue peut passer en vérification." });
    if (input.status === "rejected") {
      if (!["submitted", "in_review", "protocol_issued"].includes(row.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ce dossier ne peut plus être refusé : utilisez la suspension." });
      if (!input.note || input.note.length < 5) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez le motif du refus (il est conservé dans l’historique)." });
    }
    if (input.status === "suspended") {
      if (!["active", "partner_signed"].includes(row.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seul un partenaire signé ou actif peut être suspendu." });
      if (!input.note || input.note.length < 5) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez le motif de la suspension." });
    }
    await db.update(partnershipApplications).set({
      status: input.status,
      rejectionReason: input.status === "rejected" ? input.note : row.rejectionReason,
      signTokenHash: input.status === "rejected" ? null : row.signTokenHash,
      signTokenExpiresAt: input.status === "rejected" ? null : row.signTokenExpiresAt,
    }).where(eq(partnershipApplications.id, row.id));
    // Une suspension coupe aussi le suivi des parrainages : plus aucune commission ne court.
    if (input.status === "suspended" && row.ambassadorId) {
      await db.update(ambassadors).set({ status: "suspended" }).where(eq(ambassadors.id, row.ambassadorId));
    }
    await logEvent(db, row.id, input.status, `${PARTNERSHIP_STATUS_LABELS[input.status].fr}${input.note ? ` — ${input.note}` : ""}`, adminActor(admin));
    if (input.status === "rejected") {
      await trySend("rejected", row.id, {
        to: row.email,
        subject: `Votre candidature de partenariat — ${partnershipReference(row.id, row.createdAt)}`,
        html: emailShell([
          `Bonjour ${esc(row.contactName)},`,
          "Après examen, nous ne pouvons pas donner suite à votre candidature de partenariat pour le moment. Vous pouvez nous écrire pour en discuter ou présenter à nouveau votre candidature plus tard.",
        ]),
      });
    }
    return { ok: true as const };
  })),

  /** Émet (ou ré-émet) le protocole avec les conditions fixées pour ce partenaire, et envoie le lien de signature. */
  adminIssueProtocol: publicProcedure.input(z.object({
    sessionToken: z.string().min(32),
    id: z.number().int().positive(),
    terms: termsInput,
    note: z.string().trim().max(PARTNERSHIP_FIELD_LIMITS.note).optional(),
  })).mutation(({ input }) => guarded("admin_issue", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const problem = partnershipTermsProblem(input.terms);
    if (problem) throw new TRPCError({ code: "BAD_REQUEST", message: problem });
    const db = await requireDb();
    const row = await loadApplication(db, input.id);
    if (!["submitted", "in_review", "protocol_issued"].includes(row.status)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Un protocole ne peut être émis que pour une candidature en cours d’examen (ou ré-émis tant qu’il n’est pas signé)." });
    }
    const issuedAt = new Date();
    const withTerms = { ...row, commissionRateBps: input.terms.commissionRateBps, termMonths: input.terms.termMonths, attributionMonths: input.terms.attributionMonths, paymentDelayDays: input.terms.paymentDelayDays, territory: input.terms.territory.trim() };
    const protocolText = buildPartnershipProtocolText(partnershipVariablesFromRow(withTerms, issuedAt));
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(issuedAt.getTime() + PARTNERSHIP_SIGNING_VALIDITY_DAYS * 24 * 3600 * 1000);
    await db.update(partnershipApplications).set({
      status: "protocol_issued",
      commissionRateBps: withTerms.commissionRateBps,
      termMonths: withTerms.termMonths,
      attributionMonths: withTerms.attributionMonths,
      paymentDelayDays: withTerms.paymentDelayDays,
      territory: withTerms.territory,
      protocolVersion: PARTNERSHIP_PROTOCOL_VERSION,
      protocolText,
      protocolFingerprint: protocolFingerprint(protocolText),
      protocolIssuedAt: issuedAt,
      protocolIssuedBy: adminActor(admin),
      signTokenHash: hashToken(token),
      signTokenExpiresAt: expiresAt,
      adminNote: input.note ? input.note : row.adminNote,
    }).where(eq(partnershipApplications.id, row.id));
    await logEvent(db, row.id, "protocol_issued", `Protocole émis : commission ${formatCommissionRate(withTerms.commissionRateBps)}, ${withTerms.termMonths} mois, attribution ${withTerms.attributionMonths} mois, versement ${withTerms.paymentDelayDays} j. Territoire : ${withTerms.territory}.`, adminActor(admin));

    const link = signingLink(token);
    const reference = partnershipReference(row.id, row.createdAt);
    const emailSent = await trySend("issued", row.id, {
      to: row.email,
      subject: `Protocole d’accord de partenariat à signer — ${reference}`,
      html: emailShell([
        `Bonjour ${esc(row.contactName)},`,
        `Votre candidature de partenariat a été retenue. Le protocole d’accord (référence <strong>${esc(reference)}</strong>) est prêt : il précise vos conditions, notamment une commission de <strong>${esc(formatCommissionRate(withTerms.commissionRateBps))}</strong> des frais d’accompagnement effectivement encaissés auprès des clients que vous orientez.`,
        `Lisez-le attentivement, puis signez-le en ligne. Ce lien personnel est valable ${PARTNERSHIP_SIGNING_VALIDITY_DAYS} jours et ne permet de signer qu’une seule fois.`,
        "Le protocole produit ses effets à la contresignature de 3M.",
      ], { label: "Lire et signer le protocole", url: link }),
    });
    return { ok: true as const, emailSent, link, expiresAt };
  })),

  /** Contresignature de 3M : le partenaire devient actif, son suivi de parrainage est créé au taux convenu. */
  adminCountersign: publicProcedure.input(z.object({ sessionToken: z.string().min(32), id: z.number().int().positive() })).mutation(({ input }) => guarded("admin_countersign", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = await loadApplication(db, input.id);
    if (row.status !== "partner_signed" || !row.partnerSignedAt || !row.protocolText || !row.protocolFingerprint) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le partenaire doit d’abord avoir signé le protocole." });
    }
    const countersignedAt = new Date();
    const reference = partnershipReference(row.id, row.createdAt);
    const partnerName = row.kind === "travel_agency" ? (row.companyName || row.contactName) : row.contactName;
    const referral = await activateReferral(db, row);

    let png: Buffer | null = null;
    if (row.partnerSignatureKey) {
      try {
        const response = await fetch(await storageGetSignedUrl(row.partnerSignatureKey));
        if (response.ok) png = Buffer.from(await response.arrayBuffer());
      } catch (error) {
        logger.error("partnership.signature_png_unavailable", { applicationId: row.id }, error);
      }
    }
    const pdf = await createPartnershipProtocolPdf({
      kind: row.kind,
      reference,
      partnerName,
      protocolText: row.protocolText,
      fingerprint: row.protocolFingerprint,
      partnerSignature: { name: row.partnerSignatureName || row.contactName, signedAt: row.partnerSignedAt, ipAddress: row.partnerSignatureIp, pngBytes: png },
      countersignature: { name: adminActor(admin), signedAt: countersignedAt },
    });
    const stored = await storagePut(`partnership/${row.id}/protocole-signe-final.pdf`, pdf, "application/pdf");
    await db.update(partnershipApplications).set({
      status: "active",
      countersignedAt,
      countersignedBy: adminActor(admin),
      finalPdfKey: stored.key,
      ambassadorId: referral.ambassadorId,
      referralCode: referral.referralCode,
    }).where(eq(partnershipApplications.id, row.id));
    await logEvent(db, row.id, "active", `Contresigné par ${adminActor(admin)} ; suivi de parrainage activé (code ${referral.referralCode}, ${formatCommissionRate(row.commissionRateBps ?? 0)}).`, adminActor(admin));

    const referralLink = `${SITE_URL}/?ref=${encodeURIComponent(referral.referralCode)}`;
    const emailSent = await trySend("active", row.id, {
      to: row.email,
      subject: `Votre partenariat avec 3M est actif — ${reference}`,
      html: emailShell([
        `Bonjour ${esc(row.contactName)},`,
        `3M a contresigné votre protocole d’accord <strong>${esc(reference)}</strong> : votre partenariat est actif. L’exemplaire signé par les deux parties est joint à ce message.`,
        `Votre code partenaire : <strong>${esc(referral.referralCode)}</strong>. Votre lien personnel : ${esc(referralLink)}`,
        "Rappel : vous ne promettez aucun résultat, vous n’encaissez aucune somme au nom de 3M, et vous respectez la charte de communication annexée au protocole.",
      ]),
      attachments: [{ filename: `protocole-partenariat-${reference}-signe.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    return { ok: true as const, referralCode: referral.referralCode, emailSent };
  })),

  /** Lien temporaire de téléchargement de l'exemplaire signé (final si contresigné, sinon signé par le partenaire). */
  adminPdfUrl: publicProcedure.input(z.object({ sessionToken: z.string().min(32), id: z.number().int().positive() })).query(({ input }) => guarded("admin_pdf", async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = await loadApplication(db, input.id);
    const key = row.finalPdfKey || row.partnerSignedPdfKey;
    if (!key) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun exemplaire signé n’est disponible pour ce dossier." });
    return { url: await storageGetSignedUrl(key), final: Boolean(row.finalPdfKey) };
  })),

  /** Ré-émission d'un lien (perdu ou expiré) sans changer les conditions : régénère le jeton et renvoie le message. */
  adminResendLink: publicProcedure.input(z.object({ sessionToken: z.string().min(32), id: z.number().int().positive() })).mutation(({ input }) => guarded("admin_resend", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = await loadApplication(db, input.id);
    if (row.status !== "protocol_issued" || !row.protocolText) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucun protocole en attente de signature pour ce dossier." });
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + PARTNERSHIP_SIGNING_VALIDITY_DAYS * 24 * 3600 * 1000);
    await db.update(partnershipApplications).set({ signTokenHash: hashToken(token), signTokenExpiresAt: expiresAt }).where(eq(partnershipApplications.id, row.id));
    await logEvent(db, row.id, "link_resent", "Nouveau lien de signature envoyé.", adminActor(admin));
    const reference = partnershipReference(row.id, row.createdAt);
    const link = signingLink(token);
    const emailSent = await trySend("resend", row.id, {
      to: row.email,
      subject: `Protocole d’accord de partenariat à signer — ${reference}`,
      html: emailShell([`Bonjour ${esc(row.contactName)},`, `Voici un nouveau lien pour lire et signer votre protocole d’accord de partenariat (${esc(reference)}). Il est valable ${PARTNERSHIP_SIGNING_VALIDITY_DAYS} jours et ne permet de signer qu’une seule fois ; le précédent ne fonctionne plus.`], { label: "Lire et signer le protocole", url: link }),
    });
    return { ok: true as const, emailSent, link, expiresAt };
  })),

  adminNote: publicProcedure.input(z.object({ sessionToken: z.string().min(32), id: z.number().int().positive(), note: z.string().trim().max(PARTNERSHIP_FIELD_LIMITS.note) })).mutation(({ input }) => guarded("admin_note", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await loadApplication(db, input.id);
    await db.update(partnershipApplications).set({ adminNote: input.note || null }).where(eq(partnershipApplications.id, input.id));
    await logEvent(db, input.id, "note", input.note ? "Note interne mise à jour." : "Note interne effacée.", adminActor(admin));
    return { ok: true as const };
  })),

  /** Compteurs de la file de travail (candidatures à examiner, signatures à contresigner). */
  adminCounts: publicProcedure.input(z.object({ sessionToken: z.string().min(32) })).query(({ input }) => guarded("admin_counts", async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select({ status: partnershipApplications.status }).from(partnershipApplications).where(inArray(partnershipApplications.status, ["submitted", "in_review", "partner_signed", "protocol_issued"]));
    const count = (status: PartnershipStatus) => rows.filter((row) => row.status === status).length;
    return { toReview: count("submitted") + count("in_review"), toCountersign: count("partner_signed"), awaitingSignature: count("protocol_issued") };
  })),
});
