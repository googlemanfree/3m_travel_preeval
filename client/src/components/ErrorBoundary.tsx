import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Repère les erreurs de chargement de "chunk" — quand le navigateur essaie
// de récupérer un fichier JavaScript qui n'existe plus car le site a été
// redéployé depuis le dernier chargement de la page (les noms de fichiers
// changent à chaque build). Très fréquent avec le découpage de code
// (React.lazy) : sans ce filet, l'utilisateur se retrouve avec une page
// blanche silencieuse au lieu d'un simple rechargement.
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
      // On ne retente qu'une seule fois par session, pour ne jamais
      // tomber dans une boucle de rechargement infinie si le problème
      // persiste pour une autre raison.
      const alreadyAttempted = sessionStorage.getItem(RELOAD_FLAG_KEY);
      if (!alreadyAttempted) {
        sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
        window.location.reload();
      }
    } else {
      // Une navigation réussie sans nouvelle erreur de chunk réinitialise
      // le compteur, pour permettre une future récupération automatique.
      sessionStorage.removeItem(RELOAD_FLAG_KEY);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
