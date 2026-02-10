import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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

const TIER_COLORS = {
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  early_access: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pro: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const AVAILABLE_ENTITLEMENTS = [
  'social_automation',
  'wp_ai_agent',
  'ai_agent',
  'ai_video',
];

export default function UsersPage() {
  const { user: currentUser } = useUser();
  const { getToken } = useAuth();
  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Safeguard imports
  const CrownIcon = Crown || (() => <span />);
  const StarIcon = Star || (() => <span />);
  const ShieldIcon = Shield || (() => <span />);
  const UserIconComp = UserIcon || (() => <span />);
  const SearchIcon = Search || (() => <span />);
  const FilterIcon = Filter || (() => <span />);
  const UsersIcon = Users || (() => <span />);

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
          Manage user access tiers and entitlements
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

              let Icon = UserIconComp;
              if (tier === 'admin') Icon = CrownIcon;
              if (tier === 'early_access') Icon = StarIcon;
              if (tier === 'pro') Icon = ShieldIcon;

              const isUpdating = updatingUserId === user.id;

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
                          className={`w-[140px] ${TIER_COLORS[tier as keyof typeof TIER_COLORS]
                            }`}
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

                    {/* Entitlements */}
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_ENTITLEMENTS.map((ent) => {
                        const hasEntitlement = entitlements.includes(ent);
                        return (
                          <Button
                            key={ent}
                            size="sm"
                            variant={hasEntitlement ? 'default' : 'outline'}
                            onClick={() =>
                              toggleEntitlement(user.id, ent, hasEntitlement)
                            }
                            disabled={isUpdating}
                            className={
                              hasEntitlement
                                ? 'bg-green-600 hover:bg-green-700'
                                : ''
                            }
                          >
                            {hasEntitlement ? (
                              <Minus className="w-3 h-3 mr-1" />
                            ) : (
                              <Plus className="w-3 h-3 mr-1" />
                            )}
                            {ent.replace(/_/g, ' ')}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Show effective entitlements */}
                  {entitlements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">
                        Active Entitlements:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {entitlements.map((ent) => (
                          <Badge
                            key={ent}
                            variant="secondary"
                            className="text-xs"
                          >
                            {ent}
                          </Badge>
                        ))}
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
