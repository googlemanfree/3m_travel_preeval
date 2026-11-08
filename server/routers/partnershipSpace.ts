import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { partnershipPayouts, partnershipSpaceLinks } from "../../drizzle/schema";
import { PARTNERSHIP_KIND_LABELS, PARTNERSHIP_STATUS_LABELS, formatCommissionRate, partnershipReference } from "../../shared/partnershipProgram";
import { STATEMENT_REASON_LABELS, periodOf, statementToCsv } from "../../shared/partnershipStatement";
import { publicProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { storageGetSignedUrl } from "../storage";
import { issueSpaceLink, resolveSpaceLink, SPACE_LINK_VALIDITY_DAYS } from "../services/partnershipSpaceLink";
import { loadPartnerStatement } from "../services/partnershipStatementData";
import { adminActor, assertSigningRate, emailShell, esc, guarded, loadApplication, logEvent, requireDb, trySend } from "./partnership";
import { requireValidAdminSession } from "./adminAuth";

const SITE_URL = (process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/$/, "");
const PAYOUT_METHODS = { bank_transfer: "Virement bancaire", mobile_money: "Mobile Money", cash: "Espèces", other: "Autre" } as const;

const monthLabel = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
};
const xaf = (value: number) => `${Math.trunc(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XAF`;

export const partnershipSpaceRouter = router({
  // ───────────────────────────── Espace du partenaire (lien privé) ─────────────────────────────

  /** Tableau de bord du partenaire. Aucune identité de client : seulement des références de dossiers. */
  spaceGet: publicProcedure.input(z.object({ token: z.string().min(20).max(200) })).query(({ ctx, input }) => guarded("space_get", async () => {
    assertSigningRate(ctx);
    const db = await requireDb();
    const resolved = await resolveSpaceLink(db, input.token);
    if ("error" in resolved) {
      const message = resolved.error === "expired" ? "Ce lien a expiré. Demandez-en un nouveau à 3M TRAVEL AGENCY." : "Ce lien n’est pas valable. Demandez-en un nouveau à 3M TRAVEL AGENCY.";
      throw new TRPCError({ code: "NOT_FOUND", message });
    }
    const row = await loadApplication(db, resolved.applicationId);
    if (!["active", "suspended"].includes(row.status)) throw new TRPCError({ code: "NOT_FOUND", message: "Cet espace n’est pas disponible." });
    await db.update(partnershipSpaceLinks).set({ lastUsedAt: new Date() }).where(eq(partnershipSpaceLinks.id, resolved.linkId));
    const statement = await loadPartnerStatement(db, row);
    return {
      reference: partnershipReference(row.id, row.createdAt),
      kind: row.kind,
      kindLabel: PARTNERSHIP_KIND_LABELS[row.kind].fr,
      partnerName: row.kind === "travel_agency" ? (row.companyName || row.contactName) : row.contactName,
      status: row.status,
      statusLabel: PARTNERSHIP_STATUS_LABELS[row.status].fr,
      referralCode: row.referralCode,
      referralLink: row.referralCode ? `${SITE_URL}/?ref=${encodeURIComponent(row.referralCode)}` : null,
      terms: {
        commissionRate: row.commissionRateBps ? formatCommissionRate(row.commissionRateBps) : null,
        termMonths: row.termMonths,
        attributionMonths: row.attributionMonths,
        paymentDelayDays: row.paymentDelayDays,
        territory: row.territory,
      },
      activeSince: row.countersignedAt,
      termEndsAt: statement?.termEndsAt ?? null,
      hasProtocolPdf: Boolean(row.finalPdfKey),
      totals: statement?.totals ?? null,
      months: statement?.months ?? [],
      lines: (statement?.lines ?? []).map((line) => ({
        reference: line.reference,
        openedAt: line.openedAt,
        paidAt: line.paidAt,
        amountXaf: line.amountXaf,
        commissionXaf: line.commissionXaf,
        eligible: line.eligible,
        statusLabel: line.eligible ? "Commissionnable" : STATEMENT_REASON_LABELS[line.reason ?? "not_paid"],
      })),
    };
  }, "0099")),

  /** Lien temporaire de téléchargement de l'exemplaire signé par les deux parties. */
  spaceProtocolPdfUrl: publicProcedure.input(z.object({ token: z.string().min(20).max(200) })).query(({ ctx, input }) => guarded("space_pdf", async () => {
    assertSigningRate(ctx);
    const db = await requireDb();
    const resolved = await resolveSpaceLink(db, input.token);
    if ("error" in resolved) throw new TRPCError({ code: "NOT_FOUND", message: "Ce lien n’est pas valable." });
    const row = await loadApplication(db, resolved.applicationId);
    if (!row.finalPdfKey || !["active", "suspended"].includes(row.status)) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun exemplaire signé n’est disponible." });
    return { url: await storageGetSignedUrl(row.finalPdfKey) };
  }, "0099")),

  // ───────────────────────────── Administration ─────────────────────────────

  /** Relevé complet d'un partenaire : lignes, mois, totaux, versements. */
  adminStatement: publicProcedure.input(z.object({ sessionToken: z.string().min(32), id: z.number().int().positive() })).query(({ input }) => guarded("admin_statement", async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = await loadApplication(db, input.id);
    const statement = await loadPartnerStatement(db, row);
    if (!statement) return { available: false as const, statement: null, csv: null };
    const label = `${row.kind === "travel_agency" ? row.companyName || row.contactName : row.contactName} (${partnershipReference(row.id, row.createdAt)})`;
    return { available: true as const, statement, csv: statementToCsv(statement, label), currentPeriod: periodOf(new Date()) };
  }, "0099")),

  /** Marque un mois comme versé : le montant versé est figé au montant calculé à cet instant. */
  adminMarkPayout: publicProcedure.input(z.object({
    sessionToken: z.string().min(32),
    id: z.number().int().positive(),
    period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    reference: z.string().trim().min(3).max(120),
    method: z.enum(["bank_transfer", "mobile_money", "cash", "other"]),
    note: z.string().trim().max(500).optional(),
  })).mutation(({ input }) => guarded("admin_mark_payout", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = await loadApplication(db, input.id);
    if (!["active", "suspended"].includes(row.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucune commission n’est due tant que le protocole n’est pas contresigné." });
    const statement = await loadPartnerStatement(db, row);
    const month = statement?.months.find((item) => item.period === input.period);
    if (!month || month.commissionXaf <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucune commission à verser pour ce mois." });
    if (month.paid) throw new TRPCError({ code: "CONFLICT", message: "Ce mois a déjà été versé." });
    if (input.period >= periodOf(new Date())) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le mois n’est pas terminé : les paiements validés peuvent encore changer." });
    const paidAt = new Date();
    try {
      await db.insert(partnershipPayouts).values({
        applicationId: row.id,
        period: input.period,
        amountXaf: month.commissionXaf,
        paymentsCount: month.paymentsCount,
        reference: input.reference,
        method: PAYOUT_METHODS[input.method],
        note: input.note || null,
        paidAt,
        paidBy: adminActor(admin),
      });
    } catch (error) {
      if (/ER_DUP_ENTRY|Duplicate/i.test(error instanceof Error ? error.message : String(error))) throw new TRPCError({ code: "CONFLICT", message: "Ce mois a déjà été versé." });
      throw error;
    }
    await logEvent(db, row.id, "payout", `Commission de ${monthLabel(input.period)} versée : ${xaf(month.commissionXaf)} (${PAYOUT_METHODS[input.method]}, réf. ${input.reference}).`, adminActor(admin));
    const emailSent = await trySend("payout", row.id, {
      to: row.email,
      subject: `Versement de votre commission de ${monthLabel(input.period)} — ${partnershipReference(row.id, row.createdAt)}`,
      html: emailShell([
        `Bonjour ${esc(row.contactName)},`,
        `Nous avons versé votre commission de <strong>${esc(monthLabel(input.period))}</strong> : <strong>${esc(xaf(month.commissionXaf))}</strong> (${month.paymentsCount} paiement(s) validé(s)).`,
        `Mode de versement : ${esc(PAYOUT_METHODS[input.method])} — référence : ${esc(input.reference)}.`,
        "Le détail figure dans le relevé de votre espace partenaire. Si vous constatez un écart, écrivez-nous dans les 30 jours en rappelant votre référence.",
      ]),
    });
    logger.info("partnership.payout", { applicationId: row.id, period: input.period, amountXaf: month.commissionXaf });
    return { ok: true as const, amountXaf: month.commissionXaf, emailSent };
  }, "0099")),

  /** Nouveau lien d'espace partenaire (perdu ou compromis) : révoque l'ancien et l'envoie par e-mail. */
  adminSendSpaceLink: publicProcedure.input(z.object({ sessionToken: z.string().min(32), id: z.number().int().positive() })).mutation(({ input }) => guarded("admin_send_space_link", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = await loadApplication(db, input.id);
    if (!["active", "suspended"].includes(row.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’espace partenaire n’existe qu’après la contresignature du protocole." });
    const issued = await issueSpaceLink(db, row.id);
    await logEvent(db, row.id, "space_link", "Nouveau lien d’espace partenaire envoyé (les précédents sont révoqués).", adminActor(admin));
    const emailSent = await trySend("space_link", row.id, {
      to: row.email,
      subject: `Votre espace partenaire 3M — ${partnershipReference(row.id, row.createdAt)}`,
      html: emailShell([
        `Bonjour ${esc(row.contactName)},`,
        `Voici le lien de votre espace partenaire : votre code, vos conditions, le suivi des clients orientés et le relevé de vos commissions. Il est valable ${SPACE_LINK_VALIDITY_DAYS} jours ; les liens précédents ne fonctionnent plus.`,
        "Ne le transmettez à personne : il donne accès à votre relevé.",
      ], { label: "Ouvrir mon espace partenaire", url: issued.link }),
    });
    return { ok: true as const, emailSent, link: issued.link, expiresAt: issued.expiresAt };
  }, "0099")),
});
