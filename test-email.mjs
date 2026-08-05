import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}

const resend = new Resend(resendApiKey);

async function testEmail() {
  try {
    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "3mtravelandservices@gmail.com",
      subject: "🌍 Test d'évaluation Luxembourg - 3M Travel & Services",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color:#0a2540;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 24px; border-radius: 10px 10px 0 0; text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">🌍 Test d'Évaluation Luxembourg</h1>
            <p style="color:#e5e7ff;margin:6px 0 0;">3M Travel & Services SARL</p>
          </div>
          <div style="padding:24px;border:1px solid #eee;border-top:none;">
            <p>Bonjour,</p>
            <p>Ceci est un email de test pour vérifier que la configuration Resend fonctionne correctement.</p>
            <div style="background:#f4f6f8;border-left:4px solid #667eea;padding:14px;border-radius:6px;">
              <p style="margin:0;"><strong>✅ Configuration Resend restaurée avec succès !</strong></p>
              <p style="margin:8px 0 0;">Adresse d'envoi : onboarding@resend.dev</p>
            </div>
            <p style="margin-top:24px;">Merci de tester ce système.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
            <p style="font-size:12px;color:#666;text-align:center;">
              3M Travel & Services SARL<br/>
              +237 698 104 832 | www.3mtravelagency.click
            </p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      console.error("❌ Erreur Resend:", result.error);
      process.exit(1);
    }

    console.log("✅ Email envoyé avec succès !");
    console.log("ID:", result.data?.id);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

testEmail();
