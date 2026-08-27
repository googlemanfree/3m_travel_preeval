import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { adminAuditLogs, agencyDossiers, applications } from "../../drizzle/schema";
import { getDb } from "../db";
import { router, publicProcedure } from "../_core/trpc";
import { requireAdminSessionFromCookie } from "./adminAuth";
import { dossierReferenceCandidates, normalizeDossierReference, parseAgencyDossierReference } from "../utils/dossierReference";

const verifyInput = z.object({
  reference: z.string().trim().min(4).max(80),
  email: z.string().trim().email().max(320).optional(),
});

function emailMatches(storedEmail: string, suppliedEmail?: string) {
  if (!suppliedEmail) return null;
  return storedEmail.trim().toLowerCase() === suppliedEmail.trim().toLowerCase();
}

export const dossierVerificationRouter = router({
  verify: publicProcedure.input(verifyInput).mutation(async ({ ctx, input }) => {
    const admin = await requireAdminSessionFromCookie(ctx.req.headers.cookie);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

    const normalizedReference = normalizeDossierReference(input.reference);
    const [online] = await db
      .select({
        id: applications.id,
        dossierNumber: applications.dossierNumber,
        dossierStatus: applications.dossierStatus,
        destination: applications.destination,
        visaType: applications.visaType,
        email: applications.email,
        candidateId: applications.candidateId,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .where(inArray(applications.dossierNumber, dossierReferenceCandidates(input.reference)))
      .limit(1);

    const agencyId = parseAgencyDossierReference(input.reference);
    const [agency] = online || !agencyId
      ? [undefined]
      : await db
        .select({
          id: agencyDossiers.id,
          status: agencyDossiers.status,
          destination: agencyDossiers.destination,
          visaType: agencyDossiers.visaType,
          email: agencyDossiers.email,
          updatedAt: agencyDossiers.updatedAt,
        })
        .from(agencyDossiers)
        .where(and(eq(agencyDossiers.id, agencyId), isNull(agencyDossiers.deletedAt)))
        .limit(1);

    const source = online ? "online" : agency ? "agency" : null;
    const recordId = online?.id ?? agency?.id ?? null;
    await db.insert(adminAuditLogs).values({
      adminAccountId: admin.id,
      adminEmail: admin.email,
      action: "dossier_reference_checked",
      category: "case_management",
      resourceType: source ? `${source}_dossier` : "dossier_reference",
      resourceId: recordId ? String(recordId) : normalizedReference,
      outcome: source ? "success" : "failure",
      details: source
        ? `Référence vérifiée. Source : ${source}. Association e-mail : ${emailMatches((online ?? agency)!.email, input.email) === null ? "non contrôlée" : emailMatches((online ?? agency)!.email, input.email) ? "conforme" : "à corriger"}.`
        : "Référence non résolue. Aucun e-mail ni contenu de dossier n’a été journalisé.",
    });

    if (online) {
      return {
        found: true as const,
        source: "online" as const,
        reference: online.dossierNumber,
        status: online.dossierStatus,
        destination: online.destination,
        visaType: online.visaType,
        emailAssociation: emailMatches(online.email, input.email),
        accountAssociation: online.candidateId ? "rattache" as const : "non_rattache" as const,
        updatedAt: online.updatedAt,
      };
    }

    if (agency) {
      return {
        found: true as const,
        source: "agency" as const,
        reference: `3M-AGN-${agency.id.toString().padStart(4, "0")}`,
        status: agency.status,
        destination: agency.destination,
        visaType: agency.visaType,
        emailAssociation: emailMatches(agency.email, input.email),
        accountAssociation: "a_rattacher" as const,
        updatedAt: agency.updatedAt,
      };
    }

    return { found: false as const, normalizedReference };
  }),
});
