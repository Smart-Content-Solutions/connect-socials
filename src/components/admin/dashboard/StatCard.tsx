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
    variant?: 'default' | 'gold' | 'success' | 'danger' | 'white';
    delay?: number;
}

const variants = {
    default: 'glass border-white/5',
    gold: 'glass border-primary/20',
    success: 'glass border-green-500/20',
    danger: 'glass border-red-500/20',
    white: 'glass border-white/5',
};

const iconVariants = {
    default: 'text-gray-400 bg-white/5',
    gold: 'text-primary bg-primary/10',
    success: 'text-green-500 bg-green-500/10',
    danger: 'text-red-500 bg-red-500/10',
    white: 'text-gray-400 bg-white/5',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', delay = 0 }: StatCardProps) {
    console.log('[DEBUG] StatCard: Rendering', title);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className={cn('overflow-hidden card-hover', variants[variant])}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {title}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h2 className={cn("text-3xl font-bold tracking-tight",
                                    variant === 'gold' ? "text-primary" :
                                        variant === 'success' ? "text-green-500" :
                                            variant === 'danger' ? "text-red-500" :
                                                "text-foreground"
                                )}>
                                    {value}
                                </h2>
                                {trend && (
                                    <span className={cn("text-xs font-medium", trend.isPositive ? "text-green-500" : "text-red-500")}>
                                        {trend.isPositive ? "+" : "-"}{trend.value}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={cn("p-3 rounded-xl transition-all duration-300", iconVariants[variant])}>
                            <Icon className="w-5 h-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
