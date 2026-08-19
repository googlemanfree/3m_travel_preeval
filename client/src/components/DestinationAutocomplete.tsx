import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DestinationOption } from "@/lib/destinationProcedureCatalog";

type Props = {
  id?: string;
  value: string;
  options: DestinationOption[];
  onSelect: (country: string) => void;
  onCustom: () => void;
  placeholder?: string;
};

export function DestinationAutocomplete({ id, value, options, onSelect, onCustom, placeholder = "Rechercher une destination…" }: Props) {
  const generatedId = useId();
  const inputId = id ?? `destination-${generatedId}`;
  const listId = `${inputId}-list`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    return !normalized ? options : options.filter((option) => option.country.toLocaleLowerCase("fr").includes(normalized));
  }, [options, query]);

  useEffect(() => setQuery(value), [value]);
  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const choose = (country: string) => {
    onSelect(country);
    setQuery(country);
    setOpen(false);
  };

  return <div ref={wrapperRef} className="relative mt-1">
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <Input id={inputId} value={query} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} placeholder={placeholder} className="h-10 bg-white pl-9 pr-16" onFocus={() => { setOpen(true); setActiveIndex(0); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(0); }} onKeyDown={(event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0))); }
        if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
        if (event.key === "Enter" && open && filtered[activeIndex]) { event.preventDefault(); choose(filtered[activeIndex].country); }
        if (event.key === "Escape") setOpen(false);
      }} />
      {query ? <Button type="button" variant="ghost" size="icon" className="absolute right-8 top-1/2 h-8 w-8 -translate-y-1/2" onClick={() => { setQuery(""); onCustom(); setOpen(true); }} aria-label="Effacer la destination"><X className="h-4 w-4" /></Button> : null}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
    </div>
    {open && <div id={listId} role="listbox" aria-label="Destinations disponibles" className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
      {filtered.length ? filtered.map((option, index) => <button key={option.country} type="button" role="option" aria-selected={value === option.country} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm outline-none ${index === activeIndex ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-50"}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option.country)}><span className="text-lg" aria-hidden="true">{option.flag}</span><span className="font-medium">{option.country}</span>{value === option.country && <span className="ml-auto text-xs font-semibold text-blue-700">Sélectionné</span>}</button>) : <p className="px-3 py-3 text-sm text-slate-500">Aucune destination correspondante.</p>}
      <div className="mt-1 border-t border-slate-100 p-1"><button type="button" className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-blue-700 hover:bg-blue-50" onClick={() => { onCustom(); setOpen(false); }}>Autre destination à étudier</button></div>
    </div>}
  </div>;
}
