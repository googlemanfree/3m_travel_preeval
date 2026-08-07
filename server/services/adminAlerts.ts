/**
 * Admin Alerts Service - Real-time notifications for new evaluations
 * Integrates with WebSocket for instant dashboard updates
 */

export interface AdminAlert {
  id: string;
  type: 'NEW_EVALUATION' | 'PAYMENT_RECEIVED' | 'DOCUMENT_SUBMITTED' | 'VISA_APPROVED';
  title: string;
  message: string;
  candidateName: string;
  destination: string;
  folderId: string;
  score?: number;
  timestamp: Date;
  read: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// In-memory store for active alerts (in production, use Redis or database)
const activeAlerts: Map<string, AdminAlert[]> = new Map();

/**
 * Create a new alert for new evaluation
 */
export function createEvaluationAlert(
  candidateName: string,
  destination: string,
  folderId: string,
  score: number
): AdminAlert {
  const alert: AdminAlert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'NEW_EVALUATION',
    title: '🔔 Nouvelle Évaluation Reçue',
    message: `${candidateName} a soumis une évaluation pour ${destination} (Score: ${score}/100)`,
    candidateName,
    destination,
    folderId,
    score,
    timestamp: new Date(),
    read: false,
    priority: score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW',
  };

  return alert;
}

/**
 * Create a new alert for payment received
 */
export function createPaymentAlert(
  candidateName: string,
  folderId: string,
  amount: number
): AdminAlert {
  const alert: AdminAlert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'PAYMENT_RECEIVED',
    title: '💳 Paiement Reçu',
    message: `${candidateName} a effectué un paiement de ${(amount / 1000).toFixed(0)} 000 FCFA`,
    candidateName,
    destination: '',
    folderId,
    timestamp: new Date(),
    read: false,
    priority: 'HIGH',
  };

  return alert;
}

/**
 * Create a new alert for document submission
 */
export function createDocumentAlert(
  candidateName: string,
  folderId: string,
  documentType: string
): AdminAlert {
  const alert: AdminAlert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'DOCUMENT_SUBMITTED',
    title: '📄 Document Soumis',
    message: `${candidateName} a soumis un ${documentType}`,
    candidateName,
    destination: '',
    folderId,
    timestamp: new Date(),
    read: false,
    priority: 'MEDIUM',
  };

  return alert;
}

/**
 * Store alert and broadcast to all connected admins
 */
export function broadcastAlert(alert: AdminAlert): void {
  // Store in memory
  if (!activeAlerts.has('all')) {
    activeAlerts.set('all', []);
  }
  activeAlerts.get('all')!.unshift(alert);

  // Keep only last 100 alerts
  const alerts = activeAlerts.get('all')!;
  if (alerts.length > 100) {
    alerts.pop();
  }

  console.log(`[Alert] Nouvelle alerte: ${alert.title} - ${alert.message}`);

  // In production, emit WebSocket event to all connected admins
  // io.to('admin-dashboard').emit('new-alert', alert);
}

/**
 * Get all active alerts
 */
export function getActiveAlerts(): AdminAlert[] {
  return activeAlerts.get('all') || [];
}

/**
 * Get unread alerts count
 */
export function getUnreadCount(): number {
  const alerts = activeAlerts.get('all') || [];
  return alerts.filter(a => !a.read).length;
}

/**
 * Mark alert as read
 */
export function markAlertAsRead(alertId: string): boolean {
  const alerts = activeAlerts.get('all') || [];
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.read = true;
    return true;
  }
  return false;
}

/**
 * Mark all alerts as read
 */
export function markAllAlertsAsRead(): void {
  const alerts = activeAlerts.get('all') || [];
  alerts.forEach(a => (a.read = true));
}

/**
 * Clear old alerts (older than 24 hours)
 */
export function clearOldAlerts(): number {
  const alerts = activeAlerts.get('all') || [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const beforeCount = alerts.length;
  const filtered = alerts.filter(a => new Date(a.timestamp) > oneDayAgo);
  activeAlerts.set('all', filtered);

  console.log(`[Alert] Cleared ${beforeCount - filtered.length} old alerts`);
  return beforeCount - filtered.length;
}

/**
 * Get alert statistics
 */
export function getAlertStats() {
  const alerts = activeAlerts.get('all') || [];

  return {
    total: alerts.length,
    unread: alerts.filter(a => !a.read).length,
    highPriority: alerts.filter(a => a.priority === 'HIGH' && !a.read).length,
    byType: {
      NEW_EVALUATION: alerts.filter(a => a.type === 'NEW_EVALUATION').length,
      PAYMENT_RECEIVED: alerts.filter(a => a.type === 'PAYMENT_RECEIVED').length,
      DOCUMENT_SUBMITTED: alerts.filter(a => a.type === 'DOCUMENT_SUBMITTED').length,
      VISA_APPROVED: alerts.filter(a => a.type === 'VISA_APPROVED').length,
    },
  };
}
