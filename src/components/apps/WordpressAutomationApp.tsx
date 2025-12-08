import React, { useState, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, LogIn } from "lucide-react";

// MOCK TOAST — replace with your real component
const useToast = () => ({ toast: ({ variant, title, description }: any) => console.log(`[TOAST] ${title}: ${description}`) });
const ToastProvider = ({ children }: { children: ReactNode }) => <div className="toast-provider">{children}</div>;
const ToastViewport = () => <div className="toast-viewport"></div>;
// END MOCK

export default function WordpressAutomationApp() {
  const { toast } = useToast();

  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const [content, setContent] = useState("");
  const [sections, setSections] = useState(3);
  const [image, setImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const WEBHOOK_URL = "https://scs-ltd.app.n8n.cloud/webhook/wordpress-automation";

  // Load stored credentials on mount
  useEffect(() => {
    const storedUrl = localStorage.getItem("wp_url");
    const storedUser = localStorage.getItem("wp_username");
    const storedAppPass = localStorage.getItem("wp_app_password");

    if (storedUrl && storedUser && storedAppPass) {
      setWpUrl(storedUrl);
      setWpUsername(storedUser);
      setWpAppPassword(storedAppPass);
      setIsConnected(true);

      toast({ title: "Connected", description: "Your WordPress credentials were restored." });
    }
  }, []);

  // Handle “login” with application password
  const handleConnect = () => {
    if (!wpUrl || !wpUsername || !wpAppPassword) {
      return toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill all fields.",
      });
    }

    setLoginLoading(true);

    try {
      // No API call needed for application passwords.
      localStorage.setItem("wp_url", wpUrl);
      localStorage.setItem("wp_username", wpUsername);
      localStorage.setItem("wp_app_password", wpAppPassword);

      setIsConnected(true);

      toast({ title: "Connected", description: "WordPress access enabled using Application Password." });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Unable to save login data.",
      });
    }

    setLoginLoading(false);
  };

  // Submit to n8n
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      return toast({
        variant: "destructive",
        title: "Not Connected",
        description: "Please connect to your WordPress website first.",
      });
    }

    if (!content.trim()) {
      return toast({
        variant: "destructive",
        title: "Content Missing",
        description: "Please provide content.",
      });
    }

    setLoading(true);

    const form = new FormData();
    form.append("Your Blog Post Content", content);
    form.append("Number of Sections", String(sections));

    // SEND CREDENTIALS TO N8N
    form.append("wp_url", wpUrl);
    form.append("wp_username", wpUsername);
    form.append("wp_app_password", wpAppPassword);

    if (image) form.append("Gallery_Images", image);

    try {
      await fetch(WEBHOOK_URL, { method: "POST", body: form });

      toast({ title: "Submitted!", description: "Content sent to automation." });

      setContent("");
      setImage(null);
    } catch {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Unable to send content.",
      });
    }

    setLoading(false);
  };

  return (
    <ToastProvider>
      <main className="w-full flex justify-center items-start bg-[#1A1A1C] px-4 py-20">
        <div className="w-full max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8"
          >
            <h1 className="text-3xl font-bold text-white mb-6">
              Multi-User WordPress SEO Automation (SaaS)
            </h1>

            {/* STEP 1 — WORDPRESS CONNECTION */}
            <div className="mb-10 p-6 rounded-2xl bg-[#1A1A1C] border border-[#333]">
              <h2 className="text-xl text-white mb-4 font-semibold">
                Step 1 — Connect to Your WordPress Website
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="WordPress Site URL (https://mysite.com)"
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
                  placeholder="Application Password (from WordPress Profile → Application Passwords)"
                  className="w-full p-4 rounded-xl bg-[#111] border border-[#333] text-white"
                  value={wpAppPassword}
                  onChange={(e) => setWpAppPassword(e.target.value)}
                  disabled={isConnected}
                />

                <button
                  onClick={handleConnect}
                  disabled={loginLoading || isConnected}
                  className="btn-gold w-full py-4 rounded-full flex items-center justify-center gap-3 font-semibold disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Connecting...
                    </>
                  ) : isConnected ? (
                    "✅ Connected"
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" /> Connect WordPress
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* STEP 2 ONLY VISIBLE IF CONNECTED */}
            {isConnected ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-xl text-white mb-2 font-semibold">
                  Step 2 — Generate SEO Content & Publish
                </h2>

                <textarea
                  className="w-full p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your content, keywords, or draft here..."
                />

                <input
                  type="number"
                  min={1}
                  className="w-full p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
                  value={sections}
                  onChange={(e) => setSections(Number(e.target.value))}
                />

                <input
                  type="file"
                  accept="image/*"
                  className="text-[#D6D7D8]"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />

                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="btn-gold px-8 py-4 rounded-full flex items-center gap-3 font-semibold disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Run Automation
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="mt-10 p-6 rounded-2xl bg-[#1A1A1C] border border-[#333] text-center">
                <p className="text-lg text-[#A9AAAC]">
                  Please complete **Step 1** to unlock the content tools.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        <ToastViewport />
      </main>
    </ToastProvider>
  );
}
