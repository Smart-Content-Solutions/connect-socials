import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { ClerkProvider } from "@clerk/clerk-react";
import FacebookDirectCallback from "./facebook-direct-callback";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key in .env");
}

// If user is on the Facebook callback page → do NOT use ClerkProvider
const path = window.location.pathname;

if (path.startsWith("/facebook-direct-callback")) {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <FacebookDirectCallback />
    </React.StrictMode>
  );
} else {
  // Normal app flow with Clerk
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );
}
