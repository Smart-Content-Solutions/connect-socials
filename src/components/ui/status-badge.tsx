import { cn } from '@/lib/utils';
import { LeadStatus } from '@/data/mockData';

interface StatusBadgeProps {
    status: LeadStatus;
    className?: string;
}

const statusStyles: Record<LeadStatus, string> = {
    'new': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'in-review': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'in-progress': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'discovery-call': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    'proposal-sent': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    'won': 'bg-green-500/10 text-green-500 border-green-500/20',
    'lost': 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusLabels: Record<LeadStatus, string> = {
    'new': 'New',
    'in-review': 'In Review',
    'in-progress': 'In Progress',
    'discovery-call': 'Discovery Call',
    'proposal-sent': 'Proposal Sent',
    'won': 'Won',
    'lost': 'Lost',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                statusStyles[status],
                className
            )}
        >
            {statusLabels[status]}
        </span>
    );
}
