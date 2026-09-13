# Audit intermédiaire /billets — 2026-09-13

La route de prévisualisation `https://3000-iny5kjmnfoev8tdfi1ei2-47c1dede.us1.manus.computer/billets` répond avec le titre `Billets d'avion & réservation de vols | 3M Travel & Services`. Le rendu desktop montre le hero `3M BOOKING`, la promesse de vérification humaine des tarifs et le bouton de recherche. Le rendu mobile en 390×844 montre un reflow correct du hero, du bouton et du début du formulaire sans débordement horizontal visible.

Le DOM public expose les contrôles Aller simple, Aller-Retour, Multi-destinations, deux champs d’aéroport, dates, voyageurs/classe et le bouton `RECHERCHER LES VOLS`. Les destinations populaires, la FAQ, le bloc de transparence et le bouton WhatsApp sont présents. La page affiche aussi le titre, les métadonnées et le canonical mis à jour.

À vérifier ensuite : validation et recherche Yaoundé–Paris, aller simple, état aucun résultat, erreur API, ouverture détail, demande de réservation et bouton WhatsApp. Aucun envoi réel n’a encore été déclenché à ce stade.

## Interaction navigateur

L’ouverture de l’autocomplétion sur le champ Destination avec `Paris` expose bien `CDG — Paris — Charles de Gaulle · France` et `ORY — Paris — Paris Orly · France`. Le clic par coordonnées n’a pas sélectionné l’option ; le champ reste `Paris`. Une sélection clavier sera tentée ensuite. Le formulaire reste stable et aucune erreur technique brute n’est affichée.

## Validation formulaire

Un clic sur `RECHERCHER LES VOLS` avec le texte `Paris` mais sans sélection d’un aéroport affiche inline `Veuillez sélectionner une destination.` Le système ne lance pas de recherche avec un IATA vide et ne montre pas d’erreur technique brute. L’autocomplétion reste fonctionnelle, mais la sélection clavier n’a pas été retenue par l’outil navigateur dans cette session ; la suite des contrôles s’appuie sur les tests et l’audit du code.

## Recherche aller-retour Yaoundé–Paris

Le raccourci `Paris CDG` renseigne correctement `CDG — Paris`, puis le clic de recherche déclenche l’état `RECHERCHE EN COURS…` et affiche finalement `Vols disponibles (5)`. Les résultats observés comprennent Ethiopian Airlines, Brussels Airlines et Air France, avec horaires, durée, nombre d’escales, bagages et tarifs indicatifs en FCFA. Le tri et le bouton Filtres sont présents, et les compagnies sont calculées depuis les résultats.

Le clic sur `Voir le vol` ouvre une modale accessible avec rôle dialog pour Ethiopian Airlines ET 948, itinéraire NSI→CDG, départ/arrivée, durée, escales, bagages et tarif. L’action `Demander ce vol` est disponible dans la modale.

## Demande réelle de réservation

Après confirmation explicite, le formulaire a été soumis avec `DomFac Sumo`, `+237 698 104 832`, `aureoldonfack@gmail.com`, le vol ET 948 Yaoundé–Paris et un commentaire indiquant qu’aucun billet ni paiement ne devait être émis. Le premier clic a affiché l’état `Envoi en cours…`; après réponse serveur, la modale a affiché `Demande envoyée avec succès` et la référence réelle **3M-FL-MU0DG25Z-C801**. Le message précise que 3M vérifiera la disponibilité et le tarif avant confirmation et propose le contact WhatsApp. Aucun paiement ni émission de billet n’a été déclenché.

## Scénario aller simple

Après fermeture de la confirmation, le mode `Aller simple` masque correctement le champ `Retour` et relance la recherche avec l’état de chargement. La recherche aboutit à `Vols disponibles (7)` pour NSI→CDG, avec tarifs, compagnies, bagages et escales. Le formulaire reste utilisable après le changement de mode.

## Indisponibilité fournisseur simulée

Un override contrôlé de `window.fetch` a été appliqué uniquement aux appels contenant `flights.searchFlights`, puis la date a été corrigée via l’API native du champ date. La page affiche `La recherche est temporairement indisponible`, explique qu’un problème momentané empêche la recherche et propose `Réessayer` ainsi que `Contacter 3M` par WhatsApp. Aucune erreur réseau brute n’est affichée à l’utilisateur. L’override est temporaire et doit être restauré avant les derniers contrôles.

## Aucun résultat simulé

Une réponse tRPC valide avec `outbound: []` et `providerStatus: live_no_results` a été injectée uniquement pour `flights.searchFlights`, puis le bouton `Réessayer` a été cliqué. L’interface affiche `Aucun vol trouvé pour cette recherche`, explique la possibilité d’une recherche personnalisée et propose deux CTA WhatsApp. L’état vide est lisible et ne montre aucune erreur technique.

## Multi-destinations et WhatsApp

Le mode `Multi-destinations` ne lance pas de fausse recherche : il affiche explicitement que les itinéraires sont traités par l’équipe et un CTA `Demander un itinéraire personnalisé`. Le clic réel sur ce CTA a ouvert `api.whatsapp.com` avec le numéro 3M et le texte prérempli « Bonjour 3M Travel & Services, je souhaite organiser un itinéraire multi-destinations. Pouvez-vous m'aider ? ». Aucun message n’a été envoyé.
