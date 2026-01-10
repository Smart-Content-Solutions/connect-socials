import React from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FeedbackForm from "./FeedbackForm";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const location = useLocation();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-[#3B3C3E] bg-[#1A1A1C]/95 backdrop-blur-xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#E1C37A] flex items-center gap-2">
            Leave Feedback
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <FeedbackForm
            onSubmitSuccess={() => onOpenChange(false)}
            pageUrl={`${window.location.origin}${location.pathname}${location.search}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
