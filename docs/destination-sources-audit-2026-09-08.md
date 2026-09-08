# Audit local du registre des sources officielles

Date de contrôle : 2026-09-08.

L’audit déterministe du catalogue `client/src/data/procedures107Complete.ts` a trouvé **91 entrées de procédure** dans le fichier actuellement utilisé par le site. Le registre `client/src/data/institutionalProcedureSources.ts` contient **107 entrées de sources**, toutes avec une URL HTTPS institutionnelle détectée par le contrôle local.

Aucune des 91 procédures du catalogue n’est absente du registre des sources. Aucun doublon d’identifiant de procédure n’a été détecté dans le catalogue, et aucun doublon d’identifiant de source n’a été détecté dans le registre. Cet audit vérifie la présence et la structure déclarée dans le code ; il ne constitue pas encore une validation en temps réel de la disponibilité de chaque URL externe.

La collecte d’images décoratives premium n’a pas été lancée, conformément au périmètre approuvé. Aucune route, donnée ou fiche existante n’a été supprimée.

## Contrôle réseau ciblé

Un contrôle passif a confirmé les nouvelles références suivantes : la page bulgare du ministère de l’Intérieur répond HTTP 200, la page du ministère de l’Économie des Émirats arabes unis répond HTTP 200, et la page e‑Visa de Türkiye est accessible mais répond HTTP 403 depuis l’environnement de contrôle ; elle reste néanmoins une page officielle du portail evisa.gov.tr et n’est pas traitée comme une absence de source.

L’ancienne URL UAE qui répondait HTTP 404 a été remplacée. Les anciennes URL bulgare et Türkiye ont également été remplacées par des pages officielles plus stables. Les réponses HTTP 403 de certains portails institutionnels ne sont pas assimilées à une absence de source : elles indiquent un filtrage de l’agent de contrôle, non une validation de contenu par le site 3M Travel.

## Références institutionnelles corrigées

| Procédure | Source officielle publiée |
|---|---|
| Bulgarie — travail | [Ministère de l’Intérieur de Bulgarie](https://www.mi.government.bg/en/general/naemane-na-slujiteli-grajdani-ot-drugi-darjavi/) |
| Émirats arabes unis — visa touristique | [Ministère de l’Économie des Émirats arabes unis](https://www.moet.gov.ae/en/-/travel-requirements-for-the-uae-tourist-visa) |
| Türkiye — e‑Visa | [Portail e‑Visa officiel](https://www.evisa.gov.tr/en/tour/) |

## Vérification des routes du lot 1

Les dix routes suivantes répondent HTTP 200 sur la prévisualisation : `/procedures/canada-travail`, `/procedures/luxembourg-travail`, `/procedures/france-travail`, `/procedures/belgique-etudes`, `/procedures/allemagne-travail`, `/procedures/suisse-travail`, `/procedures/royaume-uni-travail`, `/procedures/etats-unis-travail`, `/procedures/australie-travail` et `/procedures/italie-travail`.

Cette vérification porte sur la couche publique des sources et du contenu. Elle ne valide pas la collecte d’images décoratives, qui reste explicitement reportée.
