# Audit des chemins — 17 août 2026

## Contrôles visuels effectués

Les routes publiques critiques suivantes ont chargé correctement : `/`, `/evisas`, `/evisa/kenya`, `/evisas/request`, `/login`, `/register`, `/procedures`, `/tourisme`, `/ressources`, `/contact` et `/flights`.

Les routes protégées `/evaluation`, `/mon-espace`, `/mon-dossier` et `/submit-documents` ne sont pas inactives : sans session, elles présentent correctement l’écran d’accès réservé avec les actions de connexion et d’inscription.

La route inexistante `/chemin-inexistant` répond par une page 404. Le composant affichait toutefois des libellés anglais (« Page Not Found », « Go Home ») qui doivent être francisés pour rester cohérents avec le site.

## Suite de l’audit

Le contrôle doit maintenant couvrir les cibles de navigation déclarées dans les composants, les redirections historiques, les appels d’action de formulaires et les entrées administrateur protégées.

## Constats de liens et corrections

Trois liens WhatsApp de démonstration comportaient des numéros non opérationnels dans les composants de secours d’analyse CV, de gestion d’erreur et de réservation de vol. Ils sont remplacés par le contact WhatsApp opérationnel configuré pour l’agence. La page 404 a également été francisée ; son bouton de retour conserve la navigation interne vers l’accueil.

## Routes administrateur

Les routes `/admin`, `/admin/dashboard`, `/admin/dossiers`, `/admin/evaluations`, `/admin/payment-validation` et `/admin/ai-evaluations` affichent toutes un refus d’accès clair en l’absence de session administrative. Elles ne révèlent pas de contenu administratif et proposent une action de connexion ; ce comportement est attendu et ne constitue pas un chemin inactif.

## Validation automatisée

Le nouveau scénario navigateur `e2e/route-health.spec.ts` couvre douze pages publiques, six redirections historiques, quatre routes candidates protégées et le retour de la page 404. Les quatre scénarios ont réussi. La recherche de liens WhatsApp de démonstration ne retourne plus de résultat.

## Incident détecté et corrigé

La suite navigateur complète a révélé un arrêt du poste Client 360° lorsque le service de surcharges e‑Visa répondait un objet vide au lieu d’une liste. La fusion de catalogue appelait alors `filter` sur une valeur non tableau. Le helper `mergeEvisaCatalogue` valide désormais explicitement le type de réponse et utilise une liste vide en repli. Le poste administrateur, ses messages e‑Visa et le reste du catalogue continuent donc à fonctionner même si aucune surcharge administrée n’est disponible.

Après correction, les 17 scénarios Playwright ont réussi, ainsi que les 399 tests Vitest. La compilation de production a transformé les modules mais a été interrompue par le système pendant le rendu des chunks, sous pression mémoire ; TypeScript, les tests unitaires et les tests navigateur restent validés.
