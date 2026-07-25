import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { evaluationRouter } from "./routers/evaluation";
import { flightsRouter } from "./routers/flights";
import { candidateRouter } from "./routers/candidate";
import { applicationRouter } from "./routers/application";
import { heartbeatRouter } from "./routers/heartbeat";
import { profileEvaluationRouter } from "./routers/profileEvaluation";
import { contactRouter } from "./routers/contact";
import { adminRouter } from "./routers/admin";
import { adminAuthRouter } from "./routers/adminAuth";


export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  evaluation: evaluationRouter,
  profileEvaluation: profileEvaluationRouter,
  flights: flightsRouter,
  candidate: candidateRouter,
  application: applicationRouter,
  heartbeat: heartbeatRouter,
  contact: contactRouter,
  admin: adminRouter,
  adminAuth: adminAuthRouter,
});

export type AppRouter = typeof appRouter;
