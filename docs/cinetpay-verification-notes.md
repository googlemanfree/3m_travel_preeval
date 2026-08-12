# Référence d’intégration CinetPay

La vérification du statut final de paiement doit être effectuée **côté serveur** auprès de CinetPay ; le navigateur et le webhook ne constituent pas une preuve suffisante. Le backend conserve les clés dans les variables d’environnement et ne renvoie au client que les données strictement nécessaires à l’affichage.

La documentation d’intégration indique notamment que le backend initialise le paiement, reçoit le callback, puis vérifie le statut canonique avant de confirmer un paiement. Les clés ne doivent jamais être exposées dans le navigateur.

Sources consultées le 12 août 2026 :

- [CinetPay Seamless Integration](https://github.com/cinetpay/seamlessIntegration)
- [CinetPay Direct API](https://cinetpay.com/products/api-direct)
