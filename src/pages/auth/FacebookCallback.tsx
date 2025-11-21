// src/pages/auth/FacebookCallback.tsx
import { useEffect, useState } from "react";
import { completeFacebookAuth } from "@/utils/facebookOAuth";
import { useNavigate } from "react-router-dom";
import { ClerkLoaded, ClerkLoading, useUser } from "@clerk/clerk-react";

export default function FacebookCallback() {
  const [status, setStatus] = useState("Connecting your Facebook account...");
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded) return; // wait for Clerk!

    async function finishAuth() {
      try {
        if (!isSignedIn) {
          setStatus("You must be logged in before connecting Facebook.");
          return;
        }

        setStatus("Completing Facebook authentication...");

        const auth = await completeFacebookAuth();

        setStatus("Facebook connected! Redirecting...");

        setTimeout(() => navigate("/dashboard"), 800);
      } catch (err) {
        console.error("Facebook callback error:", err);
        setStatus(err.message);
      }
    }

    finishAuth();
  }, [isLoaded, isSignedIn]); // wait for Clerk

  return (
    <>
      <ClerkLoading>
        <div className="h-screen flex items-center justify-center text-xl">
          Loading authentication...
        </div>
      </ClerkLoading>

      <ClerkLoaded>
        <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Facebook Authentication</h1>
          <p className="text-lg opacity-80">{status}</p>
          <div className="mt-6 animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </ClerkLoaded>
    </>
  );
}
