# Sources hôtelières régionales vérifiées — cadrage 3M Booking

Date de collecte : 20 août 2026.

| Périmètre | Établissement ou source | Informations publiques vérifiées | Usage proposé dans 3M Booking |
|---|---|---|---|
| Cameroun | [Hilton Yaoundé](https://www.hilton.com/en/hotels/yaohitw-hilton-yaounde/) | Hôtel du quartier d’affaires, Wi‑Fi gratuit, restaurant, piscine extérieure et parking gratuit. | Fiche à rattacher à la réservation officielle Hilton, sous réserve de vérification manuelle du tarif et des dates. |
| République du Congo | [Radisson Blu M’Bamou Palace Hotel, Brazzaville](https://www.radissonhotels.com/en-us/hotels/radisson-blu-brazzaville-mbamou) | Hôtel au bord du fleuve Congo, restaurants, piscine extérieure, centre de fitness et spa. | Fiche à rattacher à la réservation officielle Radisson, sous réserve de vérification manuelle du tarif et des dates. |
| Tchad | [Radisson Blu Hotel, N’Djamena](https://www.radissonhotels.com/en-us/hotels/radisson-blu-ndjamena) | Hôtel près du centre-ville, deux restaurants, salle de sport, piscine extérieure et courts de tennis. | Fiche à rattacher à la réservation officielle Radisson, sous réserve de vérification manuelle du tarif et des dates. |

## Constat opérationnel

Les sites d’hôtels officiels confirment des informations descriptives et des équipements, mais ne fournissent pas un flux exhaustif et interopérable de tous les hôtels, tarifs et disponibilités. Les tarifs varient selon les dates, l’occupation, les conditions et le canal de réservation. Ils ne doivent donc pas être stockés ou affichés comme garantis sans source contractuelle ou contrôle manuel daté.

Le modèle initial recommandé est un catalogue administrable : chaque fiche doit conserver le pays, la ville, l’URL officielle de réservation, la provenance, les équipements, la date de dernière vérification et le statut de vérification. Toute demande 3M Booking est transmise au back-office avec ces références ; le conseiller vérifie ensuite le tarif et la disponibilité sur le site officiel avant d’adresser un devis client.

## Fournisseurs B2B étudiés

| Fournisseur | Capacités déclarées | Adaptation au projet | Point de contrôle avant connexion |
|---|---|---|---|
| [HBX Group / Hotelbeds](https://developer.hotelbeds.com/documentation/hotels/) | API de contenu hôtelier, de réservation, de cache de prix et de disponibilité ; portefeuille annoncé de 250 000 hôtels. | Adapté à une intégration de distribution complète avec recherche, prix en temps réel et gestion de réservation. | Confirmer contractuellement la couverture réelle Cameroun/Afrique centrale, les conditions commerciales, la devise et les règles d’émission. |
| [RateHawk API](https://www.ratehawk.com/lp/en-us/API/) | Plateforme B2B, tarifs disponibles, réservations, contenu multilingue sur plus de 3,3 M d’hébergements ; accès après inscription, clé API et certification. | Candidat adapté à une première intégration car le parcours d’accès et de certification est documenté publiquement. | Obtenir un compte partenaire, des identifiants de test, puis valider par recherche réelle les villes prioritaires : Douala, Yaoundé, Kribi, Libreville, Brazzaville et N’Djamena. |
| [Travelgate](https://docs.travelgate.com/kb/welcome-to-travelgate/about-us/) | Réseau de connectivité avec API unifiée entre acheteurs et vendeurs ; les fournisseurs exigent un accord commercial propre. | Adapté si 3M souhaite agréger plusieurs fournisseurs à moyen terme. | Plus complexe : signer un contrat avec au moins un fournisseur connecté et prévoir une intégration/certification de niveau entreprise. |
| [Thompsons Africa](https://www.thompsonsafrica.com/b2b-solutions/) | Portail professionnel et intégrations API/XML ; taux, disponibilité et confirmation annoncés en temps réel aux partenaires commerciaux. | Piste régionale pertinente pour l’Afrique, en particulier pour les séjours et circuits africains. | Vérifier le périmètre effectivement distribué en Afrique centrale et l’éligibilité de 3M comme partenaire commercial. |

## Recommandation de cadrage

Pour un premier test, RateHawk est le candidat à examiner en priorité : l’accès API, le processus de certification et le modèle B2B sont explicitement décrits. Hotelbeds constitue une seconde piste forte pour un catalogue de contenu et de réservation plus institutionnel. Travelgate est plus pertinent lorsque 3M dispose déjà de contrats commerciaux avec plusieurs fournisseurs et souhaite les agréger au moyen d’une intégration unique.

La couverture de chaque ville et le tarif final ne peuvent être confirmés qu’après l’obtention des identifiants partenaire et l’exécution de recherches réelles pour des dates déterminées. Aucun fournisseur étudié ne permet, à partir de son site public seul, d’affirmer une couverture exhaustive de tous les hôtels du Cameroun et d’Afrique centrale.

## Solution gratuite de démarrage étudiée

### OpenStreetMap + Overpass API

OpenStreetMap est une base géographique mondiale ouverte. Les établissements peuvent y être référencés avec `tourism=hotel` et, lorsque les contributeurs les ont renseignés, avec des attributs tels que le site web, le téléphone, le nombre d’étoiles, le Wi‑Fi, la piscine ou le parking. L’API Overpass permet d’interroger ces données géographiques par ville ou par pays. Cette combinaison constitue la solution la plus accessible pour démarrer un catalogue Cameroun et Afrique centrale sans contrat fournisseur.

| Élément | Ce que la source peut fournir | Ce qu’elle ne doit pas faire croire |
|---|---|---|
| Catalogue | Nom, géolocalisation, adresse ou contact lorsque renseignés, catégorie et certains équipements. | L’exhaustivité absolue : la qualité dépend des contributeurs et de la couverture locale. |
| Filtres | Piscine, Wi‑Fi ou parking lorsque ces attributs sont cartographiés. | La confirmation contractuelle de ces services pour chaque date. |
| Réservation | URL officielle lorsqu’elle est renseignée ; demande 3M transmise au back-office. | Une réservation ou une disponibilité en temps réel. |
| Tarifs | Aucun tarif fiable à afficher. | Des prix réels ou des devis garantis. |

### Conditions d’utilisation à respecter

Les données OpenStreetMap sont publiées sous licence ODbL : l’interface doit afficher une attribution visible à OpenStreetMap et à ses contributeurs, ainsi qu’un lien vers la licence. Les requêtes Overpass doivent être limitées et mises en cache ; il ne faut pas utiliser une instance publique comme moteur de recherche à haute fréquence ou synchroniser le catalogue à chaque consultation client.

### Recommandation

Démarrer par un import administré et périodique des hôtels `tourism=hotel` pour Douala, Yaoundé, Kribi, Limbe, Libreville, Brazzaville, N’Djamena, Malabo et Bangui. Chaque fiche doit être éditable et recevoir un statut « à vérifier ». Les clients peuvent déposer une demande dans 3M Booking ; l’administrateur ouvre ensuite l’URL officielle ou contacte l’établissement afin de confirmer prix, disponibilité et conditions. Cette solution est gratuite pour le catalogue, mais ne remplace pas une API B2B comme RateHawk pour les tarifs et réservations en direct.
