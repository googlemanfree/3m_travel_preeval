import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { newsletterSubscribers } from "../../drizzle/newsletterSchema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const newsletterSubscribeInput = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  language: z.enum(["fr", "en"]).default("fr"),
  consentGiven: z.literal(true),
});

export const newsletterRouter = router({
  subscribe: publicProcedure.input(newsletterSubscribeInput).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: true, persisted: false, alreadySubscribed: false } as const;

    const existing = await db.select({
      id: newsletterSubscribers.id,
      unsubscribedAt: newsletterSubscribers.unsubscribedAt,
    }).from(newsletterSubscribers).where(eq(newsletterSubscribers.email, input.email)).limit(1);

    if (existing[0]?.unsubscribedAt) {
      await db.update(newsletterSubscribers)
        .set({ language: input.language, consentGiven: true, subscribedAt: new Date(), unsubscribedAt: null })
        .where(eq(newsletterSubscribers.id, existing[0].id));
      return { success: true, persisted: true, alreadySubscribed: false } as const;
    }

    if (existing[0]) return { success: true, persisted: true, alreadySubscribed: true } as const;

    await db.insert(newsletterSubscribers).values({
      email: input.email,
      language: input.language,
      consentGiven: true,
    });
    return { success: true, persisted: true, alreadySubscribed: false } as const;
  }),

  /** Contrat interne minimal pour tests/admin futurs : aucun e-mail ni profilage n’est exposé. */
  hasActiveSubscription: publicProcedure.input(z.object({ email: z.string().trim().toLowerCase().email().max(320) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { subscribed: false } as const;
    const rows = await db.select({ id: newsletterSubscribers.id }).from(newsletterSubscribers)
      .where(and(eq(newsletterSubscribers.email, input.email), isNull(newsletterSubscribers.unsubscribedAt))).limit(1);
    return { subscribed: rows.length > 0 } as const;
  }),
});
