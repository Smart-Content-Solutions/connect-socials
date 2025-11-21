import { useEffect } from "react";

export default function FacebookDirectCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    // Send real Facebook code to n8n
    if (code) {
      fetch(import.meta.env.VITE_N8N_WEBHOOK_URL_FACEBOOK + "/oauth-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "facebook",
          code,
          state,
        }),
      })
        .then(() => {
          window.location.href = "/dashboard"; // redirect after success
        })
        .catch((err) => console.error("Facebook OAuth error:", err));
    }
  }, []);

  return <div>Connecting your Facebook account…</div>;
}
