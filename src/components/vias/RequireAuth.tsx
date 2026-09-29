import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/vias-auth";
import { AppShell } from "./AppShell";

export function RequireAuth({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const { session, ready } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!session) nav({ to: "/login" });
    else if (admin && session.role !== "admin") nav({ to: "/" });
  }, [ready, session, admin, nav]);

  if (!ready || !session) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }
  if (admin && session.role !== "admin") return null;
  return <AppShell>{children}</AppShell>;
}
