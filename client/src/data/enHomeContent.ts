/**
 * Contenu éditorial de la page d'accueil anglaise. Chaque phrase reprend ce que les pages françaises du site disent déjà (« Comment ça marche »,
 * parcours, outils gratuits, page Afrique centrale) : aucune promesse, aucun chiffre, aucun délai ajouté. Les outils et guides qui n'existent
 * qu'en français sont signalés comme tels.
 */
export const EN_HOME_PATHWAYS = [
  { title: "Study", text: "Admission, funds and study visa — a structured file prepared with an adviser.", href: "/etudes", cta: "See the study pathway" },
  { title: "Work", text: "Profile, authorised partners and work authorisations — with no promise of a job.", href: "/travail", cta: "See the work pathway" },
  { title: "Travel and visas", text: "Visit, e-Visa or short stay: checklist, guided filing and flights if needed.", href: "/evisas", cta: "Explore visas and destinations" },
] as const;

export const EN_HOME_STEPS = [
  { title: "Create your secure space", text: "Register to open a personal client space — the dashboard where status, documents, clarifications and messages stay traceable, remotely or from Yaoundé." },
  { title: "Tell us your destination and project", text: "Choose the country and the type of procedure (study, work, visa, immigration). It guides the country-by-visa checklist and the official sources to consult." },
  { title: "Guided assessment of your profile", text: "Submit your academic background, experience and goal. An adviser reviews how consistent the project is against the requirements we know — with no promise of a result." },
  { title: "Assessment report and next steps", text: "You receive a structured report: realistic route, documents to gather, possible third-party fees and the order of the steps. The delivery time is confirmed by the team for your file." },
  { title: "Opening fee confirmed in writing", text: "If you go ahead, the opening fee is confirmed in writing before any payment. It covers the administrative structuring of your file and is separate from the fees paid to authorities." },
  { title: "Send your documents, online or at the office", text: "Upload secure scans from your space or hand in originals in Yaoundé. Every document is time-stamped; rejections and clarifications stay visible to both sides." },
  { title: "Partner network, where relevant", text: "For work projects, consenting profiles can be presented to verified placement agencies or employers. No job is promised: the offer comes from the partner." },
  { title: "Follow-up through filing and beyond", text: "3M prepares the procedures (visa, authorisation, formalities) and follows each step in your space. Final decisions always belong to the competent authorities." },
] as const;

export const EN_HOME_TOOLS = [
  { title: "Which pathway fits my project?", text: "Five questions, no account needed: see the family of routes that matches your situation and the points to watch.", href: "/outils/parcours-mobilite", note: "In French" },
  { title: "Canada CRS calculator and 67-point grid", text: "Estimate your Express Entry score and check the selection grid, with a side-by-side scenario comparison. Checked against IRCC's official tool.", href: "/canada/crs", note: "In French" },
  { title: "Document checklist", text: "The documents that come up in almost every file, so you can gather them early.", href: "/outils/liste-de-pieces", note: "In French" },
  { title: "Mobility budget estimate", text: "Estimate the total cost — official fees, funds, tests — before you commit.", href: "/outils/budget-mobilite", note: "In French" },
] as const;

export const EN_HOME_CENTRAL_AFRICA = {
  title: "From Central Africa",
  text: "We support candidates from Cameroon, Gabon, Congo, the DRC, Chad and across Africa: free assessment, a file prepared document by document, remote follow-up and clear fees in FCFA. Offices in Yaoundé and Ottawa.",
  href: "/afrique-centrale",
  cta: "Read the Central Africa page (in French)",
} as const;
