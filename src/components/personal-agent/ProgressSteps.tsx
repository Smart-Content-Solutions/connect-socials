import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProgressStep = {
  id: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
};

interface ProgressStepsProps {
  steps: ProgressStep[];
  className?: string;
}

export default function ProgressSteps({ steps, className }: ProgressStepsProps) {
  if (steps.length === 0) return null;

  return (
    <div className={cn("space-y-2 p-3 bg-[#2C2C2E] rounded-xl border border-white/5", className)}>
      <AnimatePresence>
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 text-sm"
          >
            {step.status === 'completed' && (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
            {step.status === 'in_progress' && (
              <Loader2 className="w-4 h-4 text-[#E1C37A] animate-spin flex-shrink-0" />
            )}
            {step.status === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            {step.status === 'pending' && (
              <Circle className="w-4 h-4 text-[#5B5C60] flex-shrink-0" />
            )}
            
            <span
              className={cn(
                "flex-1",
                step.status === 'completed' && "text-green-400",
                step.status === 'in_progress' && "text-[#E1C37A]",
                step.status === 'error' && "text-red-400",
                step.status === 'pending' && "text-[#5B5C60]"
              )}
            >
              {step.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}