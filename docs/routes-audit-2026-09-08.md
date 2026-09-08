# Audit complet des routes — 2026-09-08

## Périmètre testé
Le sitemap public expose 133 URL. Chaque URL a été testée par requête HTTP sur `https://www.3mtravelagency.com` et sur la prévisualisation `https://3000-iny5kjmnfoev8tdfi1ei2-47c1dede.us1.manus.computer`.

## Résultats HTTP
Les 133 URL du sitemap ont répondu avec le statut HTTP 200 sur le domaine public. Les mêmes 133 URL ont répondu avec HTTP 200 sur la prévisualisation. Aucun statut non-200 n’a été relevé dans le sitemap.

Les routes principales testées hors sitemap comprennent `/`, `/login`, `/signup`, `/mon-espace?section=dossier`, `/mon-dossier`, `/document-upload`, `/mes-vols-favoris`, `/flights`, `/tourisme`, `/assurance`, `/traduction/order`, `/hotels`, `/visa-etudes`, `/etat-du-service`, `/admin`, `/admin/digital-services`, `/robots.txt`, `/sitemap.xml` et `/api/og`. Elles répondent avec HTTP 200.

`/evaluation-primaire` répond avec HTTP 200 et redirige vers `/#evaluation-multi`, conformément au comportement attendu. `/evaluation-rapide-enhanced` répond avec HTTP 404 et affiche la page « Page introuvable ». Cette URL reste l’anomalie publique identifiée ; aucune correction n’a été appliquée sans confirmation de la destination de redirection attendue.

## Routes protégées
Sans session, les routes protégées renvoient le shell applicatif avec HTTP 200 ; le contrôle d’accès est effectué côté client. La page réelle `/mon-espace?section=dossier` affiche l’écran d’accès réservé avec les options de connexion et d’inscription lorsqu’aucune session n’est disponible.

Une session navigateur actuellement active affiche `/admin` comme tableau de bord administrateur, mais le compte visible n’est pas le compte DomFac Sumo demandé pour les tests administrateur. Aucune mutation, validation, paiement ou action métier n’a été exécutée avec cette session.

## Limites
L’audit HTTP ne remplace pas un test de chaque action interne tRPC. Les mutations admin et les parcours candidat nécessitent des sessions dédiées ; elles doivent être testées avec le compte autorisé DomFac Sumo ou un dossier fictif explicitement autorisé.

## Divergence à investiguer — evaluation-rapide-enhanced

Le test HTTP sans session par curl a obtenu HTTP 404 et le titre « Page introuvable » pour `/evaluation-rapide-enhanced`. Lors d’une navigation dans le navigateur avec une session active, l’URL finale observée est `https://www.3mtravelagency.com/#evaluation-multi`, avec le formulaire d’évaluation multi-projets affiché. Cette divergence peut provenir d’une redirection côté client, d’un service worker/cache ou d’une différence de session ; elle doit être vérifiée en navigation privée sans session avant de déclarer la route conforme.
