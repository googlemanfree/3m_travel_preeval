import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

const wikipediaResult = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  excerpt: z.string().nullable().optional(),
  thumbnail: z
    .object({ source: z.string().url().optional() })
    .nullable()
    .optional(),
  key: z.string().optional(),
});

const wikipediaResponse = z.object({
  pages: z.array(wikipediaResult).default([]),
});

export const globalSearchRouter = router({
  web: publicProcedure
    .input(
      z.object({
        query: z.string().trim().min(2).max(120),
        language: z.enum(["fr", "en"]).default("fr"),
      })
    )
    .query(async ({ input }) => {
      const endpoint = new URL(
        `https://${input.language}.wikipedia.org/w/rest.php/v1/search/page`
      );
      endpoint.searchParams.set("q", input.query);
      endpoint.searchParams.set("limit", "6");
      try {
        const response = await fetch(endpoint, {
          headers: {
            Accept: "application/json",
            "User-Agent": "3MTravelSearch/1.0",
          },
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) return { source: "Wikipédia", results: [] };
        const parsed = wikipediaResponse.safeParse(await response.json());
        if (!parsed.success) return { source: "Wikipédia", results: [] };
        return {
          source: "Wikipédia",
          results: parsed.data.pages.map(page => ({
            title: page.title,
            description:
              page.description ??
              page.excerpt ??
              "Article public à vérifier sur la source.",
            href: `https://${input.language}.wikipedia.org/wiki/${encodeURIComponent(page.key ?? page.title.replaceAll(" ", "_"))}`,
            thumbnail: page.thumbnail?.source ?? null,
          })),
        };
      } catch {
        return { source: "Wikipédia", results: [] };
      }
    }),
});
