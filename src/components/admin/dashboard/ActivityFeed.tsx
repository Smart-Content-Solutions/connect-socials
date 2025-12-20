import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, RefreshCw, MessageSquare, UserCheck, Phone, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Helper to infer icon
const getIconForType = (type: string) => {
  switch (type) {
    case 'lead_created': return UserPlus;
    case 'status_changed': return RefreshCw;
    case 'call_scheduled': return Phone;
    default: return MessageSquare;
  }
};

const getColorForType = (type: string) => {
  switch (type) {
    case 'lead_created': return 'text-blue-500 bg-blue-500/10';
    case 'status_changed': return 'text-purple-500 bg-purple-500/10';
    case 'call_scheduled': return 'text-yellow-500 bg-yellow-500/10';
    default: return 'text-gray-500 bg-gray-500/10';
  }
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchActivity() {
      // For now, we simulate activity from the 'leads' table's 'created_at' for demonstration
      // as we might not have a dedicated 'activities' table yet.
      const { data } = await supabase
        .from('leads')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setActivities(data.map(lead => ({
          id: lead.id,
          type: 'lead_created',
          content: `New lead created: ${lead.name}`,
          timestamp: lead.created_at,
          targetId: lead.id,
          targetType: 'lead'
        })));
      }
    }
    fetchActivity();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="glass rounded-xl p-6 h-full bg-[#1A1A1C] border border-white/5"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <Link to="/admin/activity" className="text-xs text-blue-400 hover:text-blue-300">View all</Link>
      </div>

      <div className="space-y-6">
        {activities.map((item, index) => {
          const Icon = getIconForType(item.type);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex gap-4"
            >
              <div className={`p-2 rounded-full h-fit ${getColorForType(item.type)}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-300">{item.content}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          );
        })}
        {activities.length === 0 && <p className="text-gray-500 text-sm">No recent activity.</p>}
      </div>
    </motion.div>
  );
}
