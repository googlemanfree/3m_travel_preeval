import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import NavbarImproved from "./components/NavbarImproved";
import Home from "./pages/Home";
import Flights from "./pages/Flights";
import Procedures from "./pages/Procedures";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "@/pages/VerifyEmail";
import VerifyEmailLink from "@/pages/VerifyEmailLink";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OpenDossier from "./pages/OpenDossier";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import VerifyApplicationEmail from "./pages/VerifyApplicationEmail";
import Admin from "./pages/Admin";
import VisaTypes from "./pages/VisaTypes";
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
import AdminEvaluations from "./pages/AdminEvaluations";
import Hotels from "./pages/Hotels";
import FloatingServices from "./components/FloatingServices";
import { FloatingWhatsAppButton } from "./components/FloatingWhatsAppButton";
import CandidatesManager from "./pages/CandidatesManager";
import AdminsList from "./pages/AdminsList";
import AdminAgencyDossiers from "./pages/AdminAgencyDossiers";
import { SubmitDocuments } from "./pages/SubmitDocuments";
import ClientDashboard from "./pages/ClientDashboard";
import { HowItWorks } from "./pages/HowItWorks";
import MySpace from "./pages/MySpace";
import { ScrollToTop } from "./components/ScrollToTop";
import AdminGuard from "./components/AdminGuard";
import AdminUsersManagement from "./pages/AdminUsersManagement";
import AdminUserDetails from "./pages/AdminUserDetails";
import { Tarifs } from "./pages/Tarifs";
import { Avis } from "./pages/Avis";
import { Blog } from "./pages/Blog";
import TestFeatures from "./pages/TestFeatures";
import { useSessionTimeout } from "./_core/hooks/useSessionTimeout";
import { SkipLink } from "./components/SkipLink";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { ServiceWorkerUpdateNotification } from "./components/ServiceWorkerUpdateNotification";
import { AIAssistantWidget } from "./components/AIAssistantWidgetMultilingual";
import { LanguageProvider } from "./contexts/LanguageContext";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import AuthGuard from "./components/AuthGuard";

function Router() {
  // Enregistrer le service worker
  useServiceWorker();
  
  // Gérer l'inactivité et la déconnexion automatique
  useSessionTimeout();
  return (
    <Switch>
      {/* Pages publiques (SANS authentification) */}
      <Route path={"/"} component={Home} />
      <Route path={"/register"} component={Register} />
      <Route path={"/login"} component={Login} />
      <Route path={"/verify-email"} component={VerifyEmail} />
      <Route path={"/verify-email-link"} component={VerifyEmailLink} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />

      {/* Pages protégées — nécessitent un compte 3M Travel */}
      <Route path={"/flights"}>
        <AuthGuard message="Vous devez créer un compte ou vous connecter pour accéder à la recherche de vols de 3M Travel.">
          <Flights />
        </AuthGuard>
      </Route>
      <Route path={"/procedures"} component={Procedures} />
      <Route path={"/assurance"}>
        <AuthGuard message="Vous devez créer un compte pour accéder à nos offres d'assurance.">
          <Assurance />
        </AuthGuard>
      </Route>
      <Route path={"/assurance-inscription"}>
        <AuthGuard message="Vous devez créer un compte pour vous inscrire à une assurance.">
          <AssuranceInscription />
        </AuthGuard>
      </Route>
      <Route path={"/evisa"}>
        <AuthGuard message="Vous devez créer un compte pour accéder aux services e-visa.">
          <Evisa />
        </AuthGuard>
      </Route>
      <Route path={"/evisa-demande"}>
        <AuthGuard message="Vous devez créer un compte pour demander un e-visa.">
          <EvisaDemande />
        </AuthGuard>
      </Route>
      <Route path={"/blog"} component={Blog} />
      <Route path={"/test-features"} component={TestFeatures} />
      <Route path={"/politique-confidentialite"} component={PolitiqueConfidentialite} />
      <Route path={"/conditions-utilisation"} component={ConditionsUtilisation} />
      <Route path={"/traduction/order"}>
        <AuthGuard message="Vous devez créer un compte pour commander une traduction.">
          <TranslationOrder />
        </AuthGuard>
      </Route>
      <Route path={"/guide"} component={Guide} />
      <Route path={"/visa-types"} component={VisaTypes} />
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
      <Route path={"/mon-espace"}>
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

      {/* Routes Hotels */}

      {/* Traduction assermentée */}

      {/* Panneau admin */}
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin"}>
        <AdminGuard message="Vous devez vous connecter en tant qu'administrateur pour accéder au tableau de bord.">
          <Admin />
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
  // Enregistrer le service worker pour les performances et le mode offline
  useServiceWorker();

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
          <SkipLink />
          <Toaster />
          <main id="main-content">
            <Router />
          </main>
          <FloatingServices />
          <FloatingWhatsAppButton />
          <ScrollToTop />
          <ServiceWorkerUpdateNotification />
          <AIAssistantWidget />
        </TooltipProvider>
      </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
