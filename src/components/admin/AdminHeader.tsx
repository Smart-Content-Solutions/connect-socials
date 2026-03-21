import { motion } from "framer-motion";
import { Search, Bell, User, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

interface AdminHeaderProps {
  sidebarCollapsed?: boolean;
}

export function AdminHeader({ sidebarCollapsed }: AdminHeaderProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { notifications, unreadCount, loading, updating, markAsRead, markAllAsRead, refresh } =
    useAdminNotifications(15);

  const displayName = user?.fullName || user?.username || user?.firstName || "Admin User";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const imageUrl = user?.imageUrl;
  void sidebarCollapsed;

  const formatRelativeTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleNotificationClick = async (notification: (typeof notifications)[number]) => {
    if (!notification.isRead) {
      await markAsRead([notification.id]);
    }
    navigate(notification.targetPath);
  };

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
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Popover onOpenChange={(open) => open && refresh()}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Open notifications"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0 border-white/10 bg-[#1A1A1C]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
              <button
                type="button"
                disabled={updating || unreadCount === 0}
                onClick={() => markAllAsRead()}
                className="text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      notification.isRead ? "opacity-70" : "opacity-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

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
