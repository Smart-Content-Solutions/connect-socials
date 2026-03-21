import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import SubscriptionSuccessModal from "@/components/subscription/SubscriptionSuccessModal";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showModal, setShowModal] = useState(false);
  const [planName, setPlanName] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifySubscription = async () => {
      const alreadyProcessed = sessionStorage.getItem(
        "subscription_success_processed"
      );

      if (alreadyProcessed) {
        navigate("/dashboard", { replace: true });
        return;
      }

      try {
        // Get plan from URL
        const planFromUrl = searchParams.get("plan") || "";

        // Simulate webhook delay (same behavior as new file)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setPlanName(planFromUrl);
        setIsVerifying(false);
        setShowModal(true);

        sessionStorage.setItem("just_subscribed", "true");
        sessionStorage.setItem("subscription_success_processed", "true");
      } catch (error) {
        console.error("Subscription verification failed:", error);

        setPlanName(searchParams.get("plan") || "");
        setIsVerifying(false);
        setShowModal(true);

        sessionStorage.setItem("just_subscribed", "true");
        sessionStorage.setItem("subscription_success_processed", "true");
      }
    };

    verifySubscription();
  }, [navigate, searchParams]);

  const handleRedirect = () => {
    setShowModal(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      {isVerifying ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-[#E1C37A] mx-auto mb-4" />
          <p className="text-[#A9AAAC]">Setting up your account...</p>
        </motion.div>
      ) : (
        <SubscriptionSuccessModal
          isOpen={showModal}
          planName={planName}
          onRedirect={handleRedirect}
        />
      )}
    </div>
  );
}
