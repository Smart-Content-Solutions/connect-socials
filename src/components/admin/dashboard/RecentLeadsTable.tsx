import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export function RecentLeadsTable() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLeads() {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setLeads(data);
    }
    fetchLeads();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="glass rounded-xl overflow-hidden bg-[#1A1A1C] border border-white/5"
    >
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Recent Leads</h3>
        <Link to="/admin/leads" className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors">
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Lead</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead, index) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="hover:bg-white/5 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                      {lead.name.substring(0, 2)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{lead.name}</div>
                      <div className="text-xs text-gray-400">{lead.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/10 text-blue-400">
                    {lead.status || 'New'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-700 rounded-full h-1.5 mr-2">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${lead.lead_score || 0}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-300 font-medium">{lead.lead_score || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {format(new Date(lead.created_at), 'MMM d')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && <div className="p-8 text-center text-gray-500">No leads found.</div>}
      </div>
    </motion.div>
  );
}
