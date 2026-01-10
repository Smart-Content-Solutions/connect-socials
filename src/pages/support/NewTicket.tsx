import React, { useState } from "react";
import { motion } from "framer-motion";
import { Ticket, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";

export default function NewTicket() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: "support" as "support" | "bug" | "feature",
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    module: null as "wordpress" | "social" | "billing" | "workspace" | "other" | null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required. Please sign in.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: formData.type,
          subject: formData.subject.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          module: formData.module,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      toast.success("Ticket created successfully!");
      navigate("/support");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create ticket. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#E1C37A]/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#D6D7D8]/5 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto mb-8">
              <Link
                to="/support"
                className="inline-flex items-center gap-2 text-[#A9AAAC] hover:text-[#D6D7D8] mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to My Tickets
              </Link>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-[#E1C37A]/10 border border-[#E1C37A]/20">
                  <Ticket className="w-5 h-5 text-[#E1C37A]" />
                  <span className="text-sm font-medium text-[#E1C37A]">Support</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Open a New Ticket</h1>
                <p className="text-[#A9AAAC] text-lg">
                  Describe your issue and we'll get back to you as soon as possible
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card rounded-3xl p-8 md:p-12"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-2 text-[#D6D7D8]">
                    Type
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    required
                    className="w-full p-3 rounded-xl bg-[#1A1A1C] border border-[#3B3C3E] text-[#D6D7D8]"
                  >
                    <option value="support">Support</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2 text-[#D6D7D8]">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    required
                    className="bg-[#1A1A1C] border-[#3B3C3E]"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2 text-[#D6D7D8]">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Please provide as much detail as possible about your issue..."
                    rows={8}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    className="bg-[#1A1A1C] border-[#3B3C3E]"
                  />
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium mb-2 text-[#D6D7D8]">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as any })
                    }
                    className="w-full p-3 rounded-xl bg-[#1A1A1C] border border-[#3B3C3E] text-[#D6D7D8]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="module" className="block text-sm font-medium mb-2 text-[#D6D7D8]">
                    Module (Optional)
                  </label>
                  <select
                    id="module"
                    value={formData.module || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, module: e.target.value || null as any })
                    }
                    className="w-full p-3 rounded-xl bg-[#1A1A1C] border border-[#3B3C3E] text-[#D6D7D8]"
                  >
                    <option value="">None</option>
                    <option value="wordpress">WordPress</option>
                    <option value="social">Social</option>
                    <option value="billing">Billing</option>
                    <option value="workspace">Workspace</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-gold inline-flex items-center gap-2"
                  >
                    {loading ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                  <Link to="/support">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-[#3B3C3E] text-[#D6D7D8] hover:bg-[#2A2A2C]"
                    >
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      </div>
  );
}
