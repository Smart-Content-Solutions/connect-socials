import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, LogIn } from "lucide-react";

// YOUR existing toast component
import Toast from "@/components/ui/Toast";

export default function WordpressAutomationApp() {
  // WordPress Login Fields
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [wpToken, setWpToken] = useState<string | null>(null);

  // Content fields
  const [content, setContent] = useState("");
  const [sections, setSections] = useState(3);
  const [image, setImage] = useState<File | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Helper to show toast anywhere
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const WEBHOOK_URL =
    "https://scs-ltd.app.n8n.cloud/webhook/wordpress-automation";

  // ---------------------------------------------
  // STEP 1 — LOGIN TO USER'S WORDPRESS WEBSITE
  // ---------------------------------------------
  const handleLogin = async () => {
    if (!wpUrl || !wpUsername || !wpPassword) {
      showToast("Please fill out all WordPress login fields", "error");
      return;
    }

    setLoginLoading(true);

    try {
      const response = await fetch(`${wpUrl}/wp-json/jwt-auth/v1/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: wpUsername,
          password: wpPassword,
        }),
      });

      const data = await response.json();

      if (data?.token) {
        setWpToken(data.token);
        localStorage.setItem("wp_token", data.token);
        localStorage.setItem("wp_url", wpUrl);

        showToast("Logged into WordPress successfully!");
      } else {
        showToast(data?.message || "Login failed", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Login error — check console", "error");
    }

    setLoginLoading(false);
  };

  // -------------------------------------------------
  // STEP 2 — SEND CONTENT + TOKEN TO THE N8N WEBHOOK
  // -------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wpToken || !wpUrl) {
      showToast("Please log into WordPress first", "error");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("Your Blog Post Content", content);
    formData.append("Number of Sections", String(sections));
    formData.append("wp_token", wpToken);
    formData.append("wp_url", wpUrl);

    if (image) {
      formData.append("Gallery_Images", image);
    }

    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      showToast("Content submitted successfully!");
      setContent("");
    } catch (error) {
      console.error(error);
      showToast("Failed to submit content", "error");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen py-24 px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-10"
      >
        <h1 className="text-3xl font-bold text-white mb-6">
          Multi-User WordPress SEO Automation (SaaS)
        </h1>

        {/* ---------------------------- */}
        {/* STEP 1 — WORDPRESS LOGIN     */}
        {/* ---------------------------- */}
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
            />

            <input
              type="text"
              placeholder="WordPress Username"
              className="w-full p-4 rounded-xl bg-[#111] border border-[#333] text-white"
              value={wpUsername}
              onChange={(e) => setWpUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="WordPress Password"
              className="w-full p-4 rounded-xl bg-[#111] border border-[#333] text-white"
              value={wpPassword}
              onChange={(e) => setWpPassword(e.target.value)}
            />

            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="btn-gold w-full py-4 rounded-full flex items-center justify-center gap-3 font-semibold"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Logging In…
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" /> Login to WordPress
                </>
              )}
            </button>
          </div>
        </div>

        {/* -------------------------------------- */}
        {/* STEP 2 — SUBMIT CONTENT TO AUTOMATION */}
        {/* -------------------------------------- */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl text-white mb-2 font-semibold">
            Step 2 — Generate SEO Content & Publish
          </h2>

          {/* Blog Content */}
          <textarea
            className="w-full p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
            rows={6}
            placeholder="Write your content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          {/* Sections */}
          <input
            type="number"
            min={1}
            className="w-full p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
            value={sections}
            onChange={(e) => setSections(Number(e.target.value))}
            required
          />

          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            className="text-[#D6D7D8]"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-gold px-8 py-4 rounded-full flex items-center gap-3 font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> Run Automation
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* TOAST RENDER */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
