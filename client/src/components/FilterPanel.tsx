import React from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterPanelProps {
  title: string;
  options: FilterOption[];
  selectedOptions: Set<string>;
  onToggle: (optionId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function FilterPanel({
  title,
  options,
  selectedOptions,
  onToggle,
  isOpen,
  onToggleOpen,
}: FilterPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <ChevronDown
          size={20}
          className={`text-gray-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 p-4 space-y-2">
          {options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={selectedOptions.has(option.id)}
                onChange={() => onToggle(option.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <span className="flex-1 text-sm text-gray-700">{option.label}</span>
              {option.count !== undefined && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {option.count}
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface SortDropdownProps {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}

export function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
  const sortOptions = [
    { id: "name", label: "Nom (A-Z)" },
    { id: "name-desc", label: "Nom (Z-A)" },
    { id: "cost-asc", label: "Coût (moins cher)" },
    { id: "cost-desc", label: "Coût (plus cher)" },
  ];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
        Trier par :
      </label>
      <select
        id="sort-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {sortOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ActiveFiltersProps {
  filters: Array<{ label: string; id: string }>;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <span className="text-sm font-medium text-gray-700">Filtres actifs :</span>
      {filters.map((filter) => (
        <div
          key={filter.id}
          className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
        >
          <span>{filter.label}</span>
          <button
            onClick={() => onRemove(filter.id)}
            className="hover:text-blue-900 transition-colors"
            aria-label={`Supprimer le filtre ${filter.label}`}
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-blue-600 hover:text-blue-800 text-sm"
      >
        Réinitialiser tous les filtres
      </Button>
    </div>
  );
}
