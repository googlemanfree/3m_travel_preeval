# Configuration OAuth sociale — 3M Travel Agency

Ce guide documente les paramètres de connexion sociale des candidats. La connexion **Google** est préparée ; la connexion **Facebook** est volontairement différée à la demande du propriétaire. Aucun secret ne doit être ajouté au code, à un fichier `.env` commité ou à un message de conversation.

## URLs de production à déclarer

| Fournisseur | Origine web autorisée | URI de redirection OAuth |
|---|---|---|
| Google | `https://www.3mtravelagency.com` | `https://www.3mtravelagency.com/api/auth/google/callback` |
| Facebook | `https://www.3mtravelagency.com` | `https://www.3mtravelagency.com/api/auth/facebook/callback` |

Les domaines de prévisualisation et les URL locales ne doivent être ajoutés qu’en environnement de test, puis retirés de la configuration de production.

## Google Cloud

Créez un client **OAuth 2.0 – Application Web** dans Google Cloud Console. Renseignez le nom public `3M Travel Agency`, l’origine et l’URI de redirection ci-dessus. Les valeurs à fournir au gestionnaire sécurisé sont `VITE_GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`.

### État de configuration

Le 15 août 2026, un client Web intitulé `3M Travel Agency – Connexion candidat` a été créé dans le projet Google Cloud du propriétaire. Son origine autorisée est `https://www.3mtravelagency.com` et son URI de redirection est `https://www.3mtravelagency.com/api/auth/google/callback`. Le client ID et le secret ne sont volontairement pas consignés dans ce document : ils doivent être déposés exclusivement dans le gestionnaire sécurisé du projet.

## Meta for Developers — différé

La configuration Facebook est **annulée pour le moment**. Le bouton Facebook reste visible mais explicitement indisponible, avec l’infobulle « Bientôt disponible ». Aucune application Meta, aucun identifiant et aucun secret Facebook ne sont requis tant que cette décision n’est pas révisée.

## Contrôles avant activation

1. Vérifier que l’écran de consentement affiche l’identité 3M Travel Agency et une adresse de support valide.
2. Restreindre les permissions aux seules données indispensables : identité de base et e-mail.
3. Vérifier les callback URLs exactes, sans joker ni domaine tiers.
4. Tester un compte Google de test avant l’ouverture générale du parcours.
5. Conserver Facebook en mode « Bientôt disponible » jusqu’à une décision explicite de l’activer.
