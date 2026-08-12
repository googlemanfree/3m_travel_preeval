export type CandidateDocumentState = "uploaded" | "verified" | "rejected";

export function toDisplayDocumentStatus(status: CandidateDocumentState): "pending" | "verified" | "rejected" {
  return status === "uploaded" ? "pending" : status;
}

export function getDocumentStatusCounts(documents: readonly { status: CandidateDocumentState }[]) {
  const totalDocuments = documents.length;
  const verifiedCount = documents.filter((document) => document.status === "verified").length;
  const pendingCount = documents.filter((document) => document.status === "uploaded").length;
  const rejectedCount = documents.filter((document) => document.status === "rejected").length;
  const completionPercentage = totalDocuments > 0 ? Math.round((verifiedCount / totalDocuments) * 100) : 0;

  return { totalDocuments, verifiedCount, pendingCount, rejectedCount, completionPercentage };
}
