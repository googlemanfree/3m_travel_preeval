import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { mediaLibrary } from "../../drizzle/schema";
import { getDb } from "../db";
import { requireAdminSessionFromCookie } from "./adminAuth";
import { publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { optimizeImageBuffer } from "../imageOptimizer";
import { TRPCError } from "@trpc/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const mediaLibraryRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
    return db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.createdAt));
  }),

  upload: publicProcedure
    .input(z.object({
      title: z.string().trim().min(1).max(255),
      category: z.enum(["hero", "procedure", "service", "flag", "testimonial", "other"]),
      dataUrl: z.string().min(32).max(10_000_000),
      mimeType: z.string().trim().min(1).max(80),
    }))
    .mutation(async ({ input, ctx }) => {
      const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const match = input.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
      const base64 = match?.[2] ?? input.dataUrl;
      const buffer = Buffer.from(base64, "base64");

      if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "L’image doit peser au maximum 5 Mo." });
      }

      const optimizedBuffer = optimizeImageBuffer(buffer, 1600, 1600, 82);
      const key = `media-library/${input.category}/${Date.now()}-${randomUUID()}.webp`;
      const stored = await storagePut(key, optimizedBuffer, "image/webp");

      const [inserted] = await db.insert(mediaLibrary).values({
        title: input.title,
        category: input.category,
        url: stored.url,
        storageKey: stored.key,
        fileSize: optimizedBuffer.length,
        mimeType: "image/webp",
        uploadedByAdminEmail: admin.email,
      });

      const rows = await db.select().from(mediaLibrary).where(eq(mediaLibrary.id, Number(inserted.insertId))).limit(1);
      return { success: true, item: rows[0] ?? null };
    }),

  remove: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await requireAdminSessionFromCookie(ctx.req.headers.cookie);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      await db.delete(mediaLibrary).where(eq(mediaLibrary.id, input.id));
      return { success: true };
    }),
});
