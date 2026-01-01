import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Building2,
  Sparkles,
  MessageSquare,
  Loader2,
  Lock,
} from "lucide-react";

export default function PricingCardsSection({
  plans,
  isAnnual,
  loadingPlan,
  onSubscribe,
}) {
  const [highlightStyle, setHighlightStyle] = useState({ opacity: 0 });
  const [activeIndex, setActiveIndex] = useState(1);
  const gridRef = useRef(null);

  const iconMap = {
    Starter: Zap,
    Growth: Building2,
    Enterprise: Sparkles,
  };

  const moveHighlightToIndex = (index) => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll("[data-plan-card]");
    const card = cards[index];
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

  // --- ADDED: Stripe Checkout handler for Early Access plan ---
  const handleStartTrial = async () => {
    try {
      // Keep existing behaviour if parent uses onSubscribe
      if (onSubscribe) {
        onSubscribe("Early Access");
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error("No URL returned from Stripe session", data);
        alert("Something went wrong starting the checkout. Please try again.");
      }
    } catch (error) {
      console.error("Error creating checkout session", error);
      alert("Something went wrong starting the checkout. Please try again.");
    }
  };
  // --- END ADDED ---

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
            const isActive = index === activeIndex;
            const Icon = iconMap[plan.name] || Zap;

            return (
              <motion.div
                key={plan.name}
                data-plan-card
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`relative rounded-[2rem] border px-7 py-8 flex flex-col transition-all ${
                  isActive
                    ? "border-[#E1C37A] bg-[#141414] scale-[1.02]"
                    : "border-[#3B3C3E] bg-[#1A1A1C] opacity-90"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 rounded-full gold-gradient text-xs font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Coming Soon badge for all plans */}
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 rounded-full bg-[#2A2A2C] border border-[#3B3C3E] text-[11px] font-semibold uppercase tracking-wide text-[#E1C37A]">
                    Coming Soon
                  </div>
                </div>

                <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center metallic-gradient">
                  <Icon className="w-7 h-7 text-[#1A1A1C]" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-[#A9AAAC] mb-6">
                  {plan.description}
                </p>

                <div className="mb-8">
                  {plan.monthlyPrice ? (
                    <>
                      <span className="text-4xl font-bold text-white">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-[#5B5C60] ml-1">/month</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      Custom
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#2A2A2C] flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-[#E1C37A]" />
                      </div>
                      <span className="text-sm text-[#D6D7D8]">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Locked CTA */}
                <div className="mt-auto">
                  <div className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-[#2A2A2C] text-[#A9AAAC] font-semibold cursor-not-allowed border border-[#3B3C3E]">
                    <Lock className="w-4 h-4" />
                    Coming Soon
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Early Access Plan Section */}
        <div className="relative z-10 mt-16 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Early Access Plan
          </h2>
          <p className="text-sm md:text-base text-[#A9AAAC] mb-6">
            Get started with the SCS WordPress Automation Engine while we
            finish the full automation suite. Enjoy a 3-day free trial, then
            £20/month. Cancel anytime.
          </p>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">£20</span>
              <span className="text-[#5B5C60] text-sm">
                /month after 3-day free trial
              </span>
            </div>

            <ul className="text-sm text-[#D6D7D8] space-y-1">
              <li>WordPress SEO publishing automation</li>
              <li>Blog & content engine for articles</li>
              <li>Founders pricing — locked in while active</li>
            </ul>

            <button
              onClick={handleStartTrial} // UPDATED: now uses Stripe handler
              className="mt-4 w-full sm:w-auto px-8 h-12 rounded-xl btn-gold flex items-center justify-center gap-2"
            >
              Start 3-Day Free Trial
            </button>

            <p className="text-xs text-[#A9AAAC] mt-2 max-w-md mx-auto">
              Only the WordPress automation engine is live right now. The full
              SCS Starter, Growth & Enterprise plans are coming soon.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
