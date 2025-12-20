import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, X, ChevronDown, Users, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { leads, staffMembers, getStaffById, sourceLabels, statusLabels, LeadStatus, LeadSource } from '@/data/mockData';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { StrategyCallsTable } from '@/components/leads/StrategyCallsTable';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const allStatuses: LeadStatus[] = ['new', 'in-review', 'in-progress', 'discovery-call', 'proposal-sent', 'won', 'lost'];
const allSources: LeadSource[] = ['website', 'referral', 'manual', 'linkedin'];

export default function LeadsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'leads';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>([]);
  const [selectedSources, setSelectedSources] = useState<LeadSource[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.company?.toLowerCase().includes(query) ||
          lead.message.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(lead.status)) {
        return false;
      }
      if (selectedSources.length > 0 && !selectedSources.includes(lead.source)) {
        return false;
      }
      if (selectedAssignee && lead.assignedTo !== selectedAssignee) {
        return false;
      }
      return true;
    });
  }, [searchQuery, selectedStatuses, selectedSources, selectedAssignee]);

  const toggleStatus = (status: LeadStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleSource = (source: LeadSource) => {
    setSelectedSources(prev => 
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
    setSelectedSources([]);
    setSelectedAssignee(null);
  };

  const hasFilters = selectedStatuses.length > 0 || selectedSources.length > 0 || selectedAssignee;

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
          <h1 className="text-2xl font-bold text-foreground">Leads & Calls</h1>
          <p className="text-muted-foreground mt-1">Manage leads and strategy call bookings</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit"
      >
        <button
          onClick={() => setActiveTab('leads')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'leads'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Users className="w-4 h-4" />
          Leads
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'calls'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="w-4 h-4" />
          Strategy Calls
        </button>
      </motion.div>

      {activeTab === 'leads' ? (
        <>
          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, company, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-white/10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn('border-white/10 gap-2', showFilters && 'bg-primary/10 border-primary/30')}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-primary/20 text-primary">
                    {selectedStatuses.length + selectedSources.length + (selectedAssignee ? 1 : 0)}
                  </span>
                )}
                <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
              </Button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="glass rounded-xl p-4 space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {allStatuses.map(status => (
                      <button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm border transition-all',
                          selectedStatuses.includes(status)
                            ? 'bg-primary/20 border-primary/50 text-primary'
                            : 'bg-muted/50 border-white/10 text-muted-foreground hover:border-white/20'
                        )}
                      >
                        {statusLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Source</label>
                  <div className="flex flex-wrap gap-2">
                    {allSources.map(source => (
                      <button
                        key={source}
                        onClick={() => toggleSource(source)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm border transition-all',
                          selectedSources.includes(source)
                            ? 'bg-primary/20 border-primary/50 text-primary'
                            : 'bg-muted/50 border-white/10 text-muted-foreground hover:border-white/20'
                        )}
                      >
                        {sourceLabels[source]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Assigned To</label>
                  <div className="flex flex-wrap gap-2">
                    {staffMembers.map(staff => (
                      <button
                        key={staff.id}
                        onClick={() => setSelectedAssignee(selectedAssignee === staff.id ? null : staff.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm border transition-all',
                          selectedAssignee === staff.id
                            ? 'bg-primary/20 border-primary/50 text-primary'
                            : 'bg-muted/50 border-white/10 text-muted-foreground hover:border-white/20'
                        )}
                      >
                        {staff.name}
                      </button>
                    ))}
                  </div>
                </div>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4 mr-1" />
                    Clear all filters
                  </Button>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Leads Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Lead</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Service Interest</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Source</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Priority</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Assigned To</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.map((lead, index) => {
                    const assignee = lead.assignedTo ? getStaffById(lead.assignedTo) : null;
                    return (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="row-hover cursor-pointer"
                      >
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                            {lead.company && <p className="text-xs text-tertiary">{lead.company}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-4"><span className="text-sm text-foreground">{lead.serviceInterest}</span></td>
                        <td className="px-4 py-4"><span className="text-xs text-muted-foreground">{sourceLabels[lead.source]}</span></td>
                        <td className="px-4 py-4"><StatusBadge status={lead.status} /></td>
                        <td className="px-4 py-4"><PriorityBadge priority={lead.priority} /></td>
                        <td className="px-4 py-4"><span className="text-sm text-muted-foreground">{assignee?.name || '—'}</span></td>
                        <td className="px-4 py-4"><span className="text-sm text-muted-foreground">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</span></td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredLeads.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No leads match your filters</p>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 text-primary">Clear filters</Button>
              </div>
            )}
          </motion.div>
        </>
      ) : (
        <StrategyCallsTable />
      )}
    </div>
  );
}