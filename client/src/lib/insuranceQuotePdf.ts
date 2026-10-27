import { applyLetterhead, letterheadLayout, type LetterheadOptions } from "@shared/brandLetterhead";
import { loadClientBrandLogo } from "@/lib/brandLogo";

export type InsuranceQuotePdfData = {
  reference: string;
  fullName: string;
  destinationCountry: string;
  departureDate: string;
  returnDate: string;
  coveragePlan: string;
  travelersCount: number;
};

export async function downloadInsuranceQuotePdf(data: InsuranceQuotePdfData) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadClientBrandLogo();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: "Devis indicatif d'assurance voyage",
    reference: data.reference,
    recipient: data.fullName,
    serviceFocus: data.destinationCountry ? `Assurance voyage · ${data.destinationCountry}` : "Assurance voyage",
  };
  const layout = letterheadLayout(letterhead);
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(12);
  const rows = [
    ["Référence", data.reference], ["Voyageur principal", data.fullName], ["Destination", data.destinationCountry],
    ["Période", `${data.departureDate} au ${data.returnDate}`], ["Formule souhaitée", data.coveragePlan], ["Voyageurs", String(data.travelersCount)],
  ];
  let y = layout.firstPageTop + 6;
  rows.forEach(([label, value]) => { pdf.setFont("helvetica", "bold"); pdf.text(`${label} :`, 18, y); pdf.setFont("helvetica", "normal"); pdf.text(value, 72, y); y += 11; });
  pdf.setDrawColor(203, 213, 225); pdf.line(18, y + 2, 192, y + 2); y += 15;
  pdf.setFontSize(10);
  pdf.text("Ce document est une demande de devis et ne constitue pas une attestation d'assurance.", 18, y);
  pdf.text("Un conseiller 3M TRAVEL AGENCY vous contactera pour confirmer la couverture et le tarif final.", 18, y + 7);
  applyLetterhead(pdf, letterhead);
  pdf.save(`devis-assurance-${data.reference}.pdf`);
}
