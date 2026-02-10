import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'new': return 'bg-[#3B82F6]/20 text-[#3B82F6]'; // Blue
    case 'in-review': return 'bg-[#A855F7]/20 text-[#A855F7]'; // Purple
    case 'in-progress': return 'bg-[#EAB308]/20 text-[#EAB308]'; // Gold
    case 'discovery-call': return 'bg-[#14B8A6]/20 text-[#14B8A6]'; // Teal
    case 'proposal-sent': return 'bg-[#EC4899]/20 text-[#EC4899]'; // Pink
    case 'won': return 'bg-[#22C55E]/20 text-[#22C55E]'; // Green
    case 'lost': return 'bg-[#EF4444]/20 text-[#EF4444]'; // Red
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const getStatusLabel = (status: string) => {
  if (!status) return 'New';
  return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function RecentLeadsTable() {
  console.log('[DEBUG] RecentLeadsTable: Component starting render');
  const navigate = useNavigate();
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
      className="rounded-xl overflow-hidden glass card-hover"
    >
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Recent Leads</h3>
        <Link to="/admin/leads" className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors">
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#1A1A1C]">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">NAME</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">EMAIL</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">CREATED</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">STAGE</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">ASSIGNED TO</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">SOURCE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead, index) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                onClick={() => navigate(`/admin/leads/${lead.id}`)}
                className="row-hover cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{lead.name}</div>
                  {lead.company && <div className="text-xs text-gray-500">{lead.company}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {lead.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  <div>{format(new Date(lead.created_at), 'MMM d, yyyy')}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border border-white/5 ${getStatusColor(lead.status)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 self-center ${getStatusColor(lead.status).replace('/20', '')}`} style={{ backgroundColor: 'currentColor' }}></div>
                    {getStatusLabel(lead.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {/* Placeholder for Assigned To - assuming mock or separate join needed later */}
                  {index === 0 ? 'James Mitchell' : index === 2 ? 'Sarah Chen' : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  Website Form
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && <div className="p-8 text-center text-gray-500">No recent leads found.</div>}
      </div>
    </motion.div>
  );
}
