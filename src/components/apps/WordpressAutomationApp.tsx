/* -------------- ONLY SHOWING UPDATED + NEW SECTIONS -------------- */
/* FULL COMPONENT INCLUDED BELOW */

import React, { useState, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, LogIn } from "lucide-react";

const useToast = () => ({ toast: ({ title, description }: any) => console.log(`[TOAST] ${title}: ${description}`) });
const ToastProvider = ({ children }: { children: ReactNode }) => <div>{children}</div>;
const ToastViewport = () => <div />;

export default function WordpressAutomationApp() {
  const { toast } = useToast();

  /* -------------------- WORDPRESS CREDENTIALS -------------------- */
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  /* -------------------- SEO & CONTENT FIELDS -------------------- */
  const [topic, setTopic] = useState("");
  const [sections, setSections] = useState(3);
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Professional");
  const [image, setImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const WEBHOOK_URL = "https://n8n.smartcontentsolutions.co.uk/webhook/seo-content-publisher";
  useEffect(() => {
    const storedUrl = localStorage.getItem("wp_url");
    const storedUser = localStorage.getItem("wp_username");
    const storedPass = localStorage.getItem("wp_app_password");

    if (storedUrl && storedUser && storedPass) {
      setWpUrl(storedUrl);
      setWpUsername(storedUser);
      setWpAppPassword(storedPass);
      setIsConnected(true);
    }
  }, []);

  /* -------------------- CONNECT TO WORDPRESS -------------------- */
  const handleConnect = () => {
    if (!wpUrl || !wpUsername || !wpAppPassword) {
      return toast({ title: "Missing Fields", description: "Please fill all fields." });
    }

    setLoginLoading(true);

    localStorage.setItem("wp_url", wpUrl);
    localStorage.setItem("wp_username", wpUsername);
    localStorage.setItem("wp_app_password", wpAppPassword);

    setIsConnected(true);
    setLoginLoading(false);

    toast({ title: "Connected", description: "You're now connected to WordPress." });
  };

  /* -------------------- SUBMIT SEO REQUEST -------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      return toast({ title: "Topic Missing", description: "Please enter a blog topic." });
    }

    setLoading(true);

    const form = new FormData();

    /* SEO + CONTENT PARAMETERS */
    form.append("topic", topic);
    form.append("sections", String(sections));
    form.append("keywords", keywords);
    form.append("location", location);
    form.append("occupation", occupation);
    form.append("audience", audience);
    form.append("tone", tone);

    /* WORDPRESS CREDENTIALS */
    form.append("wp_url", wpUrl);
    form.append("wp_username", wpUsername);
    form.append("wp_app_password", wpAppPassword);

    /* OPTIONAL IMAGE */
    if (image) form.append("image", image);

    try {
      await fetch(WEBHOOK_URL, { method: "POST", body: form });
      toast({ title: "Sent!", description: "Your SEO content automation is running." });

      setTopic("");
      setImage(null);
    } catch {
      toast({ title: "Error", description: "Could not send automation." });
    }

    setLoading(false);
  };

  return (
    <ToastProvider>
      <main className="w-full flex justify-center items-start bg-[#1A1A1C] px-4 py-20">
        <div className="w-full max-w-3xl">
          
          {/* -------------------- STEP 1 CARD -------------------- */}
          <motion.div className="glass-card rounded-3xl p-8 mb-10">
            <h1 className="text-3xl font-bold text-white mb-6">
              WordPress SEO Automation (SaaS)
            </h1>

            <div className="p-6 rounded-2xl bg-[#1A1A1C] border border-[#333]">
              <h2 className="text-xl text-white mb-4 font-semibold">
                Step 1 — Connect WordPress
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="WordPress URL (https://mysite.com)"
                  className="w-full p-4 rounded-xl bg-[#111] border border-[#333] text-white"
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                  disabled={isConnected}
                />

                <input
                  type="text"
                  placeholder="WordPress Username"
                  className="w-full p-4 rounded-xl bg-[#111] border border-[#333] text-white"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                  disabled={isConnected}
                />

                <input
                  type="password"
                  placeholder="Application Password (WordPress → Profile → Application Passwords)"
                  className="w-full p-4 rounded-xl bg-[#111] border border-[#333] text-white"
                  value={wpAppPassword}
                  onChange={(e) => setWpAppPassword(e.target.value)}
                  disabled={isConnected}
                />

                <button
                  onClick={handleConnect}
                  disabled={loginLoading || isConnected}
                  className="btn-gold w-full py-4 rounded-full flex items-center justify-center gap-3 font-semibold"
                >
                  {isConnected ? "✅ Connected" : loginLoading ? "Connecting..." : "Connect WordPress"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* -------------------- STEP 2 CARD -------------------- */}
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-8"
            >
              <h2 className="text-2xl text-white mb-6 font-semibold">
                Step 2 — Generate Personalized SEO Content
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* TOPIC INPUT */}
                <textarea
                  className="w-full p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
                  rows={4}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter topic, idea, or draft..."
                />

                {/* SEO PERSONALIZATION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    className="p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />

                  <input
                    type="text"
                    placeholder="Occupation / Industry"
                    className="p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                  />

                  <input
                    type="text"
                    placeholder="Target Audience"
                    className="p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  />

                  <input
                    type="text"
                    placeholder="Keywords (comma separated)"
                    className="p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>

                {/* TONE + SECTIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  {/* CONTENT TONE */}
  <div className="flex flex-col space-y-2">
    <label className="text-sm text-gray-300">Content Tone</label>
    <select
      className="p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
      value={tone}
      onChange={(e) => setTone(e.target.value)}
    >
      <option>Professional</option>
      <option>Friendly</option>
      <option>Bold</option>
      <option>Informative</option>
      <option>Humorous</option>
      <option>Custom</option>
    </select>
  </div>

  {/* NUMBER OF SECTIONS */}
  <div className="flex flex-col space-y-2">
    <label className="text-sm text-gray-300">Number of Sections</label>
    <input
      type="number"
      min={1}
      className="p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
      value={sections}
      onChange={(e) => setSections(Number(e.target.value))}
    />
  </div>

</div>


                {/* IMAGE UPLOAD */}
                <input
                  type="file"
                  accept="image/*"
                  className="text-[#D6D7D8]"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full py-4 rounded-full flex items-center justify-center gap-3 font-semibold"
                >
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Send className="w-5 h-5" /> Generate & Publish</>}
                </button>
              </form>
            </motion.div>
          )}

          <ToastViewport />
        </div>
      </main>
    </ToastProvider>
  );
}
