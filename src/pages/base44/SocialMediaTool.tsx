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

type Platform = {
  id: string;
  name: string;
  icon: any;
  color?: string;
  bgColor?: string;
};

type LinkedInEntity = {
  urn: string; // urn:li:person:... or urn:li:organization:...
  id: string; // numeric id for org or person id
  name: string;
  logo?: string | null;
  type: "person" | "organization";
};

type InstagramEntity = {
  key: string; // e.g. instagram:business:{ig_id} or instagram:page:{page_id}
  id: string; // ig id or page id
  name: string;
  type: "business" | "page";
  logo?: string | null;
};

const ALL_PLATFORMS: Platform[] = [
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600", bgColor: "bg-blue-50" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-50" },
  { id: "x", name: "X (Twitter)", icon: Twitter, color: "text-gray-900", bgColor: "bg-gray-50" },
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

// -- SAMPLE uploaded image path (dev/test) --
// The environment/tooling will transform this local path into an accessible URL during processing.
const SAMPLE_UPLOADED_IMAGE = "/mnt/data/cb6d4125-4766-4055-964d-b5bbad277921.png";

export default function SocialMediaTool(): JSX.Element {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();

  const linkedin = getLinkedInAuthData();
  const facebook = getFacebookAuthData();
  const instagram = getInstagramAuthData();

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

  // LinkedIn entities (personal + organizations)
  const [linkedinEntities, setLinkedinEntities] = useState<LinkedInEntity[]>([]);
  const [showLinkedinEntities, setShowLinkedinEntities] = useState(true);

  // Instagram entities (business account + connected pages)
  const [instagramEntities, setInstagramEntities] = useState<InstagramEntity[]>([]);
  const [showInstagramEntities, setShowInstagramEntities] = useState(true);

  // CONNECTED PLATFORM DETECTION
  const CONNECTED = {
    linkedin: !!linkedin,
    facebook: !!facebook,
    instagram: !!instagram,
    x: false,
    tiktok: false,
    pinterest: false,
    youtube: false,
    google_business: false,
    reddit: false,
    medium: false,
    threads: false,
    mastodon: false
  };

  // Populate LinkedIn entities from saved auth data
  useEffect(() => {
    if (!linkedin) {
      setLinkedinEntities([]);
      return;
    }

    const entities: LinkedInEntity[] = [];

    let personUrn = String(linkedin.linkedin_user_id || "");
    if (personUrn && !personUrn.startsWith("urn:li:person:")) {
      personUrn = `urn:li:person:${personUrn}`;
    }
    if (personUrn) {
      entities.push({
        urn: personUrn,
        id: (personUrn.split(":").pop() as string) || "",
        name: `${linkedin.firstName || ""} ${linkedin.lastName || ""}`.trim() || "Personal Profile",
        logo: linkedin.profilePicture || null,
        type: "person"
      });
    }

    const orgs = (linkedin.organizations || linkedin.company_pages || []) as any[];
    if (Array.isArray(orgs)) {
      orgs.forEach((o) => {
        const urn = o.org_urn || o.provider_org_urn || (o.org_id ? `urn:li:organization:${o.org_id}` : null);
        const id = o.org_id || (urn ? urn.split(":").pop() : "");
        const name = o.name || o.localizedName || `Company ${id}`;
        const logo = o.logo || (o.logoV2 && o.logoV2["original~"]?.elements?.[0]?.identifiers?.[0]?.identifier) || null;

        if (urn) {
          entities.push({
            urn,
            id,
            name,
            logo,
            type: "organization"
          });
        }
      });
    }

    setLinkedinEntities(entities);
  }, [linkedin]);

  // Populate Instagram entities from saved auth data
  useEffect(() => {
    if (!instagram) {
      setInstagramEntities([]);
      return;
    }

    const items: InstagramEntity[] = [];

    // Primary connected Instagram business account (if provided)
    if (instagram.instagram_user_id) {
      const key = `instagram:business:${instagram.instagram_user_id}`;
      items.push({
        key,
        id: instagram.instagram_user_id,
        name: instagram.name || instagram.username || `Instagram ${instagram.instagram_user_id}`,
        type: "business",
        logo: instagram.picture || null
      });
    }

    // Pages (Facebook pages connected to IG business accounts)
    const pages = instagram.pages || [];
    if (Array.isArray(pages)) {
      pages.forEach((p) => {
        const key = `instagram:page:${p.id}`;
        items.push({
          key,
          id: p.id,
          name: p.name || `Page ${p.id}`,
          type: "page",
          logo: null
        });
      });
    }

    setInstagramEntities(items);
  }, [instagram]);

  // IMAGE UPLOAD
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(String(reader.result));
      reader.readAsDataURL(f);
    }
  };

  // Helper: whether a given urn or platform id is selected
  const isSelected = (idOrUrn: string) => selectedPlatforms.includes(idOrUrn);

  // BLOCK DISCONNECTED PLATFORMS / SELECT ENTITIES
  const togglePlatform = (id: string) => {
    // LinkedIn entities (URNs)
    if (id.startsWith("urn:li:")) {
      if (!CONNECTED.linkedin) {
        setErrorMsg("LinkedIn is not connected. Please connect LinkedIn first.");
        return;
      }
      setSelectedPlatforms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      return;
    }

    // Instagram entities (instagram:business:... or instagram:page:...)
    if (id.startsWith("instagram:")) {
      if (!CONNECTED.instagram) {
        setErrorMsg("Instagram is not connected. Please connect Instagram first.");
        return;
      }
      setSelectedPlatforms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      return;
    }

    // Non-linkedin / non-instagram: block if not connected
    if (!CONNECTED[id as keyof typeof CONNECTED]) {
      setErrorMsg(`${ALL_PLATFORMS.find((p) => p.id === id)?.name} is not connected. Please connect first.`);
      return;
    }

    setSelectedPlatforms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Clear error after a short delay
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 5000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  // BACKEND INTEGRATION
  const sendToBackend = async () => {
    if (!isSignedIn || !user?.id) {
      setErrorMsg("Login required.");
      return;
    }

    const hasLinkedInSelected = selectedPlatforms.some((p) => p.startsWith("urn:li:"));
    if (hasLinkedInSelected && !linkedin) {
      setErrorMsg("You must connect LinkedIn before posting to LinkedIn.");
      return;
    }

    const hasInstagramSelected = selectedPlatforms.some((p) => p.startsWith("instagram:"));
    if (hasInstagramSelected && !instagram) {
      setErrorMsg("You must connect Instagram before posting to Instagram.");
      return;
    }

    if (selectedPlatforms.includes("facebook") && !facebook) {
      setErrorMsg("You must connect Facebook before posting to Facebook.");
      return;
    }

    const form = new FormData();
    form.append("user_id", user.id);
    form.append("caption", caption);

    // Send platforms[] (URNs for LinkedIn, instagram keys for IG entities, platform ids like 'facebook' for Facebook)
    selectedPlatforms.forEach((p) => form.append("platforms[]", p));

    form.append("post_mode", postMode);
    form.append("use_ai", aiEnhance ? "yes" : "no");

    if (postMode === "schedule") {
      form.append("scheduled_time", scheduledTime);
    }

    if (imageFile) form.append("image", imageFile);

    try {
      const res = await fetch("https://scs-ltd.app.n8n.cloud/webhook/social-media", {
        method: "POST",
        body: form
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Backend error");
      }

      return res.json();
    } catch (err: any) {
      throw new Error(err.message || "Network error");
    }
  };

  const handlePublish = async () => {
    setErrorMsg(null);

    if (!caption.trim()) {
      setErrorMsg("Caption is required.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      setErrorMsg("Select at least one connected platform.");
      return;
    }

    setLoading(true);
    try {
      await sendToBackend();

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

  // LOADING STATE
  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading user…</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 shadow-xl rounded-lg">Login required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto">

        {/* SUCCESS */}
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

        {/* ERROR */}
        {errorMsg && (
          <div className="p-4 mb-4 text-sm bg-red-100 text-red-700 border border-red-300 rounded">
            {errorMsg}
          </div>
        )}

        <h1 className="text-3xl font-bold mb-4">Social Media Manager</h1>

        {/* PLATFORM SELECT */}
        <Card className="mb-6">
          <CardHeader className="border-b p-4">
            <h2 className="text-lg font-bold">Choose Platforms</h2>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

            {ALL_PLATFORMS.map((p) => {
              const basicSelected = isSelected(p.id);
              const isConnected = CONNECTED[p.id as keyof typeof CONNECTED];

              if (p.id === "linkedin") {
                return (
                  <div key={p.id} className={`p-3 rounded-xl border ${!isConnected ? "opacity-50 bg-gray-100" : "bg-white/90 hover:shadow-sm"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`${p.bgColor} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <p.icon className={`w-5 h-5 ${p.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {isConnected ? `${linkedin?.firstName || "Connected"}` : "Not connected"}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => setShowLinkedinEntities((s) => !s)}
                          className="text-sm px-2 py-1 bg-blue-50 rounded"
                          disabled={!isConnected}
                        >
                          {showLinkedinEntities ? "Hide" : "Show"}
                        </button>
                        <div className="text-xs text-gray-400">{isConnected ? "Connected" : "Connect"}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Instagram special tile: show connected user or connect status
              if (p.id === "instagram") {
                return (
                  <div key={p.id} className={`p-3 rounded-xl border ${!isConnected ? "opacity-50 bg-gray-100" : "bg-white/90 hover:shadow-sm"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`${p.bgColor} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <p.icon className={`w-5 h-5 ${p.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {isConnected ? `${instagram?.username || instagram?.name || "Connected"}` : "Not connected"}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => setShowInstagramEntities((s) => !s)}
                          className="text-sm px-2 py-1 bg-pink-50 rounded"
                          disabled={!isConnected}
                        >
                          {showInstagramEntities ? "Hide" : "Show"}
                        </button>
                        <div className="text-xs text-gray-400">{isConnected ? "Connected" : "Connect"}</div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Facebook special tile: show connected user or connect status
              if (p.id === "facebook") {
                return (
                  <button
                    key={p.id}
                    disabled={!isConnected}
                    onClick={() => togglePlatform(p.id)}
                    className={`p-3 rounded-xl border transition ${!isConnected ? "opacity-50 cursor-not-allowed bg-gray-100" : basicSelected ? "scale-105 bg-white shadow-lg" : "bg-white/90 hover:shadow-sm"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${p.bgColor} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <p.icon className={`w-5 h-5 ${p.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {isConnected ? `${facebook?.name || "Connected"}` : "Not connected"}
                        </div>
                      </div>
                      {basicSelected && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={p.id}
                  disabled={!isConnected}
                  onClick={() => togglePlatform(p.id)}
                  className={`p-3 rounded-xl border transition ${!isConnected ? "opacity-50 cursor-not-allowed bg-gray-100" : basicSelected ? "scale-105 bg-white shadow-lg" : "bg-white/90 hover:shadow-sm"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${p.bgColor} w-10 h-10 rounded-lg flex items-center justify-center`}>
                      <p.icon className={`w-5 h-5 ${p.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm">{p.name}</div>
                    </div>
                    {basicSelected && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                </button>
              );
            })}

          </CardContent>

          {/* LINKEDIN ENTITIES PANEL */}
          {CONNECTED.linkedin && showLinkedinEntities && (
            <CardContent className="p-4 border-t">
              <h3 className="text-sm font-semibold mb-3">LinkedIn Targets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {linkedinEntities.length === 0 && (
                  <div className="p-3 bg-gray-50 rounded text-sm text-gray-600">No LinkedIn profile/pages found.</div>
                )}

                {linkedinEntities.map((e) => {
                  const sel = isSelected(e.urn);
                  return (
                    <div key={e.urn} className={`p-3 rounded-lg border flex items-center gap-3 ${sel ? "bg-white shadow-md" : "bg-white/95"}`}>
                      <img src={e.logo || undefined} alt={e.name} className="w-10 h-10 rounded object-cover bg-gray-100" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{e.name}</div>
                        <div className="text-xs text-gray-500">{e.type === "person" ? "Personal profile" : "Company Page"}</div>
                      </div>

                      <div>
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => togglePlatform(e.urn)}
                          disabled={!CONNECTED.linkedin}
                          className="w-4 h-4"
                          aria-label={`Select ${e.name}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}

          {/* INSTAGRAM ENTITIES PANEL */}
          {CONNECTED.instagram && showInstagramEntities && (
            <CardContent className="p-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Instagram Targets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {instagramEntities.length === 0 && (
                  <div className="p-3 bg-gray-50 rounded text-sm text-gray-600">No Instagram business account or connected pages found.</div>
                )}

                {instagramEntities.map((e) => {
                  const sel = isSelected(e.key);
                  return (
                    <div key={e.key} className={`p-3 rounded-lg border flex items-center gap-3 ${sel ? "bg-white shadow-md" : "bg-white/95"}`}>
                      <img src={e.logo || undefined} alt={e.name} className="w-10 h-10 rounded object-cover bg-gray-100" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{e.name}</div>
                        <div className="text-xs text-gray-500">{e.type === "business" ? "Instagram Business" : "Facebook Page (connected to IG)"}</div>
                      </div>

                      <div>
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => togglePlatform(e.key)}
                          disabled={!CONNECTED.instagram}
                          className="w-4 h-4"
                          aria-label={`Select ${e.name}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>

        {/* POST CREATOR */}
        <Card>
          <CardHeader className="border-b p-4">
            <h2 className="text-lg font-bold">Create Your Post</h2>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* CAPTION */}
            <div>
              <Label>Caption *</Label>
              <Textarea
                rows={5}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption..."
              />
            </div>

            {/* AI ENHANCEMENT */}
            <div className="flex items-center justify-between py-2">
              <Label className="text-gray-700 font-medium">AI Enhancement</Label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {aiEnhance ? "Enabled" : "Disabled"}
                </span>
                <Switch checked={aiEnhance} onCheckedChange={setAiEnhance} />
              </div>
            </div>

            {/* IMAGE UPLOAD */}
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

                    {/* Dev: quick sample image loader using uploaded file path */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          // Use the local uploaded file path (tooling will convert path to URL)
                          setImagePreview(SAMPLE_UPLOADED_IMAGE);
                          setImageFile(null);
                        }}
                        className="text-xs text-gray-500 underline"
                      >
                        Use sample uploaded image
                      </button>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* POST MODE */}
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
