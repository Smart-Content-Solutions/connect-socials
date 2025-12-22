import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Video, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export function UpcomingCallsCard() {
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCalls() {
      try {
        const { data, error } = await supabase
          .from('strategy_calls')
          .select('*')
          .gte('preferred_time', new Date().toISOString()) // Future calls
          .order('preferred_time', { ascending: true })
          .limit(3);

        if (error) {
          if (error.code !== '42P01') console.error("Error fetching calls:", error);
          return;
        }
        if (data) setCalls(data);
      } catch (e) {
        // ignore if table doesn't exist
      }
    }
    fetchCalls();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-xl p-6 glass card-hover h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Upcoming Calls</h3>
        <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
          View Calendar <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-4">
        {calls.map((call, index) => (
          <motion.div
            key={call.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-white">{call.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{call.topic || 'Strategy Session'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white bg-white/10 px-2 py-1 rounded-md">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(call.preferred_time), 'MMM d, h:mm a')}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {calls.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Calendar className="w-8 h-8 mb-2 opacity-50" />
            <p>No upcoming calls scheduled.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}