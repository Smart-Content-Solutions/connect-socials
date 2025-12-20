import { cn } from '@/lib/utils';
import { LeadPriority } from '@/data/mockData';

interface PriorityBadgeProps {
    priority: LeadPriority;
    className?: string;
}

const priorityStyles: Record<LeadPriority, string> = {
    'low': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    'medium': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'high': 'bg-red-500/10 text-red-500 border-red-500/20',
};

const priorityLabels: Record<LeadPriority, string> = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                priorityStyles[priority],
                className
            )}
        >
            {priorityLabels[priority]}
        </span>
    );
}
