# Configuration DNS - 3mtravelagency.com vers Manus

## 📋 Informations Actuelles

- **Domaine principal souhaité** : `3mtravelagency.com`
- **Registrar** : LWS (Liquid Web Services)
- **Application hébergée sur** : Manus (3mtravelagency.click)
- **Domaines actuels** : 
  - 3mtravelpre-gebuu8iq.manus.space (auto-généré)
  - www.3mtravelagency.click (principal actuel)
  - 3mtravelagency.click (principal actuel)

---

## 🎯 Objectif

Faire pointer `3mtravelagency.com` vers votre application Manus de manière à ce que :
- ✅ `3mtravelagency.com` soit le domaine principal
- ✅ `www.3mtravelagency.com` redirige vers `3mtravelagency.com`
- ✅ Les utilisateurs accèdent via `.com` au lieu de `.click`

---

## 🔧 Configuration DNS Requise

### Option 1 : Utiliser CNAME (Recommandé - Plus simple)

**Étapes dans le panneau LWS** :

1. **Accédez à votre compte LWS**
   - Allez sur https://www.lws.fr/
   - Connectez-vous à votre compte
   - Allez dans **Gestion des domaines** ou **DNS Management**

2. **Modifiez les enregistrements DNS** :

   **Pour le domaine racine (3mtravelagency.com)** :
   - Type : `CNAME` ou `ALIAS` (selon LWS)
   - Nom : `@` ou laisser vide
   - Valeur : `3mtravelagency.click`
   - TTL : 3600 (ou par défaut)

   **Pour le sous-domaine www** :
   - Type : `CNAME`
   - Nom : `www`
   - Valeur : `3mtravelagency.click`
   - TTL : 3600

3. **Enregistrez les modifications**

---

### Option 2 : Utiliser les Nameservers Manus (Plus complet)

Si vous préférez gérer tous les DNS via Manus :

1. **Dans le panneau LWS** :
   - Allez dans **Gestion des domaines**
   - Sélectionnez `3mtravelagency.com`
   - Changez les **Nameservers** vers les serveurs Manus

2. **Nameservers Manus** (à confirmer avec Manus) :
   ```
   ns1.manus.space
   ns2.manus.space
   ns3.manus.space
   ```

3. **Puis dans Manus** :
   - Allez dans **Settings → Domains**
   - Cliquez sur **Add Custom Domain**
   - Entrez `3mtravelagency.com`
   - Validez et attendez la propagation DNS (24-48h)

---

## 📍 Étapes Détaillées pour LWS

### Accès au Panneau de Contrôle LWS

1. **Connectez-vous** : https://www.lws.fr/login
2. **Allez dans** : Mes services → Domaines
3. **Sélectionnez** : `3mtravelagency.com`
4. **Cliquez sur** : Gérer le domaine → Zone DNS

### Modification des Enregistrements DNS

**Écran Zone DNS LWS** :

```
┌─────────────────────────────────────────────────────────┐
│ Zone DNS - 3mtravelagency.com                           │
├─────────────────────────────────────────────────────────┤
│ Enregistrements actuels :                               │
│                                                         │
│ Nom    | Type | Valeur                                  │
│ ────────────────────────────────────────────────────    │
│ @      | A    | [Adresse IP LWS]                       │
│ www    | CNAME| 3mtravelagency.com                     │
│                                                         │
│ ➕ Ajouter un enregistrement                            │
└─────────────────────────────────────────────────────────┘
```

**À faire** :

1. **Supprimez ou modifiez** l'enregistrement `A` pointant vers LWS
2. **Créez/modifiez** :
   - Enregistrement `@` (racine) → `CNAME` → `3mtravelagency.click`
   - Enregistrement `www` → `CNAME` → `3mtravelagency.click`

---

## ⚙️ Configuration dans Manus

### Ajouter le domaine personnalisé

1. **Dans votre projet Manus** :
   - Allez dans **Settings** (⚙️)
   - Sélectionnez **Domains**
   - Cliquez sur **Add Custom Domain**

2. **Entrez** : `3mtravelagency.com`

3. **Validez** et attendez la vérification DNS

4. **Manus vous fournira** :
   - Les enregistrements DNS à configurer (si nécessaire)
   - Un statut de vérification

---

## 🔍 Vérification de la Configuration

### Vérifier les enregistrements DNS

**Utilisez l'une de ces commandes** (terminal/cmd) :

```bash
# Vérifier les enregistrements CNAME
nslookup 3mtravelagency.com
nslookup www.3mtravelagency.com

# Ou avec dig (Linux/Mac)
dig 3mtravelagency.com CNAME
dig www.3mtravelagency.com CNAME

# Ou en ligne
# https://mxtoolbox.com/
# https://www.nslookup.io/
```

**Résultat attendu** :
```
3mtravelagency.com.    3600    IN    CNAME    3mtravelagency.click.
www.3mtravelagency.com. 3600   IN    CNAME    3mtravelagency.click.
```

---

## ⏱️ Temps de Propagation

- **Propagation DNS** : 24-48 heures (parfois plus)
- **Vérification LWS** : Immédiate après sauvegarde
- **Vérification Manus** : Peut prendre quelques minutes

### Pendant la propagation

- Certains utilisateurs verront l'ancien contenu
- Certains verront le nouveau contenu
- Après 48h, tout le monde verra le nouveau contenu

---

## 🆘 Dépannage

### Le domaine ne fonctionne pas après 48h

1. **Vérifiez les enregistrements DNS** :
   ```bash
   nslookup 3mtravelagency.com
   ```

2. **Vérifiez dans LWS** :
   - Les enregistrements sont bien sauvegardés
   - Les valeurs sont correctes (pas d'espace, pas de typo)

3. **Vérifiez dans Manus** :
   - Le domaine est bien ajouté dans Settings → Domains
   - Le statut est "Verified" ou "Active"

4. **Videz le cache DNS** :
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemctl restart nscd
   ```

### Le domaine redirige vers une page d'erreur

- Vérifiez que Manus a bien reconnu le domaine
- Attendez la propagation complète (48h)
- Contactez le support Manus si le problème persiste

---

## 📞 Support

**Si vous rencontrez des problèmes** :

1. **Support LWS** : https://www.lws.fr/support
2. **Support Manus** : https://help.manus.im
3. **Vérification DNS** : https://www.nslookup.io/

---

## ✅ Checklist de Configuration

- [ ] Domaine `3mtravelagency.com` acheté chez LWS
- [ ] Accès au panneau de contrôle LWS confirmé
- [ ] Enregistrement DNS `@` modifié en `CNAME` → `3mtravelagency.click`
- [ ] Enregistrement DNS `www` modifié en `CNAME` → `3mtravelagency.click`
- [ ] Domaine ajouté dans Manus (Settings → Domains)
- [ ] Vérification DNS effectuée (nslookup ou en ligne)
- [ ] Propagation DNS attendue (24-48h)
- [ ] Test d'accès via `3mtravelagency.com` réussi

---

## 📝 Notes Importantes

1. **CNAME vs A Record** :
   - Utilisez `CNAME` pour pointer vers `3mtravelagency.click`
   - N'utilisez `A` que si vous avez une adresse IP fixe

2. **Redirection vs Alias** :
   - `CNAME` = Alias DNS (recommandé)
   - Redirection HTTP = Redirection de page (moins recommandé)

3. **Certificat SSL** :
   - Manus gère automatiquement le certificat SSL
   - Pas besoin de configuration supplémentaire

4. **Email** :
   - Si vous utilisez l'email avec `3mtravelagency.com`, configurez les enregistrements MX
   - Consultez le support LWS pour cela

---

**Dernière mise à jour** : 2 août 2026
**Configuration pour** : 3M Travel Agency
