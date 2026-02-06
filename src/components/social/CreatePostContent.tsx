// src/components/social/CreatePostContent.tsx
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

import {
  CheckCircle,
  Upload,
  Loader2,
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
  Send
} from "lucide-react";

import { getLinkedInAuthData } from "@/utils/linkedinOAuth";
import { getFacebookAuthData } from "@/utils/facebookOAuth";
import { getInstagramAuthData } from "@/utils/instagramOAuth";
import { getTikTokAuthData } from "@/utils/tiktokOAuth";

type Platform = {
  id: string;
  name: string;
  icon: any;
  color?: string;
  bgColor?: string;
};

const ALL_PLATFORMS: Platform[] = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600", bgColor: "bg-blue-50" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-50" },
  { id: "x", name: "X (Twitter)", icon: Twitter, color: "text-gray-900", bgColor: "bg-gray-50" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700", bgColor: "bg-blue-50" },
  { id: "bluesky", name: "Bluesky", icon: Cloud, color: "text-sky-600", bgColor: "bg-sky-50" },
  { id: "tiktok", name: "TikTok", icon: Music, color: "text-gray-900", bgColor: "bg-gray-50" },
  { id: "pinterest", name: "Pinterest", icon: Pin, color: "text-red-600", bgColor: "bg-red-50" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-600", bgColor: "bg-red-50" },
  { id: "google_business", name: "Google Business", icon: MapPin, color: "text-blue-600", bgColor: "bg-blue-50" },
  { id: "reddit", name: "Reddit", icon: MessageCircle, color: "text-orange-600", bgColor: "bg-orange-50" },
  { id: "medium", name: "Medium", icon: FileText, color: "text-gray-900", bgColor: "bg-gray-50" },
  { id: "threads", name: "Threads", icon: AtSign, color: "text-gray-900", bgColor: "bg-gray-50" },
  { id: "mastodon", name: "Mastodon", icon: Cloud, color: "text-purple-600", bgColor: "bg-purple-50" }
];

export default function CreatePostContent(): JSX.Element {
  const { user, isSignedIn } = useUser();

  // OAuth stored data
  const linkedin = getLinkedInAuthData();
  const facebook = getFacebookAuthData();
  const instagram = getInstagramAuthData();
  const tiktok = getTikTokAuthData();

  // UI State
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [aiEnhance, setAiEnhance] = useState(true);

  const [postMode, setPostMode] = useState("publish");
  const [scheduledTime, setScheduledTime] = useState("");

  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [instagramPostType, setInstagramPostType] = useState<"reel" | "feed" | "story">("reel");
  const [postToBothFeedAndStory, setPostToBothFeedAndStory] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errorMsg && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errorMsg]);

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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setVideoFiles((prev) => [...prev, ...newFiles]);

      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoPreviews((prev) => [...prev, String(reader.result)]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeVideo = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const isSelected = (id: string) => selectedPlatforms.includes(id);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const sendToBackend = async () => {
    if (!isSignedIn) {
      setErrorMsg("Login required.");
      return;
    }

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
      // Send user's browser timezone so the backend can convert to UTC correctly
      form.append("user_timezone", userTimezone);
    }

    // Log all form data being sent
    console.log("=== FORM DATA BEING SENT ===");
    for (let [key, value] of form.entries()) {
      console.log(`${key}:`, value);
    }
    console.log("============================");


    // Add Instagram post type selection
    if (selectedPlatforms.includes("instagram")) {
      form.append("instagram_post_types", JSON.stringify({
        feed: instagramPostType === "feed",
        reel: instagramPostType === "reel",
        story: instagramPostType === "story"
      }));
    }

    // Add dual posting flag for Instagram and Facebook
    const hasInstagramOrFacebook = selectedPlatforms.some(p => p === "instagram" || p === "facebook");
    if (hasInstagramOrFacebook && postToBothFeedAndStory) {
      form.append("post_to_both_feed_and_story", "true");
    } else if (instagramPostType === "story") {
      // If only story is selected (not dual mode)
      form.append("is_story", "true");
    }

    if (videoFiles.length > 0) {
      videoFiles.forEach((f, i) => {
        form.append(`video[${i}]`, f);
      });
    }

    const res = await fetch("https://n8n.smartcontentsolutions.co.uk/webhook/social-media-video", {
      method: "POST",
      body: form
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();
  };

  const handlePublish = async () => {
    setErrorMsg(null);

    if (!caption.trim()) return setErrorMsg("Caption is required.");
    if (selectedPlatforms.length === 0) return setErrorMsg("Select at least one platform.");

    if (selectedPlatforms.includes("facebook") && !facebook)
      return setErrorMsg("Facebook is not connected.");

    if (selectedPlatforms.includes("instagram") && !instagram)
      return setErrorMsg("Instagram is not connected.");

    if (selectedPlatforms.includes("tiktok") && !tiktok)
      return setErrorMsg("TikTok is not connected.");

    setLoading(true);
    try {
      await sendToBackend();
      setIsSuccess(true);
      setCaption("");
      setVideoPreviews([]);
      setVideoFiles([]);
      setSelectedPlatforms([]);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
          <Send className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Post</h2>
          <p className="text-gray-600 text-sm">Share content across your platforms</p>
        </div>
      </div>

      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6"
        >
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">Your post has been {postMode === 'publish' ? 'published' : 'scheduled'} successfully!</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {errorMsg && (
        <div ref={errorRef} className="p-3 mb-4 bg-red-100 border border-red-300 text-red-700 rounded">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b p-4">
            <h2 className="text-lg font-bold">Choose Platforms</h2>
            <p className="text-sm text-gray-600">{selectedPlatforms.length} selected</p>
          </CardHeader>

          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ALL_PLATFORMS.map((p) => {
              const connected = CONNECTED[p.id as keyof typeof CONNECTED];
              const selected = isSelected(p.id);

              return (
                <button
                  key={p.id}
                  disabled={!connected}
                  onClick={() => togglePlatform(p.id)}
                  className={`p-3 rounded-xl border transition ${!connected
                    ? "opacity-50 cursor-not-allowed bg-gray-100"
                    : selected
                      ? "scale-105 bg-white shadow-md border-blue-500"
                      : "bg-white hover:shadow-sm"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${p.bgColor} w-10 h-10 rounded-lg flex items-center justify-center`}>
                      <p.icon className={`w-5 h-5 ${p.color}`} />
                    </div>
                    <div className="flex-1 text-left font-semibold text-sm">{p.name}</div>
                    {selected && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b p-4">
            <h2 className="text-lg font-bold">Create Your Post</h2>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div>
              <Label>Caption *</Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Write your caption here..."
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>AI Enhancement</Label>
              <Switch checked={aiEnhance} onCheckedChange={setAiEnhance} />
            </div>

            {selectedPlatforms.includes("instagram") && (
              <div>
                <Label>Instagram Post Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(["reel", "feed", "story"] as const).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={instagramPostType === type ? "default" : "outline"}
                      onClick={() => setInstagramPostType(type)}
                      className="capitalize"
                      disabled={postToBothFeedAndStory}
                    >
                      {type}s
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {(selectedPlatforms.includes("instagram") || selectedPlatforms.includes("facebook")) && (
              <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <Label className="text-base font-semibold text-gray-900">Post to Both Feed & Story</Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Automatically post to both your feed and story simultaneously
                  </p>
                </div>
                <Switch
                  checked={postToBothFeedAndStory}
                  onCheckedChange={setPostToBothFeedAndStory}
                  className="ml-4"
                />
              </div>
            )}

            <div>
              <Label>Videos (Carousel supported for Instagram)</Label>
              <div className="border-2 border-dashed p-4 rounded mt-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {videoPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-video bg-black rounded overflow-hidden">
                      <video src={preview} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeVideo(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <label className="cursor-pointer block text-center py-4 border-2 border-blue-100 bg-blue-50/50 rounded-lg hover:bg-blue-50 transition">
                  <input
                    type="file"
                    className="hidden"
                    accept="video/*"
                    multiple
                    onChange={handleVideoUpload}
                  />
                  <Upload className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-gray-700">Add Videos</p>
                  <p className="text-xs text-gray-500 mt-1">Click to browse your files</p>
                </label>
              </div>
            </div>

            <div>
              <Label>Posting Mode</Label>
              <select
                className="w-full border p-3 rounded"
                value={postMode}
                onChange={(e) => setPostMode(e.target.value)}
              >
                <option value="publish">Publish Now</option>
                <option value="schedule">Schedule</option>
              </select>
            </div>

            {postMode === "schedule" && (
              <input
                type="datetime-local"
                className="w-full border p-3 rounded"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            )}

            <div className="flex justify-end pt-4 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCaption("");
                  setVideoPreviews([]);
                  setVideoFiles([]);
                  setSelectedPlatforms([]);
                }}
              >
                Clear
              </Button>

              <Button
                onClick={handlePublish}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-green-500 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {postMode === 'publish' ? 'Publish Now' : 'Schedule Post'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
