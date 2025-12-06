import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";

export default function WordpressAutomationApp() {
  const [content, setContent] = useState("");
  const [sections, setSections] = useState(3);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const WEBHOOK_URL =
    "https://scs-ltd.app.n8n.cloud/webhook/wordpress-automation";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("Your Blog Post Content", content);
    formData.append("Number of Sections", String(sections));

    if (image) {
      formData.append("Gallery_Images", image);
    }

    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      alert("Submitted to n8n successfully!");
      setContent("");
    } catch (err) {
      alert("Failed to submit. Check console.");
      console.error(err);
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
          WordPress SEO Automation
        </h1>

        <p className="text-[#A9AAAC] mb-8">
          Paste your blog content, choose SEO sections, upload images —  
          our automation handles optimization and WordPress publishing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Blog Content */}
          <div>
            <label className="block text-[#D6D7D8] mb-2 font-medium">
              Blog Content
            </label>
            <textarea
              className="w-full p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
              rows={6}
              placeholder="Paste your blog content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Number of Sections */}
          <div>
            <label className="block text-[#D6D7D8] mb-2 font-medium">
              Number of SEO Sections
            </label>
            <input
              type="number"
              min={1}
              className="w-full p-4 rounded-xl bg-[#1A1A1C] border border-[#333] text-white"
              value={sections}
              onChange={(e) => setSections(Number(e.target.value))}
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-[#D6D7D8] mb-2 font-medium">
              Featured / Gallery Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="text-[#D6D7D8]"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </div>

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
    </div>
  );
}
