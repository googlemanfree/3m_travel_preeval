#!/usr/bin/env node

/**
 * Script de monitoring des Core Web Vitals
 * 
 * Récupère les Core Web Vitals depuis PageSpeed Insights
 * et génère un rapport avec alertes
 * 
 * Usage:
 *   node scripts/monitor-core-web-vitals.mjs
 *   node scripts/monitor-core-web-vitals.mjs --url https://example.com
 *   node scripts/monitor-core-web-vitals.mjs --report
 */

import https from 'https';
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
 * Récupérer les Core Web Vitals depuis PageSpeed Insights
 */
function getPageSpeedInsights(url) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.PAGESPEED_API_KEY || 'AIzaSyDyWlEKcZM5-nKxOgJcSBzWTrBKzKJTp0w';
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}`;

    https.get(apiUrl, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Analyser les Core Web Vitals
 */
function analyzeMetrics(data) {
  const metrics = data.lighthouseResult?.audits || {};

  const cwv = {
    lcp: {
      name: 'Largest Contentful Paint',
      value: metrics['largest-contentful-paint']?.numericValue,
      target: 2500,
      unit: 'ms',
    },
    fid: {
      name: 'First Input Delay',
      value: metrics['first-input-delay']?.numericValue,
      target: 100,
      unit: 'ms',
    },
    cls: {
      name: 'Cumulative Layout Shift',
      value: metrics['cumulative-layout-shift']?.numericValue,
      target: 0.1,
      unit: '',
    },
    fcp: {
      name: 'First Contentful Paint',
      value: metrics['first-contentful-paint']?.numericValue,
      target: 1800,
      unit: 'ms',
    },
    ttfb: {
      name: 'Time to First Byte',
      value: metrics['server-response-time']?.numericValue,
      target: 600,
      unit: 'ms',
    },
  };

  return cwv;
}

/**
 * Évaluer la métrique
 */
function evaluateMetric(metric) {
  if (!metric.value) return 'unknown';
  if (metric.value <= metric.target * 0.75) return 'good';
  if (metric.value <= metric.target) return 'needs-improvement';
  return 'poor';
}

/**
 * Obtenir la couleur pour la métrique
 */
function getMetricColor(status) {
  switch (status) {
    case 'good':
      return 'green';
    case 'needs-improvement':
      return 'yellow';
    case 'poor':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Obtenir l'emoji pour la métrique
 */
function getMetricEmoji(status) {
  switch (status) {
    case 'good':
      return '✅';
    case 'needs-improvement':
      return '⚠️ ';
    case 'poor':
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Afficher les Core Web Vitals
 */
function displayMetrics(metrics, url) {
  log('\n📊 Core Web Vitals Report', 'cyan');
  log('================================\n', 'cyan');

  log(`URL: ${url}`, 'blue');
  log(`Date: ${new Date().toISOString()}\n`, 'gray');

  Object.entries(metrics).forEach(([key, metric]) => {
    const status = evaluateMetric(metric);
    const color = getMetricColor(status);
    const emoji = getMetricEmoji(status);

    const value = metric.value ? metric.value.toFixed(2) : 'N/A';
    const display = `${emoji} ${metric.name.padEnd(30)} ${value.padStart(10)} ${metric.unit}`;

    log(display, color);

    if (metric.value) {
      const percentage = Math.round((metric.value / metric.target) * 100);
      const bar = '█'.repeat(Math.round(percentage / 10)) + '░'.repeat(10 - Math.round(percentage / 10));
      log(`   [${bar}] ${percentage}% of target (${metric.target}${metric.unit})`, 'gray');
    }
  });

  log('\n', 'reset');
}

/**
 * Générer un rapport JSON
 */
function generateReport(metrics, url) {
  const report = {
    timestamp: new Date().toISOString(),
    url,
    metrics: {},
    summary: {
      good: 0,
      needsImprovement: 0,
      poor: 0,
    },
  };

  Object.entries(metrics).forEach(([key, metric]) => {
    const status = evaluateMetric(metric);
    report.metrics[key] = {
      name: metric.name,
      value: metric.value,
      target: metric.target,
      unit: metric.unit,
      status,
      percentageOfTarget: metric.value ? Math.round((metric.value / metric.target) * 100) : null,
    };

    report.summary[status]++;
  });

  return report;
}

/**
 * Générer des recommandations
 */
function generateRecommendations(metrics) {
  const recommendations = [];

  Object.entries(metrics).forEach(([key, metric]) => {
    const status = evaluateMetric(metric);

    if (status === 'poor') {
      switch (key) {
        case 'lcp':
          recommendations.push({
            priority: 'CRITICAL',
            title: 'Optimiser LCP (Largest Contentful Paint)',
            description: 'LCP > 2.5s affecte le score de performance',
            actions: [
              'Optimiser les images (WebP, compression)',
              'Implémenter le lazy loading',
              'Réduire la taille du bundle JavaScript',
              'Précharger les ressources critiques',
            ],
          });
          break;
        case 'fid':
          recommendations.push({
            priority: 'CRITICAL',
            title: 'Optimiser FID (First Input Delay)',
            description: 'FID > 100ms affecte l\'interactivité',
            actions: [
              'Réduire le JavaScript bloquant',
              'Implémenter le code splitting',
              'Utiliser Web Workers',
              'Optimiser les tâches longues',
            ],
          });
          break;
        case 'cls':
          recommendations.push({
            priority: 'HIGH',
            title: 'Réduire CLS (Cumulative Layout Shift)',
            description: 'CLS > 0.1 affecte la stabilité visuelle',
            actions: [
              'Ajouter les dimensions aux images',
              'Éviter les insertions de contenu sans réserve',
              'Utiliser transform au lieu de propriétés de layout',
              'Précharger les polices',
            ],
          });
          break;
      }
    }
  });

  return recommendations;
}

/**
 * Main
 */
async function main() {
  log('\n🔍 Monitoring Core Web Vitals', 'cyan');
  log('================================\n', 'cyan');

  try {
    // Déterminer l'URL
    const urlIndex = process.argv.indexOf('--url');
    const url = urlIndex !== -1 ? process.argv[urlIndex + 1] : 'https://3mtravelagency.click';

    log(`Récupération des données pour: ${url}...`, 'blue');

    // Récupérer les données
    const data = await getPageSpeedInsights(url);

    // Analyser les métriques
    const metrics = analyzeMetrics(data);

    // Afficher les résultats
    displayMetrics(metrics, url);

    // Générer un rapport
    const report = generateReport(metrics, url);

    // Générer des recommandations
    const recommendations = generateRecommendations(metrics);

    if (recommendations.length > 0) {
      log('💡 Recommandations:', 'cyan');
      log('================================\n', 'cyan');

      recommendations.forEach((rec, index) => {
        const color = rec.priority === 'CRITICAL' ? 'red' : 'yellow';
        log(`${index + 1}. [${rec.priority}] ${rec.title}`, color);
        log(`   ${rec.description}`, 'gray');
        log(`   Actions:`, 'gray');
        rec.actions.forEach(action => {
          log(`   • ${action}`, 'gray');
        });
        log('', 'reset');
      });
    }

    // Sauvegarder le rapport
    if (process.argv.includes('--report')) {
      const reportPath = path.join(__dirname, `../cwv-report-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      log(`✓ Rapport sauvegardé: ${reportPath}`, 'green');
    }

    // Résumé
    log('\n📊 Résumé', 'cyan');
    log('================================\n', 'cyan');
    log(`Bon: ${report.summary.good}`, 'green');
    log(`À améliorer: ${report.summary.needsImprovement}`, 'yellow');
    log(`Mauvais: ${report.summary.poor}`, 'red');

    // Déterminer le statut global
    if (report.summary.poor > 0) {
      log('\n❌ Statut: CRITIQUE', 'red');
      process.exit(1);
    } else if (report.summary.needsImprovement > 0) {
      log('\n⚠️  Statut: À AMÉLIORER', 'yellow');
    } else {
      log('\n✅ Statut: BON', 'green');
    }

    log('\n', 'reset');

  } catch (error) {
    log(`\n❌ Erreur: ${error.message}\n`, 'red');
    process.exit(1);
  }
}

main();
