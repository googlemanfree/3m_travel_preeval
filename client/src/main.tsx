import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";

import App from "./App";
import { startLogin } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

// Gestionnaire global pour les erreurs de transformation de réponse
const handleResponseError = (error: unknown) => {
  if (typeof window === "undefined") return;
  
  // Erreur de transformation JSON
  if (error instanceof Error && error.message.includes("Unable to transform response")) {
    console.error("[Response Transform Error]", error);
    return "Erreur de communication avec le serveur. Veuillez réessayer.";
  }
  
  // Erreur réseau générale
  if (error instanceof Error && (error.message.includes("fetch") || error.message.includes("network"))) {
    console.error("[Network Error]", error);
    return "Erreur de connexion réseau. Vérifiez votre connexion Internet.";
  }
  
  return null;
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    handleResponseError(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    handleResponseError(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      headers() {
        // 1. Admin session token (takes priority for admin routes)
        try {
          const adminToken = localStorage.getItem("adminSessionToken");
          if (adminToken) {
            return { Authorization: `Bearer ${adminToken}`, "X-Admin-Token": adminToken };
          }
        } catch {
          // localStorage unavailable
        }
        // 2. Candidate JWT (email/password auth) — takes priority for candidate routes
        try {
          const candidateToken = localStorage.getItem("3m_candidate_token");
          if (candidateToken) {
            return { Authorization: `Bearer ${candidateToken}` };
          }
        } catch {
          // localStorage unavailable
        }
        // 3. Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
