import React, { useState, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, LogIn } from "lucide-react";

// MOCK: Replace with actual imports for toast and UI components
const useToast = () => ({ toast: ({ variant, title, description }: any) => console.log(`[TOAST] ${title}: ${description}`) });
const ToastProvider = ({ children }: { children: ReactNode }) => <div className="toast-provider">{children}</div>;
const ToastViewport = () => <div className="toast-viewport"></div>;
// END MOCK

export default function WordpressAutomationApp() {
  const { toast } = useToast();

  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [wpToken, setWpToken] = useState<string | null>(null);

  const [content, setContent] = useState("");
  const [sections, setSections] = useState(3);
  const [image, setImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const WEBHOOK_URL = "https://scs-ltd.app.n8n.cloud/webhook/wordpress-automation";

  // FIX: Load token and URL from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("wp_token");
    const storedUrl = localStorage.getItem("wp_url");
    if (storedToken && storedUrl) {
      setWpToken(storedToken);
      setWpUrl(storedUrl);
      toast({ title: "Session Found", description: "Ready to submit content." });
    }
  }, [toast]);

  const handleLogin = async () => {
    if (!wpUrl || !wpUsername || !wpPassword) {
      return toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill all login fields.",
      });
    }

    setLoginLoading(true);

    try {
      // NOTE: This logic uses the actual API endpoint from the original code
      const response = await fetch(`${wpUrl}/wp-json/jwt-auth/v1/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: wpUsername, password: wpPassword }),
      });

      const data = await response.json();

      if (data?.token) {
        setWpToken(data.token);
        localStorage.setItem("wp_token", data.token);
        localStorage.setItem("wp_url", wpUrl);

        toast({ title: "Logged In", description: "Connected to WordPress." });
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data?.message || "Incorrect credentials.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to connect to WordPress. Check your URL.",
      });
    }

    setLoginLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wpToken) {
      return toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "Login to WordPress first.",
      });
    }
    
    if (!content.trim()) {
      return toast({
          variant: "destructive",
          title: "Content Missing",
          description: "Please provide content to process.",
      });
    }

    setLoading(true);

    const form = new FormData();
    form.append("Your Blog Post Content", content);
    form.append("Number of Sections", String(sections));
    form.append("wp_token", wpToken);
    form.append("wp_url", wpUrl);
    if (image) form.append("Gallery_Images", image);

    try {
      // NOTE: Using the provided webhook URL for submission
      await fetch(WEBHOOK_URL, { method: "POST", body: form });

      toast({ title: "Submitted!", description: "Sent to automation." });
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
      {/* FIX: Set py-20 for top padding and items-start to center content vertically on the screen */}
      <main className="w-full flex justify-center items-start bg-[#1A1A1C] px-4 py-20"> 
        <div className="w-full max-w-3xl"> {/* Removed min-h-screen here */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8" // Removed 'w-full' here as parent already limits width
          >
            <h1 className="text-3xl font-bold text-white mb-6">
              Multi-User WordPress SEO Automation (SaaS)
            </h1>

            {/* LOGIN BLOCK (Step 1) */}
            <div className="mb-10 p-6 rounded-2xl bg-[#1A1A1C] border border-[#333]">
              <h2 className="text-xl text-white mb-4 font-semibold">
                Step 1 — Login to Your WordPress Website
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="WordPress Site URL (https://mysite.com)"
                  className="w-full p-4 rounded-xl bg-[#111] border border-[#333] text-white"
                  value={wpUrl}
                  onChange={(e) => setWpUrl(e.target.value)}
                  disabled={!!wpToken} // Disable input if logged in
                />
                <input
                  type="text"
                  placeholder="WordPress Username"
                  className="w-full p-4 rounded-xl bg-[#111] border border-[#333] text-white"
                  value={wpUsername}
                  onChange={(e) => setWpUsername(e.target.value)}
                  disabled={!!wpToken}
                />
                <input
                  type="password"
                  placeholder="WordPress Password"
                  className="w-full p-4 rounded-xl bg-[#111] border border-[#333] text-white"
                  value={wpPassword}
                  onChange={(e) => setWpPassword(e.target.value)}
                  disabled={!!wpToken}
                />

                <button
                  onClick={handleLogin}
                  disabled={loginLoading || !!wpToken}
                  className="btn-gold w-full py-4 rounded-full flex items-center justify-center gap-3 font-semibold disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Logging In...
                    </>
                  ) : wpToken ? (
                    '✅ Logged In' // Display success state
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" /> Login to WordPress
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* UX FIX: Conditionally render Step 2 */}
            {wpToken ? (
              /* CONTENT SUBMISSION (Step 2) */
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-xl text-white mb-2 font-semibold">
                  Step 2 — Generate SEO Content & Publish
                </h2>

                <textarea
                  className="w-full p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your content keywords, topic, or raw draft here..."
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
                      Please complete **Step 1** by logging in to unlock the content generation tools.
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