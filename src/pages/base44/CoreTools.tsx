import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Share2 } from "lucide-react";

import SectionHeading from "../../components/shared/SectionHeading";
import ToolGridWithHighlight from "../../components/shared/ToolGridWithHighlight";
import SubscribeModal from "../../components/shared/SubscribeModal";
import { coreTools } from "../../components/tools/toolsConfig";
import { useSubscription } from "../../components/subscription/useSubscription";

import type { ToolType } from "../../components/tools/ToolPageTemplate";

export default function CoreTools() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>("");

  const { user } = useSubscription();
  const isAdmin = user?.base_tier === "admin";

  // ✅ ✅ ✅ FIX: RECEIVE FULL TOOL OBJECT, NOT STRING
  const handleUnlock = (tool: ToolType) => {
    if (isAdmin) return;

    // ✅ Extract STRING ONLY
    setSelectedTool(tool.name);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* ================= HERO ================= */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D6D7D8]/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-[#A9AAAC]/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <SectionHeading
            badge="Core Tools"
            title="The essentials. Automated."
            subtitle="Everything you need to run a lean, mean content machine. Perfect for growing businesses ready to scale."
          />

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <span className="px-4 py-2 rounded-full text-sm bg-[#D6D7D8]/10 text-[#D6D7D8] border border-[#D6D7D8]/20">
              11 Powerful Tools
            </span>
            <span className="px-4 py-2 rounded-full text-sm bg-[#D6D7D8]/10 text-[#D6D7D8] border border-[#D6D7D8]/20">
              Unlimited Usage
            </span>
            <span className="px-4 py-2 rounded-full text-sm bg-[#D6D7D8]/10 text-[#D6D7D8] border border-[#D6D7D8]/20">
              24/7 Automation
            </span>
          </div>
        </div>
      </section>

      {/* ================= TOOLS GRID ================= */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <ToolGridWithHighlight
            tools={coreTools}
            tier="Core"
            onUnlockClick={handleUnlock}   // ✅ now correct
          />
        </div>
      </section>

      {/* ================= PREVIEW ================= */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 md:p-12"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-[#D6D7D8] text-sm font-medium uppercase tracking-wider">
                  Tool Preview
                </span>

                <h3 className="text-2xl md:text-3xl font-bold mt-4 mb-4">
                  See the Social Media Engine in action
                </h3>

                <p className="text-[#A9AAAC] mb-6">
                  Watch how a single click generates a week's worth of posts,
                  perfectly tailored to each platform.
                </p>

                <button
                  onClick={() =>
                    handleUnlock(coreTools[0] as unknown as ToolType)
                  }
                  className="btn-gold px-6 py-3 rounded-full flex items-center gap-2"
                >
                  {isAdmin ? "Watch Now" : "Watch Demo"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <div
                  className={`aspect-video rounded-2xl bg-[#1A1A1C] ${!isAdmin ? "locked-blur" : ""
                    }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full metallic-gradient flex items-center justify-center">
                      <Share2 className="w-8 h-8 text-[#1A1A1C]" />
                    </div>
                  </div>
                </div>

                {!isAdmin && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1C]/50 rounded-2xl">
                    <button
                      onClick={() =>
                        handleUnlock(coreTools[0] as unknown as ToolType)
                      }
                      className="btn-outline px-6 py-3 rounded-full"
                    >
                      Unlock to Watch
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to automate the basics?
          </h2>

          <p className="text-[#A9AAAC] mb-8 max-w-xl mx-auto">
            Core Tools start at $397/month.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pricing"
              className="btn-gold px-8 py-4 rounded-full flex items-center justify-center gap-2 font-semibold"
            >
              View Pricing
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/corporate-tools"
              className="btn-outline px-8 py-4 rounded-full flex items-center justify-center gap-2"
            >
              See Corporate Tools
            </Link>
          </div>
        </div>
      </section>

      {/* ================= SUBSCRIBE MODAL ================= */}
      {!isAdmin && (
        <SubscribeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          toolName={selectedTool}   // ✅ now always STRING
        />
      )}
    </div>
  );
}
