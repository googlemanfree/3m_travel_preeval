# Basculer la production de Manus vers Railway — plan

Statut : **préparation uniquement**. Rien n'est basculé ; Manus reste la production tant que ce plan n'est pas exécuté.

## Règles
1. Une seule production à la fois, une seule base. Jamais deux instances branchées sur la même base.
2. Toute instance qui n'est pas la production démarre avec `JOBS_ENABLED=off` : aucune relance, aucun envoi planifié.
3. On ne touche jamais à la base Manus depuis le code ou depuis une session de développement : l'export est fait par le propriétaire (ou par Manus).

## Ce qu'il faut récupérer (par le propriétaire)
| Élément | Où | Pourquoi |
|---|---|---|
| Export complet de la base (dump SQL) | panneau Base de données de Manus | données des candidats, dossiers, reçus, protocoles |
| Valeurs de `JWT_SECRET`, `DATABASE_URL` cible | Manus (secrets) / Railway | garder les sessions valides, brancher la nouvelle base |
| `RESEND_API_KEY` ou `SMTP_HOST/PORT/USER/PASS/FROM` | fournisseur e-mail | e-mails de reçu, bilans, activation |
| `CINETPAY_SITE_ID`, `CINETPAY_API_KEY` | CinetPay | paiement en ligne |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/WHATSAPP_NUMBER` | Twilio | WhatsApp automatique |
| `OPENAI_API_KEY` (et autres clés IA/recherche utilisées) | fournisseurs | bilans automatiques |
| Accès au stockage des fichiers (`BUILT_IN_FORGE_API_URL/KEY`) **ou** copie de tous les fichiers | Manus | CV, passeports, diplômes : sans cela, les anciens fichiers sont introuvables |
| Variables de connexion (`OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) | Manus / Google | connexion des candidats et de l'administration |

## Points de vigilance
- **Fichiers déposés** : le code passe par `/manus-storage/…` et l'API de stockage Manus. Deux issues : conserver l'accès à ce stockage, ou copier tous les fichiers vers un stockage propre puis réécrire les liens. À décider avant la bascule.
- **Connexion** : vérifier quelle méthode utilisent les vrais utilisateurs (Manus, Google, mot de passe administrateur) avant de couper Manus.
- **Domaine** : rediriger `www.3mtravelagency.com` vers Railway et couper Manus au même moment (un seul site actif).
- **Callbacks** : paiement (CinetPay), WhatsApp (Twilio) et connexion Google doivent pointer vers la nouvelle adresse.

## Déroulé
1. Créer une base MySQL sur Railway ; y charger l'export. Instance de répétition avec `JOBS_ENABLED=off` et sans clés d'envoi réelles.
2. Vérifier : connexion, liste des candidats, ouverture d'un fichier, reçu et protocole.
3. Fenêtre de bascule calme : geler les écritures sur Manus, refaire un export final, le charger, mettre les clés réelles, retirer `JOBS_ENABLED=off`, basculer le domaine, couper Manus.
4. Surveiller 24 h (envois, paiements, connexions) ; garder l'export final et l'ancien accès Manus en lecture pour retour arrière.

## Retour arrière
Remettre le domaine sur Manus (qui n'a pas été modifié) ; la base Railway est conservée pour analyse. Aucune donnée n'est supprimée côté Manus pendant la bascule.
