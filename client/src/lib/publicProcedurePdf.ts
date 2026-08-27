export type VerifiedPortalForPdf = {
  officialPortalUrl?: string | null;
  officialPortalLabel?: string | null;
  verificationStatus?: string | null;
};

const normalizeFileSegment = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("fr")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

export function getPublicProcedurePdfFilename(countryId: string, countryName: string) {
  return `fiche-procedure-${normalizeFileSegment(countryId || countryName) || "destination"}.pdf`;
}

export function getVerifiedPortalForPdf(portal?: VerifiedPortalForPdf | null) {
  if (portal?.verificationStatus !== "verifie" || !portal.officialPortalUrl) return null;
  return {
    url: portal.officialPortalUrl,
    label: portal.officialPortalLabel || "Portail institutionnel",
  };
}
