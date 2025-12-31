import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Zap, Building2, Sparkles, MessageSquare, Loader2, Lock } from "lucide-react";

export default function PricingCardsSection({ 
  plans, 
  isAnnual, 
  loadingPlan, 
  onSubscribe 
}) {
  const [highlightStyle, setHighlightStyle] = useState({ opacity: 0 });
  const [activeIndex, setActiveIndex] = useState(1);
  const gridRef = useRef(null);

  const iconMap = {
    Starter: Zap,
    Growth: Building2,
    Enterprise: Sparkles
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
      transform: `translate(${cardRect.left - gridRect.left}px, ${cardRect.top - gridRect.top}px)`,
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

  return (
    <section className="py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative">
        <div
          className="absolute rounded-[2rem] pointer-events-none transition-all duration-300"
          style={{
            background: "radial-gradient(circle at top, rgba(225,195,122,0.25), rgba(26,26,28,0.8))",
            boxShadow: "0 0 60px rgba(225,195,122,0.4)",
            backdropFilter: "blur(12px)",
            zIndex: 0,
            ...highlightStyle,
          }}
        />

        <div ref={gridRef} className="relative z-10 grid md:grid-cols-3 gap-6 lg:gap-8">
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

                <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center metallic-gradient">
                  <Icon className="w-7 h-7 text-[#1A1A1C]" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-[#A9AAAC] mb-6">{plan.description}</p>

                <div className="mb-8">
                  {plan.monthlyPrice ? (
                    <>
                      <span className="text-4xl font-bold text-white">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-[#5B5C60] ml-1">/month</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-white">Custom</span>
                  )}
                </div>

                <div className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#2A2A2C] flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-[#E1C37A]" />
                      </div>
                      <span className="text-sm text-[#D6D7D8]">{feature}</span>
                    </div>
                  ))}
                </div>

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
      </div>
    </section>
  );
}
