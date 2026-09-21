import React, { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import CountryFlag from "@/components/CountryFlag";
import {
  CANDIDATE_DESTINATION_OPTIONS,
  MAX_PREFERRED_DESTINATIONS,
  POPULAR_DESTINATION_NAMES,
  getCandidateDestinationOption,
  searchCandidateDestinations,
  type CandidateDestinationOption,
} from "@shared/candidateDestinationOptions";

type SearchBoxProps = {
  id: string;
  ariaLabel: string;
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Texte affiché quand la liste est fermée (choix d'un seul pays). */
  closedText?: string;
  closedFlag?: string;
  priority: readonly string[];
  isSelected: (option: CandidateDestinationOption) => boolean;
  onPick: (option: CandidateDestinationOption) => void;
};

function CountrySearchBox({ id, ariaLabel, placeholder, disabled, invalid, closedText = "", closedFlag, priority, isSelected, onPick }: SearchBoxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const priorityKey = priority.join("|");

  const { options, topCount } = useMemo(() => {
    if (query.trim()) return { options: searchCandidateDestinations(query), topCount: 0 };
    const top = priority
      .map((name) => getCandidateDestinationOption(name))
      .filter((option): option is CandidateDestinationOption => Boolean(option));
    const topCodes = new Set(top.map((option) => option.code));
    return { options: [...top, ...CANDIDATE_DESTINATION_OPTIONS.filter((option) => !topCodes.has(option.code))], topCount: top.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, priorityKey]);

  useEffect(() => {
    if (!open) return;
    const option = options[active];
    if (option) document.getElementById(`${id}-opt-${option.code}`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, active, options, id]);

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }

  function pick(option: CandidateDestinationOption) {
    onPick(option);
    close();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActive((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && options[active]) {
      event.preventDefault();
      pick(options[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  }

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white px-3 focus-within:ring-2 focus-within:ring-violet-300 ${invalid ? "border-red-400" : "border-violet-200"} ${disabled ? "opacity-60" : ""}`}
      >
        {!open && closedFlag ? <CountryFlag flag={closedFlag} /> : <Search className="h-4 w-4 shrink-0 text-violet-500" aria-hidden="true" />}
        <input
          id={id}
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          aria-activedescendant={open && options[active] ? `${id}-opt-${options[active].code}` : undefined}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : closedText}
          placeholder={open && closedText ? closedText : placeholder}
          onFocus={() => setOpen(true)}
          onBlur={close}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
      </div>
      {open && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-violet-200 bg-white p-1 shadow-xl"
        >
          {options.length === 0 && <p className="p-3 text-sm text-slate-500">Aucun pays ne correspond à votre recherche.</p>}
          {options.map((option, index) => {
            const selected = isSelected(option);
            return (
              <React.Fragment key={option.code}>
                {topCount > 0 && index === 0 && <div role="presentation" className="px-3 pb-1 pt-2 text-[11px] font-black uppercase tracking-wide text-slate-400">Populaires</div>}
                {topCount > 0 && index === topCount && <div role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">Tous les pays</div>}
                <div
                  id={`${id}-opt-${option.code}`}
                  role="option"
                  aria-selected={selected}
                  aria-label={`${option.name}${option.hasGuide ? ", guide disponible" : ""}, ${option.region}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(option)}
                  className={`flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${index === active ? "bg-violet-50" : ""} ${selected ? "bg-violet-100 font-bold text-violet-800" : "text-slate-700"}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CountryFlag flag={option.flag} />
                    <span className="truncate">{option.name}</span>
                    {option.hasGuide && <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold uppercase leading-4 text-emerald-800">Guide</span>}
                  </span>
                  <span className="min-w-0 max-w-[42%] truncate text-right text-xs text-slate-400">{option.region}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

type DestinationPickerProps = {
  id: string;
  value: string[];
  onChange: (names: string[]) => void;
  max?: number;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  popular?: readonly string[];
};

/** Choix de plusieurs pays (le premier est la destination principale), parmi tous les pays du monde. */
export function DestinationPicker({
  id,
  value,
  onChange,
  max = MAX_PREFERRED_DESTINATIONS,
  disabled,
  invalid,
  placeholder = "Rechercher un pays : Canada, France, Sénégal…",
  popular = POPULAR_DESTINATION_NAMES,
}: DestinationPickerProps) {
  const selected = useMemo(() => {
    const names: string[] = [];
    for (const raw of value) {
      const name = getCandidateDestinationOption(raw)?.name ?? raw;
      if (!names.includes(name)) names.push(name);
    }
    return names;
  }, [value]);
  const full = selected.length >= max;

  function toggle(name: string) {
    if (selected.includes(name)) onChange(selected.filter((item) => item !== name));
    else if (!full) onChange([...selected, name]);
  }

  const quickPicks = popular.filter((name) => !selected.includes(name)).slice(0, 6);

  return (
    <div>
      <CountrySearchBox
        id={id}
        ariaLabel="Rechercher une destination"
        placeholder={full ? `${max} destinations choisies` : placeholder}
        disabled={disabled || full}
        invalid={invalid}
        priority={popular}
        isSelected={(option) => selected.includes(option.name)}
        onPick={(option) => toggle(option.name)}
      />
      {selected.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Destinations sélectionnées">
          {selected.map((name, index) => {
            const option = getCandidateDestinationOption(name);
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => toggle(name)}
                  disabled={disabled}
                  aria-label={`Retirer ${name}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-800 disabled:opacity-60"
                >
                  {option && <CountryFlag flag={option.flag} />}
                  {name}
                  <span className="rounded-full bg-white/25 px-1.5 text-[10px] font-black uppercase leading-4">
                    {index === 0 ? "Principale" : <><span className="sr-only">Choix </span>{index + 1}</>}
                  </span>
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!full && !disabled && quickPicks.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Destinations populaires">
          <span className="text-xs text-slate-500">Populaires :</span>
          {quickPicks.map((name) => {
            const option = getCandidateDestinationOption(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50"
              >
                {option && <CountryFlag flag={option.flag} />}
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type CountrySelectProps = {
  id: string;
  value: string;
  onChange: (name: string) => void;
  /** Nom du champ natif : permet de l'utiliser dans un formulaire lu par FormData. */
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  priority?: readonly string[];
  ariaLabel?: string;
  allowClear?: boolean;
};

/** Choix d'un seul pays parmi tous les pays du monde ; les valeurs historiques restent affichées. */
export function CountrySelect({
  id,
  value,
  onChange,
  name,
  placeholder = "Choisir un pays…",
  disabled,
  invalid,
  priority = POPULAR_DESTINATION_NAMES,
  ariaLabel = "Pays",
  allowClear = false,
}: CountrySelectProps) {
  const option = value ? getCandidateDestinationOption(value) : undefined;
  const shown = option?.name ?? value;
  return (
    <div className="relative">
      {name && <input type="hidden" name={name} value={shown} />}
      <CountrySearchBox
        id={id}
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        disabled={disabled}
        invalid={invalid}
        closedText={shown}
        closedFlag={option?.flag}
        priority={priority}
        isSelected={(candidate) => candidate.code === option?.code}
        onPick={(picked) => onChange(picked.name)}
      />
      {allowClear && value && !disabled && (
        <button
          type="button"
          aria-label="Effacer le pays"
          onClick={() => onChange("")}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
