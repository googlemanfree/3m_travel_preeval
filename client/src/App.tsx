import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthGuard from "./components/AuthGuard";
import SessionLoader from "./components/SessionLoader";
import Home from "./pages/Home";
import Flights from "./pages/Flights";
import Vols from "./pages/Vols";
import ProceduresResources from "./pages/ProceduresResources";
import ProcedureLuxembourg from "./pages/ProcedureLuxembourg";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "@/pages/VerifyEmail";
import VerifyEmailLink from "@/pages/VerifyEmailLink";
import VerifyEmailSent from "@/pages/VerifyEmailSent";
import CompleteProfile from "@/pages/CompleteProfile";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OpenDossier from "./pages/OpenDossier";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import VerifyApplicationEmail from "./pages/VerifyApplicationEmail";
import Admin from "./pages/Admin";
import AdminConsultationRequests from "./pages/AdminConsultationRequests";
import VisaTypes from "./pages/VisaTypes";
import VisaEtudes from "./pages/VisaEtudes";
import Destinations from "./pages/Destinations";
import Guide from "./pages/Guide";
import MonDossier from "./pages/MonDossier";
import Ressources from "./pages/Ressources";
import Fiches from "./pages/Fiches";
import Assurance from "./pages/Assurance";
import TranslationOrder from "./pages/TranslationOrder";
import AssuranceInscription from "./pages/AssuranceInscription";
import Evisa from "./pages/Evisa";
import EvisaDemande from "./pages/EvisaDemande";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import DossierConfirmation from "./pages/DossierConfirmation";
import ConditionsUtilisation from "./pages/ConditionsUtilisation";
import AdminEvaluation from "./pages/AdminEvaluation";
import AdminAccompagnement from "./pages/AdminAccompagnement";
import AdminProcedures from "./pages/AdminProcedures";
import AdminLogin from "./pages/AdminLogin";
import AdminChangePasswordRequired from "./pages/AdminChangePasswordRequired";
import AdminEvaluations from "./pages/AdminEvaluations";
import Hotels from "./pages/Hotels";
import { FloatingActionMenu } from "./components/FloatingActionMenu";
import CandidatesManager from "./pages/CandidatesManager";
import SignUp from "./pages/SignUp";
import SimpleSignUp from "./pages/SimpleSignUp";
import ConfirmEmail from "./pages/ConfirmEmail";
import ResetPasswordSimple from "./pages/ResetPasswordSimple";
import AdminsList from "./pages/AdminsList";
import AdminAgencyDossiers from "./pages/AdminAgencyDossiers";
import SubmitDocuments from "./pages/SubmitDocuments";
import ClientDashboard from "./pages/ClientDashboard";
import HowItWorks from "./pages/HowItWorks";
import MySpace from "./pages/MySpace";

import AdminGuard from "./components/AdminGuard";
import AdminUsersManagement from "./pages/AdminUsersManagement";
import AdminUserDetails from "./pages/AdminUserDetails";
import Tarifs from "./pages/Tarifs";
import Avis from "./pages/Avis";
import Blog from "./pages/Blog";
import SearchDemo from "./pages/SearchDemo";
import Evaluation from "./pages/Evaluation";
import EvaluationSpace from "./pages/EvaluationSpace";
import AdminAddDossier from "./pages/AdminAddDossier";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDocumentVerification from "./pages/AdminDocumentVerification";
import AmbassadorProgram from "./pages/AmbassadorProgram";
import CVGenerator from "./pages/CVGenerator";
import EvaluationResult from "./pages/EvaluationResult";
import ScheduleAgency from "./pages/ScheduleAgency";
import ComponentsShowcase from "./pages/ComponentShowcase";
import AppointmentBooking from "./pages/AppointmentBooking";
import AdminEmailTemplates from "./pages/AdminEmailTemplates";
import CinetPayPayment from "./pages/CinetPayPayment";
import EvisasPage from "./pages/Evisas";
import EvisaApplicationForm from "./pages/EvisaApplicationForm";
import MyFavorites from "./pages/MyFavorites";
import EvisaRequestForm from "./pages/EvisaRequestForm";
import { useSessionTimeout } from "./_core/hooks/useSessionTimeout";
import React from "react";
import Navbar from "./components/Navbar";
import AdminEvisaDashboard from "./pages/AdminEvisaDashboard";
import AdminEvisaDetail from "./pages/AdminEvisaDetail";

function Router() {
  // Gérer l'inactivité et la déconnexion automatique
  useSessionTimeout();
  return (
    <Switch>
      {/* Pages publiques (SANS authentification) */}
      <Route path={"/"} component={Home} />
      <Route path={"/register"} component={Register} />
      <Route path={"/signup"} component={SignUp} />
      <Route path={"/simple-signup"} component={SimpleSignUp} />
      <Route path={"/confirm-email"} component={ConfirmEmail} />
      <Route path={"/forgot-password-simple"} component={ResetPasswordSimple} />
      <Route path={"/login"} component={Login} />
      <Route path={"/search"} component={SearchDemo} />
      <Route path={"/evaluation"}>
        <AuthGuard message="Vous devez créer un compte pour faire votre évaluation.">
          <Evaluation />
        </AuthGuard>
      </Route>
      <Route path={"/mon-espace"} component={EvaluationSpace} />
      <Route path={"/rdv"} component={AppointmentBooking} />
      <Route path={"/verify-email"} component={VerifyEmail} />
      <Route path={"/verify-email-link"} component={VerifyEmailLink} />
      <Route path={"/verify-email-sent"} component={VerifyEmailSent} />
      <Route path={"/complete-profile"} component={CompleteProfile} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/payment/:dossierNumber"} component={CinetPayPayment} />

      {/* Pages protégées — nécessitent un compte 3M Travel */}
      <Route path={"/flights"} component={Flights} />
      <Route path={"/vols"} component={Vols} />
      <Route path="/procedures" component={ProceduresResources} />
      <Route path="/procedures/luxembourg" component={ProcedureLuxembourg} />
      <Route path={"/assurance"} component={Assurance} />
      <Route path={"/assurance-inscription"} component={AssuranceInscription} />
      <Route path={"/evisa"} component={Evisa} />
      <Route path={"/evisa-demande"} component={EvisaDemande} />
      <Route path={"/about"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/politique-confidentialite"} component={PolitiqueConfidentialite} />
      <Route path={"/conditions-utilisation"} component={ConditionsUtilisation} />
      <Route path={"/traduction/order"} component={TranslationOrder} />
      <Route path={"/guide"} component={Guide} />
      <Route path={"/visa-types"} component={VisaTypes} />
      <Route path={"/visa-etudes"} component={VisaEtudes} />
      <Route path={"/destinations"} component={Destinations} />
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
      <Route path={"/schedule-agency"} component={ScheduleAgency} />

      {/* Programme Ambassadeur */}
      <Route path={"/ambassador-program"} component={AmbassadorProgram} />

      {/* Générateur de CV */}
      <Route path={"/cv-generator"} component={CVGenerator} />

      {/* Résultat d'évaluation */}
      <Route path={"/evaluation-result"} component={EvaluationResult} />

      {/* Vitrine des composants (usage interne / référence design) */}
      <Route path={"/component-showcase"} component={ComponentsShowcase} />

      {/* Comment ca marche */}
      <Route path={"/how-it-works"} component={HowItWorks} />

      {/* Bibliothèque de ressources PDF */}
      <Route path={"/ressources"} component={Ressources} />

      {/* Fiches détaillées par pays */}
      <Route path={"/fiches"} component={Fiches} />

      {/* Tarifs, Avis, Blog */}
      <Route path={"/tarifs"} component={Tarifs} />
      <Route path={"/avis"} component={Avis} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/evisas"} component={EvisasPage} />
      <Route path={"/evisas/:countryCode"} component={EvisaApplicationForm} />
      <Route path={"/evisas/request"}>
        <EvisaRequestForm />
      </Route>
      <Route path={"/mes-favoris"}>
        <AuthGuard message="Vous devez créer un compte pour accéder à vos favoris.">
          <MyFavorites />
        </AuthGuard>
      </Route>

      {/* Routes Hotels */}

      {/* Traduction assermentée */}

      {/* Panneau admin — URL secrète d'accès */}
      <Route path={"/admin/access-secret"} component={AdminLogin} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin/change-password"}>
        {() => {
          const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('adminSessionToken') || '' : '';
          const adminEmail = typeof window !== 'undefined' ? localStorage.getItem('adminEmail') || '' : '';
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
      <Route path={"admin/agency-dossiers"}>
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminAgencyDossiers />
        </AdminGuard>
      </Route>
      <Route path="/admin/email-templates">
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminEmailTemplates />
        </AdminGuard>
      </Route>
      <Route path="/admin/evisa">
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminEvisaDashboard />
        </AdminGuard>
      </Route>
      <Route path="/admin/evisa/:id">
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminEvisaDetail />
        </AdminGuard>
      </Route>

      <Route path="/client-dashboard">
        <AuthGuard>
          <ClientDashboard />
        </AuthGuard>
      </Route>

      <Route path="/hotels">
        <Hotels />
      </Route>

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // État pour gérer la restauration de la session
  const [sessionRestored, setSessionRestored] = React.useState(false);

  React.useEffect(() => {
    // Vérifier si une session est présente dans localStorage
    const savedToken = localStorage.getItem('3m_auth_token');
    const savedUser = localStorage.getItem('3m_user');

    if (savedToken && savedUser) {
      // Attendre un peu pour montrer le loader
      const timer = setTimeout(() => {
        localStorage.setItem('3m_session_restored', 'true');
        setSessionRestored(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // Pas de session, marquer comme restauré immédiatement
      localStorage.setItem('3m_session_restored', 'true');
      setSessionRestored(true);
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SessionLoader isLoading={!sessionRestored} />
          <Toaster />
          {sessionRestored && (
            <>
              {/* Header global visible sur toutes les pages */}
              <Navbar />
              {/* Contenu des pages */}
              <Router />
              {/* Menu d'actions flottantes unifié */}
              <FloatingActionMenu />
            </>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
