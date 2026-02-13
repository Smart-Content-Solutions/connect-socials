import React from "react";
import { Link } from "react-router-dom";
import { Lock, ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useSubscription } from "../subscription/useSubscription";

interface LockedToolCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  tier?: "Core" | "Corporate" | string;
  planRequired?: string;
  slug?: string;
  onUnlockClick?: () => void;
  index?: number;
}

export default function LockedToolCard({
  icon: Icon,
  title,
  description,
  tier = "Core",
  planRequired = "Starter",
  slug,
  onUnlockClick,
  index = 0,
}: LockedToolCardProps): JSX.Element {
  const { hasAccessToTool, user } = useSubscription();

  const isAdmin = user?.base_tier === "admin";
  const isEarlyAccess = user?.base_tier === "early_access";
  const isPro = user?.base_tier === "pro";

  // hasAccessToTool now correctly handles early_access/pro via entitlements
  const hasAccess = isAdmin || isEarlyAccess || isPro || hasAccessToTool(planRequired);

  const CardWrapper: React.ElementType = slug ? Link : "div";
  const cardProps = slug ? { to: `/tool?slug=${slug}` } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <CardWrapper {...cardProps} className="block">
        <div
          className={`glass-card rounded-2xl p-6 h-full transition-all duration-500 cursor-pointer hover:border-[#E1C37A]/30 ${hasAccess ? "hover:border-green-500/50" : ""
            }`}
        >
          {/* Locked / Unlocked Overlay */}
          {!hasAccess ? (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-[#1A1A1C]/50 to-[#1A1A1C]/80 z-10 flex flex-col items-center justify-end pb-6 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-[#3B3C3E] flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-[#E1C37A]" />
              </div>
              <span
                onClick={onUnlockClick}
                className="btn-gold px-5 py-2 rounded-full text-sm flex items-center gap-2 pointer-events-auto"
              >
                View Tool
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          ) : (
            <div className="absolute top-4 right-4 z-10">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          )}

          {/* Content */}
          <div className={!hasAccess ? "opacity-60" : ""}>
            <div
              className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${tier === "Corporate" ? "gold-gradient" : "metallic-gradient"
                }`}
            >
              <Icon className="w-6 h-6 text-[#1A1A1C]" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-white">{title}</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${tier === "Corporate"
                  ? "bg-[#E1C37A]/20 text-[#E1C37A]"
                  : "bg-[#D6D7D8]/20 text-[#D6D7D8]"
                  }`}
              >
                {tier}
              </span>
            </div>

            <p className="text-sm text-[#A9AAAC] leading-relaxed">
              {description}
            </p>
          </div>

          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E1C37A]/5 to-transparent" />
          </div>
        </div>
      </CardWrapper>
    </motion.div>
  );
}
