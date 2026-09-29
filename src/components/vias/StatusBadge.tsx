import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/lib/vias-store";

export function StatusBadge({ status }: { status: VehicleStatus }) {
  const map: Record<VehicleStatus, string> = {
    Authorized: "bg-success/15 text-success border-success/30",
    Unauthorized: "bg-destructive/15 text-destructive border-destructive/30",
    Expired: "bg-warning/20 text-warning-foreground border-warning/40",
    Blacklisted: "bg-destructive text-destructive-foreground border-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        map[status],
      )}
    >
      {status}
    </span>
  );
}
