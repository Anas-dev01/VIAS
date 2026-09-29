import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Car,
  ShieldCheck,
  ClipboardList,
  Users,
  FileBarChart2,
  LogOut,
  CircleUser,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/vias-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "officer"] as const },
  {
    to: "/authenticate",
    label: "Gate Authentication",
    icon: ShieldCheck,
    roles: ["admin", "officer"] as const,
  },
  { to: "/vehicles", label: "Vehicles", icon: Car, roles: ["admin", "officer"] as const },
  { to: "/logs", label: "Logs", icon: ClipboardList, roles: ["admin", "officer"] as const },
  { to: "/officers", label: "Officers", icon: Users, roles: ["admin"] as const },
  { to: "/reports", label: "Reports", icon: FileBarChart2, roles: ["admin"] as const },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  if (!session) return null;

  const items = NAV.filter((n) => (n.roles as readonly string[]).includes(session.role));

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transform transition-transform lg:transform-none",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-accent text-accent-foreground grid place-items-center font-bold">
              V
            </div>
            <div>
              <div className="font-semibold tracking-wide">VIAS</div>
              <div className="text-xs opacity-70">Campus Gate Control</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((it) => {
            const active = path === it.to;
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="size-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-3">
            <CircleUser className="size-5" />
            <div className="text-sm">
              <div className="font-medium leading-tight">{session.fullName}</div>
              <div className="text-xs opacity-70 capitalize">{session.role}</div>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              nav({ to: "/login" });
            }}
            className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md bg-sidebar-accent hover:opacity-90"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 lg:px-8 border-b bg-card">
          <button className="lg:hidden p-2" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </button>
          <div className="font-semibold">Vehicle Identity Authentication System</div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
