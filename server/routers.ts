import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "../shared/const";

// Import des routeurs existants
import { evaluationRouter } from "./routers/evaluation";
import { flightsRouter } from "./routers/flights";
import { candidateProcedure, candidateRouter } from "./routers/candidate";
import { evaluationValidationRouterFor } from "./routers/evaluationValidation";
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
import { monitoringRouter } from "./routers/monitoring";
import { evaluationAIRouter } from "./routers/evaluationAI";
import { evaluationAdminRouter } from "./routers/evaluationAdmin";
import { paymentRouter } from "./routers/payment";
import { documentsRouter } from "./routers/documents";
import { userDashboardRouter } from "./routers/userDashboard";
import { cvAIRouter } from "./routers/cvAI";
import { adminDossierRouter } from "./routers/adminDossier";
import { cinetpayPaymentRouter } from "./routers/cinetpayPayment";
import { paymentInstructionsRouter } from "./routers/paymentInstructions";
import { notificationRouter } from "./routers/notificationRouter";
import { adminDashboardStatsRouter } from "./routers/adminDashboardStats";
import { exportRouter } from "./routers/exportRouter";
import { evisaRouter } from "./routers/evisaRouter";
import { reassuranceRouter } from "./routers/reassuranceRouter";
import { documentClassificationRouter } from "./routers/documentClassificationRouter";
import { evisaFavoritesRouter } from "./routers/evisaFavoritesRouter";
import { evisaReviewsRouter } from "./routers/evisaReviewsRouter";
import { passportAnalysisRouter } from "./routers/passportAnalysisRouter";
import { evisaAdminRouter } from "./routers/evisaAdminRouter";
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
import { placementPortalRouter } from "./routers/placementPortal";
import { simulatorDiagnosticsRouter } from "./routers/simulatorDiagnostics";
import { accessRecoveryRouter } from "./routers/accessRecovery";
import { dossierVerificationRouter } from "./routers/dossierVerification";
import { newsletterRouter } from "./routers/newsletter";
import { ambassadorRouter } from "./routers/ambassador";

// evaluationRouterNew (routers/evaluationRouter.ts, ex-`evaluationV2`) a été RETIRÉ : `create` était public,
// sans authentification ni consentement, et insérait dans la même table `evaluations` que le vrai parcours
// (évaluation IA à validation administrateur), sans CV, sans code dossier, sans limite de débit — sans que
// rien côté client ni serveur ne l'appelle jamais. Le candidat crée son évaluation via `evaluation.submit`.
// candidateRouterNew/applicationRouterNew (routers/candidateRouter.ts, routers/applicationRouter.ts,
// ex-`candidateV2`/`applicationV2`) ont été RETIRÉS pour la même raison : `getByDossierNumber`/`getByEmail`
// et `getProfile`/`getFiles`/`getMessages` étaient publics ou protégés par `ctx.user.role` (un système
// d'authentification OAuth différent de `requireValidAdminSession`) et renvoyaient une ligne complète —
// données personnelles, statut de paiement, notes internes — sans vérifier que l'appelant est le candidat
// concerné. Rien côté client ni serveur ne les appelait jamais. Le candidat utilise `candidate.*`,
// l'administrateur `adminDossier`/`agencyDossier`/`adminCandidateManagement`.
// candidateAuthOTPRouter (routers/candidateAuthOTP.ts) a aussi été RETIRÉ : `verifyOTPAndRegister` ne contrôlait
// jamais le code (« pour cette démo, on accepte simplement l'OTP ») et créait un compte déjà vérifié pour
// n'importe quelle adresse e-mail, dont celle d'un candidat existant, dont les dossiers sont rattachés par e-mail.
// Rien côté client n'appelait ce routeur : l'inscription passe par `candidate.register` et `candidate.verifyEmail`.
// signupRouter (routers/signup.ts) a aussi été RETIRÉ : inscription désactivée (FORBIDDEN), aucun appelant, et son
// `resendVerificationEmail` révélait (« Compte introuvable ») quelles adresses ont un compte candidat.
// uploadRouter (routers/uploadRouter.ts) a aussi été RETIRÉ : `getUploadUrl` délivrait à n'importe qui une URL
// d'écriture présignée sur le stockage de l'agence, sans limite de type ni de taille et avec le nom de fichier brut
// dans la clé ; aucun appelant (les dépôts passent par `candidateUpload`).
// evaluationCommentsRouter (routers/evaluationComments.ts) a aussi été RETIRÉ, avec son unique client
// `CommentsSection` que plus aucune page ne monte : `getComments` était publique, ignorait l'e-mail reçu et
// renvoyait `authorEmail` (dont ceux des administrateurs) pour n'importe quel numéro de dossier ; `postComment`
// écrivait et notifiait l'agence sans vérifier que le dossier appartient à l'e-mail fourni.

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
  profileEvaluation: profileEvaluationRouter,
  cvAI: cvAIRouter,
  cvAnalysis: cvAnalysisRouter,
  aiCopilot: aiCopilotRouter,
  flights: flightsRouter,
  flightBooking: flightBookingRouter,
  unifiedRequests: unifiedRequestsRouter,
  tourism: tourismRouter,
  candidate: candidateRouter,
  accessRecovery: accessRecoveryRouter,
  dossierVerification: dossierVerificationRouter,
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
  paymentInstructions: paymentInstructionsRouter,
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
  placementPortal: placementPortalRouter,
  simulatorDiagnostics: simulatorDiagnosticsRouter,
  evisaFavorites: evisaFavoritesRouter,
  evisaReviews: evisaReviewsRouter,
  reassurance: reassuranceRouter,
  documentClassification: documentClassificationRouter,
  documents: documentsRouter,
  userDashboard: userDashboardRouter,
  oauthUserDashboard: oauthUserDashboardRouter,
  passportAnalysis: passportAnalysisRouter,
  evisaAdmin: evisaAdminRouter,

  // Réinitialisation de mot de passe
  adminPasswordReset: adminPasswordResetRouter,
  
  // Notifications admin
  adminNotifications: adminNotificationsRouter,
  
  // Évaluation Luxembourg
  luxembourgEvaluation: luxembourgEvaluationRouter,
  consultationRequest: consultationRequestRouter,
  aiEvaluationManagement: aiEvaluationManagementRouter,
  // Évaluation IA à validation administrateur obligatoire (brouillon interne → rapport publié)
  evaluationValidation: evaluationValidationRouterFor(candidateProcedure),
  studyVisaEvaluation: studyVisaEvaluationRouter,
  procedures: proceduresRouter,
  evaluationEngine: router(evaluationEngineRouter),
  visaStatusTracker: visaStatusTrackerRouter,
  flightPlannerAI: flightPlannerAIRouter,
  exchangeRates: exchangeRatesRouter,
  newsletter: newsletterRouter,
  ambassador: ambassadorRouter,
});

export type AppRouter = typeof appRouter;
