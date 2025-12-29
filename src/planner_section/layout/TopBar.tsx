import { Search, ChevronDown, LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
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
import { toast } from "sonner";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/docs": "Docs",
  "/tasks": "Tasks",
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
        return "Search docs by title or tag...";
      case "/tasks":
        return "Search tasks by title or assignee...";
      default:
        return "Search...";
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  // Get display name from email
  const displayName = user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2">
        <img src="/icon.png" alt="SCS Logo" className="w-5 h-5 object-contain" />
        <span className="text-muted-foreground text-sm">SCS Workspace</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-foreground font-medium">{currentPage}</span>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={getPlaceholder()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-surface border-border/50 focus:border-gold/50 focus:ring-gold/20 transition-colors"
          />
        </div>
      </div>

      {/* Right: User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer hover:bg-surface-hover rounded-lg px-3 py-2 transition-colors">
            <Avatar className="w-8 h-8 border border-gold/30">
              <AvatarFallback className="bg-gradient-to-br from-gold/20 to-silver/20 text-gold text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{displayName}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
