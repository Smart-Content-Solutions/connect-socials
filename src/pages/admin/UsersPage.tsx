import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useAuth } from '@clerk/clerk-react';
import {
  Users,
  Shield,
  Star,
  User as UserIcon,
  Search,
  Filter,
  Crown,
  ChevronDown,
  Check,
  Layers,
  Coins,
  ArrowUpDown,
  Loader2,
  AlertTriangle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

const TIER_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  early_access: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pro: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const TX_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  purchase: { label: 'Purchase', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  deduction: { label: 'Used', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  initial_grant: { label: 'Welcome Bonus', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  admin_adjust: { label: 'Admin Adjust', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  refund: { label: 'Refund', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
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

  // Token state
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({});
  const [tokenDialogUser, setTokenDialogUser] = useState<ClerkUser | null>(null);

  const CrownIcon = Crown;
  const StarIcon = Star;
  const ShieldIcon = Shield;
  const UserIconComp = UserIcon;
  const SearchIcon = Search;
  const FilterIcon = Filter;
  const UsersIcon = Users;

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
    fetchAllBalances();
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

  async function fetchAllBalances() {
    try {
      const response = await fetch('/api/admin-get-all-user-balances', {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.balances) {
        setTokenBalances(data.balances);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }

  const handleBalanceUpdated = useCallback((userId: string, newBalance: number) => {
    setTokenBalances((prev) => ({ ...prev, [userId]: newBalance }));
  }, []);

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
              const userBalance = tokenBalances[user.id] ?? null;

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

                    {/* Tokens Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTokenDialogUser(user)}
                      className="flex items-center gap-2 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 min-w-[120px] justify-center"
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-sm text-amber-300">Tokens</span>
                      <Badge
                        variant="secondary"
                        className="h-5 min-w-[24px] px-1.5 text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30 ml-0.5"
                      >
                        {userBalance !== null ? userBalance : '–'}
                      </Badge>
                    </Button>

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

      {/* Token Management Dialog */}
      {tokenDialogUser && (
        <TokenManagementDialog
          user={tokenDialogUser}
          open={!!tokenDialogUser}
          onClose={() => setTokenDialogUser(null)}
          getToken={getToken}
          onBalanceUpdated={handleBalanceUpdated}
        />
      )}
    </div>
  );
}


// ─── Token Management Dialog ──────────────────────────────────────────
function TokenManagementDialog({
  user,
  open,
  onClose,
  getToken,
  onBalanceUpdated,
}: {
  user: ClerkUser;
  open: boolean;
  onClose: () => void;
  getToken: () => Promise<string | null>;
  onBalanceUpdated: (userId: string, newBalance: number) => void;
}) {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [totalTx, setTotalTx] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Adjust state
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const PAGE_SIZE = 20;
  const userEmail = user.emailAddresses[0]?.emailAddress || user.id;
  const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || userEmail;

  const fetchCredits = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) setLoadingMore(true); else setLoadingCredits(true);

      const token = await getToken();
      const res = await fetch(
        `/api/admin-get-user-credits?userId=${encodeURIComponent(user.id)}&page=${pageNum}&pageSize=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error('Failed to fetch credits');

      const data = await res.json();
      setBalance(data.balance ?? 0);
      setTotalTx(data.total ?? 0);

      if (append) {
        setTransactions((prev) => [...prev, ...(data.transactions || [])]);
      } else {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      toast.error('Failed to load token data');
    } finally {
      setLoadingCredits(false);
      setLoadingMore(false);
    }
  }, [user.id, getToken]);

  useEffect(() => {
    if (open) {
      setPage(1);
      setAdjustValue('');
      setAdjustReason('');
      fetchCredits(1);
    }
  }, [open, fetchCredits]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCredits(nextPage, true);
  }

  const parsedNewBalance = parseInt(adjustValue, 10);
  const isValidAdjust = !isNaN(parsedNewBalance) && parsedNewBalance >= 0 && Number.isFinite(parsedNewBalance);
  const delta = isValidAdjust && balance !== null ? parsedNewBalance - balance : 0;

  async function handleConfirmAdjust() {
    if (!isValidAdjust) return;
    try {
      setIsAdjusting(true);
      const token = await getToken();
      const res = await fetch('/api/admin-adjust-user-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          newBalance: parsedNewBalance,
          reason: adjustReason.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to adjust tokens');
      }

      const data = await res.json();
      toast.success(`Tokens adjusted: ${balance} → ${data.newBalance} (${delta >= 0 ? '+' : ''}${delta})`);
      setBalance(data.newBalance);
      onBalanceUpdated(user.id, data.newBalance);
      setAdjustValue('');
      setAdjustReason('');
      setShowConfirm(false);

      // Refetch history to include new entry
      setPage(1);
      fetchCredits(1);
    } catch (error: any) {
      console.error('Error adjusting credits:', error);
      toast.error(error.message || 'Failed to adjust tokens');
    } finally {
      setIsAdjusting(false);
    }
  }

  // Compute resulting balance for each transaction
  function computeResultingBalances(txs: CreditTransaction[], currentBalance: number): number[] {
    const results: number[] = [];
    let running = currentBalance;
    for (let i = 0; i < txs.length; i++) {
      results.push(running);
      running -= txs[i].amount;
    }
    return results;
  }

  const resultingBalances = balance !== null ? computeResultingBalances(transactions, balance) : [];
  const hasMore = transactions.length < totalTx;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="admin-theme max-w-2xl bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              Token Management
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {userName} &middot; {userEmail}
            </DialogDescription>
          </DialogHeader>

          {loadingCredits ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="ml-2 text-gray-400">Loading token data...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Balance Display */}
              <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-5">
                <p className="text-sm text-gray-400 mb-1">Current Token Balance</p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-4xl font-black"
                    style={{
                      background: 'linear-gradient(135deg, #E1C37A 0%, #B6934C 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {balance}
                  </span>
                  <span className="text-sm text-gray-500">tokens</span>
                </div>
              </div>

              {/* Adjust Section */}
              <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpDown className="w-4 h-4 text-amber-400" />
                  <p className="text-sm font-medium text-white">Adjust Tokens</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">New Balance</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 100"
                      value={adjustValue}
                      onChange={(e) => setAdjustValue(e.target.value)}
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Reason (optional)</label>
                    <Input
                      type="text"
                      placeholder="e.g. Bonus for feedback"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="bg-gray-900 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Preview */}
                {isValidAdjust && delta !== 0 && (
                  <div className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-700">
                    <span className="text-gray-400">
                      {balance} → {parsedNewBalance}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        delta > 0
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      )}
                    >
                      {delta > 0 ? '+' : ''}{delta}
                    </Badge>
                  </div>
                )}

                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={!isValidAdjust || delta === 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40"
                  size="sm"
                >
                  Apply Adjustment
                </Button>
              </div>

              {/* Transaction History */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  Token History
                  <span className="text-xs text-gray-500 font-normal">
                    ({totalTx} total)
                  </span>
                </p>

                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No token history found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx, idx) => {
                      const typeConfig = TX_TYPE_CONFIG[tx.type] || {
                        label: tx.type,
                        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                      };
                      const resultBalance = resultingBalances[idx];
                      const isPositive = tx.amount > 0;
                      const adminEmail = tx.metadata?.admin_email;
                      const reason = tx.metadata?.reason;

                      return (
                        <div
                          key={tx.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-3 py-2.5 rounded-lg bg-gray-800/40 border border-gray-700/50 text-sm"
                        >
                          {/* Date */}
                          <span className="text-xs text-gray-500 shrink-0 w-[130px]">
                            {new Date(tx.created_at).toLocaleString()}
                          </span>

                          {/* Type badge */}
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px] shrink-0 border", typeConfig.color)}
                          >
                            {typeConfig.label}
                          </Badge>

                          {/* Delta */}
                          <span
                            className={cn(
                              "font-mono font-semibold shrink-0 w-[60px] text-right",
                              isPositive ? "text-emerald-400" : "text-red-400"
                            )}
                          >
                            {isPositive ? '+' : ''}{tx.amount}
                          </span>

                          {/* Resulting balance */}
                          <span className="text-xs text-gray-500 shrink-0 w-[50px] text-right">
                            →{resultBalance}
                          </span>

                          {/* Description / source */}
                          <span className="text-xs text-gray-400 flex-1 truncate">
                            {tx.description}
                            {adminEmail && (
                              <span className="text-purple-400 ml-1">
                                (by {adminEmail})
                              </span>
                            )}
                          </span>

                          {/* Reason note */}
                          {reason && (
                            <span className="text-[10px] text-gray-500 italic truncate max-w-[150px]">
                              {reason}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Load More */}
                    {hasMore && (
                      <div className="text-center pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="border-gray-600 hover:bg-gray-800 text-gray-300"
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Load More
                              <ChevronDown className="w-3.5 h-3.5 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="admin-theme bg-gray-900 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Confirm Token Adjustment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 space-y-2">
              <span className="block">
                This will change tokens for <span className="text-white font-medium">{userName}</span> ({userEmail}):
              </span>
              <span className="block text-lg">
                <span className="text-gray-300">{balance}</span>
                <span className="text-gray-500 mx-2">→</span>
                <span className="text-white font-semibold">{parsedNewBalance}</span>
                <span className={cn(
                  "ml-2 font-semibold",
                  delta > 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  ({delta > 0 ? '+' : ''}{delta})
                </span>
              </span>
              {adjustReason.trim() && (
                <span className="block text-sm">
                  Reason: <span className="text-gray-300 italic">{adjustReason.trim()}</span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isAdjusting}
              className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmAdjust();
              }}
              disabled={isAdjusting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isAdjusting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Applying...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
