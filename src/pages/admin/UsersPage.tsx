import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin-users", { method: "GET" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load users");
        }

        setUsers(data.users || []);
      } catch (e: any) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">
          All signed-up users in Clerk (read-only for now).
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
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={3}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-border/40">
                    <td className="p-3">{u.name || "—"}</td>
                    <td className="p-3">{u.email || "—"}</td>
                    <td className="p-3">{u.role}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
