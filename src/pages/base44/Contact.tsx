import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle,
  Ticket,
  LogIn,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SectionHeading from "../../components/shared/SectionHeading";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function Contact() {
  const { isSignedIn, isLoaded } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
    budget: "",
    timeline: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch(
        "https://n8n.smartcontentsolutions.co.uk/webhook/lead-capture",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            company: formData.company,
            message: formData.message,
            budget: formData.budget,
            timeline: formData.timeline,
            source: "contact_page",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || ["Something went wrong"]);
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch (err) {
      setErrors(["Network error. Please try again later."]);
      setLoading(false);
    }
  };

  const benefits = [
    "15-minute strategy call",
    "Live dashboard demo",
    "Custom pricing options",
    "No obligation",
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* HERO */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#E1C37A]/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#D6D7D8]/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionHeading
            badge="Contact"
            title="Let's talk."
            subtitle="Book a call or send a message. We respond within 24 hours."
          />
        </div>
      </section>

      {/* MAIN */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* LEFT */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-6">Book a Strategy Call</h3>
              <p className="text-[#A9AAAC] mb-8">
                15 minutes. No pitch. Just answers.
              </p>

              <div className="space-y-4 mb-12">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-[#1A1A1C]" />
                    </div>
                    <span className="text-[#D6D7D8]">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CONTACT INFO */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Mail className="w-5 h-5" />
                  <p className="text-[#D6D7D8]">hello@smartcontentsolutions.co</p>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="w-5 h-5" />
                  <p className="text-[#D6D7D8]">+1 (555) 123-4567</p>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="w-5 h-5" />
                  <p className="text-[#D6D7D8]">London, UK (Remote-first)</p>
                </div>
              </div>
            </motion.div>

            {/* RIGHT – FORM */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="w-6 h-6 text-[#E1C37A]" />
                  <h3 className="text-xl font-semibold">Send a Message</h3>
                </div>

                {errors.length > 0 && (
                  <div className="mb-4 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300">
                    {errors.map((err, i) => (
                      <p key={i} className="text-sm">• {err}</p>
                    ))}
                  </div>
                )}

                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                    <p>Message sent successfully.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                      placeholder="Name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />

                    <Input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />

                    <Input
                      placeholder="Company"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                    />

                    {/* REQUIRED FOR BACKEND */}
                    <select
                      className="w-full p-3 rounded-xl bg-[#1A1A1C] border border-[#3B3C3E]"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Budget</option>
                      <option value="Under £1,000">Under £1,000</option>
                      <option value="£1,000–£5,000">£1,000–£5,000</option>
                      <option value="£5,000–£10,000">£5,000–£10,000</option>
                      <option value="£10,000+">£10,000+</option>
                    </select>

                    <select
                      className="w-full p-3 rounded-xl bg-[#1A1A1C] border border-[#3B3C3E]"
                      value={formData.timeline}
                      onChange={(e) =>
                        setFormData({ ...formData, timeline: e.target.value })
                      }
                      required
                    >
                      <option value="">Timeline</option>
                      <option value="Immediate">Immediate</option>
                      <option value="Within 1 month">Within 1 month</option>
                      <option value="1–3 months">1–3 months</option>
                      <option value="Just exploring">Just exploring</option>
                    </select>

                    <Textarea
                      placeholder="Message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                    />

                    <Button disabled={loading} className="btn-gold w-full">
                      {loading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SUPPORT TICKETS SECTION */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-card rounded-3xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Ticket className="w-6 h-6 text-[#E1C37A]" />
              <h3 className="text-xl font-semibold">Support Tickets</h3>
            </div>

            {!isLoaded ? (
              <div className="text-center py-8">
                <p className="text-[#A9AAAC]">Loading...</p>
              </div>
            ) : !isSignedIn ? (
              <div className="text-center py-8">
                <p className="text-[#D6D7D8] mb-6">
                  Need help? Sign in to open a support ticket or view your existing tickets.
                </p>
                <Link to="/login">
                  <Button className="btn-gold inline-flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign in to open a ticket
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/support/new" className="flex-1">
                  <Button className="btn-gold w-full inline-flex items-center justify-center gap-2">
                    <Ticket className="w-4 h-4" />
                    Open a Ticket
                  </Button>
                </Link>
                <Link to="/support" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full inline-flex items-center justify-center gap-2 border-[#3B3C3E] text-[#D6D7D8] hover:bg-[#2A2A2C]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    View My Tickets
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
