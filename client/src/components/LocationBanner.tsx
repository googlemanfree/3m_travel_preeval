import React from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LocationBanner() {
  return (
    <section className="py-12 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Address */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <MapPin className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">📍 Siège Social & Agence Physique</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Avenue Marché Biyem-Assi<br />
                Montée Chapelle Obili<br />
                Yaoundé, Cameroun
              </p>
            </div>
          </div>

          {/* Hours */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">🕒 Horaires d'Ouverture</h3>
              <p className="text-blue-100 text-sm leading-relaxed">
                Lundi - Vendredi<br />
                08h00 - 17h30<br />
                Samedi sur RDV
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Phone className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">📞 Prise de RDV</h3>
              <div className="flex gap-2 flex-wrap">
                <a
                  href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%2C%20je%20souhaite%20prendre%20un%20rendez-vous%20%C3%A0%20l%27agence."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all"
                >
                  WhatsApp
                </a>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all">
                  Réserver
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 pt-8 border-t border-blue-400/30 text-center">
          <p className="text-blue-100 mb-4">
            Visitez notre agence pour une consultation personnalisée avec nos experts.
          </p>
          <a
            href="https://maps.google.com/?q=Avenue+Marché+Biyem-Assi,+Yaoundé,+Cameroun"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-blue-900 font-bold py-2 px-6 rounded-lg hover:bg-blue-50 transition-all"
          >
            📍 Voir sur Google Maps
          </a>
        </div>
      </div>
    </section>
  );
}
