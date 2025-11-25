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

import { getLinkedInAuthData } from "@/utils/linkedinOAuth";
import { getFacebookAuthData } from "@/utils/facebookOAuth";
import { getInstagramAuthData } from "@/utils/instagramOAuth";
import { getTikTokAuthData } from "@/utils/tiktokOAuth";   // ⭐ ADDED

type Platform = {
  id: string;
  name: string;
  icon: any;
  color?: string;
  bgColor?: string;
};

type LinkedInEntity = {
  urn: string;
  id: string;
  name: string;
  logo?: string | null;
  type: "person" | "organization";
};

type InstagramEntity = {
  key: string;
  id: string;
  name: string;
  type: "business" | "page";
  logo?: string | null;
};

// ⭐ TikTok icon already included (Music)

const ALL_PLATFORMS: Platform[] = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600", bgColor: "bg-blue-50" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-50" },
  { id: "x", name: "X (Twitter)", icon: Twitter, color: "text-gray-900", bgColor: "bg-gray-50" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700", bgColor: "bg-blue-50" },
  { id: "bluesky", name: "Bluesky", icon: Cloud, color: "text-sky-600", bgColor: "bg-sky-50" },
  { id: "tiktok", name: "TikTok", icon: Music, color: "text-gray-900", bgColor: "bg-gray-50" }, // ⭐ TikTok platform
  { id: "pinterest", name: "Pinterest", icon: Pin, color: "text-red-600", bgColor: "bg-red-50" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-600", bgColor: "bg-red-50" },
  { id: "google_business", name: "Google Business", icon: MapPin, color: "text-blue-600", bgColor: "bg-blue-50" },
  { id: "reddit", name: "Reddit", icon: MessageCircle, color: "text-orange-600", bgColor: "bg-orange-50" },
  { id: "medium", name: "Medium", icon: FileText, color: "text-gray-900", bgColor: "bg-gray-50" },
  { id: "threads", name: "Threads", icon: AtSign, color: "text-gray-900", bgColor: "bg-gray-50" },
  { id: "mastodon", name: "Mastodon", icon: Cloud, color: "text-purple-600", bgColor: "bg-purple-50" }
];

const SAMPLE_UPLOADED_IMAGE = "/mnt/data/sample-image.png";

export default function SocialMediaTool(): JSX.Element {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();

  // OAuth stored data
  const linkedin = getLinkedInAuthData();
  const facebook = getFacebookAuthData();
  const instagram = getInstagramAuthData();
  const tiktok = getTikTokAuthData();   // ⭐ ADDED

  // UI State
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

  const [linkedinEntities, setLinkedinEntities] = useState<LinkedInEntity[]>([]);
  const [instagramEntities, setInstagramEntities] = useState<InstagramEntity[]>([]);

  // ⭐ TikTok connection flag added
  const CONNECTED = {
    linkedin: !!linkedin,
    facebook: !!facebook,
    instagram: !!instagram,
    tiktok: !!tiktok, // ⭐ TikTok Connected State
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

  // LinkedIn & Instagram entity load logic preserved
  useEffect(() => {
    if (!linkedin) return setLinkedinEntities([]);

    const entities: LinkedInEntity[] = [];
    let personUrn = String(linkedin.linkedin_user_id || "");
    if (personUrn && !personUrn.startsWith("urn:li:person:")) {
      personUrn = `urn:li:person:${personUrn}`;
    }
    if (personUrn) {
      entities.push({
        urn: personUrn,
        id: personUrn.split(":").pop()!,
        name: `${linkedin.firstName || ""} ${linkedin.lastName || ""}`.trim(),
        logo: linkedin.profilePicture || null,
        type: "person"
      });
    }

    const orgs = linkedin.organizations || [];
    orgs.forEach((o: any) => {
      const urn = o.org_urn || `urn:li:organization:${o.org_id}`;
      entities.push({
        urn,
        id: o.org_id,
        name: o.name || "Company Page",
        logo: o.logo || null,
        type: "organization"
      });
    });

    setLinkedinEntities(entities);
  }, [linkedin]);

  useEffect(() => {
    if (!instagram) return setInstagramEntities([]);

    const items: InstagramEntity[] = [];

    if (instagram.instagram_user_id) {
      items.push({
        key: `instagram:business:${instagram.instagram_user_id}`,
        id: instagram.instagram_user_id,
        name: instagram.name || instagram.username || "",
        type: "business",
        logo: instagram.picture
      });
    }

    (instagram.pages || []).forEach((p: any) => {
      items.push({
        key: `instagram:page:${p.id}`,
        id: p.id,
        name: p.name || "",
        type: "page"
      });
    });

    setInstagramEntities(items);
  }, [instagram]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(String(reader.result));
      reader.readAsDataURL(f);
    }
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
      form.append("scheduled_time", scheduledTime);
    }

    if (imageFile) {
      form.append("image", imageFile);
    }

    const res = await fetch("https://scs-ltd.app.n8n.cloud/webhook/social-media", {
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
      return setErrorMsg("TikTok is not connected.");   // ⭐ TikTok validation

    setLoading(true);
    try {
      await sendToBackend();
      setIsSuccess(true);
      setCaption("");
      setImagePreview(null);
      setImageFile(null);
      setSelectedPlatforms([]);
      setTimeout(() => setIsSuccess(false), 1500);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
    setLoading(false);
  };

  if (!isLoaded) return <div>Loading user…</div>;

  if (!isSignedIn)
    return <div className="min-h-screen flex items-center justify-center">Login required</div>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto">

        {isSuccess && (
          <Card className="mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="text-green-600" />
              <span>Post sent successfully!</span>
            </CardContent>
          </Card>
        )}

        {errorMsg && (
          <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-700 rounded">
            {errorMsg}
          </div>
        )}

        <h1 className="text-3xl font-bold mb-4">Social Media Manager</h1>

        <Card className="mb-6">
          <CardHeader className="border-b p-4">
            <h2 className="text-lg font-bold">Choose Platforms</h2>
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
                  className={`p-3 rounded-xl border transition ${
                    !connected
                      ? "opacity-50 cursor-not-allowed bg-gray-100"
                      : selected
                      ? "scale-105 bg-white shadow-md"
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
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>AI Enhancement</Label>
              <Switch checked={aiEnhance} onCheckedChange={setAiEnhance} />
            </div>

            <div>
              <Label>Optional Image</Label>
              <div className="border-2 border-dashed p-4 rounded">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} className="max-h-48 rounded" />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block text-center">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p>Click to upload</p>
                  </label>
                )}
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
                  setImagePreview(null);
                  setImageFile(null);
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
