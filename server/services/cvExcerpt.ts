/**
 * Préparation du texte d'un CV avant de le transmettre au modèle d'analyse.
 *
 * Le texte d'un CV est une donnée NON FIABLE (il peut contenir des consignes destinées au modèle) et
 * PERSONNELLE : on n'en garde que ce qui sert à l'évaluation (parcours, diplômes, langues, compétences).
 * Sont masqués : adresses e-mail, liens, numéros de téléphone, longues suites de chiffres (pièces d'identité,
 * comptes bancaires), identifiants de type passeport ou IBAN, lignes de zone lisible par machine (MRZ).
 * La taille est bornée, les caractères de contrôle et invisibles sont retirés.
 */

export const CV_EXCERPT_MAX_CHARS = 6000;
export const CV_EXCERPT_MIN_CHARS = 120;

export type CvExcerpt = { text: string; truncated: boolean; masked: number };

// Caractères de contrôle (hors saut de ligne et tabulation) et caractères invisibles ou de sens d'écriture,
// construits par code pour ne jamais écrire de caractère invisible dans le source.
const INVISIBLE_RANGES: Array<[number, number]> = [
  [0x0000, 0x0008], [0x000b, 0x000c], [0x000e, 0x001f], [0x007f, 0x009f],
  [0x00ad, 0x00ad], [0x200b, 0x200f], [0x202a, 0x202e], [0x2060, 0x2064], [0xfeff, 0xfeff],
];
const INVISIBLE = new RegExp(`[${INVISIBLE_RANGES.map(([from, to]) => `${String.fromCharCode(from)}-${String.fromCharCode(to)}`).join("")}]`, "g");

const MASKS: Array<{ label: string; pattern: RegExp }> = [
  { label: "[lien]", pattern: /\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi },
  { label: "[e-mail]", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  // ligne de zone lisible par machine (passeport, visa, carte) : longue suite de majuscules, chiffres et « < »
  { label: "[masqué]", pattern: /[A-Z0-9<]{22,}/g },
  // IBAN
  { label: "[masqué]", pattern: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,4})?\b/g },
  // numéro international : +237 6 98 10 48 32, 00237698104832
  { label: "[numéro]", pattern: /(?:\+|\b00)\d[\d ().-]{7,}\d/g },
  // numéro par groupes de deux chiffres séparés (69 81 04 83 2) : les années collées (2018-2021) ne correspondent pas
  { label: "[numéro]", pattern: /\b\d{2}([ .-])\d{2}\1\d{2}(?:\1\d{2})+\b/g },
  // longue suite de chiffres collés : pièce d'identité, compte, numéro de sécurité sociale
  { label: "[numéro]", pattern: /\b\d{9,}\b/g },
  // identifiant de passeport ou de carte : une ou deux lettres suivies de six à neuf chiffres
  { label: "[numéro]", pattern: /\b[A-Z]{1,2}\d{6,9}\b/g },
];

export function prepareCvExcerpt(raw: string | null | undefined): CvExcerpt | null {
  if (!raw) return null;
  let text = raw.replace(INVISIBLE, "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  let masked = 0;
  for (const { label, pattern } of MASKS) {
    text = text.replace(pattern, () => {
      masked += 1;
      return label;
    });
  }

  if (text.length < CV_EXCERPT_MIN_CHARS) return null; // scan sans texte, page vide, ou presque rien d'exploitable
  let truncated = false;
  if (text.length > CV_EXCERPT_MAX_CHARS) {
    truncated = true;
    const cut = text.slice(0, CV_EXCERPT_MAX_CHARS);
    const lastBreak = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(" "));
    text = (lastBreak > CV_EXCERPT_MAX_CHARS * 0.8 ? cut.slice(0, lastBreak) : cut).trimEnd();
  }
  return { text, truncated, masked };
}
