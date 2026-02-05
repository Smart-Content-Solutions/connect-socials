import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";
import LogoCarouselSection from "./LogoCarousel";

interface StatItem {
  value: string;
  label: string;
}

export default function HeroSection(): JSX.Element {
  const [isVideoHovered, setIsVideoHovered] = useState<boolean>(false);

  const stats: StatItem[] = [
    { value: "10x", label: "Faster Content" },
    { value: "85%", label: "Cost Reduction" },
    { value: "24/7", label: "Always Running" },
    { value: "500+", label: "Active Users" },
  ];

  return (
    <>
      <style>{`
        @keyframes metallicShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .metallic-title {
          background: linear-gradient(
            90deg,
            #A9AAAC 0%,
            #D6D7D8 15%,
            #E1C37A 30%,
            #B6934C 45%,
            #E1C37A 55%,
            #D6D7D8 70%,
            #A9AAAC 85%,
            #D6D7D8 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: metallicShimmer 6s linear infinite;
        }

        .logo-glow {
          filter: drop-shadow(0 0 30px rgba(225, 195, 122, 0.15))
                  drop-shadow(0 0 60px rgba(225, 195, 122, 0.08));
        }
      `}</style>

      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        <AnimatedBackground />

        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#E1C37A]/8 rounded-full blur-[200px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#D6D7D8]/5 rounded-full blur-[150px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E1C37A]/30 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="metallic-title text-lg md:text-xl lg:text-2xl font-semibold tracking-wide">
              Smart Content Solutions Limited
            </h2>
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center lg:gap-16 xl:gap-24">

            <div className="max-w-2xl text-center lg:text-left lg:flex-shrink-0">

              <motion.div className="lg:justify-start flex justify-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-[#E1C37A]/10 text-[#E1C37A] border border-[#E1C37A]/20 mb-6 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3" />
                  AI Automation Agency
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E1C37A] animate-pulse" />
                </span>
              </motion.div>

              <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your marketing team
                <span className="block mt-2 gold-text">replaced by machines.</span>
              </motion.h1>

              <motion.p className="text-xl text-[#A9AAAC] mb-10 leading-relaxed">
                Smart Content Solutions automates your entire content pipeline. 
                Posts go live. Leads come in. You sleep.
              </motion.p>

              <motion.div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link to="/dashboard-preview" className="btn-gold px-8 py-4 rounded-full font-semibold flex items-center gap-2">
                  See The Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link to="/pricing" className="btn-outline px-8 py-4 rounded-full font-medium">
                  View Pricing
                </Link>
              </motion.div>

              <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-3xl md:text-4xl font-bold gold-text mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-[#5B5C60] uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div className="mt-12 flex justify-center lg:justify-start">
                <button
                  onMouseEnter={() => setIsVideoHovered(true)}
                  onMouseLeave={() => setIsVideoHovered(false)}
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#1A1A1C]/60 border border-[#3B3C3E]/50 backdrop-blur-sm"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isVideoHovered ? "gold-gradient scale-110" : "bg-[#3B3C3E]"}`}>
                    <Play className="w-4 h-4 ml-0.5" />
                  </div>
                  <span className="text-sm text-[#A9AAAC]">Watch how it works</span>
                  <span className="text-xs text-[#5B5C60]">2 min</span>
                </button>
              </motion.div>
            </div>

            <motion.div className="hidden lg:flex lg:justify-center lg:pt-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692b490db467b6aad2cac54d/463a9a536_Edittheuploadedlo.png" 
                alt="Smart Content Solutions"
                className="w-52 h-52 xl:w-64 xl:h-64 object-contain logo-glow"
              />
            </motion.div>
          </div>

          <div className="mt-16">
            <LogoCarouselSection />
          </div>
        </div>
      </section>
    </>
  );
}
