import { Link } from "wouter";

const SITE_LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Billets d’avion", href: "/billets" },
  { label: "Canada — Résidence permanente", href: "/canada" },
  { label: "Visa Schengen", href: "/schengen" },
  { label: "Études à l’étranger", href: "/etudes" },
  { label: "Formation agence de voyage", href: "/formation" },
  { label: "Procédures et destinations", href: "/procedures" },
  { label: "E-visa", href: "/evisas" },
  { label: "Assurance voyage", href: "/assurance" },
  { label: "Contact", href: "/contact" },
  { label: "Inscription", href: "/register" },
  { label: "Connexion candidat", href: "/login" },
  { label: "Politique de confidentialité", href: "/politique-confidentialite" },
  { label: "Conditions d'utilisation", href: "/conditions-utilisation" },
  { label: "Accessibilité", href: "/accessibilite" },
];

export default function Sitemap() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12 text-white">
        <div className="container px-4">
          <h1 className="text-4xl font-bold">Plan du site</h1>
          <p className="mt-2 text-blue-100">Retrouvez rapidement les services de 3M Travel Agency.</p>
        </div>
      </section>
      <section className="container max-w-4xl px-4 py-12">
        <nav aria-label="Plan du site" className="grid gap-3 rounded-2xl bg-white p-8 shadow-sm sm:grid-cols-2">
          {SITE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-gray-200 px-4 py-3 font-semibold text-blue-800 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
