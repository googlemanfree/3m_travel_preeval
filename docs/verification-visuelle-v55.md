# Vérification visuelle — correctifs internes v55

Le 12 août 2026, les routes publiques de procédure du Luxembourg et du Canada ont été vérifiées en vue bureau après la correction de l’ordre des routes. Elles affichent leurs pages dédiées attendues. La route `/admin/evaluations` a été vérifiée non authentifiée et renvoie vers l’accès refusé attendu ; `/admin/login` reste accessible.

Le contrôle mobile doit être limité aux routes publiques : l’outil de capture a refusé une route de paiement de test non autorisée, ce qui confirme qu’aucun statut de paiement ne peut être consulté sur un dossier inexistant.

Le badge de niveau qui dépassait de l’en-tête mobile des fiches pays a été corrigé par un retour à la ligne contrôlé. La fiche Canada a été recapturée après le correctif ; les badges, les boutons de conversion et le guide PDF restent entièrement visibles et actionnables.
