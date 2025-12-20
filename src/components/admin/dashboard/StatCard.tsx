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
    default: 'glass text-white',
    gold: 'glass border-yellow-500/20 bg-yellow-500/5 text-yellow-500',
    success: 'glass border-green-500/20 bg-green-500/5 text-green-500',
    danger: 'glass border-red-500/20 bg-red-500/5 text-red-500',
    white: 'bg-white text-gray-900 border-none shadow-lg',
};

const iconVariants = {
    default: 'text-primary bg-primary/10',
    gold: 'text-yellow-500 bg-yellow-500/10',
    success: 'text-green-500 bg-green-500/10',
    danger: 'text-red-500 bg-red-500/10',
    white: 'text-primary bg-primary/10',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', delay = 0 }: StatCardProps) {
    const isWhite = variant === 'white';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className={cn('overflow-hidden border-none transition-all duration-300', variants[variant])}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className={cn("text-xs font-medium", isWhite ? "text-gray-500" : "text-gray-400")}>
                                {title}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <h2 className={cn("text-3xl font-bold tracking-tight",
                                    variant === 'gold' ? "text-yellow-500" :
                                        variant === 'success' ? "text-green-500" :
                                            variant === 'danger' ? "text-red-500" :
                                                isWhite ? "text-gray-900" : "text-white"
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
                        <div className={cn("p-2.5 rounded-xl transition-colors duration-300", iconVariants[variant])}>
                            <Icon className="w-5 h-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
