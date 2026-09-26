import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { agencyDossierDocuments, agencyDossiers, applications, candidateFiles, candidates, paymentAuditLogs } from "../../drizzle/schema";
import { accountReference, agencyDossierReference } from "../../shared/caseReference";
import { clientStatusLabel } from "../../shared/dossierProgress";
import { DAY_MS, STALLED_AFTER_DAYS, documentsToReviewItem, rankPilotageItems, readyToActivateItem, stalledItem, summarizePilotage, type PilotageItem } from "./pilotageQueue";

type Db = NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>;

const LIMIT = 300;
const ACTIVE_ONLINE = ["paye", "en_attente_documents", "documents_recus", "soumis_agences", "en_cours_recrutement", "contrat_obtenu"] as const;
const ACTIVE_AGENCY = ["en_cours", "documents_requis", "recherche_employeur", "validation_adem", "soumis"] as const;

/** Comptes dont l'évaluation est validée et dont le paiement des frais est validé par un administrateur : même règle que l'activation. */
async function loadReadyToActivate(db: Db, now: Date): Promise<PilotageItem[]> {
  const pool = await db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email, destination: candidates.destination, reviewedAt: candidates.evaluationReviewedAt })
    .from(candidates)
    .where(and(isNull(candidates.deletedAt), eq(candidates.dossierStatus, "nouveau"), eq(candidates.evaluationDeclarationStatus, "validated"), isNotNull(candidates.evaluationReviewedAt)))
    .limit(LIMIT);
  if (pool.length === 0) return [];
  const ids = pool.map((row) => row.id);
  const emails = pool.map((row) => row.email.toLowerCase());
  const [apps, paidAgency] = await Promise.all([
    db.select({ candidateId: applications.candidateId, paymentStatus: applications.paymentStatus, validatedAt: applications.paymentValidatedAt, validatedBy: applications.paymentValidatedBy, createdAt: applications.createdAt })
      .from(applications).where(and(isNull(applications.deletedAt), inArray(applications.candidateId, ids))).orderBy(desc(applications.createdAt)).limit(LIMIT * 3),
    db.select({ id: agencyDossiers.id, email: agencyDossiers.email }).from(agencyDossiers)
      .where(and(isNull(agencyDossiers.deletedAt), eq(agencyDossiers.initialPaymentStatus, "paid"), sql`LOWER(${agencyDossiers.email}) IN (${sql.join(emails.map((email) => sql`${email}`), sql`, `)})`)).limit(LIMIT),
  ]);
  const confirmed = paidAgency.length
    ? await db.select({ paymentId: paymentAuditLogs.paymentId }).from(paymentAuditLogs).where(and(inArray(paymentAuditLogs.paymentId, paidAgency.map((row) => row.id)), eq(paymentAuditLogs.action, "confirmed"))).limit(LIMIT * 3)
    : [];
  const confirmedAgencyIds = new Set(confirmed.map((row) => row.paymentId));
  const agencyPaidEmails = new Set(paidAgency.filter((row) => confirmedAgencyIds.has(row.id)).map((row) => row.email.toLowerCase()));
  const latestApp = new Map<number, (typeof apps)[number]>();
  for (const app of apps) if (app.candidateId !== null && !latestApp.has(app.candidateId)) latestApp.set(app.candidateId, app);

  return pool.flatMap((row) => {
    const app = latestApp.get(row.id);
    const onlineValidated = app?.paymentStatus === "SUCCESS" && Boolean(app.validatedAt) && Boolean(app.validatedBy?.trim());
    if (!onlineValidated && !agencyPaidEmails.has(row.email.toLowerCase())) return [];
    const since = (onlineValidated ? app?.validatedAt : null) ?? row.reviewedAt;
    return [readyToActivateItem({ candidateId: row.id, reference: accountReference(row.id), fullName: row.fullName, destination: row.destination, since, now })];
  });
}

/** Pièces en attente de vérification, regroupées par candidat (pièces en ligne) ou par dossier agence. */
async function loadDocumentsToReview(db: Db, now: Date): Promise<PilotageItem[]> {
  const [online, agency] = await Promise.all([
    db.select({ candidateId: candidateFiles.candidateId, count: sql<number>`COUNT(*)`, oldest: sql<Date>`MIN(${candidateFiles.uploadedAt})` }).from(candidateFiles).where(eq(candidateFiles.status, "uploaded")).groupBy(candidateFiles.candidateId).limit(LIMIT),
    db.select({ dossierId: agencyDossierDocuments.dossierId, count: sql<number>`COUNT(*)`, oldest: sql<Date>`MIN(${agencyDossierDocuments.createdAt})` }).from(agencyDossierDocuments).where(eq(agencyDossierDocuments.verificationStatus, "pending")).groupBy(agencyDossierDocuments.dossierId).limit(LIMIT),
  ]);
  const candidateRows = online.length ? await db.select({ id: candidates.id, fullName: candidates.fullName }).from(candidates).where(and(isNull(candidates.deletedAt), inArray(candidates.id, online.map((row) => row.candidateId)))).limit(LIMIT) : [];
  const dossierRows = agency.length ? await db.select({ id: agencyDossiers.id, fullName: agencyDossiers.fullName }).from(agencyDossiers).where(and(isNull(agencyDossiers.deletedAt), inArray(agencyDossiers.id, agency.map((row) => row.dossierId)))).limit(LIMIT) : [];
  const candidateName = new Map(candidateRows.map((row) => [row.id, row.fullName]));
  const dossierName = new Map(dossierRows.map((row) => [row.id, row.fullName]));
  return [
    ...online.filter((row) => candidateName.has(row.candidateId)).map((row) => documentsToReviewItem({ key: `c${row.candidateId}`, openId: `account_${row.candidateId}`, reference: accountReference(row.candidateId), fullName: candidateName.get(row.candidateId)!, count: Number(row.count), oldest: row.oldest, now })),
    ...agency.filter((row) => dossierName.has(row.dossierId)).map((row) => documentsToReviewItem({ key: `a${row.dossierId}`, openId: `agency_${row.dossierId}`, reference: agencyDossierReference(row.dossierId), fullName: dossierName.get(row.dossierId)!, count: Number(row.count), oldest: row.oldest, now })),
  ];
}

/** Dossiers actifs dont le dernier changement de statut date de plus de STALLED_AFTER_DAYS jours. */
async function loadStalled(db: Db, now: Date): Promise<PilotageItem[]> {
  const cutoff = new Date(now.getTime() - STALLED_AFTER_DAYS * DAY_MS);
  const [online, agency] = await Promise.all([
    db.select({ id: applications.id, dossierNumber: applications.dossierNumber, fullName: applications.fullName, status: applications.dossierStatus, lastMovement: applications.lastStatusUpdateAt, createdAt: applications.createdAt })
      .from(applications).where(and(isNull(applications.deletedAt), inArray(applications.dossierStatus, [...ACTIVE_ONLINE]), lt(sql`COALESCE(${applications.lastStatusUpdateAt}, ${applications.createdAt})`, cutoff))).orderBy(asc(applications.lastStatusUpdateAt)).limit(LIMIT),
    db.select({ id: agencyDossiers.id, fullName: agencyDossiers.fullName, status: agencyDossiers.status, lastMovement: agencyDossiers.lastStatusChangeAt, createdAt: agencyDossiers.createdAt })
      .from(agencyDossiers).where(and(isNull(agencyDossiers.deletedAt), inArray(agencyDossiers.status, [...ACTIVE_AGENCY]), lt(sql`COALESCE(${agencyDossiers.lastStatusChangeAt}, ${agencyDossiers.createdAt})`, cutoff))).orderBy(asc(agencyDossiers.lastStatusChangeAt)).limit(LIMIT),
  ]);
  return [
    ...online.flatMap((row) => stalledItem({ key: `o${row.id}`, openId: `online_${row.id}`, reference: row.dossierNumber, fullName: row.fullName, statusLabel: clientStatusLabel(row.status), lastMovement: row.lastMovement ?? row.createdAt, now }) ?? []),
    ...agency.flatMap((row) => stalledItem({ key: `a${row.id}`, openId: `agency_${row.id}`, reference: agencyDossierReference(row.id), fullName: row.fullName, statusLabel: clientStatusLabel(row.status), lastMovement: row.lastMovement ?? row.createdAt, now }) ?? []),
  ];
}

export async function loadPilotageQueue(db: Db, now = new Date()) {
  const [ready, documents, stalled] = await Promise.all([loadReadyToActivate(db, now), loadDocumentsToReview(db, now), loadStalled(db, now)]);
  const items = rankPilotageItems([...ready, ...documents, ...stalled]);
  return { items, summary: summarizePilotage(items), generatedAt: now.toISOString() };
}
