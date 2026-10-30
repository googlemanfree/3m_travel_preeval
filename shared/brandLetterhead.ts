/**
 * Papier à en-tête officiel de 3M TRAVEL AGENCY : une seule définition pour tous les documents remis au client
 * (factures et reçus, protocoles d'accord, bilans et résultats d'évaluation, formulaires, notes, coupons) et pour les e-mails.
 *
 * - `letterheadLayout` donne les zones utilisables (à lire AVANT d'écrire le contenu) ;
 * - `applyLetterhead` peint l'en-tête, le pied de page et le filigrane sur chaque page (à appeler APRÈS le contenu) ;
 * - `renderBrandedEmailHtml` produit l'équivalent pour les e-mails (même identité, mêmes coordonnées).
 * Les coordonnées légales proviennent d'ici et d'ici seulement : une modification se répercute partout.
 */

import { LETTERHEAD_COMPACT_JPEG, LETTERHEAD_FOOTER_JPEG, LETTERHEAD_HEADER_FOCUS_JPEG, LETTERHEAD_HEADER_JPEG } from "./brandLetterheadAssets";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PdfLike = any;

export const BRAND = {
  commercialName: "3M TRAVEL AGENCY",
  legalName: "3M Travel Agency SARL",
  website: "www.3mtravelagency.com",
  siteUrl: "https://www.3mtravelagency.com",
  email: "hello@3mtravelagency.com",
  /** En-tête : uniquement l'accompagnement visa et mobilité internationale (aucun autre service de l'agence n'y figure). */
  tagline: ["Accompagnement visa et mobilité internationale", "Études · Travail · Voyages · Visas · Immigration"],
  rc: "RC/YAO/2019/A/2567",
  niu: "M112417203369H",
  cameroon: {
    title: "CAMEROUN",
    lines: ["Yaoundé — Biyem-Assi, Montée Chapelle Obili, à 10 m de EHS", "WhatsApp : +237 698 104 832 · Appels : +237 620 996 045"],
  },
  canada: {
    title: "CANADA",
    lines: ["Ottawa — Sur rendez-vous", "WhatsApp : +1 672 897 2999 · hello@3mtravelagency.com"],
  },
  /** Logo hébergé (e-mails) ; les PDF reçoivent le logo en base64 pour rester autonomes. */
  logoUrl: "https://www.3mtravelagency.com/logo-3m-travel-agency-hd.png",
  /** Papier à en-tête officiel (bandeaux haut et bas) : images publiées avec le site, utilisées par les e-mails, les aperçus et l'espace client. */
  headerImageUrl: "https://www.3mtravelagency.com/brand/entete-haut.jpg",
  footerImageUrl: "https://www.3mtravelagency.com/brand/entete-bas.jpg",
} as const;

export const BRAND_COLORS = {
  navy: [23, 55, 94],
  blue: [43, 108, 184],
  light: [187, 217, 234],
  pale: [228, 238, 245],
  ink: [31, 41, 55],
  muted: [100, 116, 139],
} as const;

const [NR, NG, NB] = BRAND_COLORS.navy;
const MARGIN_LEFT = 18;
const MARGIN_RIGHT = 192;
const PAGE_W = 210;
const PAGE_H = 297;

export type LetterheadOptions = {
  /** Image du logo en data URI (PNG recommandé). Sans logo, un monogramme « 3M » est dessiné. */
  logoDataUri?: string | null;
  logoFormat?: "PNG" | "JPEG" | "WEBP";
  /** Nature du document, en majuscules : « FACTURE », « PROTOCOLE D’ACCORD N°01 », « RÉSULTAT D’ÉVALUATION »… */
  documentKind?: string;
  /** Référence affichée (dossier, facture, évaluation…). */
  reference?: string | null;
  /** Date affichée ; par défaut, aujourd'hui (Yaoundé). */
  dateLabel?: string | null;
  /** « À l'attention de » : destinataire. */
  recipient?: string | null;
  /** « Objet ». */
  subject?: string | null;
  /** Filigrane du logo (activé par défaut quand le logo est fourni). */
  watermark?: boolean;
  /** Service concerné par le document (voir `serviceFocusLabel`) : remplace la liste générale des services sous le nom de l'agence. */
  serviceFocus?: string | null;
};

const foldText = (value: string | null | undefined) => (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Libellé du service dans l'en-tête, déduit du dossier : « Visa travail · Canada », « e-Visa · Ouganda »…
 * Reste dans le périmètre visa et mobilité internationale ; vide si le type de visa est inconnu (la liste générale s'affiche alors).
 */
export function serviceFocusLabel(visaType?: string | null, destination?: string | null): string {
  const kind = foldText(visaType);
  let label = "";
  if (/e-?visa|evisa|autorisation electronique|\beta\b/.test(kind)) label = "e-Visa";
  else if (/etude|study|formation|student/.test(kind)) label = "Visa études";
  else if (/travail|work|emploi|salarie|permis/.test(kind)) label = "Visa travail";
  else if (/immigr|residence|installation|famil|regroupement/.test(kind)) label = "Immigration";
  else if (/touris|visit|sejour|voyage|court/.test(kind)) label = "Visa visiteur";
  if (!label) return "";
  const country = String(destination ?? "").trim();
  const known = country && !["autre", "general", "other", "a preciser", "non specifiee"].includes(foldText(country));
  return known ? `${label} · ${country}` : label;
}

const headerServices = (options: { serviceFocus?: string | null }): [string, string] => [BRAND.tagline[0], options.serviceFocus?.trim() || BRAND.tagline[1]];

export type LetterheadLayout = {
  marginLeft: number;
  marginRight: number;
  contentWidth: number;
  /** Premier Y utilisable sur la première page. */
  firstPageTop: number;
  /** Premier Y utilisable sur les pages suivantes (en-tête compact). */
  nextPageTop: number;
  /** Dernier Y utilisable (le pied de page commence juste après). */
  contentBottom: number;
};

export function letterheadLayout(options: LetterheadOptions = {}): LetterheadLayout {
  let firstPageTop = options.documentKind ? 66 : 50;
  if (options.recipient) firstPageTop += 6;
  if (options.subject) firstPageTop += 6;
  return { marginLeft: MARGIN_LEFT, marginRight: MARGIN_RIGHT, contentWidth: MARGIN_RIGHT - MARGIN_LEFT, firstPageTop, nextPageTop: 34, contentBottom: 250 };
}

export function frenchDateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Douala" });
}

/**
 * Bandeaux du papier à en-tête v3 (logo, nom, services, vagues, pied de page) : images générées par docs/brand/v3/build-assets.py
 * à partir du même dessin que le papier vierge (PDF/Word). Seul le texte variable est écrit ici.
 */
function drawBand(doc: PdfLike, dataUri: string, alias: string, y: number, height: number) {
  try {
    doc.addImage(dataUri, "JPEG", 0, y, PAGE_W, height, alias, "FAST");
  } catch {
    /* le décor ne doit jamais empêcher la production du document */
  }
}

function drawWatermark(doc: PdfLike, options: LetterheadOptions) {
  if (!options.logoDataUri || options.watermark === false || typeof doc.GState !== "function" || typeof doc.setGState !== "function") return;
  try {
    doc.setGState(new doc.GState({ opacity: 0.065 }));
    doc.addImage(options.logoDataUri, options.logoFormat ?? "PNG", 38, 88, 134, 134, "brand-logo", "FAST");
  } catch {
    /* le filigrane est un décor : jamais bloquant */
  } finally {
    try { doc.setGState(new doc.GState({ opacity: 1 })); } catch { /* ignore */ }
  }
}

function drawFirstPageHeader(doc: PdfLike, options: LetterheadOptions) {
  const focus = options.serviceFocus?.trim();
  drawBand(doc, focus ? LETTERHEAD_HEADER_FOCUS_JPEG : LETTERHEAD_HEADER_JPEG, focus ? "3m-letterhead-header-focus" : "3m-letterhead-header", 0, 44);
  if (focus) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(NR, NG, NB);
    doc.text(focus, 48.3, 31.6);
  }

  if (!options.documentKind) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(NR, NG, NB);
  doc.text(options.documentKind.toUpperCase(), MARGIN_LEFT, 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
  if (options.reference) doc.text(`Réf. : ${options.reference}`, MARGIN_RIGHT, 51.5, { align: "right" });
  doc.text(`Yaoundé, le ${options.dateLabel || frenchDateLabel()}`, MARGIN_RIGHT, 56, { align: "right" });
  doc.setDrawColor(BRAND_COLORS.blue[0], BRAND_COLORS.blue[1], BRAND_COLORS.blue[2]);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_LEFT, 60, MARGIN_LEFT + 28, 60);
  let y = 66;
  doc.setFontSize(9.5);
  doc.setTextColor(BRAND_COLORS.ink[0], BRAND_COLORS.ink[1], BRAND_COLORS.ink[2]);
  if (options.recipient) {
    doc.setFont("helvetica", "bold");
    doc.text("À l’attention de :", MARGIN_LEFT, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(options.recipient).slice(0, 90), MARGIN_LEFT + 33, y);
    y += 6;
  }
  if (options.subject) {
    doc.setFont("helvetica", "bold");
    doc.text("Objet :", MARGIN_LEFT, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(options.subject).slice(0, 100), MARGIN_LEFT + 33, y);
  }
}

function drawCompactHeader(doc: PdfLike, options: LetterheadOptions) {
  drawBand(doc, LETTERHEAD_COMPACT_JPEG, "3m-letterhead-compact", 0, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
  const right = [options.documentKind ? options.documentKind.toUpperCase() : "", options.reference ? `Réf. : ${options.reference}` : ""].filter(Boolean).join("  ·  ");
  if (right) doc.text(right, MARGIN_RIGHT, 23.6, { align: "right" });
}

function drawFooter(doc: PdfLike, page: number, total: number) {
  drawBand(doc, LETTERHEAD_FOOTER_JPEG, "3m-letterhead-footer", 252, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
  doc.text(`Page ${page} / ${total}`, MARGIN_RIGHT, 277.6, { align: "right" });
}

/** À appeler une fois tout le contenu écrit : peint le papier à en-tête sur chaque page. */
export function applyLetterhead(doc: PdfLike, options: LetterheadOptions = {}): void {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    drawWatermark(doc, options);
    if (page === 1) drawFirstPageHeader(doc, options);
    else drawCompactHeader(doc, options);
    drawFooter(doc, page, total);
  }
}

/* ------------------------------------------------------------------ e-mails ------------------------------------------------------------------ */

export const escapeBrandHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] ?? character));

const hex = (color: readonly number[]) => `#${color.map((part) => part.toString(16).padStart(2, "0")).join("")}`;

export type BrandedEmailInput = {
  /** Titre affiché sous l'en-tête (déjà en texte simple, il est échappé ici). */
  title: string;
  /** Contenu HTML déjà échappé par l'appelant. */
  bodyHtml: string;
  /** Texte d'aperçu dans la boîte de réception. */
  preheader?: string;
  /** Référence du dossier ou du compte, rappelée sous le titre. */
  reference?: string | null;
  cta?: { label: string; url: string } | null;
  /** Mention de bas de message (confidentialité, désabonnement…) : HTML déjà échappé. */
  noteHtml?: string;
  /** Service concerné (voir `serviceFocusLabel`) : remplace la liste générale des services sous le nom de l'agence. */
  serviceFocus?: string | null;
};

/** E-mail à l'identité de l'agence : même en-tête, mêmes coordonnées et mêmes mentions légales que les documents PDF. */
export const BRAND_EMAIL_MARKER = "<!--3m-brand-->";

export function renderBrandedEmailHtml(input: BrandedEmailInput): string {
  const navy = hex(BRAND_COLORS.navy);
  const blue = hex(BRAND_COLORS.blue);
  const light = hex(BRAND_COLORS.light);
  const pale = hex(BRAND_COLORS.pale);
  const ink = hex(BRAND_COLORS.ink);
  const muted = hex(BRAND_COLORS.muted);
  const block = (data: { title: string; lines: readonly string[] }) =>
    `<td style="vertical-align:top;padding:0 8px 0 0;font:12px/1.5 Arial,Helvetica,sans-serif;color:${ink}"><strong style="color:${navy};font-size:11px;letter-spacing:.6px">${escapeBrandHtml(data.title)}</strong><br>${data.lines.map(escapeBrandHtml).join("<br>")}</td>`;
  const cta = input.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto 8px"><tr><td align="center" bgcolor="${navy}" style="background-color:${navy};border-radius:24px"><a href="${escapeBrandHtml(input.cta.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:${navy};color:#ffffff !important;padding:13px 30px;border-radius:24px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:1.25"><span style="color:#ffffff !important;text-decoration:none">${escapeBrandHtml(input.cta.label)}</span></a></td></tr></table>`
    : "";
  return `${BRAND_EMAIL_MARKER}<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:${pale}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeBrandHtml(input.preheader ?? "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${pale};padding:18px 8px"><tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden">
<tr><td style="padding:0;line-height:0;font-size:0"><img src="${escapeBrandHtml(BRAND.headerImageUrl)}" width="640" alt="${escapeBrandHtml(`${BRAND.commercialName} — ${headerServices(input)[0]} — ${headerServices(input)[1]}`)}" style="display:block;width:100%;height:auto;border:0"></td></tr>${input.serviceFocus?.trim() ? `<tr><td style="padding:10px 28px 0;font:12px Arial,Helvetica,sans-serif;color:${muted}">Service : <strong style="color:${navy}">${escapeBrandHtml(headerServices(input)[1])}</strong></td></tr>` : ""}
<tr><td style="padding:22px 28px 6px;font:15px/1.65 Arial,Helvetica,sans-serif;color:${ink}">
${input.title ? `<h1 style="margin:0 0 6px;font:bold 20px Arial,Helvetica,sans-serif;color:${navy}">${escapeBrandHtml(input.title)}</h1>` : ""}
${input.reference ? `<p style="margin:0 0 14px;font:12px Arial,Helvetica,sans-serif;color:${muted}">Réf. : <strong style="color:${navy}">${escapeBrandHtml(input.reference)}</strong></p>` : ""}
${input.bodyHtml}${cta}
${input.noteHtml ? `<p style="margin:18px 0 0;font:12px/1.55 Arial,Helvetica,sans-serif;color:${muted}">${input.noteHtml}</p>` : ""}
</td></tr>
<tr><td style="padding:14px 0 0;line-height:0;font-size:0"><img src="${escapeBrandHtml(BRAND.footerImageUrl)}" width="640" alt="${escapeBrandHtml([BRAND.legalName, `RC : ${BRAND.rc}`, `NIU : ${BRAND.niu}`, ...BRAND.cameroon.lines, ...BRAND.canada.lines, BRAND.email, BRAND.website].join(" · "))}" style="display:block;width:100%;height:auto;border:0"></td></tr>
<tr><td style="padding:4px 28px 12px;font:11px/1.5 Arial,Helvetica,sans-serif;color:${muted};text-align:center">© ${new Date().getFullYear()} ${escapeBrandHtml(BRAND.legalName)}</td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Habille un e-mail existant (modèle d'origine conservé tel quel) de l'en-tête et du pied de page officiels : tous les messages remis
 * au client portent la même identité. Sans effet sur un message déjà habillé ; le contenu `<body>` est extrait d'un document complet.
 */
export function frameLegacyEmailHtml(html: string, options: { serviceFocus?: string | null; preheader?: string } = {}): string {
  if (!html || html.includes(BRAND_EMAIL_MARKER)) return html;
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
  return renderBrandedEmailHtml({ title: "", bodyHtml: `<div style="margin:0 -8px">${body}</div>`, serviceFocus: options.serviceFocus, preheader: options.preheader });
}

/** Document complet à l'identité de l'agence (aperçu, lecture dans l'espace candidat) : mêmes en-tête et pied de page que les e-mails. */
export const frameBrandedDocument = (fragmentHtml: string): string => frameLegacyEmailHtml(fragmentHtml);
