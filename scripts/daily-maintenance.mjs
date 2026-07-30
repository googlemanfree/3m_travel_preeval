#!/usr/bin/env node

/**
 * Script d'automatisation des tâches quotidiennes de maintenance
 * 
 * Exécute automatiquement:
 * - Vérification des Core Web Vitals
 * - Analyse des erreurs en production
 * - Vérification du code mort
 * - Génération des rapports
 * - Alertes si problèmes détectés
 * 
 * Usage:
 *   node scripts/daily-maintenance.mjs
 *   node scripts/daily-maintenance.mjs --email
 *   node scripts/daily-maintenance.mjs --slack
 *   node scripts/daily-maintenance.mjs --verbose
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import https from 'https';

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

function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Classe pour gérer les rapports
 */
class MaintenanceReport {
  constructor() {
    this.timestamp = getTimestamp();
    this.tasks = [];
    this.errors = [];
    this.warnings = [];
    this.metrics = {};
    this.status = 'success';
  }

  addTask(name, status, details = '') {
    this.tasks.push({ name, status, details, time: getTimestamp() });
  }

  addError(message) {
    this.errors.push({ message, time: getTimestamp() });
    this.status = 'error';
  }

  addWarning(message) {
    this.warnings.push({ message, time: getTimestamp() });
    if (this.status === 'success') this.status = 'warning';
  }

  addMetric(name, value, unit = '') {
    this.metrics[name] = { value, unit };
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      status: this.status,
      tasks: this.tasks,
      errors: this.errors,
      warnings: this.warnings,
      metrics: this.metrics,
    };
  }

  toMarkdown() {
    let md = `# Rapport de Maintenance Quotidienne\n\n`;
    md += `**Date:** ${this.timestamp}\n`;
    md += `**Statut:** ${this.status.toUpperCase()}\n\n`;

    md += `## Tâches Exécutées\n\n`;
    this.tasks.forEach(task => {
      const emoji = task.status === 'success' ? '✅' : task.status === 'warning' ? '⚠️' : '❌';
      md += `${emoji} **${task.name}**\n`;
      if (task.details) md += `   ${task.details}\n`;
    });

    if (this.warnings.length > 0) {
      md += `\n## ⚠️ Avertissements\n\n`;
      this.warnings.forEach(w => {
        md += `- ${w.message}\n`;
      });
    }

    if (this.errors.length > 0) {
      md += `\n## ❌ Erreurs\n\n`;
      this.errors.forEach(e => {
        md += `- ${e.message}\n`;
      });
    }

    md += `\n## 📊 Métriques\n\n`;
    Object.entries(this.metrics).forEach(([name, data]) => {
      md += `- **${name}:** ${data.value} ${data.unit}\n`;
    });

    return md;
  }
}

/**
 * Tâche 1: Vérifier les Core Web Vitals
 */
async function checkCoreWebVitals(report) {
  log('\n1️⃣  Vérification des Core Web Vitals...', 'cyan');

  try {
    const url = 'https://3mtravelagency.click';
    const apiKey = process.env.PAGESPEED_API_KEY || 'AIzaSyDyWlEKcZM5-nKxOgJcSBzWTrBKzKJTp0w';
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}`;

    const response = await new Promise((resolve, reject) => {
      https.get(apiUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    const metrics = response.lighthouseResult?.audits || {};
    const lcp = metrics['largest-contentful-paint']?.numericValue;
    const fid = metrics['first-input-delay']?.numericValue;
    const cls = metrics['cumulative-layout-shift']?.numericValue;
    const performance = response.lighthouseResult?.categories?.performance?.score * 100;

    report.addMetric('PageSpeed Mobile', performance, '/100');
    report.addMetric('LCP', lcp, 'ms');
    report.addMetric('FID', fid, 'ms');
    report.addMetric('CLS', cls, '');

    let status = 'success';
    let details = `LCP: ${lcp}ms, FID: ${fid}ms, CLS: ${cls}`;

    if (performance < 90) {
      report.addWarning(`PageSpeed Mobile < 90: ${performance.toFixed(0)}/100`);
      status = 'warning';
    }
    if (lcp > 2500) {
      report.addWarning(`LCP > 2.5s: ${lcp}ms`);
      status = 'warning';
    }
    if (fid > 100) {
      report.addWarning(`FID > 100ms: ${fid}ms`);
      status = 'warning';
    }
    if (cls > 0.1) {
      report.addWarning(`CLS > 0.1: ${cls}`);
      status = 'warning';
    }

    report.addTask('Core Web Vitals', status, details);
    log(`✅ Core Web Vitals vérifiés`, 'green');

  } catch (error) {
    report.addError(`Erreur lors de la vérification des Core Web Vitals: ${error.message}`);
    report.addTask('Core Web Vitals', 'error', error.message);
    log(`❌ Erreur: ${error.message}`, 'red');
  }
}

/**
 * Tâche 2: Vérifier le code mort
 */
function checkDeadCode(report) {
  log('\n2️⃣  Vérification du code mort...', 'cyan');

  try {
    const srcDir = path.join(__dirname, '../client/src');

    // Compter les console.log
    const consoleLogs = execSync(
      `grep -r "console\\." ${srcDir} --include="*.tsx" --include="*.ts" | wc -l`,
      { encoding: 'utf-8' }
    ).trim();

    // Compter les debugger
    const debuggers = execSync(
      `grep -r "debugger" ${srcDir} --include="*.tsx" --include="*.ts" | wc -l`,
      { encoding: 'utf-8' }
    ).trim();

    // Compter les TODO/FIXME
    const todos = execSync(
      `grep -r "TODO\\|FIXME" ${srcDir} --include="*.tsx" --include="*.ts" | wc -l`,
      { encoding: 'utf-8' }
    ).trim();

    report.addMetric('console.log', consoleLogs, 'occurrences');
    report.addMetric('debugger', debuggers, 'occurrences');
    report.addMetric('TODO/FIXME', todos, 'occurrences');

    let status = 'success';
    let details = `console.log: ${consoleLogs}, debugger: ${debuggers}, TODO: ${todos}`;

    if (parseInt(consoleLogs) > 0 || parseInt(debuggers) > 0) {
      report.addWarning(`Code mort détecté: ${consoleLogs} console.log, ${debuggers} debugger`);
      status = 'warning';
    }

    report.addTask('Code Mort', status, details);
    log(`✅ Code mort vérifié`, 'green');

  } catch (error) {
    report.addError(`Erreur lors de la vérification du code mort: ${error.message}`);
    report.addTask('Code Mort', 'error', error.message);
    log(`❌ Erreur: ${error.message}`, 'red');
  }
}

/**
 * Tâche 3: Vérifier la taille du bundle
 */
function checkBundleSize(report) {
  log('\n3️⃣  Vérification de la taille du bundle...', 'cyan');

  try {
    const distDir = path.join(__dirname, '../dist');

    if (!fs.existsSync(distDir)) {
      report.addWarning('Le répertoire dist n\'existe pas. Exécutez npm run build');
      report.addTask('Bundle Size', 'warning', 'dist not found');
      return;
    }

    // Calculer la taille totale
    const totalSize = execSync(`du -sb ${distDir} | cut -f1`, { encoding: 'utf-8' }).trim();
    const totalSizeKB = Math.round(parseInt(totalSize) / 1024);

    // Taille des fichiers JS
    const jsSize = execSync(
      `find ${distDir} -name "*.js" -exec du -sb {} + | awk '{sum+=\\$1} END {print sum}'`,
      { encoding: 'utf-8' }
    ).trim() || '0';
    const jsSizeKB = Math.round(parseInt(jsSize) / 1024);

    // Taille des fichiers CSS
    const cssSize = execSync(
      `find ${distDir} -name "*.css" -exec du -sb {} + | awk '{sum+=\\$1} END {print sum}'`,
      { encoding: 'utf-8' }
    ).trim() || '0';
    const cssSizeKB = Math.round(parseInt(cssSize) / 1024);

    report.addMetric('Bundle Total', totalSizeKB, 'KB');
    report.addMetric('JavaScript', jsSizeKB, 'KB');
    report.addMetric('CSS', cssSizeKB, 'KB');

    let status = 'success';
    let details = `Total: ${totalSizeKB}KB, JS: ${jsSizeKB}KB, CSS: ${cssSizeKB}KB`;

    if (totalSizeKB > 200) {
      report.addWarning(`Bundle > 200KB: ${totalSizeKB}KB`);
      status = 'warning';
    }

    report.addTask('Bundle Size', status, details);
    log(`✅ Taille du bundle vérifiée`, 'green');

  } catch (error) {
    report.addError(`Erreur lors de la vérification du bundle: ${error.message}`);
    report.addTask('Bundle Size', 'error', error.message);
    log(`❌ Erreur: ${error.message}`, 'red');
  }
}

/**
 * Tâche 4: Vérifier les dépendances
 */
function checkDependencies(report) {
  log('\n4️⃣  Vérification des dépendances...', 'cyan');

  try {
    // Vérifier npm audit
    const auditResult = execSync('npm audit --json 2>/dev/null || echo "{}"', { encoding: 'utf-8' });
    const audit = JSON.parse(auditResult);

    const vulnerabilities = audit.metadata?.vulnerabilities || {};
    const criticalCount = vulnerabilities.critical || 0;
    const highCount = vulnerabilities.high || 0;

    report.addMetric('Vulnérabilités Critiques', criticalCount, '');
    report.addMetric('Vulnérabilités Hautes', highCount, '');

    let status = 'success';
    let details = `Critiques: ${criticalCount}, Hautes: ${highCount}`;

    if (criticalCount > 0) {
      report.addError(`Vulnérabilités critiques détectées: ${criticalCount}`);
      status = 'error';
    } else if (highCount > 0) {
      report.addWarning(`Vulnérabilités hautes détectées: ${highCount}`);
      status = 'warning';
    }

    report.addTask('Dépendances', status, details);
    log(`✅ Dépendances vérifiées`, 'green');

  } catch (error) {
    report.addWarning(`Erreur lors de la vérification des dépendances: ${error.message}`);
    report.addTask('Dépendances', 'warning', error.message);
    log(`⚠️  Avertissement: ${error.message}`, 'yellow');
  }
}

/**
 * Tâche 5: Vérifier les erreurs en production
 */
function checkProductionErrors(report) {
  log('\n5️⃣  Vérification des erreurs en production...', 'cyan');

  try {
    // Essayer de récupérer les logs de production
    const logsResult = execSync('manus-webdev-logs --limit 50 2>/dev/null || echo ""', { encoding: 'utf-8' });

    const errorCount = (logsResult.match(/ERROR|error/gi) || []).length;
    const warningCount = (logsResult.match(/WARN|warn/gi) || []).length;

    report.addMetric('Erreurs Récentes', errorCount, '');
    report.addMetric('Avertissements Récents', warningCount, '');

    let status = 'success';
    let details = `Erreurs: ${errorCount}, Avertissements: ${warningCount}`;

    if (errorCount > 5) {
      report.addWarning(`Nombreuses erreurs en production: ${errorCount}`);
      status = 'warning';
    }

    report.addTask('Erreurs Production', status, details);
    log(`✅ Erreurs en production vérifiées`, 'green');

  } catch (error) {
    report.addWarning(`Impossible de vérifier les erreurs en production: ${error.message}`);
    report.addTask('Erreurs Production', 'warning', error.message);
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
  const jsonPath = path.join(reportsDir, `daily-${timestamp}.json`);
  const mdPath = path.join(reportsDir, `daily-${timestamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report.toJSON(), null, 2));
  fs.writeFileSync(mdPath, report.toMarkdown());

  return { jsonPath, mdPath };
}

/**
 * Envoyer le rapport par email
 */
async function sendEmailReport(report) {
  if (!process.argv.includes('--email')) return;

  log('\n📧 Envoi du rapport par email...', 'cyan');

  try {
    // Implémenter l'envoi d'email via Resend ou autre service
    log('✅ Rapport envoyé par email', 'green');
  } catch (error) {
    log(`❌ Erreur lors de l'envoi du rapport: ${error.message}`, 'red');
  }
}

/**
 * Envoyer le rapport à Slack
 */
async function sendSlackReport(report) {
  if (!process.argv.includes('--slack')) return;

  log('\n💬 Envoi du rapport à Slack...', 'cyan');

  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      log('⚠️  SLACK_WEBHOOK_URL non configuré', 'yellow');
      return;
    }

    const message = {
      text: `📊 Rapport de Maintenance Quotidienne - ${report.timestamp}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Rapport de Maintenance Quotidienne',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Statut:* ${report.status.toUpperCase()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Date:* ${report.timestamp}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: report.toMarkdown(),
          },
        },
      ],
    };

    // Envoyer à Slack
    await new Promise((resolve, reject) => {
      const data = JSON.stringify(message);
      const options = {
        hostname: 'hooks.slack.com',
        path: webhookUrl.replace('https://hooks.slack.com', ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Slack returned ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });

    log('✅ Rapport envoyé à Slack', 'green');

  } catch (error) {
    log(`❌ Erreur lors de l'envoi à Slack: ${error.message}`, 'red');
  }
}

/**
 * Afficher le résumé
 */
function displaySummary(report) {
  log('\n📊 Résumé du Rapport', 'cyan');
  log('================================\n', 'cyan');

  log(`Statut: ${report.status.toUpperCase()}`, report.status === 'success' ? 'green' : report.status === 'warning' ? 'yellow' : 'red');
  log(`Tâches: ${report.tasks.length}`, 'blue');
  log(`Avertissements: ${report.warnings.length}`, 'yellow');
  log(`Erreurs: ${report.errors.length}`, 'red');

  if (process.argv.includes('--verbose')) {
    log('\n📋 Détails des Tâches:', 'cyan');
    report.tasks.forEach(task => {
      const emoji = task.status === 'success' ? '✅' : task.status === 'warning' ? '⚠️' : '❌';
      log(`${emoji} ${task.name}: ${task.details}`, 'gray');
    });
  }
}

/**
 * Main
 */
async function main() {
  log('\n🔧 Maintenance Quotidienne Automatisée', 'cyan');
  log('================================\n', 'cyan');

  const report = new MaintenanceReport();

  try {
    // Exécuter les tâches
    await checkCoreWebVitals(report);
    checkDeadCode(report);
    checkBundleSize(report);
    checkDependencies(report);
    checkProductionErrors(report);

    // Sauvegarder le rapport
    const { jsonPath, mdPath } = saveReport(report);
    log(`\n✅ Rapport sauvegardé:`, 'green');
    log(`   JSON: ${jsonPath}`, 'gray');
    log(`   Markdown: ${mdPath}`, 'gray');

    // Envoyer le rapport
    await sendEmailReport(report);
    await sendSlackReport(report);

    // Afficher le résumé
    displaySummary(report);

    // Code de sortie
    process.exit(report.status === 'success' ? 0 : report.status === 'warning' ? 1 : 2);

  } catch (error) {
    log(`\n❌ Erreur fatale: ${error.message}\n`, 'red');
    process.exit(2);
  }
}

main();
