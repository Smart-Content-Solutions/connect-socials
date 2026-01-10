import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import FeedbackModal from "./FeedbackModal";

const FEEDBACK_STORAGE_KEYS = {
  lastPromptAt: "scs_feedback_last_prompt_at",
  lastSubmittedAt: "scs_feedback_last_submitted_at",
};

const DAYS_UNTIL_PROMPT = 14;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export default function FeedbackPrompt() {
  const { isSignedIn, isLoaded } = useUser();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only check if user is authenticated and Clerk has loaded
    if (!isLoaded || !isSignedIn) {
      return;
    }

    // Check if we should show the prompt
    const shouldShowPrompt = (): boolean => {
      const now = Date.now();
      
      // Get last prompt time
      const lastPromptAtStr = localStorage.getItem(FEEDBACK_STORAGE_KEYS.lastPromptAt);
      const lastPromptAt = lastPromptAtStr ? new Date(lastPromptAtStr).getTime() : 0;
      
      // Get last submission time
      const lastSubmittedAtStr = localStorage.getItem(FEEDBACK_STORAGE_KEYS.lastSubmittedAt);
      const lastSubmittedAt = lastSubmittedAtStr ? new Date(lastSubmittedAtStr).getTime() : 0;

      // Check conditions:
      // 1. At least 14 days since last prompt
      // 2. At least 14 days since last submission (if ever submitted)
      const daysSinceLastPrompt = (now - lastPromptAt) / MILLISECONDS_PER_DAY;
      const daysSinceLastSubmission = lastSubmittedAt > 0 
        ? (now - lastSubmittedAt) / MILLISECONDS_PER_DAY 
        : DAYS_UNTIL_PROMPT + 1; // If never submitted, allow prompt

      return daysSinceLastPrompt >= DAYS_UNTIL_PROMPT && 
             daysSinceLastSubmission >= DAYS_UNTIL_PROMPT;
    };

    if (shouldShowPrompt()) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, isLoaded]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(FEEDBACK_STORAGE_KEYS.lastPromptAt, new Date().toISOString());
  };

  const handleLeaveFeedback = () => {
    setShowPrompt(false);
    setShowModal(true);
    localStorage.setItem(FEEDBACK_STORAGE_KEYS.lastPromptAt, new Date().toISOString());
  };

  // Don't render anything if not authenticated or prompt shouldn't show
  if (!isLoaded || !isSignedIn || !showPrompt) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div className="glass-card rounded-2xl p-6 border border-[#3B3C3E]/50 shadow-2xl">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-[#A9AAAC] hover:text-[#D6D7D8] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-[#E1C37A]/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-[#E1C37A]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#D6D7D8] mb-1">
                    Quick feedback?
                  </h3>
                  <p className="text-sm text-[#A9AAAC]">
                    Help us improve Smart Content Solutions.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleLeaveFeedback}
                  className="btn-gold flex-1 text-sm"
                >
                  Leave feedback
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="flex-1 text-sm border-[#3B3C3E] text-[#A9AAAC] hover:bg-[#2A2A2C]"
                >
                  Not now
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FeedbackModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
