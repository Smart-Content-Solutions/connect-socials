import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { completeYouTubeAuth } from "@/utils/youtubeOAuth";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function YoutubeCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        // Prevent double execution in React Strict Mode which might re-run effects
        let mounted = true;

        async function handleAuth() {
            const code = searchParams.get("code");
            const state = searchParams.get("state");
            const error = searchParams.get("error");

            console.log("YoutubeCallback: code:", code);
            console.log("YoutubeCallback: state:", state);
            console.log("YoutubeCallback: error:", error);

            if (error) {
                setStatus("error");
                setErrorMsg(`Authorization failed: ${error}`);
                return;
            }

            if (!code || !state) {
                setStatus("error");
                setErrorMsg("Missing authorization code or state parameter.");
                return;
            }

            try {
                console.log("YoutubeCallback: Calling completeYouTubeAuth...");
                await completeYouTubeAuth({ code, state });
                console.log("YoutubeCallback: completeYouTubeAuth succeeded!");
                if (mounted) {
                    setStatus("success");
                    // Automatically redirect after a short delay
                    setTimeout(() => navigate("/tools/social-media"), 2000);
                }
            } catch (err: any) {
                console.error("YouTube OAuth Error:", err);
                console.error("YouTube OAuth Error stack:", err.stack);
                if (mounted) {
                    setStatus("error");
                    setErrorMsg(err.message || "Something went wrong connecting your YouTube channel.");
                }
            }
        }

        handleAuth();

        return () => {
            mounted = false;
        };
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-[#1A1A1C] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#2C2C2E] border border-white/10 rounded-2xl p-8 shadow-xl text-center">
                {status === "loading" && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-[#FF0000] animate-spin" />
                        <h2 className="text-xl font-bold text-white">Connecting YouTube...</h2>
                        <p className="text-[#A9AAAC]">Please wait while we link your channel.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Successfully Connected!</h2>
                        <p className="text-[#A9AAAC]">Your YouTube channel is now linked.</p>
                        <p className="text-sm text-[#5B5C60]">Redirecting you back...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Connection Failed</h2>
                        <p className="text-red-400 text-sm max-w-[300px] break-words">
                            {errorMsg}
                        </p>
                        <Link
                            to="/tools/social-media"
                            className="mt-4 px-6 py-2 bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF0000] rounded-lg hover:bg-[#FF0000]/20 transition-colors"
                        >
                            Return to Tools
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
