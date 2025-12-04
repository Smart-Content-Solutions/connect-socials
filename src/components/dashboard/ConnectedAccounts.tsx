import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Music,
  Pin,
  Youtube,
  Loader2,
  CheckCircle,
  Lock
} from "lucide-react";

// ⭐ LINKEDIN
import {
  initiateLinkedInAuth,
  getLinkedInAuthData,
  clearLinkedInAuthData,
  isLinkedInConnected
} from "@/utils/linkedinOAuth";

// ⭐ FACEBOOK
import {
  initiateFacebookAuth,
  getFacebookAuthData,
  clearFacebookAuthData,
  isFacebookConnected
} from "@/utils/facebookOAuth";

// ⭐ INSTAGRAM
import {
  initiateInstagramAuth,
  getInstagramAuthData,
  clearInstagramAuthData,
  isInstagramConnected
} from "@/utils/instagramOAuth";

// ⭐ TIKTOK
import {
  initiateTikTokAuth,
  getTikTokAuthData,
  clearTikTokAuthData,
  isTikTokConnected
} from "@/utils/tiktokOAuth";

export default function ConnectedAccounts({ user }) {
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);

  const [linkedinData, setLinkedinData] = useState<any>(null);
  const [facebookData, setFacebookData] = useState<any>(null);
  const [instagramData, setInstagramData] = useState<any>(null);
  const [tiktokData, setTikTokData] = useState<any>(null);

  useEffect(() => {
    setLinkedinData(getLinkedInAuthData());
    setFacebookData(getFacebookAuthData());
    setInstagramData(getInstagramAuthData());
    setTikTokData(getTikTokAuthData());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("linkedin") === "connected") setLinkedinData(getLinkedInAuthData());
    if (params.get("facebook") === "connected") setFacebookData(getFacebookAuthData());
    if (params.get("instagram") === "connected") setInstagramData(getInstagramAuthData());
    if (params.get("tiktok") === "connected") setTikTokData(getTikTokAuthData());

    if (
      params.get("linkedin") ||
      params.get("facebook") ||
      params.get("instagram") ||
      params.get("tiktok")
    ) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const accounts = [
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      connected: isFacebookConnected(),
      displayName: facebookData?.name || facebookData?.user_name || null,
      start: () => initiateFacebookAuth(),
      disconnect: () => {
        clearFacebookAuthData();
        setFacebookData(null);
      }
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      connected: isInstagramConnected(),
      displayName:
        instagramData?.username ||
        instagramData?.name ||
        instagramData?.instagram_user_id ||
        null,
      start: () => initiateInstagramAuth(),
      disconnect: () => {
        clearInstagramAuthData();
        setInstagramData(null);
      }
    },
    {
      id: "x",
      name: "X (Twitter)",
      icon: Twitter,
      connected: false,
      displayName: null,
      fake: true
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      connected: isLinkedInConnected(),
      displayName: linkedinData
        ? `${linkedinData.firstName ?? ""} ${linkedinData.lastName ?? ""}`.trim()
        : null,
      start: () => initiateLinkedInAuth(),
      disconnect: () => {
        clearLinkedInAuthData();
        setLinkedinData(null);
      }
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: Music,
      connected: isTikTokConnected(),
      displayName: tiktokData?.display_name || tiktokData?.open_id || null,
      start: () => initiateTikTokAuth(),
      disconnect: () => {
        clearTikTokAuthData();
        setTikTokData(null);
      }
    },
    {
      id: "pinterest",
      name: "Pinterest",
      icon: Pin,
      connected: false,
      fake: true
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: Youtube,
      connected: false,
      fake: true
    }
  ];

  const fakeConnect = (id: string) => {
    setLoadingPlatform(id);
    setTimeout(() => {
      alert(`${id} connected (simulated)`);
      setLoadingPlatform(null);
    }, 600);
  };

  const fakeDisconnect = (id: string) => {
    if (!confirm(`Disconnect ${id}?`)) return;
    setLoadingPlatform(id);
    setTimeout(() => {
      alert(`${id} disconnected (simulated)`);
      setLoadingPlatform(null);
    }, 600);
  };

  return (
    <div className="glass-card rounded-3xl p-8">
      <h3 className="text-2xl font-bold text-white mb-2">Connected Accounts</h3>
      <p className="text-sm text-[#A9AAAC] mb-8">
        Connect your social media platforms to enable publishing.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc, index) => {
          const Icon = acc.icon;
          const isLoading = loadingPlatform === acc.id;
          const connected = acc.connected;

          return (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl metallic-gradient flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#1A1A1C]" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-semibold">{acc.name}</h4>
                    <Badge
                      className={`${
                        connected
                          ? "bg-green-500/20 text-green-400"
                          : "bg-[#3B3C3E] text-[#A9AAAC]"
                      }`}
                    >
                      {connected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>

                  {connected && acc.displayName && (
                    <p className="text-xs text-[#A9AAAC] mt-1">
                      {acc.displayName}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5">
                {!acc.fake ? (
                  <Button
                    className={`w-full ${
                      connected ? "btn-outline" : "btn-gold"
                    }`}
                    disabled={isLoading}
                    onClick={
                      connected ? acc.disconnect : acc.start
                    }
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : connected ? (
                      "Disconnect"
                    ) : (
                      "Connect"
                    )}
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${
                      connected ? "btn-outline" : "btn-gold"
                    }`}
                    disabled={isLoading}
                    onClick={() =>
                      connected
                        ? fakeDisconnect(acc.id)
                        : fakeConnect(acc.id)
                    }
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : connected ? (
                      "Disconnect"
                    ) : (
                      "Connect"
                    )}
                  </Button>
                )}
              </div>

              {!connected && !acc.fake && (
                <div className="mt-3 text-xs text-[#5B5C60] flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  OAuth required
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
