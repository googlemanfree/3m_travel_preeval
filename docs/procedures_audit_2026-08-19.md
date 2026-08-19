# Audit — Page Procédures

- **URL consultée :** https://www.3mtravelagency.com/procedures
- **Date de vérification :** 19 août 2026
- **Composant actif :** `client/src/pages/ProceduresAdvanced.tsx`
- **Constats publics :** la page expose les filtres de 107 procédures, le comparatif Travail/Études/Tourisme, les fiches destination et le bouton WhatsApp global vers `+237698104832`.
- **CRS :** le simulateur est volontairement concentré sur `/canada` pour éviter toute confusion entre les parcours ; la page Procédures doit conserver un appel à l’action clair vers cette section.
- **Mesure :** GA4 est déjà chargé dans `client/index.html` avec l’identifiant `G-4HBHHH37VL`. Aucun identifiant Facebook Pixel n’est configuré ou fourni : ne pas ajouter de balise fictive.
- **Actions prévues :** ajouter un accès CRS visible, une checklist interactive par type de visa, renforcer les fonctions administratives de revalidation des portails et analyser les destinations demandées.
