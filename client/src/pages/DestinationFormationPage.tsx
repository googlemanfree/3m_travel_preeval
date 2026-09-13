import { useEffect } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, ArrowRight, Briefcase, FileCheck2, Globe2, MapPin } from "lucide-react";
import { getDestination20 } from "@/data/destinations20";

interface DestinationFormationPageProps {
  slug: string;
}

export default function DestinationFormationPage({ slug }: DestinationFormationPageProps) {
  const destination = getDestination20(slug);

  useEffect(() => {
    if (!destination) return;
    document.title = `${destination.name} : formation & travail qualifié | 3M Travel & Services`;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      `${destination.dispositif} Repères sur le visa, les secteurs porteurs et l'accompagnement 3M Travel & Services depuis Yaoundé pour ${destination.name}.`,
    );
  }, [destination]);

  if (!destination) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-24 text-center">
        <h1 className="text-3xl font-black text-slate-950">Destination non trouvée</h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">Cette destination n'est pas encore disponible dans notre répertoire.</p>
        <Link href="/destinations" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />Retour aux destinations
        </Link>
      </main>
    );
  }

  const evalLink = `/evaluation?project=etudes&destination=${encodeURIComponent(destination.name)}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_15%,rgba(96,165,250,.45),transparent_28%),linear-gradient(125deg,#061a36,#0a3264_55%,#0e5b9f)] px-4 pb-16 pt-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/destinations" className="inline-flex items-center gap-2 text-sm font-bold text-blue-100 hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />Toutes les destinations
          </Link>
          <p className="mt-8 text-5xl" aria-hidden="true">{destination.flag}</p>
          <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-blue-100">Formation &amp; travail qualifié · {destination.region}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">{destination.name}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50">{destination.dispositif}</p>
          <Link href={evalLink} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            Démarrer mon évaluation gratuite <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex gap-3 rounded-xl bg-blue-50 p-4">
              <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">Secteurs porteurs</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{destination.secteurs.join(", ")}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-blue-50 p-4">
              <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">Visa / dispositif</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{destination.visa}</p>
              </div>
            </div>
            {destination.langue && (
              <div className="flex gap-3 rounded-xl bg-blue-50 p-4">
                <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">Langue</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{destination.langue}</p>
                </div>
              </div>
            )}
            <div className="flex gap-3 rounded-xl bg-blue-50 p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">Région</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{destination.region}</p>
              </div>
            </div>
          </div>

          {destination.etapesCles && (
            <div className="mt-8">
              <h2 className="text-lg font-black text-slate-950">Étapes clés</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{destination.etapesCles}</p>
            </div>
          )}

          {destination.pointFort && (
            <div className="mt-6 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm leading-6 text-emerald-900"><strong>Point fort — </strong>{destination.pointFort}</p>
            </div>
          )}

          {destination.pointVigilance && (
            <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <p className="text-sm leading-6 text-amber-900"><strong>Point de vigilance — </strong>{destination.pointVigilance}</p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl bg-blue-900 p-6 text-white sm:p-10">
          <h2 className="text-xl font-black">3M Travel &amp; Services vous accompagne</h2>
          <p className="mt-3 text-sm leading-6 text-blue-100">
            Évaluation de votre profil, orientation vers la destination la plus réaliste, préparation du dossier et suivi jusqu'à votre installation.
          </p>
          <Link href={evalLink} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            Démarrer mon évaluation gratuite <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>

        <footer className="mt-8 rounded-2xl bg-amber-50 p-6">
          <p className="text-sm leading-6 text-amber-900">
            Les niveaux de sélectivité, seuils de salaire et exigences linguistiques évoluent régulièrement selon la politique migratoire de chaque pays. 3M Travel &amp; Services accompagne la préparation des dossiers ; la décision finale relève exclusivement des autorités, employeurs ou établissements de formation du pays visé.
          </p>
          <p className="mt-3 text-xs leading-5 text-amber-800">Dernière vérification des sources : 13 septembre 2026.</p>
        </footer>
      </div>
    </main>
  );
}
