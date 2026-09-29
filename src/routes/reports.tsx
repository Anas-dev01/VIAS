import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/vias/RequireAuth";
import {
  effectiveStatus,
  getLogs,
  getVehicles,
  todayBounds,
  type LogEntry,
  type Vehicle,
} from "@/lib/vias-store";
import { StatusBadge } from "@/components/vias/StatusBadge";
import { Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  component: () => (
    <RequireAuth admin>
      <ReportsPage />
    </RequireAuth>
  ),
});

function ReportsPage() {
  const [records, setRecords] = useState<{ vehicles: Vehicle[]; logs: LogEntry[] }>({
    vehicles: [],
    logs: [],
  });

  useEffect(() => {
    Promise.all([getVehicles(), getLogs()])
      .then(([vehicles, logs]) => setRecords({ vehicles, logs }))
      .catch((err) => toast.error((err as Error).message));
  }, []);

  const data = useMemo(() => {
    const vehicles = records.vehicles.map((v) => ({ ...v, status: effectiveStatus(v) }));
    const logs = records.logs;
    const { start, end } = todayBounds();
    const today = logs.filter((l) => {
      const t = new Date(l.timestamp).getTime();
      return t >= start && t < end;
    });
    return {
      vehicles,
      blacklisted: vehicles.filter((v) => v.status === "Blacklisted"),
      expired: vehicles.filter((v) => v.status === "Expired"),
      visitors: vehicles.filter((v) => v.category === "Visitor"),
      entries: today.filter((l) => l.type === "ENTRY"),
      history: logs.slice(0, 50),
    };
  }, [records]);

  const exportCsv = () => {
    const rows = [
      ["Plate", "Owner", "Category", "Vehicle", "Color", "Valid Until", "Status"],
      ...data.vehicles.map((v) => [
        v.plateNumber,
        v.ownerName,
        v.category,
        v.vehicleType,
        v.vehicleColor,
        new Date(v.validUntil).toLocaleDateString(),
        v.status,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vias-vehicles-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generated from current MySQL records.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="px-4 py-2 rounded-md border bg-card hover:bg-muted text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
          >
            <Printer className="size-4" /> Print
          </button>
        </div>
      </div>

      <Summary
        items={[
          { label: "Registered Vehicles", value: data.vehicles.length },
          { label: "Blacklisted", value: data.blacklisted.length },
          { label: "Expired", value: data.expired.length },
          { label: "Visitors", value: data.visitors.length },
          { label: "Today's Entries", value: data.entries.length },
        ]}
      />

      <Section title="Registered Vehicles">
        <VehicleTable rows={data.vehicles} />
      </Section>

      <Section title="Blacklisted Vehicles">
        <VehicleTable rows={data.blacklisted} />
      </Section>

      {/* <Section title="Visitor Records">
        <VehicleTable rows={data.visitors} />
      </Section> */}

      <Section title="Authentication History (latest 50)">
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
            {data.history.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="px-4 py-2">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2 font-mono">{l.plateNumber}</td>
                <td className="px-4 py-2">{l.type}</td>
                <td className="px-4 py-2">{l.result}</td>
                <td className="px-4 py-2">{l.officerUsername}</td>
              </tr>
            ))}
            {data.history.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-muted-foreground">
                  No records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Summary({ items }: { items: { label: string; value: number }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg border bg-card p-4">
          <div className="text-xs text-muted-foreground">{it.label}</div>
          <div className="text-2xl font-bold mt-1">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b font-semibold">{title}</div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function VehicleTable({ rows }: { rows: Vehicle[] }) {
  if (rows.length === 0)
    return <div className="text-center py-6 text-muted-foreground text-sm">No records.</div>;
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted text-muted-foreground">
        <tr>
          <th className="text-left px-4 py-2 font-medium">Plate</th>
          <th className="text-left px-4 py-2 font-medium">Owner</th>
          <th className="text-left px-4 py-2 font-medium">Category</th>
          <th className="text-left px-4 py-2 font-medium">Vehicle</th>
          <th className="text-left px-4 py-2 font-medium">Valid Until</th>
          <th className="text-left px-4 py-2 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((v) => (
          <tr key={v.plateNumber} className="border-t">
            <td className="px-4 py-2 font-mono">{v.plateNumber}</td>
            <td className="px-4 py-2">{v.ownerName}</td>
            <td className="px-4 py-2">{v.category}</td>
            <td className="px-4 py-2">
              {v.vehicleType} · {v.vehicleColor}
            </td>
            <td className="px-4 py-2">{new Date(v.validUntil).toLocaleDateString()}</td>
            <td className="px-4 py-2">
              <StatusBadge status={v.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
