import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/vias/RequireAuth";
import { getLogs, type LogEntry } from "@/lib/vias-store";
import { RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/logs")({
  component: () => (
    <RequireAuth>
      <LogsPage />
    </RequireAuth>
  ),
});

function LogsPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"All" | "ENTRY" | "EXIT">("All");
  const [date, setDate] = useState("");
  const [records, setRecords] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      setRecords(await getLogs());
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const logs = useMemo(() => {
    let list = records;
    if (type !== "All") list = list.filter((l) => l.type === type);
    if (date) {
      const d = new Date(date);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const end = start + 86400000;
      list = list.filter((l) => {
        const t = new Date(l.timestamp).getTime();
        return t >= start && t < end;
      });
    }
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.plateNumber.toLowerCase().includes(s) || l.officerUsername.toLowerCase().includes(s),
      );
    }
    return list;
  }, [q, type, date, records]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Logs</h1>
          <p className="text-sm text-muted-foreground">All vehicle movements at the gate.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-card hover:bg-muted text-sm disabled:opacity-60"
          >
            <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-md border bg-card hover:bg-muted text-sm"
          >
            Print
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plate or officer…"
            className="w-full pl-10 pr-3 py-2 rounded-md border bg-card"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "All" | "ENTRY" | "EXIT")}
          className="px-3 py-2 rounded-md border bg-card"
        >
          <option>All</option>
          <option value="ENTRY">Entry</option>
          <option value="EXIT">Exit</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-md border bg-card"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="text-left px-4 py-3 font-medium">Plate</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Result</th>
                <th className="text-left px-4 py-3 font-medium">Officer</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground">
                    {loading ? "Loading logs..." : "No logs found."}
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-4 py-3">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono font-medium">{l.plateNumber}</td>
                  <td className="px-4 py-3">{l.type}</td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">{l.officerUsername}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
