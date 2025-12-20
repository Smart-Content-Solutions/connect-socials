import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, Building2, Calendar, Globe, 
  MessageSquare, Clock, User, Tag, ChevronDown, Save,
  UserPlus, RefreshCw, UserCheck, PhoneCall
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  getLeadById, getNotesByLeadId, getActivitiesByLeadId, 
  staffMembers, sourceLabels, statusLabels, LeadStatus, LeadPriority,
  Activity
} from '@/data/mockData';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const allStatuses: LeadStatus[] = ['new', 'in-review', 'in-progress', 'discovery-call', 'proposal-sent', 'won', 'lost'];
const allPriorities: LeadPriority[] = ['low', 'medium', 'high'];

const activityIcons: Record<Activity['type'], typeof UserPlus> = {
  'lead_created': UserPlus,
  'status_changed': RefreshCw,
  'note_added': MessageSquare,
  'assigned': UserCheck,
  'call_scheduled': PhoneCall,
  'strategy_call_booked': PhoneCall,
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lead = getLeadById(id || '');
  const notes = getNotesByLeadId(id || '');
  const activities = getActivitiesByLeadId(id || '');

  const [status, setStatus] = useState<LeadStatus>(lead?.status || 'new');
  const [priority, setPriority] = useState<LeadPriority>(lead?.priority || 'medium');
  const [assignee, setAssignee] = useState<string>(lead?.assignedTo || '');
  const [newNote, setNewNote] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Lead not found</h2>
          <p className="text-muted-foreground mb-4">The lead you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/leads')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    toast({
      title: "Changes saved",
      description: "Lead details have been updated successfully.",
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    toast({
      title: "Note added",
      description: "Your note has been added to the timeline.",
    });
    setNewNote('');
  };

  const assignedStaff = staffMembers.find(s => s.id === assignee);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          to="/leads"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-primary/20 text-primary border border-primary/30">
                    Lead
                  </span>
                </div>
                {lead.company && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {lead.company}
                  </p>
                )}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Created {format(new Date(lead.createdAt), 'MMM d, yyyy')}</p>
                <p className="text-xs text-tertiary">
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
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
                  <p className="text-foreground">{lead.email}</p>
                </div>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-foreground">{lead.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="text-foreground">{sourceLabels[lead.source]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service Interest</p>
                  <p className="text-foreground">{lead.serviceInterest}</p>
                </div>
              </div>
            </div>

            {/* Original Message */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Original Message
              </h3>
              <div className="p-4 rounded-lg bg-muted/30 border border-white/5">
                <p className="text-sm text-foreground leading-relaxed">{lead.message}</p>
              </div>
            </div>
          </motion.div>

          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Internal Notes</h3>
            
            {/* Add Note */}
            <div className="mb-6">
              <Textarea
                placeholder="Add a note..."
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
                  transition={{ delay: 0.2 + index * 0.1 }}
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

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Activity Timeline</h3>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
              
              <div className="space-y-6">
                {activities.map((activity, index) => {
                  const Icon = activityIcons[activity.type];
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="relative pl-10"
                    >
                      <div className="absolute left-0 w-8 h-8 rounded-full bg-muted/50 border border-white/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          by {activity.user} • {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Assignment Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass rounded-xl p-6 space-y-5"
          >
            {/* Status */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <StatusBadge status={status} />
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
                        <StatusBadge status={s} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Priority</label>
              <div className="relative">
                <button
                  onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <PriorityBadge priority={priority} />
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', showPriorityDropdown && 'rotate-180')} />
                </button>
                {showPriorityDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 py-1 rounded-lg bg-popover border border-white/10 shadow-xl z-10">
                    {allPriorities.map(p => (
                      <button
                        key={p}
                        onClick={() => { setPriority(p); setShowPriorityDropdown(false); }}
                        className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center"
                      >
                        <PriorityBadge priority={p} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Assigned To</label>
              <div className="relative">
                <button
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {assignedStaff?.name || 'Unassigned'}
                    </span>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', showAssigneeDropdown && 'rotate-180')} />
                </button>
                {showAssigneeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 py-1 rounded-lg bg-popover border border-white/10 shadow-xl z-10">
                    <button
                      onClick={() => { setAssignee(''); setShowAssigneeDropdown(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-white/5 text-sm text-muted-foreground"
                    >
                      Unassigned
                    </button>
                    {staffMembers.map(staff => (
                      <button
                        key={staff.id}
                        onClick={() => { setAssignee(staff.id); setShowAssigneeDropdown(false); }}
                        className="w-full px-3 py-2 text-left hover:bg-white/5 text-sm text-foreground"
                      >
                        {staff.name}
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

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-sm font-medium text-foreground mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {lead.tags.length > 0 ? (
                lead.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tags</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
