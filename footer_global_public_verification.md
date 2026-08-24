# Vérification publique — footer global

Date : 24 août 2026.

L’URL `https://www.3mtravelagency.com/?release=870aec46&footer-final=1` a chargé une version antérieure du bundle public : elle conserve les anciens blocs « Nous Sommes Officiellement Enregistrés », les informations Douala et les sections détaillées de contact qui précèdent le footer. Cette réponse ne reflète pas le module d’assistance compact ni le footer global présents dans le build local validé.

La cause est une diffusion différée ou un cache d’assets du domaine public. Avant de conclure le contrôle, une nouvelle révision de diffusion doit forcer le chargement du bundle contenant le footer global et la section d’assistance compacte. Aucune route, composant fonctionnel ou donnée n’est supprimé dans cette action de diffusion.

## Vérification après la révision PWA v12

URL contrôlée : `https://www.3mtravelagency.com/?release=b37b3095&footer-global=1`.

Le bundle public affiche désormais le module compact « Préparer votre démarche avec les bonnes informations » avec un lien vers les sources officielles, sans les anciens blocs détaillés de coordonnées. En bas de la page, un seul footer continu présente l’alerte anti-fraude, les liens utiles, Yaoundé (WhatsApp principal et fixe), Ottawa et les informations légales. Les anciennes sections de contact ne sont plus rendues comme des pieds de page distincts.
