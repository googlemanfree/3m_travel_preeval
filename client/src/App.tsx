import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Register from "./pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import VerifyEmailLink from "@/pages/VerifyEmailLink";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import VerifyApplicationEmail from "./pages/VerifyApplicationEmail";
import { ScrollToTop } from "./components/ScrollToTop";
import { useSessionTimeout } from "./_core/hooks/useSessionTimeout";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { ServiceWorkerUpdateNotification } from "./components/ServiceWorkerUpdateNotification";

// Code splitting — pages chargées à la demande
const ComponentShowcase = lazy(() => import("./pages/ComponentShowcase"));
const EvaluationResult = lazy(() => import("./pages/EvaluationResult"));
const EvaluationSpace = lazy(() => import("./pages/EvaluationSpace"));
const Evisa = lazy(() => import("./pages/Evisa"));
const EvisaDemande = lazy(() => import("./pages/EvisaDemande"));
const Fiches = lazy(() => import("./pages/Fiches"));
const Flights = lazy(() => import("./pages/Flights"));
const ForgotPassword2 = lazy(() => import("./pages/ForgotPassword"));
const Guide = lazy(() => import("./pages/Guide"));
const Hotels = lazy(() => import("./pages/Hotels"));
const HowItWorks = lazy(() => import("./pages/HowItWorks").then(m => ({ default: m.HowItWorks })));
const OpenDossier = lazy(() => import("./pages/OpenDossier"));
const Ressources = lazy(() => import("./pages/Ressources"));
const SubmitDocuments = lazy(() => import("./pages/SubmitDocuments").then(m => ({ default: m.SubmitDocuments })));
const Tarifs = lazy(() => import("./pages/Tarifs").then(m => ({ default: m.Tarifs })));
const TestFeatures = lazy(() => import("./pages/TestFeatures"));
const TranslationOrder = lazy(() => import("./pages/TranslationOrder"));
const ConditionsUtilisation = lazy(() => import("./pages/ConditionsUtilisation"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const DossierConfirmation = lazy(() => import("./pages/DossierConfirmation"));

// Fallback de chargement léger
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Chargement...</p>
    </div>
  </div>
);

// Page 404
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-gray-600 mb-4">Page non trouvée</p>
      <a href="/" className="text-blue-600 hover:underline">Retour à l'accueil</a>
    </div>
  </div>
);

function Router() {
  // Gérer l'inactivité et la déconnexion automatique
  useSessionTimeout();
  return (
    <Suspense fallback={<PageLoader />}>
    <Switch>
      {/* Pages publiques */}
      <Route path={"/"} component={Home} />
      <Route path={"/register"} component={Register} />
      <Route path={"/verify-email"} component={VerifyEmail} />
      <Route path={"/verify-email-link"} component={VerifyEmailLink} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/payment-success"} component={PaymentSuccess} />
      <Route path={"/payment-failed"} component={PaymentFailed} />
      <Route path={"/verify-application-email"} component={VerifyApplicationEmail} />
      
      {/* Pages supplémentaires */}
      <Route path={"/components"} component={ComponentShowcase} />
      <Route path={"/evaluation-result"} component={EvaluationResult} />
      <Route path={"/evaluation-space"} component={EvaluationSpace} />
      <Route path={"/evisa"} component={Evisa} />
      <Route path={"/evisa-demande"} component={EvisaDemande} />
      <Route path={"/fiches"} component={Fiches} />
      <Route path={"/flights"} component={Flights} />
      <Route path={"/guide"} component={Guide} />
      <Route path={"/hotels"} component={Hotels} />
      <Route path={"/how-it-works"} component={HowItWorks} />
      <Route path={"/open-dossier"} component={OpenDossier} />
      <Route path={"/ressources"} component={Ressources} />
      <Route path={"/submit-documents"} component={SubmitDocuments} />
      <Route path={"/tarifs"} component={Tarifs} />
      <Route path={"/test-features"} component={TestFeatures} />
      <Route path={"/translation-order"} component={TranslationOrder} />
      <Route path={"/conditions"} component={ConditionsUtilisation} />
      <Route path={"/politique-confidentialite"} component={PolitiqueConfidentialite} />
      <Route path={"/dossier-confirmation"} component={DossierConfirmation} />
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

export default function App() {
  useServiceWorker();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <ScrollToTop />
          <Router />
          <ServiceWorkerUpdateNotification />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
