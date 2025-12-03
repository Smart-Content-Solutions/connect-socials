import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Sparkles, ArrowRight, Eye, Zap, Share2, Globe, Mail,
  FileText, BarChart3, Users, TrendingUp, Link2, Star, Clock,
  Activity, Bot, Database, Target, Languages, Calendar, Megaphone,
  Shield, Play, Check, Crown
} from "lucide-react";
import { useSubscription } from "../../components/subscription/useSubscription";
import WelcomeModal from "../../components/subscription/WelcomeModal";

export default function DashboardPreview() {
  const [hoveredTool, setHoveredTool] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { user, isAuthenticated, isSubscriptionActive } = useSubscription();

  useEffect(() => {
    if (isAuthenticated && user && isSubscriptionActive() && !user.has_seen_welcome) {
      setShowWelcomeModal(true);
    }
  }, [isAuthenticated, user]);

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 21);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const coreTools = [
    { icon: Share2, name: "Social Media Post Automation", whisper: "Posts write themselves. Schedules fill up overnight.", status: "12 posts queued" },
    { icon: Globe, name: "WordPress SEO Optimisation", whisper: "Every article ranks. Every meta tag optimized.", status: "Score: 98/100" },
    { icon: Mail, name: "AI Email Marketing Engine", whisper: "Subject lines that get opened. Copy that converts.", status: "47% open rate" },
    { icon: FileText, name: "Blog & SEO Content Engine", whisper: "Feed it keywords. Get back articles that rank.", status: "Generating..." },
    { icon: BarChart3, name: "AI Ads Analytics Tool", whisper: "See what's burning money. See what's printing it.", status: "3.2x ROAS" },
    { icon: Users, name: "Lead Capture & CRM Automation", whisper: "Leads flow in. Get tagged. Get nurtured. Automatically.", status: "892 captured" },
    { icon: TrendingUp, name: "Performance Reports", whisper: "Weekly insights. No spreadsheets. Just answers.", status: "Report ready" },
    { icon: Link2, name: "Backlink Outreach Automation", whisper: "AI pitches. Links land. Domain authority climbs.", status: "234 acquired" },
    { icon: Star, name: "Review Generation Manager", whisper: "Happy customers leave reviews. On autopilot.", status: "4.9 rating" },
    { icon: Clock, name: "Client Onboarding Automation", whisper: "New clients get welcomed. Zero manual work.", status: "2 min setup" },
    { icon: Activity, name: "Competitor Monitoring & Alerts", whisper: "Know when they move. Before they know you know.", status: "12 tracked" }
  ];

  const corporateTools = [
    { icon: BarChart3, name: "MMM Analytics Edge", whisper: "Marketing mix modeling that actually predicts.", status: "Forecasting..." },
    { icon: Database, name: "CRM Integration Suite", whisper: "Listrak. Attentive. Your entire stack. Connected.", status: "Syncing" },
    { icon: Star, name: "Review Syndication", whisper: "Bazaarvoice integration. Reviews everywhere.", status: "Distributing" },
    { icon: Sparkles, name: "Website Personalisation", whisper: "Dynamic Yield powered. Every visitor sees their version.", status: "Adapting" },
    { icon: Bot, name: "AI Chatbot & Analysis", whisper: "Custom AI trained on your brand. Always on.", status: "Online 24/7" },
    { icon: Target, name: "PPC Management Suite", whisper: "Smec. SEMrush. Google Ads. One control panel.", status: "Optimizing" },
    { icon: Languages, name: "Multi-Language Engine", whisper: "WriterAI powered translations. Sound native.", status: "42 languages" },
    { icon: Calendar, name: "Advanced Social Scheduling", whisper: "Multi-brand. Multi-platform. Zero chaos.", status: "Scheduled" },
    { icon: Eye, name: "Site Optimisation", whisper: "ContentSquare insights. See exactly what works.", status: "Analyzing" },
    { icon: Megaphone, name: "Paid Social Command", whisper: "Meta. TikTok. LinkedIn. All from here.", status: "Live" }
  ];

  const testimonials = [
    { name: "Sarah Chen", role: "CMO, TechScale", quote: "I cancelled 7 tool subscriptions the week I got access.", avatar: "SC" },
    { name: "Marcus Webb", role: "Founder, GrowthHQ", quote: "My team of 3 now outproduces agencies with 30 people.", avatar: "MW" },
    { name: "Lisa Park", role: "Marketing Director", quote: "The ROI hit in the first month. Everything else is profit.", avatar: "LP" }
  ];

  const unlockBenefits = [
    "Every automation unlocked instantly",
    "Unlimited content generation",
    "Real-time analytics dashboard",
    "Priority AI processing",
    "Dedicated success manager"
  ];

  return (
    <div className="min-h-screen pt-20 pb-0 bg-[#1A1A1C] overflow-hidden">

      {/* ✅ ONLY LINK CHANGES BELOW – DESIGN UNTOUCHED */}

      <Link to="/pricing" className="btn-gold px-8 py-4 rounded-full">
        Unlock Everything
      </Link>

      <Link to="/pricing" className="btn-outline px-8 py-4 rounded-full">
        See Pricing First
      </Link>

      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
            <motion.div className="glass-card-gold rounded-3xl p-8 max-w-md w-full">
              <Link to="/pricing" className="btn-gold w-full py-4 rounded-xl">
                View Pricing Plans
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeClose}
        planName={user?.subscription_plan}
      />
    </div>
  );
}
