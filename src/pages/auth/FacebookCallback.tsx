// src/pages/auth/FacebookCallback.tsx
import { useEffect, useState } from "react";
import { completeFacebookAuth } from "@/utils/facebookOAuth";
import { useNavigate } from "react-router-dom";

/**
 * Facebook OAuth redirect handler page.
 *
 * This component:
 * - ensures the finishAuth() only runs once (React StrictMode / double mount safe)
 * - shows useful status text to the user
 */
export default function FacebookCallback() {
  const [status, setStatus] = useState("Connecting your Facebook account...");
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent double-run during StrictMode / hot reload
    const FLAG = "__SCS_FB_OAUTH_DONE__";
    if ((window as any)[FLAG]) return;
    (window as any)[FLAG] = true;

    let mounted = true;

    async function finishAuth() {
      try {
        setStatus("Completing Facebook authentication...");

        const auth = await completeFacebookAuth();

        if (!auth) {
          if (!mounted) return;
          setStatus("Something went wrong. No data returned.");
          return;
        }

        if (!mounted) return;
        setStatus("Facebook connected! Redirecting...");
        // small delay to show user success
        setTimeout(() => navigate("/dashboard"), 700);
      } catch (err: any) {
        console.error("Facebook callback error:", err);
        // Provide user-friendly message but keep full error in console for debugging
        if (!mounted) return;
        setStatus(err?.message || "Authentication failed. Please try again.");
      }
    }

    // run
    finishAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Facebook Authentication</h1>
      <p className="text-lg opacity-80">{status}</p>
      <div className="mt-6 animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
}
