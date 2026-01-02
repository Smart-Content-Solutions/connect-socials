import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

type Role = "admin" | "early_access" | "user";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: number;
};

const roleLabel: Record<Role, string> = {
  admin: "Admin",
  early_access: "Early Access",
  user: "User",
};

export default function UsersPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingRoles, setPendingRoles] = useState<Record<string, Role>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedMsg, setSavedMsg] = useState<Record<string, string>>({});

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isLoaded) {
        throw new Error("Auth is still loading. Please refresh and try again.");
      }

      if (!isSignedIn) {
        throw new Error("You must be signed in to view this page.");
      }

      const token = await getToken();
      if (!token) {
        throw new Error("Missing auth token. Please sign out and sign back in.");
      }

      const res = await fetch("/api/admin-users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load users");
      }

      const list: AdminUser[] = data.users || [];
      setUsers(list);

      const init: Record<string, Role> = {};
      for (const u of list) {
        const r = (u.role || "user").toString().toLowerCase();
        init[u.id] =
          r === "admin" || r === "early_access" || r === "user"
            ? (r as Role)
            : "user";
      }
      setPendingRoles(init);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      setError("You must be signed in to view this page.");
      return;
    }

    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const rows = useMemo(() => users, [users]);

  const setRoleFor = (userId: string, role: Role) => {
    setPendingRoles((prev) => ({ ...prev, [userId]: role }));
    setSavedMsg((prev) => ({ ...prev, [userId]: "" }));
  };

  const saveRole = async (userId: string) => {
    const role = pendingRoles[userId] || "user";

    try {
      setSaving((prev) => ({ ...prev, [userId]: true }));
      setSavedMsg((prev) => ({ ...prev, [userId]: "" }));

      if (!isLoaded) throw new Error("Auth is still loading. Try again.");
      if (!isSignedIn) throw new Error("You must be signed in to make changes.");

      const token = await getToken();
      if (!token) throw new Error("Missing auth token. Please sign out/in.");

      const res = await fetch("/api/admin-update-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update role");
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));

      setSavedMsg((prev) => ({ ...prev, [userId]: "Saved" }));
      setTimeout(() => {
        setSavedMsg((prev) => ({ ...prev, [userId]: "" }));
      }, 1500);
    } catch (e: any) {
      setSavedMsg((prev) => ({ ...prev, [userId]: e.message || "Failed" }));
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">
          Manage user roles. “Early Access” is for customers who purchased your
          Early Access plan.
        </p>
      </div>

      {loading && <div>Loading users…</div>}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={4}>
                    No users found.
                  </td>
                </tr>
              ) : (
                rows.map((u) => {
                  const current = pendingRoles[u.id] || "user";
                  const isSavingRow = !!saving[u.id];
                  const msg = savedMsg[u.id] || "";

                  return (
                    <tr key={u.id} className="border-t border-border/40">
                      <td className="p-3">{u.name || "—"}</td>
                      <td className="p-3">{u.email || "—"}</td>
                      <td className="p-3">
                        <select
                          className="rounded-md border border-border/60 bg-background px-3 py-2"
                          value={current}
                          onChange={(e) =>
                            setRoleFor(u.id, e.target.value as Role)
                          }
                        >
                          <option value="user">{roleLabel.user}</option>
                          <option value="early_access">{roleLabel.early_access}</option>
                          <option value="admin">{roleLabel.admin}</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <button
                            className="rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-60"
                            onClick={() => saveRole(u.id)}
                            disabled={isSavingRow}
                          >
                            {isSavingRow ? "Saving…" : "Save"}
                          </button>
                          {msg && (
                            <span className="text-xs text-muted-foreground">
                              {msg}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
