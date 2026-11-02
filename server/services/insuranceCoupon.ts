import { jsPDF } from "jspdf";
import { applyLetterhead, letterheadLayout, type LetterheadOptions } from "../../shared/brandLetterhead";
import { loadBrandLogoSync } from "../utils/brandLogo";

export type InsuranceCouponData = {
  reference: string;
  fullName: string;
  destinationCountry: string;
  departureDate: string;
  returnDate: string;
  coveragePlan: string;
  travelersCount: number;
};

export function createInsuranceCouponPdf(data: InsuranceCouponData): Buffer {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const logo = loadBrandLogoSync();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: "Coupon de réservation d’assurance voyage",
    reference: data.reference,
    recipient: data.fullName,
  };
  const layout = letterheadLayout(letterhead);
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(11);
  const rows = [
    ["Client", data.fullName],
    ["Destination", data.destinationCountry],
    ["Période", `${data.departureDate} au ${data.returnDate}`],
    ["Formule demandée", data.coveragePlan],
    ["Voyageurs", String(data.travelersCount)],
    ["Statut", "Demande reçue — traitement par l’agence en cours"],
  ];
  let y = layout.firstPageTop + 6;
  rows.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(label + " :", 18, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(value, 65, y, { maxWidth: 125 });
    y += 10;
  });
  pdf.setDrawColor(191, 219, 254);
  pdf.line(18, y + 2, 192, y + 2);
  pdf.setFontSize(10);
  pdf.text("Ce coupon confirme la réception de votre demande. Il ne constitue pas encore une attestation d’assurance.", 18, y + 12, { maxWidth: 174 });
  pdf.text("L’attestation finale sera ajoutée à votre espace client et envoyée par e-mail après traitement par l’agence.", 18, y + 24, { maxWidth: 174 });
  applyLetterhead(pdf, letterhead);
  return Buffer.from(pdf.output("arraybuffer"));
}
