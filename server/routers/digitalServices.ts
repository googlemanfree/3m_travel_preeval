import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { adminNotifications, digitalServiceContent, digitalServiceRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireAdminSessionFromCookie, requireValidAdminSession } from "./adminAuth";

const serviceSchema = z.enum(["web_platform", "digital_growth", "it_support", "professional_training"]);
const statusSchema = z.enum(["new", "contacted", "proposal_sent", "completed", "cancelled"]);
const requestSchema = z.object({
  service: serviceSchema,
  fullName: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(50),
  organization: z.string().trim().max(255).optional(),
  message: z.string().trim().min(12).max(2500),
});

const makeReference = () => `DGT-${new Date().getFullYear()}-${randomInt(100000, 1_000_000)}`;

const defaultContent = {
  heroTitle: "Le digital qui fait avancer vos projets.",
  heroDescription: "3M Digital est le pôle de services numériques de 3M Travel & Services : plateformes web, croissance digitale, support IT et formation professionnelle pour les particuliers, agences et entreprises.",
  serviceIntro: "Le pôle 3M Digital met en relation les compétences nécessaires pour rendre vos activités plus visibles, mieux organisées et plus simples à développer.",
  requestIntro: "Chaque demande reçoit une référence, entre dans la file de traitement du back-office et peut être suivie par nos conseillers avant toute proposition.",
  serviceDefinitionsJson: JSON.stringify([
    { title: "Sites web & plateformes", description: "Des expériences digitales fiables pour informer, rassurer et accompagner vos visiteurs.", points: ["Site vitrine responsive", "Portail client & espace de suivi", "Plateforme de réservation sur mesure", "Nom de domaine, e-mails et maintenance"] },
    { title: "Croissance digitale", description: "Une présence éditoriale cohérente pour mieux présenter vos services et échanger avec votre audience.", points: ["Stratégie et calendrier de contenu", "Visuels, vidéos courtes et réseaux sociaux", "Référencement et acquisition digitale", "Lecture régulière des performances"] },
    { title: "Infrastructure & support IT", description: "Un environnement de travail connecté, maintenu et mieux protégé au quotidien.", points: ["Maintenance et assistance utilisateurs", "Réseaux, Wi-Fi et télécoms", "Cybersécurité et sauvegarde", "Audit digital et accompagnement"] },
    { title: "Formation professionnelle", description: "Des sessions pratiques autour du digital, de la mobilité et des opérations de voyage.", points: ["Marketing digital et création de contenu", "Mobilité internationale et orientation", "Galileo Smartpoint et billetterie", "Relation client et gestion des dossiers"] },
  ]),
  pricingJson: JSON.stringify([
    {
      title: "Vitrine évolutive",
      subtitle: "Présenter l’offre, recevoir les demandes et garder la validation humaine.",
      launchRange: "3 600 000 – 14 500 000 XAF",
      annualRange: "1 150 000 – 7 200 000 XAF / an",
      delivery: "6 à 12 semaines",
      points: ["Cadrage, identité visuelle et contenus", "Formulaires intelligents et suivi des demandes", "Administration légère et accompagnement au lancement"],
    },
    {
      title: "Plateforme transactionnelle",
      subtitle: "Standardiser certains parcours de recherche, réservation et paiement.",
      launchRange: "17 500 000 – 66 000 000 XAF",
      annualRange: "8 100 000 – 47 000 000 XAF / an",
      delivery: "4 à 9 mois",
      points: ["Catalogue, comptes, paiements et notifications", "Intégrations fournisseurs et règles opérationnelles", "Gestion des exceptions, annulations et rapprochements"],
    },
  ]),
};

async function resolveDigitalAdminSession(cookieHeader: string | undefined, sessionToken: string) {
  try {
    return await requireAdminSessionFromCookie(cookieHeader);
  } catch {
    try {
      return await requireValidAdminSession(sessionToken);
    } catch {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Votre session administrateur a expiré. Reconnectez-vous avant de traiter cette demande." });
    }
  }
}

const contentInput = z.object({
  heroTitle: z.string().trim().min(8).max(255),
  heroDescription: z.string().trim().min(20).max(1800),
  serviceIntro: z.string().trim().min(20).max(1800),
  requestIntro: z.string().trim().min(20).max(1800),
  serviceDefinitionsJson: z.string().trim().min(20).max(12000).refine((value) => {
    try {
      const items = JSON.parse(value);
      return Array.isArray(items) && items.length === 4 && items.every((item) => typeof item?.title === "string" && typeof item?.description === "string" && Array.isArray(item?.points));
    } catch { return false; }
  }, "Les pôles doivent être un tableau JSON de quatre services valides."),
  pricingJson: z.string().trim().min(40).max(12000).refine((value) => {
    try {
      const items = JSON.parse(value);
      return Array.isArray(items) && items.length >= 2 && items.every((item) =>
        typeof item?.title === "string" && typeof item?.subtitle === "string" && typeof item?.launchRange === "string" &&
        typeof item?.annualRange === "string" && typeof item?.delivery === "string" && Array.isArray(item?.points)
      );
    } catch { return false; }
  }, "La grille tarifaire doit être un tableau JSON de niveaux de service valides."),
});

function withDefaultContent(row: typeof digitalServiceContent.$inferSelect | undefined) {
  return {
    ...defaultContent,
    ...(row || {}),
    serviceDefinitionsJson: row?.serviceDefinitionsJson || defaultContent.serviceDefinitionsJson,
    pricingJson: row?.pricingJson || defaultContent.pricingJson,
  };
}

export const digitalServicesRouter = router({
  getContent: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return defaultContent;
    const rows = await db.select().from(digitalServiceContent).where(eq(digitalServiceContent.id, 1)).limit(1);
    return withDefaultContent(rows[0]);
  }),
  createRequest: publicProcedure.input(requestSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const reference = makeReference();
    await db.insert(digitalServiceRequests).values({ ...input, organization: input.organization || null, reference });
    await db.insert(adminNotifications).values({
      type: "new_contact_message",
      title: "Nouvelle demande 3M Digital",
      message: `${input.fullName} — ${input.service} — ${reference}`,
      relatedId: reference,
      targetAdminType: "accompagnement",
    });
    return { reference };
  }),

  adminList: publicProcedure.input(z.object({ sessionToken: z.string().min(1) })).query(async ({ input, ctx }) => {
    await resolveDigitalAdminSession(ctx.req.headers.cookie, input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    return db.select().from(digitalServiceRequests).orderBy(desc(digitalServiceRequests.createdAt));
  }),

  updateRequest: publicProcedure.input(z.object({
    sessionToken: z.string().min(1),
    requestId: z.number().int().positive(),
    status: statusSchema,
    adminNotes: z.string().trim().max(3000).optional(),
  })).mutation(async ({ input, ctx }) => {
    const admin = await resolveDigitalAdminSession(ctx.req.headers.cookie, input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const existing = await db.select({ id: digitalServiceRequests.id }).from(digitalServiceRequests).where(eq(digitalServiceRequests.id, input.requestId)).limit(1);
    if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Demande 3M Digital introuvable." });
    await db.update(digitalServiceRequests).set({
      status: input.status,
      adminNotes: input.adminNotes || null,
      handledByAdminEmail: admin.email || admin.fullName || "Administrateur 3M",
      handledAt: new Date(),
    }).where(eq(digitalServiceRequests.id, input.requestId));
    return { success: true };
  }),

  adminGetContent: publicProcedure.input(z.object({ sessionToken: z.string().min(1) })).query(async ({ input, ctx }) => {
    await resolveDigitalAdminSession(ctx.req.headers.cookie, input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const rows = await db.select().from(digitalServiceContent).where(eq(digitalServiceContent.id, 1)).limit(1);
    return withDefaultContent(rows[0]);
  }),

  adminUpdateContent: publicProcedure.input(z.object({ sessionToken: z.string().min(1), content: contentInput })).mutation(async ({ input, ctx }) => {
    const admin = await resolveDigitalAdminSession(ctx.req.headers.cookie, input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.insert(digitalServiceContent).values({ id: 1, ...input.content, updatedByAdminEmail: admin.email || admin.fullName || "Administrateur 3M" }).onDuplicateKeyUpdate({ set: { ...input.content, updatedByAdminEmail: admin.email || admin.fullName || "Administrateur 3M", updatedAt: new Date() } });
    return { success: true };
  }),
});
