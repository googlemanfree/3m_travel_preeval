export type ClientBrandLogo = { dataUri: string; format: "PNG" };

let cached: Promise<ClientBrandLogo | null> | null = null;

/**
 * Logo officiel pour les PDF générés dans le navigateur (reçus, résultats d'évaluation…). Chargé une seule fois ; `null` si le réseau
 * échoue : le papier à en-tête dessine alors un monogramme et le document est produit quand même.
 */
export function loadClientBrandLogo(): Promise<ClientBrandLogo | null> {
  if (!cached) {
    cached = (async () => {
      try {
        const response = await fetch("/logo-3m-travel-agency-hd.png");
        if (!response.ok) return null;
        const blob = await response.blob();
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        return { dataUri, format: "PNG" as const };
      } catch {
        return null;
      }
    })();
  }
  return cached;
}
