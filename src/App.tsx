import React from "react";

// UI Components
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";

// External Libraries
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

// Pages
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

import Dashboard from "./pages/base44/Dashboard";
import LeadsTool from "./pages/base44/LeadsTool";
import SocialMediaTool from "./pages/base44/SocialMediaTool";
import EmailCampaignTool from "./pages/base44/EmailCampaignTool";
import AnalyticsTool from "./pages/base44/AnalyticsTool";
import AccountSettings from "./pages/base44/AccountSettings";

import LinkedInCallback from "./pages/linkedin/callback";
import CreatePost from "./pages/linkedin/create-post";

import NotFound from "./pages/NotFound";

// *** FIXED Login & Signup imports ***
import Login from "./pages/Login";
import SignupPage from "./pages/SignupPage";

const queryClient = new QueryClient();

/* Protected Route */
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-semibold text-indigo-600 animate-pulse p-4 bg-white rounded-lg shadow-xl">
          Authenticating...
        </div>
      </div>
    );
  }

  return isSignedIn ? children : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>

          {/* PUBLIC PAGES */}
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

          {/* FIXED AUTH ROUTES */}
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up/*" element={<SignupPage />} />

          {/* PROTECTED DASHBOARD */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><LeadsTool /></ProtectedRoute>} />
          <Route path="/social" element={<ProtectedRoute><SocialMediaTool /></ProtectedRoute>} />
          <Route path="/email" element={<ProtectedRoute><EmailCampaignTool /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsTool /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />

          {/* LINKEDIN */}
          <Route path="/linkedin/callback" element={<ProtectedRoute><LinkedInCallback /></ProtectedRoute>} />
          <Route path="/linkedin/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />

          {/* NOT FOUND */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
