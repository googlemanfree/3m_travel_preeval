# Audit du catalogue hôtelier — 22 août 2026

Le catalogue hôtelier disponible contient un premier périmètre exploitable par 3M Booking : **83 établissements vérifiés**, dont **82 avec un lien officiel** et **83 avec une provenance enregistrée**. Le routeur de découverte ne propose au public que les fiches marquées `verified`, tout en rappelant que les équipements, tarifs et disponibilités doivent être confirmés par l’agence.

Les neuf villes prioritaires sont déjà importées dans le registre avec le statut `imported` : Douala (140), Yaoundé (201), Kribi (66), Limbe (32), Libreville (47), Brazzaville (145), N'Djamena (53), Malabo (18) et Bangui (10), soit **712 fiches importées**. Les 712 fiches importées ne comportent pas encore de lien officiel ; elles restent donc volontairement hors du périmètre public tant qu’une validation humaine ne les fait pas passer au statut `verified`.

Les intégrations tarifaires restent distinctes du catalogue : aucun connecteur RateHawk n’est configuré. L’accès REST Jinko est désormais configuré à partir de la clé fournie et une recherche non transactionnelle a répondu avec HTTP 200 pour Paris, du 10 au 12 octobre 2026, pour un adulte, en EUR. Le contrôle a retourné un établissement et ses offres ; aucune réservation, création de voyage, paiement, annulation ni webhook n’a été exécuté.
