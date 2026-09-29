import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/vias/RequireAuth";
import { useAuth } from "@/lib/vias-auth";
import { effectiveStatus, getLogs, getUsers, getVehicles, todayBounds } from "@/lib/vias-store";
import { Car, ShieldAlert, Users, LogIn, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const tones: Record<string, string> = {
    default: "bg-card",
    success: "bg-success/10 border-success/30",
    danger: "bg-destructive/10 border-destructive/30",
    warning: "bg-warning/15 border-warning/40",
  };
  return (
    <div className={`rounded-xl border p-5 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

function DashboardPage() {
  const { session } = useAuth();
  const [data, setData] = useState({
    total: 0,
    blacklisted: 0,
    expired: 0,
    officers: 0,
    entries: 0,
    recentLogs: [] as Awaited<ReturnType<typeof getLogs>>,
  });
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [vehicles, logs, users] = await Promise.all([
        getVehicles(),
        getLogs(),
        session?.role === "admin" ? getUsers() : Promise.resolve([]),
      ]);
      const { start, end } = todayBounds();
      const todayLogs = logs.filter((l) => {
        const t = new Date(l.timestamp).getTime();
        return t >= start && t < end;
      });
      if (!cancelled) {
        setData({
          total: vehicles.length,
          blacklisted: vehicles.filter((v) => v.status === "Blacklisted").length,
          expired: vehicles.filter((v) => effectiveStatus(v) === "Expired").length,
          officers: users.filter((u) => u.role === "officer").length,
          entries: todayLogs.filter((l) => l.type === "ENTRY").length,
          recentLogs: logs.slice(0, 8),
        });
      }
    };
    load().catch(console.error);
    const i = setInterval(() => load().catch(console.error), 30000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [session?.role]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {session?.fullName}</h1>
          <p className="text-sm text-muted-foreground capitalize">{session?.role} dashboard</p>
        </div>
        <Link
          to="/authenticate"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-accent-foreground font-medium hover:opacity-90"
        >
          <ShieldCheck className="size-4" /> Authenticate Vehicle
        </Link>
      </div>

      {/* Grid container responsive utility updated to 5 columns on extra-large viewports */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Car} label="Registered Vehicles" value={data.total} />
        <StatCard icon={ShieldAlert} label="Blacklisted" value={data.blacklisted} tone="danger" />
        <StatCard icon={ShieldAlert} label="Expired" value={data.expired} tone="warning" />
        {session?.role === "admin" && (
          <StatCard icon={Users} label="Security Officers" value={data.officers} />
        )}
        <StatCard icon={LogIn} label="Today's Entries" value={data.entries} tone="success" />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Recent Activity</h2>
          <Link to="/logs" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Time</th>
                <th className="text-left px-4 py-2 font-medium">Plate</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Result</th>
                <th className="text-left px-4 py-2 font-medium">Officer</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-8">
                    No activity yet.
                  </td>
                </tr>
              )}
              {data.recentLogs.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-4 py-2">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 font-mono">{l.plateNumber}</td>
                  <td className="px-4 py-2">{l.type}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border ${
                        l.result === "GRANTED"
                          ? "bg-success/15 text-success border-success/30"
                          : "bg-destructive/15 text-destructive border-destructive/30"
                      }`}
                    >
                      {l.result}
                    </span>
                  </td>
                  <td className="px-4 py-2">{l.officerUsername}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
