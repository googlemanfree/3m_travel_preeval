import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { recordRequest } from "./monitoring";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

// Middleware de monitoring des performances
const monitoringMiddleware = t.middleware(async (opts) => {
  const startTime = Date.now();
  const procedurePath = opts.path;

  try {
    const result = await opts.next();
    const duration = Date.now() - startTime;
    recordRequest(procedurePath, duration, "success");
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Déterminer si c'est un timeout
    const isTimeout = duration > 30000 || errorMessage.includes("timeout");
    const status = isTimeout ? "timeout" : "error";
    
    recordRequest(procedurePath, duration, status, errorMessage);
    throw error;
  }
});

export const router = t.router;
export const publicProcedure = t.procedure.use(monitoringMiddleware);

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

export const protectedProcedure = t.procedure.use(monitoringMiddleware).use(requireUser);

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
