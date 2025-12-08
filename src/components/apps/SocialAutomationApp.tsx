import React, { useState, useRef, useCallback } from "react";
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
  Cloud,
  Sparkles,
  Send,
  X,
  Image as ImageIcon,
  Video,
  Clock,
  Eye,
  Heart,
  TrendingUp,
  TrendingDown,
  LayoutDashboard
} from "lucide-react";

import {
  initiateLinkedInAuth,
  clearLinkedInAuthData,
  isLinkedInConnected
} from "@/utils/linkedinOAuth";

import {
  initiateFacebookAuth,
  clearFacebookAuthData,
  isFacebookConnected
} from "@/utils/facebookOAuth";

import {
  initiateInstagramAuth,
  clearInstagramAuthData,
  isInstagramConnected
} from "@/utils/instagramOAuth";

import {
  initiateTikTokAuth,
  clearTikTokAuthData,
  isTikTokConnected
} from "@/utils/tiktokOAuth";

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
    isConnected: isFacebookConnected
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    connect: initiateInstagramAuth,
    disconnect: clearInstagramAuthData,
    isConnected: isInstagramConnected
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    connect: initiateLinkedInAuth,
    disconnect: clearLinkedInAuthData,
    isConnected: isLinkedInConnected
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music,
    connect: initiateTikTokAuth,
    disconnect: clearTikTokAuthData,
    isConnected: isTikTokConnected
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: Twitter,
    isConnected: () => false
  },
  {
    id: "bluesky",
    name: "Bluesky",
    icon: Cloud,
    isConnected: () => false
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: Pin,
    isConnected: () => false
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    isConnected: () => false
  },
  {
    id: "google_business",
    name: "Google Business",
    icon: MapPin,
    isConnected: () => false
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: MessageCircle,
    isConnected: () => false
  },
  {
    id: "medium",
    name: "Medium",
    icon: FileText,
    isConnected: () => false
  },
  {
    id: "threads",
    name: "Threads",
    icon: AtSign,
    isConnected: () => false
  }
];

const platformColors: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  x: '#000000',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  pinterest: '#E60023',
  youtube: '#FF0000',
  google_business: '#4285F4',
  reddit: '#FF4500',
  medium: '#000000',
  threads: '#000000',
  bluesky: '#0085FF'
};

export default function SocialMediaTool() {
  const { user, isSignedIn, isLoaded } = useUser();

  const [activeTab, setActiveTab] = useState<'create' | 'dashboard'>('dashboard');
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
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const [highlightStyle, setHighlightStyle] = useState({
    opacity: 0,
    transform: 'translate(0px, 0px)',
    width: 0,
    height: 0,
  });

  const handleCardMouseEnter = useCallback((e: React.MouseEvent) => {
    const card = e.currentTarget;
    const container = gridRef.current;
    if (!container || !card) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    setHighlightStyle({
      opacity: 1,
      transform: `translate(${cardRect.left - containerRect.left}px, ${cardRect.top - containerRect.top}px)`,
      width: cardRect.width,
      height: cardRect.height,
    });
  }, []);

  const handleGridMouseLeave = useCallback(() => {
    setHighlightStyle(prev => ({ ...prev, opacity: 0 }));
  }, []);

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
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
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1C]">
        <Loader2 className="w-8 h-8 text-[#E1C37A] animate-spin" />
      </div>
    );

  if (!isSignedIn)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1C] text-[#D6D7D8]">
        Login required
      </div>
    );

  const connectedCount = ALL_PLATFORMS.filter(p => p.isConnected()).length;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#1A1A1C] text-[#D6D7D8]">
      {/* Background Glows */}
      <div className="fixed top-1/4 -left-32 w-[500px] h-[500px] bg-[#E1C37A]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-[400px] h-[400px] bg-[#B6934C]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
              {activeTab === 'dashboard' ? (
                <LayoutDashboard className="w-6 h-6 text-[#1A1A1C]" />
              ) : (
                <Send className="w-6 h-6 text-[#1A1A1C]" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#D6D7D8]">Social Media Automation</h1>
              <p className="text-[#A9AAAC] text-sm">
                {activeTab === 'dashboard' ? 'Manage your accounts' : 'Create and publish content'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#3B3C3E]/40 backdrop-blur-[20px] rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'bg-[#E1C37A]/20 text-[#E1C37A]'
                  : 'text-[#A9AAAC] hover:text-[#D6D7D8]'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'create'
                  ? 'bg-[#E1C37A]/20 text-[#E1C37A]'
                  : 'text-[#A9AAAC] hover:text-[#D6D7D8]'
              }`}
            >
              Create Post
            </button>
          </div>
        </div>

        {/* Success Message */}
        {isSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-[#E1C37A]/10 border border-[#E1C37A]/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-[#D6D7D8]">Your post has been {postMode === 'publish' ? 'published' : 'scheduled'} successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {errorMsg}
          </div>
        )}

        {activeTab === 'dashboard' ? (
          <>
            {/* Connected Accounts Header */}
            <div className="flex items-center gap-3 mb-4">
              <LinkIcon className="w-5 h-5 text-[#E1C37A]" />
              <h3 className="text-lg font-semibold text-[#D6D7D8]">Connected Accounts</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#E1C37A]/10 text-[#E1C37A] text-sm">
                {connectedCount} / {ALL_PLATFORMS.length}
              </span>
            </div>

            {/* Platform Grid with Hover Effect */}
            <div
              ref={gridRef}
              className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              onMouseLeave={handleGridMouseLeave}
            >
              <div
                className="absolute pointer-events-none rounded-2xl hidden md:block"
                style={{
                  opacity: highlightStyle.opacity,
                  transform: highlightStyle.transform,
                  width: highlightStyle.width,
                  height: highlightStyle.height,
                  background: 'linear-gradient(135deg, rgba(225, 195, 122, 0.15) 0%, rgba(182, 148, 76, 0.1) 100%)',
                  boxShadow: '0 0 40px rgba(225, 195, 122, 0.35), 0 0 80px rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(225, 195, 122, 0.25)',
                  transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 0,
                }}
              />

              {ALL_PLATFORMS.map((p) => {
                const connected = p.isConnected();
                const Icon = p.icon;
                const color = platformColors[p.id] || '#E1C37A';

                return (
                  <div
                    key={p.id}
                    onMouseEnter={handleCardMouseEnter}
                    className="relative z-10 p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5 hover:border-[#E1C37A]/20 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color }} />
                      </div>
                      {connected && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-[#1A1A1C]" />
                        </div>
                      )}
                    </div>

                    <h3 className="text-[#D6D7D8] font-semibold text-lg mb-1">{p.name}</h3>
                    <p className="text-[#5B5C60] text-sm mb-4">
                      {connected ? 'Connected' : 'Not connected'}
                    </p>

                    {p.connect && (
                      <button
                        onClick={() => {
                          setLoadingPlatform(p.id);
                          connected ? p.disconnect?.() : p.connect();
                          setTimeout(() => setLoadingPlatform(null), 1200);
                        }}
                        className={`w-full py-2 px-4 rounded-full text-xs font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                          connected
                            ? 'bg-transparent border border-[#E1C37A]/30 text-[#E1C37A] hover:bg-[#E1C37A]/10'
                            : 'bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C] hover:shadow-[0_0_20px_rgba(225,195,122,0.3)]'
                        }`}
                      >
                        {loadingPlatform === p.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : connected ? (
                          <>
                            <Unlink className="w-4 h-4" />
                            Disconnect
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-4 h-4" />
                            Connect
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Platform Selection */}
            <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
              <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">
                Select Platforms
                <span className="text-[#5B5C60] font-normal ml-2">({selectedPlatforms.length} selected)</span>
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {ALL_PLATFORMS.filter(p => p.isConnected()).map((p) => {
                  const selected = isSelected(p.id);
                  const Icon = p.icon;
                  const color = platformColors[p.id];

                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id, true)}
                      className={`relative p-4 rounded-xl border transition-all duration-300 ${
                        selected
                          ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                          : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {selected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-[#1A1A1C]" />
                        </div>
                      )}
                      <div
                        className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <p className={`text-xs font-medium ${selected ? 'text-[#E1C37A]' : 'text-[#A9AAAC]'}`}>
                        {p.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Media Upload */}
            <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
              <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">
                Media <span className="text-[#5B5C60] font-normal">(optional)</span>
              </h3>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} className="w-full rounded-lg max-h-64 object-contain bg-black/20" />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
                    isDragging
                      ? 'border-[#E1C37A] bg-[#E1C37A]/5'
                      : 'border-[#5B5C60]/50 hover:border-[#E1C37A]/50 hover:bg-[#3B3C3E]/20'
                  }`}
                >
                  <div className="flex justify-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-[#E1C37A]/10 flex items-center justify-center">
                      <ImageIcon className="w-7 h-7 text-[#E1C37A]" />
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-[#B6934C]/10 flex items-center justify-center">
                      <Video className="w-7 h-7 text-[#B6934C]" />
                    </div>
                  </div>
                  <p className="text-[#D6D7D8] font-medium mb-2">Drop your image or video here</p>
                  <p className="text-[#5B5C60] text-sm">or click to browse</p>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                hidden
                accept="image/*,video/*"
                onChange={handleImageUpload}
              />
            </div>

            {/* Caption Editor */}
            <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
              <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">Caption</h3>
              <div className="relative">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={6}
                  placeholder="Write your caption here..."
                  className="w-full rounded-xl bg-[#3B3C3E]/30 border border-white/10 p-4 text-[#D6D7D8] placeholder:text-[#5B5C60] focus:border-[#E1C37A]/50 focus:ring-2 focus:ring-[#E1C37A]/20 resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-[#5B5C60]">
                  {caption.length} characters
                </div>
              </div>
              <div className="flex items-center justify-between p-4 mt-4 rounded-xl bg-[#3B3C3E]/30 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E1C37A]/20 to-[#B6934C]/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#E1C37A]" />
                  </div>
                  <div>
                    <p className="text-[#D6D7D8] font-medium text-sm">AI Enhancement</p>
                    <p className="text-[#5B5C60] text-xs">Improve your caption with AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiEnhance(!aiEnhance)}
                  className={`relative w-14 h-7 rounded-full transition ${
                    aiEnhance ? 'bg-[#E1C37A]' : 'bg-[#3B3C3E]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-black transition ${
                      aiEnhance ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Schedule Selector */}
            <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
              <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">When to Post</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setPostMode('publish')}
                  className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                    postMode === 'publish'
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    postMode === 'publish' ? 'bg-[#E1C37A]/20' : 'bg-[#3B3C3E]'
                  }`}>
                    <Send className={`w-5 h-5 ${postMode === 'publish' ? 'text-[#E1C37A]' : 'text-[#5B5C60]'}`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${postMode === 'publish' ? 'text-[#E1C37A]' : 'text-[#D6D7D8]'}`}>
                      Post Now
                    </p>
                    <p className="text-xs text-[#5B5C60]">Publish immediately</p>
                  </div>
                </button>

                <button
                  onClick={() => setPostMode('schedule')}
                  className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                    postMode === 'schedule'
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    postMode === 'schedule' ? 'bg-[#E1C37A]/20' : 'bg-[#3B3C3E]'
                  }`}>
                    <Clock className={`w-5 h-5 ${postMode === 'schedule' ? 'text-[#E1C37A]' : 'text-[#5B5C60]'}`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${postMode === 'schedule' ? 'text-[#E1C37A]' : 'text-[#D6D7D8]'}`}>
                      Schedule
                    </p>
                    <p className="text-xs text-[#5B5C60]">Choose date & time</p>
                  </div>
                </button>
              </div>

              {postMode === 'schedule' && (
                <input
                  type="datetime-local"
                  className="w-full bg-[#3B3C3E]/50 border border-white/10 p-3 rounded-xl text-[#D6D7D8] focus:border-[#E1C37A]/50 focus:ring-2 focus:ring-[#E1C37A]/20"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setCaption("");
                  setImageFile(null);
                  setImagePreview(null);
                  setSelectedPlatforms([]);
                }}
                className="px-6 py-3 rounded-full bg-transparent border border-[#E1C37A]/30 text-[#E1C37A] hover:bg-[#E1C37A]/10 transition-all duration-300"
              >
                Clear
              </button>

              <button
                onClick={handlePublish}
                disabled={loading}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C] font-medium hover:shadow-[0_0_20px_rgba(225,195,122,0.3)] transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {postMode === 'publish' ? 'Publish Now' : 'Schedule Post'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}