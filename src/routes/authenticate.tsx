import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RequireAuth } from "@/components/vias/RequireAuth";
import { useAuth } from "@/lib/vias-auth";
import { addLog, effectiveStatus, findVehicle, type Vehicle } from "@/lib/vias-store";
import { CarFront, ShieldCheck, ShieldX, Search, ImageOff } from "lucide-react";
import { StatusBadge } from "@/components/vias/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/authenticate")({
  component: () => (
    <RequireAuth>
      <AuthenticatePage />
    </RequireAuth>
  ),
});

interface Result {
  vehicle: Vehicle | null;
  granted: boolean;
  reason: string;
  searchedPlate: string;
}

function AuthenticatePage() {
  const { session } = useAuth();
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = plate.trim().toUpperCase();
    if (!p) return;

    setResult(null);
    setLoading(true);

    try {
      const v = await findVehicle(p);
      if (!v) {
        const fallbackResult: Result = {
          vehicle: null,
          granted: false,
          reason: "Vehicle not registered in system",
          searchedPlate: p,
        };
        setResult(fallbackResult);

        if (session) {
          await addLog({
            plateNumber: p,
            type: "ENTRY",
            officerUsername: session.username,
            result: "DENIED",
            reason: fallbackResult.reason,
          });
          toast.error(`Access Denied: Logged for ${p}`);
        }
        return;
      }

      const status = effectiveStatus(v);
      const granted = status === "Authorized";
      const reason =
        status === "Authorized"
          ? "Vehicle is authorized"
          : status === "Blacklisted"
            ? "Vehicle is blacklisted"
            : status === "Expired"
              ? "Authorization period has expired"
              : "Vehicle marked unauthorized";

      setResult({ vehicle: { ...v, status }, granted, reason, searchedPlate: p });

      if (session) {
        await addLog({
          plateNumber: p,
          type: "ENTRY",
          officerUsername: session.username,
          result: granted ? "GRANTED" : "DENIED",
          reason,
        });

        if (granted) toast.success(`Access GRANTED: Entry logged for ${p}`);
        else toast.error(`Access DENIED: Entry logged for ${p}`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Gate Authentication</h1>
        <p className="text-sm text-muted-foreground">
          Enter the vehicle plate number to verify authorization.
        </p>
      </div>

      <form onSubmit={onSearch} className="flex gap-2 bg-card rounded-xl border p-3">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="e.g. ABC-123-XY"
            className="w-full pl-10 pr-3 py-3 rounded-md border bg-background font-mono text-lg tracking-wider uppercase"
          />
        </div>
        <button
          disabled={loading}
          className="px-6 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Checking..." : "Authenticate"}
        </button>
      </form>

      {result && (
        <div
          className={`rounded-xl border-2 overflow-hidden ${
            result.granted ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
          }`}
        >
          <div
            className={`px-6 py-4 flex items-center gap-3 text-white ${
              result.granted ? "bg-success" : "bg-destructive"
            }`}
          >
            {result.granted ? <ShieldCheck className="size-8" /> : <ShieldX className="size-8" />}
            <div>
              <div className="text-2xl font-bold tracking-wide">
                {result.granted ? "ACCESS GRANTED" : "ACCESS DENIED"}
              </div>
              <div className="text-sm opacity-90">{result.reason}</div>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              {result.vehicle?.imageDataUrl ? (
                <img
                  src={result.vehicle.imageDataUrl}
                  alt={result.vehicle.plateNumber}
                  className="w-full aspect-square object-cover rounded-lg border"
                />
              ) : (
                <div className="w-full aspect-square rounded-lg border bg-muted grid place-items-center text-muted-foreground">
                  <ImageOff className="size-10" />
                </div>
              )}
            </div>
            <div className="md:col-span-2 space-y-3">
              {result.vehicle ? (
                <>
                  <Field label="Plate Number" value={result.vehicle.plateNumber} mono />
                  <Field label="Owner" value={result.vehicle.ownerName} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Matric / Staff ID" value={result.vehicle.matricOrStaffId} />
                    <Field label="Department" value={result.vehicle.department} />
                    <Field label="Vehicle" value={result.vehicle.vehicleType} />
                    <Field label="Color" value={result.vehicle.vehicleColor} />
                    <Field label="Category" value={result.vehicle.category} />
                    <Field
                      label="Valid Until"
                      value={new Date(result.vehicle.validUntil).toLocaleDateString()}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <StatusBadge status={result.vehicle.status} />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-muted-foreground">
                    No vehicle record found for{" "}
                    <span className="font-mono">{result.searchedPlate}</span>. This vehicle has not
                    been registered.
                  </div>
                  <Link
                    to="/vehicles/new"
                    search={{ plate: result.searchedPlate }}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    <CarFront className="size-4" />
                    Register Vehicle
                  </Link>
                </div>
              )}

              {/* ACTION BUTTON ROW REMOVED FROM HERE */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
