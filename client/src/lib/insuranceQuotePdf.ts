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
  const pdf = new jsPDF();
  pdf.setFillColor(15, 30, 74);
  pdf.rect(0, 0, 210, 42, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text("3M Travel & Services SARL", 18, 20);
  pdf.setFontSize(12);
  pdf.text("Devis indicatif d'assurance voyage", 18, 30);
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(12);
  const rows = [
    ["Référence", data.reference], ["Voyageur principal", data.fullName], ["Destination", data.destinationCountry],
    ["Période", `${data.departureDate} au ${data.returnDate}`], ["Formule souhaitée", data.coveragePlan], ["Voyageurs", String(data.travelersCount)],
  ];
  let y = 60;
  rows.forEach(([label, value]) => { pdf.setFont("helvetica", "bold"); pdf.text(`${label} :`, 18, y); pdf.setFont("helvetica", "normal"); pdf.text(value, 72, y); y += 11; });
  pdf.setDrawColor(203, 213, 225); pdf.line(18, y + 2, 192, y + 2); y += 15;
  pdf.setFontSize(10);
  pdf.text("Ce document est une demande de devis et ne constitue pas une attestation d'assurance.", 18, y);
  pdf.text("Un conseiller 3M Travel & Services vous contactera pour confirmer la couverture et le tarif final.", 18, y + 7);
  pdf.save(`devis-assurance-${data.reference}.pdf`);
}
