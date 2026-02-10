import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Clock,
  Trophy,
  XCircle,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
} from 'lucide-react';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { PipelineChart } from '@/components/admin/dashboard/PipelineChart';
import { ActivityFeed } from '@/components/admin/dashboard/ActivityFeed';
import { RecentLeadsTable } from '@/components/admin/dashboard/RecentLeadsTable';
import { UpcomingCallsCard } from '@/components/admin/dashboard/UpcomingCallsCard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// console.log('[DEBUG] AdminDashboard module: Checking imports...');
// console.log('[DEBUG] Users icon:', typeof Users);
// console.log('[DEBUG] UserPlus icon:', typeof UserPlus);
// console.log('[DEBUG] Clock icon:', typeof Clock);
// console.log('[DEBUG] Trophy icon:', typeof Trophy);
// console.log('[DEBUG] XCircle icon:', typeof XCircle);
// console.log('[DEBUG] Calendar icon:', typeof Calendar);
// console.log('[DEBUG] CalendarCheck icon:', typeof CalendarCheck);
// console.log('[DEBUG] CalendarClock icon:', typeof CalendarClock);
// console.log('[DEBUG] CheckCircle icon:', typeof CheckCircle);

// console.log('[DEBUG] StatCard:', typeof StatCard);
// console.log('[DEBUG] PipelineChart:', typeof PipelineChart);
// console.log('[DEBUG] ActivityFeed:', typeof ActivityFeed);
// console.log('[DEBUG] RecentLeadsTable:', typeof RecentLeadsTable);
// console.log('[DEBUG] UpcomingCallsCard:', typeof UpcomingCallsCard);

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
  subscriptions: {
    total: number;
    active: number;
    trialing: number;
    canceled: number;
  };
}

export default function AdminDashboard() {
  console.log('[DEBUG] AdminDashboard: Component starting render');
  const [loading, setLoading] = useState(true);
  console.log('[DEBUG] AdminDashboard: useState initialized');
  const [stats, setStats] = useState<DashboardStats>({
    leads: { total: 0, new: 0, inProgress: 0, won: 0, lost: 0 },
    calls: { today: 0, week: 0, pending: 0, completed: 0 },
    subscriptions: { total: 0, active: 0, trialing: 0, canceled: 0 },
  });
  console.log('[DEBUG] AdminDashboard: stats state initialized');

  useEffect(() => {
    console.log('[DEBUG] AdminDashboard: useEffect starting');
    async function fetchStats() {
      try {
        setLoading(true);

        // 1. Fetch Leads Stats
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('*');

        if (leadsError) {
          console.warn('Leads fetch info:', leadsError);
        }

        const leadsData = leads || [];

        const total = leadsData.length;
        const newLeads = leadsData.filter(
          (l) => l.status === 'new' || l.stage === 'new' || !l.status
        ).length;
        const won = leadsData.filter(
          (l) => l.status === 'won' || l.stage === 'won'
        ).length;
        const lost = leadsData.filter(
          (l) => l.status === 'lost' || l.stage === 'lost'
        ).length;
        const inProgress = total - (newLeads + won + lost);

        // 2. Fetch Calls Stats
        let callsData: any[] = [];
        try {
          const { data: calls, error: callsError } = await supabase
            .from('strategy_calls')
            .select('*');

          if (callsError) {
            if (callsError.code === 'PGRST116' || callsError.code === '42P01') {
              console.warn('Table strategy_calls does not exist yet.');
            } else {
              console.warn('Calls fetch info:', callsError);
            }
          } else {
            callsData = calls || [];
          }
        } catch (e) {
          console.warn(
            'Strategy calls table fetch failed - might not exist',
            e
          );
        }

        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const callsToday = callsData.filter((c) => {
          const d = new Date(c.preferred_time || c.created_at);
          return d >= startOfToday && d <= endOfToday;
        }).length;

        const callsWeek = callsData.filter((c) => {
          const d = new Date(c.preferred_time || c.created_at);
          return d >= weekStart;
        }).length;

        const pending = callsData.filter((c) => c.status === 'pending').length;
        const completed = callsData.filter(
          (c) => c.status === 'completed'
        ).length;

        // 3. Fetch Stripe subscription stats (Early Access plan)
        let subscriptionStats = {
          total: 0,
          active: 0,
          trialing: 0,
          canceled: 0,
        };

        try {
          const res = await fetch('/api/admin-stripe-subscriptions');
          if (res.ok) {
            const json = await res.json();
            if (json?.stats) {
              subscriptionStats = {
                total: json.stats.total ?? 0,
                active: json.stats.active ?? 0,
                trialing: json.stats.trialing ?? 0,
                canceled: json.stats.canceled ?? 0,
              };
            }
          } else {
            console.warn(
              'Stripe admin subscriptions endpoint returned non-200:',
              res.status
            );
          }
        } catch (err) {
          console.warn('Failed to load Stripe subscription stats:', err);
        }

        // 4. Update state
        setStats({
          leads: { total, new: newLeads, inProgress, won, lost },
          calls: { today: callsToday, week: callsWeek, pending, completed },
          subscriptions: subscriptionStats,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  console.log('[DEBUG] AdminDashboard: Before loading check, loading=', loading);

  if (loading) {
    console.log('[DEBUG] AdminDashboard: Rendering loading state');
    return (
      <div className="flex bg-background items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  console.log('[DEBUG] AdminDashboard: About to render content (not loading)');
  
  // Debug: Check if all imported components are defined
  console.log('[DEBUG] AdminDashboard: StatCard defined?', typeof StatCard);
  console.log('[DEBUG] AdminDashboard: PipelineChart defined?', typeof PipelineChart);
  console.log('[DEBUG] AdminDashboard: ActivityFeed defined?', typeof ActivityFeed);
  console.log('[DEBUG] AdminDashboard: RecentLeadsTable defined?', typeof RecentLeadsTable);
  console.log('[DEBUG] AdminDashboard: UpcomingCallsCard defined?', typeof UpcomingCallsCard);
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-400 mt-1">
          Overview of your leads, pipeline & subscriptions
        </p>
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

      {/* Stripe Subscription Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Subscribers"
          value={stats.subscriptions.total}
          icon={Users}
          variant="white"
          delay={0.55}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.subscriptions.active}
          icon={CheckCircle}
          variant="success"
          delay={0.6}
        />
        <StatCard
          title="On Trial"
          value={stats.subscriptions.trialing}
          icon={Clock}
          variant="gold"
          delay={0.65}
        />
        <StatCard
          title="Cancelled / Cancelling"
          value={stats.subscriptions.canceled}
          icon={XCircle}
          variant="danger"
          delay={0.7}
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