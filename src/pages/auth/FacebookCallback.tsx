// src/pages/auth/FacebookCallback.tsx
import { useEffect, useState } from "react";
import { completeFacebookAuth } from "@/utils/facebookOAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function FacebookCallback() {
  const [status, setStatus] = useState("Connecting your Facebook account...");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function finishAuth() {
      try {
        setStatus("Completing Facebook authentication...");

        const auth = await completeFacebookAuth();

        if (!auth) {
          setStatus("Something went wrong. No data returned.");
          toast.error("Facebook connection failed: no data returned.");
          return;
        }

        if (!mounted) return;
        setStatus("Facebook connected! Redirecting...");
        toast.success("Facebook connected");

        // small delay so the user sees success
        setTimeout(() => navigate("/apps/social-automation"), 700);
      } catch (err: any) {
        console.error("Facebook callback error:", err);
        setStatus("Authentication failed. Please try again.");
        toast.error(`Facebook callback error: ${err?.message ?? err}`);
      }
    }

    finishAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Facebook Authentication</h1>
      <p className="text-lg opacity-80">{status}</p>
      <div className="mt-6 animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
}
