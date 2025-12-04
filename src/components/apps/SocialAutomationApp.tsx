import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { CheckCircle, Upload, Loader2 } from "lucide-react";

import { getLinkedInAuthData } from "@/utils/linkedinOAuth";
import { getFacebookAuthData } from "@/utils/facebookOAuth";
import { getInstagramAuthData } from "@/utils/instagramOAuth";
import { getTikTokAuthData } from "@/utils/tiktokOAuth";

import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Music,
  Pin,
  Youtube,
  MapPin,
  MessageCircle,
  FileText,
  AtSign,
  Cloud
} from "lucide-react";

type Platform = {
  id: string;
  name: string;
  icon: any;
};

const ALL_PLATFORMS: Platform[] = [
  { id: "facebook", name: "Facebook", icon: Facebook },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "x", name: "X (Twitter)", icon: Twitter },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
  { id: "bluesky", name: "Bluesky", icon: Cloud },
  { id: "tiktok", name: "TikTok", icon: Music },
  { id: "pinterest", name: "Pinterest", icon: Pin },
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "google_business", name: "Google Business", icon: MapPin },
  { id: "reddit", name: "Reddit", icon: MessageCircle },
  { id: "medium", name: "Medium", icon: FileText },
  { id: "threads", name: "Threads", icon: AtSign },
  { id: "mastodon", name: "Mastodon", icon: Cloud }
];

export default function SocialMediaTool() {
  const { user, isSignedIn, isLoaded } = useUser();

  const linkedin = getLinkedInAuthData();
  const facebook = getFacebookAuthData();
  const instagram = getInstagramAuthData();
  const tiktok = getTikTokAuthData();

  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [aiEnhance, setAiEnhance] = useState(true);
  const [postMode, setPostMode] = useState("publish");
  const [scheduledTime, setScheduledTime] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const CONNECTED = {
    linkedin: !!linkedin,
    facebook: !!facebook,
    instagram: !!instagram,
    tiktok: !!tiktok,
    bluesky: true,
    x: false,
    pinterest: false,
    youtube: false,
    google_business: false,
    reddit: false,
    medium: false,
    threads: false,
    mastodon: false
  };

  const isSelected = (id: string) => selectedPlatforms.includes(id);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setImageFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const sendToBackend = async () => {
    const form = new FormData();
    form.append("user_id", user!.id);
    form.append("caption", caption);
    selectedPlatforms.forEach((p) => form.append("platforms[]", p));
    form.append("post_mode", postMode);
    form.append("use_ai", aiEnhance ? "yes" : "no");

    if (postMode === "schedule") {
      form.append("scheduled_time", scheduledTime);
    }

    if (imageFile) {
      form.append("image", imageFile);
    }

    const res = await fetch("https://scs-ltd.app.n8n.cloud/webhook/social-media", {
      method: "POST",
      body: form
    });

    if (!res.ok) throw new Error(await res.text());
  };

  const handlePublish = async () => {
    setErrorMsg(null);

    if (!caption.trim()) return setErrorMsg("Caption is required.");
    if (selectedPlatforms.length === 0)
      return setErrorMsg("Select at least one platform.");

    setLoading(true);

    try {
      await sendToBackend();
      setIsSuccess(true);
      setCaption("");
      setImageFile(null);
      setImagePreview(null);
      setSelectedPlatforms([]);
      setTimeout(() => setIsSuccess(false), 1500);
    } catch (err: any) {
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );

  if (!isSignedIn)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Login required
      </div>
    );

  return (
    <div className="min-h-screen pt-32 pb-20 bg-[#1A1A1C] text-[#D6D7D8]">
      <div className="max-w-5xl mx-auto px-6">
        {isSuccess && (
          <div className="mb-6 glass-card p-4 flex items-center gap-3">
            <CheckCircle className="text-green-500" />
            <span>Post sent successfully!</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/40 text-red-300 border border-red-500/30">
            {errorMsg}
          </div>
        )}

        <h1 className="text-3xl font-bold mb-6">
          Social Media Automation
        </h1>

        {/* PLATFORMS */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Select Platforms</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ALL_PLATFORMS.map((p) => {
              const connected =
                CONNECTED[p.id as keyof typeof CONNECTED];
              const selected = isSelected(p.id);
              const Icon = p.icon;

              return (
                <button
                  key={p.id}
                  disabled={!connected}
                  onClick={() => togglePlatform(p.id)}
                  className={`p-4 rounded-xl border transition ${
                    !connected
                      ? "opacity-40 cursor-not-allowed border-[#3B3C3E]"
                      : selected
                      ? "border-[#E1C37A] bg-[#E1C37A]/10"
                      : "border-[#3B3C3E] hover:border-[#E1C37A]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-[#E1C37A]" />
                    <span className="font-medium text-sm">
                      {p.name}
                    </span>
                    {selected && (
                      <CheckCircle className="ml-auto text-green-500 w-4 h-4" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* POST CREATION */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm mb-2 text-[#A9AAAC]">
              Post Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className="w-full rounded-lg bg-[#0F0F10] border border-[#3B3C3E] p-3 text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A9AAAC]">AI Enhancement</span>
            <input
              type="checkbox"
              checked={aiEnhance}
              onChange={(e) => setAiEnhance(e.target.checked)}
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-[#A9AAAC]">
              Upload Image
            </label>
            <div className="border-2 border-dashed border-[#3B3C3E] p-4 rounded-lg text-center">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    className="max-h-48 rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-2"
                  >
                    x
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Upload className="mx-auto mb-2 text-[#A9AAAC]" />
                  <p className="text-sm text-[#A9AAAC]">
                    Click to upload
                  </p>
                </label>
              )}
            </div>
          </div>

          <div>
            <select
              value={postMode}
              onChange={(e) => setPostMode(e.target.value)}
              className="w-full bg-[#0F0F10] border border-[#3B3C3E] p-3 rounded-lg"
            >
              <option value="publish">Publish Now</option>
              <option value="schedule">Schedule</option>
            </select>
          </div>

          {postMode === "schedule" && (
            <input
              type="datetime-local"
              className="w-full bg-[#0F0F10] border border-[#3B3C3E] p-3 rounded-lg"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => {
                setCaption("");
                setImageFile(null);
                setImagePreview(null);
                setSelectedPlatforms([]);
              }}
              className="btn-outline px-6 py-2 rounded-full"
            >
              Clear
            </button>

            <button
              onClick={handlePublish}
              disabled={loading}
              className="btn-gold px-6 py-2 rounded-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                "Publish Now"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
