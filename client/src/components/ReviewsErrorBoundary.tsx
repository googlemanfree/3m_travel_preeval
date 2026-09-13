import { Component, type ErrorInfo, type ReactNode } from "react";
import { MessageCircleWarning } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ReviewsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ReviewsErrorBoundary] Erreur dans la section des avis clients :", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-16 px-4 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <MessageCircleWarning className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Les avis clients ne peuvent pas être affichés pour le moment. Réessayez dans quelques instants ou contactez l'agence directement.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
