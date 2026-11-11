# Variables d'environnement pour le service Railway

Ce document liste les NOMS des variables lues par le code (relevé du 2026-11-11). Il ne contient aucune valeur et ne doit jamais en contenir.
Service concerné : projet `c3df095b…`, service `3m_travel_preeval`, environnement `production`.

État constaté le 2026-11-11 : seule `JWT_SECRET` est définie. Le site s'affiche, mais tout ce qui touche à la base de données et aux e-mails est inopérant tant que les variables ci-dessous ne sont pas ajoutées.

## 1. Indispensables pour un site fonctionnel

| Variable | Rôle | Sans elle |
|---|---|---|
| `JWT_SECRET` | signature des sessions | (déjà définie) |
| `DATABASE_URL` | base MySQL (comptes, dossiers, paiements) | inscription, connexion, espace client, administration : erreurs |
| `SITE_URL` et `APP_BASE_URL` | adresse publique du site, utilisée dans les liens des e-mails (confirmation d'adresse, mot de passe, signatures) | les liens pointent vers `https://www.3mtravelagency.com` par défaut, donc vers un AUTRE hébergement |
| `NODE_ENV=production` | mode production | à vérifier : Railway le positionne normalement lui-même |

## 2. E-mails (confirmation d'adresse, mot de passe oublié, bilans)

| Variable | Rôle |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | compte d'envoi (boîte `noreply@3mtravelagency.com` chez le fournisseur) |
| `SMTP_FROM` | facultative ; doit rester une adresse `@3mtravelagency.com`, sinon elle est remplacée par `noreply@` |
| `ADMIN_EMAIL` | destinataire des alertes internes |

Sans les quatre variables SMTP, `sendEmail` échoue avec « SMTP transporter is not initialized » : aucun client ne reçoit de lien de confirmation. L'inscription réussit quand même (le compte est créé), ce qui donne l'impression d'un envoi alors que rien n'est parti.
Voir aussi `docs/configuration-email.md` pour SPF / DKIM / DMARC.

## 3. Selon les fonctions utilisées

| Fonction | Variables |
|---|---|
| Paiement en ligne (CinetPay) | `CINETPAY_SITE_ID`, `CINETPAY_API_KEY` |
| Évaluation assistée par IA | `OPENAI_API_KEY` (facultatifs : `PERPLEXITY_API_KEY`, `PERPLEXITY_MODEL`, `GEMINI_API_KEY`) |
| Recherche de vols | `SEARCHAPI_KEY`, `SERPAPI_KEY` (désactivation : `FLIGHT_OFFERS_DISABLED`, `FLIGHT_ALERTS_DISABLED`) |
| Tâches planifiées (relances) | `SCHEDULED_JOBS_MODE`, `CRON_SECRET` |
| Connexion Google | `VITE_GOOGLE_CLIENT_ID` (lue À LA CONSTRUCTION du site), `GOOGLE_CLIENT_SECRET` |
| Anti-robots | `TURNSTILE_SECRET_KEY` |
| Sécurité administrateur | `ADMIN_2FA_ENFORCEMENT`, `ACTIVATION_GUARD`, `REFERENCE_GUARD` |
| WhatsApp / alertes | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `SLACK_WEBHOOK_URL` |
| Services de la plateforme précédente | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `VITE_APP_ID` : à vérifier avant de les recréer (stockage de fichiers, connexion propriétaire) |

## 4. Règles

- Les variables `VITE_*` sont intégrées au site lors de la construction : après les avoir ajoutées, il faut un nouveau déploiement.
- Ne jamais coller une valeur dans un message, un fichier du dépôt ou une conversation. Les saisir directement dans Railway (onglet Variables du service).
- Après ajout, redéployer, puis tester : inscription d'un compte de test, réception du lien de confirmation, « mot de passe oublié ».
- Le service est construit par Railpack (constaté dans la configuration Railway) et écoute sur le port 8080.
