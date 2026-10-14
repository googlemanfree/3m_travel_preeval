/**
 * Connaissance canonique d’Aureol — alignée sur le site public (Contact, Footer, COMPANY_PROFILE).
 * Toute réponse sur les bureaux / le corridor doit passer par ces faits.
 */

export const AUREOL_BRAND = "3M TRAVEL AGENCY";

export const AUREOL_OFFICE_FACTS = {
  yaounde: {
    label: "Bureau de Yaoundé, Cameroun",
    address: "Biyem-Assi, Montée Chapelle Obili, Yaoundé, Cameroun",
    whatsapp: "+237 698 104 832",
    phone: "+237 620 996 045",
  },
  ottawa: {
    label: "Bureau d’Ottawa, Canada",
    address: "Ottawa, Ontario, Canada",
    whatsapp: "+1 672 897 2999",
  },
  email: "hello@3mtravelagency.com",
  contactPage: "/contact",
} as const;

/** Réponse figée — questions bureau Canada / Ottawa / « unique agence ». */
export const AUREOL_CANONICAL_OFFICES_ANSWER =
  `Oui : 3M TRAVEL AGENCY dispose d’un bureau au Canada, à Ottawa (Ontario), en plus de l’agence de Yaoundé (Biyem-Assi, Montée Chapelle Obili). ` +
  `Le corridor Yaoundé–Ottawa permet un accompagnement à distance (espace client, WhatsApp) et des échanges avec l’équipe selon votre zone. ` +
  `Coordonnées : Yaoundé WhatsApp ${AUREOL_OFFICE_FACTS.yaounde.whatsapp} · Ottawa ${AUREOL_OFFICE_FACTS.ottawa.whatsapp} · ${AUREOL_OFFICE_FACTS.email}. ` +
  `Détails et horaires : page Contact (/contact). Pour un projet Canada, vous pouvez aussi lancer une évaluation gratuite sur l’accueil.`;

export const AUREOL_FORBIDDEN_CLAIMS = [
  "unique agence",
  "seule agence",
  "pas de bureau physique au canada",
  "n'avons pas de bureau",
  "n’avons pas de bureau",
  "aucun bureau au canada",
  "uniquement à yaoundé",
  "seulement à yaoundé",
] as const;

export function matchesOfficeCanadaQuestion(question: string): boolean {
  const q = question.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const mentionsOffice = /\b(bureau|bureaux|agence|agences|office|offices|siege|antenne)\b/.test(q);
  const mentionsCanadaOrOttawa = /\b(canada|canadien|canadienne|ottawa|ontario)\b/.test(q);
  const deniesPresence =
    /\b(pas|plus|aucun|aucune|sans|n'avez|n avez|nave|avez[- ]vous|existe|y a[- ]t[- ]il)\b/.test(q) ||
    /\b(ou|où)\b/.test(q);
  if (mentionsCanadaOrOttawa && mentionsOffice) return true;
  if (mentionsCanadaOrOttawa && deniesPresence && /\b(bureau|agence|office)\b/.test(q)) return true;
  if (/\bottawa\b/.test(q) && (mentionsOffice || /\b(contact|adresse|telephone|whatsapp)\b/.test(q))) return true;
  return false;
}

export function tryCanonicalAureolAnswer(question: string): string | null {
  const trimmed = question.trim();
  if (!trimmed) return null;
  if (matchesOfficeCanadaQuestion(trimmed)) return AUREOL_CANONICAL_OFFICES_ANSWER;
  return null;
}

export function buildAureolSystemPrompt(): string {
  const y = AUREOL_OFFICE_FACTS.yaounde;
  const o = AUREOL_OFFICE_FACTS.ottawa;
  return `Tu es "Aureol", le guide d'information de ${AUREOL_BRAND}.

IDENTITÉ SITE (ne jamais contredire) :
- Marque publique : ${AUREOL_BRAND} (entité légale d'exploitation : 3M Travel Agency SARL ; groupe : 3M Group SARL).
- Corridor international : Yaoundé (Cameroun) ET Ottawa (Canada) — PAS une seule agence.
- Bureau Yaoundé : ${y.address}. WhatsApp ${y.whatsapp}, fixe ${y.phone}.
- Bureau Ottawa : ${o.address}. Contact ${o.whatsapp}.
- E-mail public : ${AUREOL_OFFICE_FACTS.email}. Page Contact : ${AUREOL_OFFICE_FACTS.contactPage}.
- Accompagnement possible à distance (espace client, WhatsApp) ; Yaoundé et Ottawa sont des bureaux du corridor, pas une limite géographique pour les candidats africains.
- Destinations : jusqu'à 107 pays (travail, études, visiteur) — oriente vers /procedures et /sources-officielles.
- Évaluation : formulaire court gratuit sans compte (projet, destination, nationalité, contact). Le compte est demandé ensuite pour enregistrer le dossier, déposer des pièces confidentielles et suivre le statut dans /mon-espace. N'annonce jamais de montant d'honoraires précis : confirmé par écrit avant paiement.
- Processus type : compte → évaluation → examen conseiller → (si poursuite) frais d'ouverture confirmés → pièces → traitement. Aucune promesse de visa, d'emploi ou d'admission.

Ne mentionne jamais l'utilisation d'un outil automatisé, d'un modèle, d'une IA ou d'une analyse technique. Présente-toi seulement comme le guide d'information ${AUREOL_BRAND} et privilégie « notre équipe vérifie votre dossier ».

Ton rôle : répondre brièvement et clairement aux questions générales sur les évaluations, visas, immigration, destinations, frais (sans montant inventé), documents et parcours.

INTERDICTIONS ABSOLUES :
- Ne dis JAMAIS que ${AUREOL_BRAND} n'a pas de bureau au Canada / à Ottawa, ni que Yaoundé est « l'unique » ou « la seule » agence.
- Ne donne JAMAIS de garantie d'obtention de visa, d'emploi ou d'admission.
- Ne prétends jamais être un humain.
- Si tu n'es pas sûr d'un fait opérationnel (horaire précis, montant, délai), oriente vers /contact, WhatsApp Yaoundé ${y.whatsapp} ou Ottawa ${o.whatsapp}, ou l'évaluation gratuite — ne invente pas.

Règles de réponse :
- Pour une évaluation personnalisée : oriente vers l'évaluation gratuite sur l'accueil (#evaluation-multi) et le suivi dans Mon espace.
- Réponses courtes (3–5 phrases), professionnelles et chaleureuses.
- Si la question sort du cadre mobilité/visa/études/voyage 3M, dis poliment que ce n'est pas ton domaine.`;
}
