import { useEffect } from "react";
import { CommitmentsSection } from "@/components/PageEnrichment";
import { TARIFS_CONCRETE_BLOCKS, TARIFS_COST_PARTS, TARIFS_FEE_EXAMPLES, TARIFS_SAMPLE_DEVIS } from "@/data/pageEnrichment";
import { CheckCircle2, CircleHelp, Info, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicEvaluationCTA } from "@/components/PublicEvaluationCTA";
import { digitalWhatsAppUrl } from "@/lib/companyContacts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PremiumReveal } from "@/components/PremiumReveal";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { PremiumAtmosphere } from "@/components/PremiumAtmosphere";
import ProofGallerySection from "@/components/ProofGallerySection";
import { getServiceVisual } from "@/data/premiumVisuals";
import { INTERNATIONAL_BRAND } from "@/data/internationalBrand";
import { setPageSeo } from "@/lib/pageSeo";

const SERVICE_OPTIONS = [
  {
    name: "Évaluation gratuite",
    detail: "Première orientation sur votre projet. Compte gratuit puis dépôt de CV pour un suivi complet — ou formulaire rapide sans compte.",
    points: ["Sans engagement de procédure", "Créer un compte gratuit, puis déposer mon CV", "Réponse et périmètre confirmés par un conseiller"],
    accent: "border-blue-200 bg-blue-50",
  },
  {
    name: "Ouverture de dossier — dès 65 000 FCFA",
    detail: "Frais d’ouverture indicatifs selon le profil ; montant exact confirmé par écrit avant tout paiement, avec reçu officiel.",
    points: ["À partir de 65 000 FCFA", "Périmètre et checklist confirmés", "Suivi administratif après validation du règlement"],
    accent: "border-slate-200 bg-white",
  },
  {
    name: "Accompagnement sur mesure",
    detail: "Honoraires d’accompagnement (intégral, échelonné ou différé) selon destination et prestations — fourchettes indicatives ci-dessous, devis écrit avant engagement.",
    points: ["Fourchettes publiées à titre indicatif", "Devis écrit avant engagement", "Frais tiers (consulat, biométrie, etc.) exclus"],
    accent: "border-emerald-200 bg-emerald-50",
  },
];

function TechnicalTerm({ label, explanation }: { label: string; explanation: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex items-center gap-1 rounded-sm font-semibold text-blue-800 underline decoration-dotted underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={`Définition : ${label}`}>
          {label}<CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm leading-5">{explanation}</TooltipContent>
    </Tooltip>
  );
}

export default function Tarifs() {
  const heroVisual = getServiceVisual("dossier");

  useEffect(() => {
    setPageSeo({
      title: "Tarifs et honoraires | 3M TRAVEL AGENCY",
      description:
        "Tarifs 3M TRAVEL AGENCY : fourchettes d’honoraires (65 000 – 800 000 FCFA selon le service), ouverture dès 65 000 FCFA, exemple de devis, frais tiers exclus.",
      image: heroVisual.desktop,
      imageAlt: heroVisual.alt,
    });
  }, [heroVisual.desktop, heroVisual.alt]);

  return (
    <TooltipProvider delayDuration={180}>
    <PremiumAtmosphere washVisual={heroVisual} washOpacity={12}>
    <main className="min-h-screen">
      <section className="relative overflow-hidden px-4 pb-14 pt-16 text-white sm:px-6 lg:px-8">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061a36]/94 via-[#0a3264]/82 to-[#0e5b9f]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061a36]/60 via-transparent to-[#061a36]/25" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="font-[Georgia,Cambria,'Times_New_Roman',serif] text-3xl font-normal tracking-tight text-amber-200 sm:text-4xl">
            {INTERNATIONAL_BRAND.publicName}
          </p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/90">{INTERNATIONAL_BRAND.corridor}</p>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">Comprendre les tarifs avant de vous engager</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50">
            Honoraires d’agence indicatifs : <strong className="font-black text-white">65 000 – 150 000 FCFA</strong> (e-Visa / court séjour),{" "}
            <strong className="font-black text-white">200 000 – 450 000 FCFA</strong> (Schengen / études Europe),{" "}
            <strong className="font-black text-white">350 000 – 800 000 FCFA</strong> (Canada). Frais consulaires exclus — devis écrit avant règlement.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">

        <section className="mb-12" aria-labelledby="tarifs-fee-examples-title" data-testid="tarifs-fee-examples">
          <h2 id="tarifs-fee-examples-title" className="premium-section-title text-2xl">Fourchettes par type de service</h2>
          <p className="premium-copy mt-3 max-w-3xl text-base">
            Montants d’honoraires d’agence pour vous situer avant le contact. Le devis écrit confirme le périmètre ; les frais consulaires, biométrie, traductions et scolarité restent exclus.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {TARIFS_FEE_EXAMPLES.map((example) => (
              <article key={example.label} className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/80 to-white p-5 sm:p-6">
                <h3 className="text-sm font-black uppercase tracking-wide text-blue-900">{example.label}</h3>
                <p className="mt-3 text-xl font-black tabular-nums leading-tight text-slate-950 sm:text-2xl" data-testid="tarifs-fee-range">{example.range}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{example.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-12 overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-labelledby="tarifs-sample-devis-title" data-testid="tarifs-sample-devis">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
            <h2 id="tarifs-sample-devis-title" className="text-lg font-black text-slate-950 sm:text-xl">{TARIFS_SAMPLE_DEVIS.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{TARIFS_SAMPLE_DEVIS.subtitle}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-5 py-3 sm:px-6">Poste</th>
                  <th scope="col" className="px-5 py-3 sm:px-6">Montant</th>
                  <th scope="col" className="hidden px-5 py-3 sm:table-cell sm:px-6">Détail</th>
                </tr>
              </thead>
              <tbody>
                {TARIFS_SAMPLE_DEVIS.lines.map((line) => (
                  <tr key={line.poste} className="border-b border-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-900 sm:px-6">
                      {line.poste}
                      <p className="mt-0.5 text-xs font-normal text-slate-500 sm:hidden">{line.note}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-black tabular-nums text-slate-950 sm:px-6">{line.montant}</td>
                    <td className="hidden px-5 py-3 text-slate-600 sm:table-cell sm:px-6">{line.note}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50/60">
                  <th scope="row" className="px-5 py-4 text-base font-black text-slate-950 sm:px-6">Total honoraires (exemple)</th>
                  <td className="whitespace-nowrap px-5 py-4 text-lg font-black tabular-nums text-blue-900 sm:px-6" colSpan={2}>{TARIFS_SAMPLE_DEVIS.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="border-t border-slate-100 px-5 py-4 text-xs leading-5 text-slate-500 sm:px-6">{TARIFS_SAMPLE_DEVIS.disclaimer}</p>
        </section>

        <section className="mb-12 grid gap-4 sm:grid-cols-2" aria-label="Tarifs concrets avant contact" data-testid="tarifs-concrete">
          {TARIFS_CONCRETE_BLOCKS.map((block) => (
            <article key={block.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-black text-slate-950 sm:text-lg">{block.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{block.text}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-3 md:gap-8" aria-label="Repères tarifaires">
          {SERVICE_OPTIONS.map((option, index) => (
            <PremiumReveal key={option.name} delay={index * 0.06}>
              <Card className={`flex h-full flex-col border p-7 shadow-sm sm:p-8 ${option.accent}`}>
                <h2 className="premium-section-title text-xl">{option.name}</h2>
                <p className="premium-copy mt-3 text-[0.95rem]">{option.detail}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {option.points.map((point) => (
                    <li key={point} className="flex gap-2 text-base leading-7 text-slate-700"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-700" />{point}</li>
                  ))}
                </ul>
                <PublicEvaluationCTA
                  hint
                  hintClassName="text-center text-xs leading-5 text-slate-600"
                  className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Demander une orientation
                </PublicEvaluationCTA>
              </Card>
            </PremiumReveal>
          ))}
        </section>

        <ProofGallerySection
          initialFilter="all"
          collapsedCount={3}
          hideWhenEmpty
          className="mt-14 bg-transparent px-0 py-4"
          titleFr="Des résultats concrets, pas seulement des prix"
          titleEn="Concrete results, not just prices"
          leadFr="Extraits anonymisés de visas et autorisations obtenus avec l’accompagnement 3M."
          leadEn="Redacted excerpts of visas and authorisations obtained with 3M support."
        />

        <PremiumReveal className="mt-14">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8" aria-labelledby="tarifs-transparence">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-6 w-6 shrink-0 text-amber-800" aria-hidden="true" />
              <div>
                <h2 id="tarifs-transparence" className="premium-section-title text-xl text-amber-950">Ce qui doit être confirmé avant paiement</h2>
                <p className="mt-3 text-base leading-7 text-amber-950">
                  Les <TechnicalTerm label="frais tiers" explanation="Sommes facturées par une autorité, un consulat, un centre biométrique, un assureur, un traducteur ou un autre fournisseur, et non par l’agence." /> ne sont pas présumés inclus. Leur montant, leur destinataire et leurs conditions sont précisés selon la procédure. Aucune garantie générale de <TechnicalTerm label="remboursement" explanation="Un remboursement éventuel dépend d’une politique écrite applicable au service concerné et, pour les frais tiers, des règles de l’organisme qui les reçoit." />, de visa, de permis, de contrat ou de résultat n’est affichée sans politique écrite applicable à votre dossier.
                </p>
              </div>
            </div>
          </section>
        </PremiumReveal>

        <PremiumReveal className="mt-12" delay={0.08}>
          <section className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-8" aria-labelledby="tarifs-questions">
            <h2 id="tarifs-questions" className="premium-section-title text-2xl">Questions fréquentes</h2>
            <Accordion type="single" collapsible className="mt-6 divide-y divide-slate-200">
              <AccordionItem value="frais-confirms"><AccordionTrigger className="text-left text-base font-bold text-slate-900">Les frais sont-ils définitifs&nbsp;?</AccordionTrigger><AccordionContent className="premium-copy text-base">Les honoraires d’agence sont confirmés par écrit pour le service retenu. Les frais de tiers — administration, consulat, biométrie, assurance, traduction ou fournisseur — peuvent évoluer selon leurs propres règles et sont distingués avant paiement.</AccordionContent></AccordionItem>
              <AccordionItem value="frais-tiers"><AccordionTrigger className="text-left text-base font-bold text-slate-900">Quels frais peuvent être facturés par des tiers&nbsp;?</AccordionTrigger><AccordionContent className="premium-copy text-base">Selon la démarche, des organismes externes peuvent facturer des frais gouvernementaux, consulaires, médicaux, biométriques, de traduction, d’assurance ou de fournisseur. Leur montant, destinataire et éventuelles conditions sont expliqués avant votre décision.</AccordionContent></AccordionItem>
              <AccordionItem value="remboursement"><AccordionTrigger className="text-left text-base font-bold text-slate-900">Existe-t-il un remboursement automatique&nbsp;?</AccordionTrigger><AccordionContent className="premium-copy text-base">Non. Une éventuelle condition de remboursement dépend d’une politique écrite applicable au service et au dossier concerné. Les frais versés à des autorités ou fournisseurs peuvent suivre leurs propres règles ; ils ne sont jamais présumés remboursables.</AccordionContent></AccordionItem>
              <AccordionItem value="devis"><AccordionTrigger className="text-left text-base font-bold text-slate-900">Comment demander un devis ou une explication&nbsp;?</AccordionTrigger><AccordionContent className="premium-copy text-base">Présentez votre projet : un conseiller indique le périmètre du service, les documents attendus, les frais connus et les limites applicables. Vous choisissez de poursuivre uniquement après avoir reçu ces informations.</AccordionContent></AccordionItem>
            </Accordion>
            <a href={digitalWhatsAppUrl("Bonjour 3M TRAVEL AGENCY, je souhaite demander une précision tarifaire.")} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 px-5 py-3 text-sm font-black text-blue-800 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"><MessageCircle className="h-4 w-4" />Poser une question tarifaire</a>
          </section>
        </PremiumReveal>
      </div>
      <CommitmentsSection title="Comment se décompose le coût total" introduction="Trois postes distincts, annoncés séparément, pour que vous sachiez toujours qui perçoit quoi." items={TARIFS_COST_PARTS} tone="blue" testId="tarifs-cost-parts" />
    </main>
    </PremiumAtmosphere>
    </TooltipProvider>
  );
}
