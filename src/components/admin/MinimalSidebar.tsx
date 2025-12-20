import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MinimalSidebarProps {
  collapsed?: boolean;
}

export function MinimalSidebar({ collapsed = false }: MinimalSidebarProps) {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 flex flex-col items-center py-4',
        'w-16'
      )}
    >
      {/* Logo */}
      <motion.div 
        className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center gold-glow-sm"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-primary-foreground font-bold text-sm">SC</span>
      </motion.div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom branding indicator */}
      <div className="w-8 h-1 rounded-full bg-primary/30" />
    </motion.aside>
  );
}