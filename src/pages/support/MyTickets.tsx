import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Ticket as TicketIcon, Plus, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import type { Ticket } from "@/types/tickets";

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_on_customer: "Waiting on Customer",
  resolved: "Resolved",
  closed: "Closed",
};

const typeLabels: Record<string, string> = {
  support: "Support",
  bug: "Bug",
  feature: "Feature",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-500/20 text-gray-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  waiting_on_customer: "bg-purple-500/20 text-purple-400",
  resolved: "bg-green-500/20 text-green-400",
  closed: "bg-gray-500/20 text-gray-400",
};

export default function MyTickets() {
  console.log('[DEBUG] MyTickets: Component starting render');
  const { getToken } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const response = await fetch("/api/tickets", {
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
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, [getToken]);

  return (
    <div className="min-h-screen pt-24 pb-20">
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#E1C37A]/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#D6D7D8]/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-[#E1C37A]/10 border border-[#E1C37A]/20">
                <TicketIcon className="w-5 h-5 text-[#E1C37A]" />
                <span className="text-sm font-medium text-[#E1C37A]">Support</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">My Tickets</h1>
              <p className="text-[#A9AAAC] text-lg mb-6">
                View and manage your support tickets
              </p>
              <Link to="/support/new">
                <Button className="btn-gold inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Open a New Ticket
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card rounded-3xl p-8 md:p-12"
          >
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#E1C37A]" />
                <p className="text-[#A9AAAC]">Loading tickets...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 mb-6">
                {error}
              </div>
            )}

            {!loading && !error && tickets.length === 0 && (
              <div className="text-center py-16">
                <TicketIcon className="w-16 h-16 mx-auto mb-6 text-[#E1C37A] opacity-50" />
                <h2 className="text-2xl font-semibold mb-4">No tickets yet</h2>
                <p className="text-[#A9AAAC] mb-8 max-w-md mx-auto">
                  You haven't created any support tickets yet. Click the button above to open a new ticket.
                </p>
              </div>
            )}

            {!loading && !error && tickets.length > 0 && (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/support/${ticket.id}`}
                    className="block p-6 rounded-xl bg-[#1A1A1C] border border-[#3B3C3E] hover:border-[#E1C37A]/30 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[#D6D7D8]">{ticket.subject}</h3>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[ticket.status] || statusColors.open}`}>
                            {statusLabels[ticket.status] || ticket.status}
                          </span>
                        </div>
                        <p className="text-sm text-[#A9AAAC] mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#A9AAAC]">
                          <span className="inline-flex items-center gap-1">
                            <span className="capitalize">{typeLabels[ticket.type] || ticket.type}</span>
                          </span>
                          <span className={`px-2 py-1 rounded-md font-medium ${priorityColors[ticket.priority] || priorityColors.medium}`}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </span>
                          {ticket.module && (
                            <span className="capitalize">{ticket.module}</span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
