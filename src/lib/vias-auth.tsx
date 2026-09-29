import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getSession, login as doLogin, logout as doLogout, type Session } from "./vias-store";

interface AuthCtx {
  session: Session | null;
  login: (u: string, p: string) => Promise<Session>;
  logout: () => Promise<void>;
  ready: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const s = await doLogin(u, p);
    setSession(s);
    return s;
  }, []);

  const logout = useCallback(async () => {
    await doLogout();
    setSession(null);
  }, []);

  return <Ctx.Provider value={{ session, login, logout, ready }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
