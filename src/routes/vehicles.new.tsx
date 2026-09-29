import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RequireAuth } from "@/components/vias/RequireAuth";
import {
  findVehicle,
  upsertVehicle,
  type Vehicle,
  type VehicleCategory,
  type VehicleStatus,
} from "@/lib/vias-store";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, Upload, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/vehicles/new")({
  component: () => (
    <RequireAuth admin>
      <VehicleFormPage mode="new" />
    </RequireAuth>
  ),
});

export function VehicleFormPage({ mode, plate }: { mode: "new" | "edit"; plate?: string }) {
  const nav = useNavigate();
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Internal state tracking for the vehicle type dropdown selection separate from model text
  const [vehicleClass, setVehicleClass] = useState("Car");
  const [modelName, setModelName] = useState("");
  const [imageName, setImageName] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Vehicle>(() => ({
    plateNumber: "",
    ownerName: "",
    matricOrStaffId: "",
    department: "",
    phone: "",
    vehicleType: "Car",
    vehicleColor: "",
    category: "Staff",
    imageDataUrl: undefined,
    registrationDate: new Date().toISOString(),
    validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    status: "Authorized",
  }));
  const [originalPlate, setOriginalPlate] = useState<string | undefined>();

  useEffect(() => {
    if (mode === "new") {
      const prefillPlate = new URLSearchParams(window.location.search)
        .get("plate")
        ?.trim()
        .toUpperCase();
      if (prefillPlate) {
        setForm((f) => ({ ...f, plateNumber: prefillPlate }));
      }
    }

    if (mode === "edit" && plate) {
      findVehicle(plate)
        .then((v) => {
          if (v) {
            setForm(v);
            setOriginalPlate(v.plateNumber);

            // Parse vehicleType string to split classification from model if stored cleanly
            const parts = v.vehicleType.split(" - ");
            if (["Car", "Bike", "Tricycle"].includes(parts[0])) {
              setVehicleClass(parts[0]);
              setModelName(parts[1] || "");
            } else {
              setModelName(v.vehicleType);
            }
          } else {
            toast.error("Vehicle not found");
            nav({ to: "/vehicles" });
          }
        })
        .catch((err) => {
          toast.error((err as Error).message);
          nav({ to: "/vehicles" });
        });
    }
  }, [mode, plate, nav]);

  // Automatically manage generation of unique identity profiles for Business Persons
  useEffect(() => {
    if (form.category === "Business Person" && !form.matricOrStaffId.startsWith("BUS-")) {
      const randomId = `BUS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      setForm((f) => ({ ...f, matricOrStaffId: randomId }));
    } else if (form.category !== "Business Person" && form.matricOrStaffId.startsWith("BUS-")) {
      // Clear it out if switching back to an official institutional role
      setForm((f) => ({ ...f, matricOrStaffId: "" }));
    }
  }, [form.category, form.matricOrStaffId]);

  // Combine vehicle classification dropdown and model label input into a single string for storage
  useEffect(() => {
    const combinedType = modelName.trim() ? `${vehicleClass} - ${modelName.trim()}` : vehicleClass;
    setForm((f) => ({ ...f, vehicleType: combinedType }));
  }, [vehicleClass, modelName]);

  const update = <K extends keyof Vehicle>(k: K, v: Vehicle[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onImage = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update("imageDataUrl", reader.result as string);
      setImageName(file.name);
    };
    reader.onerror = () => toast.error("Could not read the selected image");
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "new" && !form.imageDataUrl) {
      toast.error("Please add a vehicle image before registration");
      return;
    }
    setSaving(true);
    try {
      await upsertVehicle(form, originalPlate);
      toast.success(mode === "new" ? "Vehicle registered" : "Vehicle updated");
      nav({ to: "/vehicles" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Determine dynamic input field labels based on current category selection
  const getIdLabel = () => {
    switch (form.category) {
      case "Student":
        return "Matric Number *";
      case "Staff":
        return "Staff ID *";
      case "Visitor":
        return "Visitor's ID *";
      case "Business Person":
        return "Business ID (Auto-Generated) *";
      default:
        return "Identification Number *";
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/vehicles" className="p-2 rounded hover:bg-muted">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "new" ? "Register Vehicle" : "Edit Vehicle"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Plate number is the unique identifier for each vehicle.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-card border rounded-xl p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-3">
          <label className="text-sm font-medium">Vehicle Image</label>
          <div className="aspect-square rounded-lg border bg-muted overflow-hidden grid place-items-center">
            {form.imageDataUrl ? (
              <img src={form.imageDataUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="grid place-items-center gap-2 text-muted-foreground">
                <ImagePlus className="size-10" />
                <span className="text-xs">No image selected</span>
              </div>
            )}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => onImage(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <Upload className="size-4" />
              {form.imageDataUrl ? "Change" : "Upload"}
            </button>
            {form.imageDataUrl && (
              <button
                type="button"
                onClick={() => {
                  update("imageDataUrl", undefined);
                  setImageName("");
                  if (imageInputRef.current) imageInputRef.current.value = "";
                }}
                className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm text-destructive hover:bg-muted"
                title="Remove image"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="min-h-4 text-xs text-muted-foreground">
            {imageName ||
              (form.imageDataUrl ? "Saved vehicle image" : "JPG, PNG, or WEBP under 2MB")}
          </div>
        </div>

        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
          <Input
            label="Plate Number *"
            value={form.plateNumber}
            onChange={(v) => update("plateNumber", v.toUpperCase())}
            mono
            required
          />

          <Select
            label="Category *"
            value={form.category}
            onChange={(v) => update("category", v as VehicleCategory)}
            options={["Staff", "Student", "Visitor", "Business Person"]}
          />

          <Input
            label="Owner Full Name *"
            value={form.ownerName}
            onChange={(v) => update("ownerName", v)}
            required
          />
          <Input
            label={getIdLabel()}
            value={form.matricOrStaffId}
            onChange={(v) => update("matricOrStaffId", v)}
            disabled={form.category === "Business Person"}
            required
          />

          <Input
            label="Department"
            value={form.department}
            onChange={(v) => update("department", v)}
          />
          <Input label="Phone Number" value={form.phone} onChange={(v) => update("phone", v)} />

          {/* Re-engineered composite classification field matching your dropdown requirement */}
          <div className="grid grid-cols-3 gap-2 sm:col-span-1">
            <div className="col-span-1">
              <Select
                label="Type *"
                value={vehicleClass}
                onChange={(v) => setVehicleClass(v)}
                options={["Car", "Bike", "Tricycle"]}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Model Description *"
                placeholder="e.g. Corolla, Boxer, Piaggio"
                value={modelName}
                onChange={(v) => setModelName(v)}
                required
              />
            </div>
          </div>

          <Input
            label="Vehicle Color *"
            value={form.vehicleColor}
            onChange={(v) => update("vehicleColor", v)}
            required
          />

          <Input
            label="Registration Date"
            type="date"
            value={form.registrationDate.slice(0, 10)}
            onChange={(v) => update("registrationDate", new Date(v).toISOString())}
          />
          <Input
            label="Valid Until *"
            type="date"
            value={form.validUntil.slice(0, 10)}
            onChange={(v) => update("validUntil", new Date(v).toISOString())}
            required
          />

          {/* This dropdown will now only render when editing an existing record */}
          {mode === "edit" && (
            <Select
              label="Status"
              value={form.status}
              onChange={(v) => update("status", v as VehicleStatus)}
              options={["Authorized", "Unauthorized", "Blacklisted"]}
            />
          )}

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Link to="/vehicles" className="px-4 py-2 rounded-md border hover:bg-muted text-sm">
              Cancel
            </Link>
            <button
              disabled={saving}
              className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 text-sm disabled:opacity-60"
            >
              {saving ? "Saving..." : mode === "new" ? "Register Vehicle" : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  disabled,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={`mt-1 w-full px-3 py-2 rounded-md border bg-background disabled:opacity-60 disabled:bg-muted ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-md border bg-background"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
