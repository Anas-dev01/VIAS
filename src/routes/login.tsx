import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/vias-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, session, ready } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && session) nav({ to: "/" });
  }, [ready, session, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Welcome back");
      nav({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Branding Showcase Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground select-none">
        {/* Top Spacer - Replaced VIAS CORE mini tag */}
        <div />

        {/* Central Master Hero Branding */}
        <div className="space-y-4 max-w-xl">
          <h1 className="text-6xl font-black tracking-tight text-white uppercase">V I A S</h1>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-white tracking-wide leading-tight balance">
              Vehicle Identification and Authentication System
            </p>
            <p className="text-base text-muted-foreground tracking-wide font-medium">
              Register, monitor, and authenticate vehicles
            </p>
          </div>
        </div>

        {/* Bottom System Legal Footer */}
        <div className="text-xs opacity-50 font-mono tracking-wider">
          © {new Date().getFullYear()} ATABOR AROME · FINAL PROJECT
        </div>
      </div>

      {/* Right User Authentication Form Entry Panel */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <form onSubmit={submit} className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your credentials to access the security portal.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold tracking-wide text-muted-foreground">
                Username
              </label>
              <input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-md border bg-card transition-colors focus:border-accent outline-none"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold tracking-wide text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-md border bg-card transition-colors focus:border-accent outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-95 transition-opacity disabled:opacity-60 cursor-pointer shadow-md mt-2"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
