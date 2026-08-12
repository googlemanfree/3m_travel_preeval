# Notes d’intégration SearchAPI Google Flights

Source : https://www.searchapi.io/docs/google-flights-api

- Le moteur requis est `google_flights`.
- `departure_id`, `arrival_id` et `outbound_date` sont requis.
- Un aller-retour doit fournir `flight_type=round_trip` et `return_date`.
- Les valeurs prises en charge pour `flight_type` sont `round_trip`, `one_way` et `multi_city`.
- La réponse live de validation du 12 août 2026 pour `NSI → CDG` a confirmé que `currency=XAF` est refusé par SearchAPI avec « Unsupported value `XAF` in currency parameter ».
- La requête avec `currency=EUR` a retourné HTTP 200 et des tarifs numériques en euros. Le serveur convertit ensuite les prix en FCFA à partir de la parité fixe EUR/XAF.
