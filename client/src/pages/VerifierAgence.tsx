import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { ChecklistSection, CommitmentsSection, FaqSection, StepsSection } from "@/components/PageEnrichment";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { COMPANY_PROFILE } from "@/lib/companyContacts";
import { AGENCY_3M_DOES, AGENCY_CHECKS, AGENCY_CHECK_FAQ, AGENCY_IF_SCAMMED, AGENCY_RED_FLAGS } from "@/data/contentCampaign";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";

const TITLE = "Vérifier une agence avant de payer | 3M TRAVEL AGENCY";
const DESCRIPTION = "Signes d’une offre frauduleuse, vérifications à faire avant de payer une agence de visa, d’études ou d’emploi, et ce que 3M TRAVEL AGENCY s’engage à faire et à ne jamais faire.";

export default function VerifierAgence() {
  useEffect(() => {
    setPageSeo({ title: TITLE, description: DESCRIPTION });
  }, []);

  const identity = COMPANY_PROFILE.legalIdentifiers;

  return (
    <ServicePageShell
      eyebrow="Confiance · Se protéger des arnaques"
      title="Vérifier une agence avant de payer"
      introduction="Les promesses de visa, d’emploi ou d’admission « assurés » sont le signe le plus courant d’une escroquerie. Voici comment reconnaître une offre douteuse, quoi vérifier avant de payer, et ce que vous pouvez exiger de nous."
      primaryHref="/contact"
      primaryLabel="Poser une question à l’agence"
      secondaryHref="/faq"
      secondaryLabel="Questions fréquentes"
      notice="Cette page est un guide général de prévention. Aucune agence, y compris la nôtre, ne peut décider à la place des autorités, des écoles ou des employeurs."
      heroVisual={getServiceVisual("mobilite")}
    >
      <CommitmentsSection
        title="Les signaux d’alerte"
        introduction="Un seul de ces signes suffit pour suspendre tout paiement et vérifier."
        items={AGENCY_RED_FLAGS}
        tone="slate"
        testId="agency-red-flags"
      />

      <StepsSection
        title="Ce qu’il faut vérifier avant de payer"
        introduction="Six vérifications simples, à faire avec n’importe quelle agence."
        steps={AGENCY_CHECKS}
        testId="agency-checks"
      />

      <ChecklistSection
        title="Ce que 3M TRAVEL AGENCY s’engage à faire"
        introduction="Vous pouvez nous les réclamer à tout moment."
        items={AGENCY_3M_DOES}
        tone="blue"
        testId="agency-3m-does"
      />

      <ServiceSection title="Vérifier 3M TRAVEL AGENCY" introduction="Ne nous croyez pas sur parole : recoupez ces informations.">
        <div className="grid gap-6 lg:grid-cols-2" data-testid="agency-identity">
          <dl className="rounded-2xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
            <div className="flex flex-wrap gap-x-2 border-b border-slate-100 py-2"><dt className="font-bold text-slate-900">Raison sociale :</dt><dd className="text-slate-700">{COMPANY_PROFILE.legalName}</dd></div>
            <div className="flex flex-wrap gap-x-2 border-b border-slate-100 py-2"><dt className="font-bold text-slate-900">Registre :</dt><dd className="text-slate-700">{identity.registryAuthority}</dd></div>
            <div className="flex flex-wrap gap-x-2 border-b border-slate-100 py-2"><dt className="font-bold text-slate-900">Numéro d’immatriculation :</dt><dd className="text-slate-700">{identity.registration}</dd></div>
            <div className="flex flex-wrap gap-x-2 border-b border-slate-100 py-2"><dt className="font-bold text-slate-900">Identifiant fiscal :</dt><dd className="text-slate-700">{identity.taxpayerId}</dd></div>
            <div className="flex flex-wrap gap-x-2 py-2"><dt className="font-bold text-slate-900">Adresse :</dt><dd className="text-slate-700">Biyem-Assi, Montée Chapelle Obili, Yaoundé, Cameroun</dd></div>
          </dl>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 text-sm leading-6 text-slate-700">
            <p className="font-black text-slate-950">Comment recouper</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Recherchez notre numéro sur le portail officiel du registre du commerce : il doit correspondre à notre raison sociale.</li>
              <li>Venez à l’agence à Yaoundé ou demandez un échange en visioconférence.</li>
              <li>Écrivez-nous depuis notre domaine officiel : <strong>{COMPANY_PROFILE.publicEmail}</strong>.</li>
            </ul>
            <a href={identity.registrySearchUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-black text-blue-900 hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
              Ouvrir le registre officiel <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </ServiceSection>

      <ChecklistSection
        title="Si vous avez déjà payé une agence douteuse"
        introduction="Agissez vite et gardez tout."
        items={AGENCY_IF_SCAMMED}
        tone="slate"
        testId="agency-if-scammed"
      />

      <FaqSection title="Questions sur la vérification" items={AGENCY_CHECK_FAQ} testId="agency-faq" />
    </ServicePageShell>
  );
}
