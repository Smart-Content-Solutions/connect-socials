import React from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

// Layout + Public Pages
import Layout from "./pages/base44/Layout";
import Home from "./pages/base44/Home";
import About from "./pages/base44/About";
import Services from "./pages/base44/Services";
import Packages from "./pages/base44/Packages";
import Portfolio from "./pages/base44/Portfolio";
import Contact from "./pages/base44/Contact";
import Resources from "./pages/base44/Resources";
import StarterPlan from "./pages/base44/StarterPlan";
import ProPlan from "./pages/base44/ProPlan";
import StripeCheckout from "./pages/base44/StripeCheckout";

// Dashboard Tools
import Dashboard from "./pages/base44/Dashboard";
import LeadsTool from "./pages/base44/LeadsTool";
import SocialMediaTool from "./pages/base44/SocialMediaTool";
import EmailCampaignTool from "./pages/base44/EmailCampaignTool";
import AnalyticsTool from "./pages/base44/AnalyticsTool";
import AccountSettings from "./pages/base44/AccountSettings";

// OAuth Callback Pages
import LinkedInCallback from "./pages/linkedin/callback";
import CreatePost from "./pages/linkedin/create-post";
import FacebookCallback from "./pages/auth/FacebookCallback";
import InstagramCallback from "./pages/auth/InstagramCallback";
import TikTokCallback from "./pages/auth/TiktokCallback";


// Auth Pages
import Login from "./pages/base44/Login";
import SignupPage from "./pages/base44/Signup";

// Other
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  return isSignedIn ? children : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>

          {/* ========================= */}
          {/* PUBLIC WEBSITE ROUTES    */}
          {/* ========================= */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/home" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/services" element={<Layout><Services /></Layout>} />
          <Route path="/packages" element={<Layout><Packages /></Layout>} />
          <Route path="/portfolio" element={<Layout><Portfolio /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/resources" element={<Layout><Resources /></Layout>} />
          <Route path="/starter" element={<Layout><StarterPlan /></Layout>} />
          <Route path="/pro" element={<Layout><ProPlan /></Layout>} />
          <Route path="/checkout" element={<Layout><StripeCheckout /></Layout>} />

          {/* ========================= */}
          {/* AUTH ROUTES (Clerk)      */}
          {/* ========================= */}

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />
          <Route path="/login/factor-one" element={<Login />} />
          <Route path="/login/factor-two" element={<Login />} />

          {/* SIGN UP */}
          <Route path="/sign-up" element={<SignupPage />} />
          <Route path="/sign-up/factor-one" element={<SignupPage />} />
          <Route path="/sign-up/factor-two" element={<SignupPage />} />

          {/* =========================== */}
          {/* DASHBOARD (PROTECTED)      */}
          {/* =========================== */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/social-posts" element={<ProtectedRoute><SocialMediaTool /></ProtectedRoute>} />
          <Route path="/email-campaigns" element={<ProtectedRoute><EmailCampaignTool /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsTool /></ProtectedRoute>} />
          <Route path="/leads-calls" element={<ProtectedRoute><LeadsTool /></ProtectedRoute>} />
          <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />

          {/* =========================== */}
          {/* OAUTH CALLBACK ROUTES      */}
          {/* =========================== */}
          <Route path="/linkedin/callback" element={<ProtectedRoute><LinkedInCallback /></ProtectedRoute>} />
          <Route path="/linkedin/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
          <Route path="/facebook/callback" element={<FacebookCallback />} />
          <Route path="/instagram/callback" element={<InstagramCallback />} />
          <Route path="/tiktok/callback" element={<TikTokCallback />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
