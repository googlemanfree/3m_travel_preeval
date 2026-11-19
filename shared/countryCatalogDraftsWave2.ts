/**
 * Brouillons de la vague 2 : le parcours « Visiteur » des 25 autres pays de l'espace Schengen (Autriche, Bulgarie, Croatie, Tchéquie, Danemark,
 * Estonie, Finlande, Grèce, Hongrie, Islande, Italie, Lettonie, Liechtenstein, Lituanie, Malte, Pays-Bas, Norvège, Pologne, Portugal, Roumanie,
 * Slovaquie, Slovénie, Espagne, Suède, Suisse). Les règles du court séjour (visa C, 90 jours sur 180, frais de dossier, dépôt en personne) sont
 * communes à tout l'espace Schengen : ce sont celles, déjà relues, des brouillons de la vague 1 (France, Allemagne, Belgique, Luxembourg).
 *
 * Ce qui est propre à chaque pays (poste de dépôt, prestataire, délais locaux, pièces supplémentaires) n'est PAS écrit : le texte renvoie à la
 * source officielle du pays et à votre conseiller. Les brouillons s'importent en « À confirmer », avec une source « à confirmer » : un
 * administrateur ouvre la source, la marque « vérifiée » et seulement alors publie. Rien n'est publié par ce fichier.
 *
 * Lecture des sources le 2026-11-19 (voir docs/GUIDES_VAGUE_2.md) : pages lues pour AT, CZ, EE, HR, LV, MT, NL, PL, SI, CH ; les portails des
 * autres pays refusent la lecture automatique (protection anti-robot) et restent à ouvrir à la main.
 */
import { schengenVisitDraft, type DraftPathway } from "./countryCatalogDrafts";

type Entry = readonly [code: string, label: string, url: string, readOn: string | null];

/** [code, libellé de la source, adresse, date de lecture automatique (null = page non lisible par un robot)] */
export const SCHENGEN_WAVE_2_SOURCES: readonly Entry[] = [
  ["AT", "Ministère autrichien des Affaires étrangères : visas", "https://www.bmeia.gv.at/en/travel-stay/entrance-and-residence-in-austria/visa", "2026-11-19"],
  ["BG", "Ministère bulgare des Affaires étrangères : visa pour la Bulgarie", "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-bulgaria", null],
  ["HR", "Ministère croate des Affaires étrangères : visas", "https://mvep.gov.hr/services-for-citizens/consular-information-22802/visas-22807/22807", "2026-11-19"],
  ["CZ", "Ministère tchèque des Affaires étrangères : types de visas", "https://mzv.gov.cz/jnp/en/information_for_aliens/types_of_visas/index.html", "2026-11-19"],
  ["DK", "Ny i Danmark : portail officiel de l'immigration", "https://www.nyidanmark.dk/", null],
  ["EE", "Police et garde-frontières estonienne : visa", "https://www.politsei.ee/en/instructions/visa-and-extending-period-of-stay", "2026-11-19"],
  ["FI", "Migri : portail officiel de l'immigration", "https://migri.fi/en/home", null],
  ["GR", "Ministère grec des Affaires étrangères : visas", "https://www.mfa.gr/en/service-category/visas/", null],
  ["HU", "Enter Hungary : portail officiel de l'immigration", "https://enterhungary.gov.hu/eh/?en", null],
  ["IS", "Island.is : s'installer en Islande", "https://island.is/en/category/immigrating-to-iceland", null],
  ["IT", "Vistoperitalia : portail officiel des visas", "https://vistoperitalia.esteri.it/", null],
  ["LV", "Ministère letton des Affaires étrangères : demander un visa", "https://www.mfa.gov.lv/en/applying-visa", "2026-11-19"],
  ["LI", "Office de la migration et des passeports du Liechtenstein", "https://www.llv.li/en/national-administration/migration-and-passport-office", null],
  ["LT", "Département des migrations de Lituanie", "https://migracija.lrv.lt/en/", null],
  ["MT", "Identità Malta : unité centrale des visas", "https://identita.gov.mt/central-visa-unit-main-page/", "2026-11-19"],
  ["NL", "NetherlandsWorldwide : visa Schengen, étapes avant de demander", "https://www.netherlandsworldwide.nl/visa-the-netherlands/step-by-step-schengen-visa", "2026-11-19"],
  ["NO", "UDI : immigration en Norvège", "https://www.udi.no/en/", null],
  ["PL", "Ministère polonais des Affaires étrangères : visas", "https://www.gov.pl/web/diplomacy/visas", "2026-11-19"],
  ["PT", "Portugal : demande de visa en ligne", "https://pedidodevistos.mne.gov.pt/", null],
  ["RO", "Roumanie : e-Visa du ministère des Affaires étrangères", "https://eviza.mae.ro/", null],
  ["SK", "Ministère slovaque des Affaires étrangères : visas", "https://www.mzv.sk/en/services/information-for-foreigners/visas-for-foreigners-to-enter-sr", null],
  ["SI", "GOV.SI : entrée et séjour, visas", "https://www.gov.si/en/topics/entry-and-residence/", "2026-11-19"],
  ["ES", "Ministère espagnol des Affaires étrangères : visas", "https://www.exteriores.gob.es/", null],
  ["SE", "Agence suédoise des migrations", "https://www.migrationsverket.se/en.html", null],
  ["CH", "Secrétariat d'État aux migrations (SEM) : entrée et visa", "https://www.sem.admin.ch/en/faq-entry", "2026-11-19"],
];

export const COUNTRY_CATALOG_DRAFTS_WAVE_2: readonly DraftPathway[] = SCHENGEN_WAVE_2_SOURCES.map(([code, label, url]) => schengenVisitDraft(code, label, url));
