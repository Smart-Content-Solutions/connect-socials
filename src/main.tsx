import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { ClerkProvider } from "@clerk/clerk-react";

// NEW: Strict versioning for cache busting
console.log("Version: 2026-02-17-FIX-404");

// NEW: Auto-reload on chunk load failure (Self-Healing)
window.addEventListener('error', (event) => {
  // Check if the error is related to loading a resource (script/css)
  const isChunkError = event.message && (
    event.message.includes('Loading chunk') ||
    event.message.includes('Importing a module script failed') ||
    event.message.includes('Failed to fetch dynamically imported module') ||
    event.target instanceof HTMLScriptElement // catches 404 on scripts
  );

  if (isChunkError) {
    console.warn("Detected chunk load error, attempting to auto-reload...");
    if (!sessionStorage.getItem('retry-chunk-load')) {
      sessionStorage.setItem('retry-chunk-load', 'true');
      window.location.reload();
    }
  }
}, true); // Capture phase is important for resource errors

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key in .env");
}

// Always use ClerkProvider — do NOT bypass it
createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
