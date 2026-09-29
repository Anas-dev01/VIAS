import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/vias/RequireAuth";
import { useAuth } from "@/lib/vias-auth";
import {
  deleteVehicle,
  effectiveStatus,
  getVehicles,
  setVehicleStatus,
  type Vehicle,
  type VehicleStatus,
} from "@/lib/vias-store";
import { Plus, Search, Pencil, Trash2, Ban, Check } from "lucide-react";
import { StatusBadge } from "@/components/vias/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/vehicles/")({
  component: () => (
    <RequireAuth>
      <VehiclesPage />
    </RequireAuth>
  ),
});

function VehiclesPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<VehicleStatus | "All">("All");
  const [records, setRecords] = useState<Vehicle[]>([]);

  const loadVehicles = async () => {
    setRecords(await getVehicles());
  };

  useEffect(() => {
    loadVehicles().catch((err) => toast.error((err as Error).message));
  }, []);

  const vehicles = useMemo(() => {
    let list = records.map((v) => ({ ...v, status: effectiveStatus(v) }));
    if (filter !== "All") list = list.filter((v) => v.status === filter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.plateNumber.toLowerCase().includes(s) ||
          v.ownerName.toLowerCase().includes(s) ||
          v.matricOrStaffId.toLowerCase().includes(s) ||
          v.department.toLowerCase().includes(s),
      );
    }
    return list;
  }, [q, filter, records]);

  const onDelete = async (v: Vehicle) => {
    if (!confirm(`Delete vehicle ${v.plateNumber}? This cannot be undone.`)) return;
    try {
      await deleteVehicle(v.plateNumber);
      await loadVehicles();
      toast.success("Vehicle deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onToggleBlacklist = async (v: Vehicle) => {
    const next = v.status === "Blacklisted" ? "Authorized" : "Blacklisted";
    try {
      await setVehicleStatus(v.plateNumber, next);
      await loadVehicles();
      toast.success(`Vehicle ${next.toLowerCase()}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">
            Manage registered vehicles, statuses, and blacklist.
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/vehicles/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium hover:opacity-90"
          >
            <Plus className="size-4" /> Register Vehicle
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plate, owner, ID, department…"
            className="w-full pl-10 pr-3 py-2 rounded-md border bg-card"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as VehicleStatus | "All")}
          className="px-3 py-2 rounded-md border bg-card"
        >
          {["All", "Authorized", "Unauthorized", "Expired", "Blacklisted"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Plate</th>
                <th className="text-left px-4 py-3 font-medium">Owner</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Vehicle</th>
                <th className="text-left px-4 py-3 font-medium">Valid Until</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-10">
                    No vehicles found.
                  </td>
                </tr>
              )}
              {vehicles.map((v) => (
                <tr key={v.plateNumber} className="border-t hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono font-semibold">{v.plateNumber}</td>
                  <td className="px-4 py-3">
                    <div>{v.ownerName}</div>
                    <div className="text-xs text-muted-foreground">{v.matricOrStaffId}</div>
                  </td>
                  <td className="px-4 py-3">{v.category}</td>
                  <td className="px-4 py-3">
                    {v.vehicleType}
                    <span className="text-muted-foreground"> · {v.vehicleColor}</span>
                  </td>
                  <td className="px-4 py-3">{new Date(v.validUntil).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {isAdmin && (
                        <>
                          <Link
                            to="/vehicles/$plate/edit"
                            params={{ plate: v.plateNumber }}
                            className="p-2 rounded hover:bg-muted"
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <button
                            onClick={() => onToggleBlacklist(v)}
                            className="p-2 rounded hover:bg-muted"
                            title={v.status === "Blacklisted" ? "Unblacklist" : "Blacklist"}
                          >
                            {v.status === "Blacklisted" ? (
                              <Check className="size-4 text-success" />
                            ) : (
                              <Ban className="size-4 text-destructive" />
                            )}
                          </button>
                          <button
                            onClick={() => onDelete(v)}
                            className="p-2 rounded hover:bg-muted text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
