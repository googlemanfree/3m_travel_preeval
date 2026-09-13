import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";
import { MessageCircleWarning, RotateCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  retryKey: number;
}

export class ReviewsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryKey: 0 };

  static getDerivedStateFromError(): Pick<State, "hasError"> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ReviewsErrorBoundary] Erreur dans la section des avis clients :", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState((current) => ({ hasError: false, retryKey: current.retryKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-16 px-4 bg-gradient-to-b from-white to-slate-50">
          <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <MessageCircleWarning className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Les avis clients ne peuvent pas être affichés pour le moment. Réessayez ou contactez l'agence directement.
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <RotateCw className="h-4 w-4" aria-hidden="true" /> Réessayer
            </button>
          </div>
        </div>
      );
    }

    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>;
  }
}
