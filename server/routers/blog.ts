import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { eq, desc, and, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Helper pour générer un slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    + "-" + Date.now().toString(36);
}

export const blogRouter = router({
  // Lister les articles publiés (public)
  listPublished: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(50).default(12),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const posts = await db.select().from(blogPosts)
        .where(
          and(
            eq(blogPosts.isPublished, true),
            input.category && input.category !== "Tous"
              ? eq(blogPosts.category, input.category as any)
              : undefined,
            input.search
              ? or(
                  like(blogPosts.title, `%${input.search}%`),
                  like(blogPosts.excerpt, `%${input.search}%`)
                )
              : undefined
          )
        )
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit)
        .offset(input.offset);

      return posts;
    }),

  // Obtenir un article par slug (public)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const [post] = await db.select().from(blogPosts)
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.isPublished, true)));
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Article non trouvé" });
      // Incrémenter le compteur de vues
      await db.update(blogPosts)
        .set({ viewCount: (post.viewCount || 0) + 1 })
        .where(eq(blogPosts.id, post.id));
      return post;
    }),

  // Obtenir les articles mis en avant (public)
  getFeatured: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(blogPosts)
      .where(and(eq(blogPosts.isPublished, true), eq(blogPosts.isFeatured, true)))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(3);
  }),

  // ===== ADMIN PROCEDURES =====

  // Lister tous les articles (admin)
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
    return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }),

  // Créer un article (admin)
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(5).max(255),
      excerpt: z.string().max(500).optional(),
      content: z.string().min(50),
      category: z.enum(["Visas", "Études", "Voyages", "Immigration", "Conseils", "Actualités"]),
      authorName: z.string().max(100).optional(),
      imageUrl: z.string().url().optional(),
      tags: z.array(z.string()).optional(),
      isPublished: z.boolean().default(false),
      isFeatured: z.boolean().default(false),
      readTimeMinutes: z.number().min(1).max(60).default(5),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const slug = generateSlug(input.title);
      const [result] = await db.insert(blogPosts).values({
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        category: input.category,
        authorName: input.authorName || ctx.user.name || "Équipe 3M Travel",
        authorId: ctx.user.id,
        imageUrl: input.imageUrl,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        isPublished: input.isPublished,
        isFeatured: input.isFeatured,
        readTimeMinutes: input.readTimeMinutes,
        publishedAt: input.isPublished ? new Date() : null,
      });
      return { id: (result as any).insertId, slug };
    }),

  // Mettre à jour un article (admin)
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(5).max(255).optional(),
      excerpt: z.string().max(500).optional(),
      content: z.string().min(50).optional(),
      category: z.enum(["Visas", "Études", "Voyages", "Immigration", "Conseils", "Actualités"]).optional(),
      authorName: z.string().max(100).optional(),
      imageUrl: z.string().url().optional().nullable(),
      tags: z.array(z.string()).optional(),
      isPublished: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      readTimeMinutes: z.number().min(1).max(60).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      const { id, tags, ...rest } = input;
      const updateData: any = { ...rest };
      if (tags !== undefined) updateData.tags = JSON.stringify(tags);
      if (input.isPublished === true) {
        const [existing] = await db.select({ publishedAt: blogPosts.publishedAt }).from(blogPosts).where(eq(blogPosts.id, id));
        if (!existing?.publishedAt) updateData.publishedAt = new Date();
      }
      await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, id));
      return { success: true };
    }),

  // Supprimer un article (admin)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));
      return { success: true };
    }),

  // Publier / dépublier un article (admin)
  togglePublish: protectedProcedure
    .input(z.object({ id: z.number(), isPublished: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      await db.update(blogPosts)
        .set({
          isPublished: input.isPublished,
          publishedAt: input.isPublished ? new Date() : null,
        })
        .where(eq(blogPosts.id, input.id));
      return { success: true };
    }),
});
