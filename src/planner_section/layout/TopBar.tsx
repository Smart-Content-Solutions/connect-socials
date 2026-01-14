import { Search, ChevronDown, LogOut, Menu } from "lucide-react";
import { useLocation, NavLink, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSearch } from "../store/DataProvider";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { navItems } from "./Sidebar";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/docs": "Docs",
  "/tasks": "Tasks",
  "/planner/daily-tracker": "Daily Tracker",
  "/settings": "Settings",
};

export function TopBar() {
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useSearch();
  const { user } = useUser();
  const { signOut } = useClerk();
  const currentPage = pageTitles[location.pathname] || "Dashboard";

  const getPlaceholder = () => {
    switch (location.pathname) {
      case "/docs":
        return "Search docs...";
      case "/tasks":
        return "Search tasks...";
      default:
        return "Search...";
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const displayName = user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <button className="lg:hidden p-2 -ml-2 hover:bg-surface rounded-md transition-colors" id="mobile-menu-trigger">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-[hsl(240,5%,10%)] border-[hsl(240,5%,18%)] planner-theme">
            <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="/icon.png" alt="SCS Logo" className="w-8 h-8 object-contain" />
                <span className="text-xl font-semibold tracking-tight">
                  <span className="text-gold">SCS</span>
                  <span className="text-silver ml-1">Workspace</span>
                </span>
              </Link>
            </div>
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
                        ? "bg-gold/10 text-gold shadow-[0_0_15px_rgba(225,195,122,0.15)]"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive && "text-gold")} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground hidden sm:inline">SCS Workspace</span>
          <span className="text-muted-foreground/50 hidden sm:inline">/</span>
          <span className="text-foreground font-medium truncate max-w-[100px] sm:max-w-none">{currentPage}</span>
        </div>
      </div>

      {/* Center: Search (Hidden on very small screens, or narrower) */}
      <div className="flex-1 max-w-xs md:max-w-md mx-4 md:mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={getPlaceholder()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-surface border-border/50 focus:border-gold/50 focus:ring-gold/20 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Right: User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-surface-hover rounded-lg px-2 py-1.5 md:px-3 md:py-2 transition-colors">
            <Avatar className="w-8 h-8 border border-gold/30">
              <AvatarFallback className="bg-gradient-to-br from-gold/20 to-silver/20 text-gold text-xs md:text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground hidden md:inline">{displayName}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="planner-theme w-48 bg-card border-border">
          <div className="px-2 py-1.5 border-b border-border mb-1 md:hidden">
            <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
          </div>
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
