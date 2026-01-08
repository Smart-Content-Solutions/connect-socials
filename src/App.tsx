import React from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUser, SignIn, SignUp } from "@clerk/clerk-react";
import SocialAutomationApp from "./components/apps/SocialAutomationApp";

// ✅ ✅ ✅ ADD THIS IMPORT
import { SubscriptionProvider } from "./components/subscription/useSubscription";

// ✅ Layout
import Layout from "./pages/base44/Layout";

// ✅ Public Pages
import Home from "./pages/base44/Home";
import About from "./pages/base44/About";
import Services from "./pages/base44/Services";
import Packages from "./pages/base44/Packages";
import Portfolio from "./pages/base44/Portfolio";
import Contact from "./pages/base44/Contact";
import Resources from "./pages/base44/Resources";
import Blog from "./pages/base44/Blog";
import BlogPost from "./pages/base44/BlogPost";
import Account from "./pages/base44/Account";

// ✅ Platform Pages
import DashboardPreview from "./pages/base44/DashboardPreview";
import CoreTools from "./pages/base44/CoreTools";
import CorporateTools from "./pages/base44/CorporateTools";
import Pricing from "./pages/base44/Pricing";
import Tool from "./pages/base44/Tool";
import SubscriptionSuccess from "./pages/base44/SubscriptionSuccess";
import Privacy from "./pages/base44/Privacy";
import Terms from "./pages/base44/Terms";

// ✅ Plans / Stripe
import StarterPlan from "./pages/base44/StarterPlan";
import ProPlan from "./pages/base44/ProPlan";
import StripeCheckout from "./pages/base44/StripeCheckout";

// ✅ Dashboard
import LeadsTool from "./pages/base44/LeadsTool";
import SocialMediaTool from "./pages/base44/SocialMediaTool";

// ✅ OAuth
import LinkedInCallback from "./pages/linkedin/callback";
import CreatePost from "./pages/linkedin/create-post";
import FacebookCallback from "./pages/auth/FacebookCallback";
import InstagramCallback from "./pages/auth/InstagramCallback";
import TikTokCallback from "./pages/auth/TiktokCallback";

// ✅ Auth
import Login from "./pages/base44/Login";

// ✅ Other
import NotFound from "./pages/NotFound";
import WordpressAutomationApp from "./components/apps/WordpressAutomationApp";

// ✅ Admin
import AdminRoute from "./components/admin/AdminRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import PlannerApp from "./planner_section/PlannerApp";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";


// ✅ NEW: Stripe success / cancel pages
import SuccessPage from "./pages/success/Index";
import CancelPage from "./pages/cancel/Index";

const queryClient = new QueryClient();

// ✅ Protected Route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
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

      {/* ✅ ✅ ✅ THIS IS THE CRITICAL FIX */}
      <SubscriptionProvider>
        <BrowserRouter>
          <Routes>
            {/* ✅ PUBLIC MARKETING */}
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />
            <Route
              path="/home"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />
            <Route
              path="/about"
              element={
                <Layout>
                  <About />
                </Layout>
              }
            />
            <Route
              path="/services"
              element={
                <Layout>
                  <Services />
                </Layout>
              }
            />
            <Route
              path="/packages"
              element={
                <Layout>
                  <Packages />
                </Layout>
              }
            />
            <Route
              path="/portfolio"
              element={
                <Layout>
                  <Portfolio />
                </Layout>
              }
            />
            <Route
              path="/contact"
              element={
                <Layout>
                  <Contact />
                </Layout>
              }
            />
            <Route
              path="/resources"
              element={
                <Layout>
                  <Resources />
                </Layout>
              }
            />
            <Route
              path="/blog"
              element={
                <Layout>
                  <Blog />
                </Layout>
              }
            />
            <Route
              path="/blog/:slug"
              element={
                <Layout>
                  <BlogPost />
                </Layout>
              }
            />

            {/* ✅ PLATFORM ROUTES */}
            <Route
              path="/dashboard-preview"
              element={
                <Layout>
                  <DashboardPreview />
                </Layout>
              }
            />
            <Route
              path="/core-tools"
              element={
                <Layout>
                  <CoreTools />
                </Layout>
              }
            />
            <Route
              path="/corporate-tools"
              element={
                <Layout>
                  <CorporateTools />
                </Layout>
              }
            />
            <Route
              path="/pricing"
              element={
                <Layout>
                  <Pricing />
                </Layout>
              }
            />
            <Route
              path="/tool"
              element={
                <Layout>
                  <Tool />
                </Layout>
              }
            />
            <Route
              path="/subscription-success"
              element={
                <Layout>
                  <SubscriptionSuccess />
                </Layout>
              }
            />
            <Route
              path="/privacy"
              element={
                <Layout>
                  <Privacy />
                </Layout>
              }
            />
            <Route
              path="/terms"
              element={
                <Layout>
                  <Terms />
                </Layout>
              }
            />

            {/* ✅ NEW: Stripe success & cancel routes */}
            <Route
              path="/success"
              element={
                <Layout>
                  <SuccessPage />
                </Layout>
              }
            />
            <Route
              path="/cancel"
              element={
                <Layout>
                  <CancelPage />
                </Layout>
              }
            />

            {/* ✅ PLANS */}
            <Route
              path="/starter"
              element={
                <Layout>
                  <StarterPlan />
                </Layout>
              }
            />
            <Route
              path="/pro"
              element={
                <Layout>
                  <ProPlan />
                </Layout>
              }
            />
            <Route
              path="/checkout"
              element={
                <Layout>
                  <StripeCheckout />
                </Layout>
              }
            />

            {/* ✅ AUTH */}
            <Route path="/login" element={<Login />} />

            <Route
              path="/login/*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-[#0F0F10]">
                  <SignIn routing="path" path="/login" />
                </div>
              }
            />

            <Route
              path="/sign-up/*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-[#0F0F10]">
                  <SignUp routing="path" path="/sign-up" />
                </div>
              }
            />

            {/* ✅ PROTECTED DASHBOARD */}
            <Route
              path="/social-posts"
              element={
                <ProtectedRoute>
                  <SocialMediaTool />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads-calls"
              element={
                <ProtectedRoute>
                  <LeadsTool />
                </ProtectedRoute>
              }
            />

            {/* ✅ ADMIN ROUTES */}
            <Route
              path="/planner/*"
              element={
                <AdminRoute>
                  <PlannerApp />
                </AdminRoute>
              }
            />



            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            />

            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Account />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ✅ FIXED TOOL APP ROUTE */}
            <Route
              path="/apps/social-automation"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SocialAutomationApp />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/wordpress-seo"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={["early_access", "admin"]}>
                    <Layout>
                      <WordpressAutomationApp />
                    </Layout>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            {/* ✅ OAUTH */}
            <Route
              path="/linkedin/callback"
              element={
                <ProtectedRoute>
                  <LinkedInCallback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/linkedin/create-post"
              element={
                <ProtectedRoute>
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facebook/callback"
              element={<FacebookCallback />}
            />
            <Route
              path="/instagram/callback"
              element={<InstagramCallback />}
            />
            <Route path="/tiktok/callback" element={<TikTokCallback />} />

            {/* ✅ 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
