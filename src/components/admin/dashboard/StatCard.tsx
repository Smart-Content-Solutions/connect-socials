import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'default' | 'gold' | 'success' | 'danger';
    delay?: number;
}

const variants = {
    default: 'bg-card text-card-foreground',
    gold: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const iconVariants = {
    default: 'text-primary',
    gold: 'text-yellow-500',
    success: 'text-green-500',
    danger: 'text-red-500',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', delay = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className={cn('overflow-hidden', variants[variant])}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-2xl font-bold">{value}</h2>
                                {trend && (
                                    <span className={cn("text-xs font-medium", trend.isPositive ? "text-green-500" : "text-red-500")}>
                                        {trend.isPositive ? "+" : "-"}{trend.value}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={cn("p-2 rounded-full bg-background/50", iconVariants[variant])}>
                            <Icon className="w-5 h-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
