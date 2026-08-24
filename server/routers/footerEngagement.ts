import { desc, sql } from "drizzle-orm";
import { z } from "zod";
import { footerEngagementEvents } from "../../drizzle/footerEngagementSchema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";

const engagementInput = z.object({
  surface: z.enum(["footer_shortcut", "footer_social"]),
  targetKey: z.string().trim().regex(/^[a-z0-9_]{2,80}$/),
  href: z.string().trim().min(1).max(512).refine((value) => value.startsWith("/") || value.startsWith("https://"), "Destination invalide."),
  language: z.enum(["fr", "en"]),
});

/**
 * Statistiques agrégées : pas de journal individuel, ni profil visiteur.
 * La lecture est réservée à une session administrateur valide.
 */
export const footerEngagementRouter = router({
  record: publicProcedure.input(engagementInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: true, persisted: false };
    await db.insert(footerEngagementEvents).values(input);
    return { success: true, persisted: true };
  }),

  getSummary: publicProcedure.input(z.object({ sessionToken: z.string().min(1), limit: z.number().int().min(1).max(30).default(12) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) return [];
    return db.select({
      surface: footerEngagementEvents.surface,
      targetKey: footerEngagementEvents.targetKey,
      href: footerEngagementEvents.href,
      language: footerEngagementEvents.language,
      clicks: sql<number>`count(*)`,
      lastClickedAt: sql<Date>`max(${footerEngagementEvents.createdAt})`,
    }).from(footerEngagementEvents)
      .groupBy(footerEngagementEvents.surface, footerEngagementEvents.targetKey, footerEngagementEvents.href, footerEngagementEvents.language)
      .orderBy(desc(sql`count(*)`))
      .limit(input.limit);
  }),
});
