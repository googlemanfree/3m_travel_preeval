import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "../shared/const";

// Import des routeurs existants
import { evaluationRouter } from "./routers/evaluation";
import { flightsRouter } from "./routers/flights";
import { candidateRouter } from "./routers/candidate";
import { applicationRouter } from "./routers/application";
import { heartbeatRouter } from "./routers/heartbeat";
import { profileEvaluationRouter } from "./routers/profileEvaluation";
import { contactRouter } from "./routers/contact";
import { adminRouter } from "./routers/admin";
import { adminAuthRouter } from "./routers/adminAuth";
import { adminAuditRouter } from "./routers/adminAudit";
import { adminActivationRouter } from "./routers/adminActivation";
import { clientDocumentsRouter } from "./routers/clientDocuments";
import { translationRouter } from "./routers/translation";
import { agencyDossierRouter } from "./routers/agencyDossier";
import { agencyDossierDocumentsRouter } from "./routers/agencyDossierDocuments";
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
import { passportAnalysisRouter } from "./routers/passportAnalysisRouter";
import { evisaAdminRouter } from "./routers/evisaAdminRouter";
import { signupRouter } from "./routers/signup";
import { simpleAuthRouter } from "./routers/simpleAuth";
import { oauthUserDashboardRouter } from "./routers/oauthUserDashboard";
import { adminPasswordResetRouter } from "./routers/adminPasswordReset";
import { adminNotificationsRouter } from "./routers/adminNotifications";
import { luxembourgEvaluationRouter } from "./routers/luxembourgEvaluation";
import { consultationRequestRouter } from "./routers/consultationRequest";
import { aiEvaluationManagementRouter } from "./routers/aiEvaluationManagement";
import { studyVisaEvaluationRouter } from "./routers/studyVisaEvaluation";
import { proceduresRouter } from "./routers/proceduresRouter";
import { paymentValidationRouter } from "./routers/paymentValidation";
import { customerReviewRouter } from "./routers/customerReview";
import { cvAnalysisRouter } from "./routers/cvAnalysis";
import { aiCopilotRouter } from "./routers/aiCopilot";
import { evaluationEngineRouter } from "./routers/evaluationEngine";
import { visaStatusTrackerRouter } from "./routers/visaStatusTracker";
import { flightPlannerAIRouter } from "./routers/flightPlannerAI";
import { adminCandidateManagementRouter } from "./routers/adminCandidateManagement";
import { adminSavedViewsRouter } from "./routers/adminSavedViews";
import { insuranceRequestsRouter } from "./routers/insuranceRequests";
import { caseTrackingRouter } from "./routers/caseTracking";
import { destinationMediaRouter } from "./routers/destinationMedia";
import { embassyNewsRouter } from "./routers/embassyNews";
import { mediaLibraryRouter } from "./routers/mediaLibrary";
import { flightBookingRouter } from "./routers/flightBooking";
import { unifiedRequestsRouter } from "./routers/unifiedRequests";
import { tourismRouter } from "./routers/tourism";
import { exchangeRatesRouter } from "./routers/exchangeRatesRouter";
import { evisaCatalogueRouter } from "./routers/evisaCatalogueRouter";
import { routeHealthRouter } from "./routers/routeHealthRouter";
import { richTextTemplatesRouter } from "./routers/richTextTemplatesRouter";
import { consularRegistryRouter } from "./routers/consularRegistryRouter";
import { digitalServicesRouter } from "./routers/digitalServices";
import { jinkoHotelSearchRouter } from "./routers/jinkoHotelSearch";
import { footerEngagementRouter } from "./routers/footerEngagement";

// Import des nouveaux routeurs créés
import { candidateRouter as candidateRouterNew } from "./routers/candidateRouter";
import { applicationRouter as applicationRouterNew } from "./routers/applicationRouter";
import { evaluationRouter as evaluationRouterNew } from "./routers/evaluationRouter";

export const appRouter = router({
  // Système et authentification
  system: systemRouter,
  // Alias de compatibilité pour les vérifications de disponibilité déjà
  // déployées. Aucun état sensible n’est exposé par cette procédure publique.
  health: router({
    check: publicProcedure.query(() => ({
      ok: true,
      checkedAt: new Date(),
    })),
  }),
  signup: signupRouter,
  simpleAuth: simpleAuthRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, expires: new Date(0) });
      return {
        success: true,
      } as const;
    }),
  }),

  // Routeurs existants
  evaluation: evaluationRouter,
  evaluationAI: evaluationAIRouter,
  evaluationAdmin: evaluationAdminRouter,
  evaluationComments: evaluationCommentsRouter,
  profileEvaluation: profileEvaluationRouter,
  cvAI: cvAIRouter,
  cvAnalysis: cvAnalysisRouter,
  aiCopilot: aiCopilotRouter,
  flights: flightsRouter,
  flightBooking: flightBookingRouter,
  unifiedRequests: unifiedRequestsRouter,
  tourism: tourismRouter,
  candidate: candidateRouter,
  candidateAuthOTP: candidateAuthOTPRouter,
  application: applicationRouter,
  heartbeat: heartbeatRouter,
  contact: contactRouter,
  admin: adminRouter,
  adminCandidateManagement: adminCandidateManagementRouter,
  adminSavedViews: adminSavedViewsRouter,
  insuranceRequests: insuranceRequestsRouter,
  caseTracking: caseTrackingRouter,
  destinationMedia: destinationMediaRouter,
  embassyNews: embassyNewsRouter,
  mediaLibrary: mediaLibraryRouter,
  adminAuth: adminAuthRouter,
  adminAudit: adminAuditRouter,
  adminActivation: adminActivationRouter,
  adminDossier: adminDossierRouter,
  clientDocuments: clientDocumentsRouter,
  translation: translationRouter,
  agencyDossier: agencyDossierRouter,
  agencyDossierDocuments: agencyDossierDocumentsRouter,
  documentSubmission: documentSubmissionRouter,
  monitoring: monitoringRouter,
  payment: paymentRouter,
  paymentValidation: paymentValidationRouter,
  customerReview: customerReviewRouter,
  cinetpayPayment: cinetpayPaymentRouter,
  notification: notificationRouter,
  adminDashboardStats: adminDashboardStatsRouter,
  export: exportRouter,
  evisa: evisaRouter,
  evisaCatalogue: evisaCatalogueRouter,
  consularRegistry: consularRegistryRouter,
  routeHealth: routeHealthRouter,
  richTextTemplates: richTextTemplatesRouter,
  digitalServices: digitalServicesRouter,
  jinkoHotelSearch: jinkoHotelSearchRouter,
  // Alias de compatibilité consommé par le panneau de recherche d’hôtels.
  jinkoHotels: jinkoHotelSearchRouter,
  footerEngagement: footerEngagementRouter,
  evisaFavorites: evisaFavoritesRouter,
  evisaReviews: evisaReviewsRouter,
  reassurance: reassuranceRouter,
  documentClassification: documentClassificationRouter,
  documents: documentsRouter,
  userDashboard: userDashboardRouter,
  oauthUserDashboard: oauthUserDashboardRouter,
  upload: uploadRouter,
  passportAnalysis: passportAnalysisRouter,
  evisaAdmin: evisaAdminRouter,

  // Nouveaux routeurs créés (versions simplifiées)
  candidateV2: candidateRouterNew,
  applicationV2: applicationRouterNew,
  evaluationV2: evaluationRouterNew,
  
  // Réinitialisation de mot de passe
  adminPasswordReset: adminPasswordResetRouter,
  
  // Notifications admin
  adminNotifications: adminNotificationsRouter,
  
  // Évaluation Luxembourg
  luxembourgEvaluation: luxembourgEvaluationRouter,
  consultationRequest: consultationRequestRouter,
  aiEvaluationManagement: aiEvaluationManagementRouter,
  studyVisaEvaluation: studyVisaEvaluationRouter,
  procedures: proceduresRouter,
  evaluationEngine: router(evaluationEngineRouter),
  visaStatusTracker: visaStatusTrackerRouter,
  flightPlannerAI: flightPlannerAIRouter,
  exchangeRates: exchangeRatesRouter,
});

export type AppRouter = typeof appRouter;
