import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, X, ChevronDown, Calendar, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  strategyCallStatusLabels,
  StrategyCallStatus
} from '@/data/mockData';
import { StrategyCallStatusBadge } from '@/components/ui/strategy-call-status-badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const allStatuses: StrategyCallStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

interface StrategyCall {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferredDateTime: string;
  timeZone: string;
  status: StrategyCallStatus;
  source: string;
  leadId?: string;
  createdAt: string;
}

export function StrategyCallsTable() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<StrategyCallStatus[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [calls, setCalls] = useState<StrategyCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalls() {
      setLoading(true);
      const { data, error } = await supabase
        .from('strategy_calls')
        .select('*')
        .order('preferred_time', { ascending: false });

      if (error) {
        // Silently ignore if table doesn't exist (404 or PGRST116 error)
        if (error.code !== '42P01' && error.code !== 'PGRST116') {
          console.error("Error fetching calls:", error);
        }
      } else if (data) {
        const mappedCalls: StrategyCall[] = data.map(dbCall => ({
          id: dbCall.id,
          name: dbCall.name,
          email: dbCall.email,
          phone: dbCall.phone,
          preferredDateTime: dbCall.preferred_time || dbCall.created_at,
          timeZone: dbCall.time_zone || 'UTC',
          status: (dbCall.status as StrategyCallStatus) || 'pending',
          source: dbCall.source || 'Website',
          leadId: dbCall.lead_id,
          createdAt: dbCall.created_at
        }));
        setCalls(mappedCalls);
      }
      setLoading(false);
    }
    fetchCalls();
  }, []);

  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          call.name.toLowerCase().includes(query) ||
          call.email.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(call.status)) {
        return false;
      }

      return true;
    });
  }, [calls, searchQuery, selectedStatuses]);

  const toggleStatus = (status: StrategyCallStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
  };

  const hasFilters = selectedStatuses.length > 0;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-white/10"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'border-white/10 gap-2',
            showFilters && 'bg-primary/10 border-primary/30'
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded bg-primary/20 text-primary">
              {selectedStatuses.length}
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl p-4 space-y-4 bg-[#1A1A1C] border border-white/5"
        >
          {/* Status Filter */}
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
                  {strategyCallStatusLabels[status]}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all filters
            </Button>
          )}
        </motion.div>
      )}

      {/* Strategy Calls Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl overflow-hidden bg-[#1A1A1C] border border-white/5"
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Contact
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Date & Time
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Linked Lead
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Source
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCalls.map((call, index) => {
                  return (
                    <motion.tr
                      key={call.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      onClick={() => navigate(`/admin/strategy-calls/${call.id}`)}
                      className="row-hover cursor-pointer"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{call.name}</p>
                          <p className="text-xs text-muted-foreground">{call.email}</p>
                          {call.phone && (
                            <p className="text-xs text-tertiary">{call.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary/70" />
                          <div>
                            <p className="text-sm text-foreground">
                              {format(new Date(call.preferredDateTime), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(call.preferredDateTime), 'h:mm a')} ({call.timeZone})
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StrategyCallStatusBadge status={call.status} />
                      </td>
                      <td className="px-4 py-4">
                        {/* Placeholder for Lead link */}
                        {call.leadId ? (
                          <span className="text-sm text-primary">Linked</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unlinked</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-muted-foreground">{call.source}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(call.createdAt), 'MMM d, yyyy')}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredCalls.length === 0 && (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No strategy calls match your filters</p>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="mt-2 text-primary"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}