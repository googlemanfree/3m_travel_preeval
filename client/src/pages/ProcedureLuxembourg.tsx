import Navbar from "@/components/Navbar";
import CountryProcedureTemplate from "@/components/CountryProcedureTemplate";
import { luxembourgProcedure } from "@/data/countryProcedures/luxembourg";
import { luxembourgGuide } from "@/data/candidateGuides/luxembourg";

export default function ProcedureLuxembourg() {
  return <CountryProcedureTemplate data={luxembourgProcedure} guide={luxembourgGuide} />;
}
