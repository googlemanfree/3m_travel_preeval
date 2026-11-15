/** Exécute `task` sur chaque élément, `limit` à la fois, en conservant l'ordre des résultats (les requêtes d'un écran partent en parallèle sans saturer la base). */
export async function mapWithLimit<T, R>(items: T[], limit: number, task: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    for (let index = next++; index < items.length; index = next++) results[index] = await task(items[index], index);
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return results;
}
