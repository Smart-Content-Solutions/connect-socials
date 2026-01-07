import { LayoutDashboard, FileText, CheckSquare, Settings, CalendarCheck } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/planner" },
  { label: "Docs", icon: FileText, path: "/planner/docs" },
  { label: "Tasks", icon: CheckSquare, path: "/planner/tasks" },
  { label: "Daily Tracker", icon: CalendarCheck, path: "/daily-tracker" },
  { label: "Settings", icon: Settings, path: "/planner/settings" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col z-50">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="SCS Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-semibold tracking-tight">
            <span className="text-gold">SCS</span>
            <span className="text-silver ml-1">Workspace</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gold/10 text-gold gold-glow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-gold")} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground">
          SCS Internal Tool v1.0
        </div>
      </div>
    </aside>
  );
}
