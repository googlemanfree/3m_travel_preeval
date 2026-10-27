import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowRight } from "lucide-react";
import { OFFER_REQUIREMENT_LABELS, PATHWAYS, PATHWAY_LABELS, ROUTE_TYPE_LABELS, STEP_ACTOR_LABELS, type Pathway } from "@shared/countryCatalog";
import { guideCodeForSlug, guideCountryName } from "@shared/countryGuides";
import { trpc } from "@/lib/trpc";
import { setPageSeo } from "@/lib/pageSeo";
import { trackEvent } from "@/lib/analytics";
import { ServicePageShell } from "@/components/ServicePageShell";
import { SocialShareButtons } from "@/components/SocialShareButtons";
import NotFound from "./NotFound";

const dateLabel = (value: string | null) => (value ? new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null);
const yesNo = (value: boolean | null, yes: string, no: string) => (value === null ? null : value ? yes : no);

/**
 * Guide d'un pays : travail, études, visiteur, avec tout le détail (étapes, pièces, délais, frais, durée, famille).
 * Aucun lien vers les sites officiels : le détail est donné ici, et la suite de la procédure se lance avec l'agence.
 */
export default function CountryGuide() {
  const [, params] = useRoute<{ slug: string }>("/pays/:slug");
  const slug = params?.slug ?? "";
  const code = guideCodeForSlug(slug);
  const name = code ? guideCountryName(code) : null;
  const guide = trpc.countryCatalog.guide.useQuery({ slug }, { enabled: Boolean(code), staleTime: 5 * 60 * 1000 });
  const [pathway, setPathway] = useState<Pathway | null>(null);

  const data = guide.data ?? null;
  const current = useMemo(() => data?.pathways.find((item) => item.pathway === (pathway ?? data.pathways[0]?.pathway)) ?? null, [data, pathway]);

  useEffect(() => {
    if (name && data) trackEvent("country_guide_view", { country: name, pathways: data.pathways.map((item) => item.pathway).join(",") });
  }, [name, data]);

  useEffect(() => {
    if (!name) return;
    setPageSeo({
      title: data ? `Visa ${name} : procédures détaillées | 3M TRAVEL AGENCY` : `Guide ${name} : en cours de vérification | 3M TRAVEL AGENCY`,
      description: data ? `Étapes, pièces, délais et frais pour ${data.pathways.map((item) => PATHWAY_LABELS[item.pathway].toLowerCase()).join(", ")} (${name}).` : `Le guide ${name} est en cours de vérification.`,
    });
  }, [name, data]);

  if (!code || !name) return <NotFound />;

  const startHref = `/?destination=${encodeURIComponent(name)}#evaluation-multi`;

  return (
    <ServicePageShell
      eyebrow={data ? "Guide détaillé" : "Guide en préparation"}
      title={`${name} : visa et procédures`}
      introduction={data ? "Toutes les étapes, les pièces à préparer, les délais et les frais, parcours par parcours." : "Nous ne publions un guide qu'après vérification de son contenu."}
      primaryHref={startHref}
      primaryLabel="Lancer ma procédure"
      secondaryHref="/pays"
      secondaryLabel="Tous les guides"
      notice="Ces repères sont indicatifs. Un conseiller 3M TRAVEL AGENCY confirme chaque exigence au moment d'instruire votre dossier."
    >
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6" data-testid="country-guide">
        {guide.isLoading ? <p className="text-slate-600" role="status">Chargement du guide…</p> : null}
        {!guide.isLoading && !data ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-slate-800" role="status" data-testid="country-guide-pending">
            <p className="font-semibold">Le guide {name} est en cours de vérification.</p>
            <p className="mt-1 text-sm">Votre conseiller peut déjà évaluer votre profil pour ce pays. Vous pouvez aussi consulter les <Link href="/procedures" className="font-semibold text-blue-800 underline">procédures détaillées</Link> ou les <Link href="/pays" className="font-semibold text-blue-800 underline">guides déjà disponibles</Link>.</p>
            <Link href={startHref} className="mt-3 inline-flex items-center gap-1 font-semibold text-blue-800 underline">Évaluer mon profil pour {name}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        ) : null}

        {data ? (
          <>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Parcours">
              {PATHWAYS.filter((item) => data.pathways.some((entry) => entry.pathway === item)).map((item) => (
                <button key={item} type="button" role="tab" aria-selected={current?.pathway === item} onClick={() => { setPathway(item); trackEvent("country_guide_pathway", { country: name, pathway: item }); }} className={`rounded-lg border px-4 py-2 text-sm font-bold ${current?.pathway === item ? "border-blue-800 bg-blue-800 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-blue-400"}`}>{PATHWAY_LABELS[item]}</button>
              ))}
            </div>
            {current ? (
              <div className="mt-6 space-y-6" role="tabpanel">
                {current.summary ? <p className="text-lg leading-8 text-slate-800">{current.summary}</p> : null}
                {current.programs.map((program) => {
                  const facts = [
                    program.routeType ? ROUTE_TYPE_LABELS[program.routeType as keyof typeof ROUTE_TYPE_LABELS] : null,
                    program.offerRequired ? OFFER_REQUIREMENT_LABELS[program.offerRequired as keyof typeof OFFER_REQUIREMENT_LABELS] : null,
                    yesNo(program.sponsorLicenceRequired, "Employeur agréé exigé", "Employeur agréé non exigé"),
                    yesNo(program.labourMarketTest, "Test du marché du travail", "Sans test du marché du travail"),
                    yesNo(program.renewable, "Renouvelable", "Non renouvelable"),
                    yesNo(program.familyAllowed, "Famille admise", "Famille non admise"),
                  ].filter(Boolean) as string[];
                  const notes = [program.legalBasis, program.salaryNote, program.durationNote, program.feesNote, program.processingNote, program.residencePathNote].filter(Boolean) as string[];
                  return (
                    <article key={program.officialName} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">{program.nameFr || program.officialName}</h3>
                      {program.nameFr ? <p className="text-sm text-slate-500">{program.officialName}</p> : null}
                      {facts.length ? <p className="mt-2 flex flex-wrap gap-2">{facts.map((fact) => <span key={fact} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-900">{fact}</span>)}</p> : null}
                      {notes.map((note) => <p key={note} className="mt-3 text-sm leading-6 text-slate-700">{note}</p>)}
                      {program.steps.length > 0 ? (
                        <ol className="mt-4 space-y-3">
                          {program.steps.map((step) => (
                            <li key={step.stepNo} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                              <p><strong>{step.stepNo}. {STEP_ACTOR_LABELS[step.actor as keyof typeof STEP_ACTOR_LABELS] ?? step.actor} :</strong> {step.title}</p>
                              {step.description ? <p className="mt-1 text-slate-600">{step.description}</p> : null}
                              {step.documents.length ? <p className="mt-1 text-slate-600">Pièces : {step.documents.join(", ")}</p> : null}
                              {step.delayNote ? <p className="mt-1 text-slate-600">Délai : {step.delayNote}</p> : null}
                              {step.feeNote ? <p className="mt-1 text-slate-600">Frais : {step.feeNote}</p> : null}
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </article>
                  );
                })}
                {current.verifiedAt ? <p className="text-sm text-slate-500">Repères vérifiés le {dateLabel(current.verifiedAt)}.</p> : null}
              </div>
            ) : null}

            <aside className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6" aria-labelledby="guide-start-title" data-testid="country-guide-start">
              <h2 id="guide-start-title" className="text-xl font-black text-slate-950">Lancer ma procédure avec 3M TRAVEL AGENCY</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">Évaluation gratuite de votre profil pour {name}, puis un conseiller prépare et suit votre dossier avec vous, étape par étape.</p>
              <Link href={startHref} onClick={() => trackEvent("country_guide_start_click", { country: name, pathway: current?.pathway ?? "" })} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-800 px-5 py-3 text-sm font-bold text-white hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Évaluer mon profil gratuitement<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </aside>
            <SocialShareButtons title={`Visa ${name} : procédures détaillées`} className="mt-8" />
          </>
        ) : null}
      </section>
    </ServicePageShell>
  );
}
