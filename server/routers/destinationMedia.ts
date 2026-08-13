import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { destinationMedia } from "../../drizzle/schema";
import { getDb } from "../db";
import { requireAdminSessionFromCookie } from "./adminAuth";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const destinationIdSchema = z.string().trim().min(1).max(160).regex(/^[a-z0-9][a-z0-9-]*$/);

function parseImageData(dataUrl: string, declaredMimeType: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  const mimeType = match?.[1] ?? declaredMimeType;
  const base64 = match?.[2] ?? dataUrl;

  if (!ALLOWED_MIME_TYPES.has(mimeType) || !/^[A-Za-z0-9+/=]+$/.test(base64)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Format d’image non autorisé. Utilisez JPG, PNG ou WebP." });
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "L’image doit peser au maximum 5 Mo." });
  }

  return { buffer, mimeType };
}

function extensionForMimeType(mimeType: string) {
  return mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
}

export const destinationMediaRouter = router({
  listPublic: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
    return db.select({
      destinationId: destinationMedia.destinationId,
      imageUrl: destinationMedia.imageUrl,
      flagUrl: destinationMedia.flagUrl,
      imageAlt: destinationMedia.imageAlt,
      flagAlt: destinationMedia.flagAlt,
      updatedAt: destinationMedia.updatedAt,
    }).from(destinationMedia).orderBy(desc(destinationMedia.updatedAt));
  }),

  getByDestination: publicProcedure
    .input(z.object({ destinationId: destinationIdSchema }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const rows = await db.select({
        destinationId: destinationMedia.destinationId,
        imageUrl: destinationMedia.imageUrl,
        flagUrl: destinationMedia.flagUrl,
        imageAlt: destinationMedia.imageAlt,
        flagAlt: destinationMedia.flagAlt,
        updatedAt: destinationMedia.updatedAt,
      }).from(destinationMedia).where(eq(destinationMedia.destinationId, input.destinationId)).limit(1);
      return rows[0] ?? null;
    }),

  listAdmin: publicProcedure.query(async ({ ctx }) => {
    const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
    return {
      admin: { id: admin.id, email: admin.email, fullName: admin.fullName },
      media: await db.select().from(destinationMedia).orderBy(desc(destinationMedia.updatedAt)),
    };
  }),

  save: publicProcedure
    .input(z.object({
      destinationId: destinationIdSchema,
      destinationName: z.string().trim().min(1).max(160),
      mediaType: z.enum(["image", "flag"]),
      dataUrl: z.string().min(32).max(10_000_000),
      mimeType: z.string().trim().min(1).max(80),
      altText: z.string().trim().max(255).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const { buffer, mimeType } = parseImageData(input.dataUrl, input.mimeType);
      const extension = extensionForMimeType(mimeType);
      const key = `destination-media/${input.destinationId}/${input.mediaType}-${Date.now()}-${randomUUID()}.${extension}`;
      const stored = await storagePut(key, buffer, mimeType);
      const existingRows = await db.select().from(destinationMedia).where(eq(destinationMedia.destinationId, input.destinationId)).limit(1);
      const existing = existingRows[0];
      const altText = input.altText || `${input.destinationName} — ${input.mediaType === "flag" ? "drapeau" : "image de destination"}`;
      const mediaValues = input.mediaType === "image"
        ? { imageUrl: stored.url, imageKey: stored.key, imageAlt: altText }
        : { flagUrl: stored.url, flagKey: stored.key, flagAlt: altText };

      if (existing) {
        await db.update(destinationMedia).set({
          ...mediaValues,
          updatedByAdminId: admin.id,
          updatedByAdminEmail: admin.email,
        }).where(eq(destinationMedia.id, existing.id));
      } else {
        await db.insert(destinationMedia).values({
          destinationId: input.destinationId,
          ...mediaValues,
          updatedByAdminId: admin.id,
          updatedByAdminEmail: admin.email,
        });
      }

      const rows = await db.select().from(destinationMedia).where(eq(destinationMedia.destinationId, input.destinationId)).limit(1);
      return { success: true, media: rows[0] ?? null };
    }),

  remove: publicProcedure
    .input(z.object({ destinationId: destinationIdSchema, mediaType: z.enum(["image", "flag"]) }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const rows = await db.select().from(destinationMedia).where(eq(destinationMedia.destinationId, input.destinationId)).limit(1);
      const existing = rows[0];
      if (!existing) return { success: true, media: null };

      const clearValues = input.mediaType === "image"
        ? { imageUrl: null, imageKey: null, imageAlt: null }
        : { flagUrl: null, flagKey: null, flagAlt: null };
      await db.update(destinationMedia).set({
        ...clearValues,
        updatedByAdminId: admin.id,
        updatedByAdminEmail: admin.email,
      }).where(and(eq(destinationMedia.id, existing.id), eq(destinationMedia.destinationId, input.destinationId)));

      const updatedRows = await db.select().from(destinationMedia).where(eq(destinationMedia.destinationId, input.destinationId)).limit(1);
      return { success: true, media: updatedRows[0] ?? null };
    }),
});

export { MAX_IMAGE_BYTES, ALLOWED_MIME_TYPES, parseImageData };
