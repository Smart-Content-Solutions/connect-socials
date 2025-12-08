import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  CheckCircle,
  Upload,
  Loader2,
  Link as LinkIcon,
  Unlink,
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
} from "lucide-react";

import {
  initiateLinkedInAuth,
  getLinkedInAuthData,
  clearLinkedInAuthData,
  isLinkedInConnected,
} from "@/utils/linkedinOAuth";

import {
  initiateFacebookAuth,
  getFacebookAuthData,
  clearFacebookAuthData,
  isFacebookConnected,
} from "@/utils/facebookOAuth";

import {
  initiateInstagramAuth,
  getInstagramAuthData,
  clearInstagramAuthData,
  isInstagramConnected,
} from "@/utils/instagramOAuth";

import {
  initiateTikTokAuth,
  getTikTokAuthData,
  clearTikTokAuthData,
  isTikTokConnected,
} from "@/utils/tiktokOAuth";

import SocialDashboard from "./SocialDashboard";

type Platform = {
  id: string;
  name: string;
  icon: any;
  connect?: () => void;
  disconnect?: () => void;
  isConnected: () => boolean;
};

const ALL_PLATFORMS: Platform[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    connect: initiateFacebookAuth,
    disconnect: clearFacebookAuthData,
    isConnected: isFacebookConnected,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    connect: initiateInstagramAuth,
    disconnect: clearInstagramAuthData,
    isConnected: isInstagramConnected,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    connect: initiateLinkedInAuth,
    disconnect: clearLinkedInAuthData,
    isConnected: isLinkedInConnected,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music,
    connect: initiateTikTokAuth,
    disconnect: clearTikTokAuthData,
    isConnected: isTikTokConnected,
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: Twitter,
    isConnected: () => false,
  },
  {
    id: "bluesky",
    name: "Bluesky",
    icon: MessageCircle,
    isConnected: () => true,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: Pin,
    isConnected: () => false,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    isConnected: () => false,
  },
  {
    id: "google_business",
    name: "Google Business",
    icon: MapPin,
    isConnected: () => false,
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: MessageCircle,
    isConnected: () => false,
  },
  {
    id: "medium",
    name: "Medium",
    icon: FileText,
    isConnected: () => false,
  },
  {
    id: "threads",
    name: "Threads",
    icon: AtSign,
    isConnected: () => false,
  },
];

type ActiveTab = "create" | "dashboard";

const goldGradient =
  "bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C]";

export default function SocialAutomationApp() {
  const { user, isSignedIn, isLoaded } = useUser();

  // 🔐 ORIGINAL STATE & LOGIC (unchanged functionality)
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [aiEnhance, setAiEnhance] = useState(true);
  const [postMode, setPostMode] = useState<"publish" | "schedule">("publish");
  const [scheduledTime, setScheduledTime] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);

  // 🧭 New: tab + sliding container (Base44-style)
  const [activeTab, setActiveTab] = useState<ActiveTab>("create");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const target =
      activeTab === "create" ? 0 : container.scrollWidth / 2; // 2 panels

    const start = container.scrollLeft;
    const distance = target - start;
    const duration = 800;
    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      container.scrollLeft = start + distance * eased;
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const isSelected = (id: string) => selectedPlatforms.includes(id);

  const togglePlatform = (id: string, connected: boolean) => {
    if (!connected) return;
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

    const res = await fetch(
      "https://scs-ltd.app.n8n.cloud/webhook/social-media",
      {
        method: "POST",
        body: form,
      }
    );

    if (!res.ok) throw new Error(await res.text());
  };

  const handlePublish = async () => {
    setErrorMsg(null);

    if (!caption.trim())
      return setErrorMsg("Caption is required.");

    if (selectedPlatforms.length === 0)
      return setErrorMsg("Select at least one connected platform.");

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

  // ================== AUTH GUARDS (unchanged) ==================
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D] text-[#D6D7D8]">
        Loading…
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D] text-[#D6D7D8]">
        Login required
      </div>
    );
  }

  // ================== UI ==================
  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#D6D7D8] relative overflow-hidden">
      {/* subtle background glows */}
      <div className="pointer-events-none fixed -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#E1C37A]/8 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 right-[-120px] w-[420px] h-[420px] rounded-full bg-[#B6934C]/8 blur-[140px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-28 pb-16">
        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center rounded-2xl bg-[#232326]/80 border border-white/5 px-1 py-1 shadow-[0_0_25px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "create"
                  ? `${goldGradient} shadow-[0_0_18px_rgba(225,195,122,0.45)]`
                  : "text-[#D6D7D8] bg-transparent hover:text-white"
              }`}
            >
              Create Post
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === "dashboard"
                  ? `${goldGradient} shadow-[0_0_18px_rgba(225,195,122,0.45)]`
                  : "text-[#D6D7D8] bg-transparent hover:text-white"
              }`}
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Main glass container with horizontal panels */}
        <div className="relative rounded-3xl bg-[#131316]/80 border border-white/5 backdrop-blur-[18px] shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden">
          <div
            ref={scrollRef}
            className="flex overflow-x-hidden"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {/* CREATE POST PANEL */}
            <div
              className="w-full flex-shrink-0 p-6 md:p-8"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#1A1A1C]" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    Social Media Automation
                  </h1>
                  <p className="text-sm text-[#A9AAAC]">
                    Create, schedule & publish posts across your connected
                    platforms.
                  </p>
                </div>
              </div>

              {isSuccess && (
                <div className="mb-4 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 px-4 py-3 flex items-center gap-2 text-sm text-[#BBF7D0]">
                  <CheckCircle className="w-4 h-4" />
                  Your post has been sent successfully!
                </div>
              )}

              {errorMsg && (
                <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
                {/* Left column: platforms + schedule */}
                <div className="space-y-6">
                  {/* Platforms */}
                  <div className="rounded-2xl bg-[#1C1C20]/80 border border-white/5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-semibold text-[#D6D7D8]">
                          Select & Connect Platforms
                        </h2>
                        <p className="text-xs text-[#5B5C60]">
                          Click to select platforms. Use Connect/Disconnect to
                          manage auth.
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#E1C37A]/10 text-[#E1C37A]">
                        {selectedPlatforms.length} selected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALL_PLATFORMS.map((p) => {
                        const connected = p.isConnected();
                        const selected = isSelected(p.id);
                        const Icon = p.icon;

                        return (
                          <div
                            key={p.id}
                            className={`group relative rounded-xl border px-4 py-3 transition-all duration-200 overflow-hidden ${
                              connected
                                ? selected
                                  ? "border-[#E1C37A] bg-[#E1C37A]/10 shadow-[0_0_30px_rgba(225,195,122,0.35)]"
                                  : "border-[#2D2D32] bg-[#18181B]/90 hover:border-[#E1C37A]/60 hover:bg-[#26262B]"
                                : "border-[#2D2D32] bg-[#141418]/80 opacity-60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <button
                                onClick={() =>
                                  togglePlatform(p.id, connected)
                                }
                                disabled={!connected}
                                className="flex items-center gap-3 text-left"
                              >
                                <div className="w-9 h-9 rounded-xl bg-[#E1C37A]/10 flex items-center justify-center">
                                  <Icon className="w-4 h-4 text-[#E1C37A]" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {p.name}
                                  </span>
                                  <span className="text-[11px] text-[#5B5C60]">
                                    {connected ? "Connected" : "Not connected"}
                                  </span>
                                </div>
                                {selected && (
                                  <CheckCircle className="w-4 h-4 text-green-400 ml-1" />
                                )}
                              </button>

                              {p.connect && (
                                <button
                                  onClick={() => {
                                    setLoadingPlatform(p.id);
                                    const act = connected
                                      ? p.disconnect
                                      : p.connect;
                                    act?.();
                                    setTimeout(
                                      () => setLoadingPlatform(null),
                                      1200
                                    );
                                  }}
                                  className={`flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-full border transition-all duration-150 ${
                                    connected
                                      ? "border-[#3B3C3E] text-[#D6D7D8] hover:bg-[#27272F]"
                                      : "border-transparent bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C] shadow-[0_0_18px_rgba(225,195,122,0.4)]"
                                  }`}
                                >
                                  {loadingPlatform === p.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : connected ? (
                                    <>
                                      <Unlink className="w-3 h-3" />
                                      Disconnect
                                    </>
                                  ) : (
                                    <>
                                      <LinkIcon className="w-3 h-3" />
                                      Connect
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Schedule selector */}
                  <div className="rounded-2xl bg-[#1C1C20]/80 border border-white/5 p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-[#D6D7D8] mb-1">
                      When to post
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPostMode("publish")}
                        className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 text-left ${
                          postMode === "publish"
                            ? "border-[#E1C37A]/70 bg-[#E1C37A]/10 shadow-[0_0_25px_rgba(225,195,122,0.35)]"
                            : "border-[#2D2D32] bg-[#18181B] hover:border-[#E1C37A]/40"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            postMode === "publish"
                              ? "bg-[#E1C37A]/20"
                              : "bg-[#23232A]"
                          }`}
                        >
                          <Upload
                            className={`w-4 h-4 ${
                              postMode === "publish"
                                ? "text-[#E1C37A]"
                                : "text-[#A9AAAC]"
                            }`}
                          />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              postMode === "publish"
                                ? "text-[#E1C37A]"
                                : "text-[#D6D7D8]"
                            }`}
                          >
                            Publish now
                          </p>
                          <p className="text-[11px] text-[#5B5C60]">
                            Send immediately to all selected platforms.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => setPostMode("schedule")}
                        className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 text-left ${
                          postMode === "schedule"
                            ? "border-[#E1C37A]/70 bg-[#E1C37A]/10 shadow-[0_0_25px_rgba(225,195,122,0.35)]"
                            : "border-[#2D2D32] bg-[#18181B] hover:border-[#E1C37A]/40"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            postMode === "schedule"
                              ? "bg-[#E1C37A]/20"
                              : "bg-[#23232A]"
                          }`}
                        >
                          {/* simple clock glyph using border */}
                          <div className="w-4 h-4 rounded-full border border-[#A9AAAC] relative">
                            <div className="absolute w-[1px] h-2 bg-[#A9AAAC] left-1/2 top-[3px] -translate-x-1/2" />
                            <div className="absolute w-[1px] h-1.5 bg-[#A9AAAC] left-[11px] top-[9px] rotate-45 origin-top" />
                          </div>
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              postMode === "schedule"
                                ? "text-[#E1C37A]"
                                : "text-[#D6D7D8]"
                            }`}
                          >
                            Schedule
                          </p>
                          <p className="text-[11px] text-[#5B5C60]">
                            Choose an exact date & time.
                          </p>
                        </div>
                      </button>
                    </div>

                    {postMode === "schedule" && (
                      <div className="grid sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] text-[#5B5C60] mb-1">
                            Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            className="w-full bg-[#111114] border border-[#3B3C3E] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E1C37A]/70"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: caption + media + actions */}
                <div className="space-y-6">
                  {/* Caption + AI toggle (design from Base44, logic unchanged) */}
                  <div className="rounded-2xl bg-[#1C1C20]/80 border border-white/5 p-5 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-[#D6D7D8]">
                          Caption
                        </h3>
                        <p className="text-[11px] text-[#5B5C60]">
                          Write your copy. Toggle AI flag if you want AI
                          enhancement on the backend.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A9AAAC]">
                        <span>AI Enhancement</span>
                        {/* this only toggles aiEnhance boolean – same functionality */}
                        <button
                          onClick={() => setAiEnhance((v) => !v)}
                          className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                            aiEnhance ? "bg-[#E1C37A]" : "bg-[#3B3C3E]"
                          }`}
                        >
                          <span
                            className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-black transition-transform duration-200 ${
                              aiEnhance ? "translate-x-6" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={5}
                        placeholder="Write an engaging caption for your post..."
                        className="w-full rounded-xl bg-[#111114] border border-[#3B3C3E] p-3 text-sm text-white placeholder:text-[#5B5C60] focus:outline-none focus:border-[#E1C37A]/70"
                      />
                      <div className="absolute bottom-2 right-3 text-[11px] text-[#5B5C60]">
                        {caption.length} characters
                      </div>
                    </div>
                  </div>

                  {/* Media upload */}
                  <div className="rounded-2xl bg-[#1C1C20]/80 border border-white/5 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[#D6D7D8]">
                          Media
                        </h3>
                        <p className="text-[11px] text-[#5B5C60]">
                          Optional image to attach to your post.
                        </p>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-[#3B3C3E] rounded-2xl p-4 text-center bg-[#111114]/80 hover:border-[#E1C37A]/70 transition-colors duration-200">
                      {imagePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            className="max-h-56 rounded-xl object-contain"
                          />
                          <button
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                          <Upload className="w-6 h-6 text-[#A9AAAC]" />
                          <span className="text-sm text-[#D6D7D8]">
                            Click to upload
                          </span>
                          <span className="text-[11px] text-[#5B5C60]">
                            PNG, JPG, GIF – up to 10MB
                          </span>
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1">
                    <button
                      onClick={() => {
                        setCaption("");
                        setImageFile(null);
                        setImagePreview(null);
                        setSelectedPlatforms([]);
                        setErrorMsg(null);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#3B3C3E] text-sm text-[#D6D7D8] hover:bg-[#27272F] transition-colors"
                    >
                      Clear
                    </button>

                    <button
                      onClick={handlePublish}
                      disabled={loading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C] text-sm font-semibold shadow-[0_0_25px_rgba(225,195,122,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Publishing…
                        </>
                      ) : (
                        "Publish"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* DASHBOARD PANEL */}
            <div
              className="w-full flex-shrink-0 p-6 md:p-8"
              style={{ scrollSnapAlign: "start" }}
            >
              <SocialDashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
