import { motion } from 'framer-motion';
import { Search, Bell, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/clerk-react';

interface AdminHeaderProps {
  sidebarCollapsed?: boolean;
}

export function AdminHeader({ sidebarCollapsed }: AdminHeaderProps) {
  const { user } = useUser();

  const displayName = user?.fullName || user?.username || user?.firstName || 'Admin User';
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const imageUrl = user?.imageUrl;

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="h-16 bg-[#1A1A1C] border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-30"
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Smart Content Solutions LTD
        </span>
        <span className="text-tertiary">—</span>
        <span className="text-sm font-medium text-gold-gradient">Admin Console</span>
      </div>
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search leads, contacts..."
            className="pl-10 bg-muted/50 border-white/10 focus:border-primary/50 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-white/10 overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-foreground" />
              )}
            </div>
            <Badge
              variant="outline"
              className="absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0 bg-primary/20 border-primary/50 text-primary"
            >
              Admin
            </Badge>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
