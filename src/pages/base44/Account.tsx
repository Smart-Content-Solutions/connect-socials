import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  CreditCard,
  LogOut,
  Sparkles,
  ArrowRight,
  Shield,
  Calendar,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Coins,
  Plus,
  Minus,
  History,
  ShoppingCart,
  Zap
} from "lucide-react";
import { useUser, useClerk, useSession } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Token costs
const TOKEN_PRICE = 0.10;
const MIN_TOKENS = 10;
const MAX_TOKENS = 500;
const STEP = 5;

// Early access grant
const EARLY_ACCESS_TOKENS = 30;

type CreditTransaction = {
  id: string;
  amount: number;
  type: "purchase" | "deduction" | "initial_grant";
  description: string;
  metadata: any;
  created_at: string;
};

export default function Account() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { session } = useSession();
  const [searchParams] = useSearchParams();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Credits state
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [purchaseAmount, setPurchaseAmount] = useState(50);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [grantingTokens, setGrantingTokens] = useState(false);

  // Fetch credits from API
  const fetchCredits = useCallback(async () => {
    if (!session) return;
    try {
      setLoadingCredits(true);
      const token = await session.getToken();
      const res = await fetch("/api/get-credits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTokenBalance(data.balance);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    } finally {
      setLoadingCredits(false);
    }
  }, [session]);

  // Auto-grant tokens for early_access users
  const grantInitialTokens = useCallback(async () => {
    if (!session || !user) return;
    const role = (user.publicMetadata?.role as string) || "user";
    if (role !== "early_access" && role !== "admin") return;

    // Check if already granted
    const hasGrant = transactions.some((t) => t.type === "initial_grant");
    if (hasGrant) return;
    if (tokenBalance > 0) return; // Already has tokens
    if (grantingTokens) return;

    try {
      setGrantingTokens(true);
      const token = await session.getToken();
      // Use the deduct endpoint in reverse — we'll handle this via a direct Supabase call through a new grant endpoint
      // Actually, let's use the get-credits endpoint pattern and just POST to grant
      const res = await fetch("/api/grant-initial-tokens", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        toast.success(`🎉 Welcome! You've received ${EARLY_ACCESS_TOKENS} free tokens with your Early Access plan!`);
        await fetchCredits();
      }
    } catch (err) {
      console.error("Failed to grant initial tokens:", err);
    } finally {
      setGrantingTokens(false);
    }
  }, [session, user, transactions, tokenBalance, grantingTokens, fetchCredits]);

  useEffect(() => {
    if (isSignedIn && session) {
      fetchCredits();
    }
  }, [isSignedIn, session, fetchCredits]);

  // Auto-grant after credits are loaded
  useEffect(() => {
    if (!loadingCredits && transactions.length === 0 && tokenBalance === 0 && user) {
      grantInitialTokens();
    }
  }, [loadingCredits, transactions, tokenBalance, user, grantInitialTokens]);

  // Handle Stripe success redirect
  useEffect(() => {
    const tokenStatus = searchParams.get("tokens");
    if (tokenStatus === "success") {
      toast.success("Tokens purchased successfully! Your balance will update shortly.");
      // Refetch after a short delay to allow webhook to process
      setTimeout(() => fetchCredits(), 2000);
      setTimeout(() => fetchCredits(), 5000);
    } else if (tokenStatus === "cancelled") {
      toast.info("Token purchase cancelled.");
    }
  }, [searchParams, fetchCredits]);

  // Handle token purchase via Stripe Checkout
  const handlePurchaseTokens = async () => {
    if (!session || isPurchasing) return;
    try {
      setIsPurchasing(true);
      const token = await session.getToken();
      const res = await fetch("/api/create-token-checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenAmount: purchaseAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start token purchase");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E1C37A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return null;
  }

  // Get user details from metadata
  const role = (user.publicMetadata?.role as string) || "user";
  const planName = (user.publicMetadata?.planName as string) || "Early Access Plan";
  const subscriptionStatus = (user.publicMetadata?.subscriptionStatus as string) || "active";
  const hasSubscription = role === "early_access" || role === "admin";
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const stripeCustomerId = user.publicMetadata?.stripeCustomerId;

  const handleManageSubscription = async () => {
    try {
      setLoadingPortal(true);
      setError(null);

      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load portal");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingPortal(false);
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "purchase":
        return { label: "Purchase", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: Plus };
      case "deduction":
        return { label: "Used", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: Minus };
      case "initial_grant":
        return { label: "Welcome Bonus", color: "text-[#E1C37A]", bg: "bg-[#E1C37A]/10", border: "border-[#E1C37A]/20", icon: Sparkles };
      default:
        return { label: type, color: "text-[#A9AAAC]", bg: "bg-[#3B3C3E]/50", border: "border-[#3B3C3E]", icon: History };
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">

        {/* ✅ HEADER */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            Account Settings
          </h1>
          <p className="text-[#A9AAAC]">
            Manage your subscription, tokens, and account details
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* ✅ PROFILE CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center">
                <User className="w-8 h-8 text-[#1A1A1C]" />
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  {user.fullName}
                </h2>
                <p className="text-sm text-[#A9AAAC]">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-[#3B3C3E] rounded-full text-xs text-[#E1C37A] capitalize border border-[#E1C37A]/20">
                  {role.replace("_", " ")}
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="w-full btn-outline py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>

          {/* ✅ SUBSCRIPTION DETAILS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 glass-card rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Subscription
                </h3>
                <p className="text-sm text-[#A9AAAC]">
                  Your current plan and billing
                </p>
              </div>
            </div>

            {hasSubscription ? (
              // ✅ ACTIVE SUBSCRIPTION STATE
              <div className="space-y-6">
                <div className="bg-[#1A1A1C]/50 rounded-xl p-6 border border-[#3B3C3E]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#1A1A1C]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">
                          {planName}
                        </h4>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`flex items-center gap-1 ${isActive ? "text-green-400" : "text-yellow-400"}`}>
                            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            <span className="capitalize">{subscriptionStatus.replace("_", " ")}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-sm text-[#A9AAAC] border-t border-[#3B3C3E] pt-4 mt-4">
                    <div>
                      <p className="mb-1 text-[#5B5C60]">Next billing date</p>
                      <p className="text-white">Managed in Stripe Portal</p>
                    </div>
                    <div>
                      <p className="mb-1 text-[#5B5C60]">Plan Amount</p>
                      <p className="text-white">Managed in Stripe Portal</p>
                    </div>
                  </div>
                </div>

                {role === "admin" ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-400 text-sm">
                    You have full Admin access. No subscription management needed.
                  </div>
                ) : (
                  <div>
                    {stripeCustomerId ? (
                      <Button
                        onClick={handleManageSubscription}
                        disabled={loadingPortal}
                        className="btn-outline w-full sm:w-auto hover:bg-[#3B3C3E] hover:text-white hover:border-[#E1C37A]/50 transition-all border-[#3B3C3E]"
                      >
                        {loadingPortal ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading Portal...
                          </>
                        ) : (
                          <>
                            <Settings className="w-4 h-4 mr-2" />
                            Manage Subscription & Billing
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="text-amber-400 text-sm bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                        Info: Subscription managed externally or manual role assignment.
                      </div>
                    )}
                    {error && (
                      <p className="text-red-400 text-sm mt-2">{error}</p>
                    )}
                    <p className="text-xs text-[#5B5C60] mt-3">
                      Click above to cancel subscription, update payment method, or view invoice history securely via Stripe.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // ✅ NO SUBSCRIPTION STATE
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#3B3C3E]/50 flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-[#5B5C60]" />
                </div>

                <h4 className="font-semibold text-white mb-2">
                  No Active Subscription
                </h4>

                <p className="text-sm text-[#A9AAAC] mb-6">
                  Subscribe to unlock powerful AI automation tools
                </p>

                <Link
                  to="/pricing"
                  className="btn-gold px-6 py-3 rounded-xl inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  View Plans
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* ✅ CREDITS & TOKENS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Coins className="w-6 h-6 text-[#E1C37A]" />
              Credits & Tokens
            </h2>
            <p className="text-sm text-[#A9AAAC] mt-1">
              Tokens are used for AI video generation. 1 Token = £0.10
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* TOKEN BALANCE CARD */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-card-gold rounded-2xl p-6 relative overflow-hidden"
            >
              {/* Decorative glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#E1C37A]/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#1A1A1C]" />
                  </div>
                  <p className="text-sm font-medium text-[#A9AAAC]">Available Tokens</p>
                </div>

                {loadingCredits ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#E1C37A]" />
                    <span className="text-[#A9AAAC]">Loading...</span>
                  </div>
                ) : (
                  <>
                    <motion.div
                      key={tokenBalance}
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-5xl font-black text-gold-gradient mb-2"
                      style={{
                        background: "linear-gradient(135deg, #E1C37A 0%, #B6934C 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {tokenBalance}
                    </motion.div>
                    <p className="text-sm text-[#5B5C60]">
                      ≈ £{(tokenBalance * TOKEN_PRICE).toFixed(2)} value
                    </p>
                  </>
                )}

                {/* Token costs reference */}
                <div className="mt-5 pt-4 border-t border-[#E1C37A]/10 space-y-2">
                  <p className="text-xs font-medium text-[#A9AAAC] uppercase tracking-wider">AI Video Costs</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#A9AAAC]">5 sec video</span>
                    <span className="text-[#E1C37A] font-semibold">8 tokens</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#A9AAAC]">10 sec video</span>
                    <span className="text-[#E1C37A] font-semibold">15 tokens</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* PURCHASE TOKENS CARD */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#E1C37A]" />
                Purchase Tokens
              </h3>
              <p className="text-sm text-[#A9AAAC] mb-6">
                Drag the slider to choose how many tokens you want
              </p>

              {/* Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[#5B5C60]">{MIN_TOKENS} tokens</span>
                  <span className="text-sm text-[#5B5C60]">{MAX_TOKENS} tokens</span>
                </div>

                {/* Custom styled range slider */}
                <div className="relative">
                  <input
                    type="range"
                    min={MIN_TOKENS}
                    max={MAX_TOKENS}
                    step={STEP}
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #E1C37A 0%, #B6934C ${((purchaseAmount - MIN_TOKENS) / (MAX_TOKENS - MIN_TOKENS)) * 100}%, #3B3C3E ${((purchaseAmount - MIN_TOKENS) / (MAX_TOKENS - MIN_TOKENS)) * 100}%, #3B3C3E 100%)`,
                    }}
                  />
                  <style>{`
                    input[type="range"]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #E1C37A, #B6934C);
                      cursor: pointer;
                      box-shadow: 0 0 12px rgba(225, 195, 122, 0.5);
                      border: 2px solid #1A1A1C;
                      transition: box-shadow 0.2s;
                    }
                    input[type="range"]::-webkit-slider-thumb:hover {
                      box-shadow: 0 0 20px rgba(225, 195, 122, 0.7);
                    }
                    input[type="range"]::-moz-range-thumb {
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, #E1C37A, #B6934C);
                      cursor: pointer;
                      box-shadow: 0 0 12px rgba(225, 195, 122, 0.5);
                      border: 2px solid #1A1A1C;
                    }
                  `}</style>
                </div>

                {/* Quick select buttons */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {[10, 25, 50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setPurchaseAmount(amt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${purchaseAmount === amt
                        ? "bg-[#E1C37A]/20 text-[#E1C37A] border border-[#E1C37A]/40"
                        : "bg-[#3B3C3E]/50 text-[#A9AAAC] border border-[#3B3C3E] hover:border-[#E1C37A]/20 hover:text-[#E1C37A]"
                        }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Purchase summary */}
              <div className="bg-[#1A1A1C]/60 rounded-xl p-4 border border-[#3B3C3E] mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#A9AAAC]">
                      <span className="text-white font-bold text-lg">{purchaseAmount}</span> tokens
                    </p>
                    <p className="text-xs text-[#5B5C60] mt-1">
                      {purchaseAmount < 100 ? "" : purchaseAmount < 200 ? "Popular choice!" : "Best value!"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{
                      background: "linear-gradient(135deg, #E1C37A 0%, #B6934C 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                      £{(purchaseAmount * TOKEN_PRICE).toFixed(2)}
                    </p>
                    <p className="text-xs text-[#5B5C60]">£{TOKEN_PRICE.toFixed(2)} per token</p>
                  </div>
                </div>
              </div>

              {/* Buy button */}
              <button
                onClick={handlePurchaseTokens}
                disabled={isPurchasing}
                className="w-full btn-gold py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(225,195,122,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    Buy {purchaseAmount} Tokens — £{(purchaseAmount * TOKEN_PRICE).toFixed(2)}
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* TRANSACTION HISTORY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 glass-card rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-[#E1C37A]" />
              Token History
            </h3>

            {loadingCredits ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#E1C37A]" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#3B3C3E]/50 flex items-center justify-center mb-3">
                  <History className="w-7 h-7 text-[#5B5C60]" />
                </div>
                <p className="text-[#A9AAAC] text-sm">No transactions yet</p>
                <p className="text-[#5B5C60] text-xs mt-1">Purchase tokens or generate AI videos to see history</p>
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
                <style>{`
                  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                  .custom-scrollbar::-webkit-scrollbar-track { background: #1A1A1C; border-radius: 4px; }
                  .custom-scrollbar::-webkit-scrollbar-thumb { background: #3B3C3E; border-radius: 4px; }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #E1C37A; }
                `}</style>

                {transactions.map((tx) => {
                  const badge = getTransactionBadge(tx.type);
                  const BadgeIcon = badge.icon;
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#1A1A1C]/40 border border-[#3B3C3E]/50 hover:border-[#3B3C3E] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${badge.bg} flex items-center justify-center ${badge.border} border`}>
                          <BadgeIcon className={`w-4 h-4 ${badge.color}`} />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{tx.description}</p>
                          <p className="text-xs text-[#5B5C60]">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* ✅ SECURITY NOTE */}
        <div className="mt-10 flex items-center gap-3 text-sm text-[#5B5C60]">
          <Shield className="w-4 h-4" />
          <span>
            Payments are securely processed via Stripe. We never store card details.
          </span>
        </div>

        {/* ✅ PLANNER SECTION - ADMIN ONLY */}
        {user?.publicMetadata?.role === "admin" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 glass-card rounded-2xl p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#1A1A1C]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Planner</h3>
                <p className="text-sm text-[#A9AAAC]">
                  Access the admin planner dashboard
                </p>
              </div>
            </div>

            <Link
              to="/planner"
              className="btn-gold px-6 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              Go <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
