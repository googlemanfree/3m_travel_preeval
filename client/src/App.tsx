import { Toaster } from "@/components/ui/sonner";
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
import Hotels from "./pages/Hotels";
import FloatingServices from "./components/FloatingServices";
import CandidatesManager from "./pages/CandidatesManager";
import AdminsList from "./pages/AdminsList";
import AdminAgencyDossiers from "./pages/AdminAgencyDossiers";
import { SubmitDocuments } from "./pages/SubmitDocuments";
import { HowItWorks } from "./pages/HowItWorks";
import { ScrollToTop } from "./components/ScrollToTop";
import AdminGuard from "./components/AdminGuard";
import AdminUsersManagement from "./pages/AdminUsersManagement";
import AdminUserDetails from "./pages/AdminUserDetails";
import { Tarifs } from "./pages/Tarifs";
import { Avis } from "./pages/Avis";
import { Blog } from "./pages/Blog";

function Router() {
  return (
    <Switch>
      {/* Pages publiques (authentification requise) */}
      <Route path={"/"}>
        <AuthGuard message="Bienvenue sur 3M Travel. Veuillez créer un compte ou vous connecter pour accéder au site.">
          <Home />
        </AuthGuard>
      </Route>
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
      <Route path={"/procedures"}>
        <AuthGuard message="Vous devez créer un compte pour accéder aux procédures de visa.">
          <Procedures />
        </AuthGuard>
      </Route>
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
      <Route path={"/about"}>
        <AuthGuard message="Vous devez créer un compte pour en savoir plus sur nous.">
          <About />
        </AuthGuard>
      </Route>
      <Route path={"/contact"}>
        <AuthGuard message="Vous devez créer un compte pour nous contacter.">
          <Contact />
        </AuthGuard>
      </Route>
      <Route path={"/politique-confidentialite"}>
        <AuthGuard message="Vous devez créer un compte pour consulter notre politique de confidentialité.">
          <PolitiqueConfidentialite />
        </AuthGuard>
      </Route>
      <Route path={"/conditions-utilisation"}>
        <AuthGuard message="Vous devez créer un compte pour consulter nos conditions d'utilisation.">
          <ConditionsUtilisation />
        </AuthGuard>
      </Route>
      <Route path={"/traduction/order"}>
        <AuthGuard message="Vous devez créer un compte pour commander une traduction.">
          <TranslationOrder />
        </AuthGuard>
      </Route>
      <Route path={"/guide"}>
        <AuthGuard message="Vous devez créer un compte pour accéder au guide complet.">
          <Guide />
        </AuthGuard>
      </Route>
      <Route path={"/visa-types"}>
        <AuthGuard message="Vous devez créer un compte pour voir les types de visa.">
          <VisaTypes />
        </AuthGuard>
      </Route>
      <Route path={"/destinations"}>
        <AuthGuard message="Vous devez créer un compte pour explorer les destinations.">
          <Destinations />
        </AuthGuard>
      </Route>
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

      {/* Depot des documents */}
      <Route path={"/submit-documents"}>
        <AuthGuard message="Vous devez créer un compte pour soumettre vos documents.">
          <SubmitDocuments />
        </AuthGuard>
      </Route>

      {/* Comment ca marche */}
      <Route path={"/how-it-works"}>
        <AuthGuard message="Vous devez créer un compte pour voir comment ça marche.">
          <HowItWorks />
        </AuthGuard>
      </Route>

      {/* Bibliothèque de ressources PDF */}
      <Route path={"/ressources"}>
        <AuthGuard message="Vous devez créer un compte pour accéder aux ressources.">
          <Ressources />
        </AuthGuard>
      </Route>

      {/* Fiches détaillées par pays */}
      <Route path={"/fiches"}>
        <AuthGuard message="Vous devez créer un compte pour accéder aux fiches détaillées.">
          <Fiches />
        </AuthGuard>
      </Route>

      {/* Tarifs, Avis, Blog */}
      <Route path={"/tarifs"}>
        <AuthGuard message="Vous devez créer un compte pour consulter nos tarifs.">
          <Tarifs />
        </AuthGuard>
      </Route>
      <Route path={"/avis"}>
        <AuthGuard message="Vous devez créer un compte pour consulter les avis de nos clients.">
          <Avis />
        </AuthGuard>
      </Route>
      <Route path={"/blog"}>
        <AuthGuard message="Vous devez créer un compte pour accéder à notre blog.">
          <Blog />
        </AuthGuard>
      </Route>

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
      <Route path={"/admin/agency-dossiers"} component={AdminAgencyDossiers} />
      <Route path={"admin/agency-dossiers"} component={AdminAgencyDossiers} />

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
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <FloatingServices />
          <ScrollToTop />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
