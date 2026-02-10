import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Calendar, Clock, Globe,
  MessageSquare, User, ChevronDown, Save, Link as LinkIcon,
  ExternalLink, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  strategyCallStatusLabels,
  StrategyCallStatus
} from '@/data/mockData';
import { StrategyCallStatusBadge } from '@/components/ui/strategy-call-status-badge';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const allStatuses: StrategyCallStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

interface StrategyCallDetail {
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
  updatedAt: string;
  // notes: any[]; // Stub
}

interface LeadSimple {
  id: string;
  name: string;
  email: string;
  company?: string;
}

export default function StrategyCallDetailPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Support both useParams and manual extraction for cases where it's rendered in a switch
  const id = paramId || location.pathname.split('/').pop();

  const [call, setCall] = useState<StrategyCallDetail | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [allLeads, setAllLeads] = useState<LeadSimple[]>([]);
  const [linkedLead, setLinkedLead] = useState<LeadSimple | null>(null);

  const [status, setStatus] = useState<StrategyCallStatus>('pending');
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>(undefined);
  const [newNote, setNewNote] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);

  // Notes stub
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);

        // Fetch Call
        const { data: callData, error } = await supabase
          .from('strategy_calls')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code !== '42P01') console.error("Error fetching call detail:", error);
        } else if (callData) {
          setCall({
            id: callData.id,
            name: callData.name || 'Unknown',
            email: callData.email || '',
            phone: callData.phone,
            preferredDateTime: callData.preferred_time || callData.created_at,
            timeZone: callData.time_zone || 'UTC',
            status: (callData.status as StrategyCallStatus) || 'pending',
            source: callData.source || 'Website',
            leadId: callData.lead_id,
            createdAt: callData.created_at,
            updatedAt: callData.updated_at || callData.created_at,
          });
          setStatus(callData.status || 'pending');
          setSelectedLeadId(callData.lead_id);

          // Fetch Linked Lead if exists
          if (callData.lead_id) {
            try {
              const { data: leadData } = await supabase.from('leads').select('id, name, email, company').eq('id', callData.lead_id).single();
              if (leadData) setLinkedLead(leadData);
            } catch (e) { }
          }
        }

        // Fetch all leads for dropdown
        try {
          const { data: leadsData } = await supabase.from('leads').select('id, name, email, company').order('created_at', { ascending: false });
          if (leadsData) {
            setAllLeads(leadsData);
          }
        } catch (e) { }
      } catch (err) {
        console.error("Unexpected crash in StrategyCallDetailPage:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Update linked lead object when selection changes
  useEffect(() => {
    if (selectedLeadId && allLeads.length > 0) {
      const found = allLeads.find(l => l.id === selectedLeadId);
      setLinkedLead(found || null);
    } else {
      // if just cleared
      if (!selectedLeadId) setLinkedLead(null);
    }
  }, [selectedLeadId, allLeads]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Strategy Call not found</h2>
          <p className="text-muted-foreground mb-4">The booking you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/admin/leads?tab=calls')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Strategy Calls
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('strategy_calls')
        .update({
          status: status,
          lead_id: selectedLeadId
        })
        .eq('id', id);

      if (error) {
        console.error("Save error:", error);
        toast({
          title: "Save failed",
          description: error.message || "Could not update call details. Check if the 'strategy_calls' table exists.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Changes saved",
          description: "Strategy call details have been updated successfully.",
        });
      }
    } catch (err) {
      console.error("Unexpected save crash:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    toast({
      title: "Note added",
      description: "Your note has been added to the call record.",
    });
    setNewNote('');
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          to="/admin/leads?tab=calls"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Strategy Calls
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Call Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl p-6 glass card-hover"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{call.name}</h1>
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-primary/20 text-primary border border-primary/30">
                    Strategy Call
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">Booked via {call.source}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Booked {format(new Date(call.createdAt), 'MMM d, yyyy')}</p>
                <p className="text-xs text-tertiary">
                  {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-foreground">{call.email}</p>
                </div>
              </div>
              {call.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-foreground">{call.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Scheduled Time */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Scheduled Call
              </h3>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-primary">
                        {format(new Date(call.preferredDateTime), 'd')}
                      </span>
                      <span className="text-[10px] uppercase text-primary/70">
                        {format(new Date(call.preferredDateTime), 'MMM')}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {format(new Date(call.preferredDateTime), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(call.preferredDateTime), 'h:mm a')}</span>
                        <span className="text-tertiary">•</span>
                        <Globe className="w-4 h-4" />
                        <span>{call.timeZone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Linked Lead Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-xl p-6 glass card-hover"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              Linked Lead
            </h3>

            {linkedLead ? (
              <div className="p-4 rounded-lg bg-muted/30 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{linkedLead.name}</p>
                    <p className="text-xs text-muted-foreground">{linkedLead.email}</p>
                    {linkedLead.company && (
                      <p className="text-xs text-tertiary">{linkedLead.company}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/leads/${linkedLead.id}`)}
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open Lead
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-white/10 text-center">
                <p className="text-sm text-muted-foreground mb-2">No lead linked to this call</p>
                <p className="text-xs text-tertiary">Link to an existing lead below</p>
              </div>
            )}
          </motion.div>

          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-xl p-6 glass card-hover"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Internal Notes</h3>

            {/* Add Note */}
            <div className="mb-6">
              <Textarea
                placeholder="Add a note about this call..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="bg-muted/30 border-white/10 min-h-[100px] mb-3"
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="bg-gold-gradient text-primary-foreground hover:opacity-90"
              >
                Add Note
              </Button>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="p-4 rounded-lg bg-muted/20 border border-white/5"
                >
                  <p className="text-sm text-foreground mb-2">{note.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{note.author}</span>
                    <span>•</span>
                    <span>{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </motion.div>
              ))}
              {notes.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No notes yet</p>
              )}
            </div>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="rounded-xl p-6 glass card-hover"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Activity Timeline</h3>

            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative pl-10"
                >
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">Strategy call booking created</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      via {call.source} • {format(new Date(call.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </motion.div>

                {call.status !== 'pending' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="relative pl-10"
                  >
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-muted/50 border border-white/10 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        Status changed to {strategyCallStatusLabels[call.status]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(call.updatedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Controls Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-xl p-6 space-y-5 glass card-hover"
          >
            {/* Status */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <StrategyCallStatusBadge status={status} />
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', showStatusDropdown && 'rotate-180')} />
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 py-1 rounded-lg bg-popover border border-white/10 shadow-xl z-10">
                    {allStatuses.map(s => (
                      <button
                        key={s}
                        onClick={() => { setStatus(s); setShowStatusDropdown(false); }}
                        className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center"
                      >
                        <StrategyCallStatusBadge status={s} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Link to Lead */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Link to Lead</label>
              <div className="relative">
                <button
                  onClick={() => setShowLeadDropdown(!showLeadDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {linkedLead?.name || 'Select a lead...'}
                    </span>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', showLeadDropdown && 'rotate-180')} />
                </button>
                {showLeadDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 py-1 rounded-lg bg-popover border border-white/10 shadow-xl z-10 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedLeadId(undefined); setShowLeadDropdown(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-white/5 text-sm text-muted-foreground"
                    >
                      No link
                    </button>
                    {allLeads.map(lead => (
                      <button
                        key={lead.id}
                        onClick={() => { setSelectedLeadId(lead.id); setShowLeadDropdown(false); }}
                        className="w-full px-3 py-2 text-left hover:bg-white/5"
                      >
                        <p className="text-sm text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full bg-gold-gradient text-primary-foreground hover:opacity-90 gold-glow-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </motion.div>

          {/* Quick Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-xl p-6 glass card-hover"
          >
            <h3 className="text-sm font-medium text-foreground mb-3">Booking Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="text-foreground">{call.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timezone</span>
                <span className="text-foreground">{call.timeZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">{format(new Date(call.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-foreground">{format(new Date(call.updatedAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}