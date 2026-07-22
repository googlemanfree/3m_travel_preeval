import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Plane, X } from "lucide-react";
import { searchAirports, getAirportByCode, airportLabel, type Airport } from "@shared/airports";

interface AirportAutocompleteProps {
  value: string;                          // Code IATA sélectionné (ex: "CDG")
  onChange: (code: string) => void;       // Callback avec le code IATA
  placeholder?: string;
  label?: string;
  icon?: "origin" | "destination";
  className?: string;
  disabled?: boolean;
}

export default function AirportAutocomplete({
  value,
  onChange,
  placeholder = "Ville ou aéroport",
  label,
  icon = "origin",
  className = "",
  disabled = false,
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Airport[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Aéroport actuellement sélectionné
  const selected = value ? getAirportByCode(value) : null;

  // Met à jour les résultats à chaque frappe
  const handleInput = useCallback((q: string) => {
    setQuery(q);
    setHighlighted(0);
    const found = searchAirports(q, 8);
    setResults(found);
    setOpen(true);
  }, []);

  // Sélectionne un aéroport
  const selectAirport = useCallback((airport: Airport) => {
    onChange(airport.code);
    setQuery("");
    setOpen(false);
  }, [onChange]);

  // Efface la sélection
  const clear = useCallback(() => {
    onChange("");
    setQuery("");
    setResults(searchAirports("", 8));
    inputRef.current?.focus();
  }, [onChange]);

  // Ouvre le dropdown avec les suggestions populaires si vide
  const handleFocus = () => {
    const found = searchAirports(query, 8);
    setResults(found);
    setOpen(true);
  };

  // Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && results[highlighted]) {
      e.preventDefault();
      selectAirport(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Ferme le dropdown si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}

      {/* Champ de saisie */}
      <div
        className={`
          flex items-center gap-2 bg-white border-2 rounded-xl px-3 py-2.5 transition-all cursor-text
          ${open ? "border-blue-500 ring-2 ring-blue-100 shadow-md" : "border-gray-200 hover:border-blue-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {/* Icône */}
        <div className={`flex-shrink-0 ${icon === "destination" ? "text-blue-500" : "text-gray-400"}`}>
          {icon === "destination" ? (
            <Plane className="w-4 h-4 rotate-45" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </div>

        {/* Affichage de la sélection ou champ de saisie */}
        {selected && !open ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-lg leading-none flex-shrink-0">{selected.flag}</span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-[#1E3A8A] text-base leading-tight">{selected.code}</span>
                <span className="text-gray-600 text-sm font-medium truncate">{selected.city}</span>
              </div>
              <div className="text-xs text-gray-400 truncate leading-tight">{selected.name}</div>
            </div>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={selected ? `${selected.code} — ${selected.city}` : placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-800 placeholder:text-gray-400 min-w-0"
            autoComplete="off"
            spellCheck={false}
          />
        )}

        {/* Bouton effacer */}
        {selected && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); clear(); }}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {/* Dropdown de suggestions */}
      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ minWidth: "280px" }}
        >
          {/* En-tête */}
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {query ? `Résultats pour "${query}"` : "Aéroports populaires"}
            </span>
          </div>

          {/* Liste des résultats */}
          <ul className="max-h-72 overflow-y-auto">
            {results.map((airport, idx) => (
              <li key={airport.code}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); selectAirport(airport); }}
                  onMouseEnter={() => setHighlighted(idx)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                    ${highlighted === idx ? "bg-blue-50" : "hover:bg-gray-50"}
                  `}
                >
                  {/* Drapeau */}
                  <span className="text-xl flex-shrink-0 leading-none">{airport.flag}</span>

                  {/* Infos aéroport */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className={`font-black text-sm ${highlighted === idx ? "text-blue-700" : "text-gray-800"}`}>
                        {airport.code}
                      </span>
                      <span className="font-semibold text-sm text-gray-700 truncate">
                        {airport.city}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {airport.country}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate leading-tight mt-0.5">
                      {airport.name}
                    </div>
                  </div>

                  {/* Badge populaire */}
                  {airport.popular && (
                    <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-600 font-semibold px-1.5 py-0.5 rounded-full">
                      ★
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Footer si aucun résultat */}
          {results.length === 0 && query && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Aucun aéroport trouvé pour « {query} »
            </div>
          )}
        </div>
      )}
    </div>
  );
}
