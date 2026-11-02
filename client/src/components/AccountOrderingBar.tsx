import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw } from "lucide-react";
import { DEFAULT_ACCOUNT_VIEW, GROUP_OPTIONS, SORT_OPTIONS, optionValue, parseStoredView, type AccountGroupKey, type AccountSortKey, type AccountView } from "@shared/accountOrdering";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "admin-predossier-view";

/** Choix de tri et de classement, mémorisé sur cet appareil (jamais bloquant si le stockage est indisponible). */
export function useAccountView(): [AccountView, (view: AccountView) => void] {
  const [view, setView] = useState<AccountView>(() => {
    try { return parseStoredView(localStorage.getItem(STORAGE_KEY)); } catch { return DEFAULT_ACCOUNT_VIEW; }
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(view)); } catch { /* mémorisation facultative */ }
  }, [view]);
  return [view, setView];
}

const selectClass = "h-9 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800";

export function AccountOrderingBar({ view, onChange, total }: { view: AccountView; onChange: (view: AccountView) => void; total: number }) {
  const changed = view.sort !== DEFAULT_ACCOUNT_VIEW.sort || view.dir !== DEFAULT_ACCOUNT_VIEW.dir || view.group !== DEFAULT_ACCOUNT_VIEW.group;
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="account-ordering" role="group" aria-label="Ranger et classer les comptes">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />Trier
        <select className={selectClass} value={optionValue(view)} onChange={(event) => { const option = SORT_OPTIONS.find((item) => item.value === event.target.value); if (option) onChange({ ...view, sort: option.sort, dir: option.dir }); }} data-testid="account-sort">
          {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">Classer
        <select className={selectClass} value={view.group} onChange={(event) => onChange({ ...view, group: event.target.value as AccountGroupKey })} data-testid="account-group">
          {GROUP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      {changed && <Button type="button" size="sm" variant="ghost" className="h-9 gap-1 px-2 text-xs" onClick={() => onChange(DEFAULT_ACCOUNT_VIEW)} data-testid="account-view-reset"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Réinitialiser</Button>}
      <span className="text-xs text-slate-500" role="status">{total} compte(s)</span>
    </div>
  );
}

/** En-tête de colonne cliquable : un clic trie, un second clic inverse le sens. */
export function SortHeader({ label, sort, view, onChange, defaultDir = "asc", align }: { label: string; sort: AccountSortKey; view: AccountView; onChange: (view: AccountView) => void; defaultDir?: "asc" | "desc"; align?: "right" }) {
  const active = view.sort === sort;
  const Icon = !active ? ArrowUpDown : view.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={`px-4 py-3 ${align === "right" ? "text-right" : ""}`} aria-sort={active ? (view.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-900 ${active ? "text-slate-900" : ""}`} onClick={() => onChange({ ...view, sort, dir: active ? (view.dir === "asc" ? "desc" : "asc") : defaultDir })} data-testid={`account-header-${sort}`}>
        {label}<Icon className="h-3 w-3" aria-hidden="true" />
      </button>
    </th>
  );
}
