import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { lazyWithTimeout } from "./lib/lazyWithTimeout";
import { TooltipProvider } from "@/components/ui/tooltip";
const NotFound = lazyWithTimeout(() => import("./pages/NotFound"));
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AnimationPreferencesProvider } from "./contexts/AnimationPreferencesContext";
import AuthGuard from "./components/AuthGuard";
import SessionLoader from "./components/SessionLoader";
import Home from "./pages/Home";
const Flights = lazyWithTimeout(() => import("./pages/Flights"));
const Vols = lazyWithTimeout(() => import("./pages/Vols"));
const Register = lazyWithTimeout(() => import("./pages/Register"));
const Login = lazyWithTimeout(() => import("./pages/Login"));
const VerifyEmail = lazyWithTimeout(() => import("./pages/VerifyEmail"));
const VerifyEmailLink = lazyWithTimeout(() => import("./pages/VerifyEmailLink"));
const VerifyEmailSent = lazyWithTimeout(() => import("./pages/VerifyEmailSent"));
const CompleteProfile = lazyWithTimeout(() => import("./pages/CompleteProfile"));
const ForgotPassword = lazyWithTimeout(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithTimeout(() => import("./pages/ResetPassword"));
const OpenDossier = lazyWithTimeout(() => import("./pages/OpenDossier"));
const PaymentSuccess = lazyWithTimeout(() => import("./pages/PaymentSuccess"));
const PaymentFailed = lazyWithTimeout(() => import("./pages/PaymentFailed"));
const VerifyApplicationEmail = lazyWithTimeout(() => import("./pages/VerifyApplicationEmail"));
const AdminConsultationRequests = lazyWithTimeout(() => import("./pages/AdminConsultationRequests"));
const AdminsList = lazyWithTimeout(() => import("./pages/AdminsList"));
const CandidatesManager = lazyWithTimeout(() => import("./pages/CandidatesManager"));
const AdminAccompagnement = lazyWithTimeout(() => import("./pages/AdminAccompagnement"));
const ResetPasswordSimple = lazyWithTimeout(() => import("./pages/ResetPasswordSimple"));
const SimpleSignUp = lazyWithTimeout(() => import("./pages/SimpleSignUp"));
const AdminAgencyDossiers = lazyWithTimeout(() => import("./pages/AdminAgencyDossiers"));
const MySpace = lazyWithTimeout(() => import("./pages/MySpace"));
const AdminUsersManagement = lazyWithTimeout(() => import("./pages/AdminUsersManagement"));
const AdminAddDossier = lazyWithTimeout(() => import("./pages/AdminAddDossier"));
import { AdminDocumentVerification } from "./pages/AdminDocumentVerification";
const AdminProcedures = lazyWithTimeout(() => import("./pages/AdminProcedures"));
const AdminDestinationMedia = lazyWithTimeout(() => import("./pages/AdminDestinationMedia"));
const AdminMediaLibrary = lazyWithTimeout(() => import("./pages/AdminMediaLibrary"));
const AdminUserDetails = lazyWithTimeout(() => import("./pages/AdminUserDetails"));
const VisaEtudes = lazyWithTimeout(() => import("./pages/VisaEtudes"));
const ProcedureLuxembourg = lazyWithTimeout(() => import("./pages/ProcedureLuxembourg"));
const MonDossier = lazyWithTimeout(() => import("./pages/MonDossier"));
const EvisaRequestForm = lazyWithTimeout(() => import("./pages/EvisaRequestForm"));
const EvaluationResult = lazyWithTimeout(() => import("./pages/EvaluationResult"));
const Ressources = lazyWithTimeout(() => import("./pages/Ressources"));
const ProcedureResourceGuide = lazyWithTimeout(() => import("./pages/ProcedureResourceGuide"));
const Fiches = lazyWithTimeout(() => import("./pages/Fiches"));
const Assurance = lazyWithTimeout(() => import("./pages/Assurance"));
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
const AdminEvaluation = lazyWithTimeout(() => import("./pages/AdminEvaluation"));
const AdminLogin = lazyWithTimeout(() => import("./pages/AdminLogin"));
const AdminChangePasswordRequired = lazyWithTimeout(() => import("./pages/AdminChangePasswordRequired"));
const AdminEvaluations = lazyWithTimeout(() => import("./pages/AdminEvaluations"));
const Hotels = lazyWithTimeout(() => import("./pages/Hotels"));
import { FloatingActionMenu } from "./components/FloatingActionMenu";
const SignUp = lazyWithTimeout(() => import("./pages/SignUp"));
const ConfirmEmail = lazyWithTimeout(() => import("./pages/ConfirmEmail"));
const SubmitDocuments = lazyWithTimeout(() => import("./pages/SubmitDocuments"));
const HowItWorks = lazyWithTimeout(() => import("./pages/HowItWorks"));
const Procedures = lazyWithTimeout(() => import("./pages/Procedures"));
const ProceduresComplete = lazyWithTimeout(() => import("./pages/ProceduresComplete"));
const ProceduresEnhanced = lazyWithTimeout(() => import("./pages/ProceduresEnhanced"));
const EvisaDetailPage = lazyWithTimeout(() => import("./pages/EvisaDetailPage"));
const AIEvaluation = lazyWithTimeout(() => import("./pages/AIEvaluation"));
const EvaluationRapideEnhanced = lazyWithTimeout(() => import("./pages/EvaluationRapideEnhanced"));
const ClientSpace = lazyWithTimeout(() => import("./pages/ClientSpace"));
const AdminDossierManagement = lazyWithTimeout(() => import("./pages/AdminDossierManagement"));
const PrimaryEvaluationForm = lazyWithTimeout(() => import("./pages/PrimaryEvaluationForm"));
const AdminEvaluationValidation = lazyWithTimeout(() => import("./pages/AdminEvaluationValidation"));
const ClientSpaceEnhanced = lazyWithTimeout(() => import("./pages/ClientSpaceEnhanced"));
const DocumentUploadPage = lazyWithTimeout(() => import("./pages/DocumentUploadPage"));
const DocumentCompliancePage = lazyWithTimeout(() => import("./pages/DocumentCompliancePage"));
const PaymentSuccessPage = lazyWithTimeout(() => import("./pages/PaymentSuccessPage"));
const PaymentErrorPage = lazyWithTimeout(() => import("./pages/PaymentErrorPage"));
import AiCopilotWidgetEnhanced from "./components/AiCopilotWidgetEnhanced";
const MultiServiceCart = lazyWithTimeout(() => import("./pages/MultiServiceCart"));
const FlightBookingCheckout = lazyWithTimeout(() => import("./pages/FlightBookingCheckout"));
import { MultiServiceCartProvider } from "./contexts/MultiServiceCartContext";

import AdminGuard from "./components/AdminGuard";
const Tarifs = lazyWithTimeout(() => import("./pages/Tarifs"));
const Avis = lazyWithTimeout(() => import("./pages/Avis"));
const Blog = lazyWithTimeout(() => import("./pages/Blog"));
const EvaluationSpace = lazyWithTimeout(() => import("./pages/EvaluationSpace"));
const AdminDashboard = lazyWithTimeout(() => import("./pages/AdminDashboard"));
const AmbassadorProgram = lazyWithTimeout(() => import("./pages/AmbassadorProgram"));
const CinetPayPayment = lazyWithTimeout(() => import("./pages/CinetPayPayment"));
const EvisasPage = lazyWithTimeout(() => import("./pages/Evisas"));
const EvisasEnhanced = lazyWithTimeout(() => import("./pages/EvisasEnhanced"));
const EvisasV3 = lazyWithTimeout(() => import("./pages/EvisasV3"));
const PaymentMethodSelection = lazyWithTimeout(() => import("./pages/PaymentMethodSelection"));
const PaymentAgencyConfirmation = lazyWithTimeout(() => import("./pages/PaymentAgencyConfirmation"));
const AdminPaymentValidation = lazyWithTimeout(() => import("./pages/AdminPaymentValidation"));
const AdminCustomerReviews = lazyWithTimeout(() => import("./pages/AdminCustomerReviews"));
const AdminInsuranceRequests = lazyWithTimeout(() => import("./pages/AdminInsuranceRequests"));
const ClientCaseTracking = lazyWithTimeout(() => import("./pages/ClientCaseTracking"));
const SubmitReview = lazyWithTimeout(() => import("./pages/SubmitReview"));
import { useSessionTimeout } from "./_core/hooks/useSessionTimeout";
import Navbar from "./components/Navbar";
import PageTransition from "./components/PageTransition";
import PageLoadingFallback from "./components/PageLoadingFallback";
import NavigationProgress from "./components/NavigationProgress";

const ClientDashboard = lazyWithTimeout(() => import("./pages/ClientDashboard"));
const AdminAIEvaluationDashboard = lazyWithTimeout(() => import("./pages/AdminAIEvaluationDashboard"));
const CVGenerator = lazyWithTimeout(() => import("./pages/CVGenerator"));
const Dashboard = lazyWithTimeout(() => import("./pages/Dashboard"));
const Admin = lazyWithTimeout(() => import("./pages/Admin"));
const ProceduresAdvanced = lazyWithTimeout(() => import("./pages/ProceduresAdvanced"));
const CountryDetailPage = lazyWithTimeout(() => import("./pages/CountryDetailPage"));
const CountryComparisonPage = lazyWithTimeout(() => import("./pages/CountryComparisonPage"));
const EvisasAdvanced = lazyWithTimeout(() => import("./pages/EvisasAdvanced"));
const Evaluation = lazyWithTimeout(() => import("./pages/Evaluation"));
const ClientSpaceEnhancedV2 = lazyWithTimeout(() => import("./pages/ClientSpaceEnhancedV2"));

function Router() {
  // Gérer l'inactivité et la déconnexion automatique
  useSessionTimeout();
  return (
    <Switch>
      {/* Pages publiques (SANS authentification) */}
      <Route path={"/"} component={Home} />
      <Route path={"/register"} component={Register} />
      <Route path={"/signup"} component={SignUp} />
      <Route path={"/confirm-email"} component={ConfirmEmail} />
      <Route path={"/login"} component={Login} />
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
      <Route path={"/vols"}>{() => <Redirect to="/flights" />}</Route>
      <Route path={"/assurance"} component={AssuranceInscription} />
      <Route path={"/assurance-inscription"} component={AssuranceInscription} />
      <Route path={"/evisa"} component={Evisa} />
      <Route path={"/evisa-demande"} component={EvisaDemande} />
      <Route path={"/about"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/politique-confidentialite"} component={PolitiqueConfidentialite} />
      <Route path={"/conditions-utilisation"} component={ConditionsUtilisation} />
      <Route path={"/accessibilite"} component={Accessibility} />
      <Route path={"/plan-du-site"} component={Sitemap} />
      <Route path={"/traduction/order"} component={TranslationOrder} />
      <Route path={"/dashboard"}>
        <AuthGuard message="Vous devez vous connecter pour accéder à votre espace candidat." autoRedirect>
          <Dashboard />
        </AuthGuard>
      </Route>

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
      <Route path={"/mon-dossier"}>
        <AuthGuard message="Vous devez créer un compte pour suivre votre dossier.">
          <MonDossier />
        </AuthGuard>
      </Route>
      <Route path={"/suivi-client"} component={ClientCaseTracking} />

      {/* Mon Espace Candidat */}
      <Route path={"/mon-espace-candidat"}>
        <AuthGuard message="Vous devez créer un compte pour accéder à votre espace candidat.">
          <MySpace />
        </AuthGuard>
      </Route>
      <Route path={"/my-space"}>
        <AuthGuard message="Vous devez créer un compte pour accéder à votre espace candidat.">
          <MySpace />
        </AuthGuard>
      </Route>

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
      <Route path={"/visa-etudes"} component={VisaEtudes} />
      <Route path="/procedures" component={ProceduresAdvanced} />
      {/* Aliases legacy : certains anciens CTA utilisaient le singulier. */}
      <Route path="/procedure">{() => <Redirect to="/procedures" />}</Route>
      <Route path="/procedures/comparaison" component={CountryComparisonPage} />
      <Route path="/conformite-documents" component={DocumentCompliancePage} />
      <Route path={"/procedures/luxembourg"} component={ProcedureLuxembourg} />
      <Route path="/procedures/:countryId" component={CountryDetailPage} />
      <Route path={"/procedures-complete"}>{() => <Redirect to="/procedures" />}</Route>
      <Route path={"/procedures-enhanced"}>{() => <Redirect to="/procedures" />}</Route>
      <Route path={"/procedures-advanced"}>{() => <Redirect to="/procedures" />}</Route>
      <Route path={"/evaluation-rapide"}>{() => <Redirect to="/evaluation" />}</Route>
      <Route path={"/evaluation-rapide-enhanced"}>{() => <Redirect to="/evaluation" />}</Route>
      <Route path={"/admin/dossiers"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminDashboard />
        </AdminGuard>
      </Route>
      <Route path={"/evaluation-primaire"}>{() => <Redirect to="/evaluation" />}</Route>
      <Route path={"/mon-espace-enhanced"} component={ClientSpaceEnhanced} />
      <Route path={"/mon-espace-v2"} component={ClientSpaceEnhancedV2} />
      <Route path={"/document-upload"} component={DocumentUploadPage} />

      {/* Bibliothèque de ressources PDF */}
      <Route path={"/ressources"} component={Ressources} />
      <Route path={"/guide-procedures"} component={ProcedureResourceGuide} />

      {/* Fiches détaillées par pays */}
      <Route path={"/fiches"} component={Fiches} />

      {/* Tarifs, Avis, Blog */}
      <Route path={"/tarifs"} component={Tarifs} />
      <Route path={"/avis"} component={Avis} />
      <Route path={"/blog"} component={Blog} />
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
      <Route path={"/admin/consultation-requests"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminConsultationRequests />
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
      <Route path={"/submit-review"}>
        <SubmitReview />
      </Route>
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

      <Route path="/client-dashboard">
        <AuthGuard message="Vous devez créer un compte pour accéder à votre tableau de bord.">
          <ClientDashboard />
        </AuthGuard>
      </Route>

      <Route path="/hotels">
        <Hotels />
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

function App() {
  // Les accès authentifiés sont vérifiés par les procédures serveur et les cookies
  // HttpOnly : aucune session ou identité n’est restaurée depuis le navigateur.
  const sessionRestored = true;

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <AnimationPreferencesProvider>
          <TooltipProvider>
          <MultiServiceCartProvider>
          <SessionLoader isLoading={!sessionRestored} />
          <Toaster />
          {sessionRestored && (
            <>
              {/* Header global visible sur toutes les pages */}
              <Navbar />
              <NavigationProgress />
              {/* Contenu des pages avec transition douce entre les routes */}
              <PageTransition>
                <React.Suspense fallback={<PageLoadingFallback />}>
                  <Router />
                </React.Suspense>
              </PageTransition>
              {/* Menu d'actions flottantes unifié */}
              <FloatingActionMenu />
              {/* Copilote IA flottant */}
              <AiCopilotWidgetEnhanced />
            </>
          )}
          </MultiServiceCartProvider>
          </TooltipProvider>
        </AnimationPreferencesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
