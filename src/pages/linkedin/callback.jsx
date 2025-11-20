import { useEffect, useState } from "react";
import { completeLinkedInAuth } from "@/utils/linkedinOAuth";
import { useNavigate } from "react-router-dom";

export default function LinkedInCallback() {
  const [status, setStatus] = useState("Connecting your LinkedIn account...");
  const navigate = useNavigate();

  useEffect(() => {
    async function finishAuth() {
      try {
        setStatus("Completing LinkedIn authentication...");

        const auth = await completeLinkedInAuth();

        if (!auth) {
          setStatus("Something went wrong. No data returned.");
          return;
        }

        setStatus("LinkedIn connected! Redirecting...");

        // ⭐ REDIRECT DIRECTLY TO CREATE POST
        setTimeout(() => {
          navigate("/dashboard"); 
        }, 800);

      } catch (err) {
        console.error(err);
        setStatus("Authentication failed. Please try again.");
      }
    }

    finishAuth();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">LinkedIn Authentication</h1>
      <p className="text-lg opacity-80">{status}</p>
      <div className="mt-6 animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
}
