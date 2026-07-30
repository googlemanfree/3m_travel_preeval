import { Toaster } from "@/components/ui/sonner";
import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthGuard from "./components/AuthGuard";
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
import { ScrollToTop } from "./components/ScrollToTop";
import AdminGuard from "./components/AdminGuard";
import FloatingServices from "./components/FloatingServices";
import { FloatingWhatsAppButton } from "./components/FloatingWhatsAppButton";
import { useSessionTimeout } from "./_core/hooks/useSessionTimeout";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { ServiceWorkerUpdateNotification } from "./components/ServiceWorkerUpdateNotification";

// Code splitting — pages chargées à la demande
const Admin = lazy(() => import("./pages/Admin"));
const AdminEvaluation = lazy(() => import("./pages/AdminEvaluation"));
const AdminAccompagnement = lazy(() => import("./pages/AdminAccompagnement"));
const AdminProcedures = lazy(() => import("./pages/AdminProcedures"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminEvaluations = lazy(() => import("./pages/AdminEvaluations"));
const AdminAgencyDossiers = lazy(() => import("./pages/AdminAgencyDossiers"));
const AdminUsersManagement = lazy(() => import("./pages/AdminUsersManagement"));
const AdminUserDetails = lazy(() => import("./pages/AdminUserDetails"));
const AdminsList = lazy(() => import("./pages/AdminsList"));
const CandidatesManager = lazy(() => import("./pages/CandidatesManager"));
const VisaTypes = lazy(() => import("./pages/VisaTypes"));
const Destinations = lazy(() => import("./pages/Destinations"));
const Guide = lazy(() => import("./pages/Guide"));
const MonDossier = lazy(() => import("./pages/MonDossier"));
const Ressources = lazy(() => import("./pages/Ressources"));
const Fiches = lazy(() => import("./pages/Fiches"));
const Assurance = lazy(() => import("./pages/Assurance"));
const TranslationOrder = lazy(() => import("./pages/TranslationOrder"));
const AssuranceInscription = lazy(() => import("./pages/AssuranceInscription"));
const Evisa = lazy(() => import("./pages/Evisa"));
const EvisaDemande = lazy(() => import("./pages/EvisaDemande"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const DossierConfirmation = lazy(() => import("./pages/DossierConfirmation"));
const ConditionsUtilisation = lazy(() => import("./pages/ConditionsUtilisation"));
const Hotels = lazy(() => import("./pages/Hotels"));
const SubmitDocuments = lazy(() => import("./pages/SubmitDocuments").then(m => ({ default: m.SubmitDocuments })));
const ScheduleAgency = lazy(() => import("./pages/ScheduleAgency"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const HowItWorks = lazy(() => import("./pages/HowItWorks").then(m => ({ default: m.HowItWorks })));
const MySpace = lazy(() => import("./pages/MySpace"));
const Tarifs = lazy(() => import("./pages/Tarifs").then(m => ({ default: m.Tarifs })));
const Avis = lazy(() => import("./pages/Avis").then(m => ({ default: m.Avis })));
const TranslatorDashboard = lazy(() => import("./pages/TranslatorDashboard"));
const CandidateAgencyDossier = lazy(() => import("./pages/CandidateAgencyDossier"));
const Blog = lazy(() => import("./pages/Blog").then(m => ({ default: m.Blog })));
const EvaluationSpace = lazy(() => import("./pages/EvaluationSpace"));
const EligibilitySimulator = lazy(() => import("./pages/EligibilitySimulator"));
const BudgetCalculator = lazy(() => import("./pages/BudgetCalculator"));
const VisaGallery = lazy(() => import("./pages/VisaGallery"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const AdminApprovedVisas = lazy(() => import("./pages/AdminApprovedVisas"));

// Fallback de chargement léger
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Chargement...</p>
    </div>
  </div>
);

function Router() {
  // Gérer l'inactivité et la déconnexion automatique
  useSessionTimeout();
  return (
    <Suspense fallback={<PageLoader />}>
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
      <Route path={"/about"} component={About} />
      <Route path={"/contact"} component={Contact} />
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
        <AuthGuard message="Vous devez créer un compte pour accéder à votre espace candidat." autoRedirect={true}>
          <MySpace />
        </AuthGuard>
      </Route>

      {/* Espace Candidat - Consultation Évaluation */}
      <Route path={"/evaluation-space"} component={EvaluationSpace} />

      {/* Depot des documents */}
      <Route path={"/submit-documents"}>
        <AuthGuard message="Vous devez créer un compte pour soumettre vos documents.">
          <SubmitDocuments />
        </AuthGuard>
      </Route>

      {/* Prise de rendez-vous en agence */}
      <Route path={"/schedule-agency"} component={ScheduleAgency} />

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
      <Route path={"/traduction"} component={TranslationOrder} />

      {/* Espace Candidat - Dossier en Agence */}
      <Route path={"/candidate/agency-dossier"}>
        <AuthGuard message="Vous devez vous connecter pour consulter votre dossier en agence." autoRedirect>
          <CandidateAgencyDossier />
        </AuthGuard>
      </Route>

      {/* Dashboard Traducteur */}
      <Route path={"/translator/dashboard"}>
        <AuthGuard message="Vous devez être connecté en tant que traducteur pour accéder à ce tableau de bord.">
          <TranslatorDashboard />
        </AuthGuard>
      </Route>

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

      <Route path="/eligibility-simulator" component={EligibilitySimulator} />
      <Route path={"simulator"} component={EligibilitySimulator} />
      <Route path="/budget-calculator" component={BudgetCalculator} />
      <Route path="/visa-gallery" component={VisaGallery} />
      <Route path="/admin/blog">
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminBlog />
        </AdminGuard>
      </Route>
      <Route path="/admin/approved-visas">
        <AdminGuard message="Accès réservé aux administrateurs.">
          <AdminApprovedVisas />
        </AdminGuard>
      </Route>
      <Route path={"404"} component={NotFound} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  useServiceWorker();
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <FloatingServices />
          <FloatingWhatsAppButton />
          <ScrollToTop />
          <ServiceWorkerUpdateNotification />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
