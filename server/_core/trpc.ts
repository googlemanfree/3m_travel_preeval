import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { logger } from "./logger";
import { findAdminByEmail, findAdminBySessionToken, recordAdminAuditFromContext } from "../services/adminAudit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error, path } = opts;

    // Toujours journaliser l'erreur côté serveur pour le débogage et le suivi.
    if (error.code === "INTERNAL_SERVER_ERROR") {
      logger.error("trpc.internal_error", { path }, error.cause ?? error);
    } else {
      logger.warn("trpc.request_error", { path, code: error.code, message: error.message });
    }

    // Ne jamais renvoyer le message brut d'une erreur interne (qui peut
    // contenir une requête SQL, ses paramètres, ou une trace technique) au
    // client. Les autres codes (BAD_REQUEST, CONFLICT, NOT_FOUND,
    // UNAUTHORIZED, FORBIDDEN...) proviennent de messages que nous rédigeons
    // nous-mêmes volontairement pour l'utilisateur, donc ils passent tels quels.
    if (error.code === "INTERNAL_SERVER_ERROR") {
      return {
        ...shape,
        message: "Une erreur interne est survenue. Veuillez réessayer.",
      };
    }

    return shape;
  },
});

export const router = t.router;

const ADMIN_ROUTE_RE = /(^|\.)(admin|adminAuth|adminPasswordReset|adminCandidateManagement|adminSavedViews|adminDossier|adminDashboardStats|adminNotifications|adminAudit|evaluationAdmin|evisaAdmin)(\.|$)/i;

/**
 * Audit transversal des routes admin. Les détails d’entrée ne sont jamais persistés :
 * seuls le chemin, le type d’opération et les identifiants de ressource explicitement
 * sûrs peuvent être enregistrés par les procédures spécialisées.
 */
const adminAuditMiddleware = t.middleware(async opts => {
  const { path, type, input, ctx, next } = opts;
  if (!ADMIN_ROUTE_RE.test(path)) return next();

  const payload = (input && typeof input === "object") ? input as Record<string, unknown> : {};
  const sessionToken = typeof payload.sessionToken === "string" ? payload.sessionToken : null;
  const email = typeof payload.email === "string" ? payload.email : null;
  const admin = sessionToken ? await findAdminBySessionToken(sessionToken) : (email ? await findAdminByEmail(email) : null);
  const isAuthPath = path.startsWith("adminAuth.login") || path.startsWith("adminAuth.logout") || path.startsWith("adminAuth.changePassword");

  const result = await next();
  if (!isAuthPath && type !== "mutation") return result;

  const ok = result.ok;
  await recordAdminAuditFromContext(ctx, {
    adminAccountId: admin?.id ?? null,
    adminEmail: admin?.email ?? (email ?? "unknown-admin"),
    action: `${type}:${path}`,
    category: isAuthPath ? "auth" : "mutation",
    outcome: ok ? "success" : "failure",
    details: { procedure: path, operationType: type },
  });
  return result;
});

export const publicProcedure = t.procedure.use(adminAuditMiddleware);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
