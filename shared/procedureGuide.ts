import { PDF_CATEGORIES, type PdfCategory, type PdfResource } from "./pdfResources";

export function getAllProcedureResources(categories: PdfCategory[] = PDF_CATEGORIES): PdfResource[] {
  return categories.flatMap((category) => category.resources);
}

export function filterProcedureResources(query: string, categories: PdfCategory[] = PDF_CATEGORIES): PdfResource[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const resources = getAllProcedureResources(categories);
  if (!normalizedQuery) return resources;

  return resources.filter((resource) => [resource.title, resource.country, resource.type]
    .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)));
}

export function getProcedureGuideUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/guide-procedures`;
}
