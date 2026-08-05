#!/usr/bin/env node

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("❌ RESEND_API_KEY not set");
  process.exit(1);
}

const resend = new Resend(apiKey);

async function checkDomainStatus() {
  console.log("🔍 Vérification du statut du domaine 3mtravelagency.click...\n");

  try {
    // Get list of domains
    const domainsResponse = await resend.domains.list();
    
    if (domainsResponse.error) {
      console.error("❌ Erreur lors de la récupération des domaines:", domainsResponse.error);
      return false;
    }

    const domains = Array.isArray(domainsResponse.data) ? domainsResponse.data : [];
    const domain = domains.find(d => d.name === "3mtravelagency.click");
    
    if (!domain) {
      console.error("❌ Domaine 3mtravelagency.click non trouvé dans Resend");
      console.log("\n📋 Domaines disponibles:");
      domains.forEach(d => {
        console.log(`   - ${d.name} (${d.status})`);
      });
      return false;
    }

    console.log("✅ Domaine trouvé!");
    console.log(`   Nom: ${domain.name}`);
    console.log(`   Statut: ${domain.status}`);
    console.log(`   Créé: ${domain.created_at || 'N/A'}`);
    
    if (domain.status !== "verified") {
      console.log("\n⚠️  Le domaine n'est pas encore vérifié.");
      console.log("   Veuillez ajouter les enregistrements DNS dans votre registrar.");
      return false;
    }

    console.log("\n✅ Domaine vérifié et prêt à l'emploi!");
    return true;
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    return false;
  }
}

async function testEmailSending() {
  console.log("\n📧 Test d'envoi d'email...\n");

  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "delivered@resend.dev",
      subject: "Test Email - 3M Travel Agency",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bienvenue à 3M Travel Agency</h2>
          <p>Cet email de test confirme que votre domaine Resend est correctement configuré.</p>
          <p><strong>Détails:</strong></p>
          <ul>
            <li>Domaine: 3mtravelagency.click</li>
            <li>Adresse d'envoi: hello@3mtravelagency.click</li>
            <li>Destinataire: 3mtravelandservices@gmail.com</li>
            <li>Date: ${new Date().toLocaleString()}</li>
          </ul>
          <p>Si vous recevez cet email, tout fonctionne correctement!</p>
        </div>
      `,
    });

    if (response.error) {
      console.error("❌ Erreur lors de l'envoi:", response.error);
      return false;
    }

    console.log("✅ Email envoyé avec succès!");
    console.log(`   ID: ${response.data?.id}`);
    console.log(`   À: 3mtravelandservices@gmail.com`);
    console.log(`   De: hello@3mtravelagency.click`);
    return true;
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    return false;
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Test de Configuration Resend - 3M Travel Agency");
  console.log("═══════════════════════════════════════════════════════\n");

  const domainOk = await checkDomainStatus();
  
  if (domainOk) {
    const emailOk = await testEmailSending();
    
    if (emailOk) {
      console.log("\n═══════════════════════════════════════════════════════");
      console.log("✅ TOUS LES TESTS RÉUSSIS!");
      console.log("═══════════════════════════════════════════════════════");
      process.exit(0);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("❌ CONFIGURATION INCOMPLÈTE");
  console.log("═══════════════════════════════════════════════════════");
  process.exit(1);
}

main();
