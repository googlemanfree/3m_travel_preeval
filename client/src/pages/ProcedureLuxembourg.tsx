import Navbar from "@/components/Navbar";
import CountryProcedureTemplate from "@/components/CountryProcedureTemplate";
import { luxembourgProcedure } from "@/data/countryProcedures/luxembourg";

export default function ProcedureLuxembourg() {
  return <CountryProcedureTemplate data={luxembourgProcedure} />;
}
