import { CheckCircle2, CircleHelp, Info, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicEvaluationCTA } from "@/components/PublicEvaluationCTA";
import { digitalWhatsAppUrl } from "@/lib/companyContacts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PremiumReveal } from "@/components/PremiumReveal";

const SERVICE_OPTIONS = [
  {
    name: "Évaluation gratuite",
    detail: "Première orientation sur votre projet et les informations à confirmer.",
    points: ["Accessible sans compte", "Sans engagement de procédure", "Réponse et périmètre confirmés par un conseiller"],
    accent: "border-blue-200 bg-blue-50",
  },
  {
    name: "Ouverture et suivi de dossier",
    detail: "Les honoraires d’agence sont communiqués pour le service demandé, avant tout règlement.",
    points: ["Périmètre du service expliqué", "Documents et prochaines étapes confirmés", "Reçu et suivi administratif après validation"],
    accent: "border-slate-200 bg-white",
  },
  {
    name: "Accompagnement sur mesure",
    detail: "Certaines demandes exigent un devis individualisé selon la destination, les documents et les prestations retenues.",
    points: ["Devis avant engagement", "Frais tiers distingués des honoraires d’agence", "Aucune décision consulaire ou fournisseur garantie"],
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
  return (
    <TooltipProvider delayDuration={180}>
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <PremiumReveal>
          <header className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[.16em] text-blue-700">Information tarifaire</p>
            <h1 className="premium-section-title mt-3 text-4xl sm:text-5xl">Comprendre les tarifs avant de vous engager</h1>
            <p className="premium-section-lead mx-auto mt-5 text-center text-lg">
              Les prestations, frais tiers et modalités applicables dépendent du service choisi et de votre situation. Une confirmation écrite est donnée avant tout règlement.
            </p>
          </header>
        </PremiumReveal>

        <section className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8" aria-label="Repères tarifaires">
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
                <PublicEvaluationCTA className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  Demander une orientation
                </PublicEvaluationCTA>
              </Card>
            </PremiumReveal>
          ))}
        </section>

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
    </main>
    </TooltipProvider>
  );
}
