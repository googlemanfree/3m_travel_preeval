import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Compass, FileCheck2, MessageCircle, MapPin, WalletCards } from "lucide-react";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { FaqSection } from "@/components/PageEnrichment";
import { setPageSeo } from "@/lib/pageSeo";
import { CENTRAL_AFRICA_COMMITMENTS, CENTRAL_AFRICA_COUNTRIES, CENTRAL_AFRICA_DESTINATIONS, CENTRAL_AFRICA_DOCUMENTS, CENTRAL_AFRICA_FAQ, CENTRAL_AFRICA_STEPS } from "@/data/afriqueCentrale";

const COMMITMENT_ICONS = [Compass, FileCheck2, MessageCircle, WalletCards];
const WHATSAPP = "https://wa.me/237698104832?text=" + encodeURIComponent("Bonjour, je suis en Afrique centrale et je souhaite être accompagné pour mon projet de mobilité internationale.");

/** Page de référence pour les candidats d'Afrique centrale : ce que fait 3M, les étapes, les pièces à anticiper, les destinations et les réponses clés. */
export default function AfriqueCentrale() {
  useEffect(() => {
    setPageSeo({
      title: "Mobilité internationale depuis l’Afrique centrale | 3M TRAVEL AGENCY",
      description: "Études, travail, voyage et visas depuis le Cameroun, le Gabon, le Congo, la RDC, le Tchad : évaluation gratuite, dossier préparé pièce par pièce, suivi à distance et honoraires clairs en FCFA.",
    });
  }, []);
  return (
    <ServicePageShell
      eyebrow="Afrique centrale · Cameroun · Gabon · Congo · RDC · Tchad"
      title="Votre mobilité internationale, depuis l’Afrique centrale"
      introduction="Études, travail, voyage, visas : 3M TRAVEL AGENCY accompagne les candidats d’Afrique centrale avec une évaluation gratuite, un dossier préparé pièce par pièce, un suivi à distance en français et des honoraires clairs en FCFA. Bureaux à Yaoundé et Ottawa."
      primaryHref="/consultation"
      primaryLabel="Évaluer mon projet — gratuit"
      secondaryHref="/outils/parcours-mobilite"
      secondaryLabel="Trouver mon parcours"
      notice="Aucun résultat n’est garanti : la décision finale appartient aux autorités, aux établissements et aux employeurs. Vérifiez toujours les exigences sur les sources officielles."
    >
      <ServiceSection title="Ce que 3M fait pour les candidats d’Afrique centrale" introduction="Quatre engagements concrets, que vous pouvez vérifier dès le premier échange.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="central-africa-commitments">
          {CENTRAL_AFRICA_COMMITMENTS.map((item, index) => {
            const Icon = COMMITMENT_ICONS[index];
            return (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-7 w-7 text-blue-700" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                <Link href={item.href} className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-blue-800 underline underline-offset-4">{item.label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              </article>
            );
          })}
        </div>
      </ServiceSection>

      <ServiceSection tone="slate" title="Votre parcours en cinq étapes" introduction="De la première question au dépôt du dossier, voici l’ordre qui évite les erreurs coûteuses.">
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="central-africa-steps">
          {CENTRAL_AFRICA_STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white" aria-hidden="true">{index + 1}</span>
              <h3 className="mt-3 text-lg font-black text-slate-950"><span className="sr-only">Étape {index + 1} : </span>{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
              <Link href={step.href} className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-blue-800 underline underline-offset-4">{step.label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </li>
          ))}
        </ol>
      </ServiceSection>

      <ServiceSection title="Les pièces à anticiper dès maintenant" introduction="La liste exacte dépend du pays et du programme, mais ces documents reviennent presque toujours. Les réunir tôt fait gagner des semaines.">
        <ul className="grid gap-3 md:grid-cols-2" data-testid="central-africa-documents">
          {CENTRAL_AFRICA_DOCUMENTS.map((item) => (
            <li key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate-600">Faire traduire ou légaliser un document : <Link href="/guides/legalisation-apostille-traduction" className="font-bold text-blue-800 underline underline-offset-4">lisez notre guide</Link> ou <Link href="/traduction/order" className="font-bold text-blue-800 underline underline-offset-4">commandez une traduction</Link>.</p>
      </ServiceSection>

      <ServiceSection tone="blue" title="Destinations et démarches à explorer" introduction="Des guides détaillés, pays par pays, avec des liens vers les sources officielles.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="central-africa-destinations">
          {CENTRAL_AFRICA_DESTINATIONS.map((item) => (
            <Link key={item.href} href={item.href} className="group block rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <h3 className="text-base font-black text-slate-950">{item.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-blue-800">Ouvrir<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </ServiceSection>

      <ServiceSection title="Où nous joindre" introduction="Un interlocuteur unique, en français, par le canal que vous préférez.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6"><MapPin className="h-6 w-6 text-blue-700" aria-hidden="true" /><h3 className="mt-3 text-lg font-black">Yaoundé et Ottawa</h3><p className="mt-2 text-sm leading-6 text-slate-600">Deux bureaux, un même suivi. Les adresses et la carte sont sur la page Contact.</p><Link href="/contact" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-blue-800 underline underline-offset-4">Page Contact</Link></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6"><MessageCircle className="h-6 w-6 text-emerald-700" aria-hidden="true" /><h3 className="mt-3 text-lg font-black">WhatsApp</h3><p className="mt-2 text-sm leading-6 text-slate-600">Écrivez-nous votre projet en quelques lignes : un conseiller vous répond.</p><a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4" data-testid="central-africa-whatsapp">Discuter sur WhatsApp</a></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6"><Compass className="h-6 w-6 text-blue-700" aria-hidden="true" /><h3 className="mt-3 text-lg font-black">Pays accompagnés</h3><p className="mt-2 text-sm leading-6 text-slate-600">{CENTRAL_AFRICA_COUNTRIES.join(", ")}, et d’autres pays d’Afrique.</p></div>
        </div>
      </ServiceSection>

      <FaqSection introduction="Les réponses utiles avant de commencer." items={[...CENTRAL_AFRICA_FAQ]} testId="central-africa-faq" />
    </ServicePageShell>
  );
}
