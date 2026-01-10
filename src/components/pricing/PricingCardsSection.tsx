import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Building2,
  Sparkles,
  Lock,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

export default function PricingCardsSection({
  plans,
  isAnnual,
  loadingPlan,
  onSubscribe,
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [highlightStyle, setHighlightStyle] = useState({ opacity: 0 });
  const [activeIndex, setActiveIndex] = useState(1);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const iconMap = {
    Starter: Zap,
    Growth: Building2,
    Enterprise: Sparkles,
  };

  const moveHighlightToIndex = (index: number) => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll("[data-plan-card]");
    const card = cards[index] as HTMLElement;
    if (!card) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    setHighlightStyle({
      opacity: 1,
      transform: `translate(${cardRect.left - gridRect.left}px, ${
        cardRect.top - gridRect.top
      }px)`,
      width: `${cardRect.width}px`,
      height: `${cardRect.height}px`,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => moveHighlightToIndex(activeIndex), 100);
    const handleResize = () => moveHighlightToIndex(activeIndex);
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeIndex]);

  const handleStartTrial = async () => {
    try {
      if (!isLoaded) {
        alert("Auth is loading, please try again.");
        return;
      }

      if (!isSignedIn) {
        alert("Please log in first.");
        return;
      }

      if (onSubscribe) onSubscribe("Early Access");

      const token = await getToken();
      if (!token) {
        alert("Authentication error. Please re-login.");
        return;
      }

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data?.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Failed to start checkout. Please try again.");
    }
  };

  return (
    <section className="py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative">
        <div
          className="absolute rounded-[2rem] pointer-events-none transition-all duration-300"
          style={{
            background:
              "radial-gradient(circle at top, rgba(225,195,122,0.25), rgba(26,26,28,0.8))",
            boxShadow: "0 0 60px rgba(225,195,122,0.4)",
            backdropFilter: "blur(12px)",
            zIndex: 0,
            ...highlightStyle,
          }}
        />

        <div
          ref={gridRef}
          className="relative z-10 grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {plans.map((plan, index) => {
            const Icon = iconMap[plan.name] || Zap;
            const isActive = index === activeIndex;

            return (
              <motion.div
                key={plan.name}
                data-plan-card
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`relative rounded-[2rem] border px-7 py-8 flex flex-col ${
                  isActive
                    ? "border-[#E1C37A] bg-[#141414]"
                    : "border-[#3B3C3E] bg-[#1A1A1C]"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center metallic-gradient">
                  <Icon className="w-7 h-7 text-[#1A1A1C]" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>

                <p className="text-sm text-[#A9AAAC] mb-6">
                  {plan.description}
                </p>

                <div className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex gap-3">
                      <Check className="w-4 h-4 text-[#E1C37A]" />
                      <span className="text-sm text-[#D6D7D8]">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-center h-12 rounded-xl bg-[#2A2A2C] border border-[#3B3C3E] text-[#A9AAAC]">
                  <Lock className="w-4 h-4 mr-2" />
                  Coming Soon
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="relative z-10 mt-16 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Early Access Plan
          </h2>

          <p className="text-[#A9AAAC] mb-6">
            3-day free trial, then £20/month. Cancel anytime.
          </p>

          <div className="mb-8 inline-block">
            <div className="flex gap-3 items-center justify-center text-left">
              <Check className="w-5 h-5 text-[#E1C37A] flex-shrink-0" />
              <span className="text-base text-[#D6D7D8]">WordPress SEO Optimisation and Post</span>
            </div>
          </div>

          <button
            onClick={handleStartTrial}
            className="px-8 h-12 rounded-xl btn-gold"
          >
            Start 3-Day Free Trial
          </button>
        </div>
      </div>
    </section>
  );
}
