import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface PipelineStage {
  status: string;
  count: number;
  percentage: number;
}

const statusColors: Record<string, string> = {
  'new': 'bg-[#3B82F6]', // Blue
  'in-review': 'bg-[#A855F7]', // Purple
  'in-progress': 'bg-[#EAB308]', // Gold/Yellow
  'discovery-call': 'bg-[#14B8A6]', // Teal
  'proposal-sent': 'bg-[#EC4899]', // Pink
  'won': 'bg-[#22C55E]', // Green
  'lost': 'bg-[#EF4444]', // Red
};

const statusLabels: Record<string, string> = {
  'new': 'New Lead',
  'in-review': 'In Review',
  'in-progress': 'In Progress',
  'discovery-call': 'Discovery Call',
  'proposal-sent': 'Proposal Sent',
  'won': 'Won',
  'lost': 'Lost'
};

export function PipelineChart() {
  const [data, setData] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPipeLine() {
      try {
        const { data: leads, error } = await supabase
          .from('leads')
          .select('*');

        if (error) throw error;

        // Group by status
        const total = leads.length || 1;
        const counts: Record<string, number> = {};

        leads.forEach(l => {
          const s = l.status || 'new';
          counts[s] = (counts[s] || 0) + 1;
        });

        // Convert to array
        const stages = Object.keys(statusLabels).map(status => {
          const count = counts[status] || 0;
          return {
            status,
            count,
            percentage: Math.round((count / total) * 100)
          };
        });

        setData(stages);
      } catch (e) {
        console.error("Pipeline fetch error", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPipeLine();
  }, []);

  if (loading) return <div className="h-[120px] animate-pulse bg-gray-900/50 rounded-xl" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl p-6 glass card-hover"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Lead Pipeline</h3>

      {/* Pipeline bar */}
      <div className="h-8 rounded-lg overflow-hidden flex mb-4 bg-gray-800">
        {data.map((item, index) => (
          <motion.div
            key={item.status}
            initial={{ width: 0 }}
            animate={{ width: `${item.percentage}%` }}
            transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
            className={cn(
              statusColors[item.status] || 'bg-gray-500',
              'flex items-center justify-center transition-all h-full'
            )}
            title={`${statusLabels[item.status] || item.status}: ${item.count} leads (${item.percentage}%)`}
          >
            {item.percentage >= 5 && (
              <span className="text-[10px] font-medium text-white/90 truncate px-1">{item.percentage}%</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {data.filter(i => i.count > 0).map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div className={cn('w-2.5 h-2.5 rounded-full', statusColors[item.status] || 'bg-gray-500')} />
            <div className="text-xs">
              <span className="text-gray-400">{statusLabels[item.status] || item.status}</span>
              <span className="text-white font-medium ml-1">({item.count})</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
