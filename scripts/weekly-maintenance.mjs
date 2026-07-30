#!/usr/bin/env node

/**
 * Script de maintenance hebdomadaire
 * 
 * Exécute automatiquement:
 * - Analyse complète CSS/JS
 * - Vérification des dépendances
 * - Génération des rapports
 * - Recommandations d'optimisation
 * 
 * Usage:
 *   node scripts/weekly-maintenance.mjs
 *   node scripts/weekly-maintenance.mjs --fix
 *   node scripts/weekly-maintenance.mjs --report
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Classe pour gérer les rapports hebdomadaires
 */
class WeeklyReport {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.week = this.getWeekNumber();
    this.tasks = [];
    this.recommendations = [];
    this.metrics = {};
  }

  getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek) + 1;
  }

  addTask(name, status, details) {
    this.tasks.push({ name, status, details });
  }

  addRecommendation(priority, title, description, actions) {
    this.recommendations.push({ priority, title, description, actions });
  }

  addMetric(name, value, unit) {
    this.metrics[name] = { value, unit };
  }

  toMarkdown() {
    let md = `# Rapport Hebdomadaire - Semaine ${this.week}\n\n`;
    md += `**Date:** ${this.timestamp}\n\n`;

    md += `## 📊 Tâches Exécutées\n\n`;
    this.tasks.forEach(task => {
      const emoji = task.status === 'success' ? '✅' : task.status === 'warning' ? '⚠️' : '❌';
      md += `${emoji} **${task.name}**\n`;
      md += `   ${task.details}\n\n`;
    });

    md += `## 📈 Métriques\n\n`;
    Object.entries(this.metrics).forEach(([name, data]) => {
      md += `- **${name}:** ${data.value} ${data.unit}\n`;
    });

    if (this.recommendations.length > 0) {
      md += `\n## 💡 Recommandations\n\n`;
      this.recommendations.forEach(rec => {
        md += `### [${rec.priority}] ${rec.title}\n`;
        md += `${rec.description}\n\n`;
        md += `**Actions:**\n`;
        rec.actions.forEach(action => {
          md += `- ${action}\n`;
        });
        md += '\n';
      });
    }

    return md;
  }
}

/**
 * Tâche 1: Analyser CSS/JS
 */
function analyzeCSSJS(report) {
  log('\n1️⃣  Analyse CSS/JavaScript...', 'cyan');

  try {
    const result = execSync('node scripts/optimize-css-js.mjs --report 2>/dev/null || echo "{}"', {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
    });

    const data = JSON.parse(result);

    report.addMetric('CSS Total', (data.css?.totalSize / 1024).toFixed(2), 'KB');
    report.addMetric('JS Total', (data.javascript?.totalSize / 1024).toFixed(2), 'KB');
    report.addMetric('CSS Rules', data.css?.totalRules, '');
    report.addMetric('JS Functions', data.javascript?.totalFunctions, '');

    report.addTask('Analyse CSS/JS', 'success', 
      `CSS: ${(data.css?.totalSize / 1024).toFixed(2)}KB, JS: ${(data.javascript?.totalSize / 1024).toFixed(2)}KB`);

    log('✅ Analyse CSS/JS terminée', 'green');

  } catch (error) {
    report.addTask('Analyse CSS/JS', 'error', error.message);
    log(`❌ Erreur: ${error.message}`, 'red');
  }
}

/**
 * Tâche 2: Analyser le bundle
 */
function analyzeBundle(report) {
  log('\n2️⃣  Analyse du bundle...', 'cyan');

  try {
    const result = execSync('node scripts/analyze-bundle.mjs 2>/dev/null || echo "{}"', {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
    });

    report.addTask('Analyse Bundle', 'success', 'Bundle analysé');
    log('✅ Analyse du bundle terminée', 'green');

  } catch (error) {
    report.addTask('Analyse Bundle', 'warning', error.message);
    log(`⚠️  Avertissement: ${error.message}`, 'yellow');
  }
}

/**
 * Tâche 3: Vérifier les dépendances
 */
function checkDependencies(report) {
  log('\n3️⃣  Vérification des dépendances...', 'cyan');

  try {
    // Lister les dépendances obsolètes
    const outdated = execSync('npm outdated --json 2>/dev/null || echo "{}"', {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
    });

    const data = JSON.parse(outdated);
    const outdatedCount = Object.keys(data).length;

    report.addMetric('Dépendances Obsolètes', outdatedCount, '');

    if (outdatedCount > 0) {
      report.addTask('Dépendances', 'warning', `${outdatedCount} dépendances obsolètes`);
      
      if (process.argv.includes('--fix')) {
        log('   Mise à jour des dépendances...', 'cyan');
        execSync('npm update', { cwd: path.join(__dirname, '..') });
        log('   ✅ Dépendances mises à jour', 'green');
      }
    } else {
      report.addTask('Dépendances', 'success', 'Toutes les dépendances sont à jour');
    }

    log('✅ Vérification des dépendances terminée', 'green');

  } catch (error) {
    report.addTask('Dépendances', 'error', error.message);
    log(`❌ Erreur: ${error.message}`, 'red');
  }
}

/**
 * Tâche 4: Vérifier la sécurité
 */
function checkSecurity(report) {
  log('\n4️⃣  Vérification de la sécurité...', 'cyan');

  try {
    const audit = execSync('npm audit --json 2>/dev/null || echo "{}"', {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..'),
    });

    const data = JSON.parse(audit);
    const vulnerabilities = data.metadata?.vulnerabilities || {};
    const critical = vulnerabilities.critical || 0;
    const high = vulnerabilities.high || 0;

    report.addMetric('Vulnérabilités Critiques', critical, '');
    report.addMetric('Vulnérabilités Hautes', high, '');

    let status = 'success';
    if (critical > 0) {
      status = 'error';
      report.addRecommendation('CRITICAL', 'Vulnérabilités Critiques Détectées',
        `${critical} vulnérabilités critiques nécessitent une attention immédiate`,
        ['Exécuter: npm audit fix', 'Tester l\'application', 'Déployer les correctifs']);
    } else if (high > 0) {
      status = 'warning';
      report.addRecommendation('HIGH', 'Vulnérabilités Hautes Détectées',
        `${high} vulnérabilités hautes doivent être corrigées`,
        ['Exécuter: npm audit fix', 'Planifier les correctifs']);
    }

    report.addTask('Sécurité', status, `Critiques: ${critical}, Hautes: ${high}`);
    log('✅ Vérification de la sécurité terminée', 'green');

  } catch (error) {
    report.addTask('Sécurité', 'warning', error.message);
    log(`⚠️  Avertissement: ${error.message}`, 'yellow');
  }
}

/**
 * Tâche 5: Générer les recommandations
 */
function generateRecommendations(report) {
  log('\n5️⃣  Génération des recommandations...', 'cyan');

  try {
    // Vérifier le code mort
    const srcDir = path.join(__dirname, '../client/src');
    const consoleLogs = execSync(
      `grep -r "console\\." ${srcDir} --include="*.tsx" --include="*.ts" | wc -l`,
      { encoding: 'utf-8' }
    ).trim();

    if (parseInt(consoleLogs) > 0) {
      report.addRecommendation('MEDIUM', 'Supprimer le Code Mort',
        `${consoleLogs} occurrences de console.log détectées`,
        [
          'Exécuter: grep -r "console." client/src',
          'Supprimer les console.log inutiles',
          'Vérifier les logs de débogage',
        ]);
    }

    // Vérifier la taille du bundle
    const distDir = path.join(__dirname, '../dist');
    if (fs.existsSync(distDir)) {
      const bundleSize = execSync(`du -sb ${distDir} | cut -f1`, { encoding: 'utf-8' }).trim();
      const bundleSizeKB = Math.round(parseInt(bundleSize) / 1024);

      if (bundleSizeKB > 200) {
        report.addRecommendation('HIGH', 'Optimiser la Taille du Bundle',
          `Bundle > 200KB: ${bundleSizeKB}KB`,
          [
            'Implémenter le code splitting par route',
            'Analyser les dépendances volumineuses',
            'Utiliser le tree-shaking',
          ]);
      }
    }

    report.addTask('Recommandations', 'success', `${report.recommendations.length} recommandations générées`);
    log('✅ Recommandations générées', 'green');

  } catch (error) {
    report.addTask('Recommandations', 'warning', error.message);
    log(`⚠️  Avertissement: ${error.message}`, 'yellow');
  }
}

/**
 * Sauvegarder le rapport
 */
function saveReport(report) {
  const reportsDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const mdPath = path.join(reportsDir, `weekly-${timestamp}.md`);

  fs.writeFileSync(mdPath, report.toMarkdown());

  return mdPath;
}

/**
 * Main
 */
function main() {
  log('\n📅 Maintenance Hebdomadaire', 'cyan');
  log('================================\n', 'cyan');

  const report = new WeeklyReport();

  try {
    // Exécuter les tâches
    analyzeCSSJS(report);
    analyzeBundle(report);
    checkDependencies(report);
    checkSecurity(report);
    generateRecommendations(report);

    // Sauvegarder le rapport
    const reportPath = saveReport(report);
    log(`\n✅ Rapport sauvegardé: ${reportPath}`, 'green');

    // Afficher le résumé
    log('\n📊 Résumé', 'cyan');
    log('================================\n', 'cyan');
    log(`Tâches: ${report.tasks.length}`, 'blue');
    log(`Recommandations: ${report.recommendations.length}`, 'yellow');

    Object.entries(report.metrics).forEach(([name, data]) => {
      log(`${name}: ${data.value} ${data.unit}`, 'gray');
    });

    log('\n✅ Maintenance hebdomadaire terminée!\n', 'green');

  } catch (error) {
    log(`\n❌ Erreur: ${error.message}\n`, 'red');
    process.exit(1);
  }
}

main();
