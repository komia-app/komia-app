import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { base44, base44Urls } from "@/lib/base44";
import type { User } from "@/types/entities";

import { classifyAuthError, isAuthRejection, type SessionError } from "./auth-errors";
import { sessionStore } from "./session-store";

export type SessionState =
  | { status: "loading" }
  | { status: "signed-out"; error?: SessionError }
  | { status: "signed-in"; user: User };

interface SessionContextValue {
  state: SessionState;
  signIn(token: string): Promise<void>;
  signOut(): Promise<void>;
  refreshUser(): Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// The SDK has no public way to drop its bearer header without a page redirect,
// so signing out replaces it with a value the backend will reject.
const SIGNED_OUT_TOKEN = "signed-out";

async function fetchUser(): Promise<User> {
  return (await base44.auth.me()) as User;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const signIn = useCallback(async (token: string) => {
    base44.auth.setToken(token, false);
    await sessionStore.setToken(token);
    const user = await fetchUser();
    setState({ status: "signed-in", user });
  }, []);

  const signOut = useCallback(async () => {
    await sessionStore.clearToken();
    setState({ status: "signed-out" });
    base44.auth.setToken(SIGNED_OUT_TOKEN, false);
    try {
      await fetch(`${base44Urls.appBaseUrl}/api/apps/auth/logout`, { method: "GET" });
    } catch {
      // Best effort: the local token is already gone.
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await fetchUser();
    setState({ status: "signed-in", user });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await base44.app.getPublicSettings();
        const token = await sessionStore.getToken();
        if (!token) {
          if (!cancelled) setState({ status: "signed-out" });
          return;
        }
        base44.auth.setToken(token, false);
        const user = await fetchUser();
        if (!cancelled) setState({ status: "signed-in", user });
      } catch (error) {
        // Only a rejected token clears the session; an outage or offline boot keeps it
        // so the next launch can retry.
        if (isAuthRejection(error)) await sessionStore.clearToken();
        if (!cancelled) setState({ status: "signed-out", error: classifyAuthError(error) ?? undefined });
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ state, signIn, signOut, refreshUser }),
    [state, signIn, signOut, refreshUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

export function useCurrentUser(): User {
  const { state } = useSession();
  if (state.status !== "signed-in") throw new Error("useCurrentUser called while signed out");
  return state.user;
}
