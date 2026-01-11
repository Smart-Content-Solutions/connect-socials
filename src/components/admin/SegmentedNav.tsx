import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Settings, CreditCard, Ticket, MessageCircle, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useLayoutEffect, useState } from 'react';

interface SegmentedNavProps {
  activeSection: 'dashboard' | 'leads' | 'subscribers' | 'users' | 'tickets' | 'feedback' | 'settings';
  onSectionChange: (section: 'dashboard' | 'leads' | 'subscribers' | 'users' | 'tickets' | 'feedback' | 'settings') => void;
}

interface NavItem {
  id: 'dashboard' | 'leads' | 'subscribers' | 'users' | 'tickets' | 'feedback' | 'settings';
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'subscribers', label: 'Subscribers', icon: CreditCard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tickets', label: 'Tickets', icon: Ticket },
  { id: 'feedback', label: 'Feedback', icon: MessageCircle },
  { id: 'settings', label: 'Staff & Settings', icon: Settings },
];

export function SegmentedNav({ activeSection, onSectionChange }: SegmentedNavProps) {
  const activeIndex = navItems.findIndex(item => item.id === activeSection);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const measureIndicator = () => {
      const container = containerRef.current;
      const activeEl = itemRefs.current[activeIndex];
      
      if (!container || !activeEl || activeIndex < 0) return;
      
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      
      setIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
    };

    // Use requestAnimationFrame to ensure DOM is fully laid out
    requestAnimationFrame(() => {
      measureIndicator();
    });
    
    window.addEventListener('resize', measureIndicator);
    return () => window.removeEventListener('resize', measureIndicator);
  }, [activeIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex justify-center px-6 py-4"
    >
      <div ref={containerRef} className="relative glass rounded-xl p-1.5 flex gap-1">
        {/* Sliding indicator */}
        {activeIndex >= 0 && indicatorStyle.width > 0 && (
          <motion.div
            className="absolute top-1.5 bottom-1.5 rounded-lg bg-gold-gradient gold-glow-sm"
            initial={false}
            animate={{
              x: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
          />
        )}

        {navItems.map((item, index) => {
          const isActive = activeSection === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              ref={(el) => (itemRefs.current[index] = el)}
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
