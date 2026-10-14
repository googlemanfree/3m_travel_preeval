import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, FileText, DollarSign, Upload, Briefcase, Award, ShieldCheck, Globe2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { PremiumAtmosphere } from "@/components/PremiumAtmosphere";
import { IllustrativeDestinationStrip } from "@/components/IllustrativeDestinationStrip";
import ProofGallerySection from "@/components/ProofGallerySection";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";
import { INTERNATIONAL_BRAND } from "@/data/internationalBrand";
import { buildFreeEvaluationHref } from "@/components/PublicEvaluationCTA";

export default function HowItWorks() {
  const heroVisual = getServiceVisual("dossier");

  useEffect(() => {
    setPageSeo({
      title: "Comment ça marche : les étapes | 3M TRAVEL AGENCY",
      description:
        "Parcours 3M TRAVEL AGENCY : évaluation, structuration du dossier, pièces, réseau de partenaires autorisés et suivi à distance dans l’espace client — de l’Afrique vers le monde.",
      image: heroVisual.desktop,
      imageAlt: heroVisual.alt,
    });
  }, [heroVisual.desktop, heroVisual.alt]);

  const steps = [
    {
      number: 1,
      title: "Créez votre espace sécurisé",
      description:
        "Inscrivez-vous pour ouvrir un espace client personnel. C’est le tableau de bord où statut, pièces, clarifications et messages restent traçables — à distance ou depuis Yaoundé.",
      icon: FileText,
      color: "bg-blue-100 text-blue-700",
    },
    {
      number: 2,
      title: "Précisez destination et projet",
      description:
        "Indiquez le pays et le type de démarche (études, travail, visa, immigration). Cela oriente la checklist pays × visa et les sources officielles à consulter.",
      icon: Globe2,
      color: "bg-sky-100 text-sky-800",
    },
    {
      number: 3,
      title: "Évaluation guidée de votre profil",
      description:
        "Soumettez parcours académique, expérience et objectif. Un conseiller analyse la cohérence du projet au regard des exigences connues — sans promesse de résultat.",
      icon: FileText,
      color: "bg-emerald-100 text-emerald-800",
    },
    {
      number: 4,
      title: "Bilan et prochaines étapes",
      description:
        "Vous recevez un bilan structuré : voie réaliste, pièces à réunir, frais tiers éventuels et ordre des étapes. Le délai de remise est confirmé par l’équipe pour votre dossier.",
      icon: Clock,
      color: "bg-amber-100 text-amber-900",
    },
    {
      number: 5,
      title: "Frais d’ouverture confirmés par écrit",
      description:
        "Si vous poursuivez, les frais d’ouverture sont confirmés par écrit avant tout paiement. Ils couvrent la structuration administrative du dossier — distincts des frais payés aux autorités.",
      icon: DollarSign,
      color: "bg-rose-100 text-rose-800",
    },
    {
      number: 6,
      title: "Dépôt des pièces (en ligne ou en agence)",
      description:
        "Déposez scans sécurisés depuis votre espace ou remettez les originaux à Yaoundé. Chaque pièce est horodatée ; les rejets et clarifications restent visibles des deux côtés.",
      icon: Upload,
      color: "bg-blue-100 text-blue-800",
    },
    {
      number: 7,
      title: "Réseau de partenaires (si applicable)",
      description:
        "Pour le travail, les profils consentants peuvent être présentés à des agences de placement ou employeurs vérifiés. Aucun emploi n’est promis : l’offre relève du partenaire.",
      icon: Briefcase,
      color: "bg-teal-100 text-teal-800",
    },
    {
      number: 8,
      title: "Suivi jusqu’au dépôt et au-delà",
      description:
        "3M prépare les démarches (visa, autorisation, formalités) et suit chaque étape dans votre espace. Les décisions finales appartiennent toujours aux autorités compétentes.",
      icon: Award,
      color: "bg-emerald-100 text-emerald-800",
    },
  ];

  return (
    <PremiumAtmosphere washVisual={heroVisual} washOpacity={14}>
      <main className="premium-page-shell min-h-screen">
        <section className="relative overflow-hidden px-4 pb-16 pt-20 text-white sm:px-6 lg:px-8">
          <PremiumCoverImage
            visual={heroVisual}
            priority
            className="absolute inset-0"
            imgClassName="h-full w-full object-cover object-center opacity-90 brightness-105 saturate-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#061a36]/94 via-[#0a3264]/82 to-[#0e5b9f]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061a36]/75 via-transparent to-[#061a36]/30" />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">{INTERNATIONAL_BRAND.publicName}</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100/90">{INTERNATIONAL_BRAND.corridor}</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Comment ça marche ?</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50">
              Un parcours international clair : évaluation, dossier documenté, espace client et canaux autorisés — sans promesse de visa, d’emploi ou d’admission.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={buildFreeEvaluationHref("travail")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 shadow-lg transition hover:bg-blue-50"
              >
                {INTERNATIONAL_BRAND.cta.evaluate.fr} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/procedures"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                {INTERNATIONAL_BRAND.cta.procedures.fr}
              </Link>
            </div>
          </div>
        </section>

        <IllustrativeDestinationStrip
          title="Corridors préparés avec méthode"
          lead="Visuels premium du catalogue — pour situer l’ambiance de chaque destination avant de démarrer votre évaluation."
          className="border-b border-slate-200/60 bg-white/50"
        />

        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">Huit étapes, une seule trajectoire</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Du premier contact au suivi post-dépôt : chaque étape est journalisée. Vous savez quoi préparer, quoi payer aux tiers, et ce qui reste de la responsabilité des autorités.
            </p>
          </div>

          <div className="space-y-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex gap-4 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black shadow-sm sm:h-16 sm:w-16 ${step.color}`}>
                      {step.number}
                    </div>
                    {index < steps.length - 1 && <div className="mt-2 w-1 flex-1 min-h-[2.5rem] rounded-full bg-gradient-to-b from-blue-300 to-blue-100" />}
                  </div>
                  <Card className="mb-1 flex-1 border-slate-200/90 bg-white/90 p-5 shadow-sm transition hover:shadow-md sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.color}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-slate-950 sm:text-xl">{step.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">{step.description}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>

          <div className="mt-14 overflow-hidden rounded-3xl border border-blue-900/20 bg-gradient-to-br from-[#061a36] via-[#0a3264] to-[#165dff] p-8 text-center text-white shadow-xl sm:p-10">
            <ShieldCheck className="mx-auto h-10 w-10 text-amber-200" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black sm:text-3xl">Prêt à structurer votre projet international ?</h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-blue-100">
              Évaluez votre profil gratuitement. Un conseiller vous indiquera la voie réaliste, les pièces et les prochaines actions — sans engagement automatique.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={buildFreeEvaluationHref("travail")}>
                <Button className="h-12 rounded-xl bg-white px-8 text-base font-black text-blue-950 hover:bg-blue-50">
                  {INTERNATIONAL_BRAND.cta.evaluate.fr}
                </Button>
              </Link>
              <Link href="/consultation">
                <Button variant="outline" className="h-12 rounded-xl border-white/40 bg-white/10 px-8 font-bold text-white hover:bg-white/20">
                  {INTERNATIONAL_BRAND.cta.advisor.fr}
                </Button>
              </Link>
            </div>
            <p className="mx-auto mt-5 max-w-lg text-xs leading-5 text-blue-200/90">{INTERNATIONAL_BRAND.disclaimer.fr}</p>
          </div>

          <ProofGallerySection
            initialFilter="visas"
            lockFilter
            collapsedCount={3}
            hideWhenEmpty
            className="mt-12 bg-white px-0 py-12"
            titleFr="Preuves de dossiers accompagnés"
            titleEn="Proofs from supported cases"
            leadFr="Extraits anonymisés de visas et autorisations obtenus par des candidats africains accompagnés à distance — jamais de témoignages inventés."
            leadEn="Redacted excerpts of visas and authorisations obtained by African candidates supported remotely — never invented testimonials."
          />

          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-black text-slate-950">Questions fréquentes</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-950">Combien de temps prend le processus ?</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Le délai de remise du bilan est confirmé par l’équipe pour votre dossier. Ensuite, les délais dépendent de la destination, du type de demande et des autorités — aucun délai global n’est promis à l’avance.
                </p>
              </Card>
              <Card className="border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-950">Que se passe-t-il après le paiement ?</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Après confirmation des frais d’ouverture, vous déposez les pièces demandées (en ligne ou en agence). Elles sont vérifiées, puis le dossier avance selon le parcours (visa, partenaires, formalités).
                </p>
              </Card>
              <Card className="border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-950">Puis-je tout faire à distance ?</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Oui pour la majorité des étapes. L’agence de Yaoundé reste disponible pour originaux, paiements en agence et rendez-vous. Ottawa complète le corridor international.
                </p>
              </Card>
              <Card className="border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-950">Garantissez-vous un visa ou un emploi ?</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Non. 3M prépare un dossier cohérent et suit les étapes. Seules les autorités décident des visas ; seuls les employeurs et agences partenaires décident des offres.
                </p>
              </Card>
            </div>
          </div>

          <div className="mt-14 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-8 sm:p-10">
            <h2 className="text-center text-2xl font-black text-slate-950">Pourquoi une méthode internationale</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {INTERNATIONAL_BRAND.trustPillars.slice(0, 3).map((pillar) => (
                <div key={pillar.title.fr} className="text-center sm:text-left">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700 sm:mx-0" aria-hidden="true" />
                  <h3 className="mt-3 font-bold text-slate-950">{pillar.title.fr}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{pillar.text.fr}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </PremiumAtmosphere>
  );
}
