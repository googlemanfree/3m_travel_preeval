import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

// Mapping automatique des routes vers des labels lisibles
const ROUTE_LABELS: Record<string, string> = {
  "/": "Accueil",
  "/flights": "Recherche de vols",
  "/procedures": "Procédures & Destinations",
  "/about": "À Propos",
  "/contact": "Contact",
  "/blog": "Blog",
  "/tarifs": "Tarifs",
  "/avis": "Avis clients",
  "/guide": "Guide",
  "/ressources": "Ressources",
  "/fiches": "Fiches pays",
  "/visa-types": "Types de visa",
  "/destinations": "Destinations",
  "/assurance": "Assurance",
  "/evisa": "E-Visa",
  "/schedule-agency": "Prendre RDV",
  "/eligibility-simulator": "Simulateur d'éligibilité",
  "/budget-calculator": "Calculateur de budget",
  "/visa-gallery": "Galerie des visas",
  "/traduction": "Traduction certifiée",
  "/traduction/order": "Commander une traduction",
  "/mon-dossier": "Mon Dossier",
  "/mon-espace": "Mon Espace",
  "/dashboard": "Tableau de bord",
  "/open-dossier": "Ouvrir un dossier",
  "/submit-documents": "Soumettre des documents",
  "/politique-confidentialite": "Politique de confidentialité",
  "/conditions-utilisation": "Conditions d'utilisation",
  "/how-it-works": "Comment ça marche",
  "/translator/dashboard": "Dashboard Traducteur",
  "/candidate/agency-dossier": "Mon Dossier en Agence",
  "/admin": "Administration",
  "/admin/blog": "Gestion Blog",
  "/admin/evaluations": "Évaluations",
  "/admin/candidates": "Candidats",
  "/admin/users": "Utilisateurs",
  "/admin/agency-dossiers": "Dossiers Agence",
};

/**
 * Breadcrumb automatique basé sur l'URL courante.
 * Utilisation : <AutoBreadcrumb /> — affiche automatiquement le fil d'Ariane.
 * Utilisation avancée : <Breadcrumb items={[...]} /> — fil d'Ariane personnalisé.
 */
export function AutoBreadcrumb({ className }: { className?: string }) {
  const [location] = useLocation();

  if (location === "/") return null; // Pas de breadcrumb sur la page d'accueil

  const segments = location.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: "Accueil", href: "/" }];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = ROUTE_LABELS[currentPath] || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({ label, href: currentPath });
  }

  // La dernière entrée n'a pas de lien (page courante)
  if (items.length > 1) {
    items[items.length - 1].href = undefined;
  }

  return <Breadcrumb items={items} className={className} />;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  if (!items || items.length <= 1) return null;

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={`flex items-center gap-1 text-sm text-gray-500 py-2 px-1 ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                {isFirst && <Home className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className={`flex items-center gap-1 ${isLast ? "text-gray-800 font-medium" : ""}`}>
                {isFirst && <Home className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
