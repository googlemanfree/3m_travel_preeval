/**
 * English versions of the campaign pages (lot 7): /en/faq and /en/verify-an-agency.
 * Faithful translation of contentCampaign.ts, same rules: no figure with a unit, no promise of results,
 * no single opening-fee amount. Needs a native-speaker proofread before wide promotion.
 */
import type { CommitmentItem, FaqItem, StepItem } from "@/data/pageEnrichment";
import type { FaqGroup } from "@/data/contentCampaign";

export const EN_FAQ_GROUPS: FaqGroup[] = [
  {
    id: "getting-started",
    title: "Getting started",
    intro: "What to know before you submit your first request.",
    items: [
      { question: "Do I need an account to get started?", answer: "No. The free assessment starts without an account: you tell us about your project, destination, nationality and contact details. An account is requested afterwards, to save your file, upload confidential documents and follow its status in your space." },
      { question: "Is the assessment really free?", answer: "Yes. It is an orientation assessment: it helps you place your project and know which documents and steps to plan for. It does not commit you to opening a file and never replaces the decision of an authority, school or employer." },
      { question: "What happens after the assessment?", answer: "An adviser reviews your assessment, then you receive a summary with your strengths, the points to clarify and the documents to gather. If you decide to continue, a file is opened and a written quote is given to you before any payment." },
      { question: "Which countries can you support me with?", answer: "The directory of procedures and destinations lists the documented countries by type of project (work, study, visitor, training, e-Visa). The list evolves: check it before deciding, and ask us if your destination is not there yet." },
      { question: "Can I be supported if I am not in Yaoundé?", answer: "Yes. Follow-up is remote, wherever you are in Africa: WhatsApp, e-mail and your client space, with an adviser who keeps your file history. The Yaoundé office receives visitors on site; the Ottawa office coordinates Canada by appointment." },
      { question: "What is the difference between a work, study and visitor visa?", answer: "A work visa relies on a job offer or work authorisation, a study visa on admission to an institution, and a visitor visa (tourism, family, short business stay) on a temporary stay. Documents, authorities and rules differ: the assessment starts by choosing the right type of project." },
    ],
  },
  {
    id: "fees-payment",
    title: "Fees and payment",
    intro: "Transparency on what you pay, to whom and when.",
    items: [
      { question: "How much does opening a file cost?", answer: "The amount depends on the type of profile. It is set for your file and confirmed in writing before any payment: no payment is requested until you have received that amount in writing." },
      { question: "Which fees are not paid to 3M TRAVEL AGENCY?", answer: "Consular and government fees, language test fees, insurance, sworn translations and tickets are paid to the relevant provider or authority. We explain what each line is for; the Pricing page details the difference between our fees and third-party costs." },
      { question: "Which payment methods are accepted?", answer: "Bank card once the gateway is enabled, Mobile Money, bank transfer, a deposit to the agency’s number, or payment at the Yaoundé office. The Payment methods page gives the up-to-date details; pay only to the details listed there." },
      { question: "Will I receive a receipt?", answer: "Yes. A named receipt is issued for every validated payment. Check that your name, your file reference and the amount are correct, and keep it with your agreement." },
      { question: "Can I be refunded if I stop?", answer: "It depends on the stage reached and what has already been done. The conditions are in the documents you receive (quote, agreement, receipt) and in the terms of use: read them before paying and ask for any clarification in writing." },
      { question: "Are the amounts shown on the website final?", answer: "No. The examples on the Pricing page are illustrative: your quote depends on your profile, the destination and the services chosen. Only the written quote you receive is binding." },
    ],
  },
  {
    id: "documents",
    title: "Documents",
    intro: "Preparing, sending and correcting your documents.",
    items: [
      { question: "Which documents should I prepare first?", answer: "A valid passport, your civil-status documents, your diplomas and transcripts, your CV and the supporting documents for your project. The Document compliance page lists, by destination and type of project, the documents usually expected." },
      { question: "Do I need to have my documents translated or legalised?", answer: "Often yes, but it depends on the destination and the document. Some authorities require a sworn translation, others a legalisation or an apostille. We tell you what is required for your file before you incur these costs." },
      { question: "How do I send my documents securely?", answer: "Through your client space, where access is limited to you and the team assigned to your file. Avoid sending identity documents through public messaging apps or to personal addresses, and never share a password." },
      { question: "A document was returned to me: what should I do?", answer: "The reason is given to you (unreadable, incomplete, expired, wrong document, name different from the passport, missing translation…). Correct the point flagged and upload the document again; the history is kept and the team checks it again." },
      { question: "Must my passport be valid for longer than the trip?", answer: "Many destinations require a minimum validity after the planned arrival date. The exact rule depends on the country: check it on the destination’s official source. An adviser flags passports whose validity looks insufficient." },
    ],
  },
  {
    id: "timelines",
    title: "Timelines and follow-up",
    items: [
      { question: "How long does a procedure take?", answer: "It depends on the country, the type of visa, the period and how complete the file is. The timelines shown are indicative and dated; they are set by the authorities, not by 3M TRAVEL AGENCY, and may change without notice." },
      { question: "How do I follow the progress of my file?", answer: "In your client space: file status, documents received or to be corrected, team messages and next steps. You are notified of important changes." },
      { question: "How quickly does the agency reply?", answer: "The announced reply time and how it is counted (working days in Yaoundé) are on the Contact page. Outside those hours, your message is handled as soon as the office reopens." },
      { question: "My file is not moving: what should I do?", answer: "First check whether a document needs correcting or a message is waiting for your reply in your space. Otherwise write to us with your file reference by WhatsApp or e-mail: an adviser will tell you where the procedure stands and what is blocking it." },
    ],
  },
  {
    id: "security",
    title: "Security and privacy",
    items: [
      { question: "Is my personal data protected?", answer: "It is used only to process your request. Access is limited to authorised people, exchanges are encrypted, and the privacy policy sets out the purpose, retention and your rights." },
      { question: "Who can see my documents?", answer: "You and the team assigned to your file. An employer or partner agency only sees an anonymised profile, and only if you have given active consent, which you can withdraw at any time." },
      { question: "Will you ask for my password or a code received by SMS?", answer: "Never. 3M TRAVEL AGENCY does not ask for a password or a verification code, by message or by phone. If someone asks for them in the agency’s name, do not reply and let us know." },
      { question: "How can I tell a message really comes from 3M TRAVEL AGENCY?", answer: "Our official channels are the agency’s WhatsApp, the e-mail address hello@3mtravelagency.com on our domain, and your client space. If in doubt, pay nothing and read the page “Check an agency before paying”." },
    ],
  },
  {
    id: "visas",
    title: "Visas, e-Visa and decisions",
    items: [
      { question: "Can 3M TRAVEL AGENCY get me my visa?", answer: "No. The decision belongs to the authorities of the country concerned. We prepare your file, point you to the right sources and follow the procedure with you, without promising any result." },
      { question: "What is an e-Visa?", answer: "An entry authorisation requested online on an official portal, without visiting a consulate in many cases. Conditions, fees and timelines depend on the country: each e-Visa page links to the official portal and states the date of the last check." },
      { question: "Do I have to use an agency for an e-Visa?", answer: "No. You can submit your application yourself on the official portal. Our help is to prepare and review your file before submission; it is optional." },
      { question: "What happens if I am refused?", answer: "The authority notifies its decision, sometimes with its reasons. We review these with you to understand what can be corrected and whether a new application is possible under the country’s rules. No result is promised." },
      { question: "Can I prepare several destinations at the same time?", answer: "Yes, project by project, with a separate file for each destination. The number of simultaneous files is limited to keep serious follow-up; your adviser will tell you the current limit." },
    ],
  },
  {
    id: "complaints",
    title: "Cancellation, complaints and the agency",
    items: [
      { question: "How do I cancel a request?", answer: "In writing (e-mail or a message in your space), with your file reference. The consequences depend on the stage reached: they are explained to you before you decide." },
      { question: "How do I make a complaint?", answer: "Write to us describing the problem and attaching your supporting documents, by e-mail or through the Contact page. You receive a written reply; we keep the history of exchanges." },
      { question: "Where is the agency?", answer: "In Yaoundé, Biyem-Assi district, Montée Chapelle Obili, with a reception on site. An Ottawa office coordinates Canada by appointment. Full contact details are on the Contact page." },
      { question: "Are the reviews published on the site real?", answer: "Yes. No review is invented: each testimonial is submitted by a person who really dealt with the agency, moderated, and published with their consent. Without an approved review, the gallery stays empty: that is deliberate." },
    ],
  },
];

export const EN_FAQ_ITEMS: FaqItem[] = EN_FAQ_GROUPS.flatMap((group) => group.items);

export const EN_AGENCY_RED_FLAGS: CommitmentItem[] = [
  { title: "A visa, job or admission that is “assured”", text: "No agency decides in place of a consulate, an employer or a school. Any promise of a result is a warning sign." },
  { title: "A payment to a personal number, with no receipt", text: "A payment must go to details published by the organisation, give rise to a named receipt and remain traceable." },
  { title: "An invented emergency", text: "“Only one place left”, “pay today or lose your file”: the pressure is meant to stop you from checking." },
  { title: "No written contract or quote", text: "What is sold, its price, what is included and the cancellation terms must be in writing before any payment." },
  { title: "No verifiable address", text: "A serious agency has a physical address, a legal registration you can look up and people you can reach." },
  { title: "A job offer with no identified employer", text: "If you cannot contact the employer through an official channel, pay nothing: the offer cannot be verified." },
  { title: "Fees “to speed things up” at a consulate", text: "Official fees are published by the authority. An intermediary cannot buy faster processing or a favourable decision." },
  { title: "A request for your logins or codes received by SMS", text: "Nobody needs your passwords or verification codes to prepare your file." },
];

export const EN_AGENCY_CHECKS: StepItem[] = [
  { title: "Check the legal registration", text: "Ask for the company name and registration number, then look them up on your country’s official business register. Names and numbers must match the documents you are given." },
  { title: "Visit in person or by video call", text: "Visit the agency or ask for a video call. A real organisation agrees to introduce itself and answer your questions." },
  { title: "Require a written quote and contract", text: "The document sets out the services, the price, what third parties charge, the steps and the conditions for stopping. Do not pay before reading it." },
  { title: "Pay by a traceable method and get a receipt", text: "Pay to the organisation’s official details and obtain a named receipt with your reference. Keep all the evidence." },
  { title: "Cross-check with official sources", text: "Visa conditions, fees and timelines are checked on consulate, ministry or immigration-service websites. If the agency contradicts the official source, believe the source." },
  { title: "Contact the school or employer yourself", text: "Find their contact details through an official directory, not through the link the agency gives you, and confirm that the admission or offer exists." },
];

export const EN_AGENCY_3M_DOES: string[] = [
  "Give a written quote before any payment; the opening amount depends on the profile and is confirmed to you in writing.",
  "Issue a named receipt for every validated payment and keep the history in your client space.",
  "State at each step what rests with authorities, schools or employers, without promising any result.",
  "Never ask you for a password or a verification code.",
  "Publish only real, moderated and authorised reviews; never invent any.",
  "Cite its official sources and the date of the last check on procedure pages.",
];

export const EN_AGENCY_IF_SCAMMED: string[] = [
  "Stop all payments and stop sharing personal information with the intermediary.",
  "Keep the evidence: messages, receipts, screenshots, numbers used, names mentioned.",
  "If a payment was made by Mobile Money or bank transfer, contact your operator or bank immediately to report the transaction.",
  "Report the facts to the competent authorities in your country (police, gendarmerie or prosecutor) and, if a platform was used, report the account.",
  "If your passport or identity documents were handed over, monitor their use and report any suspicious use to the issuing administration.",
];

export const EN_AGENCY_CHECK_FAQ: FaqItem[] = [
  { question: "How can I check that 3M TRAVEL AGENCY is registered?", answer: "Our company name, trade-register number and tax identifier are published on this page and in the privacy policy. You can look them up yourself on the official register portal (link below) and come to meet us in Yaoundé." },
  { question: "Can an agency assure a visa if it has contacts at the embassy?", answer: "No. No relationship with an official replaces the authority’s examination of the file, and presenting oneself as able to influence a decision is a sign of fraud or illegal practice." },
  { question: "Is it normal to pay before seeing a contract?", answer: "No. Always ask for a written quote or contract before any payment. If you are refused or pressed, stop." },
  { question: "What if I have already paid a doubtful agency?", answer: "Apply the steps in the section “If you have already paid”: stop payments, keep the evidence, alert your operator or bank and report the facts to the authorities. You can also write to us so we can help you check what you were given." },
];
