/**
 * Email Templates Service - 3M Travel & Services
 * Generates VIP evaluation report emails with Resend integration
 */

export interface EvaluationEmailData {
  fullName: string;
  email: string;
  destination: string;
  score: number;
  status: string;
  strategy: string;
  strategyDescription: string;
  requiredDocuments: string[];
  folderId: string;
  pricingFormulas: {
    opening: number;
    formula1: number;
    formula2: number;
    formula3: number;
  };
  recommendation: string;
  nextSteps: string[];
}

export function generateVIPEvaluationEmail(data: EvaluationEmailData): string {
  const statusColor = data.score >= 80 ? '#10b981' : data.score >= 60 ? '#f59e0b' : '#ef4444';
  const statusLabel = data.score >= 80 ? 'Hautement Éligible' : data.score >= 60 ? 'Éligible Conditionnel' : 'Nécessite Support';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; color: #0b192c; line-height: 1.6; }
          .container { max-width: 650px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
          .header h2 { margin: 0; font-size: 24px; font-weight: bold; }
          .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.95; }
          .content { padding: 30px; background-color: #ffffff; }
          .section { margin: 25px 0; }
          .section-title { font-size: 16px; font-weight: bold; color: #0066cc; margin-bottom: 12px; display: flex; align-items: center; }
          .score-box { background: linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}08 100%); border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0; border-radius: 6px; }
          .score-value { font-size: 48px; font-weight: bold; color: ${statusColor}; }
          .score-label { font-size: 14px; color: #666; margin-top: 5px; }
          .document-list { list-style: none; padding: 0; }
          .document-list li { padding: 10px 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; }
          .document-list li:last-child { border-bottom: none; }
          .document-list li:before { content: "✓"; color: #10b981; font-weight: bold; margin-right: 10px; font-size: 16px; }
          .pricing-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .pricing-table td { padding: 12px; border: 1px solid #e0e0e0; }
          .pricing-table td:first-child { font-weight: bold; color: #0066cc; }
          .pricing-table td:last-child { text-align: right; font-weight: bold; color: #0b192c; }
          .cta-button { display: inline-block; background-color: #0066cc; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 20px 0; text-align: center; }
          .cta-button:hover { background-color: #0052a3; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #666; border-top: 1px solid #e0e0e0; }
          .footer p { margin: 5px 0; }
          .highlight { background-color: #fff9e6; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .alert { background-color: #f0f4f8; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h2>3M Travel & Services SARL</h2>
            <p>Rapport Officiel d'Ingénierie Consulaire</p>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Bonjour <strong>${data.fullName}</strong>,</p>
            <p>Votre CV a été analysé par notre département d'orientation pour votre projet vers <strong>${data.destination}</strong>. Voici votre bilan complet :</p>

            <!-- Score Section -->
            <div class="score-box">
              <div class="score-value">${data.score}/100</div>
              <div class="score-label">${statusLabel} — ${data.status}</div>
            </div>

            <!-- Admissibility Analysis -->
            <div class="section">
              <div class="section-title">📊 1. BILAN D'ADMISSIBILITÉ (${data.destination})</div>
              <p><strong>Score Global :</strong> ${data.score}/100</p>
              <p><strong>Diagnostic :</strong> ${data.strategyDescription}</p>
              <div class="alert">
                <strong>Analyse Technique :</strong> Votre profil a été évalué selon les critères consulaires stricts de ${data.destination}. Basé sur votre expérience, vos qualifications et votre secteur d'activité, nous avons déterminé votre score d'éligibilité.
              </div>
            </div>

            <!-- Strategy Section -->
            <div class="section">
              <div class="section-title">🚀 2. STRATÉGIE RETENUE & PASSERELLE</div>
              <p><strong>Voie Recommandée :</strong> ${data.strategy}</p>
              <p><strong>Atouts :</strong> Contrat garanti, conformité des pièces, garantie d'accès Espace Schengen.</p>
              <div class="highlight">
                <strong>Recommandation :</strong> ${data.recommendation}
              </div>
            </div>

            <!-- Documents Section -->
            <div class="section">
              <div class="section-title">🛠️ 3. PLAN D'ACTION & PIÈCES À LÉGALISER (MINREX)</div>
              <ul class="document-list">
                ${data.requiredDocuments.map(doc => `<li>${doc}</li>`).join('')}
              </ul>
            </div>

            <!-- Pricing Section -->
            <div class="section">
              <div class="section-title">💳 4. GRILLE FINANCIÈRE & FORMULES DISPONIBLES</div>
              <table class="pricing-table">
                <tr>
                  <td>Frais d'ouverture de dossier</td>
                  <td>${(data.pricingFormulas.opening / 1000).toFixed(0)} 000 FCFA</td>
                </tr>
                <tr>
                  <td>Formule 1 (Paiement Complet)</td>
                  <td>${(data.pricingFormulas.formula1 / 1000000).toFixed(1)}M FCFA</td>
                </tr>
                <tr>
                  <td>Formule 2 (Par Tranches +15%)</td>
                  <td>${(data.pricingFormulas.formula2 / 1000000).toFixed(2)}M FCFA</td>
                </tr>
                <tr>
                  <td>Formule 3 (Paiement au Visa +25%)</td>
                  <td>${(data.pricingFormulas.formula3 / 1000000).toFixed(2)}M FCFA</td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">
                <strong>Numéro de Dossier :</strong> ${data.folderId}
              </p>
            </div>

            <!-- Next Steps -->
            <div class="section">
              <div class="section-title">📋 5. PROCHAINES ÉTAPES</div>
              <ol style="padding-left: 20px;">
                ${data.nextSteps.map(step => `<li style="margin: 8px 0;">${step}</li>`).join('')}
              </ol>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="https://3mtravelagency.click/mon-espace?dossier=${data.folderId}" class="cta-button">
                👉 Valider mon Ouverture de Dossier (${(data.pricingFormulas.opening / 1000).toFixed(0)} 000 FCFA)
              </a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Avez-vous des questions ? Notre équipe est disponible 24/7 via WhatsApp pour vous accompagner dans votre démarche.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>3M Travel & Services SARL</strong></p>
            <p>📍 Agence physique : Biyem-Assi (Montée Chapelle Obili) - Yaoundé, Cameroun</p>
            <p>📞 Assistance WhatsApp : +1 672 897 2999 / +237 620 996 045</p>
            <p>📧 Email : support@3mtravelagency.click</p>
            <p style="margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
              © 2026 3M Travel & Services SARL. Tous droits réservés.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEvaluationEmail(data: EvaluationEmailData, resendApiKey: string): Promise<boolean> {
  try {
    const htmlContent = generateVIPEvaluationEmail(data);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'support@3mtravelagency.click',
        to: data.email,
        subject: `🎯 Bilan d'Admissibilité Consulaire pour ${data.destination} — ${data.fullName} (Matricule N° ${data.folderId})`,
        html: htmlContent,
        reply_to: 'support@3mtravelagency.click',
      }),
    });

    if (!response.ok) {
      console.error('[Email] Resend error:', await response.text());
      return false;
    }

    console.log(`[Email] Évaluation envoyée à ${data.email} (Dossier: ${data.folderId})`);
    return true;
  } catch (error) {
    console.error('[Email] Erreur lors de l\'envoi:', error);
    return false;
  }
}
