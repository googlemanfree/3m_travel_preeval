/**
 * Canevas de départ d'un bilan : la structure (note, atouts, points à renforcer, recommandations, ouverture du dossier) est posée, les contenus propres au
 * candidat restent en « [À CONFIRMER : …] » : la validation est bloquée tant qu'ils ne sont pas remplacés, donc rien ne part avec un trou.
 * Aucun fait n'est inventé, aucun résultat promis.
 */
export type SkeletonKind = "travail" | "etudes" | "tourisme" | "autre";

const PROJECT: Record<SkeletonKind, string> = {
  travail: "de travail",
  etudes: "d'études",
  tourisme: "de séjour",
  autre: "de mobilité",
};

export function bilanSkeleton(kind: SkeletonKind): string {
  return `Objet : Votre évaluation professionnelle — [À CONFIRMER : note] / 100

Cher(e) {{nom}},

Merci de nous avoir confié votre projet ${PROJECT[kind]} vers {{destination}}. Notre équipe a étudié votre profil ; voici notre analyse.

## Votre note de préparation

Note globale : [À CONFIRMER : note] / 100

Cette note mesure la préparation de votre dossier. Elle ne représente ni une probabilité d'obtention ni une décision des autorités.

## Vos atouts

- [À CONFIRMER : premier atout observé dans votre dossier]
- [À CONFIRMER : deuxième atout]

## Points à renforcer

- [À CONFIRMER : premier point à renforcer]

## Nos recommandations

- [À CONFIRMER : première recommandation concrète]

## Prochaine étape : ouvrir votre dossier

Pour avancer, ouvrez votre dossier depuis votre espace client en cliquant sur « Je valide et j'ouvre mon dossier ». Les frais d'ouverture pour votre profil sont de **{{montant}} XAF**. Votre conseiller {{conseiller}} vous accompagne à chaque étape et vérifie vos pièces avant tout dépôt.

Pour que le calendrier reste confortable, nous vous conseillons d'ouvrir votre dossier avant le {{date_limite}}.

Bien cordialement,
{{conseiller}}
3M Travel Agency`;
}
