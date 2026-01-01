import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, UserCircle2, Mail, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminSubscription {
  id: string;
  status: string;
  customerEmail?: string | null;
  customerName?: string | null;
  priceNickname?: string | null;
  interval?: string | null;
  created?: number; // unix seconds
  currentPeriodEnd?: number; // unix seconds
  cancelAt?: number | null;
  cancelAtPeriodEnd?: number | null;
}

interface AdminStripeResponse {
  stats?: {
    total?: number;
    active?: number;
    trialing?: number;
    canceled?: number;
  };
  subscriptions?: AdminSubscription[];
}

const statusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "trialing":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "canceled":
    case "unpaid":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "past_due":
      return "bg-orange-500/15 text-orange-300 border-orange-500/30";
    default:
      return "bg-slate-500/15 text-slate-200 border-slate-500/30";
  }
};

const formatUnix = (value?: number) => {
  if (!value) return "—";
  try {
    return format(new Date(value * 1000), "MMM d, yyyy");
  } catch {
    return "—";
  }
};

export default function SubscribersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    trialing: 0,
    canceled: 0,
  });

  useEffect(() => {
    async function fetchSubscribers() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin-stripe-subscriptions");

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const json: AdminStripeResponse = await res.json();

        setSubscriptions(json.subscriptions || []);
        setStats({
          total: json.stats?.total ?? 0,
          active: json.stats?.active ?? 0,
          trialing: json.stats?.trialing ?? 0,
          canceled: json.stats?.canceled ?? 0,
        });
      } catch (err: any) {
        console.error("Failed to load Stripe subscribers", err);
        setError(
          err?.message ||
            "Could not load subscribers. Check the admin Stripe API route."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchSubscribers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Stripe Subscribers
          </h1>
          <p className="text-muted-foreground mt-1">
            View customers on the SCS Early Access plan (Stripe test mode right
            now).
          </p>
        </div>

        {/* Small summary chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700 text-slate-100">
            Total: <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-700 text-emerald-100">
            Active: <span className="font-semibold">{stats.active}</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-amber-900/40 border border-amber-700 text-amber-100">
            Trialing: <span className="font-semibold">{stats.trialing}</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-red-900/40 border border-red-700 text-red-100">
            Cancelled: <span className="font-semibold">{stats.canceled}</span>
          </div>
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-500/40 bg-red-900/20 p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-100">
              Problem loading subscribers
            </p>
            <p className="text-xs text-red-200 mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Table / Loader */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-xl overflow-hidden glass"
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">
              No Stripe subscribers found yet.
            </p>
            <p className="text-xs text-tertiary mt-1">
              Complete a test checkout for the Early Access plan to see
              customers here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Customer
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Plan
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Started
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Current Period Ends
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Subscription ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptions.map((sub, index) => (
                  <motion.tr
                    key={sub.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + index * 0.03 }}
                    className="hover:bg-white/5/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center">
                          <UserCircle2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground">
                            {sub.customerName || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {sub.customerEmail || "No email"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col text-sm">
                        <span className="text-foreground">
                          {sub.priceNickname || "Early Access Plan"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {sub.interval ? `Billed ${sub.interval}` : "Subscription"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] px-2 py-0.5 border",
                          statusColor(sub.status)
                        )}
                      >
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatUnix(sub.created)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatUnix(sub.currentPeriodEnd)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-tertiary">
                        {sub.id}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
