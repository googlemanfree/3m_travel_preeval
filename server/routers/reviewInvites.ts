import { and, eq, isNull, like } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { agencyDossiers, agencySettings, applications, customerReviews } from "../../drizzle/schema";
import { normalizeWhatsAppNumber } from "../../shared/flightDeskAlert";
import { REVIEW_INVITED_KEY_PREFIX, pickClientsToInvite, reviewInvitedKey, reviewServiceFor, type InviteCandidate } from "../../shared/reviewInviteTargets";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";

export const reviewInvitesRouter = router({
  /**
   * Clients dont le visa est accordé et qu'on n'a pas encore invités à donner leur avis (ni déjà déposé d'avis).
   * Lecture seule : l'équipe envoie l'invitation elle-même (WhatsApp) ; rien ne part automatiquement.
   */
  listToInvite: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const online = await db.select().from(applications).where(and(eq(applications.dossierStatus, "visa_approuve"), isNull(applications.deletedAt))).limit(500);
    const agency = await db.select().from(agencyDossiers).where(and(eq(agencyDossiers.status, "approuve"), isNull(agencyDossiers.deletedAt))).limit(500);
    const invited = await db.select({ settingKey: agencySettings.settingKey }).from(agencySettings).where(like(agencySettings.settingKey, `${REVIEW_INVITED_KEY_PREFIX}%`)).limit(5000);
    const reviewers = await db.select({ email: customerReviews.email }).from(customerReviews).limit(5000);

    const candidates: InviteCandidate[] = [
      ...online.map((row) => ({ key: `online_${row.id}`, email: row.email, fullName: row.fullName, phone: row.whatsappNumber ?? "", destination: row.destination ?? "", visaType: row.visaType ?? "", approvedAt: row.lastStatusUpdateAt ?? row.updatedAt ?? null })),
      ...agency.map((row) => ({ key: `agency_${row.id}`, email: row.email, fullName: row.fullName, phone: row.phone ?? "", destination: row.destination ?? "", visaType: row.visaType ?? "", approvedAt: row.lastStatusChangeAt ?? row.updatedAt ?? null })),
    ];
    const picked = pickClientsToInvite(candidates, new Set(invited.map((row) => row.settingKey)), new Set(reviewers.map((row) => row.email.trim().toLowerCase())));
    return {
      count: picked.length,
      items: picked.slice(0, 100).map((item) => ({ key: item.key, fullName: item.fullName, firstName: item.fullName.trim().split(/\s+/)[0] ?? "", phone: normalizeWhatsAppNumber(item.phone) ?? item.phone, destination: item.destination, service: reviewServiceFor(item.visaType), approvedAt: item.approvedAt ? item.approvedAt.toISOString() : null })),
    };
  }),

  /** Note qu'un client a été invité (une seule fois) : il disparaît de la liste. */
  markInvited: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512), key: z.string().regex(/^(online|agency)_\d+$/) })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const key = reviewInvitedKey(input.key);
    const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
    if (!existing) await db.insert(agencySettings).values({ settingKey: key, settingValue: `${new Date().toISOString()} · ${admin.email || "administrateur"}` });
    return { success: true };
  }),
});
