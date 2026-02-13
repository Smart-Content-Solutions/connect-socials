import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useAuth } from '@clerk/clerk-react';
import {
  Users,
  Shield,
  Star,
  User as UserIcon,
  Search,
  Filter,
  Plus,
  Minus,
  Crown,
  ChevronDown,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { loadRoleConfig, type RoleConfig } from '@/lib/roleConfig';

interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  publicMetadata: {
    role?: string;
    base_tier?: string;
    entitlements?: string[];
    subscription_status?: string;
  };
  createdAt: number;
}

const TIER_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  early_access: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pro: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function UsersPage() {
  const { user: currentUser } = useUser();
  const { getToken } = useAuth();
  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  // Safeguard icons
  const CrownIcon = Crown;
  const StarIcon = Star;
  const ShieldIcon = Shield;
  const UserIconComp = UserIcon;
  const SearchIcon = Search;
  const FilterIcon = Filter;
  const UsersIcon = Users;

  // Load role config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await loadRoleConfig();
        setRoleConfig(config);
      } catch (error) {
        console.error('Error loading role config:', error);
      } finally {
        setIsConfigLoading(false);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin-list-users', {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function updateUserTier(userId: string, newTier: string) {
    try {
      setUpdatingUserId(userId);
      const response = await fetch('/api/admin-update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          userId,
          base_tier: newTier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user tier');
      }

      toast.success(`User tier updated to ${newTier}`);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user tier:', error);
      toast.error('Failed to update user tier');
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function toggleEntitlement(
    userId: string,
    entitlement: string,
    hasIt: boolean
  ) {
    try {
      setUpdatingUserId(userId);
      const response = await fetch('/api/admin-update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          userId,
          [hasIt ? 'removeEntitlement' : 'addEntitlement']: entitlement,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update entitlement');
      }

      toast.success(
        hasIt
          ? `Removed ${entitlement} entitlement`
          : `Added ${entitlement} entitlement`
      );
      await fetchUsers();
    } catch (error) {
      console.error('Error updating entitlement:', error);
      toast.error('Failed to update entitlement');
    } finally {
      setUpdatingUserId(null);
    }
  }

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      user.emailAddresses[0]?.emailAddress.toLowerCase().includes(searchLower) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower);

    const userTier =
      user.publicMetadata?.base_tier || user.publicMetadata?.role || 'free';
    const matchesTier = filterTier === 'all' || userTier === filterTier;

    return matchesSearch && matchesTier;
  });

  if (loading) {
    return (
      <div className="flex bg-background items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          User Management
        </h1>
        <p className="text-gray-400 mt-1">
          Manage user access tiers and add-on roles
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['admin', 'early_access', 'pro', 'free'].map((tier) => {
          const count = users.filter(
            (u) =>
              (u.publicMetadata?.base_tier || u.publicMetadata?.role || 'free') ===
              tier
          ).length;

          let Icon = UserIconComp;
          if (tier === 'admin') Icon = CrownIcon;
          if (tier === 'early_access') Icon = StarIcon;
          if (tier === 'pro') Icon = ShieldIcon;

          return (
            <Card key={tier} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 capitalize">{tier.replace(/_/g, ' ')}</p>
                    <p className="text-2xl font-bold text-white mt-1">{count}</p>
                  </div>
                  <Icon className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-full md:w-[200px] bg-gray-800 border-gray-700">
                <FilterIcon className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="early_access">Early Access</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const tier =
                user.publicMetadata?.base_tier ||
                user.publicMetadata?.role ||
                'free';
              const entitlements = user.publicMetadata?.entitlements || [];
              const isUpdating = updatingUserId === user.id;

              let Icon = UserIconComp;
              if (tier === 'admin') Icon = CrownIcon;
              if (tier === 'early_access') Icon = StarIcon;
              if (tier === 'pro') Icon = ShieldIcon;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-400">
                            {user.emailAddresses[0]?.emailAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tier Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Tier:</span>
                      <Select
                        value={tier}
                        onValueChange={(newTier) =>
                          updateUserTier(user.id, newTier)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger
                          className={`w-[140px] ${TIER_COLORS[tier] || TIER_COLORS.free}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="early_access">
                            Early Access
                          </SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Add-on Roles Dropdown */}
                    <AddOnRolesDropdown
                      userId={user.id}
                      entitlements={entitlements}
                      isUpdating={isUpdating}
                      roleConfig={roleConfig}
                      onToggle={(ent, hasIt) => toggleEntitlement(user.id, ent, hasIt)}
                    />
                  </div>

                  {/* Active entitlements summary */}
                  {entitlements.length > 0 && roleConfig && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">
                        Active Add-on Roles:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {entitlements.map((ent) => {
                          const addonRole = roleConfig.addOnRoles.find(r => r.id === ent);
                          return (
                            <Badge
                              key={ent}
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                addonRole
                                  ? `${addonRole.bgColor} ${addonRole.borderColor} ${addonRole.color} border`
                                  : ""
                              )}
                            >
                              {addonRole?.name || ent.replace(/_/g, ' ')}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// ─── Add-on Roles Dropdown Component ─────────────────────────────────
function AddOnRolesDropdown({
  userId,
  entitlements,
  isUpdating,
  roleConfig,
  onToggle,
}: {
  userId: string;
  entitlements: string[];
  isUpdating: boolean;
  roleConfig: RoleConfig | null;
  onToggle: (entitlement: string, hasIt: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCount = entitlements.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={cn(
          "flex items-center gap-2 border-gray-600 hover:bg-gray-800 min-w-[160px] justify-between",
          activeCount > 0 && "border-emerald-500/40 bg-emerald-500/5"
        )}
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">
            Add-ons
          </span>
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-[20px] px-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            >
              {activeCount}
            </Badge>
          )}
        </div>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-xl shadow-black/30 overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-gray-800 bg-gray-900/80">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Add-on Roles
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Toggle extra permissions for this user
              </p>
            </div>

            {/* Role Items */}
            <div className="py-1 max-h-[280px] overflow-y-auto">
              {roleConfig ? (
                roleConfig.addOnRoles.map((role) => {
                  const hasIt = entitlements.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      onClick={() => {
                        onToggle(role.id, hasIt);
                      }}
                      disabled={isUpdating}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 hover:bg-gray-800/70",
                        hasIt && "bg-gray-800/40"
                      )}
                    >
                      {/* Checkbox */}
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 shrink-0",
                        hasIt
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-600 bg-transparent"
                      )}>
                        {hasIt && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Role Info */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium",
                          hasIt ? "text-white" : "text-gray-400"
                        )}>
                          {role.name}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {role.description}
                        </p>
                      </div>

                      {/* Color indicator */}
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        hasIt ? "bg-emerald-400" : "bg-gray-600"
                      )} />
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-gray-500">Loading roles...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {activeCount > 0 && (
              <div className="px-3 py-2 border-t border-gray-800 bg-gray-900/80">
                <p className="text-[10px] text-gray-500">
                  {activeCount} add-on{activeCount !== 1 ? 's' : ''} active
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
