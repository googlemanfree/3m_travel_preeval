import { useEffect } from "react";

export default function Hotels() {
  useEffect(() => {
    // Script pour gérer les catégories et la soumission du formulaire
    const root = document.getElementById("hotel-booking-widget");
    if (!root) return;

    const categories = root.querySelectorAll(".hbw-cat-btn");
    let selectedCategory = "Standard";

    categories.forEach((btn) => {
      btn.addEventListener("click", function () {
        categories.forEach((b) => b.classList.remove("active"));
        (btn as HTMLElement).classList.add("active");
        selectedCategory = (btn as HTMLElement).getAttribute("data-value") || "Standard";
      });
    });

    function formatDate(value: string) {
      if (!value) return "";
      const parts = value.split("-");
      return parts[2] + "/" + parts[1] + "/" + parts[0];
    }

    const form = document.getElementById("hbw-form") as HTMLFormElement;
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();

        const fields = {
          destination: document.getElementById("hbw-destination") as HTMLInputElement,
          checkin: document.getElementById("hbw-checkin") as HTMLInputElement,
          checkout: document.getElementById("hbw-checkout") as HTMLInputElement,
          name: document.getElementById("hbw-name") as HTMLInputElement,
          phone: document.getElementById("hbw-phone") as HTMLInputElement,
        };

        let valid = true;
        Object.keys(fields).forEach((key) => {
          const field = fields[key as keyof typeof fields];
          const wrapper = field.closest(".hbw-field");
          if (!field.value.trim()) {
            wrapper?.classList.add("hbw-invalid");
            valid = false;
          } else {
            wrapper?.classList.remove("hbw-invalid");
          }
        });

        if (!valid) return;

        const destination = fields.destination.value.trim();
        const checkin = formatDate(fields.checkin.value);
        const checkout = formatDate(fields.checkout.value);
        const guests = (document.getElementById("hbw-guests") as HTMLSelectElement).value;
        const rooms = (document.getElementById("hbw-rooms") as HTMLSelectElement).value;
        const budget = (document.getElementById("hbw-budget") as HTMLInputElement).value.trim();
        const motif = (document.getElementById("hbw-motif") as HTMLSelectElement).value;
        const name = fields.name.value.trim();
        const phone = fields.phone.value.trim();
        const requests = (document.getElementById("hbw-requests") as HTMLTextAreaElement).value.trim();

        const message =
          "Bonjour 3M Travel & Services ! 🏨\n" +
          "Je souhaite une réservation d'hôtel :\n\n" +
          "📍 Destination : " +
          destination +
          "\n📅 Arrivée : " +
          checkin +
          "\n📅 Départ : " +
          checkout +
          "\n👥 Voyageurs : " +
          guests +
          "\n🛏️ Chambres : " +
          rooms +
          "\n⭐ Catégorie : " +
          selectedCategory +
          (budget ? "\n💰 Budget/nuit : " + budget : "") +
          "\n🎯 Motif : " +
          motif +
          (requests ? "\n📝 Demandes : " + requests : "") +
          "\n\n👤 Nom : " +
          name +
          "\n📞 Téléphone : " +
          phone;

        const whatsappUrl = "https://wa.me/16728972999?text=" + encodeURIComponent(message);
        window.open(whatsappUrl, "_blank");
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Réservation d'Hôtel</h1>
          <p className="text-lg text-slate-600">
            Trouvez votre hébergement idéal pour votre voyage. Notre équipe vous propose les meilleures options.
          </p>
        </div>

        {/* Widget HTML */}
        <div id="hotel-booking-widget" className="hotel-widget">
          <style>{`
            .hotel-widget {
              --navy: #082060;
              --blue: #0D4FC4;
              --gold: #D4AF37;
              --gold-dark: #B8912C;
              --gray-50: #F8FAFC;
              --gray-100: #F1F5F9;
              --gray-400: #94A3B8;
              --gray-600: #475569;
              font-family: Arial, Helvetica Neue, sans-serif;
              max-width: 640px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 10px 40px rgba(8, 32, 96, 0.12);
              border: 1px solid #E5EAF3;
            }
            .hbw-header {
              background: linear-gradient(135deg, var(--navy) 0%, var(--blue) 100%);
              padding: 28px;
              color: white;
            }
            .hbw-eyebrow {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(212, 175, 55, 0.18);
              border: 1px solid var(--gold);
              color: var(--gold);
              font-size: 12px;
              font-weight: 900;
              padding: 5px 12px;
              border-radius: 999px;
              margin-bottom: 14px;
            }
            .hbw-title {
              font-size: 26px;
              font-weight: 900;
              margin: 0 0 6px;
            }
            .hbw-subtitle {
              font-size: 14px;
              color: #C9D6F0;
              margin: 0;
              font-weight: 600;
            }
            .hbw-body {
              padding: 24px 28px;
            }
            .hbw-field {
              margin-bottom: 14px;
            }
            .hbw-field label {
              display: block;
              font-size: 13px;
              font-weight: 900;
              color: var(--navy);
              margin-bottom: 6px;
            }
            .hbw-required {
              color: var(--gold-dark);
            }
            .hbw-field input,
            .hbw-field select,
            .hbw-field textarea {
              width: 100%;
              padding: 12px 14px;
              border: 2px solid var(--gray-100);
              border-radius: 10px;
              font-size: 15px;
              font-family: inherit;
              color: var(--navy);
              background: var(--gray-50);
              box-sizing: border-box;
            }
            .hbw-field input:focus,
            .hbw-field select:focus,
            .hbw-field textarea:focus {
              outline: none;
              border-color: #1AA3E8;
              background: white;
            }
            .hbw-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
              margin-bottom: 14px;
            }
            .hbw-categories {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin-bottom: 14px;
            }
            .hbw-cat-btn {
              border: 2px solid var(--gray-100);
              background: var(--gray-50);
              border-radius: 10px;
              padding: 10px 4px;
              text-align: center;
              cursor: pointer;
              font-size: 12px;
              font-weight: 800;
              color: var(--gray-600);
              transition: all 0.15s ease;
            }
            .hbw-cat-btn.active {
              border-color: var(--gold);
              background: rgba(212, 175, 55, 0.12);
              color: var(--navy);
            }
            .hbw-cat-stars {
              display: block;
              font-size: 14px;
              margin-bottom: 3px;
            }
            .hbw-divider {
              height: 1px;
              background: var(--gray-100);
              margin: 22px 0;
            }
            .hbw-section-label {
              font-size: 12px;
              font-weight: 900;
              color: var(--gold-dark);
              text-transform: uppercase;
              margin-bottom: 14px;
            }
            .hbw-submit {
              width: 100%;
              margin-top: 8px;
              background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
              color: var(--navy);
              border: none;
              border-radius: 12px;
              padding: 16px 20px;
              font-size: 16px;
              font-weight: 900;
              cursor: pointer;
              transition: transform 0.12s ease, box-shadow 0.12s ease;
              box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
            }
            .hbw-submit:hover {
              transform: translateY(-1px);
              box-shadow: 0 6px 18px rgba(212, 175, 55, 0.45);
            }
            .hbw-note {
              text-align: center;
              font-size: 12px;
              color: var(--gray-400);
              margin-top: 12px;
            }
            .hbw-error {
              font-size: 12px;
              color: #C0392B;
              font-weight: 700;
              margin-top: 4px;
              display: none;
            }
            .hbw-field.hbw-invalid input,
            .hbw-field.hbw-invalid select {
              border-color: #C0392B;
            }
            .hbw-field.hbw-invalid .hbw-error {
              display: block;
            }
          `}</style>

          <div className="hbw-header">
            <span className="hbw-eyebrow">🏨 Réservation d'hôtel</span>
            <h2 className="hbw-title">Trouvez votre hébergement</h2>
            <p className="hbw-subtitle">Remplissez vos critères — notre équipe vous propose les meilleures options sous 24h.</p>
          </div>

          <div className="hbw-body">
            <form id="hbw-form">
              <div className="hbw-field">
                <label htmlFor="hbw-destination">
                  Destination (ville, pays) <span className="hbw-required">*</span>
                </label>
                <input type="text" id="hbw-destination" placeholder="Ex : Paris, France" required />
                <div className="hbw-error">Merci d'indiquer une destination</div>
              </div>

              <div className="hbw-row">
                <div className="hbw-field">
                  <label htmlFor="hbw-checkin">
                    Arrivée <span className="hbw-required">*</span>
                  </label>
                  <input type="date" id="hbw-checkin" required />
                  <div className="hbw-error">Date requise</div>
                </div>
                <div className="hbw-field">
                  <label htmlFor="hbw-checkout">
                    Départ <span className="hbw-required">*</span>
                  </label>
                  <input type="date" id="hbw-checkout" required />
                  <div className="hbw-error">Date requise</div>
                </div>
              </div>

              <div className="hbw-row">
                <div className="hbw-field">
                  <label htmlFor="hbw-guests">Voyageurs</label>
                  <select id="hbw-guests" defaultValue="2 personnes">
                    <option>1 personne</option>
                    <option>2 personnes</option>
                    <option>3 personnes</option>
                    <option>4 personnes</option>
                    <option>5+ personnes</option>
                  </select>
                </div>
                <div className="hbw-field">
                  <label htmlFor="hbw-rooms">Chambres</label>
                  <select id="hbw-rooms" defaultValue="1 chambre">
                    <option>1 chambre</option>
                    <option>2 chambres</option>
                    <option>3 chambres</option>
                    <option>4+ chambres</option>
                  </select>
                </div>
              </div>

              <div className="hbw-field">
                <label>Catégorie souhaitée</label>
                <div className="hbw-categories" id="hbw-categories">
                  <div className="hbw-cat-btn" data-value="Économique">
                    <span className="hbw-cat-stars">★</span>Économique
                  </div>
                  <div className="hbw-cat-btn active" data-value="Standard">
                    <span className="hbw-cat-stars">★★</span>Standard
                  </div>
                  <div className="hbw-cat-btn" data-value="Confort">
                    <span className="hbw-cat-stars">★★★</span>Confort
                  </div>
                  <div className="hbw-cat-btn" data-value="Luxe">
                    <span className="hbw-cat-stars">★★★★</span>Luxe
                  </div>
                </div>
              </div>

              <div className="hbw-field">
                <label htmlFor="hbw-budget">Budget approximatif par nuit (FCFA)</label>
                <input type="text" id="hbw-budget" placeholder="Ex : 40 000 FCFA (optionnel)" />
              </div>

              <div className="hbw-field">
                <label htmlFor="hbw-motif">Motif du séjour</label>
                <select id="hbw-motif">
                  <option>Tourisme</option>
                  <option>Voyage d'affaires</option>
                  <option>Études</option>
                  <option>Visite familiale</option>
                  <option>Autre</option>
                </select>
              </div>

              <div className="hbw-divider"></div>
              <div className="hbw-section-label">Vos coordonnées</div>

              <div className="hbw-field">
                <label htmlFor="hbw-name">
                  Nom complet <span className="hbw-required">*</span>
                </label>
                <input type="text" id="hbw-name" placeholder="Votre nom et prénom" required />
                <div className="hbw-error">Merci d'indiquer votre nom</div>
              </div>

              <div className="hbw-field">
                <label htmlFor="hbw-phone">
                  Téléphone WhatsApp <span className="hbw-required">*</span>
                </label>
                <input type="tel" id="hbw-phone" placeholder="Ex : 6XX XXX XXX" required />
                <div className="hbw-error">Merci d'indiquer un numéro</div>
              </div>

              <div className="hbw-field">
                <label htmlFor="hbw-requests">Demandes particulières</label>
                <textarea
                  id="hbw-requests"
                  placeholder="Ex : proche du centre-ville, petit-déjeuner inclus... (optionnel)"
                  style={{ resize: "vertical", minHeight: "64px" }}
                ></textarea>
              </div>

              <button type="submit" className="hbw-submit">
                💬 Envoyer ma demande sur WhatsApp
              </button>
              <p className="hbw-note">Réponse sous 24h · Aucun engagement</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
