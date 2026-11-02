import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { ChecklistSection, CommitmentsSection, FaqSection, StepsSection } from "@/components/PageEnrichment";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { COMPANY_PROFILE } from "@/lib/companyContacts";
import { EN_AGENCY_3M_DOES, EN_AGENCY_CHECKS, EN_AGENCY_CHECK_FAQ, EN_AGENCY_IF_SCAMMED, EN_AGENCY_RED_FLAGS } from "@/data/contentCampaignEn";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";

const TITLE = "Check an agency before paying | 3M TRAVEL AGENCY";
const DESCRIPTION = "Signs of a fraudulent offer, checks to make before paying a visa, study or job agency, and what 3M TRAVEL AGENCY commits to doing and never doing.";

export default function EnVerifyAgency() {
  useEffect(() => {
    setPageSeo({ title: TITLE, description: DESCRIPTION });
    document.documentElement.lang = "en";
  }, []);

  const identity = COMPANY_PROFILE.legalIdentifiers;

  return (
    <ServicePageShell
      lang="en"
      eyebrow="Trust · Protect yourself from scams"
      title="Check an agency before paying"
      introduction="Promises of an “assured” visa, job or admission are the most common sign of a scam. Here is how to recognise a doubtful offer, what to check before paying, and what you can demand from us."
      primaryHref="/contact"
      primaryLabel="Ask the agency a question"
      secondaryHref="/en/faq"
      secondaryLabel="Frequently asked questions"
      notice="This page is a general prevention guide. No agency, including ours, can decide in place of authorities, schools or employers."
      heroVisual={getServiceVisual("mobilite")}
    >
      <CommitmentsSection title="Warning signs" introduction="A single one of these signs is enough to suspend any payment and check." items={EN_AGENCY_RED_FLAGS} tone="slate" testId="en-agency-red-flags" />

      <StepsSection title="What to check before paying" introduction="Six simple checks, to run with any agency." steps={EN_AGENCY_CHECKS} testId="en-agency-checks" />

      <ChecklistSection title="What 3M TRAVEL AGENCY commits to doing" introduction="You can ask us for any of these at any time." items={EN_AGENCY_3M_DOES} tone="blue" testId="en-agency-3m-does" />

      <ServiceSection title="Check 3M TRAVEL AGENCY" introduction="Don’t take our word for it: cross-check this information.">
        <div className="grid gap-6 lg:grid-cols-2" data-testid="en-agency-identity">
          <dl className="rounded-2xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
            <div className="flex flex-wrap gap-x-2 border-b border-slate-100 py-2"><dt className="font-bold text-slate-900">Company name:</dt><dd className="text-slate-700">{COMPANY_PROFILE.legalName}</dd></div>
            <div className="flex flex-wrap gap-x-2 border-b border-slate-100 py-2"><dt className="font-bold text-slate-900">Register:</dt><dd className="text-slate-700">{identity.registryAuthority}</dd></div>
            <div className="flex flex-wrap gap-x-2 border-b border-slate-100 py-2"><dt className="font-bold text-slate-900">Registration number:</dt><dd className="text-slate-700">{identity.registration}</dd></div>
            <div className="flex flex-wrap gap-x-2 border-b border-slate-100 py-2"><dt className="font-bold text-slate-900">Tax identifier:</dt><dd className="text-slate-700">{identity.taxpayerId}</dd></div>
            <div className="flex flex-wrap gap-x-2 py-2"><dt className="font-bold text-slate-900">Address:</dt><dd className="text-slate-700">Biyem-Assi, Montée Chapelle Obili, Yaoundé, Cameroon</dd></div>
          </dl>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 text-sm leading-6 text-slate-700">
            <p className="font-black text-slate-950">How to cross-check</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Look up our number on the official trade-register portal: it must match our company name.</li>
              <li>Come to the agency in Yaoundé or ask for a video call.</li>
              <li>Write to us from our official domain: <strong>{COMPANY_PROFILE.publicEmail}</strong>.</li>
            </ul>
            <a href={identity.registrySearchUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-black text-blue-900 hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
              Open the official register <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </ServiceSection>

      <ChecklistSection title="If you have already paid a doubtful agency" introduction="Act quickly and keep everything." items={EN_AGENCY_IF_SCAMMED} tone="slate" testId="en-agency-if-scammed" />

      <FaqSection title="Questions about checking an agency" items={EN_AGENCY_CHECK_FAQ} testId="en-agency-faq" />
    </ServicePageShell>
  );
}
