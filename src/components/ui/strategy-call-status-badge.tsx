import { cn } from '@/lib/utils';
import { StrategyCallStatus } from '@/data/mockData';

interface StrategyCallStatusBadgeProps {
    status: StrategyCallStatus;
    className?: string;
}

const statusStyles: Record<StrategyCallStatus, string> = {
    'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'confirmed': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'completed': 'bg-green-500/10 text-green-500 border-green-500/20',
    'cancelled': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    'no_show': 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusLabels: Record<StrategyCallStatus, string> = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'no_show': 'No Show',
};

export function StrategyCallStatusBadge({ status, className }: StrategyCallStatusBadgeProps) {
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
