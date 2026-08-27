import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type Props = {
  children: ReactNode;
  label: string;
  onRetry: () => void;
  onFailure?: () => void;
};

type State = { failed: boolean };

/**
 * Isole les erreurs d’import dynamique d’un simulateur sans interrompre la page.
 * Aucun détail navigateur ou saisie candidat n’est transmis au serveur.
 */
export class SimulatorRetryBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onFailure?.();
  }

  handleRetry = () => {
    this.setState({ failed: false });
    this.props.onRetry();
  };

  render() {
    if (this.state.failed) {
      return (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950" role="alert">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <h3 className="font-black">{this.props.label} n’a pas pu se charger</h3>
              <p className="mt-1 text-sm leading-6">Vos informations ne sont pas perdues. Réessayez ou poursuivez avec une évaluation accompagnée.</p>
              <button
                type="button"
                onClick={this.handleRetry}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Réessayer le chargement
              </button>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
