import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ExternalLink } from "lucide-react";
import { OFFER_REQUIREMENT_LABELS, PATHWAYS, PATHWAY_LABELS, ROUTE_TYPE_LABELS, STEP_ACTOR_LABELS, type Pathway } from "@shared/countryCatalog";
import { guideCodeForSlug, guideCountryName } from "@shared/countryGuides";
import { trpc } from "@/lib/trpc";
import { setPageSeo } from "@/lib/pageSeo";
import { trackEvent } from "@/lib/analytics";
import { ServicePageShell } from "@/components/ServicePageShell";
import { SocialShareButtons } from "@/components/SocialShareButtons";
import NotFound from "./NotFound";

const dateLabel = (value: string | null) => (value ? new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null);

/** Guide d'un pays : travail, études, visiteur. Les données publiées viennent du serveur ; sinon, « en cours de vérification ». */
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
      title: data ? `Visa ${name} : procédures vérifiées | 3M TRAVEL AGENCY` : `Guide ${name} : en cours de vérification | 3M TRAVEL AGENCY`,
      description: data ? `Étapes, pièces et liens officiels pour ${data.pathways.map((item) => PATHWAY_LABELS[item.pathway].toLowerCase()).join(", ")} (${name}).` : `Le guide ${name} est en cours de vérification avec les sources officielles.`,
    });
  }, [name, data]);

  if (!code || !name) return <NotFound />;

  return (
    <ServicePageShell
      eyebrow={data ? "Guide vérifié" : "Guide en préparation"}
      title={`${name} : visa et procédures`}
      introduction={data ? "Étapes, pièces à préparer et liens officiels, avec la date de vérification de chaque source." : "Nous ne publions un guide qu'après relecture des pages officielles du pays."}
      primaryHref={`/?destination=${encodeURIComponent(name)}#evaluation-multi`}
      primaryLabel="Évaluer mon profil"
      secondaryHref="/pays"
      secondaryLabel="Tous les guides"
      officialHref={current?.sources[0]?.url}
      officialLabel={current?.sources[0]?.label}
      notice="Ces repères sont indicatifs : l'éligibilité, les frais et les délais se confirment toujours sur le portail officiel du pays."
    >
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6" data-testid="country-guide">
        {guide.isLoading ? <p className="text-slate-600" role="status">Chargement du guide…</p> : null}
        {!guide.isLoading && !data ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-slate-800" role="status" data-testid="country-guide-pending">
            <p className="font-semibold">Le guide {name} est en cours de vérification.</p>
            <p className="mt-1 text-sm">En attendant, consultez les <Link href="/procedures" className="font-semibold text-blue-800 underline">procédures détaillées</Link>, l'<Link href="/evisas" className="font-semibold text-blue-800 underline">annuaire des e-Visas</Link> ou les <Link href="/pays" className="font-semibold text-blue-800 underline">guides déjà disponibles</Link>.</p>
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
                  ].filter(Boolean);
                  const notes = [program.salaryNote, program.durationNote, program.feesNote, program.processingNote, program.residencePathNote].filter(Boolean) as string[];
                  return (
                    <article key={program.officialName} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">{program.nameFr || program.officialName}</h3>
                      {program.nameFr ? <p className="text-sm text-slate-500">{program.officialName}</p> : null}
                      {facts.length ? <p className="mt-2 flex flex-wrap gap-2">{facts.map((fact) => <span key={String(fact)} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-900">{fact}</span>)}</p> : null}
                      {notes.map((note) => <p key={note} className="mt-3 text-sm leading-6 text-slate-700">{note}</p>)}
                      {program.steps.length > 0 ? (
                        <ol className="mt-4 space-y-3">
                          {program.steps.map((step) => (
                            <li key={step.stepNo} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                              <p><strong>{STEP_ACTOR_LABELS[step.actor as keyof typeof STEP_ACTOR_LABELS] ?? step.actor} :</strong> {step.title}</p>
                              {step.description ? <p className="mt-1 text-slate-600">{step.description}</p> : null}
                              {step.documents.length ? <p className="mt-1 text-slate-600">Pièces : {step.documents.join(", ")}</p> : null}
                              {step.delayNote || step.feeNote ? <p className="mt-1 text-slate-600">{[step.delayNote, step.feeNote].filter(Boolean).join(" · ")}</p> : null}
                              {step.officialUrl ? <a href={step.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-blue-800 underline">Page officielle<ExternalLink className="h-3 w-3" aria-hidden="true" /></a> : null}
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </article>
                  );
                })}
                {current.sources.length > 0 ? (
                  <section aria-label="Sources officielles">
                    <h3 className="text-lg font-black text-slate-950">Sources officielles</h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      {current.sources.map((source) => (
                        <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("country_guide_source_click", { country: name, pathway: current.pathway })} className="inline-flex items-center gap-1 font-semibold text-blue-800 underline">{source.label}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a>{source.checkedAt ? <span className="text-slate-500"> · vérifié le {dateLabel(source.checkedAt)}</span> : null}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
            <SocialShareButtons title={`Visa ${name} : procédures vérifiées`} className="mt-8" />
          </>
        ) : null}
      </section>
    </ServicePageShell>
  );
}
