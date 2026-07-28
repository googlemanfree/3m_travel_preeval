import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plane, BookOpen, User, Menu, X, Star, FolderOpen, Shield, Globe, Map, FileText, ChevronDown, Search, Download, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const LOGO_URL = "/manus-storage/logo_3m_d0e23210.jpeg";

interface NavbarProps {
  /** Highlight the CTA eval button — pass an onClick to open the eval modal */
  onEvalClick?: () => void;
  /** Active page for underline indicator */
  activePage?: "home" | "flights" | "procedures" | "dashboard";
}

export default function Navbar({ onEvalClick, activePage }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [highContrast, setHighContrast] = useState(false);

  const isAdmin = isAuthenticated && user?.role === "admin";

  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Charger la préférence de contraste élevé depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem("high-contrast-mode");
    if (stored === "true") {
      setHighContrast(true);
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  // Basculer le mode contraste élevé
  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem("high-contrast-mode", String(newValue));
    if (newValue) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  };

  const active = activePage ?? (
    location === "/" ? "home" :
    location.startsWith("/flights") ? "flights" :
    location.startsWith("/procedures") ? "procedures" :
    location.startsWith("/dashboard") ? "dashboard" :
    location.startsWith("/visa-types") ? "visa-types" :
    location.startsWith("/destinations") ? "destinations" :
    location.startsWith("/guide") ? "guide" : undefined
  );

  const linkClass = (page: string) =>
    `text-sm font-semibold transition-colors ${
      active === page
        ? "text-blue-700 border-b-2 border-blue-700 pb-0.5"
        : "text-gray-600 hover:text-blue-700"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-blue-200 shadow-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 min-w-0 hover:opacity-80 transition-opacity">
          <img
            src={LOGO_URL}
            alt="3M Travel & Services"
            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-300 flex-shrink-0"
            onError={e => {
              const t = e.target as HTMLImageElement;
              t.style.display = "none";
              const fallback = t.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          {/* Fallback si logo indisponible */}
          <div
            className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ display: "none" }}
          >
            3M
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="font-black text-blue-800 text-base leading-tight truncate">3M Travel & Services</div>
            <div className="text-xs text-blue-600 font-medium truncate">Votre mobilité, notre expertise</div>
          </div>
        </Link>

        {/* ── Nav desktop ── */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link href="/" className={`px-3 py-2 rounded-md text-sm font-semibold transition-all ${
            active === "home"
              ? "text-blue-700 bg-blue-50"
              : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
          }`}>Accueil</Link>
          
          <Link href="/flights" className={`px-3 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${
            active === "flights"
              ? "text-blue-700 bg-blue-50"
              : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
          }`}>
            <Plane className="w-4 h-4" />
            Vols
          </Link>
          
          <Link href="/procedures" className={`px-3 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${
            active === "procedures"
              ? "text-blue-700 bg-blue-50"
              : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
          }`}>
            <BookOpen className="w-4 h-4" />
            Procédures
          </Link>

          {/* Menu déroulant Ressources */}
          <div className="relative" onMouseEnter={() => setResourcesOpen(true)} onMouseLeave={() => setResourcesOpen(false)}>
            <button className={`px-3 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${
              ["visa-types", "destinations", "guide", "tarifs", "avis", "blog"].includes(active ?? "")
                ? "text-blue-700 bg-blue-50"
                : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
            }`}>
              <Globe className="w-4 h-4" />
              Ressources
              <ChevronDown className={`w-4 h-4 transition-transform ${resourcesOpen ? "rotate-180" : ""}`} />
            </button>
            {resourcesOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-blue-100 rounded-lg shadow-lg py-2 min-w-48 z-50">
                <Link href="/visa-types" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Types de Visa
                </Link>
                <Link href="/destinations" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Map className="w-4 h-4 text-blue-600" />
                  Destinations
                </Link>
                <Link href="/guide" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Guide Complet
                </Link>
                <Link href="/tarifs" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Tarifs & Garanties
                </Link>
                <Link href="/avis" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Star className="w-4 h-4 text-blue-600" />
                  Avis Clients
                </Link>
                <Link href="/blog" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Blog
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <Link href="/ressources" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
                  <Download className="w-4 h-4 text-blue-600" />
                  Télécharger les guides PDF
                </Link>
              </div>
            )}
          </div>

          <Link href="/mon-dossier" className={`px-3 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${
            active === "mon-dossier"
              ? "text-blue-700 bg-blue-50"
              : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
          }`}>
            <Search className="w-4 h-4" />
            Suivi
          </Link>

          {/* Admin link - only show if authenticated and admin */}
          {isAdmin && (
            <Link href="/admin" className="px-3 py-2 rounded-md text-sm font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 flex items-center gap-1.5 transition-all">
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* ── Actions desktop ── */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {/* Bouton mode contraste élevé */}
          <button
            onClick={toggleHighContrast}
            className={`p-2.5 rounded-lg transition-all border ${
              highContrast
                ? "bg-blue-100 text-blue-700 border-blue-300"
                : "text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
            }`}
            aria-label={highContrast ? "Désactiver le mode contraste élevé" : "Activer le mode contraste élevé"}
            aria-pressed={highContrast}
            title={highContrast ? "Désactiver le mode contraste élevé" : "Activer le mode contraste élevé"}
          >
            {highContrast ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
          {onEvalClick && (
            <Button
              onClick={onEvalClick}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-md transition-all hover:shadow-lg"
            >
              <Star className="w-4 h-4 mr-2" />
              Évaluation gratuite
            </Button>
          )}
          {/* Admin login button - only show if NOT admin */}
          {!isAdmin && (
            <Link href="/admin/login">
              <Button
                variant="outline"
                className="border-2 border-purple-700 text-purple-700 hover:bg-purple-50 font-bold text-sm px-4 py-2.5 rounded-lg transition-all"
              >
                <Shield className="w-4 h-4 mr-1.5" />
                Admin
              </Button>
            </Link>
          )}
          {/* Show Mon Espace if authenticated, otherwise show Login/Signup */}
          {isAuthenticated ? (
            <Link href="/mon-espace">
              <Button
                variant="outline"
                className="border-2 border-blue-700 text-blue-700 hover:bg-blue-50 font-bold text-sm px-4 py-2.5 rounded-lg transition-all"
              >
                <User className="w-4 h-4 mr-1.5" />
                Mon Espace
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-2 border-blue-700 text-blue-700 hover:bg-blue-50 font-bold text-sm px-4 py-2.5 rounded-lg transition-all"
                >
                  <User className="w-4 h-4 mr-1.5" />
                  Connexion
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-md transition-all hover:shadow-lg"
                >
                  Inscription
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile burger ── */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-blue-100 px-4 py-4 flex flex-col gap-3 shadow-lg">
          <Link href="/" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-100">
            Accueil
          </Link>
          <Link href="/flights" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-100">
            <Plane className="w-4 h-4 text-blue-600" /> Vols
          </Link>
          <Link href="/procedures" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-100">
            <BookOpen className="w-4 h-4 text-blue-600" /> Procédures
          </Link>
          <Link href="/visa-types" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-100">
            <FileText className="w-4 h-4 text-blue-600" /> Types de Visa
          </Link>
          <Link href="/destinations" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-100">
            <Map className="w-4 h-4 text-blue-600" /> Destinations
          </Link>
          <Link href="/guide" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-100">
            <Globe className="w-4 h-4 text-blue-600" /> Guide Complet
          </Link>
          <Link href="/ressources" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 py-2 border-b border-gray-100">
            <Download className="w-4 h-4 text-blue-600" /> Télécharger les guides PDF
          </Link>
          <Link href="/mon-dossier" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-blue-600" /> Suivre mon dossier
          </Link>

          {isAuthenticated ? (
            <Link href="/mon-espace" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 py-2 border-b border-gray-100">
              <User className="w-4 h-4" /> Mon Espace
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 py-2 border-b border-gray-100">
                <User className="w-4 h-4" /> Connexion
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 py-2 border-b border-gray-100">
                Inscription
              </Link>
            </>
          )}
          <Link href="/admin/login" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900 py-2 border-b border-gray-100">
            <Shield className="w-4 h-4" /> Connexion Admin
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900 py-2 border-b border-gray-100">
              <Shield className="w-4 h-4" /> Administration
            </Link>
          )}
          {/* Bouton mode contraste élevé mobile */}
          <button
            onClick={toggleHighContrast}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-700 py-2 border-b border-gray-100 w-full"
            aria-label={highContrast ? "Désactiver le mode contraste élevé" : "Activer le mode contraste élevé"}
            aria-pressed={highContrast}
          >
            {highContrast ? (
              <>
                <Eye className="w-4 h-4 text-blue-600" />
                Mode contraste désactivé
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-blue-600" />
                Activer le contraste élevé
              </>
            )}
          </button>
          {onEvalClick && (
            <Button
              onClick={() => { setMobileOpen(false); onEvalClick(); }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold mt-1"
            >
              <Star className="w-4 h-4 mr-2" /> Évaluation gratuite
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
