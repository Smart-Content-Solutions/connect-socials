import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  CreditCard,
  LogOut,
  Sparkles,
  ArrowRight,
  Shield,
  Calendar,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";

export default function Account() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

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

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">

        {/* ✅ HEADER */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            Account Settings
          </h1>
          <p className="text-[#A9AAAC]">
            Manage your subscription and account details
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

          {/* ✅ SUBSCRIPTION - STATIC UI (until your backend is connected) */}
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

            {/* ✅ NO SUBSCRIPTION STATE */}
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#3B3C3E]/50 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-[#5B5C60]" />
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
          </motion.div>
        </div>

        {/* ✅ SECURITY NOTE */}
        <div className="mt-10 flex items-center gap-3 text-sm text-[#5B5C60]">
          <Shield className="w-4 h-4" />
          <span>
            Payments are securely processed. We never store card details.
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
