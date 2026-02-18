import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
  Youtube,
  Sparkles,
  Send,
  X,
  Image as ImageIcon,
  Video,
  Clock,
  LayoutDashboard,
  Edit2,
  Eye,
  Cloud,
  Pin,
  MapPin,
  MessageCircle,
  FileText,
  AtSign,
  Users
} from "lucide-react";

import { usePostDraft } from "@/hooks/usePostDraft";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { LeaveConfirmationDialog, DraftRestoreDialog } from "@/components/drafts";
import { hasDraftContent } from "@/lib/draft-utils";
import type { ToolType } from "@/types/draft";

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
  isTikTokConnected,
  removeTikTokAccount
} from "@/utils/tiktokOAuth";

import {
  initiateYouTubeAuth,
  clearYouTubeAuthData,
  isYouTubeConnected,
} from "@/utils/youtubeOAuth";

import { needsCompression } from "@/utils/videoCompressor";

import {
  initiateBlueskyAuth,
  saveBlueskyCredentials,
  getBlueskyCredentials,
  clearBlueskyCredentials,
  isBlueskyConnected
} from "@/utils/blueskyOAuth";
import { aiAgentSupabase as supabase } from "@/lib/ai-agent-supabase";
import VideoCompressionModal from "../modals/VideoCompressionModal";

import DashboardContent from "../social/DashboardContent";
import InstagramDashboardContent from "../social/InstagramDashboardContent";
import ConnectedAccountsSelector, { type ConnectedAccount } from "../ConnectedAccountsSelector";

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
  youtube: '#FF0000',
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

  // Multi-file upload states (NEW)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

  // Legacy single-file states (for backward compatibility during transition)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errorMsg && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errorMsg]);

  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showBlueskyModal, setShowBlueskyModal] = useState(false);
  const [showBlueskyInfo, setShowBlueskyInfo] = useState(false);
  const [blueskyUsername, setBlueskyUsername] = useState("");
  const [blueskyPassword, setBlueskyPassword] = useState("");
  const [blueskyError, setBlueskyError] = useState("");
  const [isEditingBluesky, setIsEditingBluesky] = useState(false);
  const [showFacebookPagesModal, setShowFacebookPagesModal] = useState(false);
  const [showTikTokAccountsModal, setShowTikTokAccountsModal] = useState(false);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);

  // Multi-account state (NEW)
  const [connectedFacebookPages, setConnectedFacebookPages] = useState<ConnectedAccount[]>([]);
  const [connectedInstagramPages, setConnectedInstagramPages] = useState<ConnectedAccount[]>([]);
  const [selectedFacebookPageIds, setSelectedFacebookPageIds] = useState<string[]>([]);
  const [selectedInstagramPageIds, setSelectedInstagramPageIds] = useState<string[]>([]);
  const [connectedTikTokAccounts, setConnectedTikTokAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedTikTokAccountIds, setSelectedTikTokAccountIds] = useState<string[]>([]);
  const [connectedYouTubeChannels, setConnectedYouTubeChannels] = useState<ConnectedAccount[]>([]);
  const [selectedYouTubeChannelIds, setSelectedYouTubeChannelIds] = useState<string[]>([]);

  // Sync platforms with selected account IDs
  useEffect(() => {
    setSelectedPlatforms(prev => {
      const newPlatforms = [...prev];

      // Add or remove Facebook based on selectedFacebookPageIds
      const hasFacebookAccounts = selectedFacebookPageIds.length > 0;
      const hasFacebookInPlatforms = newPlatforms.includes('facebook');

      if (hasFacebookAccounts && !hasFacebookInPlatforms) {
        newPlatforms.push('facebook');
      } else if (!hasFacebookAccounts && hasFacebookInPlatforms) {
        const index = newPlatforms.indexOf('facebook');
        if (index > -1) newPlatforms.splice(index, 1);
      }

      // Add or remove Instagram based on selectedInstagramPageIds
      const hasInstagramAccounts = selectedInstagramPageIds.length > 0;
      const hasInstagramInPlatforms = newPlatforms.includes('instagram');

      if (hasInstagramAccounts && !hasInstagramInPlatforms) {
        newPlatforms.push('instagram');
      } else if (!hasInstagramAccounts && hasInstagramInPlatforms) {
        const index = newPlatforms.indexOf('instagram');
        if (index > -1) newPlatforms.splice(index, 1);
      }

      // Add or remove TikTok based on selectedTikTokAccountIds
      const hasTikTokAccounts = selectedTikTokAccountIds.length > 0;
      const hasTikTokInPlatforms = newPlatforms.includes('tiktok');

      if (hasTikTokAccounts && !hasTikTokInPlatforms) {
        newPlatforms.push('tiktok');
      } else if (!hasTikTokAccounts && hasTikTokInPlatforms) {
        const index = newPlatforms.indexOf('tiktok');
        if (index > -1) newPlatforms.splice(index, 1);
      }

      // Add or remove YouTube based on selectedYouTubeChannelIds
      const hasYouTubeChannels = selectedYouTubeChannelIds.length > 0;
      const hasYouTubeInPlatforms = newPlatforms.includes('youtube');

      if (hasYouTubeChannels && !hasYouTubeInPlatforms) {
        newPlatforms.push('youtube');
      } else if (!hasYouTubeChannels && hasYouTubeInPlatforms) {
        const index = newPlatforms.indexOf('youtube');
        if (index > -1) newPlatforms.splice(index, 1);
      }

      return newPlatforms;
    });
  }, [selectedFacebookPageIds, selectedInstagramPageIds, selectedTikTokAccountIds, selectedYouTubeChannelIds]);

  // Legacy state (for backward compatibility during transition)
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<FacebookPage | null>(null);

  // Facebook Business Manager State for Meta Compliance
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [facebookBusinesses, setFacebookBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string } | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Instagram State
  const [instagramData, setInstagramData] = useState<InstagramAuthData | null>(null);
  const [showInstagramPagesModal, setShowInstagramPagesModal] = useState(false);
  const [selectedInstagramPage, setSelectedInstagramPage] = useState<any>(null); // Legacy (for backward compatibility)

  // AI & Preview State
  const [tone, setTone] = useState("Professional");
  const [customTone, setCustomTone] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // AI Video Generation State
  const [videoSource, setVideoSource] = useState<'upload' | 'generate'>('upload');
  const [aiVideoTab, setAiVideoTab] = useState<'image' | 'text'>('image');
  const [aiSourceImage, setAiSourceImage] = useState<File | null>(null);
  const [aiSourceImagePreview, setAiSourceImagePreview] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDuration, setAiDuration] = useState<5 | 10>(5);
  const [isGeneratingAiVideo, setIsGeneratingAiVideo] = useState(false);
  const [aiGeneratedVideoUrl, setAiGeneratedVideoUrl] = useState<string | null>(null);
  const [showAiVideoPreviewModal, setShowAiVideoPreviewModal] = useState(false);
  const [aiJobStatus, setAiJobStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [aiJobError, setAiJobError] = useState<string | null>(null);

  // Text-to-Video specific state
  const [textToVideoPrompt, setTextToVideoPrompt] = useState('');
  const [textToVideoNegativePrompt, setTextToVideoNegativePrompt] = useState('');
  const [textToVideoDuration, setTextToVideoDuration] = useState<5 | 10>(5);

  const TONE_OPTIONS = [
    "Professional",
    "Friendly",
    "Bold",
    "Informative",
    "Humorous",
    "Custom"
  ];

  // ============================================
  // DRAFT MANAGEMENT
  // ============================================
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  // Function to get current form data for draft
  const getDraftData = useCallback(() => ({
    activeTab,
    caption,
    selectedPlatforms,
    aiEnhance,
    postMode,
    scheduledTime,
    tone,
    customTone,
    videoSource,
    aiVideoTab,
    aiPrompt,
    aiDuration,
    textToVideoPrompt,
    textToVideoNegativePrompt,
    textToVideoDuration
  }), [activeTab, caption, selectedPlatforms, aiEnhance, postMode, scheduledTime, tone, customTone, videoSource, aiVideoTab, aiPrompt, aiDuration, textToVideoPrompt, textToVideoNegativePrompt, textToVideoDuration]);

  // Function to restore form from draft data
  const setDraftData = useCallback((data: Record<string, any>) => {
    if (data.activeTab) setActiveTab(data.activeTab);
    if (data.caption) setCaption(data.caption);
    if (data.selectedPlatforms) setSelectedPlatforms(data.selectedPlatforms);
    if (data.aiEnhance !== undefined) setAiEnhance(data.aiEnhance);
    if (data.postMode) setPostMode(data.postMode);
    if (data.scheduledTime) setScheduledTime(data.scheduledTime);
    if (data.tone) setTone(data.tone);
    if (data.customTone) setCustomTone(data.customTone);
    if (data.videoSource) setVideoSource(data.videoSource);
    if (data.aiVideoTab) setAiVideoTab(data.aiVideoTab);
    if (data.aiPrompt) setAiPrompt(data.aiPrompt);
    if (data.aiDuration) setAiDuration(data.aiDuration);
    if (data.textToVideoPrompt) setTextToVideoPrompt(data.textToVideoPrompt);
    if (data.textToVideoNegativePrompt) setTextToVideoNegativePrompt(data.textToVideoNegativePrompt);
    if (data.textToVideoDuration) setTextToVideoDuration(data.textToVideoDuration);
  }, []);

  // Function to check if form has changes
  const hasChanges = useCallback(() => {
    return hasDraftContent(getDraftData());
  }, [getDraftData]);

  // Compute if there are unsaved changes (reactive)
  const hasUnsavedChanges = useMemo(() => {
    return hasDraftContent(getDraftData());
  }, [getDraftData]);

  // Initialize draft hook
  const { saveDraft, loadDraft, deleteDraft, draftExists, isLoaded: draftIsLoaded, draftTimestamp } = usePostDraft({
    toolType: 'social-automation' as ToolType,
    getDraftData,
    setDraftData,
    hasChanges
  });

  // Initialize unsaved changes warning hook
  const { showDialog, handleLeave, handleStay, handleSaveDraft, isSaving } = useUnsavedChangesWarning({
    hasUnsavedChanges,
    onSaveDraft: saveDraft
  });

  // Check for draft on mount
  useEffect(() => {
    if (draftIsLoaded && draftExists) {
      setShowRestoreDialog(true);
    }
  }, [draftIsLoaded, draftExists]);

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
      form.append("tone", tone === "Custom" ? customTone : tone);
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

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "AI enhancement request failed");
      }

      const responseText = await res.text();
      if (!responseText) {
        throw new Error("Empty response from enhancement service. Ensure n8n workflow 'Respond to Webhook' is configured.");
      }

      let rawData;
      try {
        rawData = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse AI response:", responseText);
        throw new Error("Invalid JSON response from AI service");
      }

      console.log("AI Preview Raw Response:", rawData);

      // n8n often returns an array, so we handle both cases
      const data = Array.isArray(rawData) ? rawData[0] : rawData;
      const isPreview = String(data.is_preview) === "true"; // Handles both boolean and string
      const enhancedCaption = data.enhanced_caption || data.caption;

      if (enhancedCaption && (data.status === "success" || isPreview)) {
        setPreviewText(enhancedCaption);
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

  // Load connected accounts on mount
  useEffect(() => {
    // Load Facebook accounts (new format with backward compatibility)
    const savedFacebookPages = localStorage.getItem('facebook_connected_pages');
    if (savedFacebookPages) {
      try {
        const pages = JSON.parse(savedFacebookPages);
        if (Array.isArray(pages)) {
          setConnectedFacebookPages(pages);
          // Default select all on load
          setSelectedFacebookPageIds(pages.map((p: ConnectedAccount) => p.id));
          // Also auto-select Facebook platform if accounts exist
          if (pages.length > 0) {
            setSelectedPlatforms(prev => [...new Set([...prev, 'facebook'])]);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved facebook pages", e);
      }
    } else {
      // Backward compatibility: check for old format
      const savedPage = localStorage.getItem('facebook_selected_page');
      if (savedPage) {
        try {
          const singlePage = JSON.parse(savedPage);
          const migratedPages: ConnectedAccount[] = [{
            id: singlePage.id,
            platform: 'facebook',
            name: singlePage.name,
            access_token: singlePage.access_token,
          }];
          setConnectedFacebookPages(migratedPages);
          setSelectedFacebookPageIds([singlePage.id]);
          setSelectedFacebookPage(singlePage);
          setSelectedPlatforms(prev => [...new Set([...prev, 'facebook'])]);
        } catch (e) {
          console.error("Failed to parse saved facebook page", e);
        }
      }
    }

    // Load Instagram accounts (new format with backward compatibility)
    const savedInstagramPages = localStorage.getItem('instagram_connected_pages');
    if (savedInstagramPages) {
      try {
        const pages = JSON.parse(savedInstagramPages);
        if (Array.isArray(pages)) {
          setConnectedInstagramPages(pages);
          // Default select all on load
          setSelectedInstagramPageIds(pages.map((p: ConnectedAccount) => p.id));
          // Also auto-select Instagram platform if accounts exist
          if (pages.length > 0) {
            setSelectedPlatforms(prev => [...new Set([...prev, 'instagram'])]);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved instagram pages", e);
      }
    } else {
      // Backward compatibility: check for old format
      const savedPage = localStorage.getItem('instagram_selected_page');
      if (savedPage) {
        try {
          const singlePage = JSON.parse(savedPage);
          const igAuthData = getInstagramAuthData();
          const migratedPages: ConnectedAccount[] = [{
            id: singlePage.instagram_business_account?.id || singlePage.id,
            platform: 'instagram',
            name: singlePage.name,
            access_token: igAuthData?.access_token || '',
            instagram_business_account_id: singlePage.instagram_business_account?.id,
          }];
          setConnectedInstagramPages(migratedPages);
          setSelectedInstagramPageIds([migratedPages[0].id]);
          setSelectedInstagramPage(singlePage);
        } catch (e) {
          console.error("Failed to parse saved instagram page", e);
        }
      }
    }

    // Load TikTok accounts (new format with backward compatibility)
    const savedTikTokAccounts = localStorage.getItem('tiktok_connected_accounts');
    if (savedTikTokAccounts) {
      try {
        const accounts = JSON.parse(savedTikTokAccounts);
        if (Array.isArray(accounts)) {
          const formattedAccounts: ConnectedAccount[] = accounts.map((a: any) => ({
            id: a.open_id || a.id,
            platform: 'tiktok',
            name: a.display_name || 'TikTok Account',
            access_token: a.access_token,
          }));
          setConnectedTikTokAccounts(formattedAccounts);
          // Default select all on load
          setSelectedTikTokAccountIds(formattedAccounts.map(a => a.id));
          if (formattedAccounts.length > 0) {
            setSelectedPlatforms(prev => [...new Set([...prev, 'tiktok'])]);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved tiktok accounts", e);
      }
    } else {
      // Backward compatibility
      const savedAuth = localStorage.getItem('tiktok_auth_data');
      if (savedAuth) {
        try {
          const auth = JSON.parse(savedAuth);
          const migrated: ConnectedAccount = {
            id: auth.open_id || 'legacy-tiktok',
            platform: 'tiktok',
            name: auth.display_name || 'TikTok Account',
            access_token: auth.access_token,
          };
          setConnectedTikTokAccounts([migrated]);
          setSelectedTikTokAccountIds([migrated.id]);
          setSelectedPlatforms(prev => [...new Set([...prev, 'tiktok'])]);
        } catch (e) {
          console.error("Failed to migrate legacy tiktok auth", e);
        }
      }
    }

    // Load YouTube channels
    const savedYouTubeChannels = localStorage.getItem('youtube_connected_accounts');
    if (savedYouTubeChannels) {
      try {
        const channels = JSON.parse(savedYouTubeChannels);
        if (Array.isArray(channels)) {
          const formatted = channels.map((c: any) => ({
            id: c.channel_id,
            platform: 'youtube' as const,
            name: c.channel_title,
            channel_thumbnail: c.channel_thumbnail,
            access_token: c.access_token
          }));

          setConnectedYouTubeChannels(formatted);
          setSelectedYouTubeChannelIds(formatted.map((c: any) => c.id));

          if (formatted.length > 0) {
            setSelectedPlatforms(prev => [...new Set([...prev, 'youtube'])]);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved youtube channels", e);
      }
    }

    if (isInstagramConnected()) {
      const data = getInstagramAuthData();
      setInstagramData(data);
    }
  }, []);

  // Auto-refresh accounts from localStorage when window is focused
  useEffect(() => {
    const refreshAccounts = () => {
      // Refresh TikTok
      const savedTikTokAccounts = localStorage.getItem('tiktok_connected_accounts');
      if (savedTikTokAccounts) {
        try {
          const accounts = JSON.parse(savedTikTokAccounts);
          if (Array.isArray(accounts)) {
            const formattedAccounts: ConnectedAccount[] = accounts.map((a: any) => ({
              id: a.open_id || a.id,
              platform: 'tiktok',
              name: a.display_name || 'TikTok Account',
              access_token: a.access_token,
            }));

            // Only update if changed to avoid unnecessary re-renders
            setConnectedTikTokAccounts(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(formattedAccounts)) {
                return formattedAccounts;
              }
              return prev;
            });
          }
        } catch (e) {
          console.error("Failed to refresh tiktok accounts", e);
        }
      }

      // Refresh Facebook
      const savedFacebookPages = localStorage.getItem('facebook_connected_pages');
      if (savedFacebookPages) {
        try {
          const pages = JSON.parse(savedFacebookPages);
          if (Array.isArray(pages)) {
            setConnectedFacebookPages(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(pages)) return pages;
              return prev;
            });
          }
        } catch (e) { }
      }

      // Refresh Instagram
      const savedInstagramPages = localStorage.getItem('instagram_connected_pages');
      if (savedInstagramPages) {
        try {
          const pages = JSON.parse(savedInstagramPages);
          if (Array.isArray(pages)) {
            setConnectedInstagramPages(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(pages)) return pages;
              return prev;
            });
          }
        } catch (e) { }
      }

      // Refresh YouTube
      const savedYouTubeChannels = localStorage.getItem('youtube_connected_accounts');
      if (savedYouTubeChannels) {
        try {
          const channels = JSON.parse(savedYouTubeChannels);
          if (Array.isArray(channels)) {
            const formatted = channels.map((c: any) => ({
              id: c.channel_id,
              platform: 'youtube' as const,
              name: c.channel_title,
              channel_thumbnail: c.channel_thumbnail,
              access_token: c.access_token
            }));

            setConnectedYouTubeChannels(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(formatted)) return formatted;
              return prev;
            });
          }
        } catch (e) { }
      }
    };

    window.addEventListener('focus', refreshAccounts);
    // Also listen for storage events from other tabs
    window.addEventListener('storage', refreshAccounts);
    return () => {
      window.removeEventListener('focus', refreshAccounts);
      window.removeEventListener('storage', refreshAccounts);
    };
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
      connect: initiateYouTubeAuth,
      disconnect: clearYouTubeAuthData,
      isConnected: isYouTubeConnected
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 images max
    const maxFiles = 10;
    const selectedFiles = files.slice(0, maxFiles);

    if (files.length > maxFiles) {
      toast.warning(`Only ${maxFiles} images can be uploaded at once. Using the first ${maxFiles}.`);
    }

    setImageFiles(prev => [...prev, ...selectedFiles].slice(0, maxFiles));

    // Generate previews for all selected files
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, String(reader.result)].slice(0, maxFiles));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFilesDropped = files.filter(f => f.type.startsWith('image/'));

    if (imageFilesDropped.length === 0) return;

    // Limit to 10 images max
    const maxFiles = 10;
    const selectedFiles = imageFilesDropped.slice(0, maxFiles);

    if (imageFilesDropped.length > maxFiles) {
      toast.warning(`Only ${maxFiles} images can be uploaded at once. Using the first ${maxFiles}.`);
    }

    setImageFiles(prev => [...prev, ...selectedFiles].slice(0, maxFiles));

    // Generate previews for all selected files
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, String(reader.result)].slice(0, maxFiles));
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove specific image from multi-upload
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Remove specific video from multi-upload
  const removeVideo = (index: number) => {
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Revoke object URLs to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showCompressionModal, setShowCompressionModal] = useState(false);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);

  // Post type options (NEW)
  const [imagePostTypes, setImagePostTypes] = useState({ feed: true, story: false });
  const [videoPostTypes, setVideoPostTypes] = useState({
    instagram: { feed: false, reel: false, story: false },
    facebook: { feed: false, reel: false, story: false }
  });

  const fetchFacebookAllPages = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=name,access_token,picture,business&access_token=${token}`
      );
      const data = await res.json();

      if (data.error) throw new Error(data.error.message);

      const allPages: FacebookPage[] = (data.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
        picture: p.picture?.data?.url,
        business: p.business, // Keep business info for filtering
      }));
      setFacebookPages(allPages);
    } catch (e: any) {
      console.error("Error fetching all Facebook pages:", e);
      toast.error("Failed to load Facebook pages: " + e.message);
    } finally {
      setLoading(false);
    }
  };

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
        await fetchFacebookAllPages(authData.access_token); // Fetch all pages directly
      }
    } catch (e: any) {
      console.error("Error fetching businesses", e);
      toast.error("Failed to load Business Managers: " + e.message);
      setShowFacebookPagesModal(true);
      const authData = getFacebookAuthData(); // Re-get authData here
      if (authData?.access_token) {
        await fetchFacebookAllPages(authData.access_token); // Fetch all pages directly
      }
    }
  };

  const handleBusinessSelect = async (business: { id: string; name: string }) => {
    setSelectedBusiness(business);
    const authData = getFacebookAuthData();
    if (!authData?.access_token) return;

    try {
      // Fetch ALL pages to ensure we have the full list
      await fetchFacebookAllPages(authData.access_token);

      setShowBusinessModal(false);
      setShowFacebookPagesModal(true);
    } catch (e: any) {
      console.error("Error fetching pages for business", e);
      toast.error("Failed to load Pages for Business: " + e.message);
      setShowFacebookPagesModal(true);
    }
  };

  // Maximum video file size: 50MB (server limit)
  const MAX_VIDEO_SIZE_MB = 50;

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;


    // Filter only video files
    const videoFilesSelected = files.filter(f => f.type.startsWith('video/'));

    if (videoFilesSelected.length === 0) {
      toast.error('Please upload valid video files');
      return;
    }

    // Check if Instagram is selected - only Instagram supports multi-video
    const isInstagramSelected = selectedPlatforms.includes('instagram');
    const maxVideos = isInstagramSelected ? 10 : 1;

    const selectedFiles = videoFilesSelected.slice(0, maxVideos);

    if (videoFilesSelected.length > maxVideos) {
      toast.warning(`Only ${isInstagramSelected ? '10 videos' : '1 video'} can be uploaded${isInstagramSelected ? '' : ' for non-Instagram platforms'}.`);
    }

    // For single video uploads (non-Instagram or single file), use existing flow
    if (selectedFiles.length === 1) {
      const f = selectedFiles[0];

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
    } else {
      // Multiple videos for Instagram carousel
      setVideoFiles(selectedFiles);
      setVideoPreviews(selectedFiles.map(f => URL.createObjectURL(f)));
      toast.success(`${selectedFiles.length} videos added for Instagram carousel`);
    }
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

      toast.info('Starting AI video generation... This may take 2-3 minutes.');

      const response = await fetch('https://n8n.smartcontentsolutions.co.uk/webhook/ai-video-generate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.job_id) {
        // Job started successfully, now poll for completion
        const jobId = result.job_id;
        toast.info('Job started! Processing in background...');
        setAiJobStatus('processing');

        // Poll Supabase for status update
        const checkStatus = async () => {
          const { data, error } = await supabase
            .from('ai_video_jobs')
            .select('*')
            .eq('higgsfield_job_id', jobId)
            .single();

          if (error) {
            console.error("Polling error:", error);
            return false; // Continue polling on transient errors
          }

          if (data.status === 'completed' && data.output_url) {
            console.log("✅ Video generation completed. URL:", data.output_url);
            setAiGeneratedVideoUrl(data.output_url);
            setAiJobStatus('completed');
            setShowAiVideoPreviewModal(true);
            toast.success('AI video generated successfully!');
            return true; // Stop polling
          }

          if (data.status === 'failed') {
            throw new Error(data.error_message || 'Video generation failed');
          }

          console.log("⏳ Polling status:", data.status);
          return false; // Continue polling
        };

        // Poll every 5 seconds up to 5 minutes
        const pollInterval = 5000;
        const maxAttempts = 60; // 5 minutes
        let attempts = 0;

        const pollTimer = setInterval(async () => {
          attempts++;
          try {
            const isFinished = await checkStatus();
            if (isFinished || attempts >= maxAttempts) {
              clearInterval(pollTimer);
              setIsGeneratingAiVideo(false);
              if (attempts >= maxAttempts) {
                toast.error('Timed out waiting for video. Check "Task History" later.');
                setAiJobStatus('failed'); // Technically unknown, but effectively failed for UI
              }
            }
          } catch (err: any) {
            clearInterval(pollTimer);
            setIsGeneratingAiVideo(false);
            setAiJobStatus('failed');
            setAiJobError(err.message);
            toast.error(`Failed: ${err.message}`);
          }
        }, pollInterval);

      } else {
        throw new Error(result.error || 'Failed to start video job');
      }
    } catch (error: any) {
      console.error('AI video generation error:', error);
      setAiJobStatus('failed');
      setAiJobError(error.message);
      toast.error(`Failed to generate video: ${error.message}`);
      setIsGeneratingAiVideo(false);
    }
  };

  const handleGenerateTextToVideo = async () => {
    if (!textToVideoPrompt.trim()) {
      toast.error('Please enter a motion description');
      return;
    }

    setIsGeneratingAiVideo(true);
    setAiJobStatus('pending');
    setAiJobError(null);

    try {
      toast.info('Starting AI video generation... This may take 2-3 minutes.');

      const response = await fetch('https://n8n.smartcontentsolutions.co.uk/webhook/ai-text-video-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user!.id,
          prompt: textToVideoPrompt,
          negative_prompt: textToVideoNegativePrompt,
          duration: textToVideoDuration,
          aspect_ratio: '9:16'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.job_id) {
        const jobId = result.job_id;
        toast.info('Job started! Processing in background...');
        setAiJobStatus('processing');

        // Poll Supabase for status update
        const checkStatus = async () => {
          const { data, error } = await supabase
            .from('ai_video_jobs')
            .select('*')
            .eq('higgsfield_job_id', jobId)
            .single();

          if (error) {
            console.error("Polling error:", error);
            return false;
          }

          if (data.status === 'completed' && data.output_url) {
            setAiGeneratedVideoUrl(data.output_url);
            setAiJobStatus('completed');
            setShowAiVideoPreviewModal(true);
            toast.success('AI video generated successfully!');
            return true;
          }

          if (data.status === 'failed') {
            throw new Error(data.error_message || 'Video generation failed');
          }

          return false;
        };

        const pollInterval = 5000;
        const maxAttempts = 60; // 5 minutes
        let attempts = 0;

        const pollTimer = setInterval(async () => {
          attempts++;
          try {
            const isFinished = await checkStatus();
            if (isFinished || attempts >= maxAttempts) {
              clearInterval(pollTimer);
              setIsGeneratingAiVideo(false);
              if (attempts >= maxAttempts) {
                toast.error('Timed out waiting for video. Check "Task History" later.');
                setAiJobStatus('failed');
              }
            }
          } catch (err: any) {
            clearInterval(pollTimer);
            setIsGeneratingAiVideo(false);
            setAiJobStatus('failed');
            setAiJobError(err.message);
            toast.error(`Failed: ${err.message}`);
          }
        }, pollInterval);

      } else {
        throw new Error(result.error || 'Failed to start video job');
      }
    } catch (error: any) {
      console.error('AI text-to-video generation error:', error);
      setAiJobStatus('failed');
      setAiJobError(error.message);
      toast.error(`Failed to generate video: ${error.message}`);
      setIsGeneratingAiVideo(false);
    }
  };


  const handleUseAiVideo = async () => {
    if (!aiGeneratedVideoUrl) return;

    try {
      console.log("⬇️ Downloading video from:", aiGeneratedVideoUrl);

      // Download the generated video and convert to File object
      const response = await fetch(aiGeneratedVideoUrl);

      if (!response.ok) {
        console.error("❌ Failed to fetch video:", response.status, response.statusText);
        throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log("📦 Video blob size:", blob.size);

      if (blob.size < 1000) {
        console.warn("⚠️ Warning: Video file is suspiciously small. It might be an error message.");
      }

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
      toast.error(`Failed to attach AI video: ${error.message}`);
    }
  };


  const sendToBackend = async () => {
    const form = new FormData();
    form.append("user_id", user!.id);
    form.append("caption", caption);
    selectedPlatforms
      .filter(p => p !== 'tiktok')
      .forEach((p) => form.append("platforms[]", p));
    form.append("post_mode", postMode);
    form.append("use_ai", aiEnhance ? "yes" : "no");
    if (aiEnhance) {
      form.append("tone", tone === "Custom" ? customTone : tone);
    }
    // Explicitly for image flow
    form.append("type", "image");

    // Add is_story flag for Instagram/Facebook
    if (imagePostTypes.feed && imagePostTypes.story) {
      form.append("post_to_both_feed_and_story", "true");
    } else if (imagePostTypes.story) {
      form.append("is_story", "true");
    } else {
      form.append("is_story", "false");
    }

    // Add specific page_ids for multi-account posting (NEW)
    if (selectedPlatforms.includes('facebook') && selectedFacebookPageIds.length > 0) {
      selectedFacebookPageIds.forEach((id) => form.append("facebook_page_ids[]", id));
    }
    if (selectedPlatforms.includes('instagram') && selectedInstagramPageIds.length > 0) {
      selectedInstagramPageIds.forEach((id) => form.append("instagram_page_ids[]", id));
    }


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

    // Handle multiple images (NEW multi-upload support)
    if (imageFiles.length > 0) {
      imageFiles.forEach((file, i) => form.append(`media[${i}]`, file));
    } else if (imageFile) {
      // Legacy single image support
      form.append("image", imageFile);
    }

    // Log all form data being sent
    console.log("=== FORM DATA BEING SENT ===");
    for (let [key, value] of form.entries()) {
      console.log(`${key}:`, value);
    }
    console.log("============================");

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
      form.append("tone", tone === "Custom" ? customTone : tone);
    }
    form.append("type", "video");

    // Add video post types for Instagram and Facebook
    form.append('instagram_post_types', JSON.stringify(videoPostTypes.instagram));
    form.append('facebook_post_types', JSON.stringify(videoPostTypes.facebook));

    // Add specific page_ids for multi-account posting (NEW)
    if (selectedPlatforms.includes('facebook') && selectedFacebookPageIds.length > 0) {
      selectedFacebookPageIds.forEach((id) => form.append("facebook_page_ids[]", id));
    }
    if (selectedPlatforms.includes('instagram') && selectedInstagramPageIds.length > 0) {
      selectedInstagramPageIds.forEach((id) => form.append("instagram_page_ids[]", id));
    }
    if (selectedPlatforms.includes('tiktok') && selectedTikTokAccountIds.length > 0) {
      selectedTikTokAccountIds.forEach((id) => form.append("tiktok_account_ids[]", id));
    }
    if (selectedPlatforms.includes('youtube') && selectedYouTubeChannelIds.length > 0) {
      selectedYouTubeChannelIds.forEach((id) => form.append("youtube_channel_ids[]", id));
    }

    if (postMode === "schedule") {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      form.append("scheduled_time", scheduledTime);
      form.append("user_timezone", userTimezone);
    }

    // Handle multiple videos (NEW multi-upload support for Instagram carousel)
    if (videoFiles.length > 0) {
      videoFiles.forEach((file, i) => form.append(`video[${i}]`, file));
    } else if (videoFile) {
      // Legacy single video support
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
        // If it's a network error/timeout, it often means the server received the data but the connection dropped.
        // As per user request, we treat this as a likely success.
        // toast.info("Your automated post should be visible within a minute.");
        return; // Proceed as success
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

    // Validate that Facebook/Instagram accounts are selected if those platforms are chosen
    if (selectedPlatforms.includes('facebook') && selectedFacebookPageIds.length === 0) {
      return setErrorMsg("Please select at least one Facebook page to post to.");
    }
    if (selectedPlatforms.includes('instagram') && selectedInstagramPageIds.length === 0) {
      return setErrorMsg("Please select at least one Instagram account to post to.");
    }
    if (selectedPlatforms.includes('tiktok') && selectedTikTokAccountIds.length === 0) {
      return setErrorMsg("Please select at least one TikTok account to post to.");
    }
    if (selectedPlatforms.includes('youtube') && selectedYouTubeChannelIds.length === 0) {
      return setErrorMsg("Please select at least one YouTube channel to post to.");
    }


    // Validate that a post type is selected if in Video mode
    if (activeTab === 'video') {
      if (selectedPlatforms.includes('instagram')) {
        const hasInstaType = Object.values(videoPostTypes.instagram).some(v => v);
        if (!hasInstaType) {
          return setErrorMsg("Please select at least one Instagram post type (Feed, Reel, or Story).");
        }
      }
      if (selectedPlatforms.includes('facebook')) {
        const hasFbType = Object.values(videoPostTypes.facebook).some(v => v);
        if (!hasFbType) {
          return setErrorMsg("Please select at least one Facebook post type (Feed).");
        }
      }
    }

    // Validate that a post type is selected if in Image mode
    if (activeTab === 'create' && (selectedPlatforms.includes('facebook') || selectedPlatforms.includes('instagram'))) {
      if (!imagePostTypes.feed && !imagePostTypes.story) {
        return setErrorMsg("Please select at least one post type (Feed or Story) for Facebook/Instagram.");
      }
    }

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

      // Clear legacy single-file states
      setImageFile(null);
      setImagePreview(null);
      setVideoFile(null);
      setVideoPreview(null);

      // Clear multi-file states (NEW)
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFiles([]);
      setVideoPreviews([]);

      // Reset post type options
      setImagePostTypes({ feed: true, story: false });
      setVideoPostTypes({
        instagram: { feed: false, reel: false, story: false },
        facebook: { feed: false, reel: false, story: false }
      });

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
                    onClick={async () => {
                      setShowBusinessModal(false);
                      setShowFacebookPagesModal(true);
                      setSelectedBusiness(null); // Clear business selection for personal pages
                      const authData = getFacebookAuthData();
                      if (authData?.access_token) await fetchFacebookAllPages(authData.access_token);
                    }}
                    className="mt-4 text-[#E1C37A] text-sm hover:underline"
                  >
                    Continue to Pages anyway
                  </button>
                </div>
              ) : (
                <>
                  {facebookBusinesses.map(business => (
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
                  ))}

                  {/* Show Personal Pages Option */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-sm text-[#5B5C60] mb-3">
                        Want to connect personal pages instead?
                      </p>
                      <button
                        onClick={async () => {
                          setShowBusinessModal(false);
                          setShowFacebookPagesModal(true);
                          setSelectedBusiness(null); // Clear business selection for personal pages
                          const authData = getFacebookAuthData();
                          if (authData?.access_token) await fetchFacebookAllPages(authData.access_token);
                        }}
                        className="px-4 py-2 rounded-lg border border-[#E1C37A]/30 text-[#E1C37A] hover:bg-[#E1C37A]/10 transition-colors text-sm"
                      >
                        Show Personal Pages
                      </button>
                    </div>
                  </div>
                </>
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
              {facebookPages.filter(page => {
                if (selectedBusiness) return page.business?.id === selectedBusiness.id;
                return !page.business; // Personal pages have no business object
              }).length === 0 ? (
                <div className="text-center py-8 text-[#5B5C60]">
                  <p>No {selectedBusiness ? 'business portfolio' : 'personal'} pages found for this user.</p>
                  <p className="text-xs mt-2">Make sure you granted the correct permissions.</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      const visiblePages = facebookPages.filter(page => {
                        if (selectedBusiness) return page.business?.id === selectedBusiness.id;
                        return !page.business;
                      });
                      const authData = getFacebookAuthData();

                      setConnectedFacebookPages(prev => {
                        const updated = [...prev];
                        visiblePages.forEach(p => {
                          if (!updated.some(acc => acc.id === p.id)) {
                            updated.push({
                              id: p.id,
                              platform: 'facebook',
                              name: p.name,
                              access_token: p.access_token || authData?.access_token || '',
                            });
                          }
                        });
                        localStorage.setItem("facebook_connected_pages", JSON.stringify(updated));
                        return updated;
                      });

                      setSelectedFacebookPageIds(prev => {
                        const next = [...prev];
                        visiblePages.forEach(p => {
                          if (!next.includes(p.id)) next.push(p.id);
                        });
                        return next;
                      });

                      setShowFacebookPagesModal(false);
                      toast.success(`Connected ${visiblePages.length} pages`);
                    }}
                    className="w-full mb-4 py-3 px-4 rounded-xl bg-[#E1C37A]/10 border border-[#E1C37A]/30 text-[#E1C37A] font-semibold hover:bg-[#E1C37A]/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Connect All Visible Pages ({facebookPages.filter(page => selectedBusiness ? page.business?.id === selectedBusiness.id : !page.business).length})
                  </button>

                  {facebookPages
                    .filter(page => {
                      if (selectedBusiness) return page.business?.id === selectedBusiness.id;
                      return !page.business;
                    })
                    .map(page => (
                      <button
                        key={page.id}
                        onClick={() => {
                          const authData = getFacebookAuthData();
                          const newAccount: ConnectedAccount = {
                            id: page.id,
                            platform: 'facebook',
                            name: page.name,
                            access_token: page.access_token || authData?.access_token || '',
                          };

                          setConnectedFacebookPages(prev => {
                            const exists = prev.some(acc => acc.id === newAccount.id);
                            if (exists) return prev;
                            const updated = [...prev, newAccount];
                            localStorage.setItem("facebook_connected_pages", JSON.stringify(updated));
                            return updated;
                          });

                          setSelectedFacebookPageIds(prev => [...new Set([...prev, newAccount.id])]);
                          setSelectedFacebookPage(page); // Keep for legacy compatibility
                          setShowFacebookPagesModal(false);
                          toast.success(`Connected ${page.name}`);
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
                    ))}
                </>
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
                      const newAccount: ConnectedAccount = {
                        id: instagramData?.instagram_user_id || "demo-page",
                        platform: "instagram",
                        name: instagramData?.username || "hsuswiowkskow",
                        access_token: instagramData?.access_token || "",
                      };

                      // Add to connected accounts
                      setConnectedInstagramPages(prev => {
                        const exists = prev.some(acc => acc.id === newAccount.id);
                        if (exists) return prev;
                        const updated = [...prev, newAccount];
                        localStorage.setItem("instagram_connected_pages", JSON.stringify(updated));
                        return updated;
                      });

                      // Select it
                      setSelectedInstagramPageIds(prev => [...prev, newAccount.id]);
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
                <>
                  {instagramData.pages && instagramData.pages.length > 0 && (
                    <button
                      onClick={() => {
                        setConnectedInstagramPages(prev => {
                          const updated = [...prev];
                          instagramData.pages.forEach((page: any) => {
                            const id = page.instagram_business_account?.id || page.id;
                            if (!updated.some(acc => acc.id === id)) {
                              updated.push({
                                id: id,
                                platform: "instagram",
                                name: page.name || instagramData?.username || "Instagram Account",
                                access_token: instagramData?.access_token || "",
                                instagram_business_account_id: page.instagram_business_account?.id,
                              });
                            }
                          });
                          localStorage.setItem("instagram_connected_pages", JSON.stringify(updated));
                          return updated;
                        });

                        setSelectedInstagramPageIds(prev => {
                          const next = [...prev];
                          instagramData.pages.forEach((p: any) => {
                            const id = p.instagram_business_account?.id || p.id;
                            if (!next.includes(id)) next.push(id);
                          });
                          return next;
                        });

                        setShowInstagramPagesModal(false);
                        toast.success(`Connected ${instagramData.pages.length} Instagram accounts`);
                      }}
                      className="w-full mb-4 py-3 px-4 rounded-xl bg-[#E4405F]/10 border border-[#E4405F]/30 text-[#E4405F] font-semibold hover:bg-[#E4405F]/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Instagram className="w-5 h-5" />
                      Connect All Instagram Accounts ({instagramData.pages.length})
                    </button>
                  )}

                  {instagramData.pages.map((page: any) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        const newAccount: ConnectedAccount = {
                          id: page.instagram_business_account?.id || page.id,
                          platform: "instagram",
                          name: page.name || instagramData?.username || "Instagram Account",
                          access_token: instagramData?.access_token || "",
                          instagram_business_account_id: page.instagram_business_account?.id,
                        };

                        // Add to connected accounts
                        setConnectedInstagramPages(prev => {
                          const exists = prev.some(acc => acc.id === newAccount.id);
                          if (exists) return prev;
                          const updated = [...prev, newAccount];
                          localStorage.setItem("instagram_connected_pages", JSON.stringify(updated));
                          return updated;
                        });

                        // Select it
                        setSelectedInstagramPageIds(prev => [...prev, newAccount.id]);
                        setSelectedInstagramPage(page);
                        setShowInstagramPagesModal(false);
                        toast.success("Instagram account selected");
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
                  ))}
                </>
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

      {/* TikTok Accounts Modal */}
      {showTikTokAccountsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3B3C3E] rounded-2xl p-8 max-w-lg w-full border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center">
                  <Music className="w-6 h-6 text-[#E1C37A]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#D6D7D8]">Manage TikTok Accounts</h2>
                  <p className="text-xs text-[#A9AAAC]">Remove accounts or connect more</p>
                </div>
              </div>
              <button
                onClick={() => setShowTikTokAccountsModal(false)}
                className="w-8 h-8 rounded-lg bg-[#3B3C3E] hover:bg-[#4B4C4E] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#A9AAAC]" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {connectedTikTokAccounts.length === 0 ? (
                <div className="text-center py-8 text-[#5B5C60]">
                  <p>No TikTok accounts connected.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#5B5C60] uppercase tracking-wider">Connected Accounts</p>
                    <span className="text-[10px] bg-[#E1C37A]/10 text-[#E1C37A] px-2 py-0.5 rounded-full">
                      {connectedTikTokAccounts.length} Connected
                    </span>
                  </div>
                  {connectedTikTokAccounts.map(account => (
                    <div
                      key={account.id}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-[#2C2C2E] border border-white/5 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-[#E1C37A] font-bold border border-white/5">
                          {account.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[#D6D7D8] font-semibold">{account.name}</p>
                          <p className="text-xs text-[#5B5C60] font-mono">ID: {account.id.substring(0, 12)}...</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to disconnect ${account.name}?`)) {
                            removeTikTokAccount(account.id);
                            const updated = connectedTikTokAccounts.filter(a => a.id !== account.id);
                            setConnectedTikTokAccounts(updated);
                            setSelectedTikTokAccountIds(prev => prev.filter(id => id !== account.id));
                            if (updated.length === 0) {
                              setSelectedPlatforms(prev => prev.filter(p => p !== 'tiktok'));
                            }
                            toast.success(`${account.name} disconnected`);
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-[#5B5C60] hover:text-red-400 transition-colors"
                        title="Disconnect this account"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </>
              )}

              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    initiateTikTokAuth();
                    toast.info("Opening TikTok login...");
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#E1C37A] to-[#B6934C] text-[#1A1A1C] font-bold hover:shadow-[0_0_20px_rgba(225,195,122,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <LinkIcon className="w-5 h-5" />
                  Connect Another TikTok Account
                </button>
                <p className="text-[10px] text-center text-[#5B5C60] mt-4 italic">
                  Note: You may need to log out of TikTok in the popup if you want to connect a different account.
                </p>
              </div>
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
                {activeTab === 'video' && ' Your automated post should be visible within a minute.'}
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
          <div ref={errorRef} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
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

                  {ALL_PLATFORMS.filter(p => p.id !== 'youtube' && p.id !== 'tiktok').map((p) => {
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
                                ? `Connected as @${instagramData?.username || 'User'}`
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
                  {ALL_PLATFORMS.filter(p => ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x'].includes(p.id)).map((p) => {
                    const connected = p.isConnected();
                    const Icon = p.icon;
                    const color = platformColors[p.id] || '#E1C37A';

                    // Rename for video context
                    let displayName = p.name;
                    if (p.id === 'facebook') displayName = 'Facebook Reels';
                    if (p.id === 'instagram') displayName = 'Instagram Reels';
                    if (p.id === 'youtube') displayName = 'Youtube Shorts';
                    if (p.id === 'x') displayName = 'Twitter Video';

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

                        <h3 className="text-[#D6D7D8] font-semibold text-lg mb-1">{displayName}</h3>
                        <p className="text-[#5B5C60] text-sm mb-4">
                          {connected
                            ? (p.id === 'facebook' && selectedFacebookPage
                              ? `Page: ${selectedFacebookPage.name}`
                              : p.id === 'instagram'
                                ? `Connected as @${instagramData?.username || 'User'}`
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
                            ) : connected && p.id === 'tiktok' ? (
                              <>
                                <button
                                  onClick={() => setShowTikTokAccountsModal(true)}
                                  className="w-full py-2 px-4 rounded-full text-xs font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-[#E1C37A]/10 border border-[#E1C37A]/30 text-[#E1C37A] hover:bg-[#E1C37A]/20"
                                >
                                  <Users className="w-4 h-4" />
                                  Manage Accounts
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Disconnect TikTok?")) {
                                      p.disconnect?.();
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
              {/* Connected Accounts Selector (NEW) */}
              <ConnectedAccountsSelector
                accounts={[...connectedFacebookPages, ...connectedInstagramPages]}
                selectedIds={[...selectedFacebookPageIds, ...selectedInstagramPageIds]}
                onToggle={(id, platform) => {
                  // Toggle Facebook
                  if (platform === 'facebook') {
                    const isCurrentlySelected = selectedFacebookPageIds.includes(id);
                    const newSelectedIds = isCurrentlySelected
                      ? selectedFacebookPageIds.filter(pid => pid !== id)
                      : [...selectedFacebookPageIds, id];

                    setSelectedFacebookPageIds(newSelectedIds);

                    // Update platform selection based on whether any accounts remain selected
                    if (newSelectedIds.length === 0) {
                      // Remove facebook from platforms if no accounts selected
                      setSelectedPlatforms(prev => prev.filter(p => p !== 'facebook'));
                    } else if (!selectedPlatforms.includes('facebook')) {
                      // Add facebook to platforms if at least one account selected
                      setSelectedPlatforms(prev => [...prev, 'facebook']);
                    }
                  }
                  // Toggle Instagram
                  if (platform === 'instagram') {
                    const isCurrentlySelected = selectedInstagramPageIds.includes(id);
                    const newSelectedIds = isCurrentlySelected
                      ? selectedInstagramPageIds.filter(pid => pid !== id)
                      : [...selectedInstagramPageIds, id];

                    setSelectedInstagramPageIds(newSelectedIds);

                    // Update platform selection based on whether any accounts remain selected
                    if (newSelectedIds.length === 0) {
                      // Remove instagram from platforms if no accounts selected
                      setSelectedPlatforms(prev => prev.filter(p => p !== 'instagram'));
                    } else if (!selectedPlatforms.includes('instagram')) {
                      // Add instagram to platforms if at least one account selected
                      setSelectedPlatforms(prev => [...prev, 'instagram']);
                    }
                  }

                }}
                onSelectAll={() => {
                  setSelectedFacebookPageIds(connectedFacebookPages.map(p => p.id));
                  setSelectedInstagramPageIds(connectedInstagramPages.map(p => p.id));
                  // Auto-select platforms
                  const platforms = new Set(selectedPlatforms);
                  if (connectedFacebookPages.length > 0) platforms.add('facebook');
                  if (connectedInstagramPages.length > 0) platforms.add('instagram');
                  setSelectedPlatforms(Array.from(platforms));
                }}
                onDeselectAll={() => {
                  setSelectedFacebookPageIds([]);
                  setSelectedInstagramPageIds([]);
                }}
              />

              {/* Legacy Platform Selection - show for non-Facebook/Instagram platforms */}
              <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
                <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">
                  Other Platforms
                  <span className="text-[#5B5C60] font-normal ml-2">({selectedPlatforms.filter(p => !['facebook', 'instagram'].includes(p)).length} selected)</span>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {ALL_PLATFORMS.filter(p =>
                    p.isConnected() &&
                    p.id !== 'youtube' &&
                    p.id !== 'tiktok' &&
                    p.id !== 'facebook' &&
                    p.id !== 'instagram'
                  ).map((p) => {
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
                          {p.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
                <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">
                  Media <span className="text-[#5B5C60] font-normal">({imageFiles.length > 0 ? `${imageFiles.length} images` : imagePreview ? '1 image' : 'optional'})</span>
                </h3>

                {/* Multi-image preview grid */}
                {imagePreviews.length > 0 ? (
                  <div className="relative">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            className="w-full h-24 object-cover rounded-lg bg-black/20"
                            alt={`Preview ${index + 1}`}
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1.5 rounded">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                      {/* Add more button */}
                      {imagePreviews.length < 10 && (
                        <button
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="w-full h-24 rounded-lg border-2 border-dashed border-[#5B5C60]/50 hover:border-[#E1C37A]/50 flex items-center justify-center transition-colors"
                        >
                          <ImageIcon className="w-6 h-6 text-[#5B5C60]" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setImageFiles([]);
                        setImagePreviews([]);
                      }}
                      className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear all images
                    </button>

                    {/* Multi-image Platform Info Dialog */}
                    <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-400 mb-1">Multi-Image Posting Information</p>
                          <p className="text-xs text-blue-300/80 mb-2">
                            Multi-image posting is only supported on <b>Instagram</b>, <b>LinkedIn</b>, and <b>Facebook</b>.
                          </p>
                          <ul className="space-y-1 text-xs text-blue-300/70">
                            <li className="flex items-center gap-2">
                              <Instagram className="w-3 h-3 text-pink-500" />
                              <span>Instagram: Will be posted as a carousel</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Linkedin className="w-3 h-3 text-blue-500" />
                              <span>LinkedIn: Supports multiple images</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Facebook className="w-3 h-3 text-[#1877F2]" />
                              <span>Facebook: Supports multiple images</span>
                            </li>
                          </ul>
                          {selectedPlatforms.includes('bluesky') && (
                            <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                              <p className="text-xs text-red-400 flex items-center gap-2">
                                <Cloud className="w-3 h-3" />
                                <b>Bluesky does not support multi-image posting.</b> Only the first image will be posted.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : imagePreview ? (
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
                    <p className="text-[#D6D7D8] font-medium mb-2">Drop your images here</p>
                    <p className="text-[#5B5C60] text-sm">or click to browse (up to 10 images)</p>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </div>

              {/* Image Post Type Selection - Only show if Instagram or Facebook is selected */}
              {(selectedPlatforms.includes('instagram') || selectedPlatforms.includes('facebook')) && (
                <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E1C37A] to-[#B6934C] flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-[#1A1A1C]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#D6D7D8]">Image Post Type</h3>
                      <p className="text-xs text-[#A9AAAC]">Choose where to publish your image</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${imagePostTypes.feed
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}>
                      <input
                        type="checkbox"
                        checked={imagePostTypes.feed}
                        onChange={(e) => setImagePostTypes(prev => ({ ...prev, feed: e.target.checked }))}
                        className="w-4 h-4 accent-[#E1C37A]"
                      />
                      <div>
                        <p className={`text-sm font-medium ${imagePostTypes.feed ? 'text-[#E1C37A]' : 'text-[#D6D7D8]'}`}>Feed</p>
                        <p className="text-xs text-[#5B5C60]">Main wall posts</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${imagePostTypes.story
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}>
                      <input
                        type="checkbox"
                        checked={imagePostTypes.story}
                        onChange={(e) => setImagePostTypes(prev => ({ ...prev, story: e.target.checked }))}
                        className="w-4 h-4 accent-[#E1C37A]"
                      />
                      <div>
                        <p className={`text-sm font-medium ${imagePostTypes.story ? 'text-[#E1C37A]' : 'text-[#D6D7D8]'}`}>Story</p>
                        <p className="text-xs text-[#5B5C60]">24hr stories</p>
                      </div>
                    </label>
                  </div>

                  {imagePostTypes.story && (
                    <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-400">
                        {imagePostTypes.feed ? 'Your image will be posted to both Feed and Story.' : 'Your image will be posted to Story only.'}
                        {imageFiles.length > 1 ? ` ${imageFiles.length} images will be posted as separate story slides.` : ''}
                      </p>
                      <p className="text-xs text-yellow-400 mt-2 font-medium">
                        ⚠️ Note: Stories will be posted to Facebook and Instagram but without captions due to platform limitations.
                      </p>
                    </div>
                  )}
                </div>
              )}

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

                    <AnimatePresence>
                      {tone === 'Custom' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <input
                            placeholder="Describe your custom tone..."
                            className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-4 py-3 text-[#D6D7D8] focus:outline-none focus:border-[#E1C37A]/50 mt-2 text-sm placeholder:text-[#5B5C60]"
                            value={customTone}
                            onChange={(e) => setCustomTone(e.target.value)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                    setImageFiles([]);
                    setImagePreviews([]);
                    setImagePostTypes({ feed: true, story: false });
                    setSelectedPlatforms([]);
                    setSelectedFacebookPageIds([]);
                    setSelectedInstagramPageIds([]);
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
              {/* Connected Accounts Selector (NEW) */}
              <ConnectedAccountsSelector
                accounts={[...connectedFacebookPages, ...connectedInstagramPages, ...connectedTikTokAccounts, ...connectedYouTubeChannels]}
                selectedIds={[...selectedFacebookPageIds, ...selectedInstagramPageIds, ...selectedTikTokAccountIds, ...selectedYouTubeChannelIds]}
                onToggle={(id, platform) => {
                  // Toggle Facebook
                  if (platform === 'facebook') {
                    const isCurrentlySelected = selectedFacebookPageIds.includes(id);
                    const newSelectedIds = isCurrentlySelected
                      ? selectedFacebookPageIds.filter(pid => pid !== id)
                      : [...selectedFacebookPageIds, id];

                    setSelectedFacebookPageIds(newSelectedIds);

                    // Update platform selection based on whether any accounts remain selected
                    if (newSelectedIds.length === 0) {
                      // Remove facebook from platforms if no accounts selected
                      setSelectedPlatforms(prev => prev.filter(p => p !== 'facebook'));
                    } else if (!selectedPlatforms.includes('facebook')) {
                      // Add facebook to platforms if at least one account selected
                      setSelectedPlatforms(prev => [...prev, 'facebook']);
                    }
                  }
                  // Toggle Instagram
                  if (platform === 'instagram') {
                    const isCurrentlySelected = selectedInstagramPageIds.includes(id);
                    const newSelectedIds = isCurrentlySelected
                      ? selectedInstagramPageIds.filter(pid => pid !== id)
                      : [...selectedInstagramPageIds, id];

                    setSelectedInstagramPageIds(newSelectedIds);

                    // Update platform selection based on whether any accounts remain selected
                    if (newSelectedIds.length === 0) {
                      // Remove instagram from platforms if no accounts selected
                      setSelectedPlatforms(prev => prev.filter(p => p !== 'instagram'));
                    } else if (!selectedPlatforms.includes('instagram')) {
                      // Add instagram to platforms if at least one account selected
                      setSelectedPlatforms(prev => [...prev, 'instagram']);
                    }
                  }
                  // Toggle TikTok
                  if (platform === 'tiktok') {
                    const isCurrentlySelected = selectedTikTokAccountIds.includes(id);
                    const newSelectedIds = isCurrentlySelected
                      ? selectedTikTokAccountIds.filter(pid => pid !== id)
                      : [...selectedTikTokAccountIds, id];

                    setSelectedTikTokAccountIds(newSelectedIds);

                    // Update platform selection
                    if (newSelectedIds.length === 0) {
                      setSelectedPlatforms(prev => prev.filter(p => p !== 'tiktok'));
                    } else if (!selectedPlatforms.includes('tiktok')) {
                      setSelectedPlatforms(prev => [...prev, 'tiktok']);
                    }
                  }
                  // Toggle YouTube
                  if (platform === 'youtube') {
                    const isCurrentlySelected = selectedYouTubeChannelIds.includes(id);
                    const newSelectedIds = isCurrentlySelected
                      ? selectedYouTubeChannelIds.filter(pid => pid !== id)
                      : [...selectedYouTubeChannelIds, id];

                    setSelectedYouTubeChannelIds(newSelectedIds);

                    // Update platform selection
                    if (newSelectedIds.length === 0) {
                      setSelectedPlatforms(prev => prev.filter(p => p !== 'youtube'));
                    } else if (!selectedPlatforms.includes('youtube')) {
                      setSelectedPlatforms(prev => [...prev, 'youtube']);
                    }
                  }
                }}
                onSelectAll={() => {
                  setSelectedFacebookPageIds(connectedFacebookPages.map(p => p.id));
                  setSelectedInstagramPageIds(connectedInstagramPages.map(p => p.id));
                  setSelectedTikTokAccountIds(connectedTikTokAccounts.map(p => p.id));
                  setSelectedYouTubeChannelIds(connectedYouTubeChannels.map(p => p.id));
                  // Auto-select platforms
                  const platforms = new Set(selectedPlatforms);
                  if (connectedFacebookPages.length > 0) platforms.add('facebook');
                  if (connectedInstagramPages.length > 0) platforms.add('instagram');
                  if (connectedTikTokAccounts.length > 0) platforms.add('tiktok');
                  if (connectedYouTubeChannels.length > 0) platforms.add('youtube');
                  setSelectedPlatforms(Array.from(platforms));
                }}
                onDeselectAll={() => {
                  setSelectedFacebookPageIds([]);
                  setSelectedInstagramPageIds([]);
                  setSelectedTikTokAccountIds([]);
                  setSelectedYouTubeChannelIds([]);
                }}
              />

              {/* Legacy Platform Selection - show for non-Facebook/Instagram platforms */}
              <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
                <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">
                  Other Platforms
                  <span className="text-[#5B5C60] font-normal ml-2">({selectedPlatforms.filter(p => !['facebook', 'instagram'].includes(p)).length} selected)</span>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {ALL_PLATFORMS.filter(p =>
                    p.isConnected() &&
                    ['linkedin', 'x'].includes(p.id)
                  ).map((p) => {
                    const selected = isSelected(p.id);
                    const Icon = p.icon;
                    const color = platformColors[p.id];

                    // Rename for video context
                    let displayName = p.name;
                    if (p.id === 'youtube') displayName = 'YouTube Shorts';
                    if (p.id === 'x') displayName = 'X Video';

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
                          {displayName}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

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

                        <p className="text-xs text-[#5B5C60]">Powered by PyAPI Kling AI</p>

                      </div>

                    </button>

                  </div>

                </div>



                {/* Upload Video Mode */}

                {videoSource === 'upload' && (

                  <>

                    <h3 className="text-sm font-semibold text-[#D6D7D8] mb-4">

                      Media <span className="text-[#5B5C60] font-normal">({videoFiles.length > 0 ? `${videoFiles.length} videos` : videoPreview ? '1 video' : 'optional'})</span>

                    </h3>

                    {/* Multi-video preview grid */}

                    {videoPreviews.length > 0 ? (

                      <div className="relative">

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">

                          {videoPreviews.map((preview, index) => (

                            <div key={index} className="relative group">

                              <video

                                src={preview}

                                className="w-full h-32 object-cover rounded-lg bg-black/20"

                              />

                              <button

                                onClick={() => removeVideo(index)}

                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"

                              >

                                <X className="w-3 h-3" />

                              </button>

                              <span className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1.5 rounded">

                                {index + 1}

                              </span>

                            </div>

                          ))}

                          {/* Add more button - Only for Instagram */}

                          {videoPreviews.length < 10 && selectedPlatforms.includes('instagram') && (

                            <button

                              onClick={() => document.getElementById('file-upload-video')?.click()}

                              className="w-full h-32 rounded-lg border-2 border-dashed border-[#5B5C60]/50 hover:border-[#E1C37A]/50 flex items-center justify-center transition-colors"

                            >

                              <Video className="w-6 h-6 text-[#5B5C60]" />

                            </button>

                          )}

                        </div>

                        <button

                          onClick={() => {

                            setVideoFiles([]);

                            videoPreviews.forEach(url => URL.revokeObjectURL(url));

                            setVideoPreviews([]);

                          }}

                          className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"

                        >

                          <X className="w-4 h-4" />

                          Clear all videos

                        </button>

                        {/* Multi-video Platform Info Dialog */}

                        <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">

                          <div className="flex items-start gap-3">

                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">

                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                                <circle cx="12" cy="12" r="10" />

                                <path d="M12 16v-4" />

                                <path d="M12 8h.01" />

                              </svg>

                            </div>

                            <div className="flex-1">

                              <p className="text-sm font-medium text-blue-400 mb-1">Multi-Video Posting Information</p>

                              <p className="text-xs text-blue-300/80 mb-2">

                                Multi-video posting is only supported on <b>Instagram</b>. Other platforms will receive only the first video.

                              </p>

                              <ul className="space-y-1 text-xs text-blue-300/70">

                                <li className="flex items-center gap-2">

                                  <Instagram className="w-3 h-3 text-pink-500" />

                                  <span>Instagram: Will be posted as a carousel with {videoFiles.length} videos</span>

                                </li>

                                <li className="flex items-center gap-2 text-[#5B5C60]">

                                  <Facebook className="w-3 h-3 text-[#1877F2]" />

                                  <span>Facebook: Only first video will be posted</span>

                                </li>

                                <li className="flex items-center gap-2 text-[#5B5C60]">

                                  <Linkedin className="w-3 h-3 text-blue-500" />

                                  <span>LinkedIn: Only first video will be posted</span>

                                </li>

                                <li className="flex items-center gap-2 text-[#5B5C60]">

                                  <Twitter className="w-3 h-3 text-gray-400" />

                                  <span>X (Twitter): Only first video will be posted</span>

                                </li>

                              </ul>

                            </div>

                          </div>

                        </div>

                      </div>

                    ) : videoPreview ? (

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

                          const files = Array.from(e.dataTransfer.files);

                          const videoFilesDropped = files.filter(f => f.type.startsWith('video/'));



                          if (videoFilesDropped.length === 0) {

                            toast.error('Please upload valid video files');

                            return;

                          }



                          // Check if Instagram is selected

                          const isInstagramSelected = selectedPlatforms.includes('instagram');

                          const maxVideos = isInstagramSelected ? 10 : 1;

                          const selectedFiles = videoFilesDropped.slice(0, maxVideos);



                          if (videoFilesDropped.length > maxVideos) {

                            toast.warning(`Only ${maxVideos} video${maxVideos > 1 ? 's' : ''} can be uploaded${!isInstagramSelected ? ' for non-Instagram platforms' : ''}.`);

                          }



                          if (selectedFiles.length === 1) {

                            const f = selectedFiles[0];

                            if (needsCompression(f, MAX_VIDEO_SIZE_MB)) {

                              const sizeMB = (f.size / (1024 * 1024)).toFixed(1);

                              toast.info(`Video is ${sizeMB}MB - starting smart compression...`);

                              setPendingVideoFile(f);

                              setShowCompressionModal(true);

                            } else {

                              setVideoFile(f);

                              setVideoPreview(URL.createObjectURL(f));

                            }

                          } else {

                            setVideoFiles(selectedFiles);

                            setVideoPreviews(selectedFiles.map(f => URL.createObjectURL(f)));

                            toast.success(`${selectedFiles.length} videos added for Instagram carousel`);

                          }

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

                        <p className="text-[#5B5C60] text-sm">

                          {selectedPlatforms.includes('instagram')

                            ? 'or click to browse (up to 10 videos for Instagram)'

                            : 'or click to browse (1 video for other platforms)'}

                        </p>

                      </div>

                    )}

                    <input

                      id="file-upload-video"

                      type="file"

                      hidden

                      accept="video/*"

                      multiple={selectedPlatforms.includes('instagram')}

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

                          <div className="grid grid-cols-2 gap-3">

                            {[5, 10].map((duration) => (

                              <button

                                key={duration}

                                onClick={() => setAiDuration(duration as 5 | 10)}

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
                      <div className="space-y-4">
                        {/* Text Prompt */}
                        <div>
                          <label className="text-sm font-semibold text-[#D6D7D8] mb-3 block">
                            Video Description <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            value={textToVideoPrompt}
                            onChange={(e) => setTextToVideoPrompt(e.target.value)}
                            rows={3}
                            placeholder="Describe the video you want to create (e.g., 'A futuristic city with flying cars at sunset')"
                            className="w-full rounded-xl bg-[#2C2C2E] border border-white/10 p-3 text-[#D6D7D8] placeholder:text-[#5B5C60] focus:border-[#E1C37A]/50 focus:ring-2 focus:ring-[#E1C37A]/20 resize-none text-sm"
                          />
                        </div>

                        {/* Negative Prompt */}
                        <div>
                          <label className="text-sm font-semibold text-[#D6D7D8] mb-3 block">
                            Negative Prompt <span className="text-[#5B5C60] font-normal">(optional)</span>
                          </label>
                          <textarea
                            value={textToVideoNegativePrompt}
                            onChange={(e) => setTextToVideoNegativePrompt(e.target.value)}
                            rows={2}
                            placeholder="Describe what to avoid (e.g., 'blurry, distorted, low quality')"
                            className="w-full rounded-xl bg-[#2C2C2E] border border-white/10 p-3 text-[#D6D7D8] placeholder:text-[#5B5C60] focus:border-[#E1C37A]/50 focus:ring-2 focus:ring-[#E1C37A]/20 resize-none text-sm"
                          />
                        </div>

                        {/* Duration Selector */}
                        <div>
                          <label className="text-sm font-semibold text-[#D6D7D8] mb-3 block">Duration</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[5, 10].map((duration) => (
                              <button
                                key={duration}
                                onClick={() => setTextToVideoDuration(duration as 5 | 10)}
                                className={`p-3 rounded-xl border transition-all duration-300 ${textToVideoDuration === duration
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
                          onClick={handleGenerateTextToVideo}
                          disabled={!textToVideoPrompt.trim() || isGeneratingAiVideo}
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
                              Generate Video
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

                  </>


                )}

              </div>

              {/* Video Post Type Options - Instagram */}
              {selectedPlatforms.includes('instagram') && (
                <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#D6D7D8]">Instagram Post Type</h3>
                      <p className="text-xs text-[#A9AAAC]">Choose where to publish your video</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${videoPostTypes.instagram.feed
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}>
                      <input
                        type="checkbox"
                        checked={videoPostTypes.instagram.feed}
                        onChange={(e) => setVideoPostTypes(prev => ({
                          ...prev,
                          instagram: { ...prev.instagram, feed: e.target.checked }
                        }))}
                        className="w-4 h-4 accent-[#E1C37A]"
                      />
                      <div>
                        <p className={`text-sm font-medium ${videoPostTypes.instagram.feed ? 'text-[#E1C37A]' : 'text-[#D6D7D8]'}`}>Feed</p>
                        <p className="text-xs text-[#5B5C60]">Main posts</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${videoPostTypes.instagram.reel
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}>
                      <input
                        type="checkbox"
                        checked={videoPostTypes.instagram.reel}
                        onChange={(e) => setVideoPostTypes(prev => ({
                          ...prev,
                          instagram: { ...prev.instagram, reel: e.target.checked }
                        }))}
                        className="w-4 h-4 accent-[#E1C37A]"
                      />
                      <div>
                        <p className={`text-sm font-medium ${videoPostTypes.instagram.reel ? 'text-[#E1C37A]' : 'text-[#D6D7D8]'}`}>Reel</p>
                        <p className="text-xs text-[#5B5C60]">Short videos</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${videoPostTypes.instagram.story
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}>
                      <input
                        type="checkbox"
                        checked={videoPostTypes.instagram.story}
                        onChange={(e) => setVideoPostTypes(prev => ({
                          ...prev,
                          instagram: { ...prev.instagram, story: e.target.checked }
                        }))}
                        className="w-4 h-4 accent-[#E1C37A]"
                      />
                      <div>
                        <p className={`text-sm font-medium ${videoPostTypes.instagram.story ? 'text-[#E1C37A]' : 'text-[#D6D7D8]'}`}>Story</p>
                        <p className="text-xs text-[#5B5C60]">24hr stories</p>
                      </div>
                    </label>
                  </div>

                  {videoFiles.length > 1 && videoPostTypes.instagram.feed && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-blue-400">
                        Multiple videos will be posted as a carousel to your Instagram feed.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Video Post Type Options - Facebook */}
              {selectedPlatforms.includes('facebook') && (
                <div className="p-6 rounded-2xl bg-[#3B3C3E]/30 backdrop-blur-[20px] border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1877F2]/20 flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-[#1877F2]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#D6D7D8]">Facebook Post Type</h3>
                      <p className="text-xs text-[#A9AAAC]">Choose where to publish your video</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${videoPostTypes.facebook.feed
                      ? 'bg-[#E1C37A]/10 border-[#E1C37A]/50'
                      : 'bg-[#3B3C3E]/30 border-white/5 hover:border-white/20'
                      }`}>
                      <input
                        type="checkbox"
                        checked={videoPostTypes.facebook.feed}
                        onChange={(e) => setVideoPostTypes(prev => ({
                          ...prev,
                          facebook: { ...prev.facebook, feed: e.target.checked }
                        }))}
                        className="w-4 h-4 accent-[#E1C37A]"
                      />
                      <div>
                        <p className={`text-sm font-medium ${videoPostTypes.facebook.feed ? 'text-[#E1C37A]' : 'text-[#D6D7D8]'}`}>Feed</p>
                        <p className="text-xs text-[#5B5C60]">Page posts</p>
                      </div>
                    </label>

                    {/* Reel option disabled - API limitation */}
                    <div className="flex items-center gap-3 p-4 rounded-xl border bg-[#3B3C3E]/30 border-white/5 opacity-50 cursor-not-allowed">
                      <input
                        type="checkbox"
                        disabled
                        className="w-4 h-4 accent-[#E1C37A]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#5B5C60]">Reel</p>
                        <p className="text-xs text-[#5B5C60]">Not supported</p>
                      </div>
                    </div>

                    {/* Story option disabled - API limitation */}
                    <div className="flex items-center gap-3 p-4 rounded-xl border bg-[#3B3C3E]/30 border-white/5 opacity-50 cursor-not-allowed">
                      <input
                        type="checkbox"
                        disabled
                        className="w-4 h-4 accent-[#E1C37A]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#5B5C60]">Story</p>
                        <p className="text-xs text-[#5B5C60]">Not supported</p>
                      </div>
                    </div>
                  </div>

                  {/* Facebook Story limitation notice */}
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Facebook Reels & Stories are not currently supported due to API limitations. Use Feed posts instead.
                    </p>
                  </div>
                </div>
              )}

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

                    <AnimatePresence>
                      {tone === 'Custom' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <input
                            placeholder="Describe your custom tone..."
                            className="w-full bg-[#2C2C2E] border border-white/10 rounded-xl px-4 py-3 text-[#D6D7D8] focus:outline-none focus:border-[#E1C37A]/50 mt-2 text-sm placeholder:text-[#5B5C60]"
                            value={customTone}
                            onChange={(e) => setCustomTone(e.target.value)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                    setVideoFiles([]);
                    videoPreviews.forEach(url => URL.revokeObjectURL(url));
                    setVideoPreviews([]);
                    setVideoPostTypes({
                      instagram: { feed: true, reel: false, story: false },
                      facebook: { feed: true, reel: false, story: false }
                    });
                    setSelectedPlatforms([]);
                    setSelectedFacebookPageIds([]);
                    setSelectedInstagramPageIds([]);
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
                    {activeTab === 'video'
                      ? "Your automated post should be visible within a minute. We're processing it across your selected platforms."
                      : `Your content has been ${postMode === 'publish' ? 'published' : 'scheduled'} across your selected social platforms.`
                    }
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
                        <p className="text-xs text-[#A9AAAC]">Generated by Kling AI via PyAPI</p>
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

        </motion.div>
      </div >

      {/* Draft Dialogs */}
      <LeaveConfirmationDialog
        open={showDialog}
        onOpenChange={() => { }}
        onLeave={handleLeave}
        onStay={handleStay}
        onSaveDraft={handleSaveDraft}
        isSaving={isSaving}
      />

      <DraftRestoreDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        onContinue={async () => {
          const draft = await loadDraft();
          if (draft) {
            setDraftData(draft);
            toast.success('Draft restored successfully');
          }
          setShowRestoreDialog(false);
        }}
        onStartFresh={async () => {
          await deleteDraft();
          setShowRestoreDialog(false);
        }}
        draftTimestamp={draftTimestamp}
      />
    </div >
  );
}
