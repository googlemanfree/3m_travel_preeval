import React from "react";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminNavigationShortcutsProps = {
  onRefresh: () => void;
  onBack: () => void;
  onDossiers: () => void;
  isRefreshing: boolean;
  isRefreshDisabled: boolean;
  canGoBack: boolean;
};

export function AdminNavigationShortcuts({
  onRefresh,
  onBack,
  onDossiers,
  isRefreshing,
  isRefreshDisabled,
  canGoBack,
}: AdminNavigationShortcutsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshDisabled}
        className="gap-1.5 border-white/30 text-white hover:bg-white/10"
        aria-label="Actualiser manuellement les données du dashboard"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing ? "Synchronisation..." : "Actualiser"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        disabled={!canGoBack}
        className="gap-1.5 border-white/30 text-white hover:bg-white/10"
        title="Revenir au dernier espace du back-office"
      >
        <ArrowLeft className="h-4 w-4" /><span className="hidden lg:inline">Retour</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onDossiers}
        className="gap-1.5 border-white/30 text-white hover:bg-white/10"
        title="Revenir au poste de pilotage des dossiers"
      >
        <ArrowRight className="h-4 w-4" /><span className="hidden lg:inline">Dossiers</span>
      </Button>
    </div>
  );
}
