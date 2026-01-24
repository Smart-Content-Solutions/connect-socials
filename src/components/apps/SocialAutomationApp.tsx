import React, { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
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
  LayoutDashboard,
  Edit2
} from "lucide-react";

import {
  initiateLinkedInAuth,
  clearLinkedInAuthData,
  isLinkedInConnected
} from "@/utils/linkedinOAuth";

import {
  initiateFacebookAuth,
  clearFacebookAuthData,
  isFacebookConnected,
  getFacebookAuthData,
  type FacebookPage
} from "@/utils/facebookOAuth";

import {
  initiateInstagramAuth,
  clearInstagramAuthData,
  isInstagramConnected,
  getInstagramAuthData,
  type InstagramAuthData
} from "@/utils/instagramOAuth";

import {
  initiateTikTokAuth,
  clearTikTokAuthData,
  isTikTokConnected
} from "@/utils/tiktokOAuth";

import {
  saveBlueskyCredentials,
  getBlueskyCredentials,
  clearBlueskyCredentials,
  isBlueskyConnected
} from "@/utils/blueskyOAuth";

import DashboardContent from "../social/DashboardContent";

type Platform = {
  id: string;
  name: string;
  icon: any;
  connect?: () => void;
  disconnect?: () => void;
  isConnected: () => boolean;
};

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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'video'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [aiEnhance, setAiEnhance] = useState(true);

  // Animation refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Easing function for smooth scroll
  const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Scroll animation effect
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const activeIndex = ['dashboard', 'create', 'video'].indexOf(activeTab);
      // Calculate scroll position based on container width
      const scrollTo = scrollContainerRef.current.clientWidth * activeIndex;

      if (isInitialMount.current) {
        scrollContainerRef.current.scrollLeft = scrollTo;
        isInitialMount.current = false;
        return;
      }

      const start = scrollContainerRef.current.scrollLeft;
      const end = scrollTo;
      const duration = 800;
      const startTime = performance.now();

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = start + (end - start) * easedProgress;
        }

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    }
  }, [activeTab]);
  const [postMode, setPostMode] = useState("publish");
  const [scheduledTime, setScheduledTime] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);
  const [blueskyUsername, setBlueskyUsername] = useState("");
  const [blueskyPassword, setBlueskyPassword] = useState("");
  const [blueskyError, setBlueskyError] = useState("");
  const [isEditingBluesky, setIsEditingBluesky] = useState(false);
  const [showFacebookPagesModal, setShowFacebookPagesModal] = useState(false);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<FacebookPage | null>(null);
  const [showBlueskyInfo, setShowBlueskyInfo] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Instagram State
  const [instagramData, setInstagramData] = useState<InstagramAuthData | null>(null);
  const [showInstagramPagesModal, setShowInstagramPagesModal] = useState(false);
  const [selectedInstagramPage, setSelectedInstagramPage] = useState<any>(null);

  // Load Facebook Pages on mount if connected
  useEffect(() => {
    if (isFacebookConnected()) {
      const data = getFacebookAuthData();
      if (data?.pages) {
        setFacebookPages(data.pages);
      }

      // Check if we have a saved page selection
      const savedPage = localStorage.getItem('facebook_selected_page');
      if (savedPage) {
        try {
          setSelectedFacebookPage(JSON.parse(savedPage));
        } catch (e) {
          console.error("Failed to parse saved facebook page", e);
        }
      }
    }

    if (isInstagramConnected()) {
      const data = getInstagramAuthData();
      setInstagramData(data);
      // Determine selected IG page (if any)
      if (data?.pages && data.pages.length > 0) {
        // Default to first if not set
        setSelectedInstagramPage(data.pages[0]);
      }
    }
  }, []);

  const gridRef = useRef<HTMLDivElement>(null);
  const [highlightStyle, setHighlightStyle] = useState({
    opacity: 0,
    transform: 'translate(0px, 0px)',
    width: 0,
    height: 0,
  });

  const handleBlueskyConnect = () => {
    const credentials = getBlueskyCredentials();
    if (credentials?.connected && !isEditingBluesky) {
      setIsEditingBluesky(true);
      setBlueskyUsername(credentials.username);
      setBlueskyPassword(credentials.password);
    } else {
      setIsEditingBluesky(false);
      setBlueskyUsername("");
      setBlueskyPassword("");
    }
    setBlueskyError("");
    setShowBlueskyModal(true);
  };

  const handleBlueskyDisconnect = () => {
    clearBlueskyCredentials();
    setLoadingPlatform(null);
    setBlueskyUsername("");
    setBlueskyPassword("");
    setIsEditingBluesky(false);
  };

  const handleBlueskySubmit = () => {
    setBlueskyError("");

    if (!blueskyUsername.trim()) {
      setBlueskyError("Username is required");
      return;
    }

    if (!blueskyPassword.trim()) {
      setBlueskyError("Password is required");
      return;
    }

    saveBlueskyCredentials(blueskyUsername.trim(), blueskyPassword.trim());
    setShowBlueskyModal(false);
    setBlueskyUsername("");
    setBlueskyPassword("");
    setIsEditingBluesky(false);
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
      id: "bluesky",
      name: "Bluesky",
      icon: Cloud,
      connect: handleBlueskyConnect,
      disconnect: handleBlueskyDisconnect,
      isConnected: isBlueskyConnected
    },
    {
      id: "x",
      name: "X (Twitter)",
      icon: Twitter,
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
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("=== SCHEDULING DEBUG ===");
      console.log("Scheduled Time (input):", scheduledTime);
      console.log("User Timezone:", userTimezone);
      console.log("========================");
      form.append("scheduled_time", scheduledTime);
      // Send user's browser timezone so backend can convert to UTC correctly
      form.append("user_timezone", userTimezone);
    }

    // Log all form data being sent
    console.log("=== FORM DATA BEING SENT ===");
    for (let [key, value] of form.entries()) {
      console.log(`${key}:`, value);
    }
    console.log("============================");


    if (imageFile) {
      form.append("image", imageFile);
    }

    if (selectedPlatforms.includes("bluesky")) {
      const blueskyCredentials = getBlueskyCredentials();
      if (blueskyCredentials) {
        form.append("bluesky_username", blueskyCredentials.username);
        form.append("bluesky_password", blueskyCredentials.password);
      }
    }

    const res = await fetch("https://n8n.smartcontentsolutions.co.uk/webhook/social-media", {
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
      setShowSuccessModal(true);
      toast.success(postMode === "publish" ? "Post successfully published!" : "Post successfully scheduled!");
      setCaption("");
      setImageFile(null);
      setImagePreview(null);
      setSelectedPlatforms([]);
      setTimeout(() => setIsSuccess(false), 5000);
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
      <div className="fixed top-1/4 -left-32 w-[500px] h-[500px] bg-[#E1C37A]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-[400px] h-[400px] bg-[#B6934C]/10 rounded-full blur-[150px] pointer-events-none" />

      {showBlueskyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3B3C3E] rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0085FF]/20 flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-[#0085FF]" />
                </div>
                <h2 className="text-xl font-bold text-[#D6D7D8]">
                  {isEditingBluesky ? "Edit Bluesky" : "Connect Bluesky"}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* INFO BUTTON — INSERTED HERE */}
                <div className="relative">
                  <button
                    onClick={() => setShowBlueskyInfo(!showBlueskyInfo)}
                    className="w-8 h-8 rounded-lg bg-[#3B3C3E] hover:bg-[#4B4C4E] flex items-center justify-center transition-colors"
                    title="How to find username & App Password"
                  >
                    <Sparkles className="w-4 h-4 text-[#A9AAAC]" />
                  </button>

                  {showBlueskyInfo && (
                    <div className="absolute right-0 mt-2 w-80 p-4 rounded-xl bg-[#2C2C2E] border border-white/10 shadow-xl text-sm z-50">
                      <p className="text-[#D6D7D8] font-semibold mb-2">How to get your Bluesky login details</p>

                      <ul className="space-y-2 text-[#A9AAAC]">
                        <li>
                          <b>1. Username</b>:
                          Open your Bluesky profile → your username ends with <code>.bsky.social</code>
                        </li>
                        <li>
                          <b>2. App Password</b>:
                          Go to Bluesky → Settings → <b>App Passwords</b> → Create a new password.
                        </li>
                        <li>
                          <b>Do NOT use your main password.</b> Use only an App Password.
                        </li>
                      </ul>

                      <button
                        onClick={() => setShowBlueskyInfo(false)}
                        className="mt-3 px-3 py-1 rounded-lg bg-[#3B3C3E] text-[#D6D7D8] text-xs hover:bg-[#4B4C4E]"
                      >
                        Got it
                      </button>
                    </div>
                  )}
                </div>

                {/* CLOSE BUTTON */}
                <button
                  onClick={() => {
                    setShowBlueskyModal(false);
                    setBlueskyError("");
                    setIsEditingBluesky(false);
                  }}
                  className="w-8 h-8 rounded-lg bg-[#3B3C3E] hover:bg-[#4B4C4E] flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-[#A9AAAC]" />
                </button>
              </div>
            </div>


            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#D6D7D8] mb-2">
                  Username or Email
                </label>
                <input
                  type="text"
                  value={blueskyUsername}
                  onChange={(e) => setBlueskyUsername(e.target.value)}
                  placeholder="username.bsky.social"
                  className="w-full rounded-xl bg-[#3B3C3E]/50 border border-white/10 p-3 text-[#D6D7D8] placeholder:text-[#5B5C60] focus:border-[#0085FF]/50 focus:ring-2 focus:ring-[#0085FF]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#D6D7D8] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={blueskyPassword}
                  onChange={(e) => setBlueskyPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-[#3B3C3E]/50 border border-white/10 p-3 text-[#D6D7D8] placeholder:text-[#5B5C60] focus:border-[#0085FF]/50 focus:ring-2 focus:ring-[#0085FF]/20"
                />
              </div>

              {blueskyError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {blueskyError}
                </div>
              )}

              <div className="bg-[#0085FF]/10 border border-[#0085FF]/20 rounded-lg p-3">
                <p className="text-sm text-[#A9AAAC]">
                  💡 Use your Bluesky username (e.g., username.bsky.social) and password
                </p>
              </div>

              <button
                onClick={handleBlueskySubmit}
                className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#0085FF] to-[#0066CC] text-white font-medium hover:shadow-[0_0_20px_rgba(0,133,255,0.3)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {isEditingBluesky ? "Update Credentials" : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Facebook Pages Selection Modal */}
      {showFacebookPagesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3B3C3E] rounded-2xl p-8 max-w-lg w-full border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#1877F2]/20 flex items-center justify-center">
                  <Facebook className="w-6 h-6 text-[#1877F2]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#D6D7D8]">Select Facebook Page</h2>
                  <p className="text-xs text-[#A9AAAC]">Choose a page to manage</p>
                </div>
              </div>
              <button
                onClick={() => setShowFacebookPagesModal(false)}
                className="w-8 h-8 rounded-lg bg-[#3B3C3E] hover:bg-[#4B4C4E] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#A9AAAC]" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {facebookPages.length === 0 ? (
                <div className="text-center py-8 text-[#5B5C60]">
                  <p>No pages found for this user.</p>
                  <p className="text-xs mt-2">Make sure you granted the correct permissions.</p>
                </div>
              ) : (
                facebookPages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => {
                      setSelectedFacebookPage(page);
                      localStorage.setItem('facebook_selected_page', JSON.stringify(page));
                      setShowFacebookPagesModal(false);
                      setActiveTab('dashboard');
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-[#2C2C2E] border border-white/5 hover:border-[#E1C37A]/50 hover:bg-[#E1C37A]/5 transition-all group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] font-bold text-lg">
                        {page.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[#D6D7D8] font-semibold group-hover:text-[#E1C37A] transition-colors">
                          {page.name}
                        </p>
                        <p className="text-xs text-[#5B5C60] font-mono">ID: {page.id}</p>
                      </div>
                    </div>

                    {selectedFacebookPage?.id === page.id && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-[#1A1A1C]" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <p className="text-xs text-[#5B5C60]">
                This list is retrieved using the <code>pages_show_list</code> permission.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instagram Pages Selection Modal */}
      {showInstagramPagesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3B3C3E] rounded-2xl p-8 max-w-lg w-full border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-pink-600/20 flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#D6D7D8]">Select Instagram Account</h2>
                  <p className="text-xs text-[#A9AAAC]">Linked to Facebook Pages</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstagramPagesModal(false)}
                className="w-8 h-8 rounded-lg bg-[#3B3C3E] hover:bg-[#4B4C4E] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#A9AAAC]" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {!instagramData?.pages || instagramData.pages.length === 0 ? (
                <div className="text-center py-8 text-[#5B5C60]">
                  <p>No linked pages found.</p>
                </div>
              ) : (
                instagramData.pages.map((page: any) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      setSelectedInstagramPage(page);
                      setShowInstagramPagesModal(false);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-[#2C2C2E] border border-white/5 hover:border-[#E1C37A]/50 hover:bg-[#E1C37A]/5 transition-all group text-left"
                  >
                    <div className="flex items-center gap-4">
                      {instagramData && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 mb-4">
                          {(instagramData.picture || (instagramData as any).profilePicture) ? (
                            <img
                              src={instagramData.picture || (instagramData as any).profilePicture}
                              alt={instagramData.username || "IG"}
                              className="w-10 h-10 rounded-full border border-white/10"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-pink-500/80 flex items-center justify-center text-white font-bold text-lg">
                              {instagramData.username?.charAt(0).toUpperCase() || "I"}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white/90">
                              {instagramData.username ? `@${instagramData.username}` : "Connected"}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {(instagramData as any).pageName || "Professional Account"}
                            </span>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-[#D6D7D8] font-semibold group-hover:text-[#E1C37A] transition-colors">
                          {instagramData.username || page.name}
                        </p>
                        <p className="text-xs text-[#5B5C60] font-mono">Page: {page.name}</p>
                      </div>
                    </div>

                    {selectedInstagramPage?.id === page.id && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-[#1A1A1C]" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <p className="text-xs text-[#5B5C60]">
                Using <code>instagram_business_basic</code> via linked Page.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6">
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
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'dashboard'
                ? 'bg-[#E1C37A]/20 text-[#E1C37A]'
                : 'text-[#A9AAAC] hover:text-[#D6D7D8]'
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'create'
                ? 'bg-[#E1C37A]/20 text-[#E1C37A]'
                : 'text-[#A9AAAC] hover:text-[#D6D7D8]'
                }`}
            >
              Post Image
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'video'
                ? 'bg-[#E1C37A]/20 text-[#E1C37A]'
                : 'text-[#A9AAAC] hover:text-[#D6D7D8]'
                }`}
            >
              Post Video
            </button>
          </div>
        </div>

        {isSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-[#E1C37A]/10 border border-[#E1C37A]/20 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-[#D6D7D8] font-medium">
                Success! content {postMode === 'publish' ? 'published' : 'scheduled'}.
              </p>
              {selectedFacebookPage && selectedPlatforms.includes('facebook') && (
                <p className="text-[#A9AAAC] text-xs mt-1">
                  Posted to <b>{selectedFacebookPage.name}</b> (ID: {selectedFacebookPage.id}) using
                  <code>pages_manage_posts</code> permission.
                </p>
              )}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-hidden scroll-smooth"
            style={{
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',   /* Firefox */
              msOverflowStyle: 'none'   /* IE/Edge */
            }}
          >
            {/* Dashboard Slide */}
            <div
              className="space-y-8 min-w-full flex-shrink-0 px-1"
              style={{ scrollSnapAlign: 'start' }}
            >
              <DashboardContent selectedPage={selectedFacebookPage} />

              {/* Connected Accounts — Post Image */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <LinkIcon className="w-5 h-5 text-[#E1C37A]" />
                  <h3 className="text-lg font-semibold text-[#D6D7D8]">Connected Accounts — Post Image</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#E1C37A]/10 text-[#E1C37A] text-sm">
                    {connectedCount} / {ALL_PLATFORMS.length}
                  </span>
                </div>
                <p className="text-sm text-[#A9AAAC] mb-6">Manage accounts for image posts</p>

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
                          <div className="flex gap-2">
                            {connected && (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-[#1A1A1C]" />
                              </div>
                            )}
                            {connected && p.id === "bluesky" && (
                              <button
                                onClick={() => {
                                  setIsEditingBluesky(true);
                                  handleBlueskyConnect();
                                }}
                                className="w-6 h-6 rounded-full bg-[#E1C37A]/20 flex items-center justify-center hover:bg-[#E1C37A]/30 transition-colors"
                                title="Edit credentials"
                              >
                                <Edit2 className="w-3 h-3 text-[#E1C37A]" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 className="text-[#D6D7D8] font-semibold text-lg mb-1">{p.name}</h3>
                        <p className="text-[#5B5C60] text-sm mb-4">
                          {connected
                            ? (p.id === 'facebook' && selectedFacebookPage
                              ? `Page: ${selectedFacebookPage.name}`
                              : p.id === 'instagram' && instagramData?.username
                                ? `Connected as @${instagramData.username}`
                                : 'Connected')
                            : 'Not connected'}
                        </p>

                        {p.connect && (
                          <div className="space-y-2">
                            {connected && p.id === 'facebook' ? (
                              <>
                                <button
                                  onClick={() => setShowFacebookPagesModal(true)}
                                  className="w-full py-2 px-4 rounded-full text-xs font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-[#E1C37A]/10 border border-[#E1C37A]/30 text-[#E1C37A] hover:bg-[#E1C37A]/20"
                                >
                                  <LayoutDashboard className="w-4 h-4" />
                                  {selectedFacebookPage ? "Switch Page" : "Select Page"}
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Disconnect Facebook?")) {
                                      p.disconnect?.();
                                      setSelectedFacebookPage(null);
                                      localStorage.removeItem('facebook_selected_page');
                                    }
                                  }}
                                  className="w-full py-1 text-xs text-[#5B5C60] hover:text-red-400 transition-colors"
                                >
                                  Disconnect
                                </button>
                              </>
                            ) : connected && p.id === 'instagram' ? (
                              <>
                                {instagramData && (
                                  <div className="mb-3 p-2 rounded bg-black/20 flex items-center gap-2">
                                    {instagramData.picture ? (
                                      <img src={instagramData.picture} className="w-8 h-8 rounded-full" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white text-xs">
                                        {instagramData.username ? instagramData.username.charAt(0).toUpperCase() : "I"}
                                      </div>
                                    )}
                                    <div className="overflow-hidden">
                                      <p className="text-xs text-[#D6D7D8] font-bold truncate">@{instagramData.username}</p>
                                    </div>
                                  </div>
                                )}
                                <button
                                  onClick={() => setShowInstagramPagesModal(true)}
                                  className="w-full py-2 px-4 rounded-full text-xs font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-[#E1C37A]/10 border border-[#E1C37A]/30 text-[#E1C37A] hover:bg-[#E1C37A]/20"
                                >
                                  <LayoutDashboard className="w-4 h-4" />
                                  Select Page
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Disconnect Instagram?")) {
                                      p.disconnect?.();
                                      setInstagramData(null);
                                    }
                                  }}
                                  className="w-full py-1 text-xs text-[#5B5C60] hover:text-red-400 transition-colors"
                                >
                                  Disconnect
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setLoadingPlatform(p.id);
                                  connected ? p.disconnect?.() : p.connect();
                                  setTimeout(() => setLoadingPlatform(null), 1200);
                                }}
                                className={`w-full py-2 px-4 rounded-full text-xs font-medium transition-all duration-300 flex items-center justify-center gap-2 ${connected
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connected Accounts — Post Video */}
              <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <LinkIcon className="w-5 h-5 text-[#E1C37A]" />
                  <h3 className="text-lg font-semibold text-[#D6D7D8]">Connected Accounts — Post Video</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#E1C37A]/10 text-[#E1C37A] text-sm">
                    {connectedCount} / {ALL_PLATFORMS.length}
                  </span>
                </div>
                <p className="text-sm text-[#A9AAAC] mb-6">Manage accounts for short-form video posting</p>

                <div
                  className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {ALL_PLATFORMS.map((p) => {
                    const connected = p.isConnected();
                    const Icon = p.icon;
                    const color = platformColors[p.id] || '#E1C37A';

                    return (
                      <div
                        key={p.id}
                        className="relative z-10 p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5 hover:border-[#E1C37A]/20 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <Icon className="w-6 h-6" style={{ color }} />
                          </div>
                          <div className="flex gap-2">
                            {connected && (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-[#1A1A1C]" />
                              </div>
                            )}
                            {connected && p.id === "bluesky" && (
                              <button
                                onClick={() => {
                                  setIsEditingBluesky(true);
                                  handleBlueskyConnect();
                                }}
                                className="w-6 h-6 rounded-full bg-[#E1C37A]/20 flex items-center justify-center hover:bg-[#E1C37A]/30 transition-colors"
                                title="Edit credentials"
                              >
                                <Edit2 className="w-3 h-3 text-[#E1C37A]" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 className="text-[#D6D7D8] font-semibold text-lg mb-1">{p.name}</h3>
                        <p className="text-[#5B5C60] text-sm mb-4">
                          {connected
                            ? (p.id === 'facebook' && selectedFacebookPage
                              ? `Page: ${selectedFacebookPage.name}`
                              : 'Connected')
                            : 'Not connected'}
                        </p>

                        {p.connect && (
                          <div className="space-y-2">
                            {connected && p.id === 'facebook' ? (
                              <>
                                <button
                                  onClick={() => setShowFacebookPagesModal(true)}
                                  className="w-full py-2 px-4 rounded-full text-xs font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-[#E1C37A]/10 border border-[#E1C37A]/30 text-[#E1C37A] hover:bg-[#E1C37A]/20"
                                >
                                  <LayoutDashboard className="w-4 h-4" />
                                  {selectedFacebookPage ? "Switch Page" : "Select Page"}
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Disconnect Facebook?")) {
                                      p.disconnect?.();
                                      setSelectedFacebookPage(null);
                                      localStorage.removeItem('facebook_selected_page');
                                    }
                                  }}
                                  className="w-full py-1 text-xs text-[#5B5C60] hover:text-red-400 transition-colors"
                                >
                                  Disconnect
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setLoadingPlatform(p.id);
                                  connected ? p.disconnect?.() : p.connect();
                                  setTimeout(() => setLoadingPlatform(null), 1200);
                                }}
                                className={`w-full py-2 px-4 rounded-full text-xs font-medium transition-all duration-300 flex items-center justify-center gap-2 ${connected
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Create Slide */}
            <div
              className="space-y-6 min-w-full flex-shrink-0 px-1"
              style={{ scrollSnapAlign: 'start' }}
            >
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
                        className={`relative p-4 rounded-xl border transition-all duration-300 ${selected
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
                          {p.id === 'facebook' && selectedFacebookPage ? selectedFacebookPage.name : p.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
                <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">
                  Media <span className="text-[#5B5C60] font-normal">(optional)</span>
                </h3>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} className="w-full rounded-lg max-h-64 object-contain bg-black/20" alt="Preview" />
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
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 ${isDragging
                      ? 'border-[#E1C37A] bg-[#E1C37A]/5'
                      : 'border-[#5B5C60]/50 hover:border-[#E1C37A]/50 hover:bg-[#3B3C3E]/20'
                      }`}
                  >
                    <div className="flex justify-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-[#E1C37A]/10 flex items-center justify-center">
                        <ImageIcon className="w-7 h-7 text-[#E1C37A]" />
                      </div>
                    </div>
                    <p className="text-[#D6D7D8] font-medium mb-2">Drop your image here</p>
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
                    className={`relative w-14 h-7 rounded-full transition ${aiEnhance ? 'bg-[#E1C37A]' : 'bg-[#3B3C3E]'
                      }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-black transition ${aiEnhance ? 'translate-x-7' : 'translate-x-0'
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
                    className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${postMode === 'publish'
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${postMode === 'publish' ? 'bg-[#E1C37A]/20' : 'bg-[#3B3C3E]'
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
                    className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${postMode === 'schedule'
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${postMode === 'schedule' ? 'bg-[#E1C37A]/20' : 'bg-[#3B3C3E]'
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
            {/* Video Slide */}
            <div
              className="space-y-6 min-w-full flex-shrink-0 px-1"
              style={{ scrollSnapAlign: 'start' }}
            >
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
                        className={`relative p-4 rounded-xl border transition-all duration-300 ${selected
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
                          {p.id === 'facebook' && selectedFacebookPage ? selectedFacebookPage.name : p.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
                <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">
                  Media <span className="text-[#5B5C60] font-normal">(optional)</span>
                </h3>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} className="w-full rounded-lg max-h-64 object-contain bg-black/20" alt="Preview" />
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
                    onClick={() => document.getElementById('file-upload-video')?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 ${isDragging
                      ? 'border-[#E1C37A] bg-[#E1C37A]/5'
                      : 'border-[#5B5C60]/50 hover:border-[#E1C37A]/50 hover:bg-[#3B3C3E]/20'
                      }`}
                  >
                    <div className="flex justify-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-[#E1C37A]/10 flex items-center justify-center">
                        <ImageIcon className="w-7 h-7 text-[#E1C37A]" />
                      </div>
                    </div>
                    <p className="text-[#D6D7D8] font-medium mb-2">Drop your image here</p>
                    <p className="text-[#5B5C60] text-sm">or click to browse</p>
                  </div>
                )}
                <input
                  id="file-upload-video"
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
                    className={`relative w-14 h-7 rounded-full transition ${aiEnhance ? 'bg-[#E1C37A]' : 'bg-[#3B3C3E]'
                      }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-black transition ${aiEnhance ? 'translate-x-7' : 'translate-x-0'
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
                    className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${postMode === 'publish'
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${postMode === 'publish' ? 'bg-[#E1C37A]/20' : 'bg-[#3B3C3E]'
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
                    className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${postMode === 'schedule'
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${postMode === 'schedule' ? 'bg-[#E1C37A]/20' : 'bg-[#3B3C3E]'
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
          </div>
        </div>
      </div>


      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#3B3C3E] rounded-3xl p-8 max-w-md w-full border border-[#E1C37A]/30 shadow-[0_0_50px_rgba(225,195,122,0.2)] text-center relative overflow-hidden"
            >
              {/* Animated background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#E1C37A]/10 rounded-full blur-[80px] -z-10" />

              <div className="w-20 h-20 rounded-full bg-[#E1C37A]/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-[#E1C37A]" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">Post Successful!</h2>
              <p className="text-[#A9AAAC] mb-8 leading-relaxed">
                Your content has been {postMode === 'publish' ? 'published' : 'scheduled'} across your selected social platforms.
              </p>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C] font-bold hover:shadow-[0_0_20px_rgba(225,195,122,0.4)] transition-all duration-300"
              >
                Great, thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
