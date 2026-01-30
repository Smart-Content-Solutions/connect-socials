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
  Edit2,
  Eye
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
  getFacebookBusinesses,
  getFacebookPagesWithBusiness,
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
  initiateBlueskyAuth,
  saveBlueskyCredentials,
  getBlueskyCredentials,
  clearBlueskyCredentials,
  isBlueskyConnected
} from "@/utils/blueskyOAuth";

import { needsCompression } from "@/utils/videoCompressor";
import VideoCompressionModal from "../modals/VideoCompressionModal";

import DashboardContent from "../social/DashboardContent";
import InstagramDashboardContent from "../social/InstagramDashboardContent";

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

  // Facebook Business Manager State for Meta Compliance
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [facebookBusinesses, setFacebookBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string } | null>(null);

  const [showBlueskyInfo, setShowBlueskyInfo] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Instagram State
  const [instagramData, setInstagramData] = useState<InstagramAuthData | null>(null);
  const [showInstagramPagesModal, setShowInstagramPagesModal] = useState(false);
  const [selectedInstagramPage, setSelectedInstagramPage] = useState<any>(null);

  // AI & Preview State
  const [tone, setTone] = useState("Professional");
  const [previewText, setPreviewText] = useState("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // AI Video Generation State
  const [videoSource, setVideoSource] = useState<'upload' | 'generate'>('upload');
  const [aiVideoTab, setAiVideoTab] = useState<'image' | 'text'>('image');
  const [aiSourceImage, setAiSourceImage] = useState<File | null>(null);
  const [aiSourceImagePreview, setAiSourceImagePreview] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDuration, setAiDuration] = useState<5 | 10 | 15>(5);
  const [isGeneratingAiVideo, setIsGeneratingAiVideo] = useState(false);
  const [aiGeneratedVideoUrl, setAiGeneratedVideoUrl] = useState<string | null>(null);
  const [showAiVideoPreviewModal, setShowAiVideoPreviewModal] = useState(false);
  const [aiJobStatus, setAiJobStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [aiJobError, setAiJobError] = useState<string | null>(null);

  const TONE_OPTIONS = [
    "Professional",
    "Friendly",
    "Bold",
    "Informative",
    "Humorous",
    "Custom"
  ];

  const handlePreview = async () => {
    if (!caption.trim()) {
      toast.error("Please enter a caption first");
      return;
    }

    setIsGeneratingPreview(true);

    try {
      const form = new FormData();
      form.append("user_id", user?.id || "");
      form.append("caption", caption);
      form.append("tone", tone);
      form.append("preview", "true");
      form.append("use_ai", "yes");

      // Use correct webhook based on active tool (Image or Video)
      const isVideo = activeTab === 'video';
      const webhookUrl = isVideo
        ? "https://n8n.smartcontentsolutions.co.uk/webhook/social-media-video"
        : "https://n8n.smartcontentsolutions.co.uk/webhook/social-media";

      const res = await fetch(webhookUrl, {
        method: "POST",
        body: form
      });

      if (!res.ok) throw new Error("AI enhancement request failed");

      const rawData = await res.json();
      console.log("AI Preview Raw Response:", rawData);

      // n8n often returns an array, so we handle both cases
      const data = Array.isArray(rawData) ? rawData[0] : rawData;

      // Check for formatted response (from Set node) or raw workflow response
      if (data.status === "success" && data.enhanced_caption) {
        setPreviewText(data.enhanced_caption);
        setShowPreviewModal(true);
      } else if (data.is_preview === "true" && data.caption) {
        // Fallback: n8n is returning raw workflow data instead of Set node output
        setPreviewText(data.caption);
        setShowPreviewModal(true);
      } else {
        throw new Error(data.message || "Could not generate enhanced text");
      }
    } catch (err: any) {
      console.error("AI Preview Error:", err);
      toast.error(err.message || "Could not generate enhanced text");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleUseEnhancedText = () => {
    setCaption(previewText);
    setShowPreviewModal(false);
    setAiEnhance(false); // Disable auto-enhance since we already used it
    toast.success("Design updated with enhanced text!");
  };

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [highlightStyle, setHighlightStyle] = useState({
    opacity: 0,
    transform: 'translate(0px, 0px)',
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (scrollContainerRef.current) {
      const tabIndex = activeTab === 'dashboard' ? 0 : activeTab === 'create' ? 1 : 2;
      const scrollTo = tabIndex * scrollContainerRef.current.offsetWidth;
      const start = scrollContainerRef.current.scrollLeft;
      const end = scrollTo;
      const duration = 800;
      const startTime = performance.now();

      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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

      // Scroll page to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);


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

  const handleBlueskySubmit = async () => {
    setBlueskyError("");

    if (!blueskyUsername.trim()) {
      setBlueskyError("Username is required");
      return;
    }

    if (!blueskyPassword.trim()) {
      setBlueskyError("Password is required");
      return;
    }

    try {
      setLoadingPlatform("bluesky");
      if (!user) throw new Error("User not authenticated");

      await initiateBlueskyAuth(blueskyUsername.trim(), blueskyPassword.trim(), user.id);

      setShowBlueskyModal(false);
      setBlueskyUsername("");
      setBlueskyPassword("");
      setIsEditingBluesky(false);
    } catch (err: any) {
      setBlueskyError(err.message || "Failed to connect Bluesky. Check backend.");
    } finally {
      setLoadingPlatform(null);
    }
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

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showCompressionModal, setShowCompressionModal] = useState(false);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);

  const handleFacebookBusinessSelection = async () => {
    const authData = getFacebookAuthData();
    if (!authData?.access_token) {
      // If not connected, connect first
      window.location.reload(); // Simple reload to refresh state if needed, but normally we just wait
      return;
    }

    // Fetch businesses first
    try {
      const businesses = await getFacebookBusinesses(authData.access_token);
      if (businesses.length > 0) {
        setFacebookBusinesses(businesses);
        setShowBusinessModal(true);
      } else {
        // No businesses found, fallback to just pages
        setShowFacebookPagesModal(true);
      }
    } catch (e) {
      console.error("Error fetching businesses", e);
      setShowFacebookPagesModal(true);
    }
  };

  const handleBusinessSelect = async (business: { id: string; name: string }) => {
    setSelectedBusiness(business);
    const authData = getFacebookAuthData();
    if (!authData?.access_token) return;

    try {
      const pages = await getFacebookPagesWithBusiness(authData.access_token);

      // Filter pages belonging to this business
      // API returns business: { id, name } inside page object, or just id? We check both safely
      const filteredPages = pages.filter((p: any) => p.business?.id === business.id);

      // Map to FacebookPage type
      const mappedPages: FacebookPage[] = filteredPages.map((p: any) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token
      }));

      // Use filtered pages if any, otherwise fallback to all (or empty if strict)
      // For demo: strictly show only pages under that business
      setFacebookPages(mappedPages);
      setShowBusinessModal(false);
      setShowFacebookPagesModal(true);
    } catch (e) {
      console.error("Error fetching pages for business", e);
      // Fallback
      setShowFacebookPagesModal(true);
    }
  };

  // Maximum video file size: 50MB (server limit)
  const MAX_VIDEO_SIZE_MB = 50;

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Validate file type
    if (!f.type.startsWith('video/')) {
      toast.error('Please upload a valid video file');
      return;
    }

    // Check if compression is needed
    if (needsCompression(f, MAX_VIDEO_SIZE_MB)) {
      const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
      toast.info(`Video is ${sizeMB}MB - starting smart compression...`);
      setPendingVideoFile(f);
      setShowCompressionModal(true);
      return;
    }

    // File is small enough, use directly
    setVideoFile(f);
    setVideoPreview(URL.createObjectURL(f));
  };

  // Handle compressed video from modal
  const handleCompressionComplete = (compressedFile: File) => {
    setVideoFile(compressedFile);
    setVideoPreview(URL.createObjectURL(compressedFile));
    setPendingVideoFile(null);
    toast.success('Video compressed successfully!');
  };

  // AI Video Generation Handlers
  const handleAiSourceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    setAiSourceImage(f);
    const reader = new FileReader();
    reader.onloadend = () => setAiSourceImagePreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const handleGenerateAiVideo = async () => {
    if (!aiSourceImage) {
      toast.error('Please upload a source image first');
      return;
    }

    setIsGeneratingAiVideo(true);
    setAiJobStatus('pending');
    setAiJobError(null);

    try {
      const formData = new FormData();
      formData.append('user_id', user!.id);
      formData.append('source_image', aiSourceImage);
      formData.append('prompt', aiPrompt || 'Animate this image with smooth motion');
      formData.append('duration', String(aiDuration));
      formData.append('aspect_ratio', '9:16');

      toast.info('Starting AI video generation...');

      const response = await fetch('https://n8n.smartcontentsolutions.co.uk/webhook/ai-video-generate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.video_url) {
        setAiGeneratedVideoUrl(result.video_url);
        setAiJobStatus('completed');
        setShowAiVideoPreviewModal(true);
        toast.success('AI video generated successfully!');
      } else {
        throw new Error(result.error || 'Video generation failed');
      }
    } catch (error: any) {
      console.error('AI video generation error:', error);
      setAiJobStatus('failed');
      setAiJobError(error.message);
      toast.error(`Failed to generate video: ${error.message}`);
    } finally {
      setIsGeneratingAiVideo(false);
    }
  };

  const handleUseAiVideo = async () => {
    if (!aiGeneratedVideoUrl) return;

    try {
      // Download the generated video and convert to File object
      const response = await fetch(aiGeneratedVideoUrl);
      const blob = await response.blob();
      const file = new File([blob], `ai-video-${Date.now()}.mp4`, { type: 'video/mp4' });

      // Set it as the video file for posting
      setVideoFile(file);
      setVideoPreview(aiGeneratedVideoUrl);
      setShowAiVideoPreviewModal(false);

      // Switch to upload mode to show the video in the posting workflow
      setVideoSource('upload');

      toast.success('AI video attached to post!');
    } catch (error: any) {
      console.error('Error using AI video:', error);
      toast.error('Failed to attach AI video');
    }
  };


  const sendToBackend = async () => {
    const form = new FormData();
    form.append("user_id", user!.id);
    form.append("caption", caption);
    selectedPlatforms.forEach((p) => form.append("platforms[]", p));
    form.append("post_mode", postMode);
    form.append("use_ai", aiEnhance ? "yes" : "no");
    if (aiEnhance) {
      form.append("tone", tone);
    }
    // Explicitly for image flow
    form.append("type", "image");

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

  const sendVideoToBackend = async () => {
    const form = new FormData();
    form.append("user_id", user!.id);
    form.append("caption", caption);
    selectedPlatforms.forEach((p) => form.append("platforms[]", p));
    form.append("post_mode", postMode);
    // AI enhance might not be implemented for video yet, but we'll send the flag just in case the workflow supports it later
    form.append("use_ai", aiEnhance ? "yes" : "no");
    if (aiEnhance) {
      form.append("tone", tone);
    }
    form.append("type", "video");

    if (postMode === "schedule") {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      form.append("scheduled_time", scheduledTime);
      form.append("user_timezone", userTimezone);
    }

    if (videoFile) {
      form.append("video", videoFile);
    } else {
      throw new Error("Video file is required for video posts");
    }

    if (selectedPlatforms.includes("bluesky")) {
      const blueskyCredentials = getBlueskyCredentials();
      if (blueskyCredentials) {
        form.append("bluesky_username", blueskyCredentials.username);
        form.append("bluesky_password", blueskyCredentials.password);
      }
    }

    // NEW ENDPOINT for video
    console.log("SENDING VIDEO TO:", "https://n8n.smartcontentsolutions.co.uk/webhook/social-media-video");

    try {
      const res = await fetch("https://n8n.smartcontentsolutions.co.uk/webhook/social-media-video", {
        method: "POST",
        body: form
      });

      console.log("WEBHOOK RESPONSE STATUS:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("WEBHOOK ERROR BODY:", errorText);

        if (res.status === 413) {
          throw new Error("Video file is too large for the server. Please compress it to under 50MB.");
        }
        if (res.status === 404) {
          throw new Error("Server endpoint not found (404). Please ensure the 'Complete Social Media Video Automation' workflow is Active in n8n.");
        }
        throw new Error(errorText || `Server error: ${res.status}`);
      }
    } catch (error: any) {
      console.error("FETCH ERROR DETAILS:", error);
      // Handle network errors (including CORS failures from 413)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error("Video upload failed. The file may be too large (max 50MB) or there's a network issue. Please try a smaller video.");
      }
      throw error;
    }
  };

  const handlePublish = async () => {
    setErrorMsg(null);

    if (!caption.trim())
      return setErrorMsg("Caption is required.");

    if (selectedPlatforms.length === 0)
      return setErrorMsg("Select at least one connected platform.");

    setLoading(true);

    try {
      if (activeTab === 'video') {
        await sendVideoToBackend();
      } else {
        await sendToBackend();
      }

      setIsSuccess(true);
      setShowSuccessModal(true);
      toast.success(postMode === "publish" ? "Post successfully published!" : "Post successfully scheduled!");

      // Clear all state
      setCaption("");
      setImageFile(null);
      setImagePreview(null);
      setVideoFile(null);
      setVideoPreview(null);
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

      {/* Facebook Business Selection Modal */}
      {showBusinessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3B3C3E] rounded-2xl p-8 max-w-lg w-full border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#1877F2]/20 flex items-center justify-center">
                  <Facebook className="w-6 h-6 text-[#1877F2]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#D6D7D8]">Select Business Manager</h2>
                  <p className="text-xs text-[#A9AAAC]">Choose a business to load assets from</p>
                </div>
              </div>
              <button
                onClick={() => setShowBusinessModal(false)}
                className="w-8 h-8 rounded-lg bg-[#3B3C3E] hover:bg-[#4B4C4E] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#A9AAAC]" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {facebookBusinesses.length === 0 ? (
                <div className="text-center py-8 text-[#5B5C60]">
                  <p>No businesses found.</p>
                  <button
                    onClick={() => { setShowBusinessModal(false); setShowFacebookPagesModal(true); }}
                    className="mt-4 text-[#E1C37A] text-sm hover:underline"
                  >
                    Continue to Pages anyway
                  </button>
                </div>
              ) : (
                facebookBusinesses.map(business => (
                  <button
                    key={business.id}
                    onClick={() => handleBusinessSelect(business)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-[#2C2C2E] border border-white/5 hover:border-[#E1C37A]/50 hover:bg-[#E1C37A]/5 transition-all group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[#D6D7D8] font-semibold group-hover:text-[#E1C37A] transition-colors">
                          {business.name}
                        </p>
                        <p className="text-xs text-[#5B5C60] font-mono">ID: {business.id}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
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
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSelectedInstagramPage("demo-page");
                      setShowInstagramPagesModal(false);
                      toast.success("Instagram account selected");
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-[#2C2C2E] border border-white/5 hover:border-[#E1C37A]/50 hover:bg-[#E1C37A]/5 transition-all group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-[#2C2C2E] flex items-center justify-center">
                          {(instagramData?.picture || instagramData?.profilePicture) ? (
                            <img
                              src={instagramData.picture || instagramData.profilePicture || ''}
                              alt="IG"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-xl">
                              {(instagramData?.username || 'hsuswiowkskow').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-[#D6D7D8] font-semibold group-hover:text-[#E1C37A] transition-colors">
                          @{instagramData?.username || 'hsuswiowkskow'}
                        </p>
                        <p className="text-xs text-[#5B5C60]">
                          {instagramData?.pageName ? `Linked to ${instagramData.pageName}` : "Professional Account"}
                        </p>
                      </div>
                    </div>
                  </button>
                  <p className="text-[10px] text-center text-[#5B5C60] pt-2 italic">
                    Professional Instagram accounts linked to Facebook Pages appear here.
                  </p>
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

        {/* Content Area with Slide Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mt-4 rounded-2xl bg-[#3B3C3E]/20 backdrop-blur-[10px] border border-white/5 overflow-hidden"
        >
          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-hidden scroll-smooth"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {/* Dashboard Panel */}
            <div
              className="w-full flex-shrink-0 p-6 md:p-8 space-y-8"
              style={{ scrollSnapAlign: 'start' }}
            >
              <DashboardContent selectedPage={selectedFacebookPage} />

              {instagramData && <InstagramDashboardContent instagramData={instagramData} />}

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
                              : p.id === 'instagram'
                                ? `Connected as @${instagramData?.username || 'hsuswiowkskow'}`
                                : 'Connected')
                            : 'Not connected'}
                        </p>

                        {p.connect && (
                          <div className="space-y-2">
                            {connected && p.id === 'facebook' ? (
                              <>
                                <button
                                  onClick={handleFacebookBusinessSelection}
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
                              : p.id === 'instagram'
                                ? `Connected as @${instagramData?.username || 'hsuswiowkskow'}`
                                : 'Connected')
                            : 'Not connected'}
                        </p>

                        {p.connect && (
                          <div className="space-y-2">
                            {connected && p.id === 'facebook' ? (
                              <>
                                <button
                                  onClick={handleFacebookBusinessSelection}
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
            </div>

            {/* Create Post Panel */}
            <div
              className="w-full flex-shrink-0 p-6 md:p-8 space-y-6"
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

              <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5 space-y-4">
                <h3 className="text-sm font-semibold text-[#D6D7D8]">Caption & AI Settings</h3>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-[#A9AAAC] font-medium ml-1">Content Tone</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-4 py-3 text-[#D6D7D8] focus:outline-none focus:border-[#E1C37A]/50 appearance-none cursor-pointer"
                    >
                      {TONE_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-[#A9AAAC] font-medium ml-1">AI Options</label>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#2C2C2E] border border-white/10 h-[50px]">
                      <div className="flex items-center gap-2">
                        <Sparkles className={`w-4 h-4 ${aiEnhance ? 'text-[#E1C37A]' : 'text-[#5B5C60]'}`} />
                        <span className="text-sm text-[#D6D7D8]">Enhancement</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {aiEnhance && (
                          <button
                            onClick={handlePreview}
                            disabled={isGeneratingPreview || !caption.trim()}
                            className="text-xs bg-[#E1C37A]/10 text-[#E1C37A] border border-[#E1C37A]/30 px-3 py-1 rounded-lg hover:bg-[#E1C37A]/20 transition-colors flex items-center gap-1.5"
                          >
                            {isGeneratingPreview ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                            Preview
                          </button>
                        )}
                        <button
                          onClick={() => setAiEnhance(!aiEnhance)}
                          className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${aiEnhance ? 'bg-[#E1C37A]' : 'bg-[#4B4C4E]'}`}
                        >
                          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform duration-300 ${aiEnhance ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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

            {/* Video Post Panel */}
            <div
              className="w-full flex-shrink-0 p-6 md:p-8 space-y-6"
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
                <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">

                  {/* Video Source Toggle */}

                  <div className="mb-6">

                    <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">Video Source</h3>

                    <div className="grid grid-cols-2 gap-3">

                      <button

                        onClick={() => setVideoSource('upload')}

                        className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${videoSource === 'upload'

                          ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'

                          : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'

                          }`}

                      >

                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${videoSource === 'upload' ? 'bg-[#E1C37A]/20' : 'bg-[#3B3C3E]'

                          }`}>

                          <Upload className={`w-5 h-5 ${videoSource === 'upload' ? 'text-[#E1C37A]' : 'text-[#5B5C60]'}`} />

                        </div>

                        <div className="text-left">

                          <p className={`font-medium text-sm ${videoSource === 'upload' ? 'text-[#E1C37A]' : 'text-[#D6D7D8]'}`}>

                            Upload Video

                          </p>

                          <p className="text-xs text-[#5B5C60]">From your device</p>

                        </div>

                      </button>



                      <button

                        onClick={() => setVideoSource('generate')}

                        className={`p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${videoSource === 'generate'

                          ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'

                          : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'

                          }`}

                      >

                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${videoSource === 'generate' ? 'bg-[#E1C37A]/20' : 'bg-[#3B3C3E]'

                          }`}>

                          <Sparkles className={`w-5 h-5 ${videoSource === 'generate' ? 'text-[#E1C37A]' : 'text-[#5B5C60]'}`} />

                        </div>

                        <div className="text-left">

                          <p className={`font-medium text-sm ${videoSource === 'generate' ? 'text-[#E1C37A]' : 'text-[#D6D7D8]'}`}>

                            Generate AI Video

                          </p>

                          <p className="text-xs text-[#5B5C60]">Powered by Higgsfield</p>

                        </div>

                      </button>

                    </div>

                  </div>



                  {/* Upload Video Mode */}

                  {videoSource === 'upload' && (

                    <>

                      <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">

                        Media <span className="text-[#5B5C60] font-normal">(optional)</span>

                      </h3>

                      {videoPreview ? (

                        <div className="relative">

                          <video src={videoPreview} controls className="w-full rounded-lg max-h-64 bg-black/20" />

                          <button

                            onClick={() => {

                              setVideoFile(null);

                              setVideoPreview(null);

                            }}

                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 z-10"

                          >

                            <X className="w-4 h-4" />

                          </button>

                        </div>

                      ) : (

                        <div

                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}

                          onDragLeave={() => setIsDragging(false)}

                          onDrop={(e) => {

                            e.preventDefault();

                            setIsDragging(false);

                            const f = e.dataTransfer.files[0];

                            if (!f) return;

                            // Validate

                            if (!f.type.startsWith('video/')) {

                              toast.error('Please upload a valid video file');

                              return;

                            }

                            setVideoFile(f);

                            const reader = new FileReader();

                            reader.onloadend = () => setVideoPreview(String(reader.result));

                            reader.readAsDataURL(f);

                          }}

                          onClick={() => document.getElementById('file-upload-video')?.click()}

                          className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 ${isDragging

                            ? 'border-[#E1C37A] bg-[#E1C37A]/5'

                            : 'border-[#5B5C60]/50 hover:border-[#E1C37A]/50 hover:bg-[#3B3C3E]/20'

                            }`}

                        >

                          <div className="flex justify-center gap-4 mb-4">

                            <div className="w-14 h-14 rounded-xl bg-[#E1C37A]/10 flex items-center justify-center">

                              <Video className="w-7 h-7 text-[#E1C37A]" />

                            </div>

                          </div>

                          <p className="text-[#D6D7D8] font-medium mb-2">Drop your video here</p>

                          <p className="text-[#5B5C60] text-sm">or click to browse</p>

                        </div>

                      )}

                      <input

                        id="file-upload-video"

                        type="file"

                        hidden

                        accept="video/*"

                        onChange={handleVideoUpload}

                      />

                    </>

                  )}



                  {/* Generate AI Video Mode */}

                  {videoSource === 'generate' && (

                    <>

                      {/* AI Video Tabs */}

                      <div className="flex items-center gap-2 mb-6 bg-[#2C2C2E] rounded-xl p-1">

                        <button

                          onClick={() => setAiVideoTab('image')}

                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${aiVideoTab === 'image'

                            ? 'bg-[#E1C37A]/20 text-[#E1C37A]'

                            : 'text-[#A9AAAC] hover:text-[#D6D7D8]'

                            }`}

                        >

                          Image → Video

                        </button>

                        <button

                          onClick={() => setAiVideoTab('text')}

                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${aiVideoTab === 'text'

                            ? 'bg-[#E1C37A]/20 text-[#E1C37A]'

                            : 'text-[#A9AAAC] hover:text-[#D6D7D8]'

                            }`}

                        >

                          Text → Video

                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#5B5C60]/30 text-[#A9AAAC]">Soon</span>

                        </button>

                      </div>



                      {/* Image → Video Tab */}

                      {aiVideoTab === 'image' && (

                        <div className="space-y-4">

                          {/* Source Image Upload */}

                          <div>

                            <label className="text-sm font-semibold text-[#D6D7D8] mb-3 block">

                              Source Image <span className="text-red-400">*</span>

                            </label>

                            {aiSourceImagePreview ? (

                              <div className="relative">

                                <img src={aiSourceImagePreview} className="w-full rounded-lg max-h-64 object-contain bg-black/20" alt="Source" />

                                <button

                                  onClick={() => {

                                    setAiSourceImage(null);

                                    setAiSourceImagePreview(null);

                                  }}

                                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500"

                                >

                                  <X className="w-4 h-4" />

                                </button>

                              </div>

                            ) : (

                              <div

                                onClick={() => document.getElementById('ai-source-image-upload')?.click()}

                                className="cursor-pointer rounded-xl border-2 border-dashed border-[#5B5C60]/50 hover:border-[#E1C37A]/50 hover:bg-[#3B3C3E]/20 p-8 text-center transition-all duration-300"

                              >

                                <div className="flex justify-center mb-3">

                                  <div className="w-12 h-12 rounded-xl bg-[#E1C37A]/10 flex items-center justify-center">

                                    <ImageIcon className="w-6 h-6 text-[#E1C37A]" />

                                  </div>

                                </div>

                                <p className="text-[#D6D7D8] font-medium mb-1">Upload source image</p>

                                <p className="text-[#5B5C60] text-xs">9:16 aspect ratio recommended for shorts</p>

                              </div>

                            )}

                            <input

                              id="ai-source-image-upload"

                              type="file"

                              hidden

                              accept="image/*"

                              onChange={handleAiSourceImageUpload}

                            />

                          </div>



                          {/* Motion Prompt */}

                          <div>

                            <label className="text-sm font-semibold text-[#D6D7D8] mb-3 block">

                              Motion Description <span className="text-[#5B5C60] font-normal">(optional)</span>

                            </label>

                            <textarea

                              value={aiPrompt}

                              onChange={(e) => setAiPrompt(e.target.value)}

                              rows={3}

                              placeholder="Describe how you want the image to move (e.g., 'Gentle camera zoom in with subtle parallax effect')"

                              className="w-full rounded-xl bg-[#2C2C2E] border border-white/10 p-3 text-[#D6D7D8] placeholder:text-[#5B5C60] focus:border-[#E1C37A]/50 focus:ring-2 focus:ring-[#E1C37A]/20 resize-none text-sm"

                            />

                          </div>



                          {/* Duration Selector */}

                          <div>

                            <label className="text-sm font-semibold text-[#D6D7D8] mb-3 block">Duration</label>

                            <div className="grid grid-cols-3 gap-3">

                              {[5, 10, 15].map((duration) => (

                                <button

                                  key={duration}

                                  onClick={() => setAiDuration(duration as 5 | 10 | 15)}

                                  className={`p-3 rounded-xl border transition-all duration-300 ${aiDuration === duration

                                    ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50 text-[#E1C37A]'

                                    : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20 text-[#A9AAAC]'

                                    }`}

                                >

                                  <p className="font-semibold text-lg">{duration}s</p>

                                </button>

                              ))}

                            </div>

                          </div>



                          {/* Generate Button */}

                          <button

                            onClick={handleGenerateAiVideo}

                            disabled={!aiSourceImage || isGeneratingAiVideo}

                            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C] font-bold hover:shadow-[0_0_20px_rgba(225,195,122,0.3)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"

                          >

                            {isGeneratingAiVideo ? (

                              <>

                                <Loader2 className="w-5 h-5 animate-spin" />

                                Generating Video...

                              </>

                            ) : (

                              <>

                                <Sparkles className="w-5 h-5" />

                                Generate Preview

                              </>

                            )}

                          </button>



                          {/* Status Messages */}

                          {aiJobStatus === 'pending' && (

                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">

                              <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />

                              Initializing AI video generation...

                            </div>

                          )}

                          {aiJobStatus === 'processing' && (

                            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">

                              <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />

                              Processing your video... This may take a minute.

                            </div>

                          )}

                          {aiJobStatus === 'failed' && aiJobError && (

                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">

                              <X className="w-4 h-4 inline-block mr-2" />

                              {aiJobError}

                            </div>

                          )}

                        </div>

                      )}



                      {/* Text → Video Tab (Coming Soon) */}

                      {aiVideoTab === 'text' && (

                        <div className="text-center py-12">

                          <div className="w-16 h-16 rounded-full bg-[#E1C37A]/10 flex items-center justify-center mx-auto mb-4">

                            <Sparkles className="w-8 h-8 text-[#E1C37A]" />

                          </div>

                          <h4 className="text-lg font-semibold text-[#D6D7D8] mb-2">Coming Soon</h4>

                          <p className="text-[#A9AAAC] text-sm max-w-md mx-auto">

                            Text-to-video generation will be available in Phase 2. For now, use Image → Video to create stunning shorts!

                          </p>

                        </div>

                      )}

                    </>


                  )}

                </div>



                <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5 space-y-4">
                  <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">Caption & AI Settings</h3>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-[#A9AAAC] font-medium ml-1">Content Tone</label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-4 py-3 text-[#D6D7D8] focus:outline-none focus:border-[#E1C37A]/50 appearance-none cursor-pointer"
                      >
                        {TONE_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-[#A9AAAC] font-medium ml-1">AI Options</label>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#2C2C2E] border border-white/10 h-[50px]">
                        <div className="flex items-center gap-2">
                          <Sparkles className={`w-4 h-4 ${aiEnhance ? 'text-[#E1C37A]' : 'text-[#5B5C60]'}`} />
                          <span className="text-sm text-[#D6D7D8]">Enhancement</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {aiEnhance && (
                            <button
                              onClick={handlePreview}
                              disabled={isGeneratingPreview || !caption.trim()}
                              className="text-xs bg-[#E1C37A]/10 text-[#E1C37A] border border-[#E1C37A]/30 px-3 py-1 rounded-lg hover:bg-[#E1C37A]/20 transition-colors flex items-center gap-1.5"
                            >
                              {isGeneratingPreview ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                              Preview
                            </button>
                          )}
                          <button
                            onClick={() => setAiEnhance(!aiEnhance)}
                            className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${aiEnhance ? 'bg-[#E1C37A]' : 'bg-[#4B4C4E]'}`}
                          >
                            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform duration-300 ${aiEnhance ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setCaption("");
                      setVideoFile(null);
                      setVideoPreview(null);
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
        </motion.div>

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
          )
          }
        </AnimatePresence >

        {/* Video Compression Modal */}
        {pendingVideoFile && (
          <VideoCompressionModal
            isOpen={showCompressionModal}
            onClose={() => {
              setShowCompressionModal(false);
              setPendingVideoFile(null);
            }}
            file={pendingVideoFile}
            onCompressionComplete={handleCompressionComplete}
            maxSizeMB={MAX_VIDEO_SIZE_MB}
          />
        )}
        {/* AI Preview Modal */}
        <AnimatePresence>
          {showPreviewModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#3B3C3E] rounded-2xl w-full max-w-2xl border border-[#E1C37A]/30 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#2C2C2E]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E1C37A]/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#E1C37A]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#D6D7D8]">AI Preview</h3>
                      <p className="text-xs text-[#A9AAAC]">Tone: <span className="text-[#E1C37A]">{tone}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-[#A9AAAC]" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  <label className="text-sm text-[#A9AAAC] mb-2 block">Enhanced Caption:</label>
                  <textarea
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    rows={10}
                    className="w-full bg-[#1A1A1C] border border-white/10 rounded-xl p-4 text-[#D6D7D8] focus:border-[#E1C37A]/50 focus:ring-1 focus:ring-[#E1C37A]/30 leading-relaxed custom-scrollbar"
                  />
                  <p className="text-xs text-[#5B5C60] mt-2">
                    Feel free to edit this text. When you apply it, this will become your final caption.
                  </p>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-[#2C2C2E] flex justify-end gap-3">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-[#D6D7D8] hover:bg-white/5 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUseEnhancedText}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C] font-bold shadow-lg hover:shadow-[0_0_15px_rgba(225,195,122,0.3)] transition-all flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Use This Text
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* AI Video Preview Modal - New Feature */}
        <AnimatePresence>
          {showAiVideoPreviewModal && aiGeneratedVideoUrl && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#3B3C3E] rounded-2xl w-full max-w-2xl border border-[#E1C37A]/30 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#2C2C2E]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E1C37A]/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#E1C37A]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#D6D7D8]">AI Video Preview</h3>
                      <p className="text-xs text-[#A9AAAC]">Generated by Higgsfield AI</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAiVideoPreviewModal(false)}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-[#A9AAAC]" />
                  </button>
                </div>

                {/* Video Player */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <video
                      src={aiGeneratedVideoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full max-h-[60vh] object-contain"
                    />
                  </div>
                  <p className="text-xs text-[#5B5C60] mt-3 text-center">
                    Preview your AI-generated video. Click "Use this video" to attach it to your post.
                  </p>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-[#2C2C2E] flex justify-end gap-3">
                  <button
                    onClick={() => setShowAiVideoPreviewModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-[#D6D7D8] hover:bg-white/5 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUseAiVideo}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C] font-bold shadow-lg hover:shadow-[0_0_15px_rgba(225,195,122,0.3)] transition-all flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Use This Video
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div >
    </div >
  );
}
