/**
 * Portails officiels (immigration / visas) par destination des pages `/procedures/<pays>`.
 * Uniquement des pages d'accueil d'autorités publiques : elles ne changent pas d'adresse, contrairement aux pages profondes.
 * Ce sont des sources à consulter, jamais une déclaration de contenu vérifié : les règles évoluent, la page le rappelle.
 * Liens recontrôlés le 2026-10-07 : réponse HTTP directe pour la plupart. Exceptions : france-visas.gouv.fr et udi.no refusent les
 * requêtes automatiques (403 / pare-feu) et ont été ouverts dans un navigateur (France-Visas : accueil affiché ; UDI : seule la page du
 * pare-feu s'affiche, domaine en service) ; le portail européen d'immigration et portal.moi.gov.qa sont injoignables depuis notre
 * réseau, confirmés comme toujours en service par des sources tierces.
 */
export type OfficialSource = { label: string; url: string };

export const DESTINATION_OFFICIAL_SOURCES: Record<string, OfficialSource[]> = {
  "pays-bas": [{ label: "IND — Service d'immigration et de naturalisation des Pays-Bas", url: "https://ind.nl" }],
  belgique: [{ label: "Office des étrangers de Belgique (DOFI)", url: "https://dofi.ibz.be" }],
  france: [{ label: "France-Visas — portail officiel des visas pour la France", url: "https://france-visas.gouv.fr" }],
  "royaume-uni": [{ label: "GOV.UK — visas et immigration", url: "https://www.gov.uk/browse/visas-immigration" }],
  irlande: [{ label: "Irish Immigration — service officiel d'immigration d'Irlande", url: "https://www.irishimmigration.ie" }],
  portugal: [{ label: "Portail des visas du ministère portugais des Affaires étrangères", url: "https://vistos.mne.gov.pt" }],
  espagne: [{ label: "Ministère espagnol des Affaires étrangères", url: "https://www.exteriores.gob.es" }],
  italie: [{ label: "Visto per Italia — portail officiel des visas d'Italie", url: "https://vistoperitalia.esteri.it" }],
  pologne: [{ label: "Portail officiel du gouvernement polonais (gov.pl)", url: "https://www.gov.pl" }],
  malte: [{ label: "Identità — agence maltaise des permis de séjour et de travail", url: "https://identita.gov.mt" }],
  norvege: [{ label: "UDI — Direction norvégienne de l'immigration", url: "https://www.udi.no" }],
  australie: [{ label: "Home Affairs — visas et immigration en Australie", url: "https://immi.homeaffairs.gov.au" }],
  "nouvelle-zelande": [{ label: "Immigration New Zealand", url: "https://www.immigration.govt.nz" }],
  emirats: [{ label: "ICP — Autorité fédérale de l'identité et de la citoyenneté des Émirats", url: "https://icp.gov.ae" }],
  qatar: [{ label: "Ministère de l'Intérieur du Qatar (portail Metrash)", url: "https://portal.moi.gov.qa" }],
  "arabie-saoudite": [{ label: "Plateforme officielle des visas d'Arabie saoudite", url: "https://visa.mofa.gov.sa" }],
  "coree-du-sud": [{ label: "HiKorea — service officiel d'immigration de Corée du Sud", url: "https://www.hikorea.go.kr" }],
  japon: [{ label: "Agence japonaise des services d'immigration", url: "https://www.moj.go.jp/isa/" }],
};
