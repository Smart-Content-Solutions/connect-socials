import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Clock, Trophy, XCircle, Calendar, CalendarCheck, CalendarClock, CheckCircle, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { PipelineChart } from '@/components/admin/dashboard/PipelineChart';
import { ActivityFeed } from '@/components/admin/dashboard/ActivityFeed';
import { RecentLeadsTable } from '@/components/admin/dashboard/RecentLeadsTable';
import { UpcomingCallsCard } from '@/components/admin/dashboard/UpcomingCallsCard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DashboardStats {
  leads: {
    total: number;
    new: number;
    inProgress: number;
    won: number;
    lost: number;
  };
  calls: {
    today: number;
    week: number;
    pending: number;
    completed: number;
  };
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    leads: { total: 0, new: 0, inProgress: 0, won: 0, lost: 0 },
    calls: { today: 0, week: 0, pending: 0, completed: 0 }
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        // 1. Fetch Leads Stats
        // We select * because the exact column names for status/score might differ or be missing
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('*');

        if (leadsError) {
          console.error("Leads fetch error:", leadsError);
        }

        const leadsData = leads || [];

        // Process Leads - Use optional chaining and fallbacks for columns that might be renamed
        const total = leadsData.length;
        const newLeads = leadsData.filter(l => (l.status === 'new' || l.stage === 'new' || !l.status)).length;
        const won = leadsData.filter(l => l.status === 'won' || l.stage === 'won').length;
        const lost = leadsData.filter(l => l.status === 'lost' || l.stage === 'lost').length;
        // In Progress = everything else
        const inProgress = total - (newLeads + won + lost);

        // 2. Fetch Calls Stats
        let callsData: any[] = [];
        try {
          const { data: calls, error: callsError } = await supabase
            .from('strategy_calls')
            .select('*');

          if (callsError) {
            if (callsError.code === 'PGRST116' || callsError.code === '42P01') {
              console.warn("Table strategy_calls does not exist yet.");
            } else {
              console.error("Calls fetch error:", callsError);
            }
          } else {
            callsData = calls || [];
          }
        } catch (e) {
          console.warn("Strategy calls table fetch failed - might not exist");
        }

        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const callsToday = callsData.filter(c => {
          const d = new Date(c.preferred_time || c.created_at);
          return d >= startOfToday && d <= endOfToday;
        }).length;

        const callsWeek = callsData.filter(c => {
          const d = new Date(c.preferred_time || c.created_at);
          return d >= weekStart;
        }).length;

        const pending = callsData.filter(c => c.status === 'pending').length;
        const completed = callsData.filter(c => c.status === 'completed').length;

        setStats({
          leads: { total, new: newLeads, inProgress, won, lost },
          calls: { today: callsToday, week: callsWeek, pending, completed }
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex bg-background items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your leads and pipeline</p>
      </motion.div>

      {/* Lead Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Leads"
          value={stats.leads.total}
          icon={Users}
          variant="white"
          delay={0.1}
        />
        <StatCard
          title="New Leads"
          value={stats.leads.new}
          icon={UserPlus}
          variant="gold"
          delay={0.15}
        />
        <StatCard
          title="In Progress"
          value={stats.leads.inProgress}
          icon={Clock}
          variant="white"
          delay={0.2}
        />
        <StatCard
          title="Won"
          value={stats.leads.won}
          icon={Trophy}
          variant="success"
          delay={0.25}
        />
        <StatCard
          title="Lost"
          value={stats.leads.lost}
          icon={XCircle}
          variant="danger"
          delay={0.3}
        />
      </div>

      {/* Strategy Call Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Calls Today"
          value={stats.calls.today}
          icon={Calendar}
          variant="gold"
          delay={0.35}
        />
        <StatCard
          title="This Week"
          value={stats.calls.week}
          icon={CalendarClock}
          variant="white"
          delay={0.4}
        />
        <StatCard
          title="Pending Confirmation"
          value={stats.calls.pending}
          icon={CalendarCheck}
          variant="white"
          delay={0.45}
        />
        <StatCard
          title="Completed (Month)"
          value={stats.calls.completed}
          icon={CheckCircle}
          variant="success"
          delay={0.5}
        />
      </div>

      {/* Pipeline */}
      <PipelineChart />

      {/* Activity & Upcoming Calls Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <UpcomingCallsCard />
      </div>

      {/* Recent Leads Table below */}
      <RecentLeadsTable />
    </div>
  );
}