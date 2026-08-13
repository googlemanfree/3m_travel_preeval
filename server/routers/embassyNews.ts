import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

export interface EmbassyNewsItem {
  id: string;
  source: "Canada" | "Schengen / Europe" | "France";
  sourceBadge: string;
  title: { fr: string; en: string };
  summary: { fr: string; en: string };
  date: string;
  url: string;
  category: "visa" | "immigration" | "etudes" | "alerte";
}

const OFFICIAL_NEWS: EmbassyNewsItem[] = [
  {
  id: "ca-1",
  source: "Canada",
  sourceBadge: "IRCC Canada",
  title: {
    fr: "Mises à jour des exigences de permis d'études et de séjour temporaire pour l'automne 2026",
    en: "Updates to study permit and temporary residence requirements for Fall 2026",
  },
  summary: {
    fr: "Immigration, Réfugiés et Citoyenneté Canada (IRCC) annonce de nouveaux seuils et une accélération des dossiers pour les étudiants francophones via l'initiative Volet Direct pour les Études (VDE).",
    en: "Immigration, Refugees and Citizenship Canada (IRCC) announces new thresholds and expedited processing for francophone students via the Student Direct Stream.",
  },
  date: "2026-08-10",
  url: "https://www.canada.ca/fr/services/immigration-citoyennete.html",
  category: "etudes",
  },
  {
  id: "ca-2",
  source: "Canada",
  sourceBadge: "Entrée Express",
  title: {
    fr: "Nouvelles rondes d'invitations Entrée Express ciblées sur les compétences en forte demande",
    en: "New Express Entry invitation rounds targeted at high-demand skills",
  },
  summary: {
    fr: "Les derniers tirages Entrée Express favorisent les candidats qualifiés disposant d'une expérience francophone ou dans les secteurs de la santé et des technologies.",
    en: "Recent Express Entry draws favor skilled candidates with French-language proficiency or experience in healthcare and technology sectors.",
  },
  date: "2026-08-05",
  url: "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express.html",
  category: "immigration",
  },
  {
  id: "eu-1",
  source: "Schengen / Europe",
  sourceBadge: "Union Européenne",
  title: {
    fr: "Déploiement du nouveau système EES et ETIAS pour les voyageurs exempteurs de visa",
    en: "Rollout of the new Entry/Exit System (EES) and ETIAS for visa-exempt travelers",
  },
  summary: {
    fr: "L'Espace Schengen renforce la sécurité de ses frontières extérieures avec l'enregistrement biométrique automatisé pour les courts séjours.",
    en: "The Schengen Area is strengthening its external border security with automated biometric registration for short stays.",
  },
  date: "2026-08-08",
  url: "https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa_en",
  category: "visa",
  },
  {
  id: "fr-1",
  source: "France",
  sourceBadge: "Consulat Général",
  title: {
    fr: "Simplification des procédures de prise de rendez-vous pour les visas de long séjour études",
    en: "Streamlined appointment booking procedures for long-stay student visas",
  },
  summary: {
    fr: "Le réseau consulaire français met en place un nouveau calendrier d'ouverture des créneaux pour réduire les délais d'attente des candidats.",
    en: "The French consular network is introducing a new slot-opening schedule to reduce waiting times for applicants.",
  },
  date: "2026-08-01",
  url: "https://france-visas.gouv.fr/",
  category: "etudes",
  },
];

export const embassyNewsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        source: z.string().optional(),
      }).optional()
    )
    .query(({ input }) => {
      let results = [...OFFICIAL_NEWS];
      if (input?.category && input.category !== "all") {
        results = results.filter((item) => item.category === input.category);
      }
      if (input?.source && input.source !== "all") {
        results = results.filter((item) => item.source.toLowerCase().includes(input.source!.toLowerCase()));
      }
      return results;
    }),
});
