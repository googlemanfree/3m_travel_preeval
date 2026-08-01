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
import { clientDocumentsRouter } from "./routers/clientDocuments";
import { translationRouter } from "./routers/translation";
import { agencyDossierRouter } from "./routers/agencyDossier";
import { documentSubmissionRouter } from "./routers/documentSubmission";
import { candidateAuthOTPRouter } from "./routers/candidateAuthOTP";
import { monitoringRouter } from "./routers/monitoring";
import { evaluationAIRouter } from "./routers/evaluationAI";
import { evaluationAdminRouter } from "./routers/evaluationAdmin";
import { evaluationCommentsRouter } from "./routers/evaluationComments";
import { paymentRouter } from "./routers/payment";
import { documentsRouter } from "./routers/documents";
import { userDashboardRouter } from "./routers/userDashboard";
import { cvAIRouter } from "./routers/cvAI";
import { adminDossierRouter } from "./routers/adminDossier";
import { cinetpayPaymentRouter } from "./routers/cinetpayPayment";
import { notificationRouter } from "./routers/notificationRouter";
import { adminDashboardStatsRouter } from "./routers/adminDashboardStats";
import { exportRouter } from "./routers/exportRouter";
import { evisaRouter } from "./routers/evisaRouter";
import { reassuranceRouter } from "./routers/reassuranceRouter";
import { documentClassificationRouter } from "./routers/documentClassificationRouter";
import { evisaFavoritesRouter } from "./routers/evisaFavoritesRouter";
import { evisaReviewsRouter } from "./routers/evisaReviewsRouter";
import { uploadRouter } from "./routers/uploadRouter";

const COOKIE_NAME = "manus_session";

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
  evaluationAI: evaluationAIRouter,
  evaluationAdmin: evaluationAdminRouter,
  evaluationComments: evaluationCommentsRouter,
  profileEvaluation: profileEvaluationRouter,
  cvAI: cvAIRouter,
  flights: flightsRouter,
  candidate: candidateRouter,
  // Nouveau: Authentification OTP sécurisée (France-Visas compliant)
  // candidateAuthOTP: candidateAuthOTPRouter, // Utiliser à la place de candidate pour OTP
  application: applicationRouter,
  heartbeat: heartbeatRouter,
  contact: contactRouter,
  admin: adminRouter,
  adminAuth: adminAuthRouter,
  adminDossier: adminDossierRouter,
  clientDocuments: clientDocumentsRouter,
  translation: translationRouter,
  agencyDossier: agencyDossierRouter,
  documentSubmission: documentSubmissionRouter,
  candidateAuthOTP: candidateAuthOTPRouter,
  monitoring: monitoringRouter,
  payment: paymentRouter,
  cinetpayPayment: cinetpayPaymentRouter,
  notification: notificationRouter,
  adminDashboardStats: adminDashboardStatsRouter,
  export: exportRouter,
  evisa: evisaRouter,
  evisaFavorites: evisaFavoritesRouter,
  evisaReviews: evisaReviewsRouter,
  reassurance: reassuranceRouter,
  documentClassification: documentClassificationRouter,
  documents: documentsRouter,
  userDashboard: userDashboardRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
