import { AlertTriangle, RotateCcw, PhoneCall, MessageCircle, Copy, Check } from "lucide-react";
import { Component, ErrorInfo, ReactNode } from "react";
import { CHUNK_RELOAD_FLAG_KEY, reloadAfterChunkFailure } from "@/lib/lazyWithTimeout";
import { buildClientErrorReport, formatErrorDetails, sendClientErrorReport, type ClientErrorReport } from "@/lib/clientErrorReport";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  report: ClientErrorReport | null;
  copied: boolean;
}

function isChunkLoadError(error: Error): boolean {
  const message = error.message || "";
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Loading chunk .* failed/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /dynamically imported module/i.test(message)
  );
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, report: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, copied: false };
  }

  private handleCopyDetails = async () => {
    if (!this.state.report) return;
    try {
      await navigator.clipboard.writeText(formatErrorDetails(this.state.report));
      this.setState({ copied: true });
    } catch {
      // Presse-papiers refusé : la référence reste affichée et peut être recopiée à la main.
    }
  };

  componentDidCatch(error: Error, info?: ErrorInfo) {
    // Référence citée au support + envoi discret au serveur : on sait enfin quelle page et quel composant ont planté.
    const report = buildClientErrorReport(error, info?.componentStack);
    this.setState({ report });
    sendClientErrorReport(report);
    if (isChunkLoadError(error)) {
      try {
        const alreadyAttempted = sessionStorage.getItem(CHUNK_RELOAD_FLAG_KEY);
        if (!alreadyAttempted) {
          sessionStorage.setItem(CHUNK_RELOAD_FLAG_KEY, "1");
          void reloadAfterChunkFailure();
        }
      } catch {
        void reloadAfterChunkFailure();
      }
    } else {
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_FLAG_KEY);
      } catch {
        // Le stockage de session peut être indisponible en mode privé.
      }
    }
  }

  private handleManualRetry = () => {
    try {
      // Autorise une nouvelle tentative manuelle tout en conservant la limite
      // d’un seul rechargement automatique par session.
      sessionStorage.removeItem(CHUNK_RELOAD_FLAG_KEY);
    } catch {
      // Le navigateur peut bloquer le stockage en mode privé.
    }
    if (this.state.error && !isChunkLoadError(this.state.error)) {
      this.setState({ hasError: false, error: null, report: null, copied: false });
      return;
    }
    void reloadAfterChunkFailure();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background text-foreground">
          <div className="flex flex-col items-center w-full max-w-lg p-8 rounded-2xl bg-card border border-border shadow-xl text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-2">Cette page n’a pas pu être chargée</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {this.state.error && isChunkLoadError(this.state.error)
                ? "Une mise à jour de page n’a pas pu être chargée. Nous allons réessayer sans déconnecter votre session."
                : "Un élément de cette page a rencontré un problème temporaire. Réessayez ; votre session reste active."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full mb-6">
              <button
                type="button"
                onClick={this.handleManualRetry}
                className="h-12 flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 text-primary-foreground font-medium hover:opacity-90 transition shadow-lg cursor-pointer"
              >
                <RotateCcw size={18} />
                Réessayer la page
              </button>
              <a
                href={`https://wa.me/237698104832?text=${encodeURIComponent(
                  `Bonjour 3M Travel, je rencontre un souci technique sur le site.${this.state.report ? ` Référence : ${this.state.report.reference} (page ${this.state.report.path}).` : ""}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition shadow-lg cursor-pointer"
              >
                <MessageCircle size={18} />
                WhatsApp Support
              </a>
            </div>

            {this.state.report ? (
              <div className="mb-4 flex w-full flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3" data-testid="error-reference">
                <p className="text-xs text-muted-foreground">
                  Référence à communiquer au support : <strong className="font-mono text-foreground" data-testid="error-reference-code">{this.state.report.reference}</strong>
                </p>
                <button
                  type="button"
                  onClick={this.handleCopyDetails}
                  data-testid="error-copy-details"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted"
                >
                  {this.state.copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  {this.state.copied ? "Détails copiés" : "Copier les détails"}
                </button>
              </div>
            ) : null}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <PhoneCall size={14} />
              <span>Assistance WhatsApp : +237 6 98 10 48 32</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
