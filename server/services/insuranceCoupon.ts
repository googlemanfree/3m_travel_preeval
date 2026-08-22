import { jsPDF } from "jspdf";

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
  pdf.setFillColor(30, 58, 138);
  pdf.rect(0, 0, 210, 42, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text("3M Travel & Services", 16, 20);
  pdf.setFontSize(11);
  pdf.text("Coupon de réservation d’assurance voyage", 16, 29);

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(16);
  pdf.text("Référence : " + data.reference, 16, 58);
  pdf.setFontSize(11);
  const rows = [
    ["Client", data.fullName],
    ["Destination", data.destinationCountry],
    ["Période", `${data.departureDate} au ${data.returnDate}`],
    ["Formule demandée", data.coveragePlan],
    ["Voyageurs", String(data.travelersCount)],
    ["Statut", "Demande reçue — traitement par l’agence en cours"],
  ];
  let y = 72;
  rows.forEach(([label, value]) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(label + " :", 16, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(value, 65, y);
    y += 11;
  });
  pdf.setDrawColor(191, 219, 254);
  pdf.line(16, y + 4, 194, y + 4);
  pdf.setFontSize(10);
  pdf.text("Ce coupon confirme la réception de votre demande. Il ne constitue pas encore une attestation d’assurance.", 16, y + 15, { maxWidth: 178 });
  pdf.text("L’attestation finale sera ajoutée à votre espace client et envoyée par e-mail après traitement par l’agence.", 16, y + 27, { maxWidth: 178 });
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text("3M Travel & Services — hello@3mtravelagency.com — +237 698 104 832", 16, 282);
  return Buffer.from(pdf.output("arraybuffer"));
}
