/**
 * Templates d'email pour les administrateurs
 */

export interface AdminEmailTemplateParams {
  adminName: string;
  adminEmail: string;
  adminType: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Template pour notification de changement de mot de passe réussi
 */
export function getPasswordChangedEmailTemplate(params: AdminEmailTemplateParams): {
  subject: string;
  html: string;
} {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Douala',
  }).format(params.timestamp);

  return {
    subject: '🔒 Votre mot de passe a été modifié avec succès',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .success-box {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            color: #155724;
          }
          .success-box strong {
            display: block;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .info-section {
            background-color: #f8f9fa;
            border-left: 4px solid #0066cc;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-section h3 {
            margin-top: 0;
            color: #0066cc;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .info-item {
            margin: 8px 0;
            font-size: 14px;
          }
          .info-label {
            font-weight: 600;
            color: #333;
          }
          .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .warning-box strong {
            display: block;
            margin-bottom: 8px;
          }
          .warning-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .warning-box li {
            margin: 5px 0;
            font-size: 14px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
          }
          .footer p {
            margin: 5px 0;
          }
          .button {
            display: inline-block;
            background-color: #0066cc;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            margin: 15px 0;
            font-weight: 600;
          }
          .button:hover {
            background-color: #004499;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>🔒 Mot de passe modifié</h1>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Bonjour <strong>${params.adminName}</strong>,</p>

            <p>Nous vous confirmons que votre mot de passe administrateur a été modifié avec succès.</p>

            <!-- Success Box -->
            <div class="success-box">
              <strong>✓ Changement de mot de passe réussi</strong>
              Votre nouveau mot de passe est maintenant actif et vous pouvez l'utiliser pour vous connecter.
            </div>

            <!-- Détails du changement -->
            <div class="info-section">
              <h3>Détails du changement</h3>
              <div class="info-item">
                <span class="info-label">Email :</span> ${params.adminEmail}
              </div>
              <div class="info-item">
                <span class="info-label">Type d'administrateur :</span> ${params.adminType}
              </div>
              <div class="info-item">
                <span class="info-label">Date et heure :</span> ${formattedDate}
              </div>
              ${params.ipAddress ? `
              <div class="info-item">
                <span class="info-label">Adresse IP :</span> ${params.ipAddress}
              </div>
              ` : ''}
            </div>

            <!-- Recommandations de sécurité -->
            <div class="warning-box">
              <strong>🔐 Recommandations de sécurité</strong>
              <ul>
                <li>Ne partagez jamais votre mot de passe avec quiconque</li>
                <li>Utilisez un mot de passe unique et complexe</li>
                <li>Changez régulièrement votre mot de passe (tous les 90 jours)</li>
                <li>Si vous n'avez pas effectué ce changement, <strong>contactez immédiatement l'équipe support</strong></li>
              </ul>
            </div>

            <!-- Action recommandée -->
            <p style="text-align: center;">
              <a href="https://www.3mtravelagency.click/admin-login" class="button">
                Accéder au tableau de bord administrateur
              </a>
            </p>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Si vous avez des questions ou besoin d'assistance, n'hésitez pas à nous contacter.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>3M Travel Agency</strong></p>
            <p>Yaoundé, Biyem-Assi | Cameroun</p>
            <p>Email : hello@3mtravelagency.click</p>
            <p style="margin-top: 15px; color: #999;">
              Cet email a été envoyé automatiquement. Veuillez ne pas répondre à ce message.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

/**
 * Template pour alerte de tentative de changement de mot de passe échouée
 */
/**
 * Template pour email de réinitialisation de mot de passe
 */
export function getPasswordResetEmailTemplate(params: AdminEmailTemplateParams & { resetLink: string; expiresIn: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: '🔑 Réinitialisation de votre mot de passe administrateur',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .alert-box {
            background-color: #fff3e0;
            border: 1px solid #ffe0b2;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            color: #e65100;
          }
          .reset-button {
            display: inline-block;
            background-color: #ff9800;
            color: white;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: 600;
            text-align: center;
          }
          .reset-button:hover {
            background-color: #f57c00;
          }
          .info-section {
            background-color: #f8f9fa;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-section h3 {
            margin-top: 0;
            color: #ff9800;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .warning-box {
            background-color: #ffebee;
            border: 1px solid #ffcdd2;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            color: #c62828;
          }
          .warning-box strong {
            display: block;
            margin-bottom: 8px;
          }
          .warning-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .warning-box li {
            margin: 5px 0;
            font-size: 14px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
          }
          .footer p {
            margin: 5px 0;
          }
          .token-info {
            background-color: #eceff1;
            border-radius: 4px;
            padding: 12px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            color: #455a64;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>🔑 Réinitialisation de mot de passe</h1>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Bonjour <strong>${params.adminName}</strong>,</p>

            <p>Vous avez demandé une réinitialisation de votre mot de passe administrateur. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.</p>

            <!-- Alert Box -->
            <div class="alert-box">
              <strong>⏰ Important :</strong> Ce lien expire dans <strong>${params.expiresIn}</strong>. Agissez rapidement.
            </div>

            <!-- Reset Button -->
            <div style="text-align: center;">
              <a href="${params.resetLink}" class="reset-button">
                Réinitialiser mon mot de passe
              </a>
            </div>

            <!-- Alternative Link -->
            <div class="info-section">
              <h3>Ou copiez ce lien</h3>
              <div class="token-info">${params.resetLink}</div>
            </div>

            <!-- Security Warning -->
            <div class="warning-box">
              <strong>🔒 Sécurité</strong>
              <ul>
                <li>Ne partagez jamais ce lien avec quiconque</li>
                <li>3M Travel Agency ne vous demandera jamais votre mot de passe par email</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Votre compte reste sécurisé jusqu'à ce que vous cliquiez sur le lien</li>
              </ul>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Si vous avez des questions, contactez l'équipe support.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>3M Travel Agency</strong></p>
            <p>Yaoundé, Biyem-Assi | Cameroun</p>
            <p>Email : hello@3mtravelagency.click</p>
            <p style="margin-top: 15px; color: #999;">
              Cet email a été envoyé automatiquement. Veuillez ne pas répondre à ce message.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

/**
 * Template pour email de confirmation de réinitialisation réussie
 */
export function getPasswordResetSuccessEmailTemplate(params: AdminEmailTemplateParams): {
  subject: string;
  html: string;
} {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Douala',
  }).format(params.timestamp);

  return {
    subject: '✓ Votre mot de passe a été réinitialisé avec succès',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .success-box {
            background-color: #e8f5e9;
            border: 1px solid #c8e6c9;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            color: #2e7d32;
          }
          .success-box strong {
            display: block;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .info-section {
            background-color: #f8f9fa;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-section h3 {
            margin-top: 0;
            color: #4caf50;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .info-item {
            margin: 8px 0;
            font-size: 14px;
          }
          .info-label {
            font-weight: 600;
            color: #333;
          }
          .button {
            display: inline-block;
            background-color: #4caf50;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            margin: 15px 0;
            font-weight: 600;
          }
          .button:hover {
            background-color: #388e3c;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Mot de passe réinitialisé</h1>
          </div>

          <div class="content">
            <p>Bonjour <strong>${params.adminName}</strong>,</p>

            <p>Votre mot de passe administrateur a été réinitialisé avec succès.</p>

            <div class="success-box">
              <strong>✓ Réinitialisation réussie</strong>
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </div>

            <div class="info-section">
              <h3>Détails de la réinitialisation</h3>
              <div class="info-item">
                <span class="info-label">Email :</span> ${params.adminEmail}
              </div>
              <div class="info-item">
                <span class="info-label">Date et heure :</span> ${formattedDate}
              </div>
            </div>

            <div style="text-align: center;">
              <a href="https://www.3mtravelagency.click/admin/login" class="button">
                Se connecter maintenant
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Si vous n'avez pas effectué cette réinitialisation, contactez immédiatement l'équipe support.
            </p>
          </div>

          <div class="footer">
            <p><strong>3M Travel Agency</strong></p>
            <p>Cet email a été envoyé automatiquement pour votre sécurité.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export function getPasswordChangeFailedEmailTemplate(params: AdminEmailTemplateParams & { reason: string }): {
  subject: string;
  html: string;
} {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Douala',
  }).format(params.timestamp);

  return {
    subject: '⚠️ Tentative de changement de mot de passe échouée',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .alert-box {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            color: #721c24;
          }
          .alert-box strong {
            display: block;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .info-section {
            background-color: #f8f9fa;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Tentative échouée</h1>
          </div>

          <div class="content">
            <p>Bonjour <strong>${params.adminName}</strong>,</p>

            <p>Une tentative de changement de mot de passe a échoué sur votre compte administrateur.</p>

            <div class="alert-box">
              <strong>Raison :</strong> ${params.reason}
            </div>

            <div class="info-section">
              <p><strong>Détails :</strong></p>
              <p>Email : ${params.adminEmail}</p>
              <p>Date et heure : ${formattedDate}</p>
              ${params.ipAddress ? `<p>Adresse IP : ${params.ipAddress}</p>` : ''}
            </div>

            <p style="color: #dc3545;"><strong>Si ce n'est pas vous qui avez tenté cette action, veuillez contacter immédiatement l'équipe support.</strong></p>
          </div>

          <div class="footer">
            <p><strong>3M Travel Agency</strong></p>
            <p>Cet email a été envoyé automatiquement pour votre sécurité.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}
