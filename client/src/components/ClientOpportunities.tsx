import { Link } from "wouter";
import { ArrowRight, Briefcase, Compass, GraduationCap } from "lucide-react";
import { OFFER_REQUIREMENT_LABELS, PATHWAY_LABELS, ROUTE_TYPE_LABELS, type Pathway } from "@shared/countryCatalog";
import { guideCountryName, guideCodeForSlug, guideSlugForDestinationName } from "@shared/countryGuides";
import { resolveEvaluationProjectKind } from "@shared/evaluationVisaCv";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";

const KIND_TO_PATHWAY: Record<string, Pathway | null> = { travail: "work", etudes: "study", tourisme: "visit", autre: null };
const KIND_COPY: Record<string, { title: string; empty: string; icon: typeof Briefcase }> = {
  travail: { title: "Votre projet de travail", empty: "Aucune offre d'emploi vérifiée n'est publiée pour le moment.", icon: Briefcase },
  etudes: { title: "Votre projet d'études", empty: "Les écoles, rentrées et scolarités seront affichées ici dès qu'elles auront été vérifiées.", icon: GraduationCap },
  tourisme: { title: "Votre séjour", empty: "Les programmes de séjour de ce pays seront affichés ici dès qu'ils auront été vérifiés.", icon: Compass },
};

/**
 * « Opportunités pour votre projet » : ce que le candidat peut utiliser selon le visa choisi. Il reprend le guide PUBLIÉ du pays
 * (donc relu sur les sources officielles). Sans guide publié, le panneau le dit et oriente vers les pages existantes.
 */
export function ClientOpportunities({ destination, projectType, visaType }: { destination: string | null | undefined; projectType?: string | null; visaType?: string | null }) {
  const kind = resolveEvaluationProjectKind(projectType, visaType);
  const slug = guideSlugForDestinationName(destination);
  const guide = trpc.countryCatalog.guide.useQuery({ slug: slug ?? "" }, { enabled: Boolean(slug) && kind !== "autre", staleTime: 5 * 60 * 1000 });
  if (kind === "autre" || !slug) return null;

  const copy = KIND_COPY[kind];
  const Icon = copy.icon;
  const name = guideCountryName(guideCodeForSlug(slug) ?? "") ?? slug;
  const pathway = KIND_TO_PATHWAY[kind];
  const entry = guide.data?.pathways.find((item) => item.pathway === pathway) ?? null;

  return (
    <Card className="border border-blue-200 bg-white p-5 shadow-sm" role="region" aria-labelledby="client-opportunities-title" data-testid="client-opportunities">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-blue-100 p-3 text-blue-800"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">Opportunités · {name}</p>
          <h3 id="client-opportunities-title" className="mt-1 text-lg font-black text-slate-950">{copy.title}</h3>
          {entry ? (
            <div className="mt-3 space-y-3">
              {entry.summary ? <p className="text-sm leading-6 text-slate-700">{entry.summary}</p> : null}
              <ul className="space-y-2">
                {entry.programs.map((program) => {
                  const facts = [
                    program.routeType ? ROUTE_TYPE_LABELS[program.routeType as keyof typeof ROUTE_TYPE_LABELS] : null,
                    program.offerRequired ? OFFER_REQUIREMENT_LABELS[program.offerRequired as keyof typeof OFFER_REQUIREMENT_LABELS] : null,
                  ].filter(Boolean).join(" · ");
                  return <li key={program.officialName} className="rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-900">{program.nameFr || program.officialName}</p>{facts ? <p className="text-xs text-slate-600">{facts}</p> : null}</li>;
                })}
              </ul>
              <p className="text-xs text-slate-500">{PATHWAY_LABELS[entry.pathway]} · repères indicatifs, à confirmer sur le portail officiel{entry.checkedAt ? ` · vérifié le ${new Date(entry.checkedAt).toLocaleDateString("fr-FR")}` : ""}.</p>
              <Link href={`/pays/${slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-800 underline">Voir les étapes et les sources<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-700" data-testid="client-opportunities-pending">
              <p>{guide.isLoading ? "Chargement…" : `Le guide ${name} est en cours de vérification avec les sources officielles.`}</p>
              {!guide.isLoading ? <p className="text-slate-600">{copy.empty}</p> : null}
              <p className="flex flex-wrap gap-x-4 gap-y-1">
                <Link href="/procedures" className="font-semibold text-blue-800 underline">Procédures détaillées</Link>
                <Link href={`/ressources/${slug}`} className="font-semibold text-blue-800 underline">Ressources {name}</Link>
                {kind === "tourisme" ? <Link href="/evisas" className="font-semibold text-blue-800 underline">Annuaire des e-Visas</Link> : null}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
