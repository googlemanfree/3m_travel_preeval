import { useRef } from "react";
import { MapView } from "./Map";

/**
 * Composant de carte Google Maps pour afficher la localisation
 * de 3M Travel & Services à Yaoundé, Biyem-Assi
 */
export function LocationMap() {
  const mapRef = useRef<google.maps.Map | null>(null);

  // Coordonnées approximatives de Biyem-Assi, Yaoundé
  // (Montée chapelle Obili, 10m de EHS)
  const yaoundeLocation = {
    lat: 3.8667,
    lng: 11.5167,
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-blue-200">
      <div className="relative w-full h-96 bg-gray-100">
        <MapView
          initialCenter={yaoundeLocation}
          initialZoom={16}
          onMapReady={(map) => {
            mapRef.current = map;

            // Ajouter un marqueur personnalisé
            if (typeof google !== "undefined" && google.maps) {
              new google.maps.marker.AdvancedMarkerElement({
                map,
                position: yaoundeLocation,
                title: "3M Travel & Services - Yaoundé",
              });

              // Ajouter une fenêtre d'information
              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div style="padding: 12px; font-family: system-ui;">
                    <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af;">3M Travel & Services</h3>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #374151;">
                      Yaoundé, Biyem-Assi<br/>
                      Montée chapelle Obili (10m de EHS)
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
                      <strong>Tel:</strong> +237 620-996-045<br/>
                      <strong>WhatsApp:</strong> +237 698-104-832
                    </p>
                  </div>
                `,
              });
              infoWindow.open(map);
            }
          }}
        />

        {/* Overlay avec infos de localisation */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <p className="text-sm font-semibold text-gray-900 mb-2">📍 Notre Localisation</p>
          <p className="text-xs text-gray-700 leading-relaxed">
            Yaoundé, Biyem-Assi<br />
            Montée chapelle Obili (10m de EHS)<br />
            <span className="text-blue-700 font-medium">Cameroun</span>
          </p>
        </div>
      </div>
    </div>
  );
}
