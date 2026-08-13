export function getRejectedDocumentCount(documents: readonly { status?: string | null }[]): number {
  return documents.filter((document) => document.status === "rejected").length;
}

export function hasRejectedDocuments(documents: readonly { status?: string | null }[]): boolean {
  return getRejectedDocumentCount(documents) > 0;
}
