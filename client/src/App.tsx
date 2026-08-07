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
import AdminsList from "./pages/AdminsList";
import CandidatesManager from "./pages/CandidatesManager";
import ClientDashboard from "./pages/ClientDashboard";
import AdminAccompagnement from "./pages/AdminAccompagnement";
import ResetPasswordSimple from "./pages/ResetPasswordSimple";
import SimpleSignUp from "./pages/SimpleSignUp";
import AdminAgencyDossiers from "./pages/AdminAgencyDossiers";
import MySpace from "./pages/MySpace";
import AdminUsersManagement from "./pages/AdminUsersManagement";
import AdminAddDossier from "./pages/AdminAddDossier";
import { AdminDocumentVerification } from "./pages/AdminDocumentVerification";
import AdminProcedures from "./pages/AdminProcedures";
import AdminUserDetails from "./pages/AdminUserDetails";
import VisaEtudes from "./pages/VisaEtudes";
import ProcedureLuxembourg from "./pages/ProcedureLuxembourg";
import MonDossier from "./pages/MonDossier";
import EvisaRequestForm from "./pages/EvisaRequestForm";
import EvaluationResult from "./pages/EvaluationResult";
import AdminAIEvaluationDashboard from "./pages/AdminAIEvaluationDashboard";
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
import AdminLogin from "./pages/AdminLogin";
import AdminChangePasswordRequired from "./pages/AdminChangePasswordRequired";
import AdminEvaluations from "./pages/AdminEvaluations";
import Hotels from "./pages/Hotels";
import { FloatingActionMenu } from "./components/FloatingActionMenu";
import SignUp from "./pages/SignUp";
import ConfirmEmail from "./pages/ConfirmEmail";
import SubmitDocuments from "./pages/SubmitDocuments";
import HowItWorks from "./pages/HowItWorks";
import Procedures from "./pages/Procedures";
import ProceduresComplete from "./pages/ProceduresComplete";
import ProceduresEnhanced from "./pages/ProceduresEnhanced";
import ProceduresAdvanced from "./pages/ProceduresAdvanced";
import AIEvaluation from "./pages/AIEvaluation";
import EvaluationRapideEnhanced from "./pages/EvaluationRapideEnhanced";
import ClientSpace from "./pages/ClientSpace";
import AdminDossierManagement from "./pages/AdminDossierManagement";
import PrimaryEvaluationForm from "./pages/PrimaryEvaluationForm";
import AdminEvaluationValidation from "./pages/AdminEvaluationValidation";
import ClientSpaceEnhanced from "./pages/ClientSpaceEnhanced";
import ClientSpaceEnhancedV2 from "./pages/ClientSpaceEnhancedV2";
import DocumentUploadPage from "./pages/DocumentUploadPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentErrorPage from "./pages/PaymentErrorPage";
import AiCopilotWidgetEnhanced from "./components/AiCopilotWidgetEnhanced";

import AdminGuard from "./components/AdminGuard";
import Tarifs from "./pages/Tarifs";
import Avis from "./pages/Avis";
import Blog from "./pages/Blog";
import Evaluation from "./pages/Evaluation";
import EvaluationSpace from "./pages/EvaluationSpace";
import AdminDashboard from "./pages/AdminDashboard";
import AmbassadorProgram from "./pages/AmbassadorProgram";
import CVGenerator from "./pages/CVGenerator";
import CinetPayPayment from "./pages/CinetPayPayment";
import EvisasPage from "./pages/Evisas";
import { useSessionTimeout } from "./_core/hooks/useSessionTimeout";
import React from "react";
import Navbar from "./components/Navbar";

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
      <Route path={"/mon-espace"} component={EvaluationSpace} />
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
      <Route path={"/assurance"} component={Assurance} />
      <Route path={"/assurance-inscription"} component={AssuranceInscription} />
      <Route path={"/evisa"} component={Evisa} />
      <Route path={"/evisa-demande"} component={EvisaDemande} />
      <Route path={"/about"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/politique-confidentialite"} component={PolitiqueConfidentialite} />
      <Route path={"/conditions-utilisation"} component={ConditionsUtilisation} />
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
      <Route path={"/procedures"} component={ProceduresAdvanced} />
      <Route path={"/procedures-complete"} component={ProceduresComplete} />
      <Route path={"/procedures-enhanced"} component={ProceduresEnhanced} />
      <Route path={"/procedures-advanced"} component={ProceduresAdvanced} />
      <Route path={"/evaluation-rapide"} component={AIEvaluation} />
      <Route path={"/evaluation-rapide-enhanced"} component={EvaluationRapideEnhanced} />
      <Route path={"/mon-espace"} component={ClientSpace} />
      <Route path={"/admin/dossiers"} component={AdminDossierManagement} />
      <Route path={"/evaluation-primaire"} component={PrimaryEvaluationForm} />
      <Route path={"/admin/evaluations"} component={AdminEvaluationValidation} />
      <Route path={"/mon-espace-enhanced"} component={ClientSpaceEnhanced} />
      <Route path={"/mon-espace-v2"} component={ClientSpaceEnhancedV2} />
      <Route path={"/document-upload"} component={DocumentUploadPage} />
      <Route path={"/procedures/luxembourg"} component={ProcedureLuxembourg} />

      {/* Bibliothèque de ressources PDF */}
      <Route path={"/ressources"} component={Ressources} />

      {/* Fiches détaillées par pays */}
      <Route path={"/fiches"} component={Fiches} />

      {/* Tarifs, Avis, Blog */}
      <Route path={"/tarifs"} component={Tarifs} />
      <Route path={"/avis"} component={Avis} />
      <Route path={"/blog"} component={Blog} />
      <Route path={"/evisas"} component={EvisasPage} />
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

      <Route path="/client-dashboard">
        <AuthGuard message="Vous devez créer un compte pour accéder à votre tableau de bord.">
          <ClientDashboard />
        </AuthGuard>
      </Route>

      <Route path="/hotels">
        <Hotels />
      </Route>

      <Route path={"/payment/success"} component={PaymentSuccessPage} />
      <Route path={"/payment/error"} component={PaymentErrorPage} />

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
              {/* Copilote IA flottant */}
              <AiCopilotWidgetEnhanced />
            </>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
