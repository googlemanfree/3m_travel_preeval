import React, { Component, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Nom du panneau affiché dans le message (ex. « fiche candidat »). */
  label: string;
  /** Change de valeur (ex. identifiant du candidat) : le panneau retente alors tout seul. */
  resetKey?: string | number | null;
}

interface State {
  error: Error | null;
}

/**
 * Isole l'erreur de rendu d'un panneau : le reste de la page (navigation, session) reste utilisable au lieu de
 * tomber sur l'écran « Cette page n'a pas pu être chargée » du ErrorBoundary racine. Le message technique est
 * affiché (il s'adresse aux administrateurs) pour qu'un plantage puisse être décrit et corrigé.
 */
export default class PanelErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(`[PanelErrorBoundary:${this.props.label}]`, error, info?.componentStack ?? "");
  }

  componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" data-testid="panel-error-boundary" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-bold">Le panneau « {this.props.label} » a rencontré une erreur.</p>
            <p className="mt-1 text-sm text-rose-900">
              Le reste de la page et votre session ne sont pas affectés. Si une action vient d'être lancée (envoi d'un e-mail, d'un protocole…),
              rechargez les données avant de la relancer : elle a peut-être déjà été enregistrée.
            </p>
            <p className="mt-2 break-words rounded-lg bg-white/70 px-3 py-2 font-mono text-xs text-rose-900" data-testid="panel-error-message">
              {this.state.error.message || String(this.state.error)}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Réessayer ce panneau
            </button>
          </div>
        </div>
      </div>
    );
  }
}
