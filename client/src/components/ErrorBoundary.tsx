import { AlertTriangle, RotateCcw, PhoneCall, MessageCircle } from "lucide-react";
import { Component, ReactNode } from "react";
import { CHUNK_RELOAD_NOTICE_KEY } from "@/lib/lazyWithTimeout";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
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

const RELOAD_FLAG_KEY = "3m_chunk_error_reload_attempted";

function reloadPageAfterChunkFailure() {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_NOTICE_KEY, "network");
  } catch {
    // Le rechargement reste possible si le stockage est indisponible.
  }
  window.location.reload();
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (isChunkLoadError(error)) {
      const alreadyAttempted = sessionStorage.getItem(RELOAD_FLAG_KEY);
      if (!alreadyAttempted) {
        sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
        reloadPageAfterChunkFailure();
      }
    } else {
      sessionStorage.removeItem(RELOAD_FLAG_KEY);
    }
  }

  private handleManualRetry = () => {
    try {
      // Autorise une nouvelle tentative manuelle tout en conservant la limite
      // d’un seul rechargement automatique par session.
      sessionStorage.removeItem(RELOAD_FLAG_KEY);
    } catch {
      // Le navigateur peut bloquer le stockage en mode privé.
    }
    reloadPageAfterChunkFailure();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background text-foreground">
          <div className="flex flex-col items-center w-full max-w-lg p-8 rounded-2xl bg-card border border-border shadow-xl text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-2xl font-bold mb-2">Oups, une mise à jour est requise</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Le site a été mis à jour et votre navigateur conservait une ancienne version en cache. Veuillez actualiser la page pour profiter de la dernière version.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full mb-6">
              <button
                type="button"
                onClick={this.handleManualRetry}
                className="h-12 flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 text-primary-foreground font-medium hover:opacity-90 transition shadow-lg cursor-pointer"
              >
                <RotateCcw size={18} />
                Réessayer maintenant
              </button>
              <a
                href="https://wa.me/16728972999?text=Bonjour%203M%20Travel%2C%20je%20rencontre%20un%20souci%20technique%20sur%20le%20site."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition shadow-lg cursor-pointer"
              >
                <MessageCircle size={18} />
                WhatsApp Support
              </a>
            </div>

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
