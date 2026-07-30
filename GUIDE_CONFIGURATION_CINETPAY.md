# 🔧 Guide de Configuration CinetPay

**Projet** : 3M Travel & Services  
**Date** : 30 juillet 2026  
**Statut** : Infrastructure prête, en attente des clés CinetPay

---

## 📋 Résumé

Le système de paiement CinetPay est **complètement implémenté** dans le projet. Il manque uniquement les **identifiants API** pour l'activer.

### Ce qui est déjà fait ✅

- ✅ Route webhook : `POST /api/cinetpay/webhook`
- ✅ Vérification de transaction
- ✅ Mise à jour du statut du dossier
- ✅ Envoi d'email de confirmation
- ✅ Gestion des erreurs
- ✅ Logging complet

### Ce qui manque ⚠️

- ⚠️ `CINETPAY_SITE_ID`
- ⚠️ `CINETPAY_API_KEY`
- ⚠️ `CINETPAY_SECRET_KEY` (optionnel, pour vérification de signature)

---

## 🚀 Étapes de Configuration

### Étape 1 : Obtenir les Clés CinetPay

1. **Connectez-vous** à https://merchant.cinetpay.com/
2. **Allez à** : Paramètres → API Keys
3. **Copiez** :
   - `Site ID` → `CINETPAY_SITE_ID`
   - `API Key` → `CINETPAY_API_KEY`
   - `Secret Key` → `CINETPAY_SECRET_KEY` (optionnel)

### Étape 2 : Configurer les Variables d'Environnement

Ajoutez les clés à votre fichier `.env` ou au système de gestion des secrets Manus :

```env
CINETPAY_SITE_ID=votre_site_id_ici
CINETPAY_API_KEY=votre_api_key_ici
CINETPAY_SECRET_KEY=votre_secret_key_ici
```

### Étape 3 : Configurer le Webhook dans CinetPay

1. **Connectez-vous** à https://merchant.cinetpay.com/
2. **Allez à** : Paramètres → Webhook/Callback
3. **Ajoutez l'URL de callback** :
   ```
   https://www.3mtravelagency.click/api/cinetpay/webhook
   ```
4. **Configurez les événements** :
   - ✅ Payment Success
   - ✅ Payment Failed
   - ✅ Payment Pending

5. **Testez le webhook** (optionnel)

### Étape 4 : Tester le Flux Complet

1. **Ouvrez** : https://www.3mtravelagency.click
2. **Allez à** : Accueil → Évaluer mon profil
3. **Remplissez** le formulaire d'évaluation
4. **Cliquez** : "Ouvrir mon dossier"
5. **Remplissez** le formulaire de dossier
6. **Cliquez** : "Payer maintenant"
7. **Effectuez** le paiement (mode test CinetPay)
8. **Vérifiez** : Statut du dossier = "paye"

---

## 📊 Flux de Paiement

```
Candidat clique "Payer"
    ↓
Reçoit OTP par email
    ↓
Vérifie OTP
    ↓
Redirigé vers CinetPay
    ↓
Effectue paiement (65K XAF)
    ↓
CinetPay envoie webhook
    ↓
Route /api/cinetpay/webhook reçoit notification
    ↓
Vérification de la transaction
    ↓
Statut du dossier = "paye"
    ↓
Email de confirmation envoyé
    ↓
Candidat redirigé vers dashboard
```

---

## 🔐 Sécurité

### Vérification de Signature

Le webhook CinetPay peut être signé avec `CINETPAY_SECRET_KEY`. La signature est vérifiée automatiquement.

**Fichier** : `/server/routers/cinetpayWebhook.ts` (ligne 42-78)

### Whitelist d'IP (Optionnel)

Si CinetPay demande une whitelist d'IP :
- Demandez au support Manus l'IP du serveur
- Ou utilisez `*` pour accepter toutes les IPs (moins sécurisé)

---

## 📝 Fichiers Importants

| Fichier | Rôle |
|---------|------|
| `/server/routers/cinetpayWebhook.ts` | Webhook principal |
| `/server/routers/application.ts` | Création de dossier et paiement |
| `/server/emailService.ts` | Emails de confirmation |
| `/client/src/pages/PaymentSuccess.tsx` | Page de succès |
| `/client/src/pages/PaymentFailed.tsx` | Page d'erreur |

---

## 🧪 Mode Test CinetPay

CinetPay fournit des numéros de test pour les paiements :

### Numéros de Test (MTN)

```
Numéro : +237 650 000 000
PIN : 0000
OTP : 000000
Statut : SUCCESS
```

### Numéros de Test (Orange)

```
Numéro : +237 690 000 000
PIN : 0000
OTP : 000000
Statut : SUCCESS
```

### Numéros de Test (Carte Bancaire)

```
Numéro : 4111 1111 1111 1111
Expiration : 12/25
CVV : 123
Statut : SUCCESS
```

---

## 🐛 Dépannage

### Erreur : "CINETPAY_SITE_ID not configured"

**Solution** : Ajoutez `CINETPAY_SITE_ID` aux variables d'environnement

### Erreur : "Invalid signature"

**Solution** : Vérifiez que `CINETPAY_SECRET_KEY` est correct

### Webhook non reçu

**Vérifications** :
1. Vérifiez l'URL du webhook dans CinetPay
2. Vérifiez que le serveur est accessible publiquement
3. Vérifiez les logs du serveur : `/var/log/app.log`

### Statut du dossier non mis à jour

**Vérifications** :
1. Vérifiez que le webhook a été reçu (logs)
2. Vérifiez que la transaction a le statut "ACCEPTED"
3. Vérifiez que l'email du candidat est correct

---

## 📞 Support

### Contacts CinetPay

- **Site** : https://www.cinetpay.com/
- **Support** : support@cinetpay.com
- **Documentation** : https://docs.cinetpay.com/

### Contacts 3M Travel

- **Email** : support@3mtravelagency.click
- **WhatsApp** : +237 620 996 045

---

## ✅ Checklist de Configuration

- [ ] Obtenir les clés CinetPay
- [ ] Ajouter `CINETPAY_SITE_ID` aux variables d'environnement
- [ ] Ajouter `CINETPAY_API_KEY` aux variables d'environnement
- [ ] Ajouter `CINETPAY_SECRET_KEY` aux variables d'environnement
- [ ] Configurer le webhook dans CinetPay
- [ ] Tester le flux complet en mode test
- [ ] Vérifier les emails de confirmation
- [ ] Vérifier les statuts du dossier
- [ ] Activer le mode production dans CinetPay
- [ ] Tester avec un paiement réel

---

## 📚 Documentation

- **CinetPay API** : https://docs.cinetpay.com/v2/checkout
- **Webhook CinetPay** : https://docs.cinetpay.com/v2/webhook
- **Statuts de Paiement** : https://docs.cinetpay.com/v2/statuses

---

**Document généré le** : 30 juillet 2026  
**Version du projet** : c6ffea0f  
**Statut** : En attente des clés CinetPay
