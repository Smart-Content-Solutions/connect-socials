import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { submitFeedback } from "@/utils/feedback-api";
import type { FeedbackCategory } from "@/types/feedback";
import type { FeedbackSubmission } from "@/types/feedback";

interface FeedbackFormProps {
  onSubmitSuccess?: () => void;
  pageUrl?: string;
}

export default function FeedbackForm({ onSubmitSuccess, pageUrl }: FeedbackFormProps) {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory>("General");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSubmitting(true);

    try {
      // Attempt API submission first
      const result = await submitFeedback(
        {
          rating,
          category,
          message: message.trim(),
          pageUrl: pageUrl || window.location.href,
        },
        getToken
      );

      if (result) {
        // API success - set last submitted timestamp and show success
        localStorage.setItem("scs_feedback_last_submitted_at", new Date().toISOString());
        toast.success("Thank you for your feedback!");
      } else {
        // Fallback to localStorage was used - enrich with user data if available
        const existingData = localStorage.getItem("scs_feedback_submissions");
        const submissions: FeedbackSubmission[] = existingData ? JSON.parse(existingData) : [];
        
        // Find the last submission (most recently added) and enrich with user data
        if (submissions.length > 0 && isSignedIn && user) {
          const lastSubmission = submissions[submissions.length - 1];
          lastSubmission.userId = user.id;
          lastSubmission.userEmail = user.emailAddresses[0]?.emailAddress || undefined;
          lastSubmission.userName = 
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || 
            user.username || 
            undefined;
          
          localStorage.setItem("scs_feedback_submissions", JSON.stringify(submissions));
        }
        
        toast.warning(
          "Feedback saved locally due to connectivity issues. It will be synced when connection is restored."
        );
      }

      // Reset form
      setRating(0);
      setCategory("General");
      setMessage("");

      // Call success callback
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Error saving feedback:", error);
      
      // Try localStorage as final fallback if API helper failed entirely
      try {
        const existingData = localStorage.getItem("scs_feedback_submissions");
        const submissions: FeedbackSubmission[] = existingData ? JSON.parse(existingData) : [];

        const fallbackSubmission: FeedbackSubmission = {
          id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          rating,
          category,
          message: message.trim(),
          pageUrl: pageUrl || window.location.href,
          userId: isSignedIn ? user?.id : undefined,
          userEmail: isSignedIn ? user?.emailAddresses[0]?.emailAddress : undefined,
          userName: isSignedIn 
            ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username 
            : undefined,
        };

        submissions.push(fallbackSubmission);
        localStorage.setItem("scs_feedback_submissions", JSON.stringify(submissions));
        localStorage.setItem("scs_feedback_last_submitted_at", new Date().toISOString());
        
        toast.warning("Feedback saved locally. It will be synced when connection is restored.");
        
        // Reset form
        setRating(0);
        setCategory("General");
        setMessage("");
        
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } catch (fallbackError) {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating */}
      <div>
        <label className="text-sm font-medium text-[#D6D7D8] mb-3 block">
          Rating <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`flex-1 p-3 rounded-xl border transition-all duration-200 ${
                rating >= value
                  ? "bg-[#E1C37A]/20 border-[#E1C37A] text-[#E1C37A]"
                  : "bg-[#1A1A1C] border-[#3B3C3E] text-[#A9AAAC] hover:border-[#E1C37A]/50"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <Star className={`w-5 h-5 ${rating >= value ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">{value}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-[#D6D7D8] mb-3 block">
          Category <span className="text-red-400">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
          className="w-full p-3 rounded-xl bg-[#1A1A1C] border border-[#3B3C3E] text-[#D6D7D8] focus:outline-none focus:ring-2 focus:ring-[#E1C37A]/50"
          required
        >
          <option value="General">General</option>
          <option value="Bug">Bug</option>
          <option value="Feature">Feature</option>
          <option value="Billing">Billing</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="text-sm font-medium text-[#D6D7D8] mb-3 block">
          Message <span className="text-red-400">*</span>
        </label>
        <Textarea
          placeholder="Tell us what you think..."
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-[#1A1A1C] border-[#3B3C3E] text-[#D6D7D8] placeholder:text-[#5B5C60] focus:ring-[#E1C37A]/50"
          required
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={submitting || rating === 0 || !message.trim()}
        className="btn-gold w-full"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </form>
  );
}
