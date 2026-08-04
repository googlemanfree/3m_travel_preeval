/**
 * Routeur tRPC — Notifications internes du tableau de bord admin
 *
 * Système par sondage (polling) : le client interroge régulièrement cette
 * route pour savoir s'il y a du nouveau (nouveaux dossiers, nouveaux
 * messages de contact...). Simple et fiable, sans infrastructure
 * supplémentaire (pas de WebSocket à maintenir).
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { adminNotifications } from "../../drizzle/schema";
import { eq, desc, or, isNull, and } from "drizzle-orm";
import { requireValidAdminSession } from "./adminAuth";
import { logger } from "../_core/logger";

/**
 * Créer une notification admin. Utilisé en interne par les autres routeurs
 * (évaluation, contact...) quand un événement notable survient.
 */
export async function notifyAdmins(input: {
  type: "new_evaluation" | "new_contact_message" | "new_document" | "payment_received";
  title: string;
  message: string;
  relatedId?: string;
  targetAdminType?: "evaluation" | "accompagnement" | "procedures";
}) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(adminNotifications).values({
      type: input.type,
      title: input.title,
      message: input.message,
      relatedId: input.relatedId,
      targetAdminType: input.targetAdminType,
      isRead: false,
    });
  } catch (err) {
    // Ne jamais faire échouer l'action principale (ex: soumission d'évaluation)
    // à cause d'un souci de notification.
    logger.error("admin_notifications.create_failed", { type: input.type }, err);
  }
}

export const adminNotificationsRouter = router({
  /**
   * Liste des notifications pour l'admin connecté (les siennes + celles
   * sans type ciblé), les plus récentes en premier.
   */
  list: publicProcedure
    .input(z.object({ sessionToken: z.string(), limit: z.number().min(1).max(100).default(30) }))
    .query(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) return { notifications: [], unreadCount: 0 };

      const rows = await db
        .select()
        .from(adminNotifications)
        .where(
          or(
            isNull(adminNotifications.targetAdminType),
            eq(adminNotifications.targetAdminType, admin.adminType)
          )
        )
        .orderBy(desc(adminNotifications.createdAt))
        .limit(input.limit);

      const unreadCount = rows.filter((n) => !n.isRead).length;

      return { notifications: rows, unreadCount };
    }),

  /**
   * Marquer une notification comme lue.
   */
  markAsRead: publicProcedure
    .input(z.object({ sessionToken: z.string(), notificationId: z.number() }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(adminNotifications)
        .set({ isRead: true })
        .where(eq(adminNotifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Marquer toutes les notifications visibles par cet admin comme lues.
   */
  markAllAsRead: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(adminNotifications)
        .set({ isRead: true })
        .where(
          or(
            isNull(adminNotifications.targetAdminType),
            eq(adminNotifications.targetAdminType, admin.adminType)
          )
        );

      return { success: true };
    }),
});
