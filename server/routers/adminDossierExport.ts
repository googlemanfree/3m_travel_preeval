import type { Express, Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { requireValidAdminSession } from "./adminAuth";
import { createCvDraftLimiter } from "./cvDraft";
import { buildDossierExport } from "../services/dossierExport";
import { getRequestIp, recordAdminAudit } from "../services/adminAudit";

/** 6 exports par 10 minutes et par administrateur : un export lit toutes les pièces d'un dossier. */
const allowExport = createCvDraftLimiter(6, 10 * 60 * 1000);

export function bearerToken(req: Pick<Request, "headers">): string {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  const match = /^Bearer\s+(\S{10,512})$/i.exec(value ?? "");
  return match ? match[1] : "";
}

/**
 * POST /api/admin/dossier-export  { candidateId, includeRejected? }  +  Authorization: Bearer <session administrateur>
 * Renvoie un ZIP des pièces déposées par le candidat. Chaque export est inscrit dans le journal d'audit (qui, quel dossier, combien de pièces).
 */
export function registerAdminDossierExportRoute(app: Express, deps: { build?: typeof buildDossierExport } = {}) {
  const build = deps.build ?? buildDossierExport;
  app.post("/api/admin/dossier-export", async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ error: "Session administrateur requise." });
      return;
    }
    let admin: { id?: number | null; email: string };
    try {
      admin = await requireValidAdminSession(token);
    } catch (error) {
      const code = error instanceof TRPCError ? error.code : "UNAUTHORIZED";
      res.status(code === "FORBIDDEN" ? 403 : 401).json({ error: "Session administrateur invalide ou expirée." });
      return;
    }

    const candidateId = Number((req.body ?? {}).candidateId);
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      res.status(400).json({ error: "Candidat invalide." });
      return;
    }
    if (!allowExport(`export:${admin.email}`, Date.now())) {
      res.status(429).json({ error: "Trop d'exports récents : réessayez dans quelques minutes." });
      return;
    }

    try {
      const includeRejected = Boolean((req.body ?? {}).includeRejected);
      const result = await build({ candidateId, includeRejected });
      if (!result) {
        res.status(404).json({ error: "Candidat introuvable." });
        return;
      }
      await recordAdminAudit({
        adminAccountId: admin.id ?? null,
        adminEmail: admin.email,
        action: "dossier_export",
        category: "access",
        resourceType: "candidate",
        resourceId: String(candidateId),
        details: { included: result.included, skipped: result.skipped.length, includeRejected },
        ipAddress: getRequestIp({ req } as any),
      });
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName.replace(/[^A-Za-z0-9._-]/g, "_")}"`);
      res.setHeader("X-Export-Included", String(result.included));
      res.setHeader("X-Export-Skipped", String(result.skipped.length));
      res.send(result.zip);
    } catch (error) {
      console.error("[Dossier Export] échec", error instanceof Error ? error.message : error);
      res.status(500).json({ error: "L'export n'a pas pu être créé." });
    }
  });
}
