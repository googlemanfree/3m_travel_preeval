import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { lazyWithTimeout } from "./lib/lazyWithTimeout";
import { TooltipProvider } from "@/components/ui/tooltip";
const NotFound = lazyWithTimeout(() => import("./pages/NotFound"));
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AnimationPreferencesProvider } from "./contexts/AnimationPreferencesContext";
import { FontSizePreferencesProvider } from "./contexts/FontSizePreferencesContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import AuthGuard from "./components/AuthGuard";
import SessionLoader from "./components/SessionLoader";
import Home from "./pages/Home";
import CountryDetailPage from "./pages/CountryDetailPage";
const Flights = lazyWithTimeout(() => import("./pages/Flights"));
import Register from "./pages/Register";
const Login = lazyWithTimeout(() => import("./pages/Login"));
const VerifyEmail = lazyWithTimeout(() => import("./pages/VerifyEmail"));
import VerifyEmailLink from "./pages/VerifyEmailLink";
const VerifyEmailSent = lazyWithTimeout(() => import("./pages/VerifyEmailSent"));
const ConfirmEmailChange = lazyWithTimeout(() => import("./pages/ConfirmEmailChange"));
const AccessRecoveryRequest = lazyWithTimeout(() => import("./pages/AccessRecoveryRequest"));
const CompleteProfile = lazyWithTimeout(() => import("./pages/CompleteProfile"));
const ForgotPassword = lazyWithTimeout(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithTimeout(() => import("./pages/ResetPassword"));
const OpenDossier = lazyWithTimeout(() => import("./pages/OpenDossier"));
const PaymentSuccess = lazyWithTimeout(() => import("./pages/PaymentSuccess"));
const PaymentFailed = lazyWithTimeout(() => import("./pages/PaymentFailed"));
import VerifyApplicationEmail from "./pages/VerifyApplicationEmail";
const AdminConsultationRequests = lazyWithTimeout(() => import("./pages/AdminConsultationRequests"));
const AdminsList = lazyWithTimeout(() => import("./pages/AdminsList"));
const SuperAdminDashboard = lazyWithTimeout(() => import("./pages/SuperAdminDashboard"));
const CandidatesManager = lazyWithTimeout(() => import("./pages/CandidatesManager"));
const AdminAccompagnement = lazyWithTimeout(() => import("./pages/AdminAccompagnement"));
const AdminAgencyDossiers = lazyWithTimeout(() => import("./pages/AdminAgencyDossiers"));
const AdminDossierVerification = lazyWithTimeout(() => import("./pages/AdminDossierVerification"));
const AdminUsersManagement = lazyWithTimeout(() => import("./pages/AdminUsersManagement"));
const AdminAddDossier = lazyWithTimeout(() => import("./pages/AdminAddDossier"));
import { AdminDocumentVerification } from "./pages/AdminDocumentVerification";
const AdminProcedures = lazyWithTimeout(() => import("./pages/AdminProcedures"));
const AdminDestinationMedia = lazyWithTimeout(() => import("./pages/AdminDestinationMedia"));
const AdminMediaLibrary = lazyWithTimeout(() => import("./pages/AdminMediaLibrary"));
const AdminUserDetails = lazyWithTimeout(() => import("./pages/AdminUserDetails"));
const VisaEtudes = lazyWithTimeout(() => import("./pages/VisaEtudes"));
const Canada = lazyWithTimeout(() => import("./pages/Canada"));
const Schengen = lazyWithTimeout(() => import("./pages/Schengen"));
const Billets = lazyWithTimeout(() => import("./pages/Billets"));
const Formation = lazyWithTimeout(() => import("./pages/Formation"));
const ProcedureLuxembourg = lazyWithTimeout(() => import("./pages/ProcedureLuxembourg"));
const MonDossier = lazyWithTimeout(() => import("./pages/MonDossier"));
const EvisaRequestForm = lazyWithTimeout(() => import("./pages/EvisaRequestForm"));
const EvaluationResult = lazyWithTimeout(() => import("./pages/EvaluationResult"));
const Ressources = lazyWithTimeout(() => import("./pages/Ressources"));
const ProcedureResourceGuide = lazyWithTimeout(() => import("./pages/ProcedureResourceGuide"));
const Fiches = lazyWithTimeout(() => import("./pages/Fiches"));
const TranslationOrder = lazyWithTimeout(() => import("./pages/TranslationOrder"));
const AssuranceInscription = lazyWithTimeout(() => import("./pages/AssuranceInscription"));
const Evisa = lazyWithTimeout(() => import("./pages/Evisa"));
const EvisaDemande = lazyWithTimeout(() => import("./pages/EvisaDemande"));
const About = lazyWithTimeout(() => import("./pages/About"));
const Contact = lazyWithTimeout(() => import("./pages/Contact"));
const PolitiqueConfidentialite = lazyWithTimeout(() => import("./pages/PolitiqueConfidentialite"));
const DossierConfirmation = lazyWithTimeout(() => import("./pages/DossierConfirmation"));
const ConditionsUtilisation = lazyWithTimeout(() => import("./pages/ConditionsUtilisation"));
const Accessibility = lazyWithTimeout(() => import("./pages/Accessibility"));
const Sitemap = lazyWithTimeout(() => import("./pages/Sitemap"));
const ServiceStatus = lazyWithTimeout(() => import("./pages/ServiceStatus"));
const EmployerPortal = lazyWithTimeout(() => import("./pages/EmployerPortal"));
const AdminEvaluation = lazyWithTimeout(() => import("./pages/AdminEvaluation"));
const AdminLogin = lazyWithTimeout(() => import("./pages/AdminLogin"));
const AdminChangePasswordRequired = lazyWithTimeout(() => import("./pages/AdminChangePasswordRequired"));
const AdminEvaluations = lazyWithTimeout(() => import("./pages/AdminEvaluations"));
const Tourism = lazyWithTimeout(() => import("./pages/Tourism"));
import { FloatingActionMenu } from "./components/FloatingActionMenu";
import { SmartFlightAssistant } from "./components/SmartFlightAssistant";
import ConfirmEmail from "./pages/ConfirmEmail";
const SubmitDocuments = lazyWithTimeout(() => import("./pages/SubmitDocuments"));
const HowItWorks = lazyWithTimeout(() => import("./pages/HowItWorks"));
const EvisaDetailPage = lazyWithTimeout(() => import("./pages/EvisaDetailPage"));
const DocumentUploadPage = lazyWithTimeout(() => import("./pages/DocumentUploadPage"));
const DocumentCompliancePage = lazyWithTimeout(() => import("./pages/DocumentCompliancePage"));
const PaymentSuccessPage = lazyWithTimeout(() => import("./pages/PaymentSuccessPage"));
const PaymentErrorPage = lazyWithTimeout(() => import("./pages/PaymentErrorPage"));
import AiCopilotWidgetEnhanced from "./components/AiCopilotWidgetEnhanced";
const MultiServiceCart = lazyWithTimeout(() => import("./pages/MultiServiceCart"));
const FlightBookingCheckout = lazyWithTimeout(() => import("./pages/FlightBookingCheckout"));
import { MultiServiceCartProvider } from "./contexts/MultiServiceCartContext";
import { OfficeContactProvider } from "./contexts/OfficeContactContext";
import { FloatingWidgetsPreferencesProvider, useFloatingWidgetsPreferences } from "./contexts/FloatingWidgetsPreferencesContext";
import { HighContrastProvider } from "./contexts/HighContrastContext";

import AdminGuard from "./components/AdminGuard";
const Tarifs = lazyWithTimeout(() => import("./pages/Tarifs"));
const Avis = lazyWithTimeout(() => import("./pages/Avis"));
const OfficialSources = lazyWithTimeout(() => import("./pages/OfficialSources"));
const Blog = lazyWithTimeout(() => import("./pages/Blog"));
const StudyDestinationArticle = lazyWithTimeout(() => import("./pages/StudyDestinationArticle"));
const EvaluationSpace = lazyWithTimeout(() => import("./pages/EvaluationSpace"));
const AdminDashboard = lazyWithTimeout(() => import("./pages/AdminDashboard"));
const AdminSecurityTotp = lazyWithTimeout(() => import("./pages/AdminSecurityTotp"));
const AdminEmailCenter = lazyWithTimeout(() => import("./pages/AdminEmailCenter"));
const AdminEmailSettings = lazyWithTimeout(() => import("./pages/AdminEmailSettings"));
const FlightAgentDashboard = lazyWithTimeout(() => import("./pages/FlightAgentDashboard"));
const AmbassadorProgram = lazyWithTimeout(() => import("./pages/AmbassadorProgram"));
const CinetPayPayment = lazyWithTimeout(() => import("./pages/CinetPayPayment"));
const PaymentMethodSelection = lazyWithTimeout(() => import("./pages/PaymentMethodSelection"));
const PaymentAgencyConfirmation = lazyWithTimeout(() => import("./pages/PaymentAgencyConfirmation"));
const AdminCustomerReviews = lazyWithTimeout(() => import("./pages/AdminCustomerReviews"));
const AdminInsuranceRequests = lazyWithTimeout(() => import("./pages/AdminInsuranceRequests"));
const AdminAccessRecovery = lazyWithTimeout(() => import("./pages/AdminAccessRecovery"));
const ClientCaseTracking = lazyWithTimeout(() => import("./pages/ClientCaseTracking"));
import { useSessionTimeout } from "./_core/hooks/useSessionTimeout";
import Navbar from "./components/Navbar";
import { FooterLegal } from "./components/FooterLegal";
import PageTransition from "./components/PageTransition";
import PageLoadingFallback from "./components/PageLoadingFallback";
import ChunkReloadNotice from "./components/ChunkReloadNotice";
import NavigationProgress from "./components/NavigationProgress";
import PwaStatusNotice from "./components/PwaStatusNotice";

const FlightFavorites = lazyWithTimeout(() => import("./pages/FlightFavorites"));
const AdminAIEvaluationDashboard = lazyWithTimeout(() => import("./pages/AdminAIEvaluationDashboard"));
const CVGenerator = lazyWithTimeout(() => import("./pages/CVGenerator"));
const Admin = lazyWithTimeout(() => import("./pages/Admin"));
const ProceduresAdvanced = lazyWithTimeout(() => import("./pages/ProceduresAdvanced"));
const CountryComparisonPage = lazyWithTimeout(() => import("./pages/CountryComparisonPage"));
const EvisasAdvanced = lazyWithTimeout(() => import("./pages/EvisasAdvanced"));
const Evaluation = lazyWithTimeout(() => import("./pages/Evaluation"));
const PrimeJourney = lazyWithTimeout(() => import("./pages/PrimeJourney"));
const Community = lazyWithTimeout(() => import("./pages/Community"));
const AdminDigitalServices = lazyWithTimeout(() => import("./pages/AdminDigitalServices"));

function Router() {
  // Gérer l'inactivité et la déconnexion automatique
  useSessionTimeout();
  return (
    <Switch>
      {/* Pages publiques (SANS authentification) */}
      <Route path={"/"} component={Home} />
      <Route path={"/register"} component={Register} />
      <Route path={"/signup"} component={Register} />
      <Route path={"/confirm-email"} component={ConfirmEmail} />
      <Route path={"/login"} component={Login} />
      <Route path={"/parcours"} component={PrimeJourney} />
      <Route path={"/3m-digital"} component={Community} />
      <Route path={"/communaute"}>{() => <Redirect to="/3m-digital" />}</Route>
      <Route path={"/evaluation-canada"}>{() => <Redirect to="/evaluation?source=facebook&campaign=Canada" />}</Route>
      <Route path={"/evaluation"}>
        <AuthGuard message="Vous devez créer un compte pour faire votre évaluation.">
          <Evaluation />
        </AuthGuard>
      </Route>
      <Route path={"/mon-espace"}>
        <AuthGuard message="Veuillez créer un compte ou vous connecter pour accéder à votre espace.">
          <EvaluationSpace />
        </AuthGuard>
      </Route>
      <Route path={"/verify-email"} component={VerifyEmail} />
      <Route path={"/verify-email-link"} component={VerifyEmailLink} />
      <Route path={"/verify-email-sent"} component={VerifyEmailSent} />
      <Route path={"/confirm-email-change"} component={ConfirmEmailChange} />
      <Route path={"/assistance-acces"} component={AccessRecoveryRequest} />
      <Route path={"/complete-profile"} component={CompleteProfile} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/payment/method-selection"} component={PaymentMethodSelection} />
      <Route path={"/payment/agency-confirmation"} component={PaymentAgencyConfirmation} />
      <Route path={"/payment/success"} component={PaymentSuccessPage} />
      <Route path={"/payment/error"} component={PaymentErrorPage} />
      <Route path={"/payment/:dossierNumber"} component={CinetPayPayment} />

      {/* Pages protégées — nécessitent un compte 3M Travel */}
      <Route path={"/flights"} component={Flights} />
      <Route path={"/billets"} component={Billets} />
      <Route path={"/3m-booking"} component={Billets} />
      <Route path={"/vols"}>{() => <Redirect to="/flights" />}</Route>
      <Route path={"/assurance"} component={AssuranceInscription} />
      <Route path={"/assurance-inscription"} component={AssuranceInscription} />
      <Route path={"/insurance"}>{() => <Redirect to="/assurance" />}</Route>
      <Route path={"/evisa"} component={Evisa} />
        <Route path={"/evisa-demande"}>{() => <Redirect to="/evisas/request" />}</Route>
      <Route path={"/about"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/politique-confidentialite"} component={PolitiqueConfidentialite} />
      <Route path={"/conditions-utilisation"} component={ConditionsUtilisation} />
      <Route path={"/accessibilite"} component={Accessibility} />
      <Route path={"/plan-du-site"} component={Sitemap} />
      <Route path={"/etat-du-service"} component={ServiceStatus} />
      <Route path={"/employeurs"} component={EmployerPortal} />
      <Route path={"/traduction/order"} component={TranslationOrder} />
      {/* Entrée historique : l’espace client unique est désormais /mon-espace. */}
      <Route path={"/dashboard"}>{() => <Redirect to="/mon-espace" />}</Route>

      {/* Ouverture de dossier & paiement */}
      <Route path={"/open-dossier"}>
        <AuthGuard message="Vous devez créer un compte pour ouvrir un dossier.">
          <OpenDossier />
        </AuthGuard>
      </Route>
      <Route path={"/verify-application-email"} component={VerifyApplicationEmail} />
      <Route path={"/payment-success"} component={PaymentSuccess} />
      <Route path={"/payment-failed"} component={PaymentFailed} />
      <Route path={"/dossier-confirmation"} component={DossierConfirmation} />

      {/* Suivi de dossier candidat */}
      <Route path={"/mon-dossier"} component={MonDossier} />
      <Route path={"/suivi-client"} component={ClientCaseTracking} />

      {/* Mon Espace Candidat — aliases historiques vers l’espace client unique. */}
      <Route path={"/candidate/login"}>{() => <Redirect to="/login" />}</Route>
      <Route path={"/mon-espace-candidat"}>{() => <Redirect to="/mon-espace" />}</Route>
      <Route path={"/my-space"}>{() => <Redirect to="/mon-espace" />}</Route>

      {/* Depot des documents */}
      <Route path={"/submit-documents"}>
        <AuthGuard message="Vous devez créer un compte pour soumettre vos documents.">
          <SubmitDocuments />
        </AuthGuard>
      </Route>

      {/* Prise de rendez-vous en agence */}

      {/* Programme Ambassadeur */}
      <Route path={"/ambassador-program"} component={AmbassadorProgram} />

      {/* Générateur de CV */}
      <Route path={"/cv-generator"} component={CVGenerator} />

      {/* Résultat d'évaluation */}
      <Route path={"/evaluation-result"} component={EvaluationResult} />

      {/* Comment ca marche */}
      <Route path={"/how-it-works"} component={HowItWorks} />
      <Route path={"/canada"} component={Canada} />
      <Route path={"/schengen"} component={Schengen} />
      <Route path={"/etudes"} component={VisaEtudes} />
      <Route path={"/visa-etudes"}>{() => <Redirect to="/etudes" />}</Route>
      <Route path={"/formation"} component={Formation} />
      <Route path="/procedures" component={ProceduresAdvanced} />
      {/* Aliases legacy : certains anciens CTA utilisaient le singulier. */}
      <Route path="/procedure">{() => <Redirect to="/procedures" />}</Route>
      <Route path="/procedures/comparaison" component={CountryComparisonPage} />
      <Route path="/conformite-documents" component={DocumentCompliancePage} />
      <Route path="/procedures/canada">{() => <Redirect to="/canada" />}</Route>
      <Route path="/procedures/schengen">{() => <Redirect to="/schengen" />}</Route>
      <Route path={"/procedures/luxembourg"} component={ProcedureLuxembourg} />
      <Route path="/destinations/:countryId" component={CountryDetailPage} />
      <Route path="/procedures/:countryId" component={CountryDetailPage} />
      <Route path={"/procedures-complete"}>{() => <Redirect to="/procedures" />}</Route>
      <Route path={"/procedures-enhanced"}>{() => <Redirect to="/procedures" />}</Route>
      <Route path={"/procedures-advanced"}>{() => <Redirect to="/procedures" />}</Route>
      <Route path={"/evaluation-rapide"}>{() => <Redirect to="/#evaluation-multi" />}</Route>
      <Route path={"/evaluation-rapide-enhanced"}>{() => <Redirect to="/#evaluation-multi" />}</Route>
      <Route path={"/admin/dossiers"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminDashboard />
        </AdminGuard>
      </Route>
      <Route path={"/admin/recuperation-acces"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminAccessRecovery />
        </AdminGuard>
      </Route>
      <Route path={"/admin/securite"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminSecurityTotp />
        </AdminGuard>
      </Route>
      <Route path={"/admin/emails"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminEmailCenter />
        </AdminGuard>
      </Route>
      <Route path={"/admin/email-settings"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminEmailSettings />
        </AdminGuard>
      </Route>
      <Route path={"/evaluation-primaire"}>{() => <Redirect to="/#evaluation-multi" />}</Route>
      <Route path={"/simple-signup"}>{() => <Redirect to="/register" />}</Route>
      <Route path={"/schedule-agency"}>{() => <Redirect to="/contact" />}</Route>
      <Route path={"/visa-types"}>{() => <Redirect to="/procedures" />}</Route>
      {/* Prototypes historiques : redirigés vers l’espace client synchronisé. */}
      <Route path={"/mon-espace-enhanced"}>{() => <Redirect to="/mon-espace" />}</Route>
      <Route path={"/mon-espace-v2"}>{() => <Redirect to="/mon-espace" />}</Route>
      <Route path={"/document-upload"} component={DocumentUploadPage} />

      {/* Bibliothèque de ressources PDF */}
      <Route path={"/ressources"} component={Ressources} />
      <Route path={"/guide-procedures"} component={ProcedureResourceGuide} />

      {/* Fiches détaillées par pays */}
      <Route path={"/fiches"} component={Fiches} />

      {/* Tarifs, Avis, Blog */}
      <Route path={"/tarifs"} component={Tarifs} />
      <Route path={"/sources-officielles"} component={OfficialSources} />
      <Route path={"/avis"} component={Avis} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/blog/etudes/:slug"} component={StudyDestinationArticle} />
      <Route path={"/evisas"} component={EvisasAdvanced} />
      {/* Alias legacy e-design/e-visa : conserve les anciens liens sans dupliquer la page. */}
      <Route path={"/e-design"}>{() => <Redirect to="/evisas" />}</Route>
      <Route path={"/evisa/:evisaId"} component={EvisaDetailPage} />
      <Route path={"/evisas-enhanced"}>{() => <Redirect to="/evisas" />}</Route>
      <Route path={"/evisas-v3"}>{() => <Redirect to="/evisas" />}</Route>
      <Route path={"/evisas/request"}>
        <EvisaRequestForm />
      </Route>

      {/* Routes Hotels */}
      <Route path="/tourisme" component={Tourism} />
      <Route path="/hotels">{() => <Redirect to="/tourisme" />}</Route>

      {/* Traduction assermentée */}

      {/* Panneau admin — URL secrète d'accès */}
      <Route path={"/admin/access-secret"} component={AdminLogin} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin/change-password"}>
        {() => {
          const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('adminSessionToken') || '' : '';
          const adminEmail = typeof window !== 'undefined' ? sessionStorage.getItem('adminEmail') || '' : '';
          return (
            <AdminChangePasswordRequired
              sessionToken={sessionToken}
              adminEmail={adminEmail}
              onPasswordChanged={() => window.location.href = '/admin/dashboard'}
            />
          );
        }}
      </Route>
      <Route path={"/admin/dashboard"}>
        <AdminGuard message="Vous devez vous connecter en tant qu'administrateur pour accéder au tableau de bord.">
          <Admin />
        </AdminGuard>
      </Route>
      <Route path={"/admin/super-dashboard"}>
        <AdminGuard message="Accès réservé aux administrateurs de 3M Travel Agency.">
          <SuperAdminDashboard />
        </AdminGuard>
      </Route>
      <Route path={"/admin/flight-requests"}>
        <AdminGuard message="Accès réservé aux agents et administrateurs de 3M Travel Agency.">
          <FlightAgentDashboard />
        </AdminGuard>
      </Route>
      <Route path={"/admin/consultation-requests"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminConsultationRequests />
        </AdminGuard>
      </Route>
      <Route path={"/admin/digital-services"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminDigitalServices />
        </AdminGuard>
      </Route>
      <Route path={"/admin/insurance-requests"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminInsuranceRequests />
        </AdminGuard>
      </Route>
      <Route path={"/admin/ai-evaluations"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminAIEvaluationDashboard />
        </AdminGuard>
      </Route>
      {/* Redirection /admin → / pour masquer l'existence du panneau */}
      <Route path={"/admin"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminDashboard />
        </AdminGuard>
      </Route>
      <Route path={"/admin/add-dossier"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminAddDossier />
        </AdminGuard>
      </Route>
      <Route path={"/admin/document-verification"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminDocumentVerification />
        </AdminGuard>
      </Route>
      <Route path={"/admin/evaluation"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminEvaluation />
        </AdminGuard>
      </Route>
      <Route path={"/admin/accompagnement"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminAccompagnement />
        </AdminGuard>
      </Route>
      <Route path={"/admin/procedures"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminProcedures />
        </AdminGuard>
      </Route>
      <Route path={"/admin/destination-media"}>
        <AdminGuard>
          <AdminDestinationMedia />
        </AdminGuard>
      </Route>
      <Route path={"/admin/media-library"}>
        <AdminGuard>
          <AdminMediaLibrary />
        </AdminGuard>
      </Route>
      <Route path={"/admin/evaluations"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminEvaluations />
        </AdminGuard>
      </Route>
      <Route path={"/admin/candidates"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <CandidatesManager />
        </AdminGuard>
      </Route>
      <Route path={"/admin/admins"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminsList />
        </AdminGuard>
      </Route>
      <Route path={"/admin/users"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminUsersManagement />
        </AdminGuard>
      </Route>
      <Route path={"/admin/payment-validation"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminDashboard />
        </AdminGuard>
      </Route>
      <Route path={"/admin/customer-reviews"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminCustomerReviews />
        </AdminGuard>
      </Route>
      {/* Ancien lien indexé : le parcours public canonique reste l’évaluation sur l’accueil. */}
      <Route path={"/submit-review"}>{() => <Redirect to="/?source=legacy-submit-review#evaluation-multi" />}</Route>
      <Route path={"/admin/users/:userId"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminUserDetails />
        </AdminGuard>
      </Route>
      <Route path={"/admin/agency-dossiers"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminAgencyDossiers />
        </AdminGuard>
      </Route>
      <Route path={"/admin/verifier-dossier"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminDossierVerification />
        </AdminGuard>
      </Route>

      {/* Ancien tableau de bord : redirection conservant les liens partagés. */}
      <Route path="/client-dashboard">{() => <Redirect to="/mon-espace" />}</Route>
      <Route path="/mes-vols-favoris">
        <AuthGuard message="Vous devez créer un compte pour gérer vos vols favoris.">
          <FlightFavorites />
        </AuthGuard>
      </Route>

      <Route path="/panier">
        <MultiServiceCart />
      </Route>
      <Route path="/flight-booking/:flightId">
        <FlightBookingCheckout />
      </Route>



      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const [location] = useLocation();
  const { widgetsVisible } = useFloatingWidgetsPreferences();
  // Les accès authentifiés sont vérifiés par les procédures serveur et les cookies
  // HttpOnly : aucune session ou identité n’est restaurée depuis le navigateur.
  const sessionRestored = true;
  const normalizedLocation = location.replace(/\/+$/, "") || "/";
  const isAccessRoute = ["/login", "/register", "/signup", "/evaluation", "/mon-espace", "/mon-dossier", "/document-upload", "/assistance-acces", "/confirm-email-change"].some(
    (path) => normalizedLocation === path,
  );
  const showFloatingTools = widgetsVisible && location !== "/contact" && !isAccessRoute;
  const showPublicFooter = !location.startsWith("/admin");

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <AnimationPreferencesProvider>
          <FontSizePreferencesProvider>
            <LanguageProvider>
              <TooltipProvider>
                <OfficeContactProvider>
                  <MultiServiceCartProvider>
                  <SessionLoader isLoading={!sessionRestored} />
                  <Toaster />
                  <ChunkReloadNotice />
                  <PwaStatusNotice />
                  {sessionRestored && (
                    <>
                      {/* Header global visible sur toutes les pages avec barre de progression de chargement */}
                      <NavigationProgress />
                      <Navbar />
                      {/* Contenu des pages avec transition douce entre les routes */}
                      <div className={`app-content flex min-w-0 flex-1 flex-col ${!location.startsWith("/admin") ? "secondary-page-surface" : ""}`}>
                        <PageTransition>
                          <React.Suspense fallback={<PageLoadingFallback />}>
                            <Router />
                          </React.Suspense>
                        </PageTransition>
                      </div>
                      {showPublicFooter && <FooterLegal />}
                      {/* Menu d'actions flottantes unifié */}
                      {showFloatingTools && <FloatingActionMenu />}
                      {/* Guide d’information flottant */}
                      {showFloatingTools && <AiCopilotWidgetEnhanced />}
                      {/* Assistant intelligent de réservation de vol */}
                      {showFloatingTools && <SmartFlightAssistant />}
                    </>
                  )}
                  </MultiServiceCartProvider>
                </OfficeContactProvider>
              </TooltipProvider>
            </LanguageProvider>
          </FontSizePreferencesProvider>
        </AnimationPreferencesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <FloatingWidgetsPreferencesProvider>
      <HighContrastProvider>
        <AppShell />
      </HighContrastProvider>
    </FloatingWidgetsPreferencesProvider>
  );
}
