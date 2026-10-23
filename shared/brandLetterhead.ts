/**
 * Papier à en-tête officiel de 3M TRAVEL AGENCY : une seule définition pour tous les documents remis au client
 * (factures et reçus, protocoles d'accord, bilans et résultats d'évaluation, formulaires, notes, coupons) et pour les e-mails.
 *
 * - `letterheadLayout` donne les zones utilisables (à lire AVANT d'écrire le contenu) ;
 * - `applyLetterhead` peint l'en-tête, le pied de page et le filigrane sur chaque page (à appeler APRÈS le contenu) ;
 * - `renderBrandedEmailHtml` produit l'équivalent pour les e-mails (même identité, mêmes coordonnées).
 * Les coordonnées légales proviennent d'ici et d'ici seulement : une modification se répercute partout.
 */

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
  let firstPageTop = options.documentKind ? 60 : 46;
  if (options.recipient) firstPageTop += 6;
  if (options.subject) firstPageTop += 6;
  return { marginLeft: MARGIN_LEFT, marginRight: MARGIN_RIGHT, contentWidth: MARGIN_RIGHT - MARGIN_LEFT, firstPageTop, nextPageTop: 34, contentBottom: 257 };
}

export function frenchDateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Douala" });
}

type Segment = { l: [number, number] } | { c: [number, number, number, number, number, number] };

/** Trace une forme pleine à partir de points absolus (droites et courbes de Bézier) ; jsPDF attend des déplacements relatifs. */
function fillShape(doc: PdfLike, start: [number, number], segments: Segment[], color: readonly number[]) {
  let [cx, cy] = start;
  const relative = segments.map((segment) => {
    if ("l" in segment) {
      const out = [segment.l[0] - cx, segment.l[1] - cy];
      [cx, cy] = segment.l;
      return out;
    }
    const [x1, y1, x2, y2, x3, y3] = segment.c;
    const out = [x1 - cx, y1 - cy, x2 - cx, y2 - cy, x3 - cx, y3 - cy];
    [cx, cy] = [x3, y3];
    return out;
  });
  doc.setFillColor(color[0], color[1], color[2]);
  doc.lines(relative, start[0], start[1], [1, 1], "F", true);
}

function drawTopWaves(doc: PdfLike, scale = 1) {
  const s = (value: number) => value * scale;
  const right = PAGE_W;
  const layers: Array<{ from: number; drop: number; mid: number; color: readonly number[] }> = [
    { from: 110, drop: 17, mid: 12, color: BRAND_COLORS.pale },
    { from: 135, drop: 12, mid: 8.5, color: BRAND_COLORS.light },
    { from: 150, drop: 8, mid: 5.5, color: BRAND_COLORS.blue },
    { from: 172, drop: 4.5, mid: 3, color: BRAND_COLORS.navy },
  ];
  for (const layer of layers) {
    const from = right - (right - layer.from) * scale;
    fillShape(doc, [from, 0], [{ l: [right, 0] }, { l: [right, s(layer.drop)] }, { c: [right - (right - from) * 0.55, s(layer.mid), right - (right - from) * 0.25, s(layer.mid * 0.45), from, 0] }], layer.color);
  }
}

function drawBottomWaves(doc: PdfLike) {
  const layers: Array<{ top: number; mid: number; color: readonly number[] }> = [
    { top: 290.5, mid: 292.5, color: BRAND_COLORS.pale },
    { top: 292.5, mid: 294, color: BRAND_COLORS.light },
    { top: 294, mid: 295, color: BRAND_COLORS.blue },
    { top: 295.6, mid: 296.2, color: BRAND_COLORS.navy },
  ];
  for (const layer of layers) {
    fillShape(doc, [0, PAGE_H], [{ l: [0, layer.top + 3] }, { c: [60, layer.mid + 3.5, 140, layer.mid + 1, PAGE_W, layer.top - 3] }, { l: [PAGE_W, PAGE_H] }], layer.color);
  }
}

function drawLogo(doc: PdfLike, options: LetterheadOptions, x: number, y: number, size: number) {
  if (options.logoDataUri) {
    try {
      doc.addImage(options.logoDataUri, options.logoFormat ?? "PNG", x, y, size, size, "brand-logo", "FAST");
      return;
    } catch {
      /* repli : monogramme */
    }
  }
  doc.setDrawColor(NR, NG, NB);
  doc.setLineWidth(0.9);
  doc.circle(x + size / 2, y + size / 2, size / 2 - 0.5, "S");
  doc.setTextColor(BRAND_COLORS.blue[0], BRAND_COLORS.blue[1], BRAND_COLORS.blue[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 0.8);
  doc.text("3M", x + size / 2, y + size / 2 + size * 0.14, { align: "center" });
}

function drawWatermark(doc: PdfLike, options: LetterheadOptions) {
  if (!options.logoDataUri || options.watermark === false || typeof doc.GState !== "function" || typeof doc.setGState !== "function") return;
  try {
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    doc.addImage(options.logoDataUri, options.logoFormat ?? "PNG", 45, 95, 120, 120, "brand-logo", "FAST");
  } catch {
    /* le filigrane est un décor : jamais bloquant */
  } finally {
    try { doc.setGState(new doc.GState({ opacity: 1 })); } catch { /* ignore */ }
  }
}

function drawFirstPageHeader(doc: PdfLike, options: LetterheadOptions) {
  drawTopWaves(doc);
  drawLogo(doc, options, MARGIN_LEFT, 8, 25);
  doc.setTextColor(NR, NG, NB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.text(BRAND.commercialName, 47, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  const [servicesLine, focusLine] = headerServices(options);
  doc.text(servicesLine, 47, 26.5);
  if (options.serviceFocus?.trim()) doc.setFont("helvetica", "bold");
  doc.text(focusLine, 47, 31);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_LEFT, 37, MARGIN_RIGHT, 37);

  if (!options.documentKind) return;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(NR, NG, NB);
  doc.text(options.documentKind.toUpperCase(), MARGIN_LEFT, 47);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
  if (options.reference) doc.text(`Réf. : ${options.reference}`, MARGIN_RIGHT, 44.5, { align: "right" });
  doc.text(`Yaoundé, le ${options.dateLabel || frenchDateLabel()}`, MARGIN_RIGHT, 49, { align: "right" });
  doc.setDrawColor(BRAND_COLORS.blue[0], BRAND_COLORS.blue[1], BRAND_COLORS.blue[2]);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_LEFT, 53, MARGIN_LEFT + 28, 53);
  let y = 59;
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
  drawTopWaves(doc, 0.6);
  drawLogo(doc, options, MARGIN_LEFT, 8, 13);
  doc.setTextColor(NR, NG, NB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(BRAND.commercialName, 34, 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
  const right = [options.documentKind ? options.documentKind.toUpperCase() : "", options.reference ? `Réf. : ${options.reference}` : ""].filter(Boolean).join("  ·  ");
  if (right) doc.text(right, MARGIN_RIGHT, 25, { align: "right" });
  doc.setDrawColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_LEFT, 27, MARGIN_RIGHT, 27);
}

function drawFooter(doc: PdfLike, page: number, total: number) {
  drawBottomWaves(doc);
  doc.setDrawColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_LEFT, 261.5, MARGIN_RIGHT, 261.5);
  const columns: Array<{ x: number; block: { title: string; lines: readonly string[] } }> = [
    { x: MARGIN_LEFT, block: BRAND.cameroon },
    { x: 112, block: BRAND.canada },
  ];
  for (const { x, block } of columns) {
    doc.setTextColor(NR, NG, NB);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(block.title, x, 266);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(BRAND_COLORS.ink[0], BRAND_COLORS.ink[1], BRAND_COLORS.ink[2]);
    let y = 270;
    for (const line of block.lines) {
      const wrapped = doc.splitTextToSize(line, 80) as string[];
      for (const part of wrapped) {
        doc.text(part, x, y);
        y += 3.3;
      }
    }
  }
  doc.setFontSize(6.6);
  doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
  doc.text(`${BRAND.legalName}  ·  RC : ${BRAND.rc}  ·  NIU : ${BRAND.niu}`, PAGE_W / 2, 279.2, { align: "center" });
  doc.setFillColor(NR, NG, NB);
  doc.roundedRect(PAGE_W / 2 - 32, 281.4, 64, 5.6, 2.8, 2.8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(BRAND.website, PAGE_W / 2, 285.2, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
  doc.text(`Page ${page} / ${total}`, MARGIN_RIGHT, 279.2, { align: "right" });
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
<tr><td style="height:5px;background:${navy};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="height:3px;background:${blue};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="height:3px;background:${light};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:22px 28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="64" style="vertical-align:middle"><img src="${escapeBrandHtml(BRAND.logoUrl)}" width="56" height="56" alt="${escapeBrandHtml(BRAND.commercialName)}" style="display:block;border:0"></td>
<td style="vertical-align:middle;padding-left:12px"><div style="font:bold 22px Arial,Helvetica,sans-serif;color:${navy};letter-spacing:.5px">${escapeBrandHtml(BRAND.commercialName)}</div>
<div style="font:11px/1.45 Arial,Helvetica,sans-serif;color:${muted}">${escapeBrandHtml(headerServices(input)[0])}<br>${input.serviceFocus?.trim() ? `<strong style="color:${navy}">${escapeBrandHtml(headerServices(input)[1])}</strong>` : escapeBrandHtml(headerServices(input)[1])}</div></td>
</tr></table></td></tr>
<tr><td style="padding:0 28px"><div style="height:1px;background:${light}"></div></td></tr>
<tr><td style="padding:22px 28px 6px;font:15px/1.65 Arial,Helvetica,sans-serif;color:${ink}">
${input.title ? `<h1 style="margin:0 0 6px;font:bold 20px Arial,Helvetica,sans-serif;color:${navy}">${escapeBrandHtml(input.title)}</h1>` : ""}
${input.reference ? `<p style="margin:0 0 14px;font:12px Arial,Helvetica,sans-serif;color:${muted}">Réf. : <strong style="color:${navy}">${escapeBrandHtml(input.reference)}</strong></p>` : ""}
${input.bodyHtml}${cta}
${input.noteHtml ? `<p style="margin:18px 0 0;font:12px/1.55 Arial,Helvetica,sans-serif;color:${muted}">${input.noteHtml}</p>` : ""}
</td></tr>
<tr><td style="padding:18px 28px 0"><div style="height:1px;background:${light}"></div></td></tr>
<tr><td style="padding:14px 28px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${block(BRAND.cameroon)}${block(BRAND.canada)}</tr></table></td></tr>
<tr><td style="padding:6px 28px 16px;font:11px/1.5 Arial,Helvetica,sans-serif;color:${muted};text-align:center">${escapeBrandHtml(BRAND.legalName)} · RC : ${escapeBrandHtml(BRAND.rc)} · NIU : ${escapeBrandHtml(BRAND.niu)}<br><a href="${escapeBrandHtml(BRAND.siteUrl)}" style="color:${blue};text-decoration:none;font-weight:bold">${escapeBrandHtml(BRAND.website)}</a><br>© ${new Date().getFullYear()} ${escapeBrandHtml(BRAND.commercialName)}</td></tr>
<tr><td style="height:3px;background:${light};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="height:3px;background:${blue};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="height:5px;background:${navy};font-size:0;line-height:0">&nbsp;</td></tr>
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
