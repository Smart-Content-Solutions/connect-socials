import React, { useState, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";

/* -------------------- MOCK TOAST -------------------- */
const useToast = () => ({
  toast: ({ title, description }: any) =>
    console.log(`[TOAST] ${title}: ${description}`),
});
const ToastProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
const ToastViewport = () => null;

/* -------------------- CONFIG -------------------- */
const WEBHOOK_URL = "https://scs-ltd.app.n8n.cloud/webhook/seo-content-publisher";

/**
 * IMPORTANT
 * This must match a real client_id row in Supabase
 */
const CLIENT_ID = "scs_ltd";

/**
 * Environment expected by workflow
 * TEST | PROD
 */
const ENVIRONMENT = "TEST";

/**
 * Webhook auth token
 * Must match $env.SCS_WEBHOOK_TOKEN in n8n
 */
const WEBHOOK_TOKEN = "REPLACE_WITH_REAL_TOKEN";

export default function WordpressAutomationApp() {
  const { toast } = useToast();

  /* -------------------- WORDPRESS CREDENTIALS -------------------- */
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  /* -------------------- SEO & CONTENT -------------------- */
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

  /* -------------------- LOAD SESSION -------------------- */
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

  /* -------------------- CONNECT -------------------- */
  const handleConnect = () => {
    if (!wpUrl || !wpUsername || !wpAppPassword) {
      return toast({
        title: "Missing Fields",
        description: "Please fill all fields.",
      });
    }

    setLoginLoading(true);

    localStorage.setItem("wp_url", wpUrl);
    localStorage.setItem("wp_username", wpUsername);
    localStorage.setItem("wp_app_password", wpAppPassword);

    setIsConnected(true);
    setLoginLoading(false);

    toast({
      title: "Connected",
      description: "You're now connected to WordPress.",
    });
  };

  /* -------------------- SUBMIT -------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      return toast({
        title: "Topic Missing",
        description: "Please enter a blog topic.",
      });
    }

    setLoading(true);

    const form = new FormData();

    /* REQUIRED IDENTITY */
    form.append("client_id", CLIENT_ID);
    form.append("environment", ENVIRONMENT);

    /* SEO + CONTENT */
    form.append("topic", topic);
    form.append("sections", String(sections));
    form.append("primary_keyword", keywords);
    form.append("location", location);
    form.append("service", occupation);
    form.append("audience", audience);
    form.append("tone", tone);

    /* OPTIONAL IMAGE */
    if (image) {
      form.append("image", image);
    }

    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "x-scs-token": WEBHOOK_TOKEN,
        },
        body: form,
      });

      toast({
        title: "Sent!",
        description: "Your SEO content automation is running.",
      });

      setTopic("");
      setImage(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not send automation.",
      });
    }

    setLoading(false);
  };

  /* -------------------- UI -------------------- */
  return (
    <ToastProvider>
      <main className="w-full flex justify-center bg-[#1A1A1C] px-4 py-20">
        <div className="w-full max-w-3xl">

          {/* STEP 1 */}
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
                  placeholder="WordPress URL"
                  className="w-full p-4 rounded-xl bg-[#111] text-white"
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                  disabled={isConnected}
                />
                <input
                  placeholder="Username"
                  className="w-full p-4 rounded-xl bg-[#111] text-white"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                  disabled={isConnected}
                />
                <input
                  type="password"
                  placeholder="Application Password"
                  className="w-full p-4 rounded-xl bg-[#111] text-white"
                  value={wpAppPassword}
                  onChange={(e) => setWpAppPassword(e.target.value)}
                  disabled={isConnected}
                />

                <button
                  onClick={handleConnect}
                  disabled={loginLoading || isConnected}
                  className="btn-gold w-full py-4 rounded-full"
                >
                  {isConnected ? "✅ Connected" : "Connect WordPress"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* STEP 2 */}
          {isConnected && (
            <motion.div className="glass-card rounded-3xl p-8">
              <h2 className="text-2xl text-white mb-6 font-semibold">
                Step 2 — Generate SEO Content
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <textarea
                  className="w-full p-4 rounded-xl bg-[#111] text-white"
                  rows={4}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter topic..."
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setImage(e.target.files?.[0] || null)
                  }
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full py-4 rounded-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Send /> Generate & Publish
                    </>
                  )}
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
