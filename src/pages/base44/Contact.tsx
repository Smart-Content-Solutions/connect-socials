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
  CheckCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SectionHeading from "../../components/shared/SectionHeading";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch(
        "https://scs-ltd.app.n8n.cloud/webhook/lead-capture",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            company: formData.company,
            message: formData.message,
            source: "contact_page" // <-- keeps tracking in your workflow
          })
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
    "No obligation"
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

      {/* MAIN CONTENT */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">

            {/* LEFT SIDE */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-6">Book a Strategy Call</h3>
              <p className="text-[#A9AAAC] mb-8">
                15 minutes. No pitch. Just answers. See exactly how Smart Content Solutions 
                can work for your business.
              </p>

              <div className="space-y-4 mb-12">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-[#1A1A1C]" />
                    </div>
                    <span className="text-[#D6D7D8]">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* CALENDAR PLACEHOLDER */}
              <div className="glass-card-gold rounded-2xl p-8 mb-12">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#1A1A1C]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Schedule Now</h4>
                    <p className="text-sm text-[#A9AAAC]">Pick a time that works for you</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {["9:00 AM", "11:00 AM", "2:00 PM", "3:30 PM", "4:00 PM", "5:30 PM"].map((time, index) => (
                    <button
                      key={index}
                      className="py-3 px-4 rounded-xl bg-[#1A1A1C] border border-[#3B3C3E] hover:border-[#E1C37A] transition-colors text-sm"
                    >
                      {time}
                    </button>
                  ))}
                </div>

                <button className="btn-gold w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" />
                  Book Your Call
                </button>
              </div>

              {/* CONTACT DETAILS */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl metallic-gradient flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#1A1A1C]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#5B5C60]">Email</p>
                    <p className="text-[#D6D7D8]">hello@smartcontentsolutions.co</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl metallic-gradient flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#1A1A1C]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#5B5C60]">Phone</p>
                    <p className="text-[#D6D7D8]">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl metallic-gradient flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#1A1A1C]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#5B5C60]">Location</p>
                    <p className="text-[#D6D7D8]">London, UK (Remote-first)</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT SIDE – FORM */}
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
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full gold-gradient flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-[#1A1A1C]" />
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Message Sent!</h4>
                    <p className="text-[#A9AAAC]">We'll get back to you within 24 hours.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#A9AAAC] mb-2">Name</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-[#A9AAAC] mb-2">Email</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="you@company.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#A9AAAC] mb-2">Company</label>
                      <Input
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Your company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#A9AAAC] mb-2">Message</label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={5}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="btn-gold w-full py-4 rounded-xl flex items-center justify-center gap-2"
                    >
                      {loading ? "Sending..." : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>

              <div className="mt-8 p-6 rounded-2xl bg-[#1A1A1C]/50 border border-[#3B3C3E]/50">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-white">Currently Online</p>
                    <p className="text-xs text-[#5B5C60]">Average response time: 2 hours</p>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
