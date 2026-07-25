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
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
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
import { ScrollToTop } from "./components/ScrollToTop";

function Router() {
  return (
    <Switch>
      {/* Pages publiques */}
      <Route path={"/"} component={Home} />
      <Route path={"/register"} component={Register} />
      <Route path={"/login"} component={Login} />
      <Route path={"/verify-email"} component={VerifyEmail} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />

      {/* Pages protégées — nécessitent un compte 3M Travel */}
      <Route path={"/flights"}>
        <AuthGuard message="Vous devez créer un compte ou vous connecter pour accéder à la recherche de vols de 3M Travel.">
          <Flights />
        </AuthGuard>
      </Route>
      <Route path={"/procedures"} component={Procedures} />
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
      <Route path={"/destinations"} component={Destinations} />
      <Route path={"/dashboard"}>
        <AuthGuard message="Vous devez vous connecter pour accéder à votre espace candidat." autoRedirect>
          <Dashboard />
        </AuthGuard>
      </Route>

      {/* Ouverture de dossier & paiement */}
      <Route path={"/open-dossier"} component={OpenDossier} />
      <Route path={"/verify-application-email"} component={VerifyApplicationEmail} />
      <Route path={"/payment-success"} component={PaymentSuccess} />
      <Route path={"/payment-failed"} component={PaymentFailed} />

      {/* Suivi de dossier candidat */}
      <Route path={"/mon-dossier"} component={MonDossier} />

      {/* Bibliothèque de ressources PDF */}
      <Route path={"/ressources"} component={Ressources} />

      {/* Fiches détaillées par pays */}
      <Route path={"/fiches"} component={Fiches} />

      {/* Assurance voyage */}
      <Route path={"/assurance"} component={Assurance} />

      {/* Traduction assermentée */}

      {/* Panneau admin */}
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/admin/evaluation"}>
        <AuthGuard message="Accès réservé aux administrateurs.">
          <AdminEvaluation />
        </AuthGuard>
      </Route>
      <Route path={"/admin/accompagnement"}>
        <AuthGuard message="Accès réservé aux administrateurs.">
          <AdminAccompagnement />
        </AuthGuard>
      </Route>
      <Route path={"admin/procedures"}>
        <AuthGuard message="Accès réservé aux administrateurs.">
          <AdminProcedures />
        </AuthGuard>
      </Route>
      <Route path={"admin/candidates"}>
        <AuthGuard message="Accès réservé aux administrateurs.">
          <CandidatesManager />
        </AuthGuard>
      </Route>
      <Route path={"admin/admins"}>
        <AuthGuard message="Accès réservé aux administrateurs.">
          <AdminsList />
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
