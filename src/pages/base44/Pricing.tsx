import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare,
  AlertCircle,
  Zap,
  Building2,
  Sparkles,
} from "lucide-react";

import SectionHeading from "../../components/shared/SectionHeading";
import PricingCardsSection from "../../components/pricing/PricingCardsSection";
import { PLANS } from "../../components/subscription/plansConfig";

import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";

type PlanName = "Starter" | "Growth" | "Enterprise" | null;

export default function Pricing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<PlanName>(null);
  const [error, setError] = useState<string | null>(null);
  const whatsIncludedRef = useRef<HTMLElement | null>(null);
  const faqRef = useRef<HTMLElement | null>(null);

  const params = new URLSearchParams(location.search);
  const checkoutCancelled = params.get("checkout") === "cancelled";

  const handleSubscribe = async (planName: PlanName) => {
    setError(null);
    window.dispatchEvent(new CustomEvent("scs-support-signal", { detail: { busy: true } }));

    if (planName === "Enterprise") {
      navigate("/contact");
      window.dispatchEvent(new CustomEvent("scs-support-signal", { detail: { busy: false } }));
      return;
    }

    if (!user) {
      navigate("/login");
      window.dispatchEvent(new CustomEvent("scs-support-signal", { detail: { busy: false } }));
      return;
    }

    const plan = PLANS[planName as keyof typeof PLANS];
    if (!plan) return;

    setLoadingPlan(planName);

    try {
      // ⚠️ IMPORTANT
      // Replace this with your Stripe / backend checkout endpoint
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          billingPeriod: isAnnual ? "annual" : "monthly",
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Checkout failed");
      }

      if (data?.url) {
        window.dispatchEvent(
          new CustomEvent("scs-support-signal", { detail: { pageCompleted: "/pricing" } })
        );
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
      window.dispatchEvent(new CustomEvent("scs-support-signal", { detail: { busy: false } }));
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entry.target === whatsIncludedRef.current || entry.target === faqRef.current) {
            window.dispatchEvent(
              new CustomEvent("scs-support-signal", { detail: { type: "pricing-faq" } })
            );
          }
        });
      },
      { threshold: 0.35 }
    );

    if (whatsIncludedRef.current) observer.observe(whatsIncludedRef.current);
    if (faqRef.current) observer.observe(faqRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("scs-support-signal", { detail: { type: "pricing-long" } })
      );
    }, 20000);
    return () => clearTimeout(timer);
  }, []);

  const plans = [
    {
      name: "Starter",
      icon: Zap,
      description: "Essential AI automations for growing businesses",
      monthlyPrice: PLANS.Starter.monthlyPrice,
      annualPrice: PLANS.Starter.annualPrice,
      popular: false,
      color: "metallic",
      features: PLANS.Starter.features,
      cta: "Start Starter Plan",
    },
    {
      name: "Growth",
      icon: Building2,
      description: "Full automation suite for scaling operations",
      monthlyPrice: PLANS.Growth.monthlyPrice,
      annualPrice: PLANS.Growth.annualPrice,
      popular: true,
      color: "gold",
      features: PLANS.Growth.features,
      cta: "Start Growth Plan",
    },
    {
      name: "Enterprise",
      icon: Sparkles,
      description: "Enterprise-grade AI for serious operators",
      monthlyPrice: PLANS.Enterprise.monthlyPrice,
      annualPrice: PLANS.Enterprise.annualPrice,
      popular: false,
      color: "premium",
      features: PLANS.Enterprise.features,
      cta: "Contact Sales",
      contactSales: true,
    },
  ];

  const faqs = [
    {
      q: "How fast can I get started?",
      a: "Most clients are fully operational within 48 hours. Our onboarding AI handles the heavy lifting.",
    },
    {
      q: "Can I switch plans later?",
      a: "Upgrade or downgrade anytime. Changes take effect immediately. No penalties.",
    },
    {
      q: "What if I need custom features?",
      a: "Enterprise plans include custom development. Core and Corporate users can request features.",
    },
    {
      q: "Is there a contract?",
      a: "No long-term contracts. Cancel anytime. We earn your business every month.",
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* HERO */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E1C37A]/10 rounded-full blur-[200px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {checkoutCancelled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3 max-w-md mx-auto"
            >
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <p className="text-sm text-yellow-400">
                Checkout was cancelled. Ready when you are!
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 max-w-md mx-auto"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          <SectionHeading
            badge="Pricing"
            title="Pick your weapon."
            subtitle="Simple pricing. Massive ROI. Cancel anytime."
          />

          {/* BILLING TOGGLE */}
          <div className="flex items-center justify-center gap-4 mt-10">
            <span className={`text-sm ${!isAnnual ? "text-white" : "text-[#5B5C60]"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isAnnual ? "gold-gradient" : "bg-[#3B3C3E]"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  isAnnual ? "left-8" : "left-1"
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? "text-white" : "text-[#5B5C60]"}`}>
              Annual <span className="text-[#E1C37A]">(Save 20%)</span>
            </span>
          </div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <PricingCardsSection
        plans={plans}
        isAnnual={isAnnual}
        loadingPlan={loadingPlan}
        onSubscribe={handleSubscribe}
      />

      {/* WHAT'S INCLUDED */}
      <section ref={whatsIncludedRef} className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeading
            badge="What You Get"
            title="More than just tools."
            subtitle="Every subscription includes the full SCS experience."
          />

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {[
              { title: "Onboarding in 48 Hours", desc: "We set everything up. You just approve." },
              { title: "Dedicated Support", desc: "Real humans when you need them." },
              { title: "Monthly Strategy Calls", desc: "We help you optimize and scale." },
              { title: "Continuous Updates", desc: "New features drop every month." },
              { title: "Training Resources", desc: "Video tutorials for every tool." },
              { title: "Community Access", desc: "Network with other SCS users." },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-2 h-2 rounded-full gold-gradient mt-2" />
                <div>
                  <h4 className="font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-[#A9AAAC]">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeading badge="FAQs" title="Questions? Answers." />

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-[#A9AAAC]">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-card-gold rounded-3xl p-12 glow-gold">
            <h2 className="text-3xl font-bold mb-4">Still deciding?</h2>
            <p className="text-[#A9AAAC] mb-8">
              Book a free 15-minute call. We'll show you exactly how SCS can work for your business.
            </p>
            <Link
              to="/contact"
              className="btn-gold px-8 py-4 rounded-full inline-flex items-center gap-2 font-semibold"
            >
              <MessageSquare className="w-5 h-5" />
              Book a Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
