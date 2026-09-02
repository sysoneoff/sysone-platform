"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type SessionUser = {
  id: string;
  email: string | null;
  name: string;
  image_url: string | null;
  role: string;
  locale: string;
};

type SessionResponse = {
  ok: boolean;
  authenticated: boolean;
  user: SessionUser | null;
};

type SessionContextValue = {
  authenticated: boolean;
  loading: boolean;
  user: SessionUser | null;
  refreshSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`session_request_failed_${response.status}`);
      }

      const data = (await response.json()) as SessionResponse;

      setAuthenticated(Boolean(data.authenticated && data.user));
      setUser(data.authenticated ? data.user : null);
    } catch {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [pathname, refreshSession]);

  useEffect(() => {
    function handleFocus() {
      void refreshSession();
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      authenticated,
      loading,
      user,
      refreshSession,
    }),
    [authenticated, loading, refreshSession, user],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return context;
}
