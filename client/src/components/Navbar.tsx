import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plane, BookOpen, User, Menu, X, Star, FolderOpen, Shield, Globe, Map, FileText, ChevronDown, Search, Download } from "lucide-react";
import { useState } from "react";
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

  const isAdmin = isAuthenticated && user?.role === "admin";

  const [resourcesOpen, setResourcesOpen] = useState(false);

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
    <header className="sticky top-0 z-50 bg-white border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
          <img
            src={LOGO_URL}
            alt="3M Travel & Services"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-200 flex-shrink-0"
            onError={e => {
              const t = e.target as HTMLImageElement;
              t.style.display = "none";
              const fallback = t.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          {/* Fallback si logo indisponible */}
          <div
            className="w-10 h-10 rounded-full bg-blue-700 items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ display: "none" }}
          >
            3M
          </div>
          <div className="min-w-0">
            <div className="font-black text-blue-800 text-sm leading-tight truncate">3M Travel & Services</div>
            <div className="text-xs text-blue-500 font-medium truncate">Votre mobilité, notre expertise</div>
          </div>
        </Link>

        {/* ── Nav desktop ── */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={linkClass("home")}>Accueil</Link>
          <Link href="/flights" className={linkClass("flights")}>
            <span className="flex items-center gap-1"><Plane className="w-3.5 h-3.5" />Vols</span>
          </Link>
          <Link href="/procedures" className={linkClass("procedures")}>
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />Procédures</span>
          </Link>

          {/* Menu déroulant Ressources */}
          <div className="relative" onMouseEnter={() => setResourcesOpen(true)} onMouseLeave={() => setResourcesOpen(false)}>
            <button className={`text-sm font-semibold transition-colors flex items-center gap-1 ${
              ["visa-types", "destinations", "guide"].includes(active ?? "")
                ? "text-blue-700 border-b-2 border-blue-700 pb-0.5"
                : "text-gray-600 hover:text-blue-700"
            }`}>
              <Globe className="w-3.5 h-3.5" />
              Ressources
              <ChevronDown className={`w-3 h-3 transition-transform ${resourcesOpen ? "rotate-180" : ""}`} />
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
                <div className="border-t border-gray-100 my-1" />
                <Link href="/ressources" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
                  <Download className="w-4 h-4 text-blue-600" />
                  Télécharger les guides PDF
                </Link>
              </div>
            )}
          </div>

          <Link href="/mon-dossier" className={linkClass("mon-dossier")}>
            <span className="flex items-center gap-1"><Search className="w-3.5 h-3.5" />Suivre mon dossier</span>
          </Link>

          {isAdmin && (
            <Link href="/admin" className="text-sm font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors">
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
        </nav>

        {/* ── Actions desktop ── */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {onEvalClick && (
            <Button
              onClick={onEvalClick}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-4 shadow-md"
            >
              <Star className="w-4 h-4 mr-1.5" />
              Évaluation gratuite
            </Button>
          )}
          <Link href="/open-dossier">
            <Button
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-4 shadow-md"
            >
              <FolderOpen className="w-4 h-4 mr-1.5" />
              Ouvrir un dossier
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-blue-700 text-blue-700 hover:bg-blue-50 font-bold text-sm px-4"
            >
              <User className="w-4 h-4 mr-1.5" />
              Mon Espace
            </Button>
          </Link>
        </div>

        {/* ── Mobile burger ── */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
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
          <Link href="/open-dossier" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 py-2 border-b border-gray-100">
            <FolderOpen className="w-4 h-4" /> Ouvrir un dossier
          </Link>
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 py-2 border-b border-gray-100">
            <User className="w-4 h-4" /> Mon Espace
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900 py-2 border-b border-gray-100">
              <Shield className="w-4 h-4" /> Administration
            </Link>
          )}
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
