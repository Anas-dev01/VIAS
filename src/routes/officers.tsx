import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/vias/RequireAuth";
import { createUser, deleteUser, getUsers, type User } from "@/lib/vias-store";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";

export const Route = createFileRoute("/officers")({
  component: () => (
    <RequireAuth admin>
      <OfficersPage />
    </RequireAuth>
  ),
});

function OfficersPage() {
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    password: "",
    role: "officer" as "officer" | "admin",
  });
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = async () => {
    setUsers(await getUsers());
  };

  useEffect(() => {
    loadUsers().catch((err) => toast.error((err as Error).message));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(form);
      toast.success("User created");
      setForm({ username: "", fullName: "", password: "", role: "officer" });
      await loadUsers();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const remove = async (u: User) => {
    if (u.username === "admin") {
      toast.error("Cannot delete the default admin");
      return;
    }
    if (!confirm(`Delete user ${u.username}?`)) return;
    try {
      await deleteUser(u.id);
      await loadUsers();
      toast.success("User deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage admins and security officers.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="bg-card border rounded-xl p-5 grid sm:grid-cols-5 gap-3 items-end"
      >
        <Field label="Username">
          <input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-3 py-2 rounded-md border bg-background"
          />
        </Field>
        <Field label="Full Name">
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full px-3 py-2 rounded-md border bg-background"
          />
        </Field>
        <Field label="Password">
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 rounded-md border bg-background"
          />
        </Field>
        <Field label="Role">
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "officer" | "admin" })}
            className="w-full px-3 py-2 rounded-md border bg-background"
          >
            <option value="officer">Officer</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90">
          <UserPlus className="size-4" /> Add User
        </button>
      </form>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Username</th>
              <th className="text-left px-4 py-3 font-medium">Full Name</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3 capitalize">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs border ${u.role === "admin" ? "bg-accent/15 text-accent border-accent/30" : "bg-muted"}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(u)}
                    className="p-2 rounded hover:bg-muted text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}
