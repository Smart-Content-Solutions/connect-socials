// Mock data types and stub data for admin pages
// This is a temporary file to unblock the build - replace with real Supabase queries later

// ============= TYPES =============

export type LeadStatus = 'new' | 'in-review' | 'in-progress' | 'discovery-call' | 'proposal-sent' | 'won' | 'lost';
export type LeadSource = 'website' | 'referral' | 'manual' | 'linkedin';
export type LeadPriority = 'low' | 'medium' | 'high';
export type StrategyCallStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
    serviceInterest: string;
    source: LeadSource;
    status: LeadStatus;
    priority: LeadPriority;
    assignedTo?: string;
    tags: string[];
    createdAt: string;
}

export interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'staff';
}

export interface Note {
    id: string;
    content: string;
    author: string;
    createdAt: string;
}

export interface Activity {
    id: string;
    type: 'lead_created' | 'status_changed' | 'note_added' | 'assigned' | 'call_scheduled' | 'strategy_call_booked';
    description: string;
    user: string;
    timestamp: string;
}

export interface StrategyCall {
    id: string;
    name: string;
    email: string;
    phone?: string;
    preferredDateTime: string;
    timeZone: string;
    status: StrategyCallStatus;
    source: string;
    topic?: string;
    leadId?: string;
    notes: Note[];
    createdAt: string;
    updatedAt: string;
}

// ============= LABEL MAPS =============

export const statusLabels: Record<LeadStatus, string> = {
    'new': 'New',
    'in-review': 'In Review',
    'in-progress': 'In Progress',
    'discovery-call': 'Discovery Call',
    'proposal-sent': 'Proposal Sent',
    'won': 'Won',
    'lost': 'Lost',
};

export const sourceLabels: Record<LeadSource, string> = {
    'website': 'Website',
    'referral': 'Referral',
    'manual': 'Manual Entry',
    'linkedin': 'LinkedIn',
};

export const strategyCallStatusLabels: Record<StrategyCallStatus, string> = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'no_show': 'No Show',
};

// ============= STUB DATA =============

export const staffMembers: StaffMember[] = [
    {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
    },
];

export const leads: Lead[] = [];

export const strategyCalls: StrategyCall[] = [];

// ============= HELPER FUNCTIONS =============

export function getLeadById(id: string): Lead | undefined {
    return leads.find(lead => lead.id === id);
}

export function getStaffById(id: string): StaffMember | undefined {
    return staffMembers.find(staff => staff.id === id);
}

export function getNotesByLeadId(leadId: string): Note[] {
    return [];
}

export function getActivitiesByLeadId(leadId: string): Activity[] {
    return [];
}

export function getStrategyCallById(id: string): StrategyCall | undefined {
    return strategyCalls.find(call => call.id === id);
}
