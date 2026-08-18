import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowUpRight, Home } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function NotFound() {
  const [location, setLocation] = useLocation();
  const configQuery = trpc.routeHealth.getPublic404Config.useQuery(undefined, { staleTime: 5 * 60 * 1000, retry: false });
  const record404 = trpc.routeHealth.record404.useMutation();
  const config = configQuery.data;

  useEffect(() => {
    record404.mutate({ path: `${location || window.location.pathname}${window.location.search}`, referrer: document.referrer || "" });
    // Le journal ne doit être écrit qu'une fois par affichage de cette page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const links = config?.links?.length ? config.links : [
    { label: "Retour à l’accueil", href: "/" },
    { label: "Évaluation de profil", href: "/evaluation" },
    { label: "Accéder à mon espace", href: "/mon-espace" },
    { label: "Contacter Prime Travel", href: "/contact" },
  ];

  const handleLink = (href: string) => {
    if (href.startsWith("/")) setLocation(href);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10">
      <Card className="w-full max-w-2xl shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" aria-hidden="true" />
            </div>
          </div>

          <p className="text-sm font-semibold tracking-widest text-blue-700 mb-2">ERREUR 404</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{config?.title ?? "Page introuvable"}</h1>
          <p className="text-slate-600 mb-8 leading-relaxed whitespace-pre-line">{config?.message ?? "La page que vous recherchez n’existe pas ou n’est plus disponible. Vérifiez le lien ou revenez à l’accueil pour poursuivre votre démarche."}</p>

          <div id="not-found-button-group" className="grid gap-3 sm:grid-cols-2" aria-label="Liens utiles">
            {links.map((link) => link.href.startsWith("/") ? (
              <Button key={`${link.label}-${link.href}`} onClick={() => handleLink(link.href)} variant="outline" className="min-h-11 justify-center border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50">
                {link.href === "/" && <Home className="w-4 h-4 mr-2" aria-hidden="true" />}
                {link.label}
              </Button>
            ) : (
              <a key={`${link.label}-${link.href}`} href={link.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50">
                {link.label}<ArrowUpRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
