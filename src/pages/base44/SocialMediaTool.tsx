// src/pages/base44/SocialMediaTool.tsx
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Cloud
} from "lucide-react";

import LockedToolOverlay from "@/components/dashboard/LockedToolOverlay";

// GET LINKEDIN AUTH (if any)
import { getLinkedInAuthData } from "@/utils/linkedinOAuth";

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
  { id: "x", name: "X(Twitter)", icon: Twitter, color: "text-gray-900", bgColor: "bg-gray-50" },

  // REAL LINKEDIN
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700", bgColor: "bg-blue-50" },

  { id: "tiktok", name: "TikTok", icon: Music, color: "text-gray-900", bgColor: "bg-gray-50" },
  { id: "pinterest", name: "Pinterest", icon: Pin, color: "text-red-600", bgColor: "bg-red-50" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-600", bgColor: "bg-red-50" },
  { id: "google_business", name: "Google Business", icon: MapPin, color: "text-blue-600", bgColor: "bg-blue-50" },
  { id: "reddit", name: "Reddit", icon: MessageCircle, color: "text-orange-600", bgColor: "bg-orange-50" },
  { id: "medium", name: "Medium", icon: FileText, color: "text-gray-900", bgColor: "bg-gray-50" },
  { id: "threads", name: "Threads", icon: AtSign, color: "text-gray-900", bgColor: "bg-gray-50" },
  { id: "mastodon", name: "Mastodon", icon: Cloud, color: "text-purple-600", bgColor: "bg-purple-50" }
];

export default function SocialMediaTool(): JSX.Element {

  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();

  const linkedin = getLinkedInAuthData();

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

  // -------------------------------------------------------------------
  // IMAGE UPLOAD HANDLER
  // -------------------------------------------------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(String(reader.result));
      reader.readAsDataURL(f);
    }
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  // -------------------------------------------------------------------
  // ⭐ BACKEND POST INTEGRATION (from CreatePost.tsx)
  // -------------------------------------------------------------------
  const sendToBackend = async () => {
    if (!isSignedIn || !user?.id) {
      setErrorMsg("You must be logged in to post.");
      return;
    }

    // Require LinkedIn when selected
    if (selectedPlatforms.includes("linkedin") && !linkedin) {
      setErrorMsg("You must connect LinkedIn before posting to LinkedIn.");
      return;
    }

    const form = new FormData();
    form.append("user_id", user.id);
    form.append("caption", caption);

    // Add selected platforms
    selectedPlatforms.forEach((p) => {
      form.append("platforms[]", p);
    });

    form.append("post_mode", postMode);
    form.append("use_ai", aiEnhance ? "yes" : "no");

    if (postMode === "schedule") {
      form.append("scheduled_time", scheduledTime);
    }

    if (imageFile) {
      form.append("image", imageFile);
    }

    try {
      const res = await fetch(
        "https://scs-ltd.app.n8n.cloud/webhook/social-media",
        {
          method: "POST",
          body: form
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      return await res.json();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  // -------------------------------------------------------------------
  // PUBLISH FUNCTION
  // -------------------------------------------------------------------
  const handlePublish = async () => {
    setErrorMsg(null);

    if (!caption.trim()) {
      setErrorMsg("Caption is required.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      setErrorMsg("Select at least 1 platform.");
      return;
    }

    setLoading(true);
    try {
      await sendToBackend();

      // Reset form
      setIsSuccess(true);
      setCaption("");
      setImagePreview(null);
      setImageFile(null);
      setSelectedPlatforms([]);

      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  // If Clerk still loading
  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading user…</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-50">
        <div className="bg-white shadow-xl p-8">Login required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto">

        {isSuccess && (
          <Card className="mb-6">
            <CardContent className="p-4 flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-semibold">Post sent successfully!</div>
                <div className="text-sm text-gray-600">Delivered to automation backend.</div>
              </div>
            </CardContent>
          </Card>
        )}

        {errorMsg && (
          <div className="p-4 mb-4 text-sm bg-red-100 text-red-700 border border-red-300 rounded">
            {errorMsg}
          </div>
        )}

        <h1 className="text-3xl font-bold mb-4">Social Media Manager</h1>

        {/* PLATFORM SELECTION */}
        <Card className="mb-6">
          <CardHeader className="border-b p-4">
            <h2 className="text-lg font-bold">Choose Platforms</h2>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ALL_PLATFORMS.map((p) => {
              const isSelected = selectedPlatforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`p-3 rounded-xl border ${
                    isSelected ? "scale-105 bg-white shadow-lg" : "bg-white/90 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${p.bgColor} w-10 h-10 rounded-lg flex items-center justify-center`}>
                      <p.icon className={`w-5 h-5 ${p.color}`} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-sm">{p.name}</div>
                    </div>
                    {isSelected && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* POST CREATOR */}
        <Card>
          <CardHeader className="border-b p-4">
            <h2 className="text-lg font-bold">Create Your Post</h2>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div>
              <Label>Caption *</Label>
              <Textarea
                rows={5}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption..."
              />
            </div>

            <div>
              <Label>AI Enhancement</Label>
              <Switch checked={aiEnhance} onCheckedChange={setAiEnhance} />
            </div>

            <div>
              <Label>Optional image</Label>
              <div className="border-2 border-dashed p-4 rounded">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} className="max-h-48 rounded" />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block text-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p>Click to upload</p>
                  </label>
                )}
              </div>
            </div>

            {/* Posting mode */}
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

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setCaption("");
                  setImageFile(null);
                  setImagePreview(null);
                  setPostMode("publish");
                  setSelectedPlatforms([]);
                }}
              >
                Clear
              </Button>

              <Button
                onClick={handlePublish}
                className="bg-gradient-to-r from-blue-500 to-green-500 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Publishing...
                  </>
                ) : (
                  "Publish to Selected Platforms"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
