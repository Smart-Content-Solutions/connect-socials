import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Settings, CreditCard, Ticket, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SegmentedNavProps {
  activeSection: 'dashboard' | 'leads' | 'subscribers' | 'users' | 'tickets' | 'settings';
  onSectionChange: (section: 'dashboard' | 'leads' | 'subscribers' | 'users' | 'tickets' | 'settings') => void;
}

interface NavItem {
  id: 'dashboard' | 'leads' | 'subscribers' | 'users' | 'tickets' | 'settings';
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'subscribers', label: 'Subscribers', icon: CreditCard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tickets', label: 'Tickets', icon: Ticket },
  { id: 'settings', label: 'Staff & Settings', icon: Settings },
];

export function SegmentedNav({ activeSection, onSectionChange }: SegmentedNavProps) {
  const activeIndex = navItems.findIndex(item => item.id === activeSection);
  const itemCount = navItems.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex justify-center px-6 py-4"
    >
      <div className="relative glass rounded-xl p-1.5 flex gap-1">
        {/* Sliding indicator */}
        {activeIndex >= 0 && (
          <motion.div
            className="absolute top-1.5 bottom-1.5 rounded-lg bg-gold-gradient gold-glow-sm"
            layoutId="segmentIndicator"
            initial={false}
            style={{
              width: `calc((100% - 12px) / ${itemCount})`,
              left: `calc(${activeIndex * (100 / itemCount)}% + 6px)`,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
          />
        )}

        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'relative z-10 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <IconComponent className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
