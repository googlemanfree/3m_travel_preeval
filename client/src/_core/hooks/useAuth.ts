import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Login is started via startLogin() in the effect below, only when we actually
  // navigate — never during render. startLogin() mints a one-time nonce + writes
  // the state cookie, so calling it per render would overwrite the cookie and
  // desync it from an in-flight login's `state`.
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const [sessionRestored, setSessionRestored] = useState(false);

  // Restauration de la session depuis localStorage au chargement
  useEffect(() => {
    const savedToken = localStorage.getItem('3m_auth_token');
    const savedUser = localStorage.getItem('3m_user');

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Restaurer les données utilisateur dans le cache tRPC
        utils.auth.me.setData(undefined, userData);
      } catch (error) {
        console.error('Erreur lors de la restauration de la session:', error);
        localStorage.removeItem('3m_auth_token');
        localStorage.removeItem('3m_user');
      }
    }
    setSessionRestored(true);
  }, [utils]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: sessionRestored,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      // Clear the Preview auto-login token mirrored into sessionStorage, so
      // header-based sessions (Safari ITP / WebView) are logged out too. The
      // backend cookie is cleared by the logout mutation.
      try {
        sessionStorage.removeItem("manus-cookie");
      } catch {}
      // Effacer le localStorage
      localStorage.removeItem('3m_auth_token');
      localStorage.removeItem('3m_user');
      localStorage.removeItem('manus-runtime-user-info');
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    // Sauvegarder les données utilisateur dans localStorage
    if (meQuery.data) {
      localStorage.setItem('3m_auth_token', 'token_present');
      localStorage.setItem('3m_user', JSON.stringify(meQuery.data));
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(meQuery.data)
      );
    }
    return {
      user: meQuery.data ?? null,
      loading: !sessionRestored || meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    sessionRestored,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!sessionRestored) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    // Navigate at this moment only. startLogin() mints the nonce + cookie itself.
    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin();
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
    sessionRestored,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
