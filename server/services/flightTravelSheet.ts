import { jsPDF } from "jspdf";
import { applyLetterhead, letterheadLayout, type LetterheadOptions } from "../../shared/brandLetterhead";
import { loadBrandLogoSync } from "../utils/brandLogo";
import { extractTravelers } from "../../shared/flightTravelerCheck";

/**
 * Fiche de voyage remise avec le billet : récapitulatif de ce que l'agence sait avec certitude (trajet, référence de réservation, voyageurs)
 * et rappels utiles. Ce n'est PAS le billet : le document de la compagnie fait foi. Aucun horaire d'enregistrement ni règle de bagages
 * n'y figure, ces informations dépendent de la compagnie et du billet.
 */

export type TravelSheetInput = { requestRef: string; pnrReference: string | null; flightData: unknown; passengerData: unknown; issuedAt: Date };

const record = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
const text = (value: unknown, fallback: string, max = 120): string => (typeof value === "string" && value.trim() ? value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max) : fallback);

export type SheetLeg = { title: string; route: string; when: string; flight: string };

export function sheetLegs(flightData: unknown): SheetLeg[] {
  const flight = record(flightData);
  const leg = (title: string, value: Record<string, unknown>): SheetLeg => ({
    title,
    route: `${text(value.originCity, text(value.origin, "Départ à confirmer"))} → ${text(value.destinationCity, text(value.destination, "Arrivée à confirmer"))}`,
    when: `${text(value.departureDate, "date à confirmer", 20)} · ${text(value.departureTime, "--:--", 10)} → ${text(value.arrivalTime, "--:--", 10)}`,
    flight: `${text(record(value.airline).name, "Compagnie à confirmer")} ${text(value.flightNumber, "", 20)}`.trim(),
  });
  const back = record(flight.returnFlight);
  return [leg("Aller", flight), ...(Object.keys(back).length > 0 ? [leg("Retour", back)] : [])];
}

export function createTravelSheetPdf(input: TravelSheetInput): Buffer {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const logo = loadBrandLogoSync();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: "Fiche de voyage",
    reference: input.requestRef,
    dateLabel: input.issuedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Douala" }),
  };
  const layout = letterheadLayout(letterhead);
  const room = (needed: number, current: number) => {
    if (current + needed <= layout.contentBottom) return current;
    pdf.addPage();
    return layout.nextPageTop;
  };

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  let top = layout.firstPageTop + 4;
  pdf.text("Référence de réservation (PNR) :", 18, top);
  pdf.setFont("helvetica", "normal");
  pdf.text(input.pnrReference ? input.pnrReference : "à consulter sur le billet de la compagnie", 80, top);

  let y = top + 13;
  for (const leg of sheetLegs(input.flightData)) {
    y = room(16, y);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${leg.title} : ${leg.route}`, 18, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${leg.flight} — ${leg.when}`, 18, y + 6);
    y += 16;
  }

  const travelers = extractTravelers(input.passengerData);
  pdf.setFont("helvetica", "bold");
  y = room(20, y);
  pdf.text("Voyageur(s)", 18, y + 2);
  pdf.setFont("helvetica", "normal");
  y += 9;
  if (travelers.length === 0) {
    pdf.text("Voir le billet de la compagnie.", 18, y);
    y += 8;
  }
  for (const traveler of travelers) {
    y = room(7, y);
    pdf.text(`• ${traveler.fullName || "Nom à confirmer"}`, 18, y);
    y += 7;
  }

  y = room(60, y + 6);
  pdf.setDrawColor(191, 219, 254);
  pdf.line(18, y, 192, y);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Avant de partir", 18, y + 9);
  pdf.setFont("helvetica", "normal");
  const reminders = [
    "Le nom sur le billet doit être identique à celui du passeport ; le passeport doit être valide pour tout le voyage.",
    "Renseignez-vous sur les conditions d’entrée (visa, formalités sanitaires) de votre destination et de vos escales.",
    "Consultez le site de la compagnie pour l’enregistrement et les bagages autorisés par votre billet.",
    "Cette fiche est un récapitulatif : le billet ou e-ticket de la compagnie fait foi.",
  ];
  let ry = y + 17;
  for (const reminder of reminders) {
    const lines = pdf.splitTextToSize(`• ${reminder}`, 174) as string[];
    ry = room(lines.length * 5 + 2, ry);
    pdf.text(lines, 18, ry);
    ry += lines.length * 5 + 2;
  }

  applyLetterhead(pdf, letterhead);
  return Buffer.from(pdf.output("arraybuffer"));
}

/** Pièce jointe prête pour `sendEmail` ; null si la fiche n'a pas pu être générée (l'e-mail part alors sans elle). */
export function travelSheetAttachment(input: TravelSheetInput): { filename: string; content: Buffer; contentType: string } | null {
  try {
    return { filename: `Fiche-de-voyage-${input.requestRef}.pdf`, content: createTravelSheetPdf(input), contentType: "application/pdf" };
  } catch (error) {
    console.error("[TravelSheet] generation failed", { requestRef: input.requestRef, error });
    return null;
  }
}
