# Diagnostic du blocage production

Le site `https://www.3mtravelagency.com/` a été ouvert le 13 août 2026 à 22:28 GMT. La page reste effectivement sur l’écran « 3M Travel & Services — Chargement de la page… », sans élément interactif visible. La console de production consultée immédiatement ne renvoie aucune erreur exploitable.

Le contenu et l’apparence de cet écran ne correspondent pas au `PageLoadingFallback.tsx` actuel avec compte à rebours. Cela indique probablement qu’un ancien bundle ou un écran de bootstrap antérieur reste servi/caché en production, ou qu’une erreur survient avant l’initialisation de l’application React. Le correctif doit donc couvrir le bootstrap initial et pas seulement les routes `React.lazy`.

## Inspection du navigateur

Le navigateur indique `document.readyState = complete` et charge le module principal `/assets/index-B-VzcgiM.js` ainsi que les vendors React, Radix, data, PDF, motion, icônes et formulaires. Malgré cela, `#root` conserve exactement le HTML statique `boot-fallback`, sans erreur console visible. Le problème se situe donc avant le montage React ou dans l’initialisation du module principal, et le fallback HTML n’a actuellement aucun délai ni bouton de récupération.

## Reproduction après la version 32def9b5

Le 13 août 2026, ouverture de `https://www.3mtravelagency.com/?probe=1786661920` : le HTML reçu contient bien `BOOT_TIMEOUT_MS = 15000` et `3m_boot_timeout_reload_attempted`. Pendant les 15 premières secondes, l’écran reste volontairement identique au loader simple, car l’archive fournie ne contient pas de compte à rebours visuel. Après expiration, le script autonome s’exécute bien et affiche « Le chargement rencontre un problème persistant », avec « Réessayer » et le lien WhatsApp. Le problème n’est donc pas le cache HTML : le module React ne remplace pas le fallback et échoue à démarrer, ce qui nécessite maintenant l’inspection des ressources et de l’erreur de bootstrap.

## Inspection complémentaire

Après une attente supérieure à 15 secondes sur `www.3mtravelagency.com`, le filet de sécurité affiche correctement l’écran « Le chargement rencontre un problème persistant » avec les actions « Réessayer » et WhatsApp. Le HTML et le script autonome sont donc bien servis et exécutés. Le navigateur charge `/assets/index-6IE05yMO.js` et les vendors, mais `#root` reste le fallback : la cause restante est l’échec ou le blocage du démarrage du bundle principal React, pas l’absence du mécanisme HTML.

## Cause confirmée et correction

L’évaluation directe du bundle public a reproduit l’erreur suivante : `TypeError: Cannot read properties of undefined (reading 'forwardRef')` dans `radix-vendor-OfaGa3fY.js`, lors de `createSlot`. Le découpage Vite séparait React et Radix dans deux chunks initialisés avec une dépendance circulaire ; Radix pouvait donc s’évaluer avant que l’espace de noms React soit initialisé.

Correction appliquée dans `vite.config.ts` : React, React DOM, scheduler et les paquets `@radix-ui` sont désormais regroupés dans `react-ui-vendor`. Le build produit bien ce chunk unifié. TypeScript et la suite complète passent : 46 fichiers de test, 142 tests réussis et 4 ignorés.

## Vérification après ea7e04cc

La production a été ouverte avec `?deploy=ea7e04cc`. Le loader HTML apparaît pendant le démarrage ; le contrôle du bundle public doit maintenant confirmer que le nouveau `react-ui-vendor` est bien servi et que l’erreur `forwardRef` a disparu après évaluation du module.

La version ea7e04cc reste bloquée sur le domaine public : après plus de 15 secondes, le bootstrap HTML affiche son écran persistant de récupération. Cela signifie que le regroupement React/Radix n’a pas suffi à supprimer toutes les erreurs d’évaluation du bundle ; une nouvelle exception de module doit être capturée directement sur la version publiée.

## Décalage de publication confirmé

Après la publication annoncée `ea7e04cc`, le navigateur public reçoit encore `/assets/index-6IE05yMO.js` et `/assets/radix-vendor-OfaGa3fY.js`, puis reproduit exactement `forwardRef undefined`. Le build local corrigé produit pourtant `index-CP6CVA6z.js` et `react-ui-vendor-7L85cNF2.js`. Le code correctif n’est donc pas encore celui réellement servi par le domaine ; le problème actuel est un déploiement/publication non propagé, et non le seul cache du navigateur.

## Contrôle du bundle 6g99

Après la publication 7c9e6154, les domaines publics servent désormais `/assets/index-6g99Fi9J.js`, qui référence `react-ui-vendor-BdfaWPKb.js` et ne référence plus `radix-vendor`. Le navigateur a été ouvert avec `?verify=7c9e6154`; le fallback était encore visible à environ 7 secondes, avant l’expiration complète du délai autonome. Une observation supplémentaire est nécessaire pour distinguer un temps de chargement normal d’une nouvelle erreur d’évaluation.

## Seconde cause confirmée après regroupement

Le nouveau bundle `index-6g99Fi9J.js` référence bien `react-ui-vendor-BdfaWPKb.js`, mais l’évaluation échoue encore avec `TypeError: Cannot set properties of undefined (setting 'Activity')` dans `react-ui-vendor`, appelé depuis `vendor-4V6XU30T.js`. Le regroupement manuel React/Radix a supprimé l’erreur `forwardRef`, mais force toujours une initialisation circulaire de React 19/React DOM. Le correctif final doit retirer le regroupement manuel des dépendances React/Radix et laisser Rollup résoudre leur ordre d’initialisation naturel.

## Publication 851f3485 non propagée au départ

À 23:18 UTC, le domaine public contient bien le marker HTML `react-ui-vendor-fix-2026-08-13`, mais sert encore `index-6g99Fi9J.js`, le build de l’étape précédente qui référence `react-ui-vendor`. Le bundle local sans manual chunk produit `index-D-zS0723.js` et un `vendor-CKDcPjFK.js` unifié. Le checkpoint 851f3485 n’était donc pas encore reflété par les assets publics ; un nouveau marker unique est nécessaire pour forcer une publication vérifiable.

## Validation publique finale

Après la publication `7c6b44d5`, les trois domaines publics servent le nouveau bundle principal `index-DJkXq_JR.js`. L’inspection du bundle ne trouve plus `react-ui-vendor` ni `radix-vendor`. Le navigateur public a ensuite monté React avec succès : le DOM contient la navigation, le hero, la recherche de vols, Aureol, les formulaires et les boutons flottants ; la page n’est plus bloquée sur le loader. Le marker HTML reste temporairement celui de l’étape précédente côté CDN, mais le script principal effectivement exécuté est bien le nouveau bundle sans manual chunk.
