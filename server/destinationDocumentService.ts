import { getDb } from "./db";
import { destinationDocuments } from "../drizzle/schema";
import { eq, desc, like, or } from "drizzle-orm";

// Cache mémoire simple avec TTL (5 minutes) pour accélérer les correspondances textuelles RAG
let memoryCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function listDestinationDocuments(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search && search.trim() !== "") {
    const term = `%${search.trim()}%`;
    return await db
      .select()
      .from(destinationDocuments)
      .where(or(like(destinationDocuments.title, term), like(destinationDocuments.country, term), like(destinationDocuments.category, term)))
      .orderBy(desc(destinationDocuments.createdAt));
  }
  
  const now = Date.now();
  if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.data;
  }

  const docs = await db
    .select()
    .from(destinationDocuments)
    .orderBy(desc(destinationDocuments.createdAt));

  memoryCache = { data: docs, timestamp: now };
  return docs;
}

export async function addDestinationDocument(data: {
  title: string;
  country: string;
  category: string;
  fileUrl: string;
  fileKey: string;
  extractedText?: string;
  fileSize?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponible");
  const [result] = await db.insert(destinationDocuments).values({
    title: data.title,
    country: data.country,
    category: data.category,
    fileUrl: data.fileUrl,
    fileKey: data.fileKey,
    extractedText: data.extractedText || null,
    fileSize: data.fileSize || null,
  });
  memoryCache = null; // Invalider le cache
  return result;
}

export async function deleteDestinationDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB non disponible");
  await db.delete(destinationDocuments).where(eq(destinationDocuments.id, id));
  memoryCache = null; // Invalider le cache
  return { success: true };
}

export interface KnowledgeSource {
  text: string;
  sourceTitle: string;
  sourceUrl: string;
  country: string;
}

export async function searchDestinationKnowledge(query: string): Promise<KnowledgeSource[]> {
  const docs = await listDestinationDocuments();
  const results: KnowledgeSource[] = [];
  const q = query.toLowerCase();

  for (const doc of docs) {
    const matchCountry = doc.country.toLowerCase().includes(q) || q.includes(doc.country.toLowerCase());
    const matchTitle = doc.title.toLowerCase().includes(q);
    const matchText = doc.extractedText && doc.extractedText.toLowerCase().includes(q);

    if (matchCountry || matchTitle || matchText) {
      results.push({
        text: doc.extractedText ? doc.extractedText.slice(0, 1200) : `Guide officiel pour ${doc.country}: ${doc.title}`,
        sourceTitle: doc.title,
        sourceUrl: doc.fileUrl,
        country: doc.country,
      });
    }
  }

  // Si aucun document spécifique ne correspond directement, retourner les 3 plus récents comme contexte général
  if (results.length === 0 && docs.length > 0) {
    for (const doc of docs.slice(0, 3)) {
      results.push({
        text: doc.extractedText ? doc.extractedText.slice(0, 800) : `Guide général ${doc.country}: ${doc.title}`,
        sourceTitle: doc.title,
        sourceUrl: doc.fileUrl,
        country: doc.country,
      });
    }
  }

  return results.slice(0, 4);
}
