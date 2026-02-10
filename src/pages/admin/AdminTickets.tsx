import { useEffect, useState } from "react";
import { Ticket as TicketIcon, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import type { Ticket, TicketStatus } from "@/types/tickets";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_on_customer: "Waiting on Customer",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const typeLabels: Record<string, string> = {
  support: "Support",
  bug: "Bug",
  feature: "Feature",
};

export default function AdminTickets() {
  console.log('[DEBUG] AdminTickets: Component starting render');
  console.log('[DEBUG] AdminTickets: TicketIcon=', typeof TicketIcon);
  console.log('[DEBUG] AdminTickets: Search=', typeof Search);
  console.log('[DEBUG] AdminTickets: Filter=', typeof Filter);
  console.log('[DEBUG] AdminTickets: Input=', typeof Input);
  console.log('[DEBUG] AdminTickets: Button=', typeof Button);
  const { getToken } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchTickets() {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          setError("Authentication required. Please sign in.");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/admin/tickets", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch tickets");
        }

        setTickets(data.tickets || []);
      } catch (err: any) {
        setError(err.message || "Failed to load tickets");
        toast.error(err.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [getToken]);

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      setUpdatingIds((prev) => new Set(prev).add(ticketId));

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/admin/tickets?id=${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update ticket");
      }

      // Update local state
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, ...data.ticket } : t))
      );

      toast.success("Ticket status updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update ticket status");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(ticketId);
        return next;
      });
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.subject.toLowerCase().includes(query) ||
      ticket.description.toLowerCase().includes(query) ||
      ticket.created_by_name?.toLowerCase().includes(query) ||
      ticket.created_by_email?.toLowerCase().includes(query)
    );
  });

  // Safeguard components
  const TicketComp = TicketIcon || (() => <span />);
  const SearchComp = Search || (() => <span />);
  const FilterComp = Filter || (() => <span />);
  const InputComp = Input || (() => <input />);
  const ButtonComp = Button || (() => <button />);

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <TicketComp className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Tickets</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage all support tickets from users.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchComp className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <InputComp
            placeholder="Search tickets by subject, description, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <ButtonComp variant="outline" className="border-border/60">
          <FilterComp className="w-4 h-4 mr-2" />
          Filters
        </ButtonComp>
      </div>

      {loading && (
        <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading tickets…
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <TicketComp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No tickets match your search criteria."
                  : "Support tickets will appear here once users start submitting them."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Subject</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Created By</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Priority</th>
                  <th className="text-left p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const isUpdating = updatingIds.has(ticket.id);
                  return (
                    <tr key={ticket.id} className="border-t border-border/40 hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        #{ticket.id.slice(0, 8)}
                      </td>
                      <td className="p-3">
                        <Link
                          to={`/admin/tickets/${ticket.id}`}
                          className="font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer block"
                        >
                          {ticket.subject}
                        </Link>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {ticket.description}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs capitalize">
                          {typeLabels[ticket.type] || ticket.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{ticket.created_by_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{ticket.created_by_email || ""}</div>
                      </td>
                      <td className="p-3">
                        <select
                          value={ticket.status}
                          onChange={(e) =>
                            handleStatusChange(ticket.id, e.target.value as TicketStatus)
                          }
                          disabled={isUpdating}
                          className={`rounded-md border border-border/60 bg-background px-2 py-1 text-xs font-medium ${ticket.status === "open"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                            : ticket.status === "in_progress"
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                              : ticket.status === "waiting_on_customer"
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                : ticket.status === "resolved"
                                  ? "bg-green-500/20 text-green-400 border-green-500/40"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/40"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="waiting_on_customer">Waiting on Customer</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                        {isUpdating && (
                          <div className="w-3 h-3 ml-2 inline border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${ticket.priority === "urgent"
                            ? "bg-red-500/20 text-red-400"
                            : ticket.priority === "high"
                              ? "bg-orange-500/20 text-orange-400"
                              : ticket.priority === "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                        >
                          {priorityLabels[ticket.priority]}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
