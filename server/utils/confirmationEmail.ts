/**
 * Template email simple pour la confirmation de soumission
 */

export interface ConfirmationEmailParams {
  fullName: string;
  dossierCode: string;
  projectType: string;
}

function esc(v: string | undefined | null): string { return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

export function getConfirmationEmailHTML(params: ConfirmationEmailParams): string {
  const projectTypeLabel = {
    travail: "Visa Travail",
    etudes: "Visa Études",
    tourisme: "Visa Tourisme",
  }[params.projectType] || params.projectType;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #0a2540 0%, #0066cc 100%); color: white; padding: 20px; border-radius: 4px; text-align: center; }
    .content { background: white; padding: 20px; margin-top: 20px; border-radius: 4px; }
    .dossier-box { background: #f0f7ff; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; }
    .dossier-code { font-size: 20px; font-weight: bold; color: #0a2540; font-family: monospace; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Dossier Enregistré</h1>
      <p>3M Travel & Services</p>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${esc(params.fullName)}</strong>,</p>

      <p>Merci d'avoir soumis votre demande d'évaluation. Votre dossier a été enregistré avec succès.</p>

      <div class="dossier-box">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase;">Numéro de dossier</p>
        <div class="dossier-code">${esc(params.dossierCode)}</div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">Conservez ce numéro pour vos communications.</p>
      </div>

      <p><strong>Type de projet :</strong> ${esc(projectTypeLabel)}</p>
      
      <h3>Prochaines étapes :</h3>
      <ol>
        <li>Notre équipe analysera votre dossier dans les 24-48 heures</li>
        <li>Vous recevrez un bilan d'admissibilité détaillé par email</li>
        <li>Nous vous contacterons pour fixer un rendez-vous</li>
      </ol>
      
      <p style="background: #f0f7ff; padding: 10px; border-radius: 4px; font-size: 14px;">
        <strong>Besoin d'aide ?</strong><br>
        📧 Email : hello@3mtravelagency.com<br>
        💬 WhatsApp : +237 698 104 832
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} 3M Travel & Services - Votre mobilité, notre expertise</p>
      <p>RC/YAO/2019/A/2567 | NIU : M112417203369H | Yaoundé, Biyem-Assi</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getConfirmationEmailText(params: ConfirmationEmailParams): string {
  const projectTypeLabel = {
    travail: "Visa Travail",
    etudes: "Visa Études",
    tourisme: "Visa Tourisme",
  }[params.projectType] || params.projectType;

  return `
Bonjour ${params.fullName},

Merci d'avoir soumis votre demande d'évaluation. Votre dossier a été enregistré avec succès.

NUMÉRO DE DOSSIER : ${params.dossierCode}

Type de projet : ${projectTypeLabel}

PROCHAINES ÉTAPES :
1. Notre équipe analysera votre dossier dans les 24-48 heures
2. Vous recevrez un bilan d'admissibilité détaillé par email
3. Nous vous contacterons pour fixer un rendez-vous

BESOIN D'AIDE ?
📧 Email : hello@3mtravelagency.com
💬 WhatsApp : +237 698 104 832

---
© ${new Date().getFullYear()} 3M Travel & Services - Votre mobilité, notre expertise
RC/YAO/2019/A/2567 | NIU : M112417203369H | Yaoundé, Biyem-Assi
  `.trim();
}
