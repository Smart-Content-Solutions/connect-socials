import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Sparkles,
  ArrowRight,
  Eye,
  Zap,
  Share2,
  Globe,
  Mail,
  FileText,
  BarChart3,
  Users,
  TrendingUp,
  Link2,
  Star,
  Clock,
  Activity,
  Bot,
  Database,
  Target,
  Languages,
  Calendar,
  Megaphone,
  Shield,
  Play,
  Check,
  Crown
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useSubscription } from "../../components/subscription/useSubscription";
import WelcomeModal from "../../components/subscription/WelcomeModal";

export default function DashboardPreview() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const { user, isAuthenticated, isSubscriptionActive } = useSubscription();
  const { user: clerkUser } = useUser();

  const hasSeenWelcome =
    clerkUser?.publicMetadata?.has_seen_welcome === true;

  /* ===========================
     ✅ Welcome Flow (Clerk Safe)
  ============================ */
  useEffect(() => {
    if (!isAuthenticated || !user || !isSubscriptionActive()) return;

    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }
  }, [isAuthenticated, user, isSubscriptionActive, hasSeenWelcome]);

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
  };

  /* ===========================
     ✅ Pulsing Tool Activity
  ============================ */
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
      
      {/* ============================================
          SECTION 1: THE VAULT DOOR HERO
          Emotional Goal: Immediate tension. They've arrived at 
          something powerful but closed.
          ============================================ */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#E1C37A]/10 rounded-full blur-[200px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#D6D7D8]/5 rounded-full blur-[150px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E1C37A]/40 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          {/* Lock animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[#3B3C3E] to-[#1A1A1C] border border-[#E1C37A]/30 flex items-center justify-center shadow-2xl">
                <Lock className="w-10 h-10 text-[#E1C37A]" />
              </div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-3xl border border-[#E1C37A]/20 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-[#E1C37A]/10 text-[#E1C37A] border border-[#E1C37A]/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#E1C37A] animate-pulse" />
              Dashboard Locked
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          >
            You can see it.
            <span className="block mt-2 gold-text">You just can't use it. Yet.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-[#A9AAAC] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            This is the command center. 21 AI automations humming behind glass. 
            Every tool you see below is already running for someone else. 
            <span className="text-white font-medium"> The only thing missing is your access key.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to='/pricing'
              className="btn-gold px-8 py-4 rounded-full text-base font-semibold flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-5 h-5" />
              Unlock Everything
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to='/pricing'
              className="btn-outline px-8 py-4 rounded-full text-base font-medium flex items-center justify-center gap-2"
            >
              See Pricing First
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: THE BLURRED DASHBOARD
          Emotional Goal: Visceral FOMO. They see the machine 
          working but can't touch the controls.
          ============================================ */}
      <section className="py-12 relative">
        <div className="max-w-7xl mx-auto px-6">
          {/* Dashboard Container */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* The glowing frame */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#E1C37A]/20 via-[#D6D7D8]/10 to-[#E1C37A]/20 rounded-[2rem] blur-xl" />
            
            <div className="relative glass-card rounded-3xl p-4 md:p-8 border border-[#E1C37A]/10">
              {/* Browser chrome */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#3B3C3E]/50">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="ml-4 px-4 py-1.5 rounded-full bg-[#1A1A1C] border border-[#3B3C3E] text-xs text-[#5B5C60]">
                    app.smartcontentsolutions.io/dashboard
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">Live</span>
                </div>
              </div>

              {/* Stats Bar - Blurred but visible */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative">
                {[
                  { label: "Automations Running", value: "1,247", icon: Zap },
                  { label: "Content Generated", value: "38.4k", icon: FileText },
                  { label: "Leads This Month", value: "2,891", icon: Users },
                  { label: "Hours Saved", value: "847", icon: Clock }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#1A1A1C]/60 rounded-2xl p-4 border border-[#3B3C3E]/30 relative overflow-hidden"
                  >
                    <div className="absolute top-2 right-2">
                      <stat.icon className="w-4 h-4 text-[#3B3C3E]" />
                    </div>
                    <span className="text-xs text-[#5B5C60] block mb-1">{stat.label}</span>
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E1C37A]/50 to-transparent" />
                  </motion.div>
                ))}
                {/* Blur overlay on stats */}
                <div className="absolute inset-0 backdrop-blur-[2px] bg-[#1A1A1C]/20 rounded-2xl" />
              </div>

              {/* Section Label */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg metallic-gradient flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#1A1A1C]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Core Automation Suite</h3>
                  <p className="text-xs text-[#5B5C60]">11 tools • Included in all plans</p>
                </div>
              </div>

              {/* Core Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {coreTools.map((tool, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    onMouseEnter={() => setHoveredTool(`core-${index}`)}
                    onMouseLeave={() => setHoveredTool(null)}
                    className="group relative cursor-pointer"
                  >
                    <div className={`bg-[#1A1A1C]/60 rounded-2xl p-5 border transition-all duration-500 h-full ${
                      pulseIndex === index ? 'border-[#E1C37A]/50' : 'border-[#3B3C3E]/30'
                    } group-hover:border-[#E1C37A]/30`}>
                      
                      {/* Status indicator */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${pulseIndex === index ? 'bg-green-400 animate-pulse' : 'bg-[#5B5C60]'}`} />
                        <span className="text-[10px] text-[#5B5C60]">{tool.status}</span>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl metallic-gradient flex items-center justify-center flex-shrink-0">
                          <tool.icon className="w-5 h-5 text-[#1A1A1C]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm mb-1 pr-16">{tool.name}</h4>
                          <p className="text-xs text-[#5B5C60] italic leading-relaxed">"{tool.whisper}"</p>
                        </div>
                      </div>

                      {/* Lock overlay on hover */}
                      <AnimatePresence>
                        {hoveredTool === `core-${index}` && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#1A1A1C] via-[#1A1A1C]/90 to-[#1A1A1C]/70 flex flex-col items-center justify-center"
                          >
                            <div className="w-10 h-10 rounded-full bg-[#E1C37A]/20 flex items-center justify-center mb-2">
                              <Lock className="w-5 h-5 text-[#E1C37A]" />
                            </div>
                            <span className="text-sm font-medium text-[#E1C37A]">Unlock with subscription</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Corporate Section Label */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                  <Crown className="w-4 h-4 text-[#1A1A1C]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Corporate Power Tools</h3>
                  <p className="text-xs text-[#5B5C60]">10 enterprise tools • Corporate tier</p>
                </div>
                <span className="ml-auto px-3 py-1 rounded-full text-[10px] font-medium bg-[#E1C37A]/10 text-[#E1C37A] border border-[#E1C37A]/20">
                  ENTERPRISE
                </span>
              </div>

              {/* Corporate Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
                {corporateTools.map((tool, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    onMouseEnter={() => setHoveredTool(`corp-${index}`)}
                    onMouseLeave={() => setHoveredTool(null)}
                    className="group relative cursor-pointer"
                  >
                    <div className={`bg-[#1A1A1C]/60 rounded-2xl p-5 border transition-all duration-500 h-full ${
                      pulseIndex === index + 11 ? 'border-[#E1C37A]/50' : 'border-[#E1C37A]/10'
                    } group-hover:border-[#E1C37A]/40`}>
                      
                      {/* Status indicator */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${pulseIndex === index + 11 ? 'bg-[#E1C37A] animate-pulse' : 'bg-[#5B5C60]'}`} />
                        <span className="text-[10px] text-[#E1C37A]/70">{tool.status}</span>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl gold-gradient flex items-center justify-center flex-shrink-0">
                          <tool.icon className="w-5 h-5 text-[#1A1A1C]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm mb-1 pr-16">{tool.name}</h4>
                          <p className="text-xs text-[#5B5C60] italic leading-relaxed">"{tool.whisper}"</p>
                        </div>
                      </div>

                      {/* Lock overlay on hover */}
                      <AnimatePresence>
                        {hoveredTool === `corp-${index}` && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#1A1A1C] via-[#1A1A1C]/90 to-[#1A1A1C]/70 flex flex-col items-center justify-center"
                          >
                            <div className="w-10 h-10 rounded-full bg-[#E1C37A]/20 flex items-center justify-center mb-2">
                              <Lock className="w-5 h-5 text-[#E1C37A]" />
                            </div>
                            <span className="text-sm font-medium text-[#E1C37A]">Unlock with subscription</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}

                {/* Extra blur layer for corporate */}
                <div className="absolute inset-0 backdrop-blur-[1px] bg-gradient-to-t from-[#1A1A1C]/50 to-transparent pointer-events-none rounded-2xl" />
              </div>

              {/* Live Activity Feed - Heavy Blur */}
              <div className="mt-12 relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#E1C37A]" />
                    <h3 className="text-sm font-medium text-[#A9AAAC]">Live Activity Feed</h3>
                  </div>
                  <span className="text-xs text-[#5B5C60]">Updating in real-time</span>
                </div>
                
                <div className="space-y-3 locked-blur select-none">
                  {[
                    "Social post published to Instagram • 2 seconds ago",
                    "Lead captured from landing page • 5 seconds ago", 
                    "Email sequence triggered for new subscriber • 8 seconds ago",
                    "SEO article generated and scheduled • 12 seconds ago",
                    "Competitor alert: New campaign detected • 15 seconds ago"
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-[#1A1A1C]/50 rounded-xl border border-[#3B3C3E]/20">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-sm text-[#A9AAAC]">{activity}</span>
                    </div>
                  ))}
                </div>

                {/* Unlock overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-[#A9AAAC] mb-4">This feed updates every second.</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="btn-gold px-6 py-3 rounded-full text-sm flex items-center gap-2 mx-auto"
                    >
                      <Eye className="w-4 h-4" />
                      Subscribe to Watch Live
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================
          SECTION 3: SOCIAL PROOF
          Emotional Goal: Validation. Others are inside. 
          The visitor is missing out.
          ============================================ */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E1C37A]/5 to-transparent" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs uppercase tracking-widest text-[#E1C37A] mb-4 block">They're Already Inside</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              These people have the key.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="glass-card rounded-2xl p-6 relative"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-[#1A1A1C] font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{testimonial.name}</h4>
                    <p className="text-xs text-[#5B5C60]">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-[#A9AAAC] italic">"{testimonial.quote}"</p>
                <div className="absolute top-4 right-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-[#E1C37A] fill-[#E1C37A]" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-[#5B5C60] text-sm mt-8"
          >
            500+ businesses automated and counting
          </motion.p>
        </div>
      </section>

      {/* ============================================
          SECTION 4: WHAT HAPPENS AFTER UNLOCKING
          Emotional Goal: Visualization. Paint the picture 
          of life with access.
          ============================================ */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs uppercase tracking-widest text-[#E1C37A] mb-4 block">After You Subscribe</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                The lock clicks open.
                <span className="block text-[#A9AAAC] text-2xl mt-2 font-normal">
                  Here's what happens next.
                </span>
              </h2>
              
              <div className="space-y-6">
                {[
                  { step: "01", title: "Instant Dashboard Access", desc: "Every tool unlocks. No waiting. No approval process. You're in." },
                  { step: "02", title: "Automations Start Running", desc: "Connect your accounts. Watch the first posts schedule themselves." },
                  { step: "03", title: "Results Start Flowing", desc: "Leads captured. Content published. Analytics updating. All while you sleep." }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                    className="flex gap-4"
                  >
                    <span className="text-3xl font-bold gold-text">{item.step}</span>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-[#A9AAAC]">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Video preview card */}
              <div className="glass-card-gold rounded-3xl p-8 glow-gold">
                <div className="aspect-video rounded-2xl bg-[#1A1A1C] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E1C37A]/10 to-transparent" />
                  
                  {/* Fake dashboard screenshot */}
                  <div className="absolute inset-4 rounded-xl border border-[#3B3C3E]/30 overflow-hidden">
                    <div className="h-6 bg-[#3B3C3E]/30 flex items-center gap-1 px-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    </div>
                    <div className="p-2 grid grid-cols-3 gap-1">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-8 rounded bg-[#3B3C3E]/20" />
                      ))}
                    </div>
                  </div>

                  {/* Play button */}
                  <button className="absolute inset-0 flex items-center justify-center group">
                    <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-6 h-6 text-[#1A1A1C] ml-1" />
                    </div>
                  </button>
                </div>
                <p className="text-center text-sm text-[#A9AAAC] mt-4">
                  Watch: Your first 24 hours inside the dashboard
                </p>
              </div>

              {/* Floating benefits */}
              <div className="absolute -left-4 top-8 glass-card rounded-xl p-4 max-w-[200px] hidden lg:block">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Verified Result</span>
                </div>
                <p className="text-xs text-[#A9AAAC]">"First campaign live in under 10 minutes"</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: WHAT'S INCLUDED
          Emotional Goal: Value stacking. Show them 
          everything they're about to get.
          ============================================ */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E1C37A]/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs uppercase tracking-widest text-[#E1C37A] mb-4 block">Your Subscription Includes</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything unlocks at once.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {unlockBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 glass-card rounded-xl"
              >
                <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-[#1A1A1C]" />
                </div>
                <span className="text-[#D6D7D8]">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 6: FINAL CTA
          Emotional Goal: Urgency. The moment of decision.
          Make it impossible to leave without clicking.
          ============================================ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[#E1C37A]/10 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E1C37A]/20 rounded-full blur-[200px]" />
        </div>

        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl gold-gradient flex items-center justify-center glow-gold">
              <Sparkles className="w-10 h-10 text-[#1A1A1C]" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              The machines are waiting.
            </h2>
            <p className="text-xl text-[#A9AAAC] mb-10 max-w-xl mx-auto">
              21 automations. One subscription. Zero excuses. 
              <span className="block mt-2 text-white font-medium">
                Your competition is already running. Are you?
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to='/pricing'
                className="btn-gold px-10 py-5 rounded-full text-lg font-semibold flex items-center justify-center gap-3 group"
              >
                <Lock className="w-5 h-5 group-hover:hidden" />
                <Sparkles className="w-5 h-5 hidden group-hover:block" />
                Unlock The Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <p className="text-sm text-[#5B5C60]">
              Cancel anytime. No contracts. No games.
            </p>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-[#3B3C3E]/30">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#5B5C60]" />
                <span className="text-xs text-[#5B5C60]">Bank-grade security</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5B5C60]" />
                <span className="text-xs text-[#5B5C60]">48hr onboarding</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#5B5C60]" />
                <span className="text-xs text-[#5B5C60]">500+ users</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Subscribe Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card-gold rounded-3xl p-8 max-w-md w-full relative glow-gold"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-[#A9AAAC] hover:text-white"
              >
                ×
              </button>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl gold-gradient flex items-center justify-center">
                  <Lock className="w-8 h-8 text-[#1A1A1C]" />
                </div>
                <h3 className="text-2xl font-bold mb-3">This feature is locked.</h3>
                <p className="text-[#A9AAAC] mb-6">
                  Subscribe to watch the live activity feed and access all 21 automation tools.
                </p>
                <Link
                  to='/pricing'
                  className="btn-gold w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  View Pricing Plans
                </Link>
                <p className="text-xs text-[#5B5C60] mt-4">
                  Plans start at $397/month
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Modal for new subscribers */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeClose}
        planName={user?.subscription_plan}
      />
    </div>
  );
}