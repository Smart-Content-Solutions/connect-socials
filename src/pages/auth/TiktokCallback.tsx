// src/pages/auth/TikTokCallback.tsx

import { useEffect, useState } from "react";
import { completeTikTokAuth } from "@/utils/tiktokOAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function TikTokCallback() {
  const [status, setStatus] = useState("Connecting your TikTok account...");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function finish() {
      try {
        setStatus("Completing TikTok authentication...");

        const params = new URLSearchParams(window.location.search);

        const code = params.get("code") ?? undefined;
        const state = params.get("state") ?? undefined;

        if (!code) {
          toast.error("TikTok OAuth failed: No code returned.");
          setStatus("No authorization code found.");
          return;
        }

        await completeTikTokAuth({ code, state });

        toast.success("TikTok connected!");
        setStatus("TikTok account successfully connected.");

        setTimeout(() => navigate("/"), 800);
      } catch (err) {
        console.error("TikTok callback error:", err);
        toast.error("Failed to connect TikTok.");
        setStatus("Error completing TikTok authentication.");
      }
    }

    finish();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">TikTok Authentication</h1>
      <p className="text-lg opacity-80">{status}</p>
      <div className="mt-6 animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
}
