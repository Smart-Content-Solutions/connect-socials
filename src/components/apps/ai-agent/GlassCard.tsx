import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    goldGlow?: boolean;
}

export default function GlassCard({ children, className = '', goldGlow = false, onClick, ...props }: GlassCardProps) {
    return (
        <motion.div
            onClick={onClick}
            whileHover={onClick ? { y: -2 } : undefined}
            transition={{ duration: 0.2 }}
            className={cn(
                "relative overflow-hidden rounded-2xl",
                "bg-[#3B3C3E]/40 backdrop-blur-[20px]",
                "border border-white/10",
                goldGlow && "shadow-[0_0_40px_rgba(225,195,122,0.15)]",
                onClick && "cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
