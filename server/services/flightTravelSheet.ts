import { jsPDF } from "jspdf";
import { COMPANY_PROFILE } from "../../client/src/lib/companyContacts";
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
  const office = COMPANY_PROFILE.offices.cameroon;
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.setFillColor(30, 58, 138);
  pdf.rect(0, 0, 210, 40, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text("3M TRAVEL AGENCY", 16, 18);
  pdf.setFontSize(11);
  pdf.text("Fiche de voyage", 16, 28);

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(13);
  pdf.text(`Dossier ${input.requestRef}`, 16, 54);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Référence de réservation (PNR) :", 16, 63);
  pdf.setFont("helvetica", "normal");
  pdf.text(input.pnrReference ? input.pnrReference : "à consulter sur le billet de la compagnie", 78, 63);

  let y = 76;
  for (const leg of sheetLegs(input.flightData)) {
    pdf.setFont("helvetica", "bold");
    pdf.text(`${leg.title} : ${leg.route}`, 16, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${leg.flight} — ${leg.when}`, 16, y + 6);
    y += 16;
  }

  const travelers = extractTravelers(input.passengerData);
  pdf.setFont("helvetica", "bold");
  pdf.text("Voyageur(s)", 16, y + 2);
  pdf.setFont("helvetica", "normal");
  y += 9;
  if (travelers.length === 0) {
    pdf.text("Voir le billet de la compagnie.", 16, y);
    y += 8;
  }
  for (const traveler of travelers) {
    pdf.text(`• ${traveler.fullName || "Nom à confirmer"}`, 16, y);
    y += 7;
  }

  y += 6;
  pdf.setDrawColor(191, 219, 254);
  pdf.line(16, y, 194, y);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Avant de partir", 16, y + 9);
  pdf.setFont("helvetica", "normal");
  const reminders = [
    "Le nom sur le billet doit être identique à celui du passeport ; le passeport doit être valide pour tout le voyage.",
    "Renseignez-vous sur les conditions d’entrée (visa, formalités sanitaires) de votre destination et de vos escales.",
    "Consultez le site de la compagnie pour l’enregistrement et les bagages autorisés par votre billet.",
    "Cette fiche est un récapitulatif : le billet ou e-ticket de la compagnie fait foi.",
  ];
  let ry = y + 17;
  for (const reminder of reminders) {
    const lines = pdf.splitTextToSize(`• ${reminder}`, 178) as string[];
    pdf.text(lines, 16, ry);
    ry += lines.length * 5 + 2;
  }

  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Émise le ${input.issuedAt.toISOString().slice(0, 10)} — ${COMPANY_PROFILE.website}`, 16, 276);
  pdf.text(`3M TRAVEL AGENCY — hello@3mtravelagency.com — WhatsApp ${office.whatsappDisplay}`, 16, 282);
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
