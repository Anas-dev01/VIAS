export type VehicleStatus = "Authorized" | "Unauthorized" | "Expired" | "Blacklisted";
export type VehicleCategory = "Staff" | "Student" | "Visitor" | "Business Person";
export type UserRole = "admin" | "officer";

export interface Vehicle {
  plateNumber: string;
  ownerName: string;
  matricOrStaffId: string;
  department: string;
  phone: string;
  vehicleType: string;
  vehicleColor: string;
  category: VehicleCategory;
  imageDataUrl?: string;
  registrationDate: string;
  validUntil: string;
  status: VehicleStatus;
}

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  plateNumber: string;
  type: "ENTRY" | "EXIT";
  timestamp: string;
  officerUsername: string;
  result: "GRANTED" | "DENIED";
  reason?: string;
}

export interface Session {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const data = (await response.json().catch(() => null)) as T | { error?: string } | null;
  if (!response.ok) {
    throw new Error((data && "error" in data && data.error) || "Database request failed");
  }
  return data as T;
}

export const getUsers = () => api<User[]>("/api/users");
export function createUser(u: Omit<User, "id" | "createdAt">) {
  return api<User>("/api/users", { method: "POST", body: JSON.stringify(u) });
}
export function deleteUser(id: string) {
  return api<{ ok: true }>(`/api/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export const getVehicles = () => api<Vehicle[]>("/api/vehicles");
export function findVehicle(plate: string) {
  return api<Vehicle | null>(`/api/vehicles/${encodeURIComponent(plate.trim().toUpperCase())}`);
}
export function upsertVehicle(v: Vehicle, originalPlate?: string) {
  const plate = v.plateNumber.trim().toUpperCase();
  const payload = { ...v, plateNumber: plate };
  return api<Vehicle>(
    originalPlate ? `/api/vehicles/${encodeURIComponent(originalPlate)}` : "/api/vehicles",
    {
      method: originalPlate ? "PUT" : "POST",
      body: JSON.stringify(payload),
    },
  );
}
export function deleteVehicle(plate: string) {
  return api<{ ok: true }>(`/api/vehicles/${encodeURIComponent(plate)}`, { method: "DELETE" });
}
export function setVehicleStatus(plate: string, status: VehicleStatus) {
  return api<{ ok: true }>(`/api/vehicles/${encodeURIComponent(plate)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function effectiveStatus(v: Vehicle): VehicleStatus {
  if (v.status === "Blacklisted") return "Blacklisted";
  if (v.status === "Unauthorized") return "Unauthorized";
  if (new Date(v.validUntil).getTime() < Date.now()) return "Expired";
  return v.status;
}

export const getLogs = () => api<LogEntry[]>("/api/logs");
export function addLog(entry: Omit<LogEntry, "id" | "timestamp">) {
  return api<LogEntry>("/api/logs", { method: "POST", body: JSON.stringify(entry) });
}

export function getSession() {
  return api<Session | null>("/api/session");
}
export function login(username: string, password: string) {
  return api<Session>("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}
export function logout() {
  return api<{ ok: true }>("/api/logout", { method: "POST" });
}

export function todayBounds() {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const end = start + 86400000;
  return { start, end };
}
