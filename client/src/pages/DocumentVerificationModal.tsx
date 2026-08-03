import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts;

    // Toujours journaliser l'erreur complète côté serveur pour le débogage.
    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error("[tRPC] Internal error:", error.cause ?? error);
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
export const publicProcedure = t.procedure;

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
