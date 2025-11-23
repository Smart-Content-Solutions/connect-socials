// src/pages/auth/InstagramCallback.tsx
import { useEffect, useState } from "react";
import { completeInstagramAuth } from "@/utils/instagramOAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function InstagramCallback() {
  const [status, setStatus] = useState("Connecting your Instagram account...");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function finishAuth() {
      try {
        setStatus("Completing Instagram authentication...");
        const auth = await completeInstagramAuth();

        if (!auth) {
          setStatus("Something went wrong. No data returned.");
          toast.error("Instagram connection failed: no data returned.");
          return;
        }

        if (!mounted) return;
        setStatus("Instagram connected! Redirecting...");
        toast.success("Instagram connected");

        setTimeout(() => navigate("/dashboard"), 700);
      } catch (err: any) {
        console.error("Instagram callback error:", err);
        setStatus("Authentication failed. Please try again.");
        toast.error(`Instagram callback error: ${err?.message ?? err}`);
      }
    }

    finishAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Instagram Authentication</h1>
      <p className="text-lg opacity-80">{status}</p>
      <div className="mt-6 animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
}
