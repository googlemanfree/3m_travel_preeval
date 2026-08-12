# Vérification visuelle — correctifs internes v55

Le 12 août 2026, les routes publiques de procédure du Luxembourg et du Canada ont été vérifiées en vue bureau après la correction de l’ordre des routes. Elles affichent leurs pages dédiées attendues. La route `/admin/evaluations` a été vérifiée non authentifiée et renvoie vers l’accès refusé attendu ; `/admin/login` reste accessible.

Le contrôle mobile doit être limité aux routes publiques : l’outil de capture a refusé une route de paiement de test non autorisée, ce qui confirme qu’aucun statut de paiement ne peut être consulté sur un dossier inexistant.

Le badge de niveau qui dépassait de l’en-tête mobile des fiches pays a été corrigé par un retour à la ligne contrôlé. La fiche Canada a été recapturée après le correctif ; les badges, les boutons de conversion et le guide PDF restent entièrement visibles et actionnables.

Les routes publiques `/`, `/procedures`, `/procedures/luxembourg` et `/hotels` ont été capturées sur mobile. Les contenus restent lisibles et les appels à l’action visibles. Un double en-tête observé sur la procédure Luxembourg a été supprimé puis la page a été recapturée avec une seule navigation globale. Un avertissement React relatif à l’attribut `selected` d’une option reste à corriger ; les autres traces de session provenaient du rechargement à chaud après un changement de hooks et ont été isolées pour contrôle après redémarrage.

Après correction des sélecteurs de réservation, les pages `/` et `/hotels` ont été recapturées sur bureau. Les valeurs par défaut des voyageurs et chambres restent visibles, la navigation est intacte et aucun nouveau message de niveau `ERROR` n’a été enregistré dans la console après le redémarrage.
