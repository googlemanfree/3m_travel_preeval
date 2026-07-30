# 🤖 Guide d'Automatisation de la Maintenance

Guide complet pour automatiser les tâches quotidiennes et hebdomadaires de maintenance du site 3M Travel & Services.

---

## 📋 Vue d'ensemble

Ce guide couvre:
- **Scripts d'automatisation** : Maintenance quotidienne et hebdomadaire
- **Configuration CI/CD** : GitHub Actions et webhooks
- **Monitoring** : Alertes et notifications
- **Rapports** : Génération et distribution

---

## 🚀 Démarrage Rapide

### 1. Exécuter la maintenance quotidienne

```bash
# Vérifier les Core Web Vitals, code mort, bundle size, etc.
node scripts/daily-maintenance.mjs

# Avec rapport détaillé
node scripts/daily-maintenance.mjs --verbose

# Envoyer le rapport par email
node scripts/daily-maintenance.mjs --email

# Envoyer le rapport à Slack
node scripts/daily-maintenance.mjs --slack
```

### 2. Exécuter la maintenance hebdomadaire

```bash
# Analyser CSS/JS, vérifier les dépendances, sécurité
node scripts/weekly-maintenance.mjs

# Avec correction automatique des dépendances
node scripts/weekly-maintenance.mjs --fix

# Générer le rapport
node scripts/weekly-maintenance.mjs --report
```

### 3. Monitorer les Core Web Vitals

```bash
# Vérifier les Core Web Vitals
node scripts/monitor-core-web-vitals.mjs

# Avec URL personnalisée
node scripts/monitor-core-web-vitals.mjs --url https://example.com

# Générer le rapport
node scripts/monitor-core-web-vitals.mjs --report
```

---

## 📅 Scripts Disponibles

### daily-maintenance.mjs

Exécute les tâches quotidiennes de maintenance.

**Tâches:**
1. ✅ Vérifier les Core Web Vitals (LCP, FID, CLS)
2. ✅ Détecter le code mort (console.log, debugger)
3. ✅ Vérifier la taille du bundle
4. ✅ Vérifier les dépendances
5. ✅ Vérifier les erreurs en production

**Résultats:**
- Rapport JSON: `reports/daily-YYYY-MM-DD.json`
- Rapport Markdown: `reports/daily-YYYY-MM-DD.md`
- Alertes si problèmes détectés

**Exemple de rapport:**
```markdown
# Rapport de Maintenance Quotidienne

**Date:** 2026-07-30T09:00:00Z
**Statut:** WARNING

## Tâches Exécutées

✅ **Core Web Vitals**
   LCP: 2400ms, FID: 95ms, CLS: 0.08

⚠️ **Code Mort**
   console.log: 5, debugger: 0, TODO: 3

✅ **Bundle Size**
   Total: 185KB, JS: 120KB, CSS: 35KB

✅ **Dépendances**
   Critiques: 0, Hautes: 0

✅ **Erreurs Production**
   Erreurs: 2, Avertissements: 5

## Avertissements

- LCP > 2.5s: 2400ms
- Code mort détecté: 5 console.log
```

### weekly-maintenance.mjs

Exécute les tâches hebdomadaires de maintenance.

**Tâches:**
1. ✅ Analyser CSS/JavaScript
2. ✅ Analyser le bundle
3. ✅ Vérifier les dépendances
4. ✅ Vérifier la sécurité
5. ✅ Générer les recommandations

**Résultats:**
- Rapport Markdown: `reports/weekly-YYYY-MM-DD.md`
- Recommandations d'optimisation
- Suggestions de correction

### monitor-core-web-vitals.mjs

Monitore les Core Web Vitals en temps réel.

**Métriques:**
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

**Résultats:**
- Rapport JSON: `cwv-report-TIMESTAMP.json`
- Alertes si dépassement des seuils
- Recommandations d'optimisation

---

## 🔄 Automatisation avec Cron

### Configuration Linux/macOS

```bash
# Éditer le crontab
crontab -e

# Ajouter les tâches:

# Maintenance quotidienne à 9h du matin
0 9 * * * cd /home/ubuntu/3m_travel_preeval && node scripts/daily-maintenance.mjs --slack

# Maintenance hebdomadaire le lundi à 9h
0 9 * * 1 cd /home/ubuntu/3m_travel_preeval && node scripts/weekly-maintenance.mjs --slack

# Monitoring Core Web Vitals toutes les 4 heures
0 */4 * * * cd /home/ubuntu/3m_travel_preeval && node scripts/monitor-core-web-vitals.mjs
```

### Configuration Windows (Task Scheduler)

```batch
# Créer une tâche planifiée
schtasks /create /tn "Daily Maintenance" /tr "node C:\path\to\scripts\daily-maintenance.mjs" /sc daily /st 09:00

# Créer une tâche hebdomadaire
schtasks /create /tn "Weekly Maintenance" /tr "node C:\path\to\scripts\weekly-maintenance.mjs" /sc weekly /d MON /st 09:00
```

---

## 🔔 Configuration des Notifications

### Slack

```bash
# 1. Créer un webhook Slack
# https://api.slack.com/messaging/webhooks

# 2. Ajouter la variable d'environnement
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# 3. Exécuter avec l'option --slack
node scripts/daily-maintenance.mjs --slack
```

### Email

```bash
# 1. Configurer les variables d'environnement
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="your-app-password"
export SMTP_FROM="maintenance@3mtravelagency.click"

# 2. Exécuter avec l'option --email
node scripts/daily-maintenance.mjs --email
```

### GitHub Actions (CI/CD)

```yaml
# .github/workflows/daily-maintenance.yml
name: Daily Maintenance

on:
  schedule:
    - cron: '0 9 * * *'  # 9h tous les jours

jobs:
  maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run daily maintenance
        run: node scripts/daily-maintenance.mjs --verbose
      
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: maintenance-reports
          path: reports/
```

---

## 📊 Interprétation des Rapports

### Rapport Quotidien

**Statuts possibles:**
- ✅ **SUCCESS** : Tout va bien
- ⚠️ **WARNING** : Problèmes mineurs à corriger
- ❌ **ERROR** : Problèmes critiques à résoudre

**Métriques clés:**
- **PageSpeed Mobile** : Cible 95+
- **LCP** : Cible < 2.5s
- **FID** : Cible < 100ms
- **CLS** : Cible < 0.1
- **Bundle Size** : Cible < 200KB

### Rapport Hebdomadaire

**Sections:**
1. **Tâches Exécutées** : Résumé des analyses
2. **Métriques** : Statistiques CSS/JS/Bundle
3. **Recommandations** : Actions à prendre

**Priorités des recommandations:**
- 🔴 **CRITICAL** : Corriger immédiatement
- 🟠 **HIGH** : Corriger cette semaine
- 🟡 **MEDIUM** : Corriger ce mois-ci
- 🟢 **LOW** : Corriger ce trimestre

---

## 🔧 Configuration Avancée

### Variables d'Environnement

```bash
# PageSpeed Insights
export PAGESPEED_API_KEY="your-api-key"

# Slack
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."

# Email
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="your-app-password"
export SMTP_FROM="maintenance@example.com"
export SMTP_TO="team@example.com"

# Sentry (error tracking)
export SENTRY_DSN="https://..."

# DataDog (monitoring)
export DATADOG_API_KEY="..."
export DATADOG_APP_KEY="..."
```

### Fichier .env

```bash
# .env
PAGESPEED_API_KEY=your-api-key
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=maintenance@example.com
SMTP_TO=team@example.com
```

### Configuration du Script

```bash
# Créer un fichier config.json
cat > config.json << EOF
{
  "maintenance": {
    "daily": {
      "enabled": true,
      "schedule": "0 9 * * *",
      "notifications": ["slack", "email"]
    },
    "weekly": {
      "enabled": true,
      "schedule": "0 9 * * 1",
      "notifications": ["slack"]
    }
  },
  "thresholds": {
    "pagespeed": 90,
    "lcp": 2500,
    "fid": 100,
    "cls": 0.1,
    "bundleSize": 200000
  }
}
EOF
```

---

## 📈 Exemples d'Utilisation

### Exemple 1: Maintenance quotidienne avec Slack

```bash
#!/bin/bash
# daily-maintenance.sh

cd /home/ubuntu/3m_travel_preeval

# Exécuter la maintenance
node scripts/daily-maintenance.mjs --slack --verbose

# Vérifier le statut
if [ $? -eq 0 ]; then
  echo "✅ Maintenance réussie"
else
  echo "❌ Maintenance échouée"
fi
```

### Exemple 2: Maintenance hebdomadaire avec correction

```bash
#!/bin/bash
# weekly-maintenance.sh

cd /home/ubuntu/3m_travel_preeval

# Exécuter la maintenance
node scripts/weekly-maintenance.mjs --fix

# Commit les changements
git add -A
git commit -m "chore: weekly maintenance and dependency updates"
git push origin main
```

### Exemple 3: Monitoring continu

```bash
#!/bin/bash
# monitor.sh

while true; do
  # Vérifier les Core Web Vitals
  node scripts/monitor-core-web-vitals.mjs
  
  # Attendre 4 heures
  sleep 14400
done
```

---

## 🐛 Dépannage

### Le script ne s'exécute pas

**Cause:** Permissions insuffisantes

**Solution:**
```bash
chmod +x scripts/daily-maintenance.mjs
chmod +x scripts/weekly-maintenance.mjs
chmod +x scripts/monitor-core-web-vitals.mjs
```

### Les notifications ne sont pas envoyées

**Cause:** Variables d'environnement non configurées

**Solution:**
```bash
# Vérifier les variables
echo $SLACK_WEBHOOK_URL
echo $SMTP_HOST

# Ajouter les variables
export SLACK_WEBHOOK_URL="..."
export SMTP_HOST="..."
```

### Le rapport n'est pas généré

**Cause:** Répertoire `reports` n'existe pas

**Solution:**
```bash
mkdir -p reports
chmod 755 reports
```

---

## 📚 Ressources

- [Cron Syntax](https://crontab.guru/)
- [GitHub Actions Scheduling](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)

---

## ✅ Checklist de Configuration

- [ ] Installer les dépendances: `npm install`
- [ ] Configurer les variables d'environnement
- [ ] Tester les scripts manuellement
- [ ] Configurer Slack webhook (optionnel)
- [ ] Configurer SMTP pour email (optionnel)
- [ ] Ajouter les tâches cron
- [ ] Vérifier les permissions des scripts
- [ ] Créer le répertoire `reports`
- [ ] Tester les notifications
- [ ] Documenter la configuration

---

**Dernière mise à jour:** 30 Juillet 2026  
**Auteur:** Manus AI
